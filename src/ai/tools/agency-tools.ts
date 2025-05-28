
'use server';
/**
 * @fileOverview Genkit tools for Il Dottore to interact with agency data.
 *
 * - getClientCountTool: Fetches the total number of clients.
 * - getUpcomingTasksTool: Fetches tasks due in the next few days.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getCountFromServer, query, where, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task, WithConvertedDates } from '@/types'; // Asegúrate que Task y WithConvertedDates están correctamente definidos

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
      const twoDaysFromNowEnd = endOfDay(addDays(now, 2)); // Hoy, mañana y pasado mañana

      const tasksCollectionRef = collection(db, "tasks");
      const q = query(
        tasksCollectionRef,
        where("status", "in", ["Pendiente", "En Progreso"]),
        where("dueDate", ">=", Timestamp.fromDate(todayStart)),
        where("dueDate", "<=", Timestamp.fromDate(twoDaysFromNowEnd)),
        orderBy("dueDate", "asc"),
        limit(5) // Limitar el número de tareas para no abrumar
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

