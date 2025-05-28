
'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Paperclip, XCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiAgencyChat, type AiAgencyChatInput } from '@/ai/flows/ai-agency-chat-flow';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string; // For displaying images sent by the user
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAttachingImage, setIsAttachingImage] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString() + '-ai-greeting',
        sender: 'ai',
        text: '¡Hola, Dr. Alejandro! Soy MC Agent. ¿En qué puedo ayudarte hoy?',
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
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput && !attachedImage) return;

    const userMessage: Message = {
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
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        sender: 'ai',
        text: result.aiResponse,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error calling AI chat flow:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        sender: 'ai',
        text: 'Lo siento, Dr. Alejandro, ocurrió un error al conectar con el asistente. Por favor, intenta de nuevo.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(80vh-120px)] min-h-[400px] max-h-[700px] border rounded-lg shadow-md bg-card">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2.5 mb-4 max-w-[80%] sm:max-w-[75%]",
              message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              {message.sender === 'ai' ? (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <User className="h-5 w-5" />
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
                <div className="mb-2 relative w-full max-w-[250px] aspect-square bg-muted rounded-md overflow-hidden" data-ai-hint="user image attachment">
                  <Image
                    src={message.imageUrl}
                    alt="Adjunto de Dr. Alejandro"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2.5 mb-4 max-w-[80%] sm:max-w-[75%] mr-auto">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
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
          disabled={isLoading || isAttachingImage}
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
          disabled={isAttachingImage}
        />
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Dr. Alejandro, pregúntale algo a MC Agent..."
          className="flex-grow resize-none min-h-[40px] max-h-[120px] text-sm bg-background focus-visible:ring-primary/50"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading || isAttachingImage}
        />
        <Button type="submit" size="icon" disabled={isLoading || isAttachingImage || (!inputValue.trim() && !attachedImage)} className="bg-primary hover:bg-primary/90">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
