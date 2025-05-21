
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarChart3, Building, Save, Loader2, AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Textarea } from "@/components/ui/textarea";
import type { AgencyDetails, Invoice, WithConvertedDates } from "@/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const agencyDetailsSchema = z.object({
  agencyName: z.string().min(1, "El nombre de la agencia es obligatorio."),
  address: z.string().min(1, "La dirección es obligatoria."),
  taxId: z.string().min(1, "El NIF/CIF es obligatorio."),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Debe ser un email válido.").min(1, "El email de contacto es obligatorio."),
  website: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

type AgencyDetailsFormValues = z.infer<typeof agencyDetailsSchema>;

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
  const convertedData = { ...data } as any;
  for (const key in convertedData) {
    if (convertedData[key] instanceof Timestamp) {
      convertedData[key] = convertedData[key].toDate();
    } else if (Array.isArray(convertedData[key])) {
      convertedData[key] = convertedData[key].map((item: any) =>
        typeof item === 'object' && item !== null && !(item instanceof Date)
          ? convertFirestoreTimestamps(item)
          : item
      );
    } else if (typeof convertedData[key] === 'object' && convertedData[key] !== null && !(convertedData[key] instanceof Date) ) {
      convertedData[key] = convertFirestoreTimestamps(convertedData[key]);
    }
  }
  return convertedData as WithConvertedDates<T>;
}


export default function SettingsPage() {
  const [isDark, setIsDark] = React.useState(false);
  const [isLoadingAgencyDetails, setIsLoadingAgencyDetails] = React.useState(true);
  const { toast } = useToast();

  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueChartData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

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

  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);

    const fetchAgencyDetails = async () => {
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
    };
    fetchAgencyDetails();

    const fetchRevenueChartData = async () => {
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

        paidInvoicesSnap.docs.forEach(doc => {
          const invoice = convertFirestoreTimestamps(doc.data() as Invoice);
          if (invoice.issuedDate) {
            const monthYear = format(new Date(invoice.issuedDate), 'LLL yy', { locale: es });
            revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + invoice.totalAmount;
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
        if (err.message && (err.message.includes("index") || err.message.includes("Index"))) {
          setChartError(`Se requiere un índice de Firestore para el gráfico de ingresos. Por favor, créalo (colección 'invoices', campos 'status' ASC, 'issuedDate' ASC) y luego recarga la página.`);
        } else {
          setChartError("No se pudieron cargar los datos para el gráfico de ingresos.");
        }
        toast({
          title: "Error en Gráfico",
          description: chartError || "Error al cargar datos del gráfico de ingresos.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchRevenueChartData();

  }, [agencyForm, toast, chartError]); // Added chartError to dependency array to re-trigger toast if it changes.

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
    try {
      const agencyDocRef = doc(db, 'settings', 'agencyDetails');
      const dataToSave: AgencyDetails = {
        ...data,
        website: data.website === '' ? undefined : data.website, 
        updatedAt: serverTimestamp() as unknown as Timestamp, 
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
                  <Input id="agencyName" {...agencyForm.register("agencyName")} placeholder="Ej: MediClicks Hub S.L." />
                  {agencyForm.formState.errors.agencyName && <p className="text-sm text-destructive">{agencyForm.formState.errors.agencyName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxId">NIF/CIF</Label>
                  <Input id="taxId" {...agencyForm.register("taxId")} placeholder="Ej: B12345678" />
                  {agencyForm.formState.errors.taxId && <p className="text-sm text-destructive">{agencyForm.formState.errors.taxId.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección Completa</Label>
                <Textarea id="address" {...agencyForm.register("address")} placeholder="Calle Ejemplo 123, Ciudad, Provincia, CP" />
                {agencyForm.formState.errors.address && <p className="text-sm text-destructive">{agencyForm.formState.errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input id="contactEmail" type="email" {...agencyForm.register("contactEmail")} placeholder="facturacion@agencia.com" />
                  {agencyForm.formState.errors.contactEmail && <p className="text-sm text-destructive">{agencyForm.formState.errors.contactEmail.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input id="contactPhone" {...agencyForm.register("contactPhone")} placeholder="+34 900 123 456" />
                  {agencyForm.formState.errors.contactPhone && <p className="text-sm text-destructive">{agencyForm.formState.errors.contactPhone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Sitio Web (Opcional)</Label>
                <Input id="website" {...agencyForm.register("website")} placeholder="https://www.agencia.com" />
                {agencyForm.formState.errors.website && <p className="text-sm text-destructive">{agencyForm.formState.errors.website.message}</p>}
              </div>
              <Button type="submit" disabled={agencyForm.formState.isSubmitting}>
                {agencyForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Información de Agencia
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>Actualiza tus datos personales (funcionalidad placeholder).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" defaultValue="Admin" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" defaultValue="Usuario" disabled />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Dirección de Email</Label>
            <Input id="email" type="email" defaultValue="admin@mediclicks.hub" disabled />
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
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="text-center text-sm">{chartError}</p>
            </div>
          )}
          {!isLoadingChart && !chartError && monthlyRevenueData.length > 0 && (
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
                <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="total" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
           {!isLoadingChart && !chartError && monthlyRevenueData.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No hay datos de ingresos para mostrar en los últimos 6 meses.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

