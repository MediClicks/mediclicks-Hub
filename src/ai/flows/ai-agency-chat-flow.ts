
'use server';
/**
 * @fileOverview A Genkit flow for the Medi Clicks AI Agency chatbot.
 *
 * - aiAgencyChat - A function that handles chat interactions.
 * - AiAgencyChatInput - The input type for the aiAgencyChat function.
 * - AiAgencyChatOutput - The return type for the aiAgencyChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiAgencyChatInputSchema = z.object({
  userInput: z.string().describe("The user's message to the AI assistant."),
});
export type AiAgencyChatInput = z.infer<typeof AiAgencyChatInputSchema>;

const AiAgencyChatOutputSchema = z.object({
  aiResponse: z.string().describe("The AI assistant's response."),
});
export type AiAgencyChatOutput = z.infer<typeof AiAgencyChatOutputSchema>;

export async function aiAgencyChat(input: AiAgencyChatInput): Promise<AiAgencyChatOutput> {
  return aiAgencyChatFlow(input);
}

const agencyChatPrompt = ai.definePrompt({
  name: 'aiAgencyChatPrompt',
  input: { schema: AiAgencyChatInputSchema },
  output: { schema: AiAgencyChatOutputSchema },
  prompt: `Eres un asistente IA para "Medi Clicks AI Agency".
Tu objetivo principal es ser útil, amigable y conversacional.
Por ahora, responde de forma concisa a la entrada del usuario.
Si el usuario saluda, salúdalo de vuelta.
Si el usuario pregunta cómo estás, responde amablemente.

Usuario: {{{userInput}}}
Asistente:`,
});

const aiAgencyChatFlow = ai.defineFlow(
  {
    name: 'aiAgencyChatFlow',
    inputSchema: AiAgencyChatInputSchema,
    outputSchema: AiAgencyChatOutputSchema,
  },
  async (input) => {
    const { output } = await agencyChatPrompt(input);
    if (!output) {
      return { aiResponse: "Lo siento, no pude procesar tu solicitud en este momento." };
    }
    return output;
  }
);
