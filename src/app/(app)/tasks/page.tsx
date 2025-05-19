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
  Pending: "bg-yellow-500 hover:bg-yellow-600",
  "In Progress": "bg-blue-500 hover:bg-blue-600",
  Completed: "bg-green-500 hover:bg-green-600",
};

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-gray-400 hover:bg-gray-500",
  Medium: "bg-orange-400 hover:bg-orange-500",
  High: "bg-red-500 hover:bg-red-600",
};

export default function TasksPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Pending</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>In Progress</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Completed</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTasks.map(task => (
              <TableRow key={task.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.assignedTo}</TableCell>
                <TableCell>{task.clientName || 'N/A'}</TableCell>
                <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={`${priorityColors[task.priority]} text-white`}>{task.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[task.status]} text-white`}>{task.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-destructive">
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
          No tasks found.
        </div>
      )}
    </div>
  );
}
