import { Router, Request, Response } from 'express';

const router = Router();

interface SearchDocument {
  docId: string;
  title: string;
  summary: string;
  score: number;
  author: string;
  date: string;
  url: string;
}

interface SearchRequest {
  queryText: string;
  maxResults?: number;
}

interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchDocument[];
  timestamp: string;
}

// Mock document database
const mockDocuments: SearchDocument[] = [
  {
    docId: 'DOC-2024-001',
    title: 'Azure Functions Best Practices Guide',
    summary: 'Comprehensive guide covering best practices for developing, deploying, and managing Azure Functions including performance optimization, error handling, and security considerations.',
    score: 0.95,
    author: 'Azure Team',
    date: '2024-01-15',
    url: 'https://docs.microsoft.com/azure/functions/best-practices',
  },
  {
    docId: 'DOC-2024-002',
    title: 'Workflow Orchestration Patterns',
    summary: 'Design patterns and implementation strategies for building scalable workflow orchestration systems with event-driven architectures and state management.',
    score: 0.92,
    author: 'Engineering Blog',
    date: '2024-01-20',
    url: 'https://engineering.example.com/workflow-patterns',
  },
  {
    docId: 'DOC-2024-003',
    title: 'API Integration Security Guidelines',
    summary: 'Security best practices for integrating with external APIs including authentication, authorization, rate limiting, and data validation strategies.',
    score: 0.88,
    author: 'Security Team',
    date: '2024-01-10',
    url: 'https://security.example.com/api-guidelines',
  },
  {
    docId: 'DOC-2023-045',
    title: 'TypeScript Design Patterns for Enterprise Applications',
    summary: 'Advanced TypeScript patterns including dependency injection, decorators, generics, and type-safe API design for large-scale applications.',
    score: 0.85,
    author: 'Tech Lead',
    date: '2023-12-05',
    url: 'https://blog.example.com/typescript-patterns',
  },
  {
    docId: 'DOC-2023-087',
    title: 'Microservices Communication Strategies',
    summary: 'Exploring synchronous and asynchronous communication patterns between microservices including REST, gRPC, message queues, and event streams.',
    score: 0.82,
    author: 'Architecture Team',
    date: '2023-11-20',
    url: 'https://architecture.example.com/microservices',
  },
  {
    docId: 'DOC-2024-004',
    title: 'Error Handling and Retry Logic in Distributed Systems',
    summary: 'Strategies for implementing robust error handling, retry mechanisms, circuit breakers, and fallback patterns in distributed architectures.',
    score: 0.80,
    author: 'Platform Team',
    date: '2024-01-08',
    url: 'https://platform.example.com/error-handling',
  },
  {
    docId: 'DOC-2023-112',
    title: 'Azure Durable Functions Deep Dive',
    summary: 'In-depth exploration of Azure Durable Functions including orchestration patterns, entity management, and handling long-running workflows.',
    score: 0.78,
    author: 'Azure Team',
    date: '2023-10-15',
    url: 'https://docs.microsoft.com/azure/durable-functions',
  },
  {
    docId: 'DOC-2024-005',
    title: 'Mock Data Strategies for Testing',
    summary: 'Best practices for creating realistic mock data, stubs, and test fixtures to improve test coverage and development velocity.',
    score: 0.75,
    author: 'QA Team',
    date: '2024-01-12',
    url: 'https://testing.example.com/mock-strategies',
  },
];

// Simple keyword-based search function
function searchDocuments(query: string, maxResults: number = 5): SearchDocument[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/);

  // Score documents based on keyword matches
  const scoredDocs = mockDocuments.map((doc) => {
    let matchScore = doc.score;
    const searchText = `${doc.title} ${doc.summary} ${doc.author}`.toLowerCase();

    keywords.forEach((keyword) => {
      if (searchText.includes(keyword)) {
        matchScore += 0.1;
      }
    });

    return { ...doc, score: Math.min(matchScore, 1.0) };
  });

  // Sort by score and return top results
  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// POST /mock/search
router.post('/', async (req: Request, res: Response) => {
  try {
    const { queryText, maxResults = 5 }: SearchRequest = req.body;

    if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'queryText is required and must be a non-empty string',
      });
      return;
    }

    console.log(`[Search API] Query: "${queryText}", maxResults: ${maxResults}`);

    // Simulate network delay
    const delay = parseInt(process.env.MOCK_SEARCH_DELAY_MS || '500', 10);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const results = searchDocuments(queryText, maxResults);

    const response: SearchResponse = {
      query: queryText,
      totalResults: results.length,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Search API] Returning ${results.length} results`);
    res.json(response);
  } catch (error) {
    console.error('[Search API] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the search request',
    });
  }
});

export default router;
