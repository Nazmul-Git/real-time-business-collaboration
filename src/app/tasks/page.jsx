'use client';

import { useState, useEffect } from "react";
import { FcSearch } from "react-icons/fc";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    status: "todo",
    project: "",
    description: "",
    userIds: [],
    dueDate: "",
  });
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByUser, setFilterByUser] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const loggedUser = localStorage.getItem('loggedUser');
    if (storedUser || loggedUser) {
      setUser(JSON.parse(storedUser || loggedUser));
    }

    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log('fetch task = ', data);
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.project || newTask.userIds.length === 0 || !newTask.dueDate) {
      alert("Please fill in all fields, assign at least one user, and select a due date.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const task = await res.json();
      console.log('post task = ', task);
      setTasks([...tasks, task]);
      setNewTask({
        title: "",
        status: "todo",
        project: "",
        description: "",
        userIds: [],
        dueDate: "",
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUserSelectionChange = (e) => {
    const { value, checked } = e.target;
    const updatedUserIds = checked
      ? [...newTask.userIds, value]
      : newTask.userIds.filter(id => id !== value);
    setNewTask({ ...newTask, userIds: updatedUserIds });
  };

  const handleSelectAllUsers = () => {
    if (users.length === newTask.userIds.length) {
      setNewTask({ ...newTask, userIds: [] });
    } else {
      setNewTask({ ...newTask, userIds: users.map(user => user._id) });
    }
  };

  const handleUpdateStatus = async (id, newStatus, previousStatus) => {
    setTasks(tasks.map(task =>
      task._id === id ? { ...task, status: newStatus, prevStatus: previousStatus } : task
    ));

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

  // moving a task to "Done"
  const handleMoveToDone = async (id) => {
    try {
      const taskToMove = tasks.find(task => task._id === id);

      // Call the API to move the task to the projects table
      const moveResponse = await fetch("http://localhost:3000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskToMove }),
      });

      if (!moveResponse.ok) throw new Error("Failed to move task to projects");

      // Delete the task from the tasks table
      await fetch(`http://localhost:3000/api/tasks/${id}`, { method: "DELETE" });
      setTasks(tasks.filter(task => task._id !== id));
    } catch (error) {
      console.error("Error moving task to projects:", error);
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
      if (user.role === 'admin') {
        await fetch(`http://localhost:3000/api/tasks/${id}`, { method: "DELETE" });
        setTasks(tasks.filter(task => task._id !== id));
      } else {
        alert('Only admin can delete this task!');
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };


  // Filter tasks by name, assigned users, and user ID
  const filteredTasks = tasks.filter(task => {
    const isAssignedToUser = !filterByUser || (task.userIds && Array.isArray(task.userIds) && task.userIds.includes(user?._id));
    const matchesSearchQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssignedUser = task.userIds && Array.isArray(task.userIds) && task.userIds.some(userId => {
      const assignedUser = users.find(user => user._id === userId);
      return assignedUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return isAssignedToUser && (matchesSearchQuery || matchesAssignedUser);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Task Management</h1>

        {user && (
          <div className="mb-6 flex flex-col md:flex-row justify-end">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search by title or name..."
                className="border p-2 pl-4 pr-2 rounded-4xl w-full focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <FcSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-500" />
            </div>
          </div>
        )}

        {user && user.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Task</h2>
            <input
              type="text"
              placeholder="Task Title"
              className="border p-2 rounded w-full mb-2 focus:ring-2 focus:ring-blue-500"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Project Name"
              className="border p-2 rounded w-full mb-2 focus:ring-2 focus:ring-blue-500"
              value={newTask.project}
              onChange={e => setNewTask({ ...newTask, project: e.target.value })}
            />
            <textarea
              placeholder="Description"
              className="border p-2 rounded w-full mb-2 focus:ring-2 focus:ring-blue-500"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />

            <input
              type="date"
              className="border p-2 rounded w-full mb-2 focus:ring-2 focus:ring-blue-500"
              value={newTask.dueDate}
              onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
            />

            <div className="mb-4 mt-4">
              <label className="block text-sm text-gray-700 mb-4">Assign Users:</label>

              <div className="flex justify-end">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={newTask.userIds.length === users.length}
                  onChange={handleSelectAllUsers}
                />
                <label htmlFor="select-all" className="ml-2 text-sm text-gray-800">Select All Users</label>
              </div>

              <div className="space-y-2">
                {users
                  .filter(user => user.role !== 'admin')
                  .map(user => (
                    <div key={user._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`user-${user._id}`}
                        value={user._id}
                        checked={newTask.userIds.includes(user._id)}
                        onChange={handleUserSelectionChange}
                        className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor={`user-${user._id}`} className="ml-2 text-sm text-gray-800">{user.name}</label>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={handleAddTask}
              className="bg-blue-500 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-600 transition duration-200"
            >
              Add Task
            </button>
          </div>
        )}

        {/* Task List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["todo", "in-progress", "done"].map(status => (
            <div key={status} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{status.toUpperCase()}</h2>
              {filteredTasks
                .filter(task => task.status === status)
                .map(task => (
                  <div key={task._id} className="bg-gray-50 p-4 rounded-lg mb-2 shadow-sm">
                    <p className="text-gray-800 font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">Project: {task.project}</p>
                    <p className="text-xs text-gray-400">{task.description}</p>
                    <p className="text-sm text-gray-500">
                      Due Date: {new Date(task.dueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>

                    {/* Display Assigned Users */}
                    <p className="text-sm text-gray-500">
                      Assigned to:{" "}
                      {(task.userIds && Array.isArray(task.userIds) && task.userIds.length > 0)
                        ? task.userIds
                          .map(userId => {
                            const assignedUser = users.find(user => user._id === userId);
                            return assignedUser ? assignedUser.name : null;
                          })
                          .filter(name => name !== null)
                          .join(", ") || "No users assigned"
                        : "No users assigned"}
                    </p>

                    <div className="mt-2 flex gap-2">
                      {task.status !== "done" && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, task.status === "todo" ? "in-progress" : "done", task.status)}
                          className="bg-green-500 text-white px-3 py-1 cursor-pointer rounded text-sm hover:bg-green-600 transition duration-200"
                        >
                          Move to {task.status === "todo" ? "In-Progress" : "Done"}
                        </button>
                      )}
                      {task.prevStatus && (
                        <button
                          onClick={() => handleUndoStatus(task._id, task.prevStatus)}
                          className="bg-yellow-500 text-white px-3 py-1 cursor-pointer rounded text-sm hover:bg-yellow-600 transition duration-200"
                        >
                          Undo
                        </button>
                      )}
                      {task.status === "done" && (
                        <button
                          onClick={() => handleMoveToDone(task._id)}
                          className="bg-green-500 text-white px-3 py-1 cursor-pointer rounded text-sm hover:bg-green-600 transition duration-200"
                        >
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="bg-red-500 text-white px-3 py-1 cursor-pointer rounded text-sm hover:bg-red-600 transition duration-200"
                      >
                        Delete
                      </button>
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
