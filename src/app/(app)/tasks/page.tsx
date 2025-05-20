
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Task, TaskStatus, TaskPriority, WithConvertedDates } from '@/types';
import { cn } from '@/lib/utils';

const statusColors: Record<TaskStatus, string> = {
  Pendiente: "bg-amber-500 border-amber-600 hover:bg-amber-600 text-white",
  "En Progreso": "bg-sky-500 border-sky-600 hover:bg-sky-600 text-white",
  Completada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
};

const priorityColors: Record<TaskPriority, string> = {
  Baja: "bg-slate-400 border-slate-500 hover:bg-slate-500 text-white",
  Media: "bg-orange-400 border-orange-500 hover:bg-orange-500 text-white",
  Alta: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

// Function to convert Firestore Timestamps to JS Date objects
function convertTimestampsToDates(docData: any): WithConvertedDates<Task> {
  const data = { ...docData } as Partial<WithConvertedDates<Task>>;
  for (const key in data) {
    if (data[key as keyof Task] instanceof Timestamp) {
      data[key as keyof Task] = (data[key as keyof Task] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Task>;
}


export default function TasksPage() {
  const [tasks, setTasks] = useState<WithConvertedDates<Task>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Implement filter state and logic
  // const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tasksCollection = collection(db, "tasks");
        // Add filtering here later if statusFilter is implemented
        const q = query(tasksCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const convertedData = convertTimestampsToDates(data as Task);
          return { id: doc.id, ...convertedData };
        });
        setTasks(tasksData);
      } catch (err) {
        console.error("Error fetching tasks: ", err);
        setError("No se pudieron cargar las tareas. Intenta de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []); // Add statusFilter to dependency array if implemented

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" /> Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* TODO: Connect these to state and filtering logic */}
              <DropdownMenuCheckboxItem>Pendiente</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>En Progreso</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Completada</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href="/tasks/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nueva Tarea
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando tareas...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Tarea</TableHead>
                <TableHead>Asignada A</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>{task.assignedTo}</TableCell>
                  <TableCell>{task.clientName || 'N/A'}</TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", priorityColors[task.priority])}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", statusColors[task.status])}>{task.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* TODO: Implement Edit and Delete functionality */}
                    <Button variant="ghost" size="icon" className="hover:text-primary" title="Editar Tarea" disabled>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title="Eliminar Tarea" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!isLoading && !error && tasks.length === 0 && (
         <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-lg">No se encontraron tareas.</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/tasks/add">Agrega tu primera tarea</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
