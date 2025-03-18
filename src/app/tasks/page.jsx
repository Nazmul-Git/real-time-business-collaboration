'use client'
import { useState } from "react";

export default function Tasks() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Task 1", status: "todo" },
    { id: 2, title: "Task 2", status: "in-progress" },
    { id: 3, title: "Task 3", status: "done" },
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Task Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["todo", "in-progress", "done"].map((status) => (
            <div key={status} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {status.toUpperCase()}
              </h2>
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-lg mb-2">
                    <p className="text-gray-800">{task.title}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}