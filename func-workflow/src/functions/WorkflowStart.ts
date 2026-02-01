/**
 * HTTP Endpoint: Start a new workflow instance
 * POST /api/workflows/start
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { WorkflowInput } from '../shared/models';

export async function workflowStart(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Starting new workflow instance');

  try {
    // Parse request body
    const body = await request.json() as any;

    // Validate required fields
    if (!body.documentId || !body.requestorId || !body.rawContent) {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing required fields: documentId, requestorId, rawContent',
        },
      };
    }

    // Create workflow input
    const workflowInput: WorkflowInput = {
      documentId: body.documentId,
      requestorId: body.requestorId,
      rawContent: body.rawContent,
      metadata: body.metadata,
    };

    // Start the orchestration
    const client = df.getClient(context);
    const instanceId = await client.startNew('RingiOrchestrator', {
      input: workflowInput,
    });

    context.log(`Started orchestration with ID = '${instanceId}'`);

    // Return the management URLs for the orchestration
    const response = client.createCheckStatusResponse(request, instanceId);

    return {
      status: 202,
      jsonBody: {
        instanceId,
        statusQueryGetUri: response.body?.statusQueryGetUri,
        sendEventPostUri: response.body?.sendEventPostUri,
        terminatePostUri: response.body?.terminatePostUri,
        purgeHistoryDeleteUri: response.body?.purgeHistoryDeleteUri,
      },
      headers: {
        'Content-Type': 'application/json',
        'Location': response.headers?.get('Location') || '',
      },
    };
  } catch (error: any) {
    context.error(`Error starting workflow: ${error.message}`);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to start workflow',
        message: error.message,
      },
    };
  }
}

app.http('WorkflowStart', {
  route: 'workflows/start',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: workflowStart,
});
