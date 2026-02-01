/**
 * Activity: Generate search query using Azure OpenAI
 */

import { app, InvocationContext } from '@azure/functions';
import { AoaiClient } from '../shared/aoaiClient';

export interface LlmGenerateSearchQueryInput {
  extractedText: string;
}

export interface LlmGenerateSearchQueryOutput {
  searchQuery: string;
}

export async function llmGenerateSearchQuery(
  input: LlmGenerateSearchQueryInput,
  context: InvocationContext
): Promise<LlmGenerateSearchQueryOutput> {
  context.log('Generating search query using Azure OpenAI');

  try {
    const aoaiClient = new AoaiClient();
    const searchQuery = await aoaiClient.generateSearchQuery(input.extractedText);

    context.log(`Generated search query: ${searchQuery}`);

    return {
      searchQuery,
    };
  } catch (error: any) {
    context.error(`Error generating search query: ${error.message}`);
    throw new Error(`Search query generation failed: ${error.message}`);
  }
}

app.activity('LlmGenerateSearchQueryActivity', {
  handler: llmGenerateSearchQuery,
});
