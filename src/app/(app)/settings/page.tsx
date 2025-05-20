
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarChart3, Building, Save, Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from "@/components/ui/textarea";

const agencyDetailsSchema = z.object({
  agencyName: z.string().min(1, "El nombre de la agencia es obligatorio."),
  address: z.string().min(1, "La dirección es obligatoria."),
  taxId: z.string().min(1, "El NIF/CIF es obligatorio."),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Debe ser un email válido.").min(1, "El email de contacto es obligatorio."),
  website: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

type AgencyDetailsFormValues = z.infer<typeof agencyDetailsSchema>;

interface AgencyDetails extends AgencyDetailsFormValues {
  updatedAt?: Date;
}

export default function SettingsPage() {
  const [isDark, setIsDark] = React.useState(false);
  const [isLoadingAgencyDetails, setIsLoadingAgencyDetails] = React.useState(true);
  const { toast } = useToast();

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
  }, [agencyForm, toast]);

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
        website: data.website === '' ? undefined : data.website, // Store undefined if empty string
        updatedAt: serverTimestamp() as unknown as Date, // Firestore will convert this
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
          <CardDescription>Visualiza el rendimiento financiero de tu compañía.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Los gráficos de facturación estarán disponibles aquí próximamente.</p>
            <p className="text-sm">Esta sección mostrará información visual sobre ingresos, facturas pagadas, pendientes, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
