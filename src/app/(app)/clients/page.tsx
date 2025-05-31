
import Link from 'next/link';
import { ClientCard } from "@/components/clients/client-card";
import { Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";import { PlusCircle } from "lucide-react";
import { getClients } from '@/app/actions/clientActions';
import type { Client } from '@/types';

// Define a helper type that converts Timestamp fields to Date or string
// For now, we convert to Date as per the existing function.
// We might need to change this to string (e.g., .toISOString()) if issues persist.
export type WithConvertedDates<T> = {
  [P in keyof T]: T[P] extends Timestamp ? Date : T[P];
};

// Recursive timestamp converter
function convertTimestampsToDates(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(docData, key)) {
      const value = docData[key as keyof Client];
      if (value instanceof Timestamp) {
        (data[key as keyof Client] as any) = value.toDate();
      } else if (Array.isArray(value)) {
        (data[key as keyof Client] as any) = value.map(item =>
          typeof item === 'object' && item !== null && !(item instanceof Date) && !(item instanceof Timestamp)
            ? convertTimestampsToDates(item as any) // Recursively convert objects in arrays
            : (item instanceof Timestamp ? item.toDate() : item)
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof Timestamp)) {
          (data[key as keyof Client] as any) = convertTimestampsToDates(value as any); // Recursively convert nested objects
      }
    }
  }
  // Ensure contractedServices and socialMediaAccounts are arrays if they don't exist or are not arrays
  data.contractedServices = Array.isArray(docData.contractedServices) ? docData.contractedServices.map((item: any) => convertTimestampsToDates(item)) : [];
  data.socialMediaAccounts = Array.isArray(docData.socialMediaAccounts) ? docData.socialMediaAccounts.map((item: any) => convertTimestampsToDates(item)) : [];
  
  return data as WithConvertedDates<Client>;
}


const ALL_FILTER_VALUE = "__ALL__";
type PaymentStatusFilterType = typeof ALL_FILTER_VALUE | 'paid' | 'pending';

export default async function ClientsPage() {
  // Fetch clients directly in the Server Component
  const rawClients = await getClients();

  // Convert timestamps before passing to Client Components
  const clients = rawClients.map(client => convertTimestampsToDates(client));

  return (
    <>      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href="/clients/add">
                <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nuevo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* Render the list of clients */}
        {clients.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clients.map(client => (
              // ClientCard receives data with Date objects instead of Timestamps
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No se encontraron clientes.</p>
            <Button asChild className="mt-4">
              <Link href="/clients/add">
                Agregar tu primer cliente
              </Link>
            </Button>
          </div>
        )}
    </>
  );
}

// The renderClientList function is not used and can be removed if not needed elsewhere.
// function renderClientList() {
//   return null;
// }

