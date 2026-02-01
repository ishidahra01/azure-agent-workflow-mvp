"use client";

import { useState, useEffect, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCopilotAction } from "@copilotkit/react-core";
import { workflowClient } from "@/lib/workflowClient";
import { WorkflowStatus as WorkflowStatusType } from "@/lib/types";
import WorkflowStatusComponent from "@/components/WorkflowStatus";
import ValidationCard from "@/components/ValidationCard";
import DraftCard from "@/components/DraftCard";
import ActionButtons from "@/components/ActionButtons";

function WorkflowApp() {
  const [documentId, setDocumentId] = useState("doc-" + Date.now());
  const [requestorId, setRequestorId] = useState("user-123");
  const [rawContent, setRawContent] = useState("");
  const [status, setStatus] = useState<WorkflowStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (instanceId: string) => {
    try {
      const statusData = await workflowClient.getWorkflowStatus(instanceId);
      setStatus(statusData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  }, []);

  useEffect(() => {
    if (status?.instanceId && status.runtimeStatus === "Running") {
      const interval = setInterval(() => {
        fetchStatus(status.instanceId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status?.instanceId, status?.runtimeStatus, fetchStatus]);

  const handleStartWorkflow = async () => {
    if (!rawContent.trim()) {
      setError("Please enter raw content");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await workflowClient.startWorkflow({
        documentId,
        requestorId,
        rawContent,
      });
      await fetchStatus(response.instanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start workflow");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!status?.instanceId) return;
    setIsLoading(true);
    await fetchStatus(status.instanceId);
    setIsLoading(false);
  };

  const handleSendFix = async (content: string, notes: string) => {
    if (!status?.instanceId) return;
    setIsLoading(true);
    try {
      await workflowClient.sendHumanFix(status.instanceId, {
        correctedContent: content,
        notes,
      });
      await fetchStatus(status.instanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send fix");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (comments: string) => {
    if (!status?.instanceId) return;
    setIsLoading(true);
    try {
      await workflowClient.sendDraftApproval(status.instanceId, {
        approved: true,
        comments,
      });
      await fetchStatus(status.instanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (comments: string) => {
    if (!status?.instanceId) return;
    setIsLoading(true);
    try {
      await workflowClient.sendDraftApproval(status.instanceId, {
        approved: false,
        comments,
      });
      await fetchStatus(status.instanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsLoading(false);
    }
  };

  useCopilotAction({
    name: "startWorkflow",
    description: "Start a new workflow instance with the provided document content",
    parameters: [
      {
        name: "fileText",
        type: "string",
        description: "The raw content of the document",
        required: true,
      },
      {
        name: "meta",
        type: "object",
        description: "Optional metadata for the document",
        required: false,
      },
    ],
    handler: async ({ fileText, meta }: { fileText: string; meta?: any }) => {
      setRawContent(fileText);
      setIsLoading(true);
      try {
        const response = await workflowClient.startWorkflow({
          documentId: meta?.documentId || documentId,
          requestorId: meta?.requestorId || requestorId,
          rawContent: fileText,
          metadata: meta,
        });
        await fetchStatus(response.instanceId);
        return `Workflow started successfully with instance ID: ${response.instanceId}`;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to start workflow"
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  useCopilotAction({
    name: "getWorkflowStatus",
    description: "Get the current status of a workflow instance",
    parameters: [
      {
        name: "instanceId",
        type: "string",
        description: "The workflow instance ID (optional, uses current if not provided)",
        required: false,
      },
    ],
    handler: async ({ instanceId }: { instanceId?: string }) => {
      const id = instanceId || status?.instanceId;
      if (!id) {
        throw new Error("No workflow instance ID available");
      }
      await fetchStatus(id);
      return `Status refreshed for instance: ${id}`;
    },
  });

  useCopilotAction({
    name: "sendHumanFix",
    description: "Send corrected content when validation fails",
    parameters: [
      {
        name: "instanceId",
        type: "string",
        description: "The workflow instance ID (optional, uses current if not provided)",
        required: false,
      },
      {
        name: "ok",
        type: "boolean",
        description: "Whether the fix is ready",
        required: true,
      },
      {
        name: "fixes",
        type: "string",
        description: "The corrected content",
        required: true,
      },
    ],
    handler: async ({ instanceId, ok, fixes }: { instanceId?: string; ok: boolean; fixes: string }) => {
      const id = instanceId || status?.instanceId;
      if (!id) {
        throw new Error("No workflow instance ID available");
      }
      if (!ok) {
        throw new Error("Fix not ready");
      }
      await handleSendFix(fixes, "Fix submitted via Copilot");
      return `Fix submitted successfully for instance: ${id}`;
    },
  });

  useCopilotAction({
    name: "sendDraftApproval",
    description: "Approve or reject the generated draft",
    parameters: [
      {
        name: "instanceId",
        type: "string",
        description: "The workflow instance ID (optional, uses current if not provided)",
        required: false,
      },
      {
        name: "approved",
        type: "boolean",
        description: "Whether the draft is approved",
        required: true,
      },
      {
        name: "feedback",
        type: "string",
        description: "Comments or feedback",
        required: false,
      },
    ],
    handler: async ({ instanceId, approved, feedback }: { instanceId?: string; approved: boolean; feedback?: string }) => {
      const id = instanceId || status?.instanceId;
      if (!id) {
        throw new Error("No workflow instance ID available");
      }
      if (approved) {
        await handleApprove(feedback || "Approved via Copilot");
      } else {
        await handleReject(feedback || "Rejected via Copilot");
      }
      return `Draft ${approved ? "approved" : "rejected"} for instance: ${id}`;
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Ringi Workflow Manager
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Start New Workflow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document ID
                </label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requestor ID
                </label>
                <input
                  type="text"
                  value={requestorId}
                  onChange={(e) => setRequestorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raw Content
                </label>
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your document content here..."
                />
              </div>
              <button
                onClick={handleStartWorkflow}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? "Starting..." : "🚀 Start Workflow"}
              </button>
            </div>
          </div>
        </div>

        {status && (
          <>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <WorkflowStatusComponent status={status} />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              <ActionButtons
                status={status}
                onRefresh={handleRefresh}
                onSendFix={handleSendFix}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={isLoading}
              />
            </div>

            {status.customStatus?.validationResult && (
              <div className="grid grid-cols-1 gap-6 mb-6">
                <ValidationCard
                  validation={status.customStatus.validationResult}
                />
              </div>
            )}

            {status.customStatus?.draft && (
              <div className="grid grid-cols-1 gap-6 mb-6">
                <DraftCard draft={status.customStatus.draft} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={true}
        labels={{
          title: "Workflow Assistant",
          initial:
            "Hi! I can help you manage your Ringi workflow. You can ask me to start a workflow, check status, send fixes, or approve drafts.",
        }}
        instructions="You are a helpful assistant for managing Ringi approval workflows. Help users start workflows, check status, fix validation issues, and approve drafts. Be concise and clear in your responses."
      >
        <WorkflowApp />
      </CopilotSidebar>
    </CopilotKit>
  );
}
