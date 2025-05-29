
'use client';

import * as React from 'react';
import Link from 'next/link';
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign, Loader2, TrendingUp, AlertTriangle, FileText, Clock, Receipt, ListChecks, Package, BellRing, Bot, Save, PlusCircle, CalendarIcon as CalendarIconLucide, ListCollapse, BellOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit, getCountFromServer, addDoc, serverTimestamp, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import type { Task, Invoice, WithConvertedDates, TaskStatus, InvoiceStatus, Client, SavedConversation, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, subMonths, startOfMonth, endOfDay, isPast, isEqual, isToday, isTomorrow, startOfDay as dateFnsStartOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chatbot } from "@/components/ai-agency/chatbot";
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { updateTaskStatusAction } from '@/app/actions/taskActions';

interface DashboardStats {
  totalClients: number;
  tasksInProgress: number;
  pendingTasks: number;
  tasksForToday: number;
  revenueThisMonth: string;
}

interface RecentActivityItem {
  id: string;
  type: 'task' | 'invoice';
  name: string;
  statusOrClient: string;
  date: Date;
  statusType?: TaskStatus | InvoiceStatus;
  href: string;
}

interface UpcomingItem {
  id: string;
  name: string;
  dueDateFormatted: string;
  type: 'task' | 'invoice';
  href: string;
  alertDate?: Date | null;
  alertFired?: boolean;
  statusOrClient?: TaskStatus | InvoiceStatus;
}

interface MonthlyRevenueChartData {
  month: string;
  total: number;
}

interface TaskStatusChartData {
  status: string;
  count: number;
  fill: string;
}

function convertFirestoreTimestamps<T extends Record<string, any>>(data: T | undefined): WithConvertedDates<T> | undefined {
  if (!data) return undefined;
  const convertedData = { ...data } as any;
  for (const key in convertedData) {
    if (Object.prototype.hasOwnProperty.call(convertedData, key)) {
      const value = convertedData[key];
      if (value instanceof Timestamp) {
        convertedData[key] = value.toDate();
      } else if (Array.isArray(value)) {
        convertedData[key] = value.map((item: any) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? convertFirestoreTimestamps(item)
            : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        convertedData[key] = convertFirestoreTimestamps(value);
      }
    }
  }
  return convertedData as WithConvertedDates<T>;
}


const taskStatusColors: Record<TaskStatus, string> = {
  Pendiente: "bg-amber-500 border-amber-600 hover:bg-amber-600 text-white",
  "En Progreso": "bg-sky-500 border-sky-600 hover:bg-sky-600 text-white",
  Completada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
};

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
  "No Pagada": "bg-yellow-500 border-yellow-600 hover:bg-yellow-600 text-white",
  Vencida: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

const getStatusColorClass = (status: TaskStatus | InvoiceStatus, type: 'task' | 'invoice') => {
  if (type === 'task') {
    return taskStatusColors[status as TaskStatus] || 'bg-gray-400 border-gray-500';
  }
  return invoiceStatusColors[status as InvoiceStatus] || 'bg-gray-400 border-gray-500';
};

const chartColors = {
  revenue: "hsl(var(--chart-1))",
  pending: "hsl(var(--chart-2))",
  inProgress: "hsl(var(--chart-3))",
  completed: "hsl(var(--chart-4))",
};

const taskStatusChartConfig = {
  tasks: { label: "Tareas" },
  Pendiente: { label: "Pendiente", color: chartColors.pending },
  "En Progreso": { label: "En Progreso", color: chartColors.inProgress },
  Completada: { label: "Completada", color: chartColors.completed },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: { label: "Ingresos", color: chartColors.revenue },
} satisfies ChartConfig;

const taskPriorities: TaskPriority[] = ['Baja', 'Media', 'Alta'];

const quickTaskFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre de la tarea debe tener al menos 3 caracteres.' }),
  assignedTo: z.string().min(2, { message: 'Debe asignar la tarea a alguien.' }),
  dueDate: z.date({ required_error: 'La fecha de vencimiento es obligatoria.' }),
  priority: z.enum(taskPriorities, { required_error: 'La prioridad es obligatoria.' }),
});

