
'use client';

import * as React from 'react';
import Link from 'next/link';
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign, Loader2, TrendingUp, AlertTriangle, FileText, Clock, Receipt, ListChecks } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import type { Task, Invoice, WithConvertedDates, TaskStatus, InvoiceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalClients: number;
  tasksInProgress: number;
  pendingTasks: number;
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

function convertFirestoreTimestamps<T extends Record<string, any>>(data: T): WithConvertedDates<T> {
  const convertedData = { ...data } as any;
  for (const key in convertedData) {
    if (convertedData[key] instanceof Timestamp) {
      convertedData[key] = convertedData[key].toDate();
    } else if (Array.isArray(convertedData[key])) {
      convertedData[key] = convertedData[key].map((item: any) =>
        typeof item === 'object' && item !== null && !(item instanceof Date)
          ? convertFirestoreTimestamps(item)
          : item
      );
    } else if (typeof convertedData[key] === 'object' && convertedData[key] !== null && !(convertedData[key] instanceof Date) ) {
      convertedData[key] = convertFirestoreTimestamps(convertedData[key]);
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

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivityItem[]>([]);
  const [upcomingItems, setUpcomingItems] = React.useState<UpcomingItem[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = React.useState<MonthlyRevenueChartData[]>([]);
  const [taskStatusData, setTaskStatusData] = React.useState<TaskStatusChartData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();

        const clientsSnapshot = await getCountFromServer(collection(db, "clients"));
        const totalClients = clientsSnapshot.data().count;

        const tasksCollectionRef = collection(db, "tasks");
        const tasksInProgressSnapshot = await getCountFromServer(query(tasksCollectionRef, where("status", "==", "En Progreso")));
        const tasksInProgress = tasksInProgressSnapshot.data().count;
        
        const pendingTasksSnapshot = await getCountFromServer(query(tasksCollectionRef, where("status", "==", "Pendiente")));
        const pendingTasks = pendingTasksSnapshot.data().count;
        
        const completedTasksSnapshot = await getCountFromServer(query(tasksCollectionRef, where("status", "==", "Completada")));
        const completedTasks = completedTasksSnapshot.data().count;

        setTaskStatusData([
          { status: "Pendiente", count: pendingTasks, fill: chartColors.pending },
          { status: "En Progreso", count: tasksInProgress, fill: chartColors.inProgress },
          { status: "Completada", count: completedTasks, fill: chartColors.completed },
        ]);

        const invoicesCollectionRef = collection(db, "invoices");
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        
        const paidInvoicesThisMonthQuery = query(invoicesCollectionRef, 
          where("status", "==", "Pagada"),
          where("issuedDate", ">=", Timestamp.fromDate(currentMonthStart)),
          where("issuedDate", "<=", Timestamp.fromDate(currentMonthEnd))
        );
        const paidInvoicesThisMonthSnap = await getDocs(paidInvoicesThisMonthQuery);
        const revenueThisMonthAmount = paidInvoicesThisMonthSnap.docs
          .reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
        
        setStats({
          totalClients,
          tasksInProgress,
          pendingTasks,
          revenueThisMonth: revenueThisMonthAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })
        });

        const revenueByMonth: Record<string, number> = {};
        const sixMonthsAgo = startOfMonth(subMonths(now, 5)); 

        const allPaidInvoicesQuery = query(invoicesCollectionRef, 
          where("status", "==", "Pagada"),
          where("issuedDate", ">=", Timestamp.fromDate(sixMonthsAgo))
        );
        const allPaidInvoicesSnap = await getDocs(allPaidInvoicesQuery);

        allPaidInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          if (invoice.issuedDate) {
            const monthYear = format(new Date(invoice.issuedDate), 'LLL yy', { locale: es });
            revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + invoice.totalAmount;
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
        recentTasksSnap.docs.forEach(doc => {
          const task = convertFirestoreTimestamps(doc.data() as Task);
          fetchedRecentActivity.push({ 
            id: doc.id, type: 'task', name: task.name, 
            statusOrClient: task.status, date: task.createdAt!, statusType: task.status,
            href: `/tasks/${doc.id}/edit`
          });
        });
        recentInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          fetchedRecentActivity.push({ 
            id: doc.id, type: 'invoice', name: `Factura para ${invoice.clientName || 'N/A'}`, 
            statusOrClient: invoice.status, date: invoice.createdAt!, statusType: invoice.status,
            href: `/billing/${doc.id}/view`
          });
        });
        fetchedRecentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(fetchedRecentActivity.slice(0, 5));

        const upcomingCutoffDate = Timestamp.fromDate(now); 
        const upcomingTasksQuery = query(tasksCollectionRef, 
          where("status", "in", ["Pendiente", "En Progreso"]), 
          where("dueDate", ">", upcomingCutoffDate),
          orderBy("dueDate", "asc"),
          limit(3)
        );
        const upcomingInvoicesQuery = query(invoicesCollectionRef, 
          where("status", "==", "No Pagada"), 
          where("dueDate", ">", upcomingCutoffDate),
          orderBy("dueDate", "asc"),
          limit(2)
        );

        const [upcomingTasksSnap, upcomingInvoicesSnap] = await Promise.all([
          getDocs(upcomingTasksQuery),
          getDocs(upcomingInvoicesQuery)
        ]);
        
        const fetchedUpcomingItems: UpcomingItem[] = [];
        upcomingTasksSnap.docs.forEach(doc => {
          const task = convertFirestoreTimestamps(doc.data() as Task);
          fetchedUpcomingItems.push({ 
            id: doc.id, type: 'task', name: task.name, 
            dueDateFormatted: task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'N/A',
            href: `/tasks/${doc.id}/edit`
          });
        });
        upcomingInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          fetchedUpcomingItems.push({ 
            id: doc.id, type: 'invoice', 
            name: `Factura ${doc.id.substring(0,6).toUpperCase()} para ${invoice.clientName || 'N/A'}`, 
            dueDateFormatted: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A',
            href: `/billing/${doc.id}/view`
          });
        });
        fetchedUpcomingItems.sort((a, b) => {
            const dateA = a.dueDateFormatted !== 'N/A' ? new Date(a.dueDateFormatted.split('/').reverse().join('-')) : new Date(0);
            const dateB = b.dueDateFormatted !== 'N/A' ? new Date(b.dueDateFormatted.split('/').reverse().join('-')) : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });
        setUpcomingItems(fetchedUpcomingItems.slice(0,5));

      } catch (err) {
        console.error("Error fetching dashboard data: ", err);
        if (err instanceof Error && (err.message.includes("index") || err.message.includes("Index"))) {
            setError(`Se requiere un índice de Firestore. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
        } else if (err instanceof Error) {
           setError(`Error al cargar datos: ${err.message}`);
        } else {
           setError("No se pudieron cargar los datos del panel. Intenta de nuevo más tarde.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Clientes" 
          value={stats?.totalClients ?? 0} 
          icon={Users}
          description="Clientes activos gestionados"
          className="bg-card border-primary"
          href="/clients"
        />
        <SummaryCard 
          title="Tareas en Progreso" 
          value={stats?.tasksInProgress ?? 0} 
          icon={Briefcase}
          description="Tareas actualmente en desarrollo"
          className="bg-sky-600 border-sky-500"
          href="/tasks?status=En+Progreso"
        />
        <SummaryCard 
          title="Tareas Pendientes" 
          value={stats?.pendingTasks ?? 0} 
          icon={ListTodo}
          description="Tareas que requieren atención"
          className="bg-amber-600 border-amber-500"
          href="/tasks?status=Pendiente"
        />
        <SummaryCard 
          title="Ingresos Este Mes" 
          value={stats?.revenueThisMonth ?? 'Calculando...'} 
          icon={DollarSign}
          description="Basado en facturas pagadas"
          className="bg-green-600 border-green-500"
          href="/billing?status=Pagada"
        />
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
                  <li key={item.id} className="text-sm text-muted-foreground flex justify-between items-center">
                    <div>
                      <Link href={item.href} className="font-medium text-primary hover:underline">
                        {item.name}
                      </Link>
                      <span className="text-xs ml-2">({new Date(item.date).toLocaleDateString('es-ES')})</span>
                    </div>
                    {item.statusType && (
                       <Badge className={cn("text-white text-xs border", getStatusColorClass(item.statusType, item.type))}>
                         {item.statusOrClient}
                       </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
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
              {upcomingItems.map(item => (
                <li key={item.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  {item.type === 'task' ? <ListChecks className="mr-1 h-4 w-4 text-sky-500 shrink-0" /> : <Receipt className="mr-1 h-4 w-4 text-rose-500 shrink-0" />}
                  <Link href={item.href} className="font-medium text-primary hover:underline">
                    {item.name}
                  </Link>
                   - Vence el {item.dueDateFormatted}
                </li>
              ))}
            </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay vencimientos próximos.</p>
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
          <CardContent className="h-[300px] pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
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
                  <YAxis tickFormatter={(value) => `$${value/1000}k`} />
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
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
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
