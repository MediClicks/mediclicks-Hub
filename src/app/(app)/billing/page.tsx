
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
import { mockInvoices } from "@/lib/data";
import type { InvoiceStatus } from "@/types";
import { PlusCircle, Download, Eye, Edit2 } from "lucide-react";

const statusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 hover:bg-green-600",
  "No Pagada": "bg-yellow-500 hover:bg-yellow-600",
  Vencida: "bg-red-500 hover:bg-red-600",
};

export default function BillingPage() {
  // TODO: Replace mockInvoices with data fetched from Firestore
  // const [invoices, setInvoices] = useState<Invoice[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchInvoices = async () => {
  //     setIsLoading(true);
  //     setError(null);
  //     try {
  //       const invoicesCollection = collection(db, "invoices");
  //       const q = query(invoicesCollection, orderBy("createdAt", "desc"));
  //       const querySnapshot = await getDocs(q);
  //       const invoicesData = querySnapshot.docs.map(doc => {
  //         const data = doc.data();
  //         const convertedData = convertTimestampsToDates(data); // Assuming you have this helper
  //         return { id: doc.id, ...convertedData } as WithConvertedDates<Invoice>;
  //       });
  //       setInvoices(invoicesData);
  //     } catch (err) {
  //       console.error("Error fetching invoices: ", err);
  //       setError("No se pudieron cargar las facturas.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchInvoices();
  // }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <Button asChild>
          <Link href="/billing/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Factura
          </Link>
        </Button>
      </div>

      {/* TODO: Add loading and error states similar to clients page */}

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Factura</TableHead>
              <TableHead>Nombre Cliente</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Fecha Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map(invoice => (
              <TableRow key={invoice.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell>{new Date(invoice.issuedDate).toLocaleDateString('es-ES')}</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</TableCell>
                <TableCell>
                  <Badge className={`${statusColors[invoice.status]} text-white`}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="hover:text-primary" title="Ver Factura">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-primary" title="Editar Factura">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-accent" title="Descargar PDF">
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
          No se encontraron facturas.
        </div>
      )}
    </div>
  );
}
