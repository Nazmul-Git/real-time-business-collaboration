'use client'
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import {
  FiHome,
  FiCheckSquare,
  FiBell,
  FiPieChart,
  FiSettings,
  FiCalendar,
  FiUser,
  FiLogOut
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get user data from cookies
    const userCookie = Cookies.get('loggedUser');
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Fetch projects and tasks data
    const fetchData = async () => {
      try {
        setLoading(true);

        // Simulate API calls - replace with actual fetch calls
        const [projectsRes, tasksRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/tasks')
        ]);

        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');

        const projectsData = await projectsRes.json();
        const tasksData = await tasksRes.json();

        setProjects(projectsData.data || []);
        setTasks(tasksData.data || []);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Safe calculation functions
  const calculateProjectStats = () => {
    const total = projects?.length || 0;
    const completed = projects?.filter(p => p.status === 'done').length || 0;
    const inProgress = projects?.filter(p => p.status === 'in-progress').length || 0;
    const overdue = projects?.filter(p =>
      p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'done'
    ).length || 0;

    return { total, completed, inProgress, overdue };
  };

  const calculateTaskStats = () => {
    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.status === 'done').length || 0;
    const inProgress = tasks?.filter(t => t.status === 'in-progress').length || 0;
    const overdue = tasks?.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
    ).length || 0;

    return { total, completed, inProgress, overdue };
  };

  const projectStats = calculateProjectStats();
  const taskStats = calculateTaskStats();

  // Safe percentage calculation
  const calculatePercentage = (part, total) => {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  };

  // Chart data for projects
  const projectsChartData = {
    labels: ['Done', 'In Progress', 'Overdue'],
    datasets: [
      {
        label: 'Projects',
        data: [
          projectStats.completed,
          projectStats.inProgress,
          projectStats.overdue
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(59, 130, 246, 0.8)',  // blue
          'rgba(239, 68, 68, 0.8)'     // red
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for tasks by project
  const tasksByProjectData = {
    labels: projects.map(p => p.title || 'Untitled Project'),
    datasets: [
      {
        label: 'Total Tasks',
        data: projects.map(project =>
          tasks.filter(task => task.projectId === project._id).length
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Completed Tasks',
        data: projects.map(project =>
          tasks.filter(task =>
            task.projectId === project._id && task.status === 'done'
          ).length
        ),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-lg">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">📊 Dashboard Overview</h1>
            <p className="text-gray-600 mt-1 text-sm">
              {projectStats.total} projects • {taskStats.total} tasks
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 transition duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center px-5 py-2.5 bg-gray-100 text-gray-800 font-medium rounded-md shadow hover:bg-gray-200 transition duration-200"
            >
              All Tasks
            </Link>
          </div>
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="w-full max-w-sm md:max-w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 mx-auto">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                <p className="text-2xl font-bold mt-1">{projectStats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <FiCheckSquare size={20} />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${calculatePercentage(projectStats.completed, projectStats.total)}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculatePercentage(projectStats.completed, projectStats.total)}% completed
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Projects</p>
                <p className="text-2xl font-bold mt-1">{projectStats.completed}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <FiCheckSquare size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {projectStats.completed > 0 ? 'Last completed recently' : 'No projects completed yet'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold mt-1">{taskStats.total}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <FiCheckSquare size={20} />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${calculatePercentage(taskStats.completed, taskStats.total)}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculatePercentage(taskStats.completed, taskStats.total)}% completed
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Items</p>
                <p className="text-2xl font-bold mt-1">
                  {projectStats.overdue + taskStats.overdue}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <FiCheckSquare size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {projectStats.overdue} projects • {taskStats.overdue} tasks
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects Status</h2>
            <div className="h-64">
              <Pie
                data={projectsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Project</h2>
            <div className="h-64">
              <Bar
                data={tasksByProjectData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Tasks'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Projects'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-blue-500 hover:underline">
              View All Projects
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.slice(0, 5).map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project._id);
                  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                  const progress = calculatePercentage(completedTasks, projectTasks.length);

                  return (
                    <tr key={project._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/projects/${project._id}`} className="text-blue-500 hover:underline">
                          {project.title || 'Untitled Project'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'done' ? 'bg-green-100 text-green-800' :
                          project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {project.status ? project.status.replace('-', ' ') : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {projectTasks.length} tasks ({completedTasks} completed)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${progress === 100 ? 'bg-green-500' :
                              progress > 50 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{progress}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
