/**
 * Activity: Submit document to mock internal system
 */

import { app, InvocationContext } from '@azure/functions';
import axios from 'axios';
import { config } from '../shared/config';

export interface CallMockInternalSubmitInput {
  documentId: string;
  draft: string;
  requestorId: string;
}

export interface CallMockInternalSubmitOutput {
  submissionId: string;
  submissionStatus: string;
}

export async function callMockInternalSubmit(
  input: CallMockInternalSubmitInput,
  context: InvocationContext
): Promise<CallMockInternalSubmitOutput> {
  context.log(
    `Submitting document ${input.documentId} to mock internal system`
  );

  try {
    const response = await axios.post(
      `${config.mockTools.baseUrl}/mock/internal/submit`,
      {
        documentId: input.documentId,
        content: input.draft,
        requestorId: input.requestorId,
      },
      {
        timeout: 10000, // 10 seconds
      }
    );

    const submissionId = response.data.requestId;
    const submissionStatus = response.data.status || 'Received';

    context.log(
      `Submission created with ID: ${submissionId}, status: ${submissionStatus}`
    );

    return {
      submissionId,
      submissionStatus,
    };
  } catch (error: any) {
    context.error(`Error submitting to internal system: ${error.message}`);

    // If the mock API is not available, return mock data for testing
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      context.warn('Mock API not available, returning mock submission ID');
      const mockSubmissionId = `mock-sub-${Date.now()}`;
      return {
        submissionId: mockSubmissionId,
        submissionStatus: 'pending',
      };
    }

    throw new Error(`Internal system submission failed: ${error.message}`);
  }
}

app.activity('CallMockInternalSubmitActivity', {
  handler: callMockInternalSubmit,
});
