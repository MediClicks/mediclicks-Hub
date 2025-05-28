import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
  // Optional. Specify a default model.
  model: googleAI.model('gemini-2.0-flash'),
});

async function run() {
  const response = await ai.generate('Invent a menu item for a restaurant with a pirate theme.');
  console.log(response.text);
}

run();