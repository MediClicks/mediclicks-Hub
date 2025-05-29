
'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Paperclip, XCircle, Image as ImageIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiAgencyChat, type AiAgencyChatInput } from '@/ai/flows/ai-agency-chat-flow';
import type { ChatUIMessage, ChatMessage } from '@/types'; // Added ChatMessage
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { saveConversationAction } from '@/app/actions/chatActions';

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

interface ChatbotProps {
  onConversationSaved?: () => void;
}

export function Chatbot({ onConversationSaved }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingConversation, setIsSavingConversation] = useState(false);
  const [isAttachingImage, setIsAttachingImage] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString() + '-ai-greeting',
        sender: 'ai',
        text: '¡Hola, Dr. Alejandro! Soy Il Dottore. ¿En qué puedo ayudarte hoy?',
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleImageAttach = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Archivo no válido',
          description: 'Por favor, selecciona un archivo de imagen (ej. JPG, PNG, GIF).',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
         toast({
          title: 'Imagen Demasiado Grande',
          description: `El tamaño máximo de imagen es de ${MAX_IMAGE_SIZE_MB}MB. Por favor, selecciona una imagen más pequeña.`,
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setIsAttachingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedImageName(file.name);
        setIsAttachingImage(false);
      };
      reader.onerror = () => {
        setIsAttachingImage(false);
        toast({
          title: 'Error al Cargar Imagen',
          description: 'Hubo un problema al procesar la imagen. Intenta de nuevo.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
     // Reset file input to allow selecting the same file again if removed
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && !attachedImage) return;

    const userMessage: ChatUIMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: trimmedInput,
      imageUrl: attachedImage || undefined,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    const inputForAI: AiAgencyChatInput = { userInput: trimmedInput };
    if (attachedImage) {
      inputForAI.imageDataUri = attachedImage;
    }

    setInputValue('');
    removeAttachedImage(); 
    setIsLoading(true);

    try {
      const result = await aiAgencyChat(inputForAI);
      const aiMessage: ChatUIMessage = {
        id: Date.now().toString() + '-ai',
        sender: 'ai',
        text: result.aiResponse,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error calling AI chat flow:', error);
      const errorMessage: ChatUIMessage = {
        id: Date.now().toString() + '-error',
        sender: 'ai',
        text: 'Lo siento, Dr. Alejandro, ocurrió un error al conectar con Il Dottore. Por favor, intenta de nuevo.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar conversaciones.", variant: "destructive" });
      return;
    }
    
    const actualMessages = messages.filter(msg => msg.id !== messages[0]?.id || messages.length > 1); // Exclude initial AI greeting if it's the only message
    if (actualMessages.length === 0 && !attachedImage) { // also check if there was an image that was being sent but not yet added to messages
      toast({ title: "Conversación Vacía", description: "No hay suficiente contenido para guardar.", variant: "default" });
      return;
    }

    setIsSavingConversation(true);
    
    const messagesToSave: ChatMessage[] = actualMessages.map(({ id, ...rest }) => ({
      ...rest,
      // Ensure imageUrl is only included if it exists, to match ChatMessage type
      imageUrl: rest.imageUrl ? rest.imageUrl : undefined,
    }));


    try {
      const result = await saveConversationAction(messagesToSave, user.uid);
      if (result.success && result.id) {
        toast({ title: "Conversación Guardada", description: `La conversación con Il Dottore ha sido guardada.` });
        if (onConversationSaved) {
          onConversationSaved(); 
        }
      } else {
        toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar la conversación.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
      toast({ title: "Error al Guardar", description: "Ocurrió un problema al intentar guardar la conversación.", variant: "destructive" });
    } finally {
      setIsSavingConversation(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(80vh-120px)] min-h-[450px] max-h-[600px] border rounded-lg shadow-md bg-card">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2.5 mb-4 max-w-[85%] sm:max-w-[75%]",
              message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              {message.sender === 'ai' ? (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              )}
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-xl shadow-sm text-sm",
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-secondary text-secondary-foreground rounded-bl-none'
              )}
            >
              {message.imageUrl && (
                <div className="mb-2 relative w-full max-w-[250px] sm:max-w-[300px] aspect-square bg-muted rounded-md overflow-hidden" data-ai-hint="user image attachment">
                  <NextImage
                    src={message.imageUrl}
                    alt="Adjunto de Dr. Alejandro"
                    fill
                    sizes="(max-width: 640px) 250px, 300px"
                    style={{objectFit: "cover"}}
                    className="rounded-md"
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && !isSavingConversation && (
          <div className="flex items-end gap-2.5 mb-4 max-w-[80%] sm:max-w-[75%] mr-auto">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="p-3 rounded-xl shadow-sm text-sm bg-secondary text-secondary-foreground rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        )}
      </ScrollArea>
      
      {attachedImage && (
        <div className="p-3 border-t bg-muted/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate" title={attachedImageName || 'Imagen adjunta'}>
              {attachedImageName || 'Imagen adjunta'}
            </span>
            {isAttachingImage && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          </div>
          <Button variant="ghost" size="icon" onClick={removeAttachedImage} className="h-6 w-6" disabled={isAttachingImage}>
            <XCircle className="h-4 w-4 text-destructive hover:text-destructive/80" />
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-3 border-t bg-card"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isAttachingImage || isSavingConversation}
          title="Adjuntar imagen"
          className="hover:bg-primary/10"
        >
          {isAttachingImage ? <Loader2 className="h-5 w-5 animate-spin text-primary"/> : <Paperclip className="h-5 w-5 text-primary/80" />}
          <span className="sr-only">Adjuntar imagen</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageAttach}
          className="hidden"
          disabled={isAttachingImage || isSavingConversation}
        />
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Dr. Alejandro, pregúntale algo a Il Dottore..."
          className="flex-grow resize-none min-h-[40px] max-h-[120px] text-sm bg-background focus-visible:ring-primary/50 overflow-y-auto"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isSavingConversation) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading || isAttachingImage || isSavingConversation}
        />
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          onClick={handleSaveConversation} 
          disabled={isLoading || isSavingConversation || (messages.length < 2 && !attachedImage) }
          title="Guardar Conversación"
          className="hover:bg-green-500/10 border-green-500 text-green-600"
        >
          {isSavingConversation ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5" />}
          <span className="sr-only">Guardar</span>
        </Button>
        <Button type="submit" size="icon" disabled={isLoading || isAttachingImage || (!inputValue.trim() && !attachedImage) || isSavingConversation} className="bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
