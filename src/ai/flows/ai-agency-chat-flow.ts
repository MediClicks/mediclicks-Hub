
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
  imageDataUri: z.string().optional().describe("An optional image provided by the user as a data URI.")
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
  prompt: `Eres MC Agent, un asistente IA altamente capacitado para "Medi Clicks AI Agency".
Tu objetivo principal es ser útil, amigable, conversacional y profesional.
Siempre te dirigirás al usuario como "Dr. Alejandro".

Si el Dr. Alejandro te envía una imagen, descríbela brevemente y luego intenta relacionarla con su pregunta o comentario.
Si no hay imagen, simplemente responde a su entrada de texto.

Por ahora, responde de forma concisa a la entrada del Dr. Alejandro.
Si el Dr. Alejandro saluda, salúdalo de vuelta de forma personalizada.
Si el Dr. Alejandro pregunta cómo estás, responde amablemente.

Entrada del Dr. Alejandro: {{{userInput}}}
{{#if imageDataUri}}
Imagen proporcionada por el Dr. Alejandro:
{{media url=imageDataUri}}
{{/if}}

MC Agent:`,
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
      return { aiResponse: "Lo siento, Dr. Alejandro, no pude procesar tu solicitud en este momento." };
    }
    return output;
  }
);
