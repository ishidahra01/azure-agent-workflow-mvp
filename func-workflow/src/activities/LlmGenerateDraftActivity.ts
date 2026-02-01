/**
 * Activity: Generate draft document using Azure OpenAI
 */

import { app, InvocationContext } from '@azure/functions';
import { AoaiClient } from '../shared/aoaiClient';
import { SearchResult } from '../shared/models';

export interface LlmGenerateDraftInput {
  extractedText: string;
  searchResults: SearchResult[];
}

export interface LlmGenerateDraftOutput {
  draft: string;
}

export async function llmGenerateDraft(
  input: LlmGenerateDraftInput,
  context: InvocationContext
): Promise<LlmGenerateDraftOutput> {
  context.log('Generating draft document using Azure OpenAI');

  try {
    const aoaiClient = new AoaiClient();
    const draft = await aoaiClient.generateDraft(
      input.extractedText,
      input.searchResults
    );

    context.log(`Successfully generated draft (${draft.length} characters)`);

    return {
      draft,
    };
  } catch (error: any) {
    context.error(`Error generating draft: ${error.message}`);
    throw new Error(`Draft generation failed: ${error.message}`);
  }
}

app.activity('LlmGenerateDraftActivity', {
  handler: llmGenerateDraft,
});
