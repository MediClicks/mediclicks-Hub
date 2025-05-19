import { ClientCard } from "@/components/clients/client-card";
import { mockClients } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </div>
      
      {mockClients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mockClients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No clients found.</p>
          <Button variant="link" className="mt-2">Add your first client</Button>
        </div>
      )}
    </div>
  );
}
