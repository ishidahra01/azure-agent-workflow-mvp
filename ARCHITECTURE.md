# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               USER INTERFACE                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Next.js 14 (Port 3000)                           │  │
│  │                                                                       │  │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │  Main UI       │  │  CopilotKit      │  │  API Routes        │  │  │
│  │  │  (page.tsx)    │  │  Chat Sidebar    │  │  (Proxy Layer)     │  │  │
│  │  │                │  │                  │  │                    │  │  │
│  │  │  - Input Form  │  │  - AI Assistant  │  │  - /start          │  │  │
│  │  │  - Status      │  │  - 4 Actions     │  │  - /status         │  │  │
│  │  │  - Buttons     │  │  - Natural Lang  │  │  - /human-fix      │  │  │
│  │  │  - Cards       │  │                  │  │  - /draft-approval │  │  │
│  │  └────────────────┘  └──────────────────┘  └────────────────────┘  │  │
│  │                                                                       │  │
│  │  Components: WorkflowStatus, ValidationCard, DraftCard, ActionButtons│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                       │                                      │
│                                       │ HTTP/JSON                            │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND - AZURE FUNCTIONS                             │
│                     Azure Durable Functions v3 (Port 7071)                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         HTTP ENDPOINTS                                │  │
│  │                                                                       │  │
│  │  POST   /api/workflows/start              Start new workflow         │  │
│  │  GET    /api/workflows/status/{id}        Get workflow status        │  │
│  │  POST   /api/workflows/{id}/events/       Send human fix event       │  │
│  │         human-fix                                                     │  │
│  │  POST   /api/workflows/{id}/events/       Send approval event        │  │
│  │         draft-approval                                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                       │                                      │
│                                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       DURABLE ORCHESTRATOR                            │  │
│  │                     RingiOrchestrator.ts                              │  │
│  │                                                                       │  │
│  │  Workflow Steps:                                                      │  │
│  │  1. Extract Text        ────────┐                                    │  │
│  │  2. Generate Search Query       │                                    │  │
│  │  3. Call Search API             ├──► Activities                      │  │
│  │  4. Validate Content            │                                    │  │
│  │  5. ⏸ Wait for Human Fix ──────┼──► External Event                  │  │
│  │     (WaitForExternalEvent)      │    + CreateTimer (timeout)         │  │
│  │  6. Generate Draft              │                                    │  │
│  │  7. ⏸ Wait for Approval ───────┼──► External Event                  │  │
│  │     (WaitForExternalEvent)      │    + CreateTimer (timeout)         │  │
│  │  8. Submit to Internal System   │                                    │  │
│  │  9. Poll Status ────────────────┼──► CreateTimer (polling)           │  │
│  │  10. Complete                   │                                    │  │
│  │                                 │                                    │  │
│  │  Features:                      │                                    │  │
│  │  - SetCustomStatus() at each step                                    │  │
│  │  - Loop prevention (max 3 retries)                                   │  │
│  │  - Comprehensive error handling                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                       │                                      │
│                                       ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          ACTIVITY FUNCTIONS                           │  │
│  │                                                                       │  │
│  │  ExtractTextActivity           Extract document text                 │  │
│  │  LlmGenerateSearchQuery        Generate search query using AI        │  │
│  │  CallMockSearchActivity        Call search API                       │  │
│  │  LlmValidateContentActivity    Validate content using AI             │  │
│  │  LlmGenerateDraftActivity      Generate draft using AI               │  │
│  │  CallMockInternalSubmit        Submit to internal system             │  │
│  │  CallMockInternalStatus        Get submission status                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                          │                             │                    │
│                          ▼                             ▼                    │
│  ┌────────────────────────────┐     ┌──────────────────────────────────┐  │
│  │    AOAI Client Wrapper     │     │     HTTP Client (axios)          │  │
│  │    aoaiClient.ts           │     │                                  │  │
│  │                            │     │  - Call Mock APIs                │  │
│  │  - Azure OpenAI API calls  │     │  - Error handling                │  │
│  │  - JSON response parsing   │     │  - Retry logic                   │  │
│  │  - Error handling          │     │                                  │  │
│  └────────────────────────────┘     └──────────────────────────────────┘  │
│                │                                   │                        │
└────────────────┼───────────────────────────────────┼────────────────────────┘
                 │                                   │
                 ▼                                   ▼
        ┌──────────────────┐          ┌─────────────────────────────────┐
        │  Azure OpenAI    │          │    Mock Tools API (Port 3001)   │
        │  (AOAI)          │          │    Express/TypeScript Server    │
        │                  │          │                                 │
        │  - GPT-4o        │          │  ┌────────────────────────┐    │
        │  - Text Gen      │          │  │  Search API            │    │
        │  - JSON Mode     │          │  │  POST /mock/search     │    │
        │                  │          │  │                        │    │
        │  Used for:       │          │  │  - 8 mock documents    │    │
        │  - Search query  │          │  │  - Keyword scoring     │    │
        │  - Validation    │          │  │  - Realistic data      │    │
        │  - Draft gen     │          │  └────────────────────────┘    │
        └──────────────────┘          │                                 │
                                      │  ┌────────────────────────┐    │
                                      │  │  Internal System API   │    │
                                      │  │  POST /mock/internal/  │    │
                                      │  │       submit           │    │
                                      │  │  GET /mock/internal/   │    │
                                      │  │      status/:id        │    │
                                      │  │                        │    │
                                      │  │  Status Transitions:   │    │
                                      │  │  Received → InReview   │    │
                                      │  │  → Completed (20s)     │    │
                                      │  └────────────────────────┘    │
                                      └─────────────────────────────────┘
