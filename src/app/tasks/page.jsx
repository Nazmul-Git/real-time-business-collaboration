'use client'

import { useState, useEffect } from "react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", status: "todo", project: "", description: "" });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.project) return;
    try {
      const res = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const task = await res.json();
      setTasks([...tasks, task]);
      setNewTask({ title: "", status: "todo", project: "", description: "" });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUpdateStatus = async (id, newStatus, previousStatus) => {
    setTasks(tasks.map(task => task._id === id ? { ...task, status: newStatus, prevStatus: previousStatus } : task));
    try {
      await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, prevStatus: previousStatus }),
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleUndoStatus = async (id, prevStatus) => {
    setTasks(tasks.map(task => task._id === id ? { ...task, status: prevStatus, prevStatus: null } : task));
    try {
      await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: prevStatus, prevStatus: null }),
      });
    } catch (error) {
      console.error("Error undoing status change:", error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/tasks/${id}`, { method: "DELETE" });
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Task Management</h1>

        {
          user && user.role === 'admin' &&

          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Task</h2>
            <input type="text" placeholder="Task Title" className="border p-2 rounded w-full mb-2" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
            <input type="text" placeholder="Project Name" className="border p-2 rounded w-full mb-2" value={newTask.project} onChange={e => setNewTask({ ...newTask, project: e.target.value })} />
            <textarea placeholder="Description" className="border p-2 rounded w-full mb-2" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
            <button onClick={handleAddTask} className="bg-blue-500 cursor-pointer text-white px-4 py-2 rounded">Add Task</button>
          </div>
        }

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["todo", "in-progress", "done"].map(status => (
            <div key={status} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{status.toUpperCase()}</h2>
              {tasks.filter(task => task.status === status).map(task => (
                <div key={task._id} className="bg-gray-50 p-4 rounded-lg mb-2 shadow-sm">
                  <p className="text-gray-800 font-medium">{task.title}</p>
                  <p className="text-sm text-gray-500">Project: {task.project}</p>
                  <p className="text-xs text-gray-400">{task.description}</p>
                  <div className="mt-2 flex gap-2">
                    {task.status !== "done" && (
                      <button onClick={() => handleUpdateStatus(task._id, task.status === "todo" ? "in-progress" : "done", task.status)} className="bg-green-500 cursor-pointer text-white px-3 py-1 rounded text-sm">Move to {task.status === "todo" ? "In-Progress" : "Done"}</button>
                    )}
                    {task.prevStatus && (
                      <button onClick={() => handleUndoStatus(task._id, task.prevStatus)} className="bg-yellow-500 cursor-pointer text-white px-3 py-1 rounded text-sm">Undo</button>
                    )}
                    <button onClick={() => handleDeleteTask(task._id)} className="bg-red-500 text-white px-3 py-1 cursor-pointer rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
