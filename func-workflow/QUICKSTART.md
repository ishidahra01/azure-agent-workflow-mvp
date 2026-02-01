# Quick Start Guide

Get up and running with the Azure Durable Functions Workflow in 5 minutes.

## Prerequisites

- Node.js 18 or later
- Azure Functions Core Tools v4
- Azure Storage Emulator (Azurite) or Azure Storage account

## Installation

```bash
# Navigate to the project directory
cd func-workflow

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

## Configuration

Edit `.env` or `local.settings.json` with your settings:

```bash
# Azure OpenAI Configuration (Required)
AOAI_BASE_URL=https://your-aoai-instance.openai.azure.com
AOAI_DEPLOYMENT=gpt-4
AOAI_API_KEY=your-api-key-here

# Mock Tools API (Optional - will use fallback mock data if not available)
MOCK_TOOLS_BASE_URL=http://localhost:3000
```

## Run Locally

### Option 1: Using Azurite (Local Storage Emulator)

```bash
# Start Azurite in a separate terminal
azurite

# In the project directory
npm start
```

### Option 2: Using Azure Storage

Update `AzureWebJobsStorage` in `local.settings.json`:
```json
{
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=...",
    ...
  }
}
```

Then:
```bash
npm start
```

The functions will be available at `http://localhost:7071/api/`

## Test the Workflow

### 1. Start a workflow

```bash
curl -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-001",
    "requestorId": "user-123",
    "rawContent": "This is a proposal for approving a new marketing campaign targeting young professionals. The campaign will run for 3 months with a budget of $50,000."
  }'
```

Response will include an `instanceId`. Save it for the next steps.

### 2. Check workflow status

```bash
# Replace {instanceId} with the actual ID from step 1
curl http://localhost:7071/api/workflows/status/{instanceId}
```

### 3. Monitor and interact

The workflow will progress through these steps automatically:
- Text extraction
- Search query generation
- Precedent search
- Content validation

**If validation fails**, the workflow will wait at `AWAITING_HUMAN_FIX`:

```bash
curl -X POST http://localhost:7071/api/workflows/{instanceId}/events/human-fix \
  -H "Content-Type: application/json" \
  -d '{
    "correctedContent": "This is a corrected proposal...",
    "notes": "Fixed the budget justification"
  }'
```

After successful validation and draft generation, the workflow will wait at `AWAITING_DRAFT_APPROVAL`:

```bash
curl -X POST http://localhost:7071/api/workflows/{instanceId}/events/draft-approval \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Looks good!"
  }'
```

### 4. Check final result

```bash
curl http://localhost:7071/api/workflows/status/{instanceId}
```

When `currentStep` is `COMPLETED`, the workflow is done!

## Automated Test Script

Save this as `test-workflow.sh`:

```bash
#!/bin/bash

# Start workflow
echo "Starting workflow..."
RESPONSE=$(curl -s -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-001",
    "requestorId": "user-123",
    "rawContent": "This is a proposal for a new marketing campaign."
  }')

INSTANCE_ID=$(echo $RESPONSE | jq -r '.instanceId')
echo "Started workflow: $INSTANCE_ID"

# Monitor and auto-approve
while true; do
  STATUS=$(curl -s http://localhost:7071/api/workflows/status/$INSTANCE_ID)
  STEP=$(echo $STATUS | jq -r '.customStatus.currentStep')
  echo "Current step: $STEP"
  
  if [ "$STEP" = "AWAITING_HUMAN_FIX" ]; then
    echo "Sending human fix..."
    curl -s -X POST http://localhost:7071/api/workflows/$INSTANCE_ID/events/human-fix \
      -H "Content-Type: application/json" \
      -d '{"correctedContent": "Corrected content...", "notes": "Fixed"}' > /dev/null
  fi
  
  if [ "$STEP" = "AWAITING_DRAFT_APPROVAL" ]; then
    echo "Approving draft..."
    curl -s -X POST http://localhost:7071/api/workflows/$INSTANCE_ID/events/draft-approval \
      -H "Content-Type: application/json" \
      -d '{"approved": true}' > /dev/null
  fi
  
  if [ "$STEP" = "COMPLETED" ] || [ "$STEP" = "FAILED" ]; then
    echo "Workflow finished: $STEP"
    echo $STATUS | jq '.output'
    break
  fi
  
  sleep 3
done
```

Run it:
```bash
chmod +x test-workflow.sh
./test-workflow.sh
```

## Troubleshooting

### "Connection refused" to storage
- Make sure Azurite is running: `azurite`
- Or update `AzureWebJobsStorage` to use Azure Storage

### "Azure OpenAI API error"
- Verify `AOAI_BASE_URL`, `AOAI_DEPLOYMENT`, and `AOAI_API_KEY`
- Check your Azure OpenAI deployment is running

### Mock API errors
- The workflow includes fallback mock data
- Set `MOCK_TOOLS_BASE_URL` to use a real mock API
- Or ignore these warnings - the workflow will still work

### Build errors
```bash
npm run clean
npm install
npm run build
```

## Next Steps

- Read [README.md](README.md) for architecture details
- Review [API.md](API.md) for complete API documentation
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for implementation details
- Deploy to Azure: `func azure functionapp publish <app-name>`

## Common Commands

```bash
# Build
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Start functions
npm start

# Clean build
npm run clean && npm run build
```

## Support

For issues or questions, check the documentation:
- [README.md](README.md) - Full documentation
- [API.md](API.md) - API reference
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details

Happy coding! 🚀
