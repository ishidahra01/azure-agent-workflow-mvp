export type SubmissionStatus = 'Received' | 'InReview' | 'Completed';

export interface Submission {
  requestId: string;
  status: SubmissionStatus;
  title: string;
  description: string;
  submittedAt: Date;
  updatedAt: Date;
  estimatedCompletionTime?: Date;
}

class StatusManager {
  private submissions: Map<string, Submission> = new Map();
  private readonly transitionDelay: number;

  constructor(transitionDelayMs: number = 5000) {
    this.transitionDelay = transitionDelayMs;
  }

  createSubmission(requestId: string, title: string, description: string): Submission {
    const now = new Date();
    const submission: Submission = {
      requestId,
      status: 'Received',
      title,
      description,
      submittedAt: now,
      updatedAt: now,
      estimatedCompletionTime: new Date(now.getTime() + this.transitionDelay * 2),
    };

    this.submissions.set(requestId, submission);

    // Schedule automatic status transitions
    this.scheduleStatusTransitions(requestId);

    return submission;
  }

  getSubmission(requestId: string): Submission | undefined {
    return this.submissions.get(requestId);
  }

  private scheduleStatusTransitions(requestId: string): void {
    // Transition to InReview after delay
    setTimeout(() => {
      const submission = this.submissions.get(requestId);
      if (submission && submission.status === 'Received') {
        submission.status = 'InReview';
        submission.updatedAt = new Date();
        console.log(`[StatusManager] Transition ${requestId}: Received → InReview`);
      }
    }, this.transitionDelay);

    // Transition to Completed after 2x delay
    setTimeout(() => {
      const submission = this.submissions.get(requestId);
      if (submission && submission.status === 'InReview') {
        submission.status = 'Completed';
        submission.updatedAt = new Date();
        console.log(`[StatusManager] Transition ${requestId}: InReview → Completed`);
      }
    }, this.transitionDelay * 2);
  }

  getAllSubmissions(): Submission[] {
    return Array.from(this.submissions.values());
  }

  clearOldSubmissions(olderThanMs: number = 3600000): void {
    const cutoffTime = Date.now() - olderThanMs;
    for (const [requestId, submission] of this.submissions.entries()) {
      if (submission.submittedAt.getTime() < cutoffTime) {
        this.submissions.delete(requestId);
        console.log(`[StatusManager] Cleared old submission: ${requestId}`);
      }
    }
  }
}

export const statusManager = new StatusManager(
  parseInt(process.env.MOCK_STATUS_TRANSITION_DELAY_MS || '5000', 10)
);
