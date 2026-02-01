/**
 * HTTP Endpoint: Get workflow status
 * GET /api/workflows/status/{instanceId}
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';

export async function workflowStatus(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const instanceId = request.params.instanceId;

  if (!instanceId) {
    return {
      status: 400,
      jsonBody: {
        error: 'Instance ID is required',
      },
    };
  }

  context.log(`Getting status for instance: ${instanceId}`);

  try {
    const client = df.getClient(context);
    const status = await client.getStatus(instanceId);

    if (!status) {
      return {
        status: 404,
        jsonBody: {
          error: 'Workflow instance not found',
          instanceId,
        },
      };
    }

    // Return detailed status information
    return {
      status: 200,
      jsonBody: {
        instanceId: status.instanceId,
        runtimeStatus: status.runtimeStatus,
        input: status.input,
        output: status.output,
        customStatus: status.customStatus,
        createdTime: status.createdTime,
        lastUpdatedTime: status.lastUpdatedTime,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error: any) {
    context.error(`Error getting workflow status: ${error.message}`);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to get workflow status',
        message: error.message,
      },
    };
  }
}

app.http('WorkflowStatus', {
  route: 'workflows/status/{instanceId}',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: workflowStatus,
});
