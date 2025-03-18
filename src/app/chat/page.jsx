'use client'
import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: input }]);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Chat</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-96 overflow-y-auto mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <p className="text-gray-800">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              className="ml-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}