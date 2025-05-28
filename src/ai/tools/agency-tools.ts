
'use server';
/**
 * @fileOverview Genkit tools for Il Dottore to interact with agency data.
 *
 * - getClientCountTool: Fetches the total number of clients.
 * - getUpcomingTasksTool: Fetches tasks due in the next few days.
 * - getClientDetailsTool: Fetches details for a specific client by name.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, WithConvertedDates, Client, ContractedServiceClient } from '@/types';

// Helper function to convert Firestore Timestamps
function convertTaskTimestamps(taskData: any): WithConvertedDates<Task> {
    const data = { ...taskData } as Partial<WithConvertedDates<Task>>;
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key as keyof Task];
          if (value instanceof Timestamp) {
            data[key as keyof Task] = value.toDate() as any;
          }
      }
    }
    return data as WithConvertedDates<Task>;
}

function convertClientTimestamps(clientData: any): WithConvertedDates<Client> {
  const data = { ...clientData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof Client];
      if (value instanceof Timestamp) {
        (data[key as keyof Client] as any) = value.toDate();
      } else if (Array.isArray(value)) {
        (data[key as keyof Client] as any) = value.map(item =>
          typeof item === 'object' && item !== null && !(item instanceof Date) ? convertClientTimestamps(item as any) : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        (data[key as keyof Client] as any) = convertClientTimestamps(value as any);
      }
    }
  }
  return data as WithConvertedDates<Client>;
}


export const getClientCountTool = ai.defineTool(
  {
    name: 'getClientCountTool',
    description: 'Devuelve el número total de clientes activos registrados en la agencia.',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.object({
      count: z.number().describe('El número total de clientes.'),
    }),
  },
  async () => {
    try {
      const clientsCollectionRef = collection(db, "clients");
      const snapshot = await getCountFromServer(clientsCollectionRef);
      return { count: snapshot.data().count };
    } catch (error) {
      console.error("Error en getClientCountTool:", error);
      return { count: -1 }; // Indicate an error or inability to fetch
    }
  }
);

const UpcomingTaskSchema = z.object({
    id: z.string(),
    name: z.string(),
    clientName: z.string().optional(),
    dueDate: z.string().describe("Fecha de vencimiento en formato dd/MM/yyyy."),
  });
  
export const getUpcomingTasksTool = ai.defineTool(
  {
    name: 'getUpcomingTasksTool',
    description: 'Obtiene un resumen de las tareas pendientes o en progreso que vencen hoy o en los próximos 2 días (total 3 días incluyendo hoy).',
    inputSchema: z.object({}), // No input needed
    outputSchema: z.object({
      tasks: z.array(UpcomingTaskSchema).describe("Lista de tareas próximas."),
      summary: z.string().describe("Un breve resumen de las tareas encontradas o un mensaje si no hay tareas."),
    }),
  },
  async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const twoDaysFromNowEnd = endOfDay(addDays(now, 2)); 

      const tasksCollectionRef = collection(db, "tasks");
      const q = query(
        tasksCollectionRef,
        where("status", "in", ["Pendiente", "En Progreso"]),
        where("dueDate", ">=", Timestamp.fromDate(todayStart)),
        where("dueDate", "<=", Timestamp.fromDate(twoDaysFromNowEnd)),
        orderBy("dueDate", "asc"),
        limit(5) 
      );

      const querySnapshot = await getDocs(q);
      const fetchedTasks: z.infer<typeof UpcomingTaskSchema>[] = [];
      
      querySnapshot.forEach(docSnap => {
        const taskData = convertTaskTimestamps(docSnap.data() as Task);
        fetchedTasks.push({
          id: docSnap.id,
          name: taskData.name || "Tarea sin nombre",
          clientName: taskData.clientName || undefined,
          dueDate: taskData.dueDate ? format(new Date(taskData.dueDate), 'dd/MM/yyyy', { locale: es }) : "Fecha N/A",
        });
      });

      if (fetchedTasks.length === 0) {
        return { tasks: [], summary: "No hay tareas próximas con vencimiento en los siguientes 3 días." };
      }

      return { 
        tasks: fetchedTasks,
        summary: `${fetchedTasks.length} tarea(s) próxima(s) encontrada(s).`
      };

    } catch (error: any) {
      console.error("Error en getUpcomingTasksTool:", error);
      return { 
          tasks: [], 
          summary: `No pude obtener las tareas próximas debido a un error: ${error.message || 'Error desconocido'}.` 
      };
    }
  }
);

// Schemas for GetClientDetailsTool
const GetClientDetailsInputSchema = z.object({
  clientName: z.string().describe("El nombre exacto del cliente a buscar."),
});

const ClientServiceDetailSchema = z.object({
  serviceName: z.string(),
  price: z.number(),
  paymentModality: z.string(),
});

const ClientDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  clinica: z.string().optional(),
  profileSummary: z.string().optional().describe("Un breve resumen del perfil del cliente."),
  contractedServicesCount: z.number().describe("Número de servicios contratados."),
  contractedServicesSummary: z.array(ClientServiceDetailSchema).optional().describe("Resumen de los servicios contratados."),
  pagado: z.boolean().optional().describe("Indica si el cliente está al día con los pagos."),
});

const GetClientDetailsOutputSchema = z.object({
  client: ClientDetailsSchema.optional(),
  message: z.string().describe("Mensaje sobre el resultado de la búsqueda, ej. 'Cliente encontrado' o 'Cliente no encontrado'." ),
});


export const getClientDetailsTool = ai.defineTool(
  {
    name: 'getClientDetailsTool',
    description: 'Busca y devuelve detalles de un cliente específico por su nombre exacto.',
    inputSchema: GetClientDetailsInputSchema,
    outputSchema: GetClientDetailsOutputSchema,
  },
  async (input) => {
    try {
      const clientsCollectionRef = collection(db, "clients");
      const q = query(clientsCollectionRef, where("name", "==", input.clientName), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { message: `Cliente con el nombre exacto "${input.clientName}" no encontrado.` };
      }

      const clientDoc = querySnapshot.docs[0];
      const clientData = convertClientTimestamps(clientDoc.data() as Client);
      
      const servicesSummary = (clientData.contractedServices || []).map(s => ({
        serviceName: s.serviceName,
        price: s.price,
        paymentModality: s.paymentModality,
      }));

      const clientDetails: z.infer<typeof ClientDetailsSchema> = {
        id: clientDoc.id,
        name: clientData.name,
        email: clientData.email || undefined,
        telefono: clientData.telefono || undefined,
        clinica: clientData.clinica || undefined,
        profileSummary: clientData.profileSummary ? clientData.profileSummary.substring(0, 150) + (clientData.profileSummary.length > 150 ? "..." : "") : undefined,
        contractedServicesCount: clientData.contractedServices?.length || 0,
        contractedServicesSummary: servicesSummary.length > 0 ? servicesSummary : undefined,
        pagado: clientData.pagado,
      };

      return { client: clientDetails, message: "Cliente encontrado exitosamente." };

    } catch (error: any) {
      console.error("Error en getClientDetailsTool:", error);
      return { message: `Error al buscar cliente: ${error.message || 'Error desconocido'}.` };
    }
  }
);
