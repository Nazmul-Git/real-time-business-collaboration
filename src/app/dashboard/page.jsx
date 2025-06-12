'use client'
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import {
  FiCheckSquare,
} from 'react-icons/fi';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

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
    const userCookie = Cookies.get('loggedUser');
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
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

  const calculateProjectStats = () => {
    const total = projects?.length || 0;
    const completed = projects?.filter(p => p.status === 'done').length || 0;
    const inProgress = projects?.filter(p => p.status === 'in-progress').length || 0;
    const overdue = projects?.filter(p =>
      p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'todo'
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

  const calculatePercentage = (part, total) => {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  };

  const projectsChartData = {
    labels: ['Done', 'In Progress', 'Overdue'],
    datasets: [
      {
        label: 'Projects',
        data: [projectStats.completed, projectStats.inProgress, projectStats.overdue],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
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

  const tasksByProjectData = {
    labels: projects.map(p => p.title?.slice(0, 15) || 'Untitled'),
    datasets: [
      {
        label: 'Total Tasks',
        data: projects.map(project => tasks.filter(task => task.projectId === project._id).length),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Completed Tasks',
        data: projects.map(project => tasks.filter(task => task.projectId === project._id && task.status === 'done').length),
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
        <div className="text-center p-4 bg-white rounded-lg shadow-md max-w-xs mx-auto">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-3 sm:p-5 md:p-6 w-full max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 p-3 rounded-lg  border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900">📊 Dashboard</h1>
          <p className="text-xs text-gray-600">
            {projectStats.total} projects • {taskStats.total} tasks
          </p>
          <div className="flex gap-2 mt-1">
            <Link href="/dashboard" className="text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700">
              Dashboard
            </Link>
            <Link href="/tasks" className="text-xs px-3 py-1.5 bg-gray-100 text-gray-800 font-medium rounded-md shadow hover:bg-gray-200">
              All Tasks
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { 
              title: 'Total Projects', 
              value: projectStats.total,
              icon: <FiCheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />,
              bg: 'bg-blue-50',
              color: 'text-blue-600',
              barColor: 'bg-blue-500',
              percent: calculatePercentage(projectStats.completed, projectStats.total),
              desc: `${projectStats.completed} completed`
            },
            { 
              title: 'Completed Projects', 
              value: projectStats.completed,
              icon: <FiCheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />,
              bg: 'bg-green-50',
              color: 'text-green-600',
              desc: projectStats.completed > 0 ? 'On track' : 'No completions'
            },
            { 
              title: 'Total Tasks', 
              value: taskStats.total,
              icon: <FiCheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />,
              bg: 'bg-purple-50',
              color: 'text-purple-600',
              barColor: 'bg-purple-500',
              percent: calculatePercentage(taskStats.completed, taskStats.total),
              desc: `${taskStats.completed} completed`
            },
            { 
              title: 'Overdue', 
              value: projectStats.overdue + taskStats.overdue,
              icon: <FiCheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />,
              bg: 'bg-red-50',
              color: 'text-red-600',
              desc: `${projectStats.overdue} projects • ${taskStats.overdue} tasks`
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                  <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                </div>
                <div className={`p-1.5 ${stat.bg} rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              {stat.barColor && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.barColor} rounded-full`} style={{ width: `${stat.percent}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.desc}</p>
                </div>
              )}
              {!stat.barColor && <p className="text-xs text-gray-500 mt-1">{stat.desc}</p>}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Projects Status</h2>
            <div className="h-40 sm:h-48">
              <Pie 
                data={projectsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                  }
                }} 
              />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Tasks by Project</h2>
            <div className="h-40 sm:h-48">
              <Bar 
                data={tasksByProjectData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 9 } } },
                    x: { ticks: { font: { size: 9 } } }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Recent Projects</h2>
            <Link href="/projects" className="text-xs text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 text-xs font-medium text-gray-500">
                <div className="col-span-5">Project</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2">Tasks</div>
                <div className="col-span-2 hidden sm:block">Progress</div>
              </div>
              
              {/* Rows */}
              {projects.slice(0, 5).map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project._id);
                const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                const progress = calculatePercentage(completedTasks, projectTasks.length);
                const dueDate = project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline';

                return (
                  <div key={project._id} className="grid grid-cols-12 gap-2 p-2 border-b hover:bg-gray-50 items-center">
                    <div className="col-span-5">
                      <Link href={`/projects/${project._id}`} className="text-xs text-blue-500 hover:underline truncate block">
                        {project.title?.slice(0, 20) || 'Untitled Project'}
                      </Link>
                      <div className="text-xxs text-gray-400 sm:hidden">{dueDate}</div>
                    </div>
                    <div className="col-span-3">
                      <span className={`px-1.5 py-0.5 text-xxs rounded-full ${
                        project.status === 'done' ? 'bg-green-100 text-green-800' :
                        project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status ? project.status.replace('-', ' ') : 'Unknown'}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs">
                      {projectTasks.length} <span className="text-gray-400">({completedTasks})</span>
                    </div>
                    <div className="col-span-2 hidden sm:flex items-center gap-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          progress === 100 ? 'bg-green-500' :
                          progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-xxs">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}