
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
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
import { PlusCircle, Filter, Edit2, Trash2, Loader2, ListChecks, AlertTriangle, CheckSquare, Clock, ListTodo, BellRing, BellOff, UserCircle, Calendar as CalendarIconLucide, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, isToday, isTomorrow, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, QueryConstraint } from 'firebase/firestore';
import type { Task, TaskStatus, TaskPriority, WithConvertedDates, Client } from '@/types';
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

function convertClientTimestamps(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (data[key as keyof Client] instanceof Timestamp) {
      data[key as keyof Client] = (data[key as keyof Client] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Client>;
}


const ALL_FILTER_VALUE = 'All';
type StatusFilterType = TaskStatus | typeof ALL_FILTER_VALUE;
type PriorityFilterType = TaskPriority | typeof ALL_FILTER_VALUE;
type ClientFilterType = string | typeof ALL_FILTER_VALUE;
type AlertStatusFilterType = 'Activa' | 'Programada' | 'Disparada' | typeof ALL_FILTER_VALUE;


const taskStatusesForFilter: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];
const taskPrioritiesForFilter: TaskPriority[] = ['Baja', 'Media', 'Alta'];
const alertStatusesForFilter: AlertStatusFilterType[] = ['Activa', 'Programada', 'Disparada'];


export default function TasksPage() {
  const [tasks, setTasks] = useState<WithConvertedDates<Task>[]>([]);
  const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<WithConvertedDates<Task> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  const dueFilterParam = searchParams.get('due');
  const showActionableParam = searchParams.get('show');


  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(ALL_FILTER_VALUE);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterType>(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState<ClientFilterType>(ALL_FILTER_VALUE);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [alertStatusFilter, setAlertStatusFilter] = useState<AlertStatusFilterType>(ALL_FILTER_VALUE);

  useEffect(() => {
    const currentUrlParams = new URLSearchParams(searchParams.toString());
    const dueParam = currentUrlParams.get('due');

    if (dueParam === 'today') {
      setDateRangeFilter({ from: startOfDay(new Date()), to: endOfDay(new Date()) });
    }
  }, [searchParams]);


  const fetchInitialData = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const clientsCollection = collection(db, "clients");
      const clientsQuery = query(clientsCollection, orderBy("name", "asc"));
      const clientsSnapshot = await getDocs(clientsQuery);
      const fetchedClients = clientsSnapshot.docs.map(doc => {
        const data = convertClientTimestamps(doc.data() as Client);
        return { id: doc.id, ...data };
      });
      setClients(fetchedClients);
    } catch (err) {
      console.error("Error fetching clients: ", err);
      toast({ title: "Advertencia", description: "No se pudieron cargar los clientes para el filtro.", variant: "default" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasksCollection = collection(db, "tasks");
      const queryConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (statusFilter !== ALL_FILTER_VALUE) {
        queryConstraints.push(where("status", "==", statusFilter));
      }
      if (priorityFilter !== ALL_FILTER_VALUE) {
        queryConstraints.push(where("priority", "==", priorityFilter));
      }
      if (clientFilter !== ALL_FILTER_VALUE) {
        queryConstraints.push(where("clientId", "==", clientFilter));
      }
      
      let effectiveDateRange = dateRangeFilter;
      const currentUrlParams = new URLSearchParams(searchParams.toString());
      const currentDueParam = currentUrlParams.get('due');
      const currentShowActionableParam = currentUrlParams.get('show');

      if (currentDueParam === 'today' && !dateRangeFilter?.from && !dateRangeFilter?.to) { 
        effectiveDateRange = { from: startOfDay(new Date()), to: endOfDay(new Date()) };
      }

      if (effectiveDateRange?.from) {
        queryConstraints.push(where("dueDate", ">=", Timestamp.fromDate(startOfDay(effectiveDateRange.from))));
      }
      if (effectiveDateRange?.to) {
        queryConstraints.push(where("dueDate", "<=", Timestamp.fromDate(endOfDay(effectiveDateRange.to))));
      }
      
      if (currentDueParam === 'today' && currentShowActionableParam === 'actionable') {
        // Remove existing status filter if 'All' was selected but we only want actionable
        const statusFilterIndex = queryConstraints.findIndex(
            (c: any) => c._fieldPath?.segments?.join('/') === 'status' && c._op === '==' && statusFilter === ALL_FILTER_VALUE
        );
        if (statusFilterIndex > -1) {
          queryConstraints.splice(statusFilterIndex, 1);
        }
        // Add/ensure the actionable status filter if not already applied by user interaction
        if (statusFilter === ALL_FILTER_VALUE) {
            queryConstraints.push(where("status", "in", ["Pendiente", "En Progreso"]));
        }
      }


      const now = Timestamp.now();
      if (alertStatusFilter === 'Activa') {
        queryConstraints.push(where("alertDate", "<=", now));
        queryConstraints.push(where("alertFired", "==", false));
      } else if (alertStatusFilter === 'Programada') {
        queryConstraints.push(where("alertDate", ">", now));
      } else if (alertStatusFilter === 'Disparada') {
        queryConstraints.push(where("alertFired", "==", true));
      }


      const q = query(tasksCollection, ...queryConstraints);
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
  }, [statusFilter, priorityFilter, clientFilter, dateRangeFilter, alertStatusFilter, searchParams, toast]); 

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isLoadingClients) { 
        fetchTasks();
    }
  }, [fetchTasks, isLoadingClients]);


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

  const clearAllFilters = () => {
    setStatusFilter(ALL_FILTER_VALUE);
    setPriorityFilter(ALL_FILTER_VALUE);
    setClientFilter(ALL_FILTER_VALUE);
    setDateRangeFilter(undefined);
    setAlertStatusFilter(ALL_FILTER_VALUE);
    
    const currentUrlParams = new URLSearchParams(searchParams.toString());
    if (currentUrlParams.has('due') || currentUrlParams.has('show')) {
        currentUrlParams.delete('due');
        currentUrlParams.delete('show');
        router.replace(`/tasks${currentUrlParams.toString() ? '?' + currentUrlParams.toString() : ''}`, { scroll: false });
    }
  };
  
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRangeFilter(newRange);
    const currentUrlParams = new URLSearchParams(searchParams.toString());
    if (currentUrlParams.has('due') || currentUrlParams.has('show')) {
        currentUrlParams.delete('due');
        currentUrlParams.delete('show');
        router.replace(`/tasks${currentUrlParams.toString() ? '?' + currentUrlParams.toString() : ''}`, { scroll: false });
    }
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
    const clientName = clientFilter !== ALL_FILTER_VALUE ? clients.find(c => c.id === clientFilter)?.name : null;
    if (clientFilter !== ALL_FILTER_VALUE && clientName) {
      filtersApplied.push(`cliente "${clientName}"`);
    }
    
    let currentEffectiveDateRange = dateRangeFilter;
    const currentUrlParams = new URLSearchParams(searchParams.toString());
    const currentDueParam = currentUrlParams.get('due');

    if (currentDueParam === 'today' && !dateRangeFilter?.from && !dateRangeFilter?.to) {
        currentEffectiveDateRange = { from: startOfDay(new Date()), to: endOfDay(new Date()) };
    }

    if (currentEffectiveDateRange?.from || currentEffectiveDateRange?.to) {
      let rangeStr = "vencimiento ";
      if (currentEffectiveDateRange.from && isToday(currentEffectiveDateRange.from) && currentEffectiveDateRange.to && isToday(currentEffectiveDateRange.to)) {
        rangeStr += "hoy";
      } else {
        if (currentEffectiveDateRange.from) rangeStr += `desde ${format(currentEffectiveDateRange.from, "dd/MM/yy", { locale: es })}`;
        if (currentEffectiveDateRange.to) rangeStr += ` ${currentEffectiveDateRange.from ? 'hasta' : 'hasta'} ${format(currentEffectiveDateRange.to, "dd/MM/yy", { locale: es })}`;
      }
      filtersApplied.push(rangeStr.trim());
    }
    if (alertStatusFilter !== ALL_FILTER_VALUE) {
      filtersApplied.push(`alerta "${alertStatusFilter}"`);
    }
    
    const currentShowActionableParam = currentUrlParams.get('show');
    if (currentShowActionableParam === 'actionable' && currentDueParam === 'today') {
        filtersApplied.push("no completadas");
    }


    if (filtersApplied.length > 0) {
      message += ` con ${filtersApplied.join(', ')}.`;
    } else {
      message += ".";
    }
    return message;
  };

  const getEmptyStateIcon = () => {
    if (statusFilter === 'Pendiente') return <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    if (statusFilter === 'En Progreso') return <ListTodo className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    if (statusFilter === 'Completada') return <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    return <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
  };

  const currentFilteredClientName = clientFilter !== ALL_FILTER_VALUE
    ? clients.find(c => c.id === clientFilter)?.name
    : null;

  const isLoadingOverall = isLoading || isLoadingClients;
  
  const activeFiltersCount = [
    statusFilter !== ALL_FILTER_VALUE,
    priorityFilter !== ALL_FILTER_VALUE,
    clientFilter !== ALL_FILTER_VALUE,
    dateRangeFilter !== undefined,
    alertStatusFilter !== ALL_FILTER_VALUE,
    (searchParams.get('due') === 'today') 
  ].filter(Boolean).length;


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={statusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"}>
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
              <Button variant={priorityFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"}>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={clientFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} disabled={isLoadingClients}>
                <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                {isLoadingClients && "Cargando clientes..."}
                {!isLoadingClients && (currentFilteredClientName ? `Cliente: ${currentFilteredClientName}` : "Filtrar por Cliente")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Seleccionar Cliente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={clientFilter} onValueChange={(value) => setClientFilter(value as ClientFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos los Clientes</DropdownMenuRadioItem>
                {clients.map(client => (
                  <DropdownMenuRadioItem key={client.id} value={client.id}>{client.name}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={dateRangeFilter ? "secondary" : "outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRangeFilter && "text-muted-foreground"
                )}
              >
                <CalendarIconLucide className="mr-2 h-4 w-4 text-muted-foreground" />
                {dateRangeFilter?.from ? (
                  dateRangeFilter.to ? (
                    <>
                      {format(dateRangeFilter.from, "dd/MM/yy", { locale: es })} -{" "}
                      {format(dateRangeFilter.to, "dd/MM/yy", { locale: es })}
                    </>
                  ) : (
                     `Desde: ${format(dateRangeFilter.from, "dd/MM/yy", { locale: es })}`
                  )
                ) : (
                  dateRangeFilter?.to ? `Hasta: ${format(dateRangeFilter.to, "dd/MM/yy", { locale: es })}` : "Vencimiento"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRangeFilter?.from}
                selected={dateRangeFilter}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>

           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={alertStatusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"}>
                <BellRing className="mr-2 h-4 w-4 text-muted-foreground" />
                {alertStatusFilter === ALL_FILTER_VALUE ? "Estado Alerta" : `Alerta: ${alertStatusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Estado de Alerta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={alertStatusFilter} onValueChange={(value) => setAlertStatusFilter(value as AlertStatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {alertStatusesForFilter.map(status => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {activeFiltersCount > 0 && (
             <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive hover:text-destructive/80" title="Limpiar Todos los Filtros">
                <X className="mr-1 h-4 w-4" /> Limpiar Filtros ({activeFiltersCount})
             </Button>
          )}

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
                        {isDeleting && taskToDelete?.id === task.id ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4 text-red-600" />}
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
          {(statusFilter === ALL_FILTER_VALUE && priorityFilter === ALL_FILTER_VALUE && clientFilter === ALL_FILTER_VALUE && !dateRangeFilter && alertStatusFilter === ALL_FILTER_VALUE && searchParams.get('due') !== 'today') && (
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

    
