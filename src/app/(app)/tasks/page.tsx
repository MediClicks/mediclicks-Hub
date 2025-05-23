
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
// import { useSearchParams, useRouter } from 'next/navigation'; // Removed useRouter
import { useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, Loader2, ListChecks, AlertTriangle, CheckSquare, Clock, ListTodo, BellRing, BellOff } from "lucide-react"; // Removed Filter, UserCircle, CalendarIconLucide, X
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
// Removed Popover and Calendar imports
import { format, isPast, isToday, isTomorrow, startOfDay } from "date-fns"; // Removed endOfDay
import { es } from "date-fns/locale";
// Removed DateRange type

import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore'; // Removed where, QueryConstraint
import type { Task, TaskStatus, TaskPriority, WithConvertedDates } from '@/types'; // Removed Client type
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

// Removed ALL_FILTER_VALUE and filter type definitions

export default function TasksPage() {
  const [tasks, setTasks] = useState<WithConvertedDates<Task>[]>([]);
  // const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]); // Clients no longer needed for filtering
  const [isLoading, setIsLoading] = useState(true);
  // const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<WithConvertedDates<Task> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // const router = useRouter(); // Not needed for now
  const searchParams = useSearchParams();
  // const dueFilterParam = searchParams.get('due'); // dueFilterParam no longer used for complex filtering
  // const showActionableParam = searchParams.get('show');

  // Removed filter states: statusFilter, priorityFilter, clientFilter, dateRangeFilter, alertStatusFilter

  // Removed fetchInitialData (which fetched clients)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasksCollection = collection(db, "tasks");
      // Simplified query, only orderBy createdAt
      const q = query(tasksCollection, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const convertedData = convertTimestampsToDates(data as Task);
        return { id: docSnap.id, ...convertedData };
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
  }, []); // Removed all filter states from dependencies

  useEffect(() => {
    // fetchInitialData(); // No longer needed
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

  // Removed clearAllFilters function

  const getEmptyStateMessage = () => {
    return "No se encontraron tareas.";
  };

  const getEmptyStateIcon = () => {
    return <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
  };

  // Removed currentFilteredClientName
  const isLoadingOverall = isLoading; // Simplified, as isLoadingClients is removed
  
  // Removed activeFiltersCount

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Removed all Filter DropdownMenus and Popover */}
          {/* Removed Clear All Filters Button */}
          <Button asChild>
            <Link href="/tasks/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nueva Tarea
            </Link>
          </Button>
        </div>
      </div>

      {isLoadingOverall && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando tareas...</p>
        </div>
      )}

      {error && !isLoadingOverall && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md whitespace-pre-wrap">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
           <Button variant="link" onClick={fetchTasks} className="mt-2">Reintentar Carga</Button>
        </div>
      )}

      {!isLoadingOverall && !error && tasks.length > 0 && (
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
                const isAlertProcessed = task.alertFired === true;
                
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
                      <Link href={`/tasks/${task.id}/edit`} className="hover:underline text-primary flex items-center gap-1.5">
                        {isTaskOverdue && <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" title="Tarea Vencida" />}
                        {isTaskDueSoon && !isTaskOverdue && <Clock className="h-4 w-4 text-amber-600 shrink-0" title="Tarea Próxima a Vencer"/>}
                        {isAlertActive && <BellRing className="h-4 w-4 text-orange-500 shrink-0" title="Alerta Activa"/>}
                        {isAlertProcessed && !isAlertActive && <BellOff className="h-4 w-4 text-slate-500 shrink-0" title="Alerta Atendida/Disparada"/>}
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
                        {isDeleting && taskToDelete?.id === task.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoadingOverall && !error && tasks.length === 0 && (
         <div className="text-center py-12 text-muted-foreground">
          {getEmptyStateIcon()}
          <p className="text-lg">{getEmptyStateMessage()}</p>
          {/* Removed condition that checked filters to show "Agrega tu primera tarea" */}
          <Button variant="link" className="mt-2" asChild>
            <Link href="/tasks/add">Agrega tu primera tarea</Link>
          </Button>
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
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar tarea"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
