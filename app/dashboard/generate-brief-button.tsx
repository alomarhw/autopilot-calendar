"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function GenerateBriefButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [cached, setCached] = useState(false);

  async function fetchBrief(regenerate = false) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, regenerate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate brief");
      }

      setBrief(data.briefMarkdown || "");
      setCached(Boolean(data.cached));
      setVisible(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleVisibility() {
    setVisible((v) => !v);
  }

  return (
    <div className="space-y-3">
      {!brief ? (
        <button
          onClick={() => fetchBrief(false)}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Brief"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleVisibility}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            {visible ? "Hide Brief" : "Show Brief"}
          </button>

          <button
            onClick={() => fetchBrief(true)}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Regenerate Brief"}
          </button>

          <div className="text-xs text-gray-500">
            {cached ? "Saved brief" : "Newly generated"}
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {brief ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          <button
            onClick={toggleVisibility}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-100"
          >
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Meeting Brief
              </div>
              <div className="text-xs text-gray-500">
                {visible ? "Click to collapse" : "Click to expand"}
              </div>
            </div>

            <div className="text-sm font-medium text-gray-600">
              {visible ? "−" : "+"}
            </div>
          </button>

          {visible ? (
            <div className="border-t bg-white p-5">
              <div className="prose prose-sm max-w-none text-gray-900">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-3 text-xl font-bold text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-2 mt-5 text-lg font-semibold text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-base font-semibold text-gray-900">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-7 text-gray-800">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 list-disc pl-5 text-gray-800">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 list-decimal pl-5 text-gray-800">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 leading-7">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-sm text-gray-900">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {brief}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}