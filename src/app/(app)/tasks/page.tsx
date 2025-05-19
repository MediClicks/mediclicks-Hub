
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
import { mockTasks } from "@/lib/data";
import type { TaskStatus, TaskPriority } from "@/types";
import { PlusCircle, Filter, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusColors: Record<TaskStatus, string> = {
  Pendiente: "bg-yellow-500 hover:bg-yellow-600",
  "En Progreso": "bg-blue-500 hover:bg-blue-600",
  Completada: "bg-green-500 hover:bg-green-600",
};

const priorityColors: Record<TaskPriority, string> = {
  Baja: "bg-gray-400 hover:bg-gray-500",
  Media: "bg-orange-400 hover:bg-orange-500",
  Alta: "bg-red-500 hover:bg-red-600",
};

export default function TasksPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Pendiente</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>En Progreso</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Completada</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href="/tasks/add">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nueva Tarea
            </Link>
          </Button>
        </div>
      </div>

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
            {mockTasks.map(task => (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.assignedTo}</TableCell>
                <TableCell>{task.clientName || 'N/A'}</TableCell>
                <TableCell>{new Date(task.dueDate).toLocaleDateString('es-ES')}</TableCell>
                <TableCell>
                  <Badge className={`${priorityColors[task.priority]} text-white`}>{task.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[task.status]} text-white`}>{task.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="hover:text-primary" title="Editar Tarea">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-destructive" title="Eliminar Tarea">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {mockTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron tareas.
        </div>
      )}
    </div>
  );
}
