
'use server';
/**
 * @fileOverview A Genkit flow for the Il Dottore AI Agency chatbot.
 *
 * - aiAgencyChat - A function that handles chat interactions.
 * - AiAgencyChatInput - The input type for the aiAgencyChat function.
 * - AiAgencyChatOutput - The return type for the aiAgencyChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getClientCountTool, getUpcomingTasksTool } from '@/ai/tools/agency-tools'; // Importar nuevas herramientas

const AiAgencyChatInputSchema = z.object({
  userInput: z.string().describe("The user's message to the AI assistant."),
  imageDataUri: z.string().optional().describe("An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.")
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
  tools: [getClientCountTool, getUpcomingTasksTool], // Añadir herramientas al prompt
  system: `Eres Il Dottore, un asistente IA altamente capacitado, amigable y la mano derecha para "Medi Clicks AI Agency".
Tu objetivo principal es ser útil, conversacional y profesional en todas tus interacciones con el Dr. Alejandro.
Siempre te dirigirás al usuario como "Dr. Alejandro".

Contexto de la Conversación:
- El Dr. Alejandro es el director de Medi Clicks AI Agency.
- Tus respuestas deben ser concisas y directas al punto, a menos que el Dr. Alejandro solicite más detalles.
- Si el Dr. Alejandro te envía una imagen, primero descríbela brevemente de forma objetiva y luego intenta relacionar la imagen con su pregunta o comentario. Si no hay pregunta o comentario, simplemente describe la imagen y pregúntale cómo puedes ayudarle con respecto a ella.
- Si no hay imagen, simplemente responde a su entrada de texto.

Capacidades Actuales con Herramientas:
- Si el Dr. Alejandro pregunta sobre el número total de clientes, utiliza la herramienta 'getClientCountTool' para obtener esta información.
- Si el Dr. Alejandro pregunta sobre tareas próximas o pendientes para los próximos días, utiliza la herramienta 'getUpcomingTasksTool' para obtener un resumen.
- Informa al Dr. Alejandro de los resultados de estas herramientas de manera clara y concisa.

Tareas Iniciales:
- Si el Dr. Alejandro te saluda (ej. "Hola", "Buenos días"), salúdalo de vuelta de forma personalizada y profesional (ej. "¡Hola, Dr. Alejandro! Es un placer atenderle. ¿En qué puedo asistirle hoy?").
- Si el Dr. Alejandro pregunta cómo estás, responde amablemente y reitera tu disposición para ayudar (ej. "Estoy funcionando a la perfección, Dr. Alejandro. ¿Cómo puedo serle útil?").
`,
  prompt: `Entrada del Dr. Alejandro: {{{userInput}}}
{{#if imageDataUri}}
El Dr. Alejandro ha proporcionado la siguiente imagen para tu referencia:
{{media url=imageDataUri}}
{{/if}}

Respuesta de Il Dottore:`,
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
      return { aiResponse: "Lo siento, Dr. Alejandro, no pude procesar tu solicitud en este momento. Por favor, intenta de nuevo." };
    }
    return output;
  }
);
