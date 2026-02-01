# Azure Durable Functions Workflow Backend

This is the backend implementation of the Ringi (approval document) workflow system using Azure Durable Functions with TypeScript.

## Architecture

The workflow consists of:

### Orchestrator
- **RingiOrchestrator**: Main workflow orchestration that coordinates all activities and handles human-in-the-loop interactions

### Activities
1. **ExtractTextActivity**: Extract text from input document
2. **LlmGenerateSearchQueryActivity**: Generate search query using Azure OpenAI
3. **CallMockSearchActivity**: Search for precedent documents
4. **LlmValidateContentActivity**: Validate content against precedents
5. **LlmGenerateDraftActivity**: Generate draft document using AI
6. **CallMockInternalSubmitActivity**: Submit to internal system
7. **CallMockInternalStatusActivity**: Poll submission status

### HTTP Endpoints
- `POST /api/workflows/start`: Start a new workflow
- `GET /api/workflows/status/{instanceId}`: Get workflow status
- `POST /api/workflows/{instanceId}/events/human-fix`: Send human fix for validation issues
- `POST /api/workflows/{instanceId}/events/draft-approval`: Approve or reject draft

## Workflow Steps

1. **Text Extraction**: Extract text from raw document content
2. **Search Query Generation**: Use Azure OpenAI to generate search query
3. **Precedent Search**: Find similar documents using mock search API
4. **Content Validation**: Validate content against precedents using AI
5. **Human Fix (if needed)**: Wait for human to fix validation issues
6. **Draft Generation**: Generate formal document using AI
7. **Draft Approval**: Wait for human approval of draft
8. **Submission**: Submit to internal system
9. **Status Polling**: Poll until submission is complete

## Setup

### Prerequisites
- Node.js 18+
- Azure Functions Core Tools v4
- Azure Storage Emulator (Azurite) for local development

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` or update `local.settings.json`:

```bash
cp .env.example .env
```

Required environment variables:
- `AOAI_BASE_URL`: Azure OpenAI endpoint URL
- `AOAI_DEPLOYMENT`: Azure OpenAI deployment name
- `AOAI_API_KEY`: Azure OpenAI API key
- `MOCK_TOOLS_BASE_URL`: Mock tools API endpoint

### Build

```bash
npm run build
```

### Run Locally

```bash
npm start
```

The functions will be available at `http://localhost:7071/api/`

## Usage Examples

### Start a Workflow

```bash
curl -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc-123",
    "requestorId": "user-456",
    "rawContent": "This is a proposal for...",
    "metadata": {}
  }'
```

Response:
```json
{
  "instanceId": "abc123...",
  "statusQueryGetUri": "http://...",
  "sendEventPostUri": "http://...",
  "terminatePostUri": "http://...",
  "purgeHistoryDeleteUri": "http://..."
}
```

### Check Workflow Status

```bash
curl http://localhost:7071/api/workflows/status/{instanceId}
```

### Send Human Fix

When validation fails and workflow is waiting for human fix:

```bash
curl -X POST http://localhost:7071/api/workflows/{instanceId}/events/human-fix \
  -H "Content-Type: application/json" \
  -d '{
    "correctedContent": "Corrected document content...",
    "notes": "Fixed the issues mentioned"
  }'
```

### Approve/Reject Draft

When workflow is waiting for draft approval:

```bash
curl -X POST http://localhost:7071/api/workflows/{instanceId}/events/draft-approval \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Looks good!",
    "modifications": "Optional modified content"
  }'
```

## Project Structure

```
func-workflow/
├── src/
│   ├── activities/           # Activity functions
│   ├── orchestrators/        # Orchestrator functions
│   ├── functions/            # HTTP trigger functions
│   └── shared/              # Shared code
│       ├── models.ts        # TypeScript interfaces
│       ├── config.ts        # Configuration
│       └── aoaiClient.ts    # Azure OpenAI client
├── host.json                # Azure Functions host config
├── local.settings.json      # Local environment variables
├── package.json
└── tsconfig.json
```

## Features

- **Human-in-the-Loop**: Built-in support for human intervention at validation and approval stages
- **Timeout Handling**: Configurable timeouts for human interactions
- **Status Polling**: Automatic polling of external system status
- **Loop Prevention**: Maximum attempt limits to prevent infinite loops
- **Error Handling**: Comprehensive error handling and reporting
- **State Management**: Workflow state tracked with customStatus
- **Retry Logic**: Activity-level retry policies (can be configured)

## Development

### Watch Mode

```bash
npm run watch
```

### Clean Build

```bash
npm run clean
npm run build
```

## Deployment

To deploy to Azure:

1. Create an Azure Functions app with Durable Functions support
2. Configure application settings (environment variables)
3. Deploy using Azure Functions Core Tools or CI/CD pipeline

```bash
func azure functionapp publish <function-app-name>
```

## Testing

The activities include fallback mock data when the mock APIs are not available, allowing for standalone testing of the orchestration logic.

## License

See LICENSE file in the repository root.
