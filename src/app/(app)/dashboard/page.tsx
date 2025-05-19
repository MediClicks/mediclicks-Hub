import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign } from "lucide-react";
import { mockClients, mockTasks, mockInvoices } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const totalClients = mockClients.length;
  const activeServicesCount = mockClients.reduce((acc, client) => acc + client.services.length, 0);
  const pendingTasks = mockTasks.filter(task => task.status === 'Pendiente').length;
  const revenueThisMonth = mockInvoices
    .filter(invoice => invoice.status === 'Pagada' && new Date(invoice.issuedDate).getMonth() === new Date().getMonth())
    .reduce((sum, inv) => sum + inv.amount, 0)
    .toLocaleString('es-ES', { style: 'currency', currency: 'USD' }); // Assuming USD, adjust if needed

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
          iconColorClass="text-green-500" // Consider using theme colors
        />
        <SummaryCard 
          title="Tareas Pendientes" 
          value={pendingTasks} 
          icon={ListTodo}
          description="Tareas que requieren atención"
          iconColorClass="text-orange-500" // Consider using theme colors
        />
        <SummaryCard 
          title="Ingresos Este Mes" 
          value={revenueThisMonth} 
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
              {mockTasks.slice(0, 3).map(task => (
                <li key={task.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{task.name}</span> - {task.status}
                </li>
              ))}
               {mockInvoices.slice(0,2).map(invoice => (
                 <li key={invoice.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Factura {invoice.id.toUpperCase()} para {invoice.clientName}</span> - {invoice.status}
                </li>
               ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Próximos Vencimientos</CardTitle>
            <CardDescription>Tareas y facturas con vencimiento próximo.</CardDescription>
          </CardHeader>
          <CardContent>
           <ul className="space-y-3">
              {mockTasks.filter(t => t.status !== 'Completada' && new Date(t.dueDate) > new Date()).slice(0, 3).map(task => (
                <li key={task.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{task.name}</span> - Vence el {new Date(task.dueDate).toLocaleDateString('es-ES')}
                </li>
              ))}
               {mockInvoices.filter(i => i.status === 'No Pagada').slice(0,2).map(invoice => (
                 <li key={invoice.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Factura {invoice.id.toUpperCase()} para {invoice.clientName}</span> - Vence el {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                </li>
               ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
