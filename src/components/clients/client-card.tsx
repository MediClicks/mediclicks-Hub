import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Client } from "@/types";
import { Briefcase, CalendarDays, Mail } from 'lucide-react';

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-4 p-4 bg-secondary/30">
        <Avatar className="h-16 w-16 border-2 border-primary">
          {client.avatarUrl ? (
            <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="company logo" />
          ) : (
            <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl mb-1">{client.name}</CardTitle>
          <CardDescription className="flex items-center text-sm">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {client.email}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
            <Briefcase className="mr-2 h-4 w-4" /> Services
          </h4>
          <div className="flex flex-wrap gap-2">
            {client.services.map(service => (
              <Badge key={service.id} variant="secondary" className="font-normal">{service.name}</Badge>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <CalendarDays className="mr-1 h-3 w-3" /> Contract Start
            </h4>
            <p>{new Date(client.contractStartDate).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <CalendarDays className="mr-1 h-3 w-3" /> Next Billing
            </h4>
            <p>{new Date(client.nextBillingDate).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground">Client since {new Date(client.contractStartDate).getFullYear()}</p>
      </CardFooter>
    </Card>
  );
}
