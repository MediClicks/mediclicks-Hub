
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus, Client, WithConvertedDates } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

const taskPriorities: TaskPriority[] = ['Baja', 'Media', 'Alta'];
const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];

const taskFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre de la tarea debe tener al menos 3 caracteres.' }),
  description: z.string().optional(),
  assignedTo: z.string().min(2, { message: 'Debe asignar la tarea a alguien.' }),
  clientId: z.string().optional(),
  dueDate: z.date({ required_error: 'La fecha de vencimiento es obligatoria.' }),
  priority: z.enum(taskPriorities, { required_error: 'La prioridad es obligatoria.' }),
  status: z.enum(taskStatuses, { required_error: 'El estado es obligatorio.' }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TASK_CLIENT_SELECT_NONE_VALUE = "__NONE__";

// Function to convert Firestore Timestamps to JS Date objects for clients
function convertClientTimestampsToDates(docData: any): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  }
  return data;
}


export default function AddTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const clientsCollection = collection(db, "clients");
        const q = query(clientsCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedClients = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const convertedData = convertClientTimestampsToDates(data);
          return { id: doc.id, ...convertedData } as WithConvertedDates<Client>;
        });
        setClientsList(fetchedClients);
      } catch (err) {
        console.error("Error fetching clients for dropdown: ", err);
        toast({
          title: 'Error al Cargar Clientes',
          description: 'No se pudieron cargar los clientes para el selector.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, [toast]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      assignedTo: '',
      priority: 'Media',
      status: 'Pendiente',
      clientId: TASK_CLIENT_SELECT_NONE_VALUE, // Default to "Ninguno"
    },
  });

  async function onSubmit(data: TaskFormValues) {
    form.clearErrors();
    try {
      let clientName: string | undefined = undefined;
      if (data.clientId && data.clientId !== TASK_CLIENT_SELECT_NONE_VALUE) {
        clientName = clientsList.find(c => c.id === data.clientId)?.name;
      }
      
      const taskData: any = {
        ...data,
        clientName: clientName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!taskData.clientId || taskData.clientId === TASK_CLIENT_SELECT_NONE_VALUE) {
        delete taskData.clientId;
        delete taskData.clientName;
      }
      if (taskData.description === undefined) delete taskData.description;


      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      console.log('Nueva tarea guardada en Firestore con ID: ', docRef.id);

      toast({
        title: 'Tarea Creada',
        description: `La tarea "${data.name}" ha sido agregada exitosamente.`,
      });
      router.push('/tasks');
    } catch (e) {
      console.error('Error al agregar tarea a Firestore: ', e);
      toast({
        title: 'Error al Guardar Tarea',
        description: 'Hubo un problema al guardar la tarea. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Agregar Nueva Tarea</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Tarea</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Diseñar banners para campaña X" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalles adicionales sobre la tarea..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignada A</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (Opcional)</FormLabel>
                  <Select
                    value={field.value || TASK_CLIENT_SELECT_NONE_VALUE} 
                    onValueChange={(selectedValue) => {
                      if (selectedValue === TASK_CLIENT_SELECT_NONE_VALUE) {
                        field.onChange(undefined); 
                      } else {
                        field.onChange(selectedValue);
                      }
                    }}
                    disabled={isLoadingClients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Cargando clientes..." : "Seleccionar un cliente"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TASK_CLIENT_SELECT_NONE_VALUE}>Ninguno</SelectItem>
                      {!isLoadingClients && clientsList.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskPriorities.map(priority => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingClients}>
            {form.formState.isSubmitting ? 'Guardando Tarea...' : 'Guardar Tarea'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
