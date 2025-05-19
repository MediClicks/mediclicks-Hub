// 'use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting social media posts based on client profile and content type.
 *
 * The flow takes a client profile and content type as input and returns a suggested social media post.
 * It uses the `ai.definePrompt` and `ai.defineFlow` methods from Genkit.
 *
 * @interface SuggestSocialMediaPostInput - Defines the input schema for the suggestSocialMediaPost function.
 * @interface SuggestSocialMediaPostOutput - Defines the output schema for the suggestSocialMediaPost function.
 * @function suggestSocialMediaPost - The main function that triggers the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSocialMediaPostInputSchema = z.object({
  clientProfile: z
    .string()
    .describe('The profile of the client, including their brand, values, and target audience.'),
  contentType: z
    .string()
    .describe(
      'The type of content to generate, e.g., "Instagram post", "Facebook update", "Tweet", or "LinkedIn article".'
    ),
});
export type SuggestSocialMediaPostInput = z.infer<typeof SuggestSocialMediaPostInputSchema>;

const SuggestSocialMediaPostOutputSchema = z.object({
  suggestedPost: z.string().describe('The suggested social media post text.'),
});
export type SuggestSocialMediaPostOutput = z.infer<typeof SuggestSocialMediaPostOutputSchema>;

export async function suggestSocialMediaPost(
  input: SuggestSocialMediaPostInput
): Promise<SuggestSocialMediaPostOutput> {
  return suggestSocialMediaPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSocialMediaPostPrompt',
  input: {schema: SuggestSocialMediaPostInputSchema},
  output: {schema: SuggestSocialMediaPostOutputSchema},
  prompt: `You are a social media expert. Based on the client profile and content type provided, generate a social media post.

Client Profile: {{{clientProfile}}}
Content Type: {{{contentType}}}

Suggested Post:`,
});

const suggestSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'suggestSocialMediaPostFlow',
    inputSchema: SuggestSocialMediaPostInputSchema,
    outputSchema: SuggestSocialMediaPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
