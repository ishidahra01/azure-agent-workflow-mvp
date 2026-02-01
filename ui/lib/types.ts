export interface WorkflowInput {
  documentId: string;
  requestorId: string;
  rawContent: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationIssue {
  severity: "high" | "medium" | "low";
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  overallAssessment: string;
}

export interface SearchResult {
  documentId: string;
  title: string;
  content: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export interface CustomStatus {
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
  errors?: string[];
  retryCount: number;
  startTime: string;
  lastUpdateTime: string;
}

export interface WorkflowStatus {
  instanceId: string;
  runtimeStatus: "Running" | "Completed" | "Failed" | "Pending" | "Terminated";
  input?: WorkflowInput;
  output?: unknown;
  customStatus?: CustomStatus;
  createdTime: string;
  lastUpdatedTime: string;
}

export interface StartWorkflowResponse {
  instanceId: string;
  statusQueryGetUri: string;
  sendEventPostUri: string;
  terminatePostUri: string;
  purgeHistoryDeleteUri: string;
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

export type WorkflowStep =
  | "STARTED"
  | "EXTRACTING_TEXT"
  | "GENERATING_SEARCH_QUERY"
  | "SEARCHING_PRECEDENTS"
  | "VALIDATING_CONTENT"
  | "AWAITING_HUMAN_FIX"
  | "GENERATING_DRAFT"
  | "AWAITING_DRAFT_APPROVAL"
  | "SUBMITTING_TO_INTERNAL"
  | "POLLING_SUBMISSION_STATUS"
  | "COMPLETED"
  | "FAILED";

export const WORKFLOW_STEP_LABELS: Record<WorkflowStep, string> = {
  STARTED: "Started",
  EXTRACTING_TEXT: "Extracting Text",
  GENERATING_SEARCH_QUERY: "Generating Search Query",
  SEARCHING_PRECEDENTS: "Searching Precedents",
  VALIDATING_CONTENT: "Validating Content",
  AWAITING_HUMAN_FIX: "⏸️ Awaiting Human Fix",
  GENERATING_DRAFT: "Generating Draft",
  AWAITING_DRAFT_APPROVAL: "⏸️ Awaiting Draft Approval",
  SUBMITTING_TO_INTERNAL: "Submitting to Internal System",
  POLLING_SUBMISSION_STATUS: "Polling Submission Status",
  COMPLETED: "✅ Completed",
  FAILED: "❌ Failed"
};
