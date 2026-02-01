/**
 * Activity: Check status of submission in mock internal system
 */

import { app, InvocationContext } from '@azure/functions';
import axios from 'axios';
import { config } from '../shared/config';

export interface CallMockInternalStatusInput {
  submissionId: string;
}

export interface CallMockInternalStatusOutput {
  submissionStatus: string;
  isComplete: boolean;
}

export async function callMockInternalStatus(
  input: CallMockInternalStatusInput,
  context: InvocationContext
): Promise<CallMockInternalStatusOutput> {
  context.log(`Checking status of submission: ${input.submissionId}`);

  try {
    const response = await axios.get(
      `${config.mockTools.baseUrl}/api/submit/${input.submissionId}/status`,
      {
        timeout: 10000, // 10 seconds
      }
    );

    const submissionStatus = response.data.status;
    const isComplete =
      submissionStatus === 'completed' || submissionStatus === 'failed';

    context.log(
      `Submission status: ${submissionStatus}, complete: ${isComplete}`
    );

    return {
      submissionStatus,
      isComplete,
    };
  } catch (error: any) {
    context.error(`Error checking submission status: ${error.message}`);

    // If the mock API is not available, simulate completion for testing
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      context.warn('Mock API not available, simulating completed status');
      return {
        submissionStatus: 'completed',
        isComplete: true,
      };
    }

    throw new Error(`Status check failed: ${error.message}`);
  }
}

app.activity('CallMockInternalStatusActivity', {
  handler: callMockInternalStatus,
});
