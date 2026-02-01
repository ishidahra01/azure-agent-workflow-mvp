# Ringi Workflow Manager - Frontend

A Next.js 14+ frontend application with CopilotKit integration for managing AI-powered document approval workflows.

## Features

- 🤖 **CopilotKit Integration**: AI-powered chat assistant for workflow management
- 📝 **Workflow Management**: Start, monitor, and interact with approval workflows
- 🔄 **Real-time Updates**: Automatic status polling for active workflows
- 💬 **Human-in-the-Loop**: Fix validation issues and approve/reject drafts
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 🚀 **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js 18+ and npm
- Azure Durable Functions backend running (see [func-workflow](../func-workflow/README.md))
- OpenAI API key for CopilotKit

## Quick Start

### 1. Installation

```bash
cd ui
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your settings:

```env
# Required: OpenAI API key for CopilotKit
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Azure Functions API URL (defaults to http://localhost:7071/api)
NEXT_PUBLIC_API_URL=http://localhost:7071/api
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ui/
├── app/
│   ├── api/
│   │   ├── copilotkit/          # CopilotKit runtime endpoint
│   │   │   └── route.ts
│   │   └── workflow/             # API proxy routes
│   │       ├── start/
│   │       ├── status/
│   │       ├── human-fix/
│   │       └── draft-approval/
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main application page
├── components/
│   ├── WorkflowStatus.tsx        # Status display component
│   ├── ValidationCard.tsx        # Validation issues display
│   ├── DraftCard.tsx             # Draft content display
│   └── ActionButtons.tsx         # Workflow action buttons
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   └── workflowClient.ts         # API client wrapper
└── package.json
```

## Usage

### Starting a Workflow

1. Fill in the form with:
   - **Document ID**: Unique identifier for the document
   - **Requestor ID**: User submitting the document
   - **Raw Content**: Document text content

2. Click "🚀 Start Workflow"

3. The workflow will automatically progress through these steps:
   - Text Extraction
   - Search Query Generation
   - Precedent Search
   - Content Validation
   - Human Fix (if validation fails)
   - Draft Generation
   - Draft Approval
   - Submission to Internal System
   - Status Polling

### Interacting with Workflow

**Refresh Status:**
- Click "🔄 Refresh Status" to manually update the workflow status

**Fix Validation Issues:**
- When status shows "⏸️ Awaiting Human Fix"
- Click "✏️ Send Fix"
- Enter corrected content and optional notes

**Approve/Reject Draft:**
- When status shows "⏸️ Awaiting Draft Approval"
- Click "✓ Approve Draft" to accept
- Or click "✗ Reject Draft" with feedback to regenerate

### Using CopilotKit Assistant

The AI assistant (sidebar on the right) can help you:

**Start Workflow:**
```
Start a workflow with this content: "This is a proposal for..."
```

**Check Status:**
```
What's the current status of my workflow?
```

**Send Fixes:**
```
Send a fix with this corrected content: "..."
```

**Approve Draft:**
```
Approve the draft with comment "Looks good!"
```

**Reject Draft:**
```
Reject the draft with feedback "Please revise the introduction"
```

## CopilotKit Actions

The application exposes these actions to the AI assistant:

### `startWorkflow`
Start a new workflow instance.

**Parameters:**
- `fileText` (string, required): Document content
- `meta` (object, optional): Metadata including documentId and requestorId

### `getWorkflowStatus`
Get current workflow status.

**Parameters:**
- `instanceId` (string, optional): Instance ID (uses current if not provided)

### `sendHumanFix`
Send corrected content when validation fails.

**Parameters:**
- `instanceId` (string, optional): Instance ID
- `ok` (boolean, required): Whether fix is ready
- `fixes` (string, required): Corrected content

### `sendDraftApproval`
Approve or reject the generated draft.

**Parameters:**
- `instanceId` (string, optional): Instance ID
- `approved` (boolean, required): Approval status
- `feedback` (string, optional): Comments

## API Routes

The application includes proxy routes to the Azure Functions backend:

- `POST /api/workflow/start` - Start workflow
- `GET /api/workflow/status?instanceId={id}` - Get status
- `POST /api/workflow/human-fix?instanceId={id}` - Send human fix
- `POST /api/workflow/draft-approval?instanceId={id}` - Send approval

These routes handle authentication and forward requests to the backend.

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Lint Code

```bash
npm run lint
```

## TypeScript Types

Key types are defined in `lib/types.ts`:

- `WorkflowInput` - Input for starting workflow
- `WorkflowStatus` - Complete workflow status
- `ValidationResult` - Validation issues and assessment
- `CustomStatus` - Workflow-specific status fields
- `WorkflowStep` - Enum of workflow steps

## Styling

The application uses:
- **Tailwind CSS 4** for utility-first styling
- **Responsive Design** for mobile and desktop
- **Custom Components** with consistent styling
- **Loading States** for better UX

## Error Handling

The application includes comprehensive error handling:
- API request errors are displayed in red alert boxes
- Loading states prevent duplicate submissions
- Input validation before starting workflows
- Automatic retry on status polling

## Troubleshooting

**CopilotKit not working:**
- Check that `OPENAI_API_KEY` is set in `.env.local`
- Verify the API key is valid
- Check browser console for errors

**Cannot connect to backend:**
- Ensure Azure Functions backend is running on `http://localhost:7071`
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS settings on the backend

**Status not updating:**
- Check that the workflow instance ID is correct
- Verify the backend is responding to status requests
- Look for errors in the browser console

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Update this README for new features

## License

MIT License - see [LICENSE](../LICENSE) file for details.

