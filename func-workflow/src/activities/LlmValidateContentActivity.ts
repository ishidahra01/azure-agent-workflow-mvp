/**
 * Activity: Validate content using Azure OpenAI
 */

import { app, InvocationContext } from '@azure/functions';
import { AoaiClient } from '../shared/aoaiClient';
import { SearchResult, ValidationResult } from '../shared/models';

export interface LlmValidateContentInput {
  extractedText: string;
  searchResults: SearchResult[];
}

export interface LlmValidateContentOutput {
  validationResult: ValidationResult;
}

export async function llmValidateContent(
  input: LlmValidateContentInput,
  context: InvocationContext
): Promise<LlmValidateContentOutput> {
  context.log('Validating content using Azure OpenAI');

  try {
    const aoaiClient = new AoaiClient();
    const validationResult = await aoaiClient.validateContent(
      input.extractedText,
      input.searchResults
    );

    context.log(
      `Validation result: ${validationResult.isValid ? 'VALID' : 'INVALID'}`
    );

    if (!validationResult.isValid) {
      context.log(`Issues found: ${JSON.stringify(validationResult.issues)}`);
    }

    return {
      validationResult,
    };
  } catch (error: any) {
    context.error(`Error validating content: ${error.message}`);
    throw new Error(`Content validation failed: ${error.message}`);
  }
}

app.activity('LlmValidateContentActivity', {
  handler: llmValidateContent,
});
