
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarChart3, Building, Save, Loader2, AlertTriangle, PlusCircle, Trash2, Edit, PackageSearch, Package } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, Controller, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, addDoc, orderBy, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { Textarea } from "@/components/ui/textarea";
import type { AgencyDetails, Invoice, WithConvertedDates, ServiceDefinition, PaymentModality } from "@/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from "@/contexts/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const agencyDetailsSchema = z.object({
  agencyName: z.string().min(1, "El nombre de la agencia es obligatorio."),
  address: z.string().min(1, "La dirección es obligatoria."),
  taxId: z.string().min(1, "El NIF/CIF es obligatorio."),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Debe ser un email válido.").min(1, "El email de contacto es obligatorio."),
  website: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

type AgencyDetailsFormValues = z.infer<typeof agencyDetailsSchema>;

const paymentModalities: PaymentModality[] = ['Único', 'Mensual', 'Trimestral', 'Anual'];

const serviceDefinitionSchema = z.object({
  name: z.string().min(2, { message: "El nombre del servicio debe tener al menos 2 caracteres." }),
  price: z.coerce.number().min(0, { message: "El precio no puede ser negativo." }),
  paymentModality: z.enum(paymentModalities, { required_error: "La modalidad de pago es obligatoria." }),
});

type ServiceDefinitionFormValues = z.infer<typeof serviceDefinitionSchema>;


interface MonthlyRevenueChartData {
  month: string;
  total: number;
}

const chartColors = {
  revenue: "hsl(var(--chart-1))",
};

const revenueChartConfig = {
  revenue: { label: "Ingresos", color: chartColors.revenue },
} satisfies ChartConfig;

function convertFirestoreTimestamps<T extends Record<string, any>>(data: T): WithConvertedDates<T> {
  if (!data) return data; // Return as is if data is null or undefined
  const convertedData = { ...data } as any;
  for (const key in convertedData) {
    if (Object.prototype.hasOwnProperty.call(convertedData, key)) {
      const value = convertedData[key];
      if (value instanceof Timestamp) {
        convertedData[key] = value.toDate();
      } else if (Array.isArray(value)) {
        convertedData[key] = value.map((item: any) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? convertFirestoreTimestamps(item) // Recursively convert objects in arrays
            : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        convertedData[key] = convertFirestoreTimestamps(value); // Recursively convert nested objects
      }
    }
  }
  return convertedData as WithConvertedDates<T>;
}


export default function SettingsPage() {
  const [isDark, setIsDark] = React.useState(false);
  const [isLoadingAgencyDetails, setIsLoadingAgencyDetails] = React.useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueChartData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [serviceDefinitions, setServiceDefinitions] = useState<WithConvertedDates<ServiceDefinition>[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const [editingService, setEditingService] = useState<WithConvertedDates<ServiceDefinition> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<WithConvertedDates<ServiceDefinition> | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);

  const agencyForm = useForm<AgencyDetailsFormValues>({
    resolver: zodResolver(agencyDetailsSchema),
    defaultValues: {
      agencyName: '',
      address: '',
      taxId: '',
      contactPhone: '',
      contactEmail: '',
      website: '',
    }
  });

  const serviceForm = useForm<ServiceDefinitionFormValues>({
    resolver: zodResolver(serviceDefinitionSchema),
    defaultValues: {
      name: '',
      price: 0,
      paymentModality: 'Mensual',
    }
  });

  const editServiceForm = useForm<ServiceDefinitionFormValues>({
    resolver: zodResolver(serviceDefinitionSchema),
  });
  
  const { isSubmitting: isSubmittingAgency, control: agencyControl } = agencyForm;
  const { isSubmitting: isSubmittingService, control: serviceControl } = serviceForm;
  const { isSubmitting: isSubmittingEditService, control: editServiceControl } = editServiceForm;


  const fetchServiceDefinitions = useCallback(async () => {
    setIsLoadingServices(true);
    setServiceError(null);
    try {
      const servicesCollection = collection(db, "appServices");
      const q = query(servicesCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedServices = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { id: docSnap.id, ...convertFirestoreTimestamps(data as ServiceDefinition) };
      });
      setServiceDefinitions(fetchedServices);
    } catch (err: any) {
      console.error("Error fetching service definitions: ", err);
      setServiceError("No se pudieron cargar las definiciones de servicios.");
      toast({
        title: "Error al Cargar Servicios",
        description: err.message || "No se pudieron cargar las definiciones de servicios.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [toast]);

  const fetchAgencyDetails = useCallback(async () => {
    setIsLoadingAgencyDetails(true);
    try {
      const agencyDocRef = doc(db, 'settings', 'agencyDetails');
      const docSnap = await getDoc(agencyDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AgencyDetails;
        agencyForm.reset({
          agencyName: data.agencyName || '',
          address: data.address || '',
          taxId: data.taxId || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          website: data.website || '',
        });
      }
    } catch (error) {
      console.error("Error fetching agency details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la agencia.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAgencyDetails(false);
    }
  }, [agencyForm, toast]);

  const fetchRevenueChartData = useCallback(async () => {
    setIsLoadingChart(true);
    setChartError(null);
    try {
      const now = new Date();
      const revenueByMonth: Record<string, number> = {};
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      const invoicesCollectionRef = collection(db, "invoices");
      const paidInvoicesQuery = query(invoicesCollectionRef,
        where("status", "==", "Pagada"),
        where("issuedDate", ">=", Timestamp.fromDate(sixMonthsAgo))
      );
      const paidInvoicesSnap = await getDocs(paidInvoicesQuery);

      paidInvoicesSnap.docs.forEach(docSnap => {
        const invoice = convertFirestoreTimestamps(docSnap.data() as Invoice);
        if (invoice?.issuedDate) {
          const monthYear = format(new Date(invoice.issuedDate), 'LLL yy', { locale: es });
          revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + (invoice.totalAmount || 0);
        }
      });

      const formattedRevenueData: MonthlyRevenueChartData[] = [];
      for (let i = 5; i >= 0; i--) {
        const dateCursor = subMonths(now, i);
        const monthYearKey = format(dateCursor, 'LLL yy', { locale: es });
        formattedRevenueData.push({
          month: monthYearKey.charAt(0).toUpperCase() + monthYearKey.slice(1),
          total: revenueByMonth[monthYearKey] || 0,
        });
      }
      setMonthlyRevenueData(formattedRevenueData);

    } catch (err: any) {
      console.error("Error fetching revenue chart data for settings page: ", err);
      let specificError = "No se pudieron cargar los datos para el gráfico de ingresos.";
      if (err.message && (err.message.includes("index") || err.message.includes("Index"))) {
        specificError = `Se requiere un índice de Firestore para el gráfico de ingresos. Por favor, revise la consola del navegador para ver el enlace y créelo. Luego recargue la página. (${err.message})`;
      } else if (err.message) {
        specificError = `Error al cargar gráfico: ${err.message}`;
      }
      setChartError(specificError);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);


  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
    fetchAgencyDetails();
    fetchRevenueChartData();
    fetchServiceDefinitions();
  }, [fetchAgencyDetails, fetchRevenueChartData, fetchServiceDefinitions]);


  const toggleDarkMode = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const onAgencySubmit = async (data: AgencyDetailsFormValues) => {
    agencyForm.clearErrors();
    try {
      const agencyDocRef = doc(db, 'settings', 'agencyDetails');
      const dataToSave: Partial<AgencyDetails> = {
        agencyName: data.agencyName,
        address: data.address,
        taxId: data.taxId,
        contactEmail: data.contactEmail,
        website: data.website && data.website.trim() !== '' ? data.website : deleteField() as unknown as undefined,
        contactPhone: data.contactPhone && data.contactPhone.trim() !== '' ? data.contactPhone : deleteField() as unknown as undefined,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(agencyDocRef, dataToSave, { merge: true });
      toast({
        title: "Información Guardada",
        description: "Los detalles de la agencia han sido actualizados.",
      });
    } catch (error) {
      console.error("Error saving agency details:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar los detalles de la agencia.",
        variant: "destructive",
      });
    }
  };

  const onServiceSubmit = async (data: ServiceDefinitionFormValues) => {
    serviceForm.clearErrors();
    try {
      const serviceData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'appServices'), serviceData);
      toast({
        title: "Servicio Creado",
        description: `El servicio "${data.name}" ha sido agregado.`,
      });
      serviceForm.reset();
      fetchServiceDefinitions();
    } catch (e) {
      console.error("Error agregando servicio a Firestore: ", e);
      toast({
        title: "Error al Guardar Servicio",
        description: "Hubo un problema al guardar el servicio. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const onEditServiceSubmit = async (data: ServiceDefinitionFormValues) => {
    if (!editingService) return;
    editServiceForm.clearErrors();
    try {
      const serviceDocRef = doc(db, 'appServices', editingService.id);
      const serviceDataToUpdate = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(serviceDocRef, serviceDataToUpdate);
      toast({
        title: "Servicio Actualizado",
        description: `El servicio "${data.name}" ha sido actualizado.`,
      });
      setIsEditDialogOpen(false);
      setEditingService(null);
      fetchServiceDefinitions();
    } catch (e) {
      console.error("Error actualizando servicio en Firestore: ", e);
      toast({
        title: "Error al Actualizar",
        description: "Hubo un problema al actualizar el servicio.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    setIsDeletingService(true);
    try {
      await deleteDoc(doc(db, "appServices", serviceId));
      toast({
        title: "Servicio Eliminado",
        description: `El servicio "${serviceName}" ha sido eliminado.`,
      });
      fetchServiceDefinitions(); 
    } catch (error) {
      console.error("Error eliminando servicio: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar el servicio.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingService(false);
      setServiceToDelete(null); 
    }
  };


  const handleOpenEditDialog = (service: WithConvertedDates<ServiceDefinition>) => {
    setEditingService(service);
    editServiceForm.reset({
      name: service.name,
      price: service.price,
      paymentModality: service.paymentModality,
    });
    setIsEditDialogOpen(true);
  };

  const categorizedServices = useMemo(() => {
    const categories: Record<PaymentModality, WithConvertedDates<ServiceDefinition>[]> = {
      'Único': [],
      'Mensual': [],
      'Trimestral': [],
      'Anual': [],
    };
    serviceDefinitions.forEach(service => {
      categories[service.paymentModality]?.push(service);
    });
    return categories;
  }, [serviceDefinitions]);

  const noRevenueData = monthlyRevenueData.length === 0 || monthlyRevenueData.every(d => d.total === 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" />
            Información de la Agencia
          </CardTitle>
          <CardDescription>Estos datos se usarán en facturas y otros documentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAgencyDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Cargando información de la agencia...</p>
            </div>
          ) : (
            <form onSubmit={agencyForm.handleSubmit(onAgencySubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="agencyName">Nombre de la Agencia</Label>
                  <Input id="agencyName" {...agencyForm.register("agencyName")} placeholder="Ej: MediClicks Hub S.L." disabled={isSubmittingAgency} />
                  {agencyForm.formState.errors.agencyName && <p className="text-sm text-destructive">{agencyForm.formState.errors.agencyName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxId">NIF/CIF</Label>
                  <Input id="taxId" {...agencyForm.register("taxId")} placeholder="Ej: B12345678" disabled={isSubmittingAgency} />
                  {agencyForm.formState.errors.taxId && <p className="text-sm text-destructive">{agencyForm.formState.errors.taxId.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección Completa</Label>
                <Textarea id="address" {...agencyForm.register("address")} placeholder="Calle Ejemplo 123, Ciudad, Provincia, CP" disabled={isSubmittingAgency} />
                {agencyForm.formState.errors.address && <p className="text-sm text-destructive">{agencyForm.formState.errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input id="contactEmail" type="email" {...agencyForm.register("contactEmail")} placeholder="facturacion@agencia.com" disabled={isSubmittingAgency} />
                  {agencyForm.formState.errors.contactEmail && <p className="text-sm text-destructive">{agencyForm.formState.errors.contactEmail.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Teléfono de Contacto (Opcional)</Label>
                  <Input id="contactPhone" {...agencyForm.register("contactPhone")} placeholder="+34 900 123 456" disabled={isSubmittingAgency} />
                  {agencyForm.formState.errors.contactPhone && <p className="text-sm text-destructive">{agencyForm.formState.errors.contactPhone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Sitio Web (Opcional)</Label>
                <Input id="website" {...agencyForm.register("website")} placeholder="https://www.agencia.com" disabled={isSubmittingAgency} />
                {agencyForm.formState.errors.website && <p className="text-sm text-destructive">{agencyForm.formState.errors.website.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmittingAgency}>
                {isSubmittingAgency ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmittingAgency ? 'Guardando Información...' : 'Guardar Información'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
             <Package className="mr-2 h-5 w-5 text-primary" />
             Gestionar Servicios y Paquetes
          </CardTitle>
          <CardDescription>Define los servicios que ofreces a tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-6 mb-8 p-4 border rounded-md bg-card">
            <h3 className="text-lg font-medium">Agregar Nuevo Servicio/Paquete</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="serviceName">Nombre del Servicio/Paquete</Label>
                  <Input id="serviceName" {...serviceForm.register("name")} placeholder="Ej: SEO Básico Mensual" disabled={isSubmittingService} />
                  {serviceForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{serviceForm.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="servicePrice">Precio (USD)</Label>
                  <Input id="servicePrice" type="number" step="0.01" {...serviceForm.register("price")} placeholder="Ej: 299.99" disabled={isSubmittingService} />
                  {serviceForm.formState.errors.price && <p className="text-xs text-destructive mt-1">{serviceForm.formState.errors.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="paymentModality">Modalidad de Pago</Label>
                  <Controller
                    name="paymentModality"
                    control={serviceForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingService}>
                        <SelectTrigger id="paymentModality">
                          <SelectValue placeholder="Seleccionar modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentModalities.map(modality => (
                            <SelectItem key={modality} value={modality}>{modality}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {serviceForm.formState.errors.paymentModality && <p className="text-xs text-destructive mt-1">{serviceForm.formState.errors.paymentModality.message}</p>}
                </div>
             </div>
             <Button type="submit" disabled={isSubmittingService}>
                {isSubmittingService ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isSubmittingService ? 'Agregando Servicio...' : 'Agregar Servicio'}
            </Button>
          </form>

          <h3 className="text-xl font-semibold mb-6 mt-10 border-b pb-2">Listado de Servicios Definidos</h3>
          {isLoadingServices && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Cargando servicios...</p>
            </div>
          )}
          {!isLoadingServices && serviceError && (
            <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 shrink-0"/> {serviceError}
            </div>
          )}
          {!isLoadingServices && !serviceError && serviceDefinitions.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <PackageSearch className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p>Aún no has definido ningún servicio o paquete.</p>
              <p className="text-sm">¡Crea el primero usando el formulario de arriba!</p>
            </div>
          )}

          {!isLoadingServices && !serviceError && serviceDefinitions.length > 0 && (
            <div className="space-y-6">
              {paymentModalities.map(modality => {
                const servicesInThisCategory = categorizedServices[modality];
                if (servicesInThisCategory.length === 0) return null;

                return (
                  <div key={modality}>
                    <h4 className="text-lg font-medium mb-3 text-primary">{modality}</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="text-right">Precio (USD)</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {servicesInThisCategory.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">{service.name}</TableCell>
                              <TableCell className="text-right">{service.price.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                              <TableCell className="text-right space-x-1">
                                 <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8" onClick={() => handleOpenEditDialog(service)} title="Editar Servicio" disabled={isDeletingService}>
                                    <Edit className="h-4 w-4 text-yellow-600" />
                                 </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="hover:text-destructive h-8 w-8" title="Eliminar Servicio" disabled={isDeletingService || (serviceToDelete?.id === service.id && isDeletingService)}>
                                        {serviceToDelete?.id === service.id && isDeletingService ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-red-600" />}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar Servicio/Paquete?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Estás a punto de eliminar el servicio "{service.name}". Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setServiceToDelete(null)} disabled={isDeletingService}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => { setServiceToDelete(service); handleDeleteService(service.id, service.name); }}
                                          disabled={isDeletingService}
                                          className={cn(buttonVariants({ variant: "destructive" }))}
                                        >
                                           {isDeletingService && serviceToDelete?.id === service.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open && !isSubmittingEditService) {setEditingService(null); setIsEditDialogOpen(false);}}}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Servicio/Paquete</DialogTitle>
            <DialogDescription>
              Modifica los detalles de "{editingService?.name}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editServiceForm.handleSubmit(onEditServiceSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="editServiceName">Nombre del Servicio/Paquete</Label>
              <Input id="editServiceName" {...editServiceForm.register("name")} disabled={isSubmittingEditService} />
              {editServiceForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{editServiceForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="editServicePrice">Precio (USD)</Label>
              <Input id="editServicePrice" type="number" step="0.01" {...editServiceForm.register("price")} disabled={isSubmittingEditService} />
              {editServiceForm.formState.errors.price && <p className="text-xs text-destructive mt-1">{editServiceForm.formState.errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="editPaymentModality">Modalidad de Pago</Label>
               <Controller
                    name="paymentModality"
                    control={editServiceForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingEditService}>
                        <SelectTrigger id="editPaymentModality">
                          <SelectValue placeholder="Seleccionar modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentModalities.map(modality => (
                            <SelectItem key={modality} value={modality}>{modality}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
              {editServiceForm.formState.errors.paymentModality && <p className="text-xs text-destructive mt-1">{editServiceForm.formState.errors.paymentModality.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => {setEditingService(null); setIsEditDialogOpen(false);}} disabled={isSubmittingEditService}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmittingEditService}>
                {isSubmittingEditService ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>Tus datos de inicio de sesión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" defaultValue={user?.displayName?.split(' ')[0] || "Usuario"} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" defaultValue={user?.displayName?.split(' ').slice(1).join(' ') || "App"} disabled />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Dirección de Email</Label>
            <Input id="email" type="email" defaultValue={user?.email || "No disponible"} disabled />
          </div>
          <Button disabled>Guardar Cambios</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>Personaliza el aspecto de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="flex flex-col space-y-1">
              <span>Modo Oscuro</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Alternar entre tema claro y oscuro.
              </span>
            </Label>
            <Switch
              id="darkMode"
              checked={isDark}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Analíticas de Facturación
          </CardTitle>
          <CardDescription>Visualiza el rendimiento financiero de tu compañía (últimos 6 meses).</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-6">
          {isLoadingChart && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Cargando gráfico...</p>
            </div>
          )}
          {!isLoadingChart && chartError && (
            <div className="flex flex-col items-center justify-center h-full text-destructive text-center">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="text-sm whitespace-pre-wrap">{chartError}</p>
            </div>
          )}
          {!isLoadingChart && !chartError && noRevenueData && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 text-gray-400" />
              <p>No hay datos de ingresos para mostrar.</p>
            </div>
          )}
          {!isLoadingChart && !chartError && !noRevenueData && (
            <ChartContainer config={revenueChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={monthlyRevenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickFormatter={(value) => `$${Number(value/1000).toFixed(0)}k`} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="total" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

