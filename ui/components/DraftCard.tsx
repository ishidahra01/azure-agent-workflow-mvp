"use client";

interface DraftCardProps {
  draft: string | null;
}

export default function DraftCard({ draft }: DraftCardProps) {
  if (!draft) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Generated Draft</h2>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
          {draft}
        </pre>
      </div>
    </div>
  );
}
