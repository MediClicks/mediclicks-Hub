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
import { mockInvoices } from "@/lib/data";
import type { InvoiceStatus } from "@/types";
import { PlusCircle, Download, Eye, Edit2 } from "lucide-react";

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "bg-green-500 hover:bg-green-600",
  Unpaid: "bg-yellow-500 hover:bg-yellow-600",
  Overdue: "bg-red-500 hover:bg-red-600",
};

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map(invoice => (
              <TableRow key={invoice.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell>{new Date(invoice.issuedDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={`${statusColors[invoice.status]} text-white`}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="hover:text-primary" title="View Invoice">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-primary" title="Edit Invoice">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-accent" title="Download PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {mockInvoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No invoices found.
        </div>
      )}
    </div>
  );
}
