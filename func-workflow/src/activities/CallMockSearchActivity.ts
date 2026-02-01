/**
 * Activity: Call mock search API to find precedents
 */

import { app, InvocationContext } from '@azure/functions';
import axios from 'axios';
import { config } from '../shared/config';
import { SearchResult } from '../shared/models';

export interface CallMockSearchInput {
  searchQuery: string;
}

export interface CallMockSearchOutput {
  searchResults: SearchResult[];
}

export async function callMockSearch(
  input: CallMockSearchInput,
  context: InvocationContext
): Promise<CallMockSearchOutput> {
  context.log(`Calling mock search API with query: ${input.searchQuery}`);

  try {
    const response = await axios.post(
      `${config.mockTools.baseUrl}/api/search`,
      {
        query: input.searchQuery,
        limit: 5,
      },
      {
        timeout: 10000, // 10 seconds
      }
    );

    const searchResults: SearchResult[] = response.data.results || [];

    context.log(`Found ${searchResults.length} search results`);

    return {
      searchResults,
    };
  } catch (error: any) {
    context.error(`Error calling mock search API: ${error.message}`);

    // If the mock API is not available, return mock data for testing
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      context.warn('Mock API not available, returning mock search results');
      return {
        searchResults: [
          {
            id: 'mock-1',
            title: 'Similar Approval Document 1',
            content:
              'This is a mock precedent document for testing purposes. It contains sample approval content.',
            relevanceScore: 0.95,
          },
          {
            id: 'mock-2',
            title: 'Similar Approval Document 2',
            content:
              'Another mock precedent with relevant approval information and guidelines.',
            relevanceScore: 0.87,
          },
          {
            id: 'mock-3',
            title: 'Reference Approval Template',
            content:
              'A template document showing standard approval format and requirements.',
            relevanceScore: 0.82,
          },
        ],
      };
    }

    throw new Error(`Mock search API call failed: ${error.message}`);
  }
}

app.activity('CallMockSearchActivity', {
  handler: callMockSearch,
});
