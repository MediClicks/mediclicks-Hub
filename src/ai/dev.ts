
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-social-media-post.ts';
import '@/ai/flows/ai-agency-chat-flow.ts';
import '@/ai/tools/agency-tools.ts'; // Importar el nuevo archivo de herramientas
