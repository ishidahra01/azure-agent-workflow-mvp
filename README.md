# Azure Agent Workflow MVP

This repository contains an MVP implementation of a Ringi (approval document) workflow system using Azure Durable Functions with a Next.js frontend and CopilotKit integration.

## Project Structure

### ui/
Next.js 14+ frontend with CopilotKit integration for managing workflows through a modern web interface.

**Key Features:**
- **CopilotKit Integration**: AI-powered chat assistant for workflow management
- **Real-time Updates**: Automatic status polling and live workflow monitoring
- **Human-in-the-Loop UI**: Interactive forms for validation fixes and draft approvals
- **Responsive Design**: Modern UI built with Tailwind CSS
- **TypeScript**: Full type safety with comprehensive type definitions

See [ui/README.md](ui/README.md) for setup and usage instructions.

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
- ✅ Web UI with AI-powered chat assistant (CopilotKit)
- ✅ Real-time status monitoring and automatic polling
- ✅ Configurable timeouts for human interactions
- ✅ Loop prevention with maximum attempt limits
- ✅ Comprehensive error handling
- ✅ State management with custom status tracking
- ✅ Fallback mock data for testing

## Quick Start

### 1. Start Mock Tools (Optional)
```bash
cd mock-tools
npm install
npm start
```

### 2. Start Azure Functions Backend
```bash
cd func-workflow
npm install
cp .env.example .env
# Configure .env with your Azure OpenAI credentials
npm start
```

### 3. Start Next.js Frontend
```bash
cd ui
npm install
cp .env.local.example .env.local
# Configure .env.local with your OpenAI API key
npm run dev
```

### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Use the web interface to start workflows
- Interact with the AI assistant in the sidebar
- Monitor workflow progress in real-time
- Fix validation issues and approve drafts through the UI

See individual component READMEs for detailed setup instructions.

## Architecture

```
┌─────────────────┐
│   Next.js UI    │  - Web interface
│  (Port 3000)    │  - CopilotKit chat
│                 │  - Real-time updates
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Azure Functions │  - Durable Functions
│  (Port 7071)    │  - Workflow orchestration
│                 │  - Azure OpenAI integration
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Mock Tools    │  - Search API
│  (Port 3001)    │  - Internal System API
│                 │  - Test data
└─────────────────┘
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
