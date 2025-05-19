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
  clientId: z.string().min(1, { message: 'Please select a client.' }),
  clientProfile: z.string().min(50, {
    message: 'Client profile must be at least 50 characters.',
  }),
  contentType: z.string().min(1, { message: 'Please select a content type.' }),
  tone: z.string().min(1, {message: 'Please select a tone.'}),
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
      tone: 'Professional',
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
        clientProfile: `${values.clientProfile} Desired tone: ${values.tone}.`,
        contentType: values.contentType,
      };
      const result = await suggestSocialMediaPost(input);
      setSuggestedPost(result.suggestedPost);
      toast({
        title: "Suggestion Generated!",
        description: "Your new social media post idea is ready.",
      });
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestion. Please try again.",
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
        title: "Copied to Clipboard!",
        description: "The suggested post has been copied.",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Sparkles className="mr-2 h-6 w-6 text-accent" />
          AI Content Suggestions
        </CardTitle>
        <CardDescription>
          Generate social media post ideas tailored to your clients.
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
                  <FormLabel>Select Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
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
                  <FormLabel>Client Profile</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter client brand, values, target audience, etc."
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed profile for better suggestions. This will be auto-filled when you select a client.
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
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Instagram Post">Instagram Post</SelectItem>
                        <SelectItem value="Facebook Update">Facebook Update</SelectItem>
                        <SelectItem value="Tweet / X Post">Tweet / X Post</SelectItem>
                        <SelectItem value="LinkedIn Article Snippet">LinkedIn Article Snippet</SelectItem>
                        <SelectItem value="Short Blog Idea">Short Blog Idea</SelectItem>
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
                    <FormLabel>Desired Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select desired tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Witty">Witty</SelectItem>
                        <SelectItem value="Informative">Informative</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
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
              Generate Suggestion
            </Button>

            {suggestedPost && (
              <div className="mt-6 p-4 border rounded-md bg-secondary/50 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Suggested Post:</h3>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4"/> Copy
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
