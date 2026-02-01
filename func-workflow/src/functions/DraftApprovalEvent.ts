/**
 * HTTP Endpoint: Send draft approval event to workflow
 * POST /api/workflows/{instanceId}/events/draft-approval
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { DraftApprovalInput } from '../shared/models';

export async function draftApprovalEvent(
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

  context.log(`Sending draft approval event to instance: ${instanceId}`);

  try {
    // Parse request body
    const body = await request.json() as any;

    // Validate required fields
    if (typeof body.approved !== 'boolean') {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing or invalid required field: approved (must be boolean)',
        },
      };
    }

    const approvalInput: DraftApprovalInput = {
      approved: body.approved,
      comments: body.comments,
      modifications: body.modifications,
    };

    // Send the event to the orchestration
    const client = df.getClient(context);
    await client.raiseEvent(instanceId, 'DraftApprovalEvent', approvalInput);

    context.log(`Draft approval event sent to instance: ${instanceId}`);

    return {
      status: 202,
      jsonBody: {
        message: 'Draft approval event sent successfully',
        instanceId,
        approved: body.approved,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error: any) {
    context.error(`Error sending draft approval event: ${error.message}`);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to send draft approval event',
        message: error.message,
      },
    };
  }
}

app.http('DraftApprovalEvent', {
  route: 'workflows/{instanceId}/events/draft-approval',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: draftApprovalEvent,
});
