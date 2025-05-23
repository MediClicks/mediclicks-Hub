
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { PlusCircle, Edit2, Trash2, Loader2, ListChecks, AlertTriangle, CheckSquare, Clock, ListTodo, Filter, X, UserCircle, CalendarIcon as CalendarIconLucide, BellRing, BellOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, isPast, isToday, isTomorrow, startOfDay, endOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, type QueryConstraint } from 'firebase/firestore';
import type { Task, TaskStatus, TaskPriority, WithConvertedDates, Client } from '@/types';
import { cn } from '@/lib/utils';
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
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof Task];
      if (value instanceof Timestamp) {
        data[key as keyof Task] = value.toDate() as any;
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
          data[key as keyof Task] = convertTimestampsToDates(value) as any; // Recursive call
      } else if (Array.isArray(value)) {
        (data[key as keyof Task] as any) = value.map(item =>
          typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item) : item
        );
      }
    }
  }
  return data as WithConvertedDates<Task>;
}


const ALL_FILTER_VALUE = "__ALL__";
type AlertStatusFilterType = typeof ALL_FILTER_VALUE | "active" | "scheduled" | "fired";


export default function TasksPage() {
  const [tasks, setTasks] = useState<WithConvertedDates<Task>[]>([]);
  const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<TaskStatus | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState<string | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [alertStatusFilter, setAlertStatusFilter] = useState<AlertStatusFilterType>(ALL_FILTER_VALUE);

  const [taskToDelete, setTaskToDelete] = useState<WithConvertedDates<Task> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  const dueFilterParam = searchParams.get('due');
  const showActionableParam = searchParams.get('show');

  const fetchInitialData = useCallback(async () => {
    setIsLoadingClients(true);
    setClientError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const qClients = query(clientsCollection, orderBy("name", "asc"));
      const clientsSnapshot = await getDocs(qClients);
      const fetchedClients = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Assuming Client type might also have Timestamps that need conversion
        const convertedData = convertTimestampsToDates(data as Client) as any; // Use a generic converter or a specific Client converter
        return { id: doc.id, ...convertedData };
      });
      setClients(fetchedClients);
    } catch (err: any) {
      console.error("Error fetching clients for filter: ", err);
      setClientError("No se pudieron cargar los clientes para el filtro.");
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasksCollection = collection(db, "tasks");
      let qConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (statusFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("status", "==", statusFilter));
      }
      if (priorityFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("priority", "==", priorityFilter));
      }
      if (clientFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("clientId", "==", clientFilter));
      }

      let localDateRangeFilter = dateRangeFilter;

      if (dueFilterParam === 'today' && !dateRangeFilter?.from && !dateRangeFilter?.to) {
        const today = new Date();
        localDateRangeFilter = { from: startOfDay(today), to: endOfDay(today) };
         if (showActionableParam === 'actionable') {
          qConstraints.push(where("status", "in", ["Pendiente", "En Progreso"]));
        }
      }
      
      if (localDateRangeFilter?.from) {
        qConstraints.push(where("dueDate", ">=", Timestamp.fromDate(startOfDay(localDateRangeFilter.from))));
      }
      if (localDateRangeFilter?.to) {
        qConstraints.push(where("dueDate", "<=", Timestamp.fromDate(endOfDay(localDateRangeFilter.to))));
      }

      if (alertStatusFilter !== ALL_FILTER_VALUE) {
        const now = Timestamp.now();
        if (alertStatusFilter === "active") {
          qConstraints.push(where("alertDate", "<=", now));
          qConstraints.push(where("alertFired", "==", false));
        } else if (alertStatusFilter === "scheduled") {
          qConstraints.push(where("alertDate", ">", now));
        } else if (alertStatusFilter === "fired") {
          qConstraints.push(where("alertFired", "==", true));
        }
      }
      
      const q = query(tasksCollection, ...qConstraints);
      
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const convertedData = convertTimestampsToDates(data as Task);
        return { id: docSnap.id, ...convertedData };
      });
      setTasks(tasksData);
    } catch (err: any) {
      console.error("Error fetching tasks: ", err);
      if (err.message && (err.message.includes("index") || err.message.includes("Index")) ) {
        setError(`Se requiere un índice de Firestore para esta consulta. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else {
        setError("No se pudieron cargar las tareas. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, clientFilter, dateRangeFilter, dueFilterParam, showActionableParam, alertStatusFilter]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isLoadingClients) { // Fetch tasks only after clients (for filter) are loaded
      fetchTasks();
    }
  }, [fetchTasks, isLoadingClients]);

  // Effect to update dateRangeFilter if 'due=today' is in URL params
  useEffect(() => {
    if (dueFilterParam === 'today') {
      const today = new Date();
      setDateRangeFilter({ from: startOfDay(today), to: endOfDay(today) });
    }
  }, [dueFilterParam]);

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRangeFilter(newRange);
    // If user manually changes date, remove 'due=today' from URL
    if (dueFilterParam === 'today') {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('due');
      router.replace(`/tasks?${newSearchParams.toString()}`, { scroll: false });
    }
  };


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

  const clearAllFilters = () => {
    setStatusFilter(ALL_FILTER_VALUE);
    setPriorityFilter(ALL_FILTER_VALUE);
    setClientFilter(ALL_FILTER_VALUE);
    setDateRangeFilter(undefined);
    setAlertStatusFilter(ALL_FILTER_VALUE);
    if (dueFilterParam || showActionableParam) {
      router.replace('/tasks', { scroll: false });
    }
  };
  
  const getEmptyStateMessage = () => {
    let message = "No se encontraron tareas";
    const activeFilters: string[] = [];
    if (statusFilter !== ALL_FILTER_VALUE) activeFilters.push(`Estado: ${statusFilter}`);
    if (priorityFilter !== ALL_FILTER_VALUE) activeFilters.push(`Prioridad: ${priorityFilter}`);
    if (clientFilter !== ALL_FILTER_VALUE) {
      const clientName = clients.find(c => c.id === clientFilter)?.name || clientFilter;
      activeFilters.push(`Cliente: ${clientName}`);
    }
    if (dateRangeFilter?.from) {
      let rangeStr = `Desde: ${format(dateRangeFilter.from, "dd/MM/yy", { locale: es })}`;
      if (dateRangeFilter.to) rangeStr += ` - Hasta: ${format(dateRangeFilter.to, "dd/MM/yy", { locale: es })}`;
      activeFilters.push(rangeStr);
    }
    if (alertStatusFilter !== ALL_FILTER_VALUE) {
        let alertText = "Alerta: ";
        if(alertStatusFilter === 'active') alertText += "Activa";
        if(alertStatusFilter === 'scheduled') alertText += "Programada";
        if(alertStatusFilter === 'fired') alertText += "Disparada";
        activeFilters.push(alertText);
    }


    if (activeFilters.length > 0) {
      return `${message} con los filtros aplicados (${activeFilters.join(', ')}).`;
    }
    if (tasks.length === 0 && !isLoading) return "No hay tareas creadas. ¡Crea la primera!";
    return message + ".";
  };

  const getEmptyStateIcon = () => {
    if (isLoading) return <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-3" />;
    if (error) return <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />;
    return <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
  };
  
  const currentFilteredClientName = useMemo(() => {
    if (clientFilter === ALL_FILTER_VALUE || isLoadingClients || clients.length === 0) return "Cliente";
    return clients.find(c => c.id === clientFilter)?.name || "Cliente";
  }, [clientFilter, clients, isLoadingClients]);


  const isLoadingOverall = isLoading || isLoadingClients;
  
  const activeFiltersCount = [
      statusFilter, 
      priorityFilter, 
      clientFilter, 
      dateRangeFilter?.from,
      alertStatusFilter
    ].filter(f => f !== ALL_FILTER_VALUE && f !== undefined).length;


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={statusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5">
                <Filter className="h-4 w-4" />
                {statusFilter === ALL_FILTER_VALUE ? "Estado" : `Estado: ${statusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | typeof ALL_FILTER_VALUE)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {(['Pendiente', 'En Progreso', 'Completada'] as TaskStatus[]).map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={priorityFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5">
                <Filter className="h-4 w-4" />
                {priorityFilter === ALL_FILTER_VALUE ? "Prioridad" : `Prioridad: ${priorityFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Prioridad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | typeof ALL_FILTER_VALUE)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {(['Baja', 'Media', 'Alta'] as TaskPriority[]).map((priority) => (
                  <DropdownMenuRadioItem key={priority} value={priority}>{priority}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant={clientFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5" disabled={isLoadingClients}>
                <UserCircle className="h-4 w-4" />
                 {isLoadingClients ? "Cargando..." : (clientFilter === ALL_FILTER_VALUE ? "Cliente" : `${currentFilteredClientName}`)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <DropdownMenuLabel>Filtrar por Cliente</DropdownMenuLabel>
              <DropdownMenuSeparator />
               {isLoadingClients ? (
                <div className="p-2 text-sm text-muted-foreground">Cargando...</div>
              ) : clientError ? (
                <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/>{clientError}</div>
              ) : (
                <DropdownMenuRadioGroup value={clientFilter} onValueChange={setClientFilter}>
                  <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos los Clientes</DropdownMenuRadioItem>
                  {clients.map((client) => (
                    <DropdownMenuRadioItem key={client.id} value={client.id}>{client.name}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={dateRangeFilter?.from ? "secondary" : "outline"}
                className={cn(
                  "w-auto justify-start text-left font-normal gap-1.5",
                  !dateRangeFilter && "text-muted-foreground"
                )}
              >
                <CalendarIconLucide className="h-4 w-4" />
                {dateRangeFilter?.from ? (
                  dateRangeFilter.to ? (
                    <>
                      {format(dateRangeFilter.from, "dd LLL, yy", { locale: es })} -{" "}
                      {format(dateRangeFilter.to, "dd LLL, yy", { locale: es })}
                    </>
                  ) : (
                    `Desde: ${format(dateRangeFilter.from, "dd LLL, yy", { locale: es })}`
                  )
                ) : (
                  <span>Rango de Fechas</span>
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
              <Button variant={alertStatusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5">
                <BellRing className="h-4 w-4" />
                {alertStatusFilter === ALL_FILTER_VALUE ? "Estado Alerta" : 
                 alertStatusFilter === "active" ? "Alerta: Activa" :
                 alertStatusFilter === "scheduled" ? "Alerta: Programada" :
                 alertStatusFilter === "fired" ? "Alerta: Disparada" : "Estado Alerta"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel>Filtrar por Estado de Alerta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={alertStatusFilter} onValueChange={(value) => setAlertStatusFilter(value as AlertStatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Alerta Activa</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="scheduled">Alerta Programada</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fired">Alerta Disparada</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground gap-1.5" title="Limpiar Todos los Filtros">
              <X className="h-4 w-4" /> Limpiar Filtros
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
          {activeFiltersCount === 0 && (
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

