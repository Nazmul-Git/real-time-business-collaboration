'use client'
import { useState } from "react";

export default function Document() {
  const [content, setContent] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Document Collaboration</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start typing..."
          />
        </div>
      </div>
    </div>
  );
}