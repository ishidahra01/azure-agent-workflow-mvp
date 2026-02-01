# Quick Start Guide - Azure Agent Workflow MVP

Get the complete workflow system running in **under 15 minutes**! This guide will help you set up all three components and run your first workflow.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **Azure Functions Core Tools v4** ([Install Guide](https://learn.microsoft.com/azure/azure-functions/functions-run-local))
- ✅ **Azure OpenAI resource** or endpoint ([Create one](https://portal.azure.com/))
- ✅ **OpenAI API key** for CopilotKit ([Get key](https://platform.openai.com/api-keys))
- ✅ **Git** installed

## 🚀 Step 1: Clone and Install (3 minutes)

```bash
# Clone the repository
git clone https://github.com/ishidahra01/azure-agent-workflow-mvp.git
cd azure-agent-workflow-mvp

# Install all dependencies
cd func-workflow && npm install && cd ..
cd mock-tools && npm install && cd ..
cd ui && npm install && cd ..
```

## ⚙️ Step 2: Configure Environment (5 minutes)

### A. Backend Configuration

Create `func-workflow/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AOAI_BASE_URL": "https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT",
    "AOAI_API_KEY": "your-azure-openai-api-key-here",
    "AOAI_API_VERSION": "2024-08-01-preview",
    "MOCK_TOOLS_BASE_URL": "http://localhost:3001"
  }
}
```

**Replace:**
- `YOUR-RESOURCE` - Your Azure OpenAI resource name
- `YOUR-DEPLOYMENT` - Your deployment name (e.g., `gpt-4o`)
- `your-azure-openai-api-key-here` - Your actual API key

**Example:**
```json
"AOAI_BASE_URL": "https://my-openai.openai.azure.com/openai/deployments/gpt-4o"
```

### B. Frontend Configuration

Create `ui/.env.local`:

```bash
NEXT_PUBLIC_WORKFLOW_API_BASE_URL=http://localhost:7071
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Replace:**
- `sk-proj-xxxxxxxxxxxxxxxxxxxxx` - Your OpenAI API key from https://platform.openai.com/api-keys

### C. Mock Tools (No Configuration Needed!)

The mock tools work out of the box with default settings.

## 🎬 Step 3: Start All Services (2 minutes)

Open **three separate terminal windows**:

### Terminal 1: Start Mock Tools API

```bash
cd mock-tools
npm run dev
```

✅ **Success when you see:** `Mock Tools API running on port 3001`

### Terminal 2: Start Azure Functions Backend

```bash
cd func-workflow
npm start
```

✅ **Success when you see:** 
```
Functions:
        WorkflowStart: [POST] http://localhost:7071/api/workflows/start
        WorkflowStatus: [GET] http://localhost:7071/api/workflows/status/{instanceId}
        ...
```

### Terminal 3: Start Next.js Frontend

```bash
cd ui
npm run dev
```

✅ **Success when you see:** `Ready on http://localhost:3000`

## 🎯 Step 4: Run Your First Workflow (5 minutes)

### Option A: Using the Web UI (Recommended)

1. **Open the App**
   - Navigate to http://localhost:3000

2. **Enter Document Text**
   ```
   稟議書
   件名: 新規システム導入
   金額: 1,200,000円
   目的: 業務効率化のため、クラウドベースのワークフロー管理システムを導入したい。
   理由: 現在の手作業による承認プロセスに時間がかかりすぎているため。
   ```

3. **Add Metadata**
   ```json
   {
     "title": "新規システム導入",
     "amount": 1200000,
     "department": "IT部"
   }
   ```

4. **Start Workflow**
   - Click the **"Start Workflow"** button
   - Watch the status update in real-time!

5. **Interact with the Workflow**
   
   When status is `AwaitingHumanFix`:
   - Use the chat: "The budget justification is insufficient. Add detailed cost breakdown."
   - Or use the **"Send Fix"** button
   
   When status is `AwaitingDraftApproval`:
   - Use the chat: "Approve the draft"
   - Or click **"Approve Draft"**

### Option B: Using cURL (For Testing)

```bash
# 1. Start a workflow
curl -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "fileText": "稟議書\n件名: 新規システム導入\n金額: 1,200,000円\n目的: 業務効率化",
    "meta": {
      "title": "新規システム導入",
      "amount": 1200000
    }
  }'

# Response: {"instanceId": "abc123", ...}

# 2. Check status
curl http://localhost:7071/api/workflows/status/abc123

# 3. Send fix (when AwaitingHumanFix)
curl -X POST http://localhost:7071/api/workflows/abc123/events/human-fix \
  -H "Content-Type: application/json" \
  -d '{
    "ok": true,
    "fixes": {
      "additionalInfo": "Detailed cost breakdown: Software license: ¥800,000, Implementation: ¥400,000"
    }
  }'

# 4. Approve draft (when AwaitingDraftApproval)
curl -X POST http://localhost:7071/api/workflows/abc123/events/draft-approval \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

## 🎨 What You'll See

### 1. Initial Status (Submitted → Extracted → SearchQueryGenerated → Searched → Validated)
- The orchestrator processes through multiple steps
- Status updates every 5 seconds in the UI
- You'll see "Processing..." states

### 2. Human Fix Required (AwaitingHumanFix)
```
Status: Awaiting Human Fix
Message: "Content validation found issues that need to be addressed"

Issues:
⚠️ High: Budget justification lacks detail
⚠️ Medium: Implementation timeline not specified
```

### 3. Draft Generated (AwaitingDraftApproval)
```
Status: Awaiting Draft Approval
Draft Preview:
---
稟議書
件名: 新規システム導入
金額: ¥1,200,000
...
---
```

### 4. Completed
```
Status: Completed ✓
Result: Document submitted successfully to internal system
Request ID: R12345
```

## 🗣️ Using the AI Chat Assistant

The CopilotKit chat assistant can help you control the workflow:

**Example Commands:**
```
💬 "Start a workflow with this document: [paste text]"
💬 "What's the current status?"
💬 "Show me the validation issues"
💬 "Send a fix with additional budget details"
💬 "Approve the draft"
💬 "Reject the draft and ask for more background information"
```

The assistant will:
- ✅ Execute actions on your behalf
- ✅ Show you the current state
- ✅ Guide you through next steps
- ✅ Explain validation issues

## 🔍 Monitoring and Debugging

### Check if Services are Running

```bash
# Mock Tools
curl http://localhost:3001/

# Azure Functions
curl http://localhost:7071/api/workflows/status/test

# Next.js UI
curl http://localhost:3000/
```

### View Logs

- **Azure Functions**: Check Terminal 2 for orchestrator logs
- **Mock Tools**: Check Terminal 1 for API call logs
- **UI**: Check Terminal 3 for frontend logs and browser console

### Common Issues

**Issue: "Cannot connect to workflow API"**
```bash
# Solution: Verify Azure Functions is running
curl http://localhost:7071/
```

**Issue: "AOAI authentication failed"**
```bash
# Solution: Check your Azure OpenAI credentials in local.settings.json
# Verify AOAI_BASE_URL format and API key
```

**Issue: "Mock search not working"**
```bash
# Solution: Verify Mock Tools is running
curl http://localhost:3001/mock/search -X POST \
  -H "Content-Type: application/json" \
  -d '{"queryText": "test"}'
```

## 📚 Next Steps

Now that you have the system running:

1. **Explore the Code**
   - Check `func-workflow/src/orchestrators/RingiOrchestrator.ts` for workflow logic
   - Review `ui/app/page.tsx` for UI implementation
   - See `mock-tools/src/` for mock API implementations

2. **Read the Documentation**
   - [func-workflow/README.md](func-workflow/README.md) - Backend details
   - [func-workflow/API.md](func-workflow/API.md) - API reference
   - [ui/README.md](ui/README.md) - UI documentation
   - [mock-tools/README.md](mock-tools/README.md) - Mock API docs

3. **Customize the Workflow**
   - Modify validation rules
   - Change timeout durations
   - Add new workflow steps
   - Customize AI prompts

4. **Deploy to Azure**
   - See [func-workflow/README.md#deployment](func-workflow/README.md#deployment)
   - Configure Azure resources
   - Set up CI/CD

## 🆘 Getting Help

**Problems?**
- Check the [Troubleshooting Guide](func-workflow/README.md#troubleshooting)
- Review logs in all three terminals
- Verify all environment variables are set correctly

**Questions?**
- Open an issue on GitHub
- Check the documentation in each component

**Want to contribute?**
- Fork the repository
- Make your changes
- Submit a pull request

## 🎉 Success Checklist

After completing this guide, you should have:

- ✅ All three services running (Mock Tools, Functions, UI)
- ✅ Successfully started a workflow
- ✅ Interacted with Human-in-the-Loop steps
- ✅ Seen a workflow complete successfully
- ✅ Used the AI chat assistant

**Congratulations! You're now ready to build on this workflow system!** 🚀

---

**Need Help?** Check the main [README.md](README.md) or component-specific documentation.
