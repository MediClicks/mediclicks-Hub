
'use client';

import * as React from 'react';
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign, Loader2 } from "lucide-react";
import { mockClients, mockTasks, mockInvoices } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Task, Invoice } from '@/types';

interface ClientUpcomingTask {
  id: string;
  name: string;
  dueDateFormatted: string;
}

interface ClientUpcomingInvoice {
  id: string;
  invoiceIdDisplay: string;
  clientName?: string;
  dueDateFormatted: string;
}

export default function DashboardPage() {
  const [clientRevenueThisMonth, setClientRevenueThisMonth] = React.useState<string | null>(null);
  const [clientUpcomingTasks, setClientUpcomingTasks] = React.useState<ClientUpcomingTask[] | null>(null);
  const [clientUpcomingInvoices, setClientUpcomingInvoices] = React.useState<ClientUpcomingInvoice[] | null>(null);
  const [isLoadingDynamicData, setIsLoadingDynamicData] = React.useState(true);

  // These can be calculated synchronously as they don't depend on new Date() for current time or complex date formatting
  const safeMockClients = mockClients || [];
  const safeMockTasks = mockTasks || [];
  const safeMockInvoices = mockInvoices || [];

  const totalClients = safeMockClients.length;
  const activeServicesCount = safeMockClients.reduce((acc, client) => acc + (client && client.services ? client.services.length : 0), 0);
  const pendingTasks = safeMockTasks.filter(task => task.status === 'Pendiente').length;

  React.useEffect(() => {
    // Calculate revenue for this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const revenue = (mockInvoices || [])
      .filter(invoice => {
        if (!invoice.issuedDate) return false;
        const issuedDate = new Date(invoice.issuedDate);
        return invoice.status === 'Pagada' && 
               issuedDate.getMonth() === currentMonth &&
               issuedDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    setClientRevenueThisMonth(revenue.toLocaleString('es-ES', { style: 'currency', currency: 'USD' }));

    // Process upcoming tasks
    const now = new Date();
    const upcomingT: ClientUpcomingTask[] = (mockTasks || [])
      .filter(t => t.status !== 'Completada' && t.dueDate && new Date(t.dueDate) > now)
      .slice(0, 3)
      .map(task => ({
        id: task.id,
        name: task.name,
        dueDateFormatted: new Date(task.dueDate).toLocaleDateString('es-ES')
      }));
    setClientUpcomingTasks(upcomingT);

    // Process upcoming invoices
    const upcomingI: ClientUpcomingInvoice[] = (mockInvoices || [])
      .filter(i => i.status === 'No Pagada' && i.dueDate && new Date(i.dueDate) > now) // Only show future due dates
      .slice(0, 2)
      .map(invoice => ({
        id: invoice.id,
        invoiceIdDisplay: invoice.id.toUpperCase(),
        clientName: invoice.clientName,
        dueDateFormatted: new Date(invoice.dueDate).toLocaleDateString('es-ES')
      }));
    setClientUpcomingInvoices(upcomingI);

    setIsLoadingDynamicData(false);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Clientes" 
          value={totalClients} 
          icon={Users}
          description="Número de clientes activos"
          iconColorClass="text-primary"
        />
        <SummaryCard 
          title="Servicios Activos" 
          value={activeServicesCount} 
          icon={Briefcase}
          description="Total servicios proporcionados"
          iconColorClass="text-green-500"
        />
        <SummaryCard 
          title="Tareas Pendientes" 
          value={pendingTasks} 
          icon={ListTodo}
          description="Tareas que requieren atención"
          iconColorClass="text-orange-500"
        />
        <SummaryCard 
          title="Ingresos Este Mes" 
          value={isLoadingDynamicData ? "Calculando..." : clientRevenueThisMonth ?? '€0,00'} 
          icon={DollarSign}
          description="Basado en facturas pagadas"
          iconColorClass="text-accent"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Actividad Reciente</CardTitle>
            <CardDescription>Resumen de tareas y facturación recientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(safeMockTasks || []).slice(0, 3).map(task => (
                <li key={task.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{task.name}</span> - {task.status}
                </li>
              ))}
               {(safeMockInvoices || []).slice(0,2).map(invoice => (
                 <li key={invoice.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Factura {invoice.id.toUpperCase()} para {invoice.clientName}</span> - {invoice.status}
                </li>
               ))}
               {safeMockTasks.length === 0 && safeMockInvoices.length === 0 && (
                 <li className="text-sm text-muted-foreground">No hay actividad reciente.</li>
               )}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Próximos Vencimientos</CardTitle>
            <CardDescription>Tareas y facturas con vencimiento próximo.</CardDescription>
          </CardHeader>
          <CardContent>
           {isLoadingDynamicData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando vencimientos...</p>
              </div>
            ) : (
            <ul className="space-y-3">
              {clientUpcomingTasks && clientUpcomingTasks.map(task => (
                <li key={task.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{task.name}</span> - Vence el {task.dueDateFormatted}
                </li>
              ))}
               {clientUpcomingInvoices && clientUpcomingInvoices.map(invoice => (
                 <li key={invoice.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Factura {invoice.invoiceIdDisplay} para {invoice.clientName}</span> - Vence el {invoice.dueDateFormatted}
                </li>
               ))}
               {(!clientUpcomingTasks || clientUpcomingTasks.length === 0) && (!clientUpcomingInvoices || clientUpcomingInvoices.length === 0) && (
                 <li className="text-sm text-muted-foreground">No hay vencimientos próximos.</li>
               )}
            </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
