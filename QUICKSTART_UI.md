# Quick Start Guide - Ringi Workflow System

This guide will help you get the complete Ringi workflow system running locally in under 10 minutes.

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for CopilotKit)
- Azure OpenAI credentials (for backend LLM operations)

## Step 1: Clone and Navigate

```bash
git clone <repository-url>
cd azure-agent-workflow-mvp
```

## Step 2: Start Mock Tools (Optional but Recommended)

The mock tools provide test APIs for search and internal submission.

```bash
cd mock-tools
npm install
npm start
```

Mock tools will run on **http://localhost:3001**

Keep this terminal running.

## Step 3: Configure and Start Backend

Open a new terminal:

```bash
cd func-workflow
npm install

# Copy and configure environment
cp .env.example .env
```

Edit `.env` with your Azure OpenAI credentials:

```env
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

Start the backend:

```bash
npm start
```

Backend will run on **http://localhost:7071**

Keep this terminal running.

## Step 4: Configure and Start Frontend

Open a new terminal:

```bash
cd ui
npm install

# Copy and configure environment
cp .env.local.example .env.local
```

Edit `.env.local` with your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_API_URL=http://localhost:7071/api
```

Start the frontend:

```bash
npm run dev
```

Frontend will run on **http://localhost:3000**

## Step 5: Use the Application

1. Open your browser to **http://localhost:3000**

2. You'll see the Ringi Workflow Manager interface with:
   - Input form on the left
   - CopilotKit chat assistant on the right

3. **Start a workflow** using one of these methods:

   **Method A: Using the Form**
   - Enter a Document ID (e.g., `doc-123`)
   - Enter a Requestor ID (e.g., `user-456`)
   - Enter raw content (e.g., "This is a proposal for a new marketing campaign...")
   - Click "🚀 Start Workflow"

   **Method B: Using the Chat Assistant**
   - Click on the chat sidebar
   - Type: "Start a workflow with this content: This is a proposal for a new marketing campaign targeting millennials with a budget of $50,000"
   - The assistant will start the workflow for you

4. **Monitor the workflow:**
   - Status updates automatically every 5 seconds
   - Watch as it progresses through:
     - Text Extraction
     - Search Query Generation
     - Precedent Search
     - Content Validation
     - (If validation fails) → Human Fix Required
     - Draft Generation
     - (Always) → Draft Approval Required
     - Submission to Internal System
     - Status Polling
     - Completion

5. **Interact when needed:**

   **When validation fails:**
   - You'll see "⏸️ Awaiting Human Fix"
   - Click "✏️ Send Fix" and provide corrected content
   - Or tell the assistant: "Send a fix with this corrected content: ..."

   **When draft is ready:**
   - You'll see "⏸️ Awaiting Draft Approval"
   - Review the draft in the "Generated Draft" card
   - Click "✓ Approve Draft" or "✗ Reject Draft"
   - Or tell the assistant: "Approve the draft" or "Reject the draft with feedback: ..."

## Architecture Overview

```
┌─────────────────────┐
│   Browser           │
│   localhost:3000    │  ← You interact here
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Next.js UI        │  ← Frontend + CopilotKit
│   (TypeScript)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Azure Functions   │  ← Backend orchestrator
│   (Durable Funcs)   │
│   localhost:7071    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Mock Tools API    │  ← Test endpoints
│   (Express)         │
│   localhost:3001    │
└─────────────────────┘
```

## Example Workflow

Here's a complete example workflow:

```bash
# 1. Start a workflow via the UI or chat
Content: "This is a proposal for expanding our product line to include eco-friendly packaging solutions. The estimated cost is $100,000 and will take 6 months to implement."

# 2. System automatically:
- Extracts text
- Generates search query
- Finds similar documents
- Validates content

# 3. If validation passes, system:
- Generates formal draft
- Waits for your approval

# 4. You review and approve:
"The draft looks good, approved!"

# 5. System automatically:
- Submits to internal system
- Polls for completion status
- Shows final result
```

## Troubleshooting

### Frontend Issues

**"Cannot connect to backend"**
- Ensure Azure Functions is running on port 7071
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**"CopilotKit not working"**
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check browser console for errors

### Backend Issues

**"Azure OpenAI error"**
- Verify your Azure OpenAI credentials in `.env`
- Ensure the deployment name matches your Azure setup

**"Cannot connect to mock tools"**
- Ensure mock-tools is running on port 3001
- Check the mock-tools terminal for errors

### Mock Tools Issues

**"Port 3001 already in use"**
```bash
# Kill the process using the port
lsof -ti:3001 | xargs kill -9
# Or change the port in mock-tools/src/server.ts
```

## Next Steps

- Read the detailed documentation:
  - [UI README](ui/README.md)
  - [Backend README](func-workflow/README.md)
  - [Mock Tools README](mock-tools/README.md)
  - [API Documentation](func-workflow/API.md)

- Explore CopilotKit features:
  - Ask complex questions about the workflow
  - Use natural language to control the system
  - Get explanations of workflow states

- Customize the system:
  - Modify validation rules
  - Change draft templates
  - Add new workflow steps
  - Integrate with real APIs

## Support

For issues or questions:
1. Check the troubleshooting sections in component READMEs
2. Review the API documentation
3. Check the GitHub issues

## License

MIT License - see [LICENSE](LICENSE) file for details.
