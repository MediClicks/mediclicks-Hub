
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Edit2, Trash2, Loader2, ListChecks, AlertTriangle, CheckSquare, Clock, ListTodo, BellRing, BellOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, QueryConstraint } from 'firebase/firestore';
import type { Task, TaskStatus, TaskPriority, WithConvertedDates } from '@/types';
import { cn } from '@/lib/utils';
import { isPast, isToday, isTomorrow, startOfDay } from 'date-fns';

const statusColors: Record<TaskStatus, string> = {
  Pendiente: "bg-amber-500 border-amber-600 hover:bg-amber-600 text-white",
  "En Progreso": "bg-sky-500 border-sky-600 hover:bg-sky-600 text-white",
  Completada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
};

const priorityColors: Record<TaskPriority, string> = {
  Baja: "bg-slate-400 border-slate-500 hover:bg-slate-500 text-white",
  Media: "bg-orange-400 border-orange-500 hover:bg-orange-500 text-white",
  Alta: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

function convertTimestampsToDates(docData: any): WithConvertedDates<Task> {
  const data = { ...docData } as Partial<WithConvertedDates<Task>>;
  for (const key in data) {
    if (data[key as keyof Task] instanceof Timestamp) {
      data[key as keyof Task] = (data[key as keyof Task] as Timestamp).toDate() as any;
    } else if (Array.isArray(data[key as keyof Task])) {
      (data[key as keyof Task] as any) = (data[key as keyof Task] as any[]).map(item =>
        typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item) : item
      );
    } else if (typeof data[key as keyof Task] === 'object' && data[key as keyof Task] !== null && !((data[key as keyof Task]) instanceof Date)) {
      (data[key as keyof Task] as any) = convertTimestampsToDates(data[key as keyof Task] as any);
    }
  }
  return data as WithConvertedDates<Task>;
}

const ALL_FILTER_VALUE = 'All';
type StatusFilterType = TaskStatus | typeof ALL_FILTER_VALUE;
type PriorityFilterType = TaskPriority | typeof ALL_FILTER_VALUE;

