
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Client, WithConvertedDates } from "@/types"; // Adjusted type import
import { Briefcase, CalendarDays, Mail, Phone, Building } from 'lucide-react';

interface ClientCardProps {
  client: WithConvertedDates<Client>; // Use the converted type
}

export function ClientCard({ client }: ClientCardProps) {
  // Helper function to safely format dates that might be undefined
  const formatDate = (dateInput: Date | string | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      return new Date(dateInput).toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const getYear = (dateInput: Date | string | undefined) => {
    if (!dateInput) return '';
    try {
      return new Date(dateInput).getFullYear();
    } catch (e) {
      return '';
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 p-4 bg-secondary/30">
        <Avatar className="h-16 w-16 border-2 border-primary">
          {client.avatarUrl ? (
            <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="company logo" />
          ) : (
            <AvatarFallback>{client.name ? client.name.substring(0, 2).toUpperCase() : 'CL'}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl mb-1">{client.name}</CardTitle>
          <CardDescription className="flex items-center text-sm mb-1">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {client.email}
          </CardDescription>
          {client.telefono && (
            <CardDescription className="flex items-center text-sm mb-1">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> {client.telefono}
            </CardDescription>
          )}
           {client.clinica && (
            <CardDescription className="flex items-center text-sm">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" /> {client.clinica}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 flex-grow">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
            <Briefcase className="mr-2 h-4 w-4" /> Servicios Principales
          </h4>
          <div className="flex flex-wrap gap-1">
            {client.services && client.services.map(service => (
              <Badge key={service.id} variant="secondary" className="font-normal text-xs px-1.5 py-0.5">{service.name}</Badge>
            ))}
             {(!client.services || client.services.length === 0) && <p className="text-xs text-muted-foreground">Ninguno</p>}
          </div>
        </div>
         {client.serviciosActivosGeneral && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Otros Servicios Activos</h4>
            <p className="text-xs text-foreground">{client.serviciosActivosGeneral}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <CalendarDays className="mr-1 h-3 w-3" /> Inicio Contrato
            </h4>
            <p>{formatDate(client.contractStartDate)}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
              <CalendarDays className="mr-1 h-3 w-3" /> Próx. Factura
            </h4>
            <p>{formatDate(client.nextBillingDate)}</p>
          </div>
        </div>

        {client.dominioWeb && (
           <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-0.5">Dominio Web</h4>
            <p className="text-sm">{client.dominioWeb}</p>
            {client.vencimientoWeb && <p className="text-xs text-muted-foreground">Vence: {formatDate(client.vencimientoWeb)}</p>}
          </div>
        )}
       
      </CardContent>
      <CardFooter className="p-4 border-t flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Cliente desde {getYear(client.contractStartDate)}</p>
        {typeof client.pagado !== 'undefined' && (
            <Badge variant={client.pagado ? "default" : "destructive"} className="text-xs px-1.5 py-0.5 bg-opacity-70">
                {client.pagado ? "Al día" : "Pago Pendiente"}
            </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
