# API Documentation

## Base URL
- Local Development: `http://localhost:7071/api`
- Production: `https://<function-app-name>.azurewebsites.net/api`

## Endpoints

### 1. Start Workflow
Start a new workflow instance.

**Endpoint:** `POST /workflows/start`

**Request Body:**
```json
{
  "documentId": "string",
  "requestorId": "string",
  "rawContent": "string",
  "metadata": {
    // optional metadata
  }
}
```

**Response:** `202 Accepted`
```json
{
  "instanceId": "string",
  "statusQueryGetUri": "string",
  "sendEventPostUri": "string",
  "terminatePostUri": "string",
  "purgeHistoryDeleteUri": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc-123",
    "requestorId": "user-456",
    "rawContent": "This is a proposal for a new project..."
  }'
```

---

### 2. Get Workflow Status
Get the current status of a workflow instance.

**Endpoint:** `GET /workflows/status/{instanceId}`

**Path Parameters:**
- `instanceId` (string): The workflow instance ID

**Response:** `200 OK`
```json
{
  "instanceId": "string",
  "runtimeStatus": "string", // "Running", "Completed", "Failed", etc.
  "input": {},
  "output": {},
  "customStatus": {
    "documentId": "string",
    "requestorId": "string",
    "currentStep": "string",
    "extractedText": "string",
    "searchQuery": "string",
    "searchResults": [],
    "validationResult": {},
    "draft": "string",
    "submissionId": "string",
    "submissionStatus": "string",
    "errors": [],
    "retryCount": 0,
    "startTime": "string",
    "lastUpdateTime": "string"
  },
  "createdTime": "string",
  "lastUpdatedTime": "string"
}
```

**Example:**
```bash
curl http://localhost:7071/api/workflows/status/abc123...
```

---

### 3. Send Human Fix Event
Send corrected content when validation fails.

**Endpoint:** `POST /workflows/{instanceId}/events/human-fix`

**Path Parameters:**
- `instanceId` (string): The workflow instance ID

**Request Body:**
```json
{
  "correctedContent": "string",
  "notes": "string" // optional
}
```

**Response:** `202 Accepted`
```json
{
  "message": "Human fix event sent successfully",
  "instanceId": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:7071/api/workflows/abc123.../events/human-fix \
  -H "Content-Type: application/json" \
  -d '{
    "correctedContent": "This is the corrected content...",
    "notes": "Fixed the validation issues"
  }'
```

**When to Use:**
- The workflow status shows `currentStep: "AWAITING_HUMAN_FIX"`
- The validation result contains issues that need to be addressed
- Check `customStatus.validationResult.issues` for specific problems

---

### 4. Send Draft Approval Event
Approve or reject the generated draft.

**Endpoint:** `POST /workflows/{instanceId}/events/draft-approval`

**Path Parameters:**
- `instanceId` (string): The workflow instance ID

**Request Body:**
```json
{
  "approved": boolean,
  "comments": "string", // optional
  "modifications": "string" // optional, replaces draft if provided
}
```

**Response:** `202 Accepted`
```json
{
  "message": "Draft approval event sent successfully",
  "instanceId": "string",
  "approved": boolean
}
```

**Example (Approve):**
```bash
curl -X POST http://localhost:7071/api/workflows/abc123.../events/draft-approval \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Looks good!"
  }'
```

**Example (Reject):**
```bash
curl -X POST http://localhost:7071/api/workflows/abc123.../events/draft-approval \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "comments": "Please revise the introduction section"
  }'
```

**When to Use:**
- The workflow status shows `currentStep: "AWAITING_DRAFT_APPROVAL"`
- Review the draft in `customStatus.draft`
- Either approve to proceed or reject to regenerate

---

## Workflow States

The `currentStep` field in `customStatus` can have the following values:

1. `STARTED` - Workflow has been initiated
2. `EXTRACTING_TEXT` - Extracting text from input
3. `GENERATING_SEARCH_QUERY` - Generating search query using LLM
4. `SEARCHING_PRECEDENTS` - Searching for similar documents
5. `VALIDATING_CONTENT` - Validating content against precedents
6. `AWAITING_HUMAN_FIX` - Waiting for human to fix validation issues
7. `GENERATING_DRAFT` - Generating draft document
8. `AWAITING_DRAFT_APPROVAL` - Waiting for draft approval
9. `SUBMITTING_TO_INTERNAL` - Submitting to internal system
10. `POLLING_SUBMISSION_STATUS` - Polling submission status
11. `COMPLETED` - Workflow completed successfully
12. `FAILED` - Workflow failed

---

## Error Responses

All endpoints may return error responses:

**400 Bad Request**
```json
{
  "error": "Missing required fields: documentId, requestorId, rawContent"
}
```

**404 Not Found**
```json
{
  "error": "Workflow instance not found",
  "instanceId": "string"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to start workflow",
  "message": "Error details..."
}
```

---

## Polling for Status

To monitor a workflow, poll the status endpoint periodically:

```bash
#!/bin/bash
INSTANCE_ID="abc123..."

while true; do
  STATUS=$(curl -s http://localhost:7071/api/workflows/status/$INSTANCE_ID | jq -r '.customStatus.currentStep')
  echo "Current step: $STATUS"
  
  if [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "FAILED" ]; then
    break
  fi
  
  if [ "$STATUS" = "AWAITING_HUMAN_FIX" ] || [ "$STATUS" = "AWAITING_DRAFT_APPROVAL" ]; then
    echo "Waiting for human intervention..."
  fi
  
  sleep 5
done
```

---

## Complete Workflow Example

```bash
# 1. Start the workflow
RESPONSE=$(curl -s -X POST http://localhost:7071/api/workflows/start \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc-123",
    "requestorId": "user-456",
    "rawContent": "This is a proposal for a new marketing campaign..."
  }')

INSTANCE_ID=$(echo $RESPONSE | jq -r '.instanceId')
echo "Started workflow: $INSTANCE_ID"

# 2. Monitor status
while true; do
  STATUS_RESPONSE=$(curl -s http://localhost:7071/api/workflows/status/$INSTANCE_ID)
  CURRENT_STEP=$(echo $STATUS_RESPONSE | jq -r '.customStatus.currentStep')
  echo "Current step: $CURRENT_STEP"
  
  # 3. Handle human fix if needed
  if [ "$CURRENT_STEP" = "AWAITING_HUMAN_FIX" ]; then
    curl -X POST http://localhost:7071/api/workflows/$INSTANCE_ID/events/human-fix \
      -H "Content-Type: application/json" \
      -d '{
        "correctedContent": "Corrected content here...",
        "notes": "Fixed validation issues"
      }'
  fi
  
  # 4. Handle draft approval if needed
  if [ "$CURRENT_STEP" = "AWAITING_DRAFT_APPROVAL" ]; then
    DRAFT=$(echo $STATUS_RESPONSE | jq -r '.customStatus.draft')
    echo "Draft: $DRAFT"
    
    # Approve the draft
    curl -X POST http://localhost:7071/api/workflows/$INSTANCE_ID/events/draft-approval \
      -H "Content-Type: application/json" \
      -d '{
        "approved": true,
        "comments": "Approved!"
      }'
  fi
  
  # 5. Check if completed
  if [ "$CURRENT_STEP" = "COMPLETED" ] || [ "$CURRENT_STEP" = "FAILED" ]; then
    echo "Workflow finished: $CURRENT_STEP"
    echo $STATUS_RESPONSE | jq '.output'
    break
  fi
  
  sleep 5
done
```
