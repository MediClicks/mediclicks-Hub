
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Copy } from 'lucide-react';
import { suggestSocialMediaPost, type SuggestSocialMediaPostInput } from '@/ai/flows/suggest-social-media-post';
import { useToast } from '@/hooks/use-toast';
import { mockClients } from '@/lib/data';

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Por favor, selecciona un cliente.' }),
  clientProfile: z.string().min(50, {
    message: 'El perfil del cliente debe tener al menos 50 caracteres.',
  }),
  contentType: z.string().min(1, { message: 'Por favor, selecciona un tipo de contenido.' }),
  tone: z.string().min(1, {message: 'Por favor, selecciona un tono.'}),
});

type SuggestionFormValues = z.infer<typeof formSchema>;

export function SuggestionForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestedPost, setSuggestedPost] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      clientProfile: '',
      contentType: '',
      tone: 'Profesional',
    },
  });
  
  const selectedClientId = form.watch('clientId');

  React.useEffect(() => {
    if (selectedClientId) {
      const selectedClient = mockClients.find(client => client.id === selectedClientId);
      if (selectedClient) {
        form.setValue('clientProfile', selectedClient.profileSummary);
      }
    } else {
        form.setValue('clientProfile', '');
    }
  }, [selectedClientId, form]);


  async function onSubmit(values: SuggestionFormValues) {
    setIsLoading(true);
    setSuggestedPost(null);
    try {
      const input: SuggestSocialMediaPostInput = {
        clientProfile: `${values.clientProfile} Tono deseado: ${values.tone}.`,
        contentType: values.contentType,
      };
      const result = await suggestSocialMediaPost(input);
      setSuggestedPost(result.suggestedPost);
      toast({
        title: "¡Sugerencia Generada!",
        description: "Tu nueva idea para redes sociales está lista.",
      });
    } catch (error) {
      console.error('Error generando sugerencia:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la sugerencia. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (suggestedPost) {
      navigator.clipboard.writeText(suggestedPost);
      toast({
        title: "¡Copiado al Portapapeles!",
        description: "La publicación sugerida ha sido copiada.",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Sparkles className="mr-2 h-6 w-6 text-accent" />
          Sugerencias de Contenido IA
        </CardTitle>
        <CardDescription>
          Genera ideas para publicaciones en redes sociales adaptadas a tus clientes.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil del Cliente</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Introduce la marca del cliente, valores, público objetivo, etc."
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Proporciona un perfil detallado para mejores sugerencias. Se rellenará automáticamente al seleccionar un cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contenido</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de contenido" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Publicación para Instagram">Publicación para Instagram</SelectItem>
                        <SelectItem value="Actualización para Facebook">Actualización para Facebook</SelectItem>
                        <SelectItem value="Tweet / Publicación para X">Tweet / Publicación para X</SelectItem>
                        <SelectItem value="Extracto Artículo LinkedIn">Extracto Artículo LinkedIn</SelectItem>
                        <SelectItem value="Idea Corta para Blog">Idea Corta para Blog</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tono Deseado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tono deseado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Profesional">Profesional</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Ingenioso">Ingenioso</SelectItem>
                        <SelectItem value="Informativo">Informativo</SelectItem>
                        <SelectItem value="Amigable">Amigable</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generar Sugerencia
            </Button>

            {suggestedPost && (
              <div className="mt-6 p-4 border rounded-md bg-secondary/50 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Publicación Sugerida:</h3>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4"/> Copiar
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-line">{suggestedPost}</p>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
