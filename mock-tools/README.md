# Mock Tools API

A lightweight Express/TypeScript API server that provides mock endpoints for testing workflow systems.

> **Note**: This server uses `/mock/search` and `/mock/internal/*` endpoints. If integrating with the func-workflow Azure Functions, ensure the activity functions use the correct endpoint paths and request body field names (`queryText`, `maxResults`, `title`, `description`).

## Features

- **Mock Search API**: Simulates document search functionality with realistic data
- **Mock Internal System API**: Simulates submission processing with status tracking
- **TypeScript**: Fully typed codebase for better development experience
- **CORS Support**: Configurable CORS for cross-origin requests
- **Status Transitions**: Automatic status updates (Received → InReview → Completed)
- **In-Memory Storage**: Fast, stateless operation suitable for testing

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
cd mock-tools
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Environment variables:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `MOCK_SEARCH_DELAY_MS`: Simulated search delay in milliseconds (default: 500)
- `MOCK_STATUS_TRANSITION_DELAY_MS`: Time between status transitions (default: 5000)

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

## API Documentation

### Base URL

```
http://localhost:3001
```

### Endpoints

#### 1. Health Check

Check server status.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "service": "mock-tools-api",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

#### 2. Mock Search API

Search for documents based on a query.

**Endpoint:** `POST /mock/search`

**Request Body:**

```json
{
  "queryText": "Azure Functions",
  "maxResults": 5
}
```

**Parameters:**

- `queryText` (required): Search query string
- `maxResults` (optional): Maximum number of results to return (default: 5)

**Response:**

```json
{
  "query": "Azure Functions",
  "totalResults": 3,
  "results": [
    {
      "docId": "DOC-2024-001",
      "title": "Azure Functions Best Practices Guide",
      "summary": "Comprehensive guide covering best practices...",
      "score": 0.95,
      "author": "Azure Team",
      "date": "2024-01-15",
      "url": "https://docs.microsoft.com/azure/functions/best-practices"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3001/mock/search \
  -H "Content-Type: application/json" \
  -d '{"queryText": "Azure Functions", "maxResults": 5}'
```

---

#### 3. Submit to Internal System

Create a new submission.

**Endpoint:** `POST /mock/internal/submit`

**Request Body:**

```json
{
  "title": "New Feature Request",
  "description": "Detailed description of the feature request",
  "metadata": {
    "priority": "high",
    "category": "enhancement"
  }
}
```

**Parameters:**

- `title` (required): Submission title
- `description` (required): Detailed description
- `metadata` (optional): Additional metadata

**Response:**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Received",
  "message": "Submission received successfully",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "estimatedCompletionTime": "2024-01-15T10:30:10.000Z"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3001/mock/internal/submit \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Feature Request",
    "description": "Detailed description"
  }'
```

---

#### 4. Get Submission Status

Retrieve the status of a submission.

**Endpoint:** `GET /mock/internal/status/:requestId`

**Parameters:**

- `requestId` (path parameter): The unique submission ID

**Response:**

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "InReview",
  "title": "New Feature Request",
  "description": "Detailed description",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:05.000Z",
  "estimatedCompletionTime": "2024-01-15T10:30:10.000Z",
  "message": "Your submission is currently under review by our team"
}
```

**Status Lifecycle:**

1. **Received**: Initial state when submission is created
2. **InReview**: Transitions after `MOCK_STATUS_TRANSITION_DELAY_MS` (default: 5s)
3. **Completed**: Final state after 2x `MOCK_STATUS_TRANSITION_DELAY_MS` (default: 10s)

**cURL Example:**

```bash
curl http://localhost:3001/mock/internal/status/550e8400-e29b-41d4-a716-446655440000
```

---

#### 5. List All Submissions (Bonus)

Get a list of all submissions.

**Endpoint:** `GET /mock/internal/submissions`

**Response:**

```json
{
  "total": 2,
  "submissions": [
    {
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "Completed",
      "title": "New Feature Request",
      "submittedAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:10.000Z"
    }
  ]
}
```

**cURL Example:**

```bash
curl http://localhost:3001/mock/internal/submissions
```

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

**400 Bad Request:**

```json
{
  "error": "Bad Request",
  "message": "queryText is required and must be a non-empty string"
}
```

**404 Not Found:**

```json
{
  "error": "Not Found",
  "message": "Submission with requestId xyz not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Project Structure

```
mock-tools/
├── src/
│   ├── search/
│   │   └── searchRouter.ts       # Search API endpoints
│   ├── internal/
│   │   └── internalRouter.ts     # Internal system API endpoints
│   ├── utils/
│   │   └── statusManager.ts      # Status tracking utility
│   └── server.ts                 # Main server setup
├── dist/                         # Compiled JavaScript (generated)
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Development

### Adding New Endpoints

1. Create a new router file in the appropriate directory
2. Define TypeScript interfaces for request/response
3. Implement endpoint handlers with error handling
4. Mount the router in `server.ts`
5. Update this README with API documentation

### Mock Data

Mock data is stored in-memory and resets when the server restarts. To modify:

- **Search documents**: Edit `mockDocuments` array in `src/search/searchRouter.ts`
- **Status transitions**: Adjust timing in `src/utils/statusManager.ts`

## Testing with Postman/Insomnia

Import the following collection:

1. Health Check: `GET http://localhost:3001/health`
2. Search: `POST http://localhost:3001/mock/search`
3. Submit: `POST http://localhost:3001/mock/internal/submit`
4. Status: `GET http://localhost:3001/mock/internal/status/:requestId`

## Integration Example

```typescript
// Search for documents
const searchResponse = await fetch('http://localhost:3001/mock/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    queryText: 'Azure Functions',
    maxResults: 5,
  }),
});
const searchData = await searchResponse.json();

// Submit to internal system
const submitResponse = await fetch('http://localhost:3001/mock/internal/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Feature Request',
    description: 'Details here',
  }),
});
const submitData = await submitResponse.json();
const requestId = submitData.requestId;

// Check status
const statusResponse = await fetch(
  `http://localhost:3001/mock/internal/status/${requestId}`
);
const statusData = await statusResponse.json();
```

## License

MIT

## Support

For issues or questions, please contact the development team.
