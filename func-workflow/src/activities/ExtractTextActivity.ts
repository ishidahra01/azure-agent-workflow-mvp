/**
 * Activity: Extract text from input document
 */

import { app, InvocationContext } from '@azure/functions';

export interface ExtractTextInput {
  rawContent: string;
  documentId: string;
}

export interface ExtractTextOutput {
  extractedText: string;
}

export async function extractText(
  input: ExtractTextInput,
  context: InvocationContext
): Promise<ExtractTextOutput> {
  context.log(`Extracting text from document: ${input.documentId}`);

  try {
    // In a real implementation, this would:
    // - Parse different file formats (PDF, Word, etc.)
    // - Extract text using appropriate libraries
    // - Clean and normalize the text
    // For this MVP, we'll simulate text extraction

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simple text extraction (in real app, would handle binary formats)
    const extractedText = input.rawContent.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    context.log(
      `Successfully extracted ${extractedText.length} characters from document`
    );

    return {
      extractedText,
    };
  } catch (error: any) {
    context.error(`Error extracting text: ${error.message}`);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

app.activity('ExtractTextActivity', {
  handler: extractText,
});
