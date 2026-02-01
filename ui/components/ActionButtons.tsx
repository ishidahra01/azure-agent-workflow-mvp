"use client";

import { WorkflowStatus } from "@/lib/types";

interface ActionButtonsProps {
  status: WorkflowStatus | null;
  onRefresh: () => void;
  onSendFix: (content: string, notes: string) => void;
  onApprove: (comments: string) => void;
  onReject: (comments: string) => void;
  isLoading: boolean;
}

export default function ActionButtons({
  status,
  onRefresh,
  onSendFix,
  onApprove,
  onReject,
  isLoading,
}: ActionButtonsProps) {
  const currentStep = status?.customStatus?.currentStep;
  const isAwaitingFix = currentStep === "AWAITING_HUMAN_FIX";
  const isAwaitingApproval = currentStep === "AWAITING_DRAFT_APPROVAL";

  const handleSendFix = () => {
    const content = prompt("Enter corrected content:");
    if (!content) return;

    const notes = prompt("Enter notes (optional):");
    onSendFix(content, notes || "");
  };

  const handleApprove = () => {
    const comments = prompt("Enter approval comments (optional):");
    onApprove(comments || "");
  };

  const handleReject = () => {
    const comments = prompt("Enter rejection comments:");
    if (!comments) return;
    onReject(comments);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Actions</h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Refreshing..." : "🔄 Refresh Status"}
        </button>

        {isAwaitingFix && (
          <button
            onClick={handleSendFix}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            ✏️ Send Fix
          </button>
        )}

        {isAwaitingApproval && (
          <>
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              ✓ Approve Draft
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              ✗ Reject Draft
            </button>
          </>
        )}
      </div>

      {isAwaitingFix && (
        <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          ⚠️ The workflow is waiting for you to fix validation issues. Click "Send Fix"
          to provide corrected content.
        </p>
      )}

      {isAwaitingApproval && (
        <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          ⚠️ The workflow is waiting for you to approve or reject the draft. Review the
          draft below and click "Approve" or "Reject".
        </p>
      )}
    </div>
  );
}
