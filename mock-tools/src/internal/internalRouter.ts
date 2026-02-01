import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { statusManager } from '../utils/statusManager';

const router = Router();

interface SubmitRequest {
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

interface SubmitResponse {
  requestId: string;
  status: string;
  message: string;
  submittedAt: string;
  estimatedCompletionTime?: string;
}

interface StatusResponse {
  requestId: string;
  status: string;
  title: string;
  description: string;
  submittedAt: string;
  updatedAt: string;
  estimatedCompletionTime?: string;
  message: string;
}

// POST /mock/internal/submit
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { title, description, metadata }: SubmitRequest = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'title is required and must be a non-empty string',
      });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'description is required and must be a non-empty string',
      });
      return;
    }

    // Generate unique request ID
    const requestId = uuidv4();

    console.log(`[Internal API] Creating submission: ${requestId}`);
    console.log(`[Internal API] Title: ${title}`);
    console.log(`[Internal API] Description: ${description}`);
    if (metadata) {
      console.log(`[Internal API] Metadata:`, metadata);
    }

    // Create submission in status manager
    const submission = statusManager.createSubmission(requestId, title, description);

    const response: SubmitResponse = {
      requestId: submission.requestId,
      status: submission.status,
      message: 'Submission received successfully',
      submittedAt: submission.submittedAt.toISOString(),
      estimatedCompletionTime: submission.estimatedCompletionTime?.toISOString(),
    };

    console.log(`[Internal API] Submission created with status: ${submission.status}`);
    res.status(201).json(response);
  } catch (error) {
    console.error('[Internal API] Error in /submit:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the submission',
    });
  }
});

// GET /mock/internal/status/:requestId
router.get('/status/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'requestId is required',
      });
      return;
    }

    console.log(`[Internal API] Fetching status for: ${requestId}`);

    const submission = statusManager.getSubmission(requestId);

    if (!submission) {
      console.log(`[Internal API] Submission not found: ${requestId}`);
      res.status(404).json({
        error: 'Not Found',
        message: `Submission with requestId ${requestId} not found`,
      });
      return;
    }

    const statusMessages: Record<string, string> = {
      Received: 'Your submission has been received and is awaiting review',
      InReview: 'Your submission is currently under review by our team',
      Completed: 'Your submission has been reviewed and completed',
    };

    const response: StatusResponse = {
      requestId: submission.requestId,
      status: submission.status,
      title: submission.title,
      description: submission.description,
      submittedAt: submission.submittedAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      estimatedCompletionTime: submission.estimatedCompletionTime?.toISOString(),
      message: statusMessages[submission.status] || 'Status unknown',
    };

    console.log(`[Internal API] Current status: ${submission.status}`);
    res.json(response);
  } catch (error) {
    console.error('[Internal API] Error in /status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the submission status',
    });
  }
});

// GET /mock/internal/submissions (bonus: list all submissions)
router.get('/submissions', async (_req: Request, res: Response) => {
  try {
    console.log('[Internal API] Fetching all submissions');
    const submissions = statusManager.getAllSubmissions();

    res.json({
      total: submissions.length,
      submissions: submissions.map((sub) => ({
        requestId: sub.requestId,
        status: sub.status,
        title: sub.title,
        submittedAt: sub.submittedAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Internal API] Error in /submissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching submissions',
    });
  }
});

export default router;
