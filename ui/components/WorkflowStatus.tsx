"use client";

import { WorkflowStatus, WORKFLOW_STEP_LABELS } from "@/lib/types";

interface WorkflowStatusProps {
  status: WorkflowStatus | null;
}

export default function WorkflowStatusComponent({ status }: WorkflowStatusProps) {
  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Workflow Status</h2>
        <p className="text-gray-500">No workflow instance started</p>
      </div>
    );
  }

  const currentStep = status.customStatus?.currentStep;
  const isAwaitingAction =
    currentStep === "AWAITING_HUMAN_FIX" ||
    currentStep === "AWAITING_DRAFT_APPROVAL";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Workflow Status</h2>

      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700">Instance ID:</span>
          <p className="text-sm text-gray-600 font-mono break-all mt-1">
            {status.instanceId}
          </p>
        </div>

        <div>
          <span className="font-medium text-gray-700">Runtime Status:</span>
          <p className="text-sm mt-1">
            <span
              className={`px-2 py-1 rounded ${
                status.runtimeStatus === "Running"
                  ? "bg-blue-100 text-blue-800"
                  : status.runtimeStatus === "Completed"
                  ? "bg-green-100 text-green-800"
                  : status.runtimeStatus === "Failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status.runtimeStatus}
            </span>
          </p>
        </div>

        {currentStep && (
          <div>
            <span className="font-medium text-gray-700">Current Step:</span>
            <p className="text-sm mt-1">
              <span
                className={`px-2 py-1 rounded ${
                  isAwaitingAction
                    ? "bg-yellow-100 text-yellow-800"
                    : currentStep === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : currentStep === "FAILED"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {WORKFLOW_STEP_LABELS[currentStep]}
              </span>
            </p>
          </div>
        )}

        {status.customStatus?.submissionId && (
          <div>
            <span className="font-medium text-gray-700">Submission ID:</span>
            <p className="text-sm text-gray-600 font-mono mt-1">
              {status.customStatus.submissionId}
            </p>
          </div>
        )}

        {status.customStatus?.submissionStatus && (
          <div>
            <span className="font-medium text-gray-700">Submission Status:</span>
            <p className="text-sm text-gray-600 mt-1">
              {status.customStatus.submissionStatus}
            </p>
          </div>
        )}

        {status.customStatus?.errors && status.customStatus.errors.length > 0 && (
          <div>
            <span className="font-medium text-red-700">Errors:</span>
            <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
              {status.customStatus.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>Created: {new Date(status.createdTime).toLocaleString()}</p>
          <p>Last Updated: {new Date(status.lastUpdatedTime).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
