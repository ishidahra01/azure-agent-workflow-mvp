# Azure Agent Workflow MVP

This repository contains an MVP implementation of a Ringi (approval document) workflow system using Azure Durable Functions.

## Project Structure

### func-workflow/
Azure Durable Functions backend implementation using TypeScript and Azure Functions v4.

**Key Components:**
- **Orchestrator**: RingiOrchestrator manages the complete workflow with Human-in-the-Loop support
- **Activities**: 7 activity functions for text extraction, LLM operations, and external API calls
- **HTTP Endpoints**: 4 REST endpoints for workflow management
- **Shared Code**: TypeScript models, configuration, and Azure OpenAI client wrapper

See [func-workflow/README.md](func-workflow/README.md) for detailed documentation.

### mock-tools/
Express/TypeScript API server providing mock endpoints for testing the workflow system.

**Mock APIs:**
- **Search API**: Simulates document search with realistic mock data
- **Internal System API**: Simulates submission processing with automatic status transitions

See [mock-tools/README.md](mock-tools/README.md) for API documentation and setup.

## Workflow Overview

1. **Text Extraction**: Extract text from raw document content
2. **Search Query Generation**: Use Azure OpenAI to generate search query
3. **Precedent Search**: Find similar documents using search API
4. **Content Validation**: Validate content against precedents using AI
5. **Human Fix (if needed)**: Wait for human to fix validation issues
6. **Draft Generation**: Generate formal document using AI
7. **Draft Approval**: Wait for human approval of draft
8. **Submission**: Submit to internal system
9. **Status Polling**: Poll until submission is complete

## Features

- ✅ Human-in-the-Loop at validation and approval stages
- ✅ Configurable timeouts for human interactions
- ✅ Automatic status polling
- ✅ Loop prevention with maximum attempt limits
- ✅ Comprehensive error handling
- ✅ State management with custom status tracking
- ✅ Fallback mock data for testing

## Getting Started

See the [func-workflow README](func-workflow/README.md) for setup instructions.

## License

MIT License - see [LICENSE](LICENSE) file for details.