type QuickTaskFormValues = z.infer<typeof quickTaskFormSchema>;

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivityItem[]>([]);
  const [upcomingItems, setUpcomingItems] = React.useState<UpcomingItem[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = React.useState<MonthlyRevenueChartData[]>([]);
  const [taskStatusData, setTaskStatusData] = React.useState<TaskStatusChartData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = React.useState(false);

  const quickTaskForm = useForm<QuickTaskFormValues>({
    resolver: zodResolver(quickTaskFormSchema),
    defaultValues: {
      name: '',
      assignedTo: '',
      priority: 'Media',
    },
  });

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date();
      const todayStart = dateFnsStartOfDay(now);
      const todayEnd = endOfDay(now);

      const clientsCollectionRef = collection(db, "clients");
      const clientsSnapshotPromise = getCountFromServer(clientsCollectionRef);

      const tasksCollectionRef = collection(db, "tasks");
      const tasksInProgressSnapshotPromise = getCountFromServer(query(tasksCollectionRef, where("status", "==", "En Progreso")));
      const pendingTasksSnapshotPromise = getCountFromServer(query(tasksCollectionRef, where("status", "==", "Pendiente")));
      const completedTasksSnapshotPromise = getCountFromServer(query(tasksCollectionRef, where("status", "==", "Completada")));
      
      const tasksForTodayQuery = query(tasksCollectionRef, 
        where("dueDate", ">=", Timestamp.fromDate(todayStart)),
        where("dueDate", "<=", Timestamp.fromDate(todayEnd)),
        where("status", "in", ["Pendiente", "En Progreso"])
      );
      const tasksForTodaySnapPromise = getCountFromServer(tasksForTodayQuery);

      const invoicesCollectionRef = collection(db, "invoices");
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      
      const paidInvoicesThisMonthQuery = query(invoicesCollectionRef, 
        where("status", "==", "Pagada"),
        where("issuedDate", ">=", Timestamp.fromDate(currentMonthStart)),
        where("issuedDate", "<=", Timestamp.fromDate(currentMonthEnd))
      );
      const paidInvoicesThisMonthSnapPromise = getDocs(paidInvoicesThisMonthQuery);
      
      const [
        clientsSnapshot, 
        tasksInProgressSnapshot, 
        pendingTasksSnapshot, 
        completedTasksSnapshot, 
        tasksForTodaySnap, 
        paidInvoicesThisMonthSnap
      ] = await Promise.all([
        clientsSnapshotPromise,
        tasksInProgressSnapshotPromise,
        pendingTasksSnapshotPromise,
        completedTasksSnapshotPromise,
        tasksForTodaySnapPromise,
        paidInvoicesThisMonthSnapPromise
      ]);

      const totalClients = clientsSnapshot.data().count;
      const tasksInProgress = tasksInProgressSnapshot.data().count;
      const pendingTasks = pendingTasksSnapshot.data().count;
      const completedTasks = completedTasksSnapshot.data().count;
      const tasksForToday = tasksForTodaySnap.data().count;

      setTaskStatusData([
        { status: "Pendiente", count: pendingTasks, fill: chartColors.pending },
        { status: "En Progreso", count: tasksInProgress, fill: chartColors.inProgress },
        { status: "Completada", count: completedTasks, fill: chartColors.completed },
      ]);
      
      const revenueThisMonthAmount = paidInvoicesThisMonthSnap.docs
        .reduce((sum, doc) => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          return sum + (invoice?.totalAmount || 0);
        }, 0);
      
      setStats({
        totalClients,
        tasksInProgress,
        pendingTasks,
        tasksForToday,
        revenueThisMonth: revenueThisMonthAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })
      });

      const revenueByMonth: Record<string, number> = {};
      const sixMonthsAgo = startOfMonth(subMonths(now, 5)); 

      const allPaidInvoicesQuery = query(invoicesCollectionRef, 
        where("status", "==", "Pagada"),
        where("issuedDate", ">=", Timestamp.fromDate(sixMonthsAgo))
      );
      const allPaidInvoicesSnap = await getDocs(allPaidInvoicesQuery);

      allPaidInvoicesSnap.docs.forEach(docSnap => {
        const invoiceData = docSnap.data() as Invoice;
        const invoice = convertFirestoreTimestamps(invoiceData);
        if (invoice?.issuedDate) {
          const monthYear = format(new Date(invoice.issuedDate), 'LLL yy', { locale: es });
          revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + (invoice.totalAmount || 0);
        }
      });
      
      const formattedRevenueData: MonthlyRevenueChartData[] = [];
      for (let i = 5; i >= 0; i--) {
        const dateCursor = subMonths(now, i);
        const monthYearKey = format(dateCursor, 'LLL yy', { locale: es });
        formattedRevenueData.push({
          month: monthYearKey.charAt(0).toUpperCase() + monthYearKey.slice(1), 
          total: revenueByMonth[monthYearKey] || 0,
        });
      }
      setMonthlyRevenueData(formattedRevenueData);

      const recentTasksQuery = query(tasksCollectionRef, orderBy("createdAt", "desc"), limit(3));
      const recentInvoicesQuery = query(invoicesCollectionRef, orderBy("createdAt", "desc"), limit(2));
      
      const [recentTasksSnap, recentInvoicesSnap] = await Promise.all([
        getDocs(recentTasksQuery),
        getDocs(recentInvoicesQuery)
      ]);

      const fetchedRecentActivity: RecentActivityItem[] = [];
      recentTasksSnap.docs.forEach(docSnap => {
        const task = convertFirestoreTimestamps(docSnap.data() as Task);
        if (task && task.createdAt) {
          fetchedRecentActivity.push({ 
            id: docSnap.id, type: 'task', name: task.name || "Tarea sin nombre", 
            statusOrClient: task.status, date: new Date(task.createdAt), statusType: task.status,
            href: `/tasks/${docSnap.id}/edit`
          });
        }
      });
      recentInvoicesSnap.docs.forEach(docSnap => {
        const invoice = convertFirestoreTimestamps(docSnap.data() as Invoice);
        if (invoice && invoice.createdAt) {
          fetchedRecentActivity.push({ 
            id: docSnap.id, type: 'invoice', name: `Factura ${docSnap.id.substring(0,6).toUpperCase()} para ${invoice.clientName || 'N/A'}`, 
            statusOrClient: invoice.status, date: new Date(invoice.createdAt), statusType: invoice.status,
            href: `/billing/${docSnap.id}/view`
          });
        }
      });
      fetchedRecentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(fetchedRecentActivity.slice(0, 5));

      const upcomingCutoffDate = dateFnsStartOfDay(now); 
      const upcomingTasksQuery = query(tasksCollectionRef, 
        where("status", "in", ["Pendiente", "En Progreso"]), 
        where("dueDate", ">=", Timestamp.fromDate(upcomingCutoffDate)), 
        orderBy("dueDate", "asc"),
        limit(3)
      );
      const upcomingInvoicesQuery = query(invoicesCollectionRef, 
        where("status", "==", "No Pagada"), 
        where("dueDate", ">=", Timestamp.fromDate(upcomingCutoffDate)), 
        orderBy("dueDate", "asc"),
        limit(2)
      );

      const [upcomingTasksSnap, upcomingInvoicesSnap] = await Promise.all([
        getDocs(upcomingTasksQuery),
        getDocs(upcomingInvoicesQuery)
      ]);
      
      const fetchedUpcomingItems: UpcomingItem[] = [];
      upcomingTasksSnap.docs.forEach(docSnap => {
        const task = convertFirestoreTimestamps(docSnap.data() as Task);
        if (task && task.dueDate) {
          let taskDisplayName = task.name || "Tarea sin nombre";
          if (task.clientName) {
            taskDisplayName += ` (Cliente: ${task.clientName})`;
          }
          fetchedUpcomingItems.push({ 
            id: docSnap.id, type: 'task', name: taskDisplayName, 
            dueDateFormatted: new Date(task.dueDate).toLocaleDateString('es-ES'),
            alertDate: task.alertDate instanceof Date ? task.alertDate : null,
            alertFired: task.alertFired,
            statusOrClient: task.status,
            href: `/tasks/${docSnap.id}/edit`
          });
        }
      });
      upcomingInvoicesSnap.docs.forEach(docSnap => {
        const invoice = convertFirestoreTimestamps(docSnap.data() as Invoice);
        if (invoice && invoice.dueDate) {
          fetchedUpcomingItems.push({ 
            id: docSnap.id, type: 'invoice', 
            name: `Factura ${docSnap.id.substring(0,6).toUpperCase()} para ${invoice.clientName || 'N/A'}`, 
            dueDateFormatted: new Date(invoice.dueDate).toLocaleDateString('es-ES'),
            href: `/billing/${docSnap.id}/view`
          });
        }
      });
      fetchedUpcomingItems.sort((a, b) => {
          const dateAStr = a.dueDateFormatted.split('/').reverse().join('-');
          const dateBStr = b.dueDateFormatted.split('/').reverse().join('-');
          const dateA = new Date(dateAStr).getTime();
          const dateB = new Date(dateBStr).getTime();
          return dateA - dateB;
      });
      setUpcomingItems(fetchedUpcomingItems.slice(0,5));

    } catch (err) {
      console.error("Error fetching dashboard data: ", err);
      if (err instanceof Error && (err.message.includes("index") || err.message.includes("Index"))) {
          setError(`Se requiere un índice de Firestore para cargar los datos del panel. Por favor, créalo usando el enlace que aparece en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else if (err instanceof Error) {
         setError(`Error al cargar datos del panel: ${err.message}`);
      } else {
         setError("No se pudieron cargar los datos del panel. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);


  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onSubmitQuickTask = async (data: QuickTaskFormValues) => {
    try {
      const taskData = {
        ...data,
        status: 'Pendiente' as TaskStatus,
        dueDate: Timestamp.fromDate(data.dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'tasks'), taskData);
      toast({
        title: "Tarea Rápida Agregada",
        description: `La tarea "${data.name}" ha sido creada.`,
      });
      quickTaskForm.reset();
      setIsQuickTaskDialogOpen(false);
      fetchDashboardData(); 
    } catch (e) {
      console.error("Error agregando tarea rápida: ", e);
      toast({
        title: "Error al Crear Tarea",
        description: "Hubo un problema al guardar la tarea rápida.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatusAction(taskId, newStatus);
      toast({
        title: "Estado de Tarea Actualizado",
        description: `La tarea ha sido marcada como "${newStatus}".`,
      });
      fetchDashboardData(); 
    } catch (error) {
      console.error("Error updating task status from dashboard:", error);
      toast({
        title: "Error al Actualizar Estado",
        description: "No se pudo actualizar el estado de la tarea.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando panel principal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md">
        <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-destructive" />
        <p className="text-lg font-semibold">Error al Cargar el Panel</p>
        <p className="text-sm whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  const noRevenueData = monthlyRevenueData.length === 0 || monthlyRevenueData.every(d => d.total === 0);
  const noTaskStatusData = taskStatusData.length === 0 || taskStatusData.every(d => d.count === 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <Dialog open={isQuickTaskDialogOpen} onOpenChange={setIsQuickTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Tarea Rápida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Tarea Rápida</DialogTitle>
              <DialogDescription>
                Ingresa los detalles básicos de la tarea. Puedes añadir más información después.
              </DialogDescription>
            </DialogHeader>
            <Form {...quickTaskForm}>
              <form onSubmit={quickTaskForm.handleSubmit(onSubmitQuickTask)} className="space-y-4 py-2">
                <FormField
                  control={quickTaskForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Tarea</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Llamar a Cliente X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={quickTaskForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignada A</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Tu Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={quickTaskForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taskPriorities.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={quickTaskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                              <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline" disabled={quickTaskForm.formState.isSubmitting}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={quickTaskForm.formState.isSubmitting}>
                    {quickTaskForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {quickTaskForm.formState.isSubmitting ? "Guardando..." : "Guardar Tarea"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard 
          title="Total Clientes" 
          value={stats?.totalClients ?? 0} 
          icon={Users}
          description="Clientes activos gestionados"
          className="border-primary"
          href="/clients"
        />
        <SummaryCard 
          title="Tareas en Progreso" 
          value={stats?.tasksInProgress ?? 0} 
          icon={Briefcase}
          description="Tareas actualmente en desarrollo"
          className="border-sky-500"
          href="/tasks?status=En+Progreso"
        />
        <SummaryCard 
          title="Tareas Pendientes" 
          value={stats?.pendingTasks ?? 0} 
          icon={ListTodo}
          description="Tareas que requieren atención"
          className="border-amber-500"
          href="/tasks?status=Pendiente"
        />
         <SummaryCard 
          title="Tareas para Hoy" 
          value={stats?.tasksForToday ?? 0} 
          icon={ListChecks}
          description="Tareas no completadas que vencen hoy"
          className="border-teal-500"
          href="/tasks?due=today&show=actionable"
        />
        <SummaryCard 
          title="Ingresos Este Mes" 
          value={stats?.revenueThisMonth ?? 'Calculando...'} 
          icon={DollarSign}
          description="Basado en facturas pagadas"
          className="border-green-500"
          href="/billing?status=Pagada"
        />
      </div>

       <div className="grid grid-cols-1 gap-6"> {/* Chatbot will take full width */}
        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Bot className="mr-2 h-7 w-7 text-primary" /> 
              Il Dottore
            </CardTitle>
            <CardDescription>
              Tu asistente IA personal. Haz preguntas, pide resúmenes o envía imágenes para análisis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-1 md:p-2">
            <Chatbot />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-l-4 border-primary">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Resumen de las últimas tareas y facturas creadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {recentActivity.map(item => (
                  <li key={item.id} className="text-sm text-muted-foreground flex justify-between items-center hover:bg-muted/50 p-2 rounded-md transition-colors">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        {item.type === 'task' ? <ListChecks className="inline-block h-5 w-5 text-sky-600 shrink-0" /> : <Receipt className="inline-block h-5 w-5 text-rose-600 shrink-0" />}
                        <Link href={item.href} className="font-medium text-primary hover:underline truncate block" title={item.name}>
                            {item.name}
                        </Link>
                        <span className="text-xs ml-1">({new Date(item.date).toLocaleDateString('es-ES')})</span>
                    </div>
                    {item.statusType && (
                       <Badge className={cn("text-white text-xs border ml-2 shrink-0", getStatusColorClass(item.statusType, item.type))}>
                         {item.statusOrClient}
                       </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-accent">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Clock className="mr-2 h-5 w-5 text-accent" />
              Próximos Vencimientos
            </CardTitle>
            <CardDescription>Tareas y facturas con vencimiento próximo.</CardDescription>
          </CardHeader>
          <CardContent>
           {upcomingItems.length > 0 ? (
            <ul className="space-y-3">
              {upcomingItems.map(item => {
                const isAlertActive = item.type === 'task' && item.alertDate && isPast(new Date(item.alertDate)) && !item.alertFired;
                return (
                  <li key={item.id} className="text-sm text-muted-foreground flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md transition-colors group">
                    {item.type === 'task' ? <ListChecks className="h-5 w-5 text-sky-600 shrink-0" /> : <Receipt className="h-5 w-5 text-rose-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <Link href={item.href} className="font-medium text-primary hover:underline truncate block" title={item.name}>
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">Vence: {item.dueDateFormatted}</span>
                        {isAlertActive && <BellRing className="h-3 w-3 text-orange-500 shrink-0" title="Alerta Activa"/>}
                        {item.type === 'task' && item.alertFired && item.alertDate && isPast(new Date(item.alertDate)) && <BellOff className="h-3 w-3 text-slate-400 shrink-0" title="Alerta Atendida"/>}
                      </div>
                    </div>
                    {item.type === 'task' && item.statusOrClient && item.statusOrClient !== 'Completada' && (
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 px-1.5">...</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(item.statusOrClient === 'Pendiente') && 
                            <DropdownMenuItem onClick={() => handleUpdateTaskStatus(item.id, 'En Progreso')}>Marcar En Progreso</DropdownMenuItem>
                          }
                          {(item.statusOrClient === 'Pendiente' || item.statusOrClient === 'En Progreso') &&
                            <DropdownMenuItem onClick={() => handleUpdateTaskStatus(item.id, 'Completada')}>Marcar Completada</DropdownMenuItem>
                          }
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                );
              })}
            </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay vencimientos próximos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Ingresos Últimos 6 Meses
            </CardTitle>
            <CardDescription>Total de facturas pagadas por mes.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : noRevenueData ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-3 text-gray-400" />
                <p>No hay datos de ingresos para mostrar.</p>
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={monthlyRevenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis tickFormatter={(value) => `$${Number(value/1000).toFixed(0)}k`} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar dataKey="total" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              Distribución de Tareas por Estado
            </CardTitle>
            <CardDescription>Proporción de tareas por estado actual.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-4">
             {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             ) : noTaskStatusData ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ListTodo className="h-12 w-12 mb-3 text-gray-400" />
                <p>No hay datos de tareas para mostrar.</p>
              </div>
            ) : (
              <ChartContainer config={taskStatusChartConfig} className="w-full h-[250px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                  <Pie data={taskStatusData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={5}>
                  </Pie>
                   <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

