import { SummaryCard } from "@/components/dashboard/summary-card";
import { Users, Briefcase, ListTodo, DollarSign } from "lucide-react";
import { mockClients, mockTasks, mockInvoices } from "@/lib/data";

export default function DashboardPage() {
  const totalClients = mockClients.length;
  const activeServicesCount = mockClients.reduce((acc, client) => acc + client.services.length, 0);
  const pendingTasks = mockTasks.filter(task => task.status === 'Pending').length;
  const revenueThisMonth = mockInvoices
    .filter(invoice => invoice.status === 'Paid' && new Date(invoice.issuedDate).getMonth() === new Date().getMonth())
    .reduce((sum, inv) => sum + inv.amount, 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Clients" 
          value={totalClients} 
          icon={Users}
          description="Number of active clients"
          iconColorClass="text-primary"
        />
        <SummaryCard 
          title="Active Services" 
          value={activeServicesCount} 
          icon={Briefcase}
          description="Total services provided"
          iconColorClass="text-green-500"
        />
        <SummaryCard 
          title="Pending Tasks" 
          value={pendingTasks} 
          icon={ListTodo}
          description="Tasks requiring attention"
          iconColorClass="text-orange-500"
        />
        <SummaryCard 
          title="Revenue This Month" 
          value={revenueThisMonth} 
          icon={DollarSign}
          description="Based on paid invoices"
          iconColorClass="text-accent"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>Overview of recent tasks and billing.</CardDescription>
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
                  <span className="font-medium text-foreground">Invoice {invoice.id} for {invoice.clientName}</span> - {invoice.status}
                </li>
               ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks and bills due soon.</CardDescription>
          </CardHeader>
          <CardContent>
           <ul className="space-y-3">
              {mockTasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) > new Date()).slice(0, 3).map(task => (
                <li key={task.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{task.name}</span> - Due {new Date(task.dueDate).toLocaleDateString()}
                </li>
              ))}
               {mockInvoices.filter(i => i.status === 'Unpaid').slice(0,2).map(invoice => (
                 <li key={invoice.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Invoice {invoice.id} for {invoice.clientName}</span> - Due {new Date(invoice.dueDate).toLocaleDateString()}
                </li>
               ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Added ShadCN Card components for additional sections as per professional design.
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

