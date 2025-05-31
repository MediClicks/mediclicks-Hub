
'use server';
/**
 * @fileOverview A Genkit flow for Il Dottore, the AI assistant for Medi Clicks AI Agency.
 *
 * - aiAgencyChat - A function that handles chat interactions with Il Dottore.
 * - AiAgencyChatInput - The input type for the aiAgencyChat function.
 * - AiAgencyChatOutput - The return type for the aiAgencyChat function.
 */

import { ai } from '@/ai/genkit';
import { z, recall, remember } from 'genkit'; // Import recall and remember from 'genkit'
import { getClientCountTool, getUpcomingTasksTool, getClientDetailsTool, getBillingSummaryTool } from '@/ai/tools/agency-tools';

const AiAgencyChatInputSchema = z.object({
  userInput: z.string().describe("The user's message to the AI assistant."),
  imageDataUri: z.string().optional().describe("An optional image provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.")
});
export type AiAgencyChatInput = z.infer<typeof AiAgencyChatInputSchema>;

const AiAgencyChatOutputSchema = z.object({
  aiResponse: z.string().describe("Il Dottore's response."),
});
export type AiAgencyChatOutput = z.infer<typeof AiAgencyChatOutputSchema>;

export async function aiAgencyChat(input: AiAgencyChatInput): Promise<AiAgencyChatOutput> {
  return aiAgencyChatFlow(input);
}

const agencyChatPrompt = ai.definePrompt({
  name: 'aiAgencyChatPrompt',
  input: { schema: AiAgencyChatInputSchema },
  output: { schema: AiAgencyChatOutputSchema },
  tools: [getClientCountTool, getUpcomingTasksTool, getClientDetailsTool, getBillingSummaryTool],
  system: `Eres "Il Dottore", un asistente IA altamente capacitado, amigable y la mano derecha para "Medi Clicks AI Agency".
Tu objetivo principal es ser útil, conversacional y profesional en todas tus interacciones con el Dr. Alejandro.
Siempre te dirigirás al usuario como "Dr. Alejandro".

Contexto de la Conversación:
- El Dr. Alejandro es el director de Medi Clicks AI Agency.
- Tus respuestas deben ser concisas y directas al punto, a menos que el Dr. Alejandro solicite más detalles.

Interacción con Imágenes:
- Si el Dr. Alejandro te envía una imagen, primero descríbela brevemente de forma objetiva.
- Luego, intenta relacionar la imagen con su pregunta o comentario.
- Si no hay pregunta o comentario junto con la imagen, simplemente describe la imagen y pregúntale cómo puedes ayudarle con respecto a ella.
- Si no hay imagen, simplemente responde a su entrada de texto.

Capacidades con Herramientas:
- Si el Dr. Alejandro pregunta sobre el número total de clientes, utiliza la herramienta 'getClientCountTool' para obtener esta información y preséntala de forma clara.
- Si el Dr. Alejandro pregunta sobre tareas próximas o pendientes para los próximos días, utiliza la herramienta 'getUpcomingTasksTool'.
  - Informa al Dr. Alejandro de los resultados de esta herramienta de manera clara y concisa.
  - Si hay tareas, preséntalas listando el nombre de la tarea, el cliente (si existe) y su fecha de vencimiento. Por ejemplo: "Aquí tiene un resumen de las tareas próximas, Dr. Alejandro: - Tarea X (Cliente Y) vence el DD/MM/YYYY. - Tarea Z vence el DD/MM/YYYY."
  - Si la herramienta indica que no hay tareas, informa al Dr. Alejandro de ello.
- Si el Dr. Alejandro pregunta sobre detalles de un cliente específico (por ejemplo, 'dime sobre el cliente X', 'cuál es el email de Y', 'qué servicios tiene Z'), utiliza la herramienta 'getClientDetailsTool' para buscar al cliente por su nombre exacto.
  - Presenta la información encontrada de forma clara y concisa.
  - Si la herramienta indica que el cliente no fue encontrado, informa amablemente al Dr. Alejandro.
  - Si la herramienta devuelve un error al buscar, informa que tuviste un problema buscando al cliente.

- Si el Dr. Alejandro pregunta sobre facturación, ingresos, o estados de cuenta, utiliza la herramienta 'getBillingSummaryTool'.
  - Si el Dr. Alejandro especifica un año en su pregunta (ej. "ingresos de 2023", "facturación del año pasado"), utiliza ese año como parámetro para la herramienta.
  - Si no especifica un año, utiliza la herramienta sin un parámetro de año para obtener el resumen del año actual.

Saludos y Respuestas Generales:
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
      return { aiResponse: "Lo siento, Dr. Alejandro, parece que he tenido un pequeño inconveniente procesando tu solicitud. ¿Podrías intentar de nuevo o reformular tu pregunta?" };
    }

    // Store the conversation in memory.
    // await remember({ // Comentado debido a TypeError: remember is not a function.
    // key: 'agency-chat-history', // Esto sugiere una incompatibilidad de versión de Genkit o un problema de bundling.
    // value: { userInput: input.userInput, aiResponse: output.aiResponse }, // La funcionalidad de recordar el historial del chat en memoria estará desactivada temporalmente.
    // userId: 'Dr. Alejandro', // Assuming 'Dr. Alejandro' is the user identifier
    // });

    return output;
  }
);
