/**
 * Azure OpenAI client wrapper
 */

import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import { LlmRequest, LlmResponse } from './models';

export class AoaiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aoai.baseUrl,
      headers: {
        'api-key': config.aoai.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  async generateCompletion(request: LlmRequest): Promise<LlmResponse> {
    try {
      const response = await this.client.post(
        `/openai/deployments/${config.aoai.deployment}/chat/completions?api-version=${config.aoai.apiVersion}`,
        {
          messages: [
            ...(request.systemMessage
              ? [{ role: 'system', content: request.systemMessage }]
              : []),
            { role: 'user', content: request.prompt },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1000,
        }
      );

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Azure OpenAI API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  async generateSearchQuery(extractedText: string): Promise<string> {
    const response = await this.generateCompletion({
      systemMessage:
        'You are an AI assistant that generates search queries for finding precedent documents in a corporate approval system.',
      prompt: `Based on the following document content, generate a concise search query (2-5 keywords) to find similar precedent documents:\n\n${extractedText}`,
      temperature: 0.5,
      maxTokens: 100,
    });

    return response.content.trim();
  }

  async validateContent(
    extractedText: string,
    searchResults: any[]
  ): Promise<{ isValid: boolean; issues?: string[]; suggestions?: string[] }> {
    const precedentsSummary = searchResults
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.title}: ${r.content.substring(0, 200)}`)
      .join('\n');

    const response = await this.generateCompletion({
      systemMessage:
        'You are an AI assistant that validates corporate approval documents against precedents and policies.',
      prompt: `Validate the following document content against these precedents:\n\nDocument:\n${extractedText}\n\nPrecedents:\n${precedentsSummary}\n\nRespond in JSON format with: {"isValid": boolean, "issues": [list of issues], "suggestions": [list of suggestions]}`,
      temperature: 0.3,
      maxTokens: 500,
    });

    try {
      // Extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // If parsing fails, return a default invalid result
    }

    return {
      isValid: false,
      issues: ['Failed to parse validation response'],
      suggestions: [],
    };
  }

  async generateDraft(
    extractedText: string,
    searchResults: any[]
  ): Promise<string> {
    const precedentsSummary = searchResults
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.title}: ${r.content.substring(0, 200)}`)
      .join('\n');

    const response = await this.generateCompletion({
      systemMessage:
        'You are an AI assistant that generates formal corporate approval documents based on input content and precedents.',
      prompt: `Generate a formal approval document based on this content:\n\n${extractedText}\n\nUse these precedents as reference:\n${precedentsSummary}\n\nGenerate a well-structured, professional document.`,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return response.content;
  }
}