```

## Data Flow - Complete Workflow

```
User Input (fileText + meta)
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 1. SUBMITTED → EXTRACTED                                       │
│    ExtractTextActivity                                         │
│    Output: extractedText                                       │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. SEARCH_QUERY_GENERATED                                      │
│    LlmGenerateSearchQueryActivity (AOAI)                       │
│    Input: extractedText + meta                                 │
│    Output: searchQuery (e.g., "類似案件 システム導入")         │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. SEARCHED                                                    │
│    CallMockSearchActivity (Mock API)                           │
│    Input: searchQuery                                          │
│    Output: searchResults (array of documents)                  │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. VALIDATED                                                   │
│    LlmValidateContentActivity (AOAI)                           │
│    Input: extractedText + searchResults + meta                 │
│    Output: validation { requiresFix, issues, questions }       │
└───────────────────────────────────────────────────────────────┘
        │
        ├─── requiresFix = true ────┐
        │                            │
        │                            ▼
        │              ┌─────────────────────────────────────────┐
        │              │ 5. AWAITING_HUMAN_FIX                   │
        │              │    WaitForExternalEvent("HumanFix")     │
        │              │    CreateTimer(1 hour)                  │
        │              │                                         │
        │              │    User submits fix via:                │
        │              │    - UI button                          │
        │              │    - Chat command                       │
        │              │    - API call                           │
        │              │                                         │
        │              │    On timeout: FAIL                     │
        │              └─────────────────────────────────────────┘
        │                            │
        │                            │ Apply fixes, retry validation
        │                            │ (max 3 loops)
        │                            │
        │◄───────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 6. DRAFT_GENERATED                                             │
│    LlmGenerateDraftActivity (AOAI)                             │
│    Input: extractedText + searchResults + meta                 │
│    Output: draft { summary, fullText, sections }               │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 7. AWAITING_DRAFT_APPROVAL                                     │
│    WaitForExternalEvent("DraftApproval")                       │
│    CreateTimer(1 hour)                                         │
│                                                                │
│    User can:                                                   │
│    - Approve (approved: true)                                  │
│    - Reject with feedback (approved: false + feedback)        │
│                                                                │
│    If rejected: Regenerate draft (max 3 loops)                │
│    On timeout: FAIL                                            │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 8. SUBMITTED_TO_INTERNAL                                       │
│    CallMockInternalSubmitActivity                              │
│    Input: draft                                                │
│    Output: { requestId }                                       │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 9. POLLING STATUS                                              │
│    Loop:                                                       │
│      CallMockInternalStatusActivity                            │
│      CreateTimer(10 seconds)                                   │
│    Until:                                                      │
│      status = "Completed" OR "Rejected"                        │
│      OR max time (5 minutes)                                   │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ 10. COMPLETED                                                  │
│     Return: { draft, finalStatus, result }                    │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend (func-workflow/)
- **Runtime**: Node.js 18+
- **Framework**: Azure Functions v4
- **Orchestration**: Durable Functions v3.1.0
- **Language**: TypeScript 5.3
- **AI**: Azure OpenAI (GPT-4o)
- **HTTP Client**: axios
- **Total Lines**: ~1,400 TypeScript

