
'use client';

import * as React from 'react';
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import type { Task, Invoice, WithConvertedDates } from '@/types';

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
  statusOrClient: string; // Status for tasks, ClientName for invoices
  date: Date;
}

interface UpcomingItem {
  id: string;
  name: string; // Task name or Invoice ID + Client
  dueDateFormatted: string;
  type: 'task' | 'invoice';
}

// Helper function to convert Firestore Timestamps in fetched data
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


export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivityItem[]>([]);
  const [upcomingItems, setUpcomingItems] = React.useState<UpcomingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Clients Count
        const clientsSnapshot = await getCountFromServer(collection(db, "clients"));
        const totalClients = clientsSnapshot.data().count;

        // Fetch Tasks for counts
        const tasksCollection = collection(db, "tasks");
        const tasksInProgressSnapshot = await getCountFromServer(query(tasksCollection, where("status", "==", "En Progreso")));
        const tasksInProgress = tasksInProgressSnapshot.data().count;
        
        const pendingTasksSnapshot = await getCountFromServer(query(tasksCollection, where("status", "==", "Pendiente")));
        const pendingTasks = pendingTasksSnapshot.data().count;

        // Fetch Invoices for revenue
        const now = new Date(); // Client-side new Date()
        let revenue = 0;
        let firstDayOfMonth: Date | null = null;
        let lastDayOfMonth: Date | null = null;

        // Ensure date calculations happen client-side to avoid hydration mismatch
        firstDayOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        lastDayOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

        const invoicesCollection = collection(db, "invoices");
        const paidInvoicesQuery = query(invoicesCollection, 
          where("status", "==", "Pagada"),
          where("issuedDate", ">=", Timestamp.fromDate(firstDayOfMonth)),
          where("issuedDate", "<=", Timestamp.fromDate(lastDayOfMonth))
        );
        const paidInvoicesSnapshot = await getDocs(paidInvoicesQuery);
        revenue = paidInvoicesSnapshot.docs
          .reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
        
        setStats({
          totalClients,
          tasksInProgress,
          pendingTasks,
          revenueThisMonth: revenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })
        });

        // Fetch Recent Activity (last 3 tasks and last 2 invoices)
        const recentTasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"), limit(3));
        const recentInvoicesQuery = query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(2));
        
        const [recentTasksSnap, recentInvoicesSnap] = await Promise.all([
          getDocs(recentTasksQuery),
          getDocs(recentInvoicesQuery)
        ]);

        const fetchedRecentActivity: RecentActivityItem[] = [];
        recentTasksSnap.docs.forEach(doc => {
          const task = convertFirestoreTimestamps(doc.data() as Task);
          fetchedRecentActivity.push({ id: doc.id, type: 'task', name: task.name, statusOrClient: task.status, date: task.createdAt! });
        });
        recentInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          fetchedRecentActivity.push({ id: doc.id, type: 'invoice', name: `Factura para ${invoice.clientName || 'N/A'}`, statusOrClient: invoice.status, date: invoice.createdAt! });
        });
        fetchedRecentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(fetchedRecentActivity.slice(0, 5));


        // Fetch Upcoming Items (tasks not completed, invoices not paid, due in future)
        const upcomingCutoffDate = Timestamp.fromDate(now); // Use client-side now

        const upcomingTasksQuery = query(collection(db, "tasks"), 
          where("status", "in", ["Pendiente", "En Progreso"]), // Changed from "!=" to "in"
          where("dueDate", ">", upcomingCutoffDate),
          orderBy("dueDate", "asc"),
          limit(3)
        );
        const upcomingInvoicesQuery = query(collection(db, "invoices"), 
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
            id: doc.id, 
            type: 'task', 
            name: task.name, 
            dueDateFormatted: task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'N/A'
          });
        });
        upcomingInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          fetchedUpcomingItems.push({ 
            id: doc.id, 
            type: 'invoice', 
            name: `Factura ${doc.id.substring(0,6).toUpperCase()} para ${invoice.clientName || 'N/A'}`, 
            dueDateFormatted: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'
          });
        });
        fetchedUpcomingItems.sort((a, b) => {
            const dateA = new Date(a.dueDateFormatted.split('/').reverse().join('-'));
            const dateB = new Date(b.dueDateFormatted.split('/').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
        });
        setUpcomingItems(fetchedUpcomingItems.slice(0,5));

      } catch (err) {
        console.error("Error fetching dashboard data: ", err);
        setError("No se pudieron cargar los datos del panel. Intenta de nuevo más tarde.");
        if (err instanceof Error && err.message.includes("indexes?create_composite")) {
            setError(`Se requiere un índice de Firestore. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
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
        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error al Cargar el Panel</p>
        <p className="text-sm whitespace-pre-wrap">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Clientes" 
          value={stats?.totalClients ?? 0} 
          icon={Users}
          description="Clientes activos gestionados"
        />
        <SummaryCard 
          title="Tareas en Progreso" 
          value={stats?.tasksInProgress ?? 0} 
          icon={Briefcase}
          description="Tareas actualmente en desarrollo"
        />
        <SummaryCard 
          title="Tareas Pendientes" 
          value={stats?.pendingTasks ?? 0} 
          icon={ListTodo}
          description="Tareas que requieren atención"
        />
        <SummaryCard 
          title="Ingresos Este Mes" 
          value={stats?.revenueThisMonth ?? 'Calculando...'} 
          icon={DollarSign}
          description="Basado en facturas pagadas"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Actividad Reciente</CardTitle>
            <CardDescription>Resumen de las últimas tareas y facturas creadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {recentActivity.map(item => (
                  <li key={item.id} className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{item.name}</span> - {item.statusOrClient}
                    <span className="text-xs ml-2">({new Date(item.date).toLocaleDateString('es-ES')})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Próximos Vencimientos</CardTitle>
            <CardDescription>Tareas y facturas con vencimiento próximo.</CardDescription>
          </CardHeader>
          <CardContent>
           {upcomingItems.length > 0 ? (
            <ul className="space-y-3">
              {upcomingItems.map(item => (
                <li key={item.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{item.name}</span> - Vence el {item.dueDateFormatted}
                </li>
              ))}
            </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay vencimientos próximos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for charts - you can add actual chart components here later */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Rendimiento General (Placeholder)
            </CardTitle>
            <CardDescription>Visualización de métricas clave.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Gráficos de rendimiento se mostrarán aquí.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Análisis Financiero (Placeholder)
            </CardTitle>
            <CardDescription>Desglose de ingresos y gastos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Gráficos financieros se mostrarán aquí.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

    