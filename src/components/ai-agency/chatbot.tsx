
'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Paperclip, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiAgencyChat, type AiAgencyChatInput } from '@/ai/flows/ai-agency-chat-flow';
import Image from 'next/image';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string; // For displaying images sent by the user
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial greeting from AI
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
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
    removeAttachedImage(); // Clear image after adding to message
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
    <div className="flex flex-col h-[70vh] max-h-[700px] border rounded-lg shadow-sm bg-card">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2 mb-3 max-w-[85%]",
              message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              {message.sender === 'ai' ? (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-lg shadow text-sm",
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-secondary text-secondary-foreground rounded-bl-none'
              )}
            >
              {message.imageUrl && (
                <Image
                  src={message.imageUrl}
                  alt="Adjunto de usuario"
                  width={200}
                  height={200}
                  className="rounded-md mb-2 max-w-full h-auto"
                  data-ai-hint="user attachment"
                />
              )}
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 mb-3 max-w-[85%] mr-auto">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="p-3 rounded-lg shadow text-sm bg-secondary text-secondary-foreground rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </ScrollArea>
       {attachedImage && (
        <div className="p-3 border-t bg-card-foreground/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Image src={attachedImage} alt="Vista previa" width={24} height={24} className="rounded" data-ai-hint="preview thumbnail"/>
            <span className="text-muted-foreground truncate">{attachedImageName || 'Imagen adjunta'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={removeAttachedImage} className="h-6 w-6">
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-3 border-t bg-card-foreground/5"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Adjuntar imagen"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Adjuntar imagen</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageAttach}
          className="hidden"
        />
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pregúntale algo a MC Agent..."
          className="flex-grow resize-none min-h-[40px] max-h-[120px] text-sm bg-background"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !attachedImage)}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