const taskStatusesForFilter: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];
const taskPrioritiesForFilter: TaskPriority[] = ['Baja', 'Media', 'Alta'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<WithConvertedDates<Task>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<WithConvertedDates<Task> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(ALL_FILTER_VALUE);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterType>(ALL_FILTER_VALUE);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasksCollection = collection(db, "tasks");
      const queryConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (statusFilter !== ALL_FILTER_VALUE) {
        queryConstraints.unshift(where("status", "==", statusFilter));
      }
      if (priorityFilter !== ALL_FILTER_VALUE) {
        queryConstraints.unshift(where("priority", "==", priorityFilter));
      }

      const q = query(tasksCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = convertTimestampsToDates(data as Task);
        return { id: doc.id, ...convertedData };
      });
      setTasks(tasksData);
    } catch (err: any) {
      console.error("Error fetching tasks: ", err);
      if (err.message && (err.message.includes("index") || err.message.includes("Index"))) {
        setError(`Se requiere un índice de Firestore para esta consulta. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else {
        setError("No se pudieron cargar las tareas. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "tasks", taskToDelete.id));
      toast({
        title: "Tarea Eliminada",
        description: `La tarea "${taskToDelete.name}" ha sido eliminada correctamente.`,
      });
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete.id));
    } catch (error) {
      console.error("Error eliminando tarea: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null); 
    }
  };

  const getEmptyStateIcon = () => {
    if (statusFilter === 'Pendiente') return <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    if (statusFilter === 'En Progreso') return <ListTodo className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    if (statusFilter === 'Completada') return <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    return <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
  };

  const getEmptyStateMessage = () => {
    let message = "No se encontraron tareas";
    const filtersApplied: string[] = [];
    if (statusFilter !== ALL_FILTER_VALUE) {
      filtersApplied.push(`estado "${statusFilter}"`);
    }
    if (priorityFilter !== ALL_FILTER_VALUE) {
      filtersApplied.push(`prioridad "${priorityFilter}"`);
    }

    if (filtersApplied.length > 0) {
      message += ` con ${filtersApplied.join(' y ')}.`;
    } else {
      message += ".";
    }
    return message;
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                {statusFilter === ALL_FILTER_VALUE ? "Filtrar por Estado" : `Estado: ${statusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {taskStatusesForFilter.map(status => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                {priorityFilter === ALL_FILTER_VALUE ? "Filtrar por Prioridad" : `Prioridad: ${priorityFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Prioridad</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuRadioGroup value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {taskPrioritiesForFilter.map(priority => (
                  <DropdownMenuRadioItem key={priority} value={priority}>{priority}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link href="/tasks/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nueva Tarea
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando tareas...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md whitespace-pre-wrap">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
           <Button variant="link" onClick={fetchTasks} className="mt-2">Reintentar Carga</Button>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Tarea</TableHead>
                <TableHead>Asignada A</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => {
                const today = startOfDay(new Date());
                const taskDueDate = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;
                const isTaskOverdue = taskDueDate && isPast(taskDueDate) && task.status !== 'Completada';
                const isTaskDueSoon = taskDueDate && (isToday(taskDueDate) || isTomorrow(taskDueDate)) && task.status !== 'Completada';
                
                const alertDateExists = task.alertDate && task.alertDate instanceof Date;
                const isAlertDatePast = alertDateExists && isPast(task.alertDate as Date);
                const isAlertActive = isAlertDatePast && !task.alertFired;
                const isAlertProcessed = isAlertDatePast && task.alertFired;
                
                return (
                  <TableRow 
                    key={task.id} 
                    className={cn(
                      "hover:bg-muted/50",
                      isTaskOverdue && "bg-red-100 dark:bg-red-900/30 hover:bg-red-200/70 dark:hover:bg-red-800/50",
                      isTaskDueSoon && !isTaskOverdue && "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200/70 dark:hover:bg-amber-800/50"
                    )}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/tasks/${task.id}/edit`} className="hover:underline text-primary flex items-center gap-2">
                        {isTaskOverdue && <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" title="Tarea Vencida" />}
                        {isTaskDueSoon && !isTaskOverdue && <Clock className="h-4 w-4 text-amber-600 shrink-0" title="Tarea Próxima a Vencer"/>}
                        {isAlertActive && <BellRing className="h-4 w-4 text-orange-500 shrink-0" title="Alerta Activa"/>}
                        {isAlertProcessed && <BellOff className="h-4 w-4 text-slate-500 shrink-0" title="Alerta Procesada"/>}
                        <span>{task.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{task.assignedTo}</TableCell>
                    <TableCell>{task.clientName || 'N/A'}</TableCell>
                    <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={cn("border text-xs", priorityColors[task.priority])}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border text-xs", statusColors[task.status])}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8" title="Editar Tarea" asChild>
                        <Link href={`/tasks/${task.id}/edit`}>
                          <Edit2 className="h-4 w-4 text-yellow-600" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive h-8 w-8" 
                        title="Eliminar Tarea" 
                        onClick={() => setTaskToDelete(task)} 
                        disabled={isDeleting && taskToDelete?.id === task.id}
                      >
                        {isDeleting && taskToDelete?.id === task.id ? <Loader2 className="h-4 w-4 animate-spin text-red-600"/> : <Trash2 className="h-4 w-4 text-red-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
         <div className="text-center py-12 text-muted-foreground">
          {getEmptyStateIcon()}
          <p className="text-lg">{getEmptyStateMessage()}</p>
          {(statusFilter === ALL_FILTER_VALUE && priorityFilter === ALL_FILTER_VALUE) && (
            <Button variant="link" className="mt-2" asChild>
              <Link href="/tasks/add">Agrega tu primera tarea</Link>
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => {if(!isDeleting && !open) setTaskToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la tarea "{taskToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setTaskToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className={cn(
                "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                isDeleting && "opacity-75 cursor-not-allowed"
              )}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar tarea"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

