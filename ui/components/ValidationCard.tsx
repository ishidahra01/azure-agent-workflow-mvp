"use client";

import { ValidationResult } from "@/lib/types";

interface ValidationCardProps {
  validation: ValidationResult | null;
}

export default function ValidationCard({ validation }: ValidationCardProps) {
  if (!validation) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Validation Results</h2>

      <div className="space-y-4">
        <div>
          <span className="font-medium text-gray-700">Valid:</span>
          <p className="text-sm mt-1">
            <span
              className={`px-2 py-1 rounded ${
                validation.isValid
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {validation.isValid ? "✓ Yes" : "✗ No"}
            </span>
          </p>
        </div>

        {validation.overallAssessment && (
          <div>
            <span className="font-medium text-gray-700">Assessment:</span>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
              {validation.overallAssessment}
            </p>
          </div>
        )}

        {validation.issues && validation.issues.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Issues:</span>
            <div className="mt-2 space-y-2">
              {validation.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    issue.severity === "high"
                      ? "bg-red-50 border-red-200"
                      : issue.severity === "medium"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                            issue.severity === "high"
                              ? "bg-red-200 text-red-800"
                              : issue.severity === "medium"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        {issue.field && (
                          <span className="text-xs text-gray-500">
                            Field: {issue.field}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
