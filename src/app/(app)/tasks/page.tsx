
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
import { PlusCircle, Filter, Edit2, Trash2, Loader2, ListChecks, AlertTriangle, CheckSquare, Clock, ListTodo } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
      if (err.message && err.message.includes("index")) {
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
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error eliminando tarea: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
    if (statusFilter !== ALL_FILTER_VALUE && priorityFilter !== ALL_FILTER_VALUE) {
      message += ` con estado "${statusFilter}" y prioridad "${priorityFilter}".`;
    } else if (statusFilter !== ALL_FILTER_VALUE) {
      message += ` con estado "${statusFilter}".`;
    } else if (priorityFilter !== ALL_FILTER_VALUE) {
      message += ` con prioridad "${priorityFilter}".`;
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
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" /> Filtrar por Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === ALL_FILTER_VALUE}
                onCheckedChange={() => setStatusFilter(ALL_FILTER_VALUE)}
              >
                Todas
              </DropdownMenuCheckboxItem>
              {taskStatusesForFilter.map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(statusFilter === status ? ALL_FILTER_VALUE : status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" /> Filtrar por Prioridad
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Prioridad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={priorityFilter === ALL_FILTER_VALUE}
                onCheckedChange={() => setPriorityFilter(ALL_FILTER_VALUE)}
              >
                Todas
              </DropdownMenuCheckboxItem>
              {taskPrioritiesForFilter.map(priority => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={priorityFilter === priority}
                  onCheckedChange={() => setPriorityFilter(priorityFilter === priority ? ALL_FILTER_VALUE : priority)}
                >
                  {priority}
                </DropdownMenuCheckboxItem>
              ))}
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
              {tasks.map(task => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{task.name}</TableCell>
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
                    <Button variant="ghost" size="icon" className="hover:text-primary" title="Editar Tarea" asChild>
                      <Link href={`/tasks/${task.id}/edit`}>
                        <Edit2 className="h-4 w-4 text-yellow-600" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title="Eliminar Tarea" onClick={() => setTaskToDelete(task)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!isLoading && !error && tasks.length === 0 && (
         <div className="text-center py-12 text-muted-foreground">
          {getEmptyStateIcon()}
          <p className="text-lg">{getEmptyStateMessage()}</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/tasks/add">Agrega tu primera tarea</Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
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
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar tarea"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
