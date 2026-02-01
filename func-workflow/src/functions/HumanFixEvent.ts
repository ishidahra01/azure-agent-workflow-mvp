/**
 * HTTP Endpoint: Send human fix event to workflow
 * POST /api/workflows/{instanceId}/events/human-fix
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { HumanFixInput } from '../shared/models';

export async function humanFixEvent(
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

  context.log(`Sending human fix event to instance: ${instanceId}`);

  try {
    // Parse request body
    const body = await request.json() as any;

    // Validate required fields
    if (!body.correctedContent) {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing required field: correctedContent',
        },
      };
    }

    const humanFixInput: HumanFixInput = {
      correctedContent: body.correctedContent,
      notes: body.notes,
    };

    // Send the event to the orchestration
    const client = df.getClient(context);
    await client.raiseEvent(instanceId, 'HumanFixEvent', humanFixInput);

    context.log(`Human fix event sent to instance: ${instanceId}`);

    return {
      status: 202,
      jsonBody: {
        message: 'Human fix event sent successfully',
        instanceId,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error: any) {
    context.error(`Error sending human fix event: ${error.message}`);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to send human fix event',
        message: error.message,
      },
    };
  }
}

app.http('HumanFixEvent', {
  route: 'workflows/{instanceId}/events/human-fix',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: humanFixEvent,
});
