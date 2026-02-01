import {
  WorkflowInput,
  WorkflowStatus,
  StartWorkflowResponse,
  HumanFixInput,
  DraftApprovalInput,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

class WorkflowClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async startWorkflow(input: WorkflowInput): Promise<StartWorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/workflows/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to start workflow" }));
      throw new Error(error.error || "Failed to start workflow");
    }

    return response.json();
  }

  async getWorkflowStatus(instanceId: string): Promise<WorkflowStatus> {
    const response = await fetch(`${this.baseUrl}/workflows/status/${instanceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to get workflow status" }));
      throw new Error(error.error || "Failed to get workflow status");
    }

    return response.json();
  }

  async sendHumanFix(instanceId: string, input: HumanFixInput): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${instanceId}/events/human-fix`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to send human fix" }));
      throw new Error(error.error || "Failed to send human fix");
    }
  }

  async sendDraftApproval(
    instanceId: string,
    input: DraftApprovalInput
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/workflows/${instanceId}/events/draft-approval`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to send draft approval" }));
      throw new Error(error.error || "Failed to send draft approval");
    }
  }
}

export const workflowClient = new WorkflowClient();
