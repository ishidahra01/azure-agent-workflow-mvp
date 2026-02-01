/**
 * Data models for the Ringi workflow system
 */

export interface WorkflowInput {
  documentId: string;
  requestorId: string;
  rawContent: string;
  metadata?: Record<string, any>;
}

export interface WorkflowState {
  documentId: string;
  requestorId: string;
  currentStep: WorkflowStep;
  extractedText?: string;
  searchQuery?: string;
  searchResults?: SearchResult[];
  validationResult?: ValidationResult;
  draft?: string;
  submissionId?: string;
  submissionStatus?: string;
  errors: string[];
  retryCount: number;
  startTime: string;
  lastUpdateTime: string;
}

export enum WorkflowStep {
  STARTED = 'STARTED',
  EXTRACTING_TEXT = 'EXTRACTING_TEXT',
  GENERATING_SEARCH_QUERY = 'GENERATING_SEARCH_QUERY',
  SEARCHING_PRECEDENTS = 'SEARCHING_PRECEDENTS',
  VALIDATING_CONTENT = 'VALIDATING_CONTENT',
  AWAITING_HUMAN_FIX = 'AWAITING_HUMAN_FIX',
  GENERATING_DRAFT = 'GENERATING_DRAFT',
  AWAITING_DRAFT_APPROVAL = 'AWAITING_DRAFT_APPROVAL',
  SUBMITTING_TO_INTERNAL = 'SUBMITTING_TO_INTERNAL',
  POLLING_SUBMISSION_STATUS = 'POLLING_SUBMISSION_STATUS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  issues?: string[];
  suggestions?: string[];
}

export interface HumanFixInput {
  correctedContent: string;
  notes?: string;
}

export interface DraftApprovalInput {
  approved: boolean;
  comments?: string;
  modifications?: string;
}

export interface LlmRequest {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ActivityError {
  activityName: string;
  errorMessage: string;
  timestamp: string;
}

export interface WorkflowOutput {
  documentId: string;
  status: 'completed' | 'failed';
  draft?: string;
  submissionId?: string;
  submissionStatus?: string;
  errors: string[];
  totalDuration: number;
}