### Mock Tools (mock-tools/)
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18
- **Language**: TypeScript 5.3
- **Utilities**: uuid, cors
- **Total Lines**: ~400 TypeScript

### Frontend (ui/)
- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **AI Chat**: CopilotKit 1.3.21
- **Styling**: Tailwind CSS 4
- **AI**: OpenAI API (for chat)
- **Total Lines**: ~800 TypeScript/TSX

## Key Patterns & Concepts

### 1. Durable Functions Patterns Used

**Human-in-the-Loop Pattern**
```typescript
// Wait for external event with timeout
const fixTask = context.df.waitForExternalEvent("HumanFixSubmitted");
const timeoutTask = context.df.createTimer(deadline);
const winner = yield context.df.Task.any([fixTask, timeoutTask]);
```

**Polling Pattern**
```typescript
// Poll external system with timer
while (status !== "Completed" && attempts < maxAttempts) {
    status = yield context.df.callActivity("CheckStatus", requestId);
    if (status !== "Completed") {
        const nextCheck = new Date(Date.now() + 10000);
        yield context.df.createTimer(nextCheck);
    }
    attempts++;
}
```

**Custom Status Pattern**
```typescript
// Update UI-visible status
context.df.setCustomStatus({
    step: "AwaitingHumanFix",
    message: "Validation found issues",
    validation: validationResult
});
```

### 2. CopilotKit Integration

**Action Definition**
```typescript
useCopilotAction({
    name: "startWorkflow",
    description: "Start a new workflow",
    parameters: [
        { name: "fileText", type: "string" },
        { name: "meta", type: "object" }
    ],
    handler: async ({ fileText, meta }) => {
        // Call API and update state
    }
});
```

### 3. Type Safety

All data structures are fully typed:
- `WorkflowInput`, `WorkflowOutput`
- `ValidationResult`, `DraftResult`
- `CustomStatus`, `WorkflowStep`
- End-to-end type safety from backend to frontend

### 4. Error Handling

- Activity-level: Try-catch with fallback data
- Orchestrator-level: Max retry counts
- API-level: Proper HTTP status codes
- UI-level: User-friendly error messages

## Security Considerations

✅ **No hardcoded secrets** - All credentials via environment variables  
✅ **CORS configured** - Controlled API access  
✅ **Input validation** - Type checking and sanitization  
✅ **CodeQL passed** - Zero security vulnerabilities  
✅ **API key management** - Separate keys for AOAI and OpenAI  

## Scalability Notes

**Current (MVP)**
- In-memory state (Durable Functions)
- Single instance
- Mock external systems

**Production Path**
- Azure Storage for Durable state
- Multiple Function App instances
- Real search service (Azure Cognitive Search)
- Real document storage (Blob Storage)
- Real approval system integration
- Database for audit logs
- Application Insights for monitoring

## Performance Characteristics

**Typical Workflow Duration**
- Without human interaction: ~30-60 seconds
- With validation fix: +1-60 minutes (human time)
- With draft approval: +1-60 minutes (human time)
- Status polling: 10-30 seconds (after internal submission)

**Resource Usage**
- Function App: ~256MB memory per instance
- Mock Tools: ~50MB memory
- UI: Client-side rendering, minimal server load

## Deployment Architecture

```
Development:
- localhost:3000 (UI)
- localhost:7071 (Functions)
- localhost:3001 (Mock Tools)

Production:
- https://app.example.com (UI - Static hosting or App Service)
- https://func-app.azurewebsites.net (Function App)
- Mock Tools replaced by real integrations
```

---

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)
