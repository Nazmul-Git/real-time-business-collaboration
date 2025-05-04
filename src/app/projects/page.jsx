'use client';

import { useState, useEffect } from "react";
import { FcSearch } from "react-icons/fc";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(5); // Number of projects per page
  const [loading, setLoading] = useState(true);

  // Fetch projects from the API
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLIENT_URL}/api/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.data);
      setFilteredProjects(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = projects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.userIds.some(userId => {
        const assignedUser = project.users?.find(user => user._id === userId);
        return assignedUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to the first page after search
  }, [searchQuery, projects]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredProjects].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredProjects(sorted);
  };

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-end">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Completed Projects</h1>
          {/* Search Bar */}
          <div className="mb-6 flex flex-col md:flex-row justify-end items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-72 lg:w-96">
              <input
                type="text"
                placeholder="Search by project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 pl-10 pr-4 rounded-4xl w-full focus:ring-2 focus:ring-blue-500"
              />
              <FcSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-500" />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Projects Grid for md and up (Table) */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-x-auto">
              <div className="flex flex-col">
                {/* Header Row */}
                <div className="flex bg-gray-50 p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {["title", "project", "description", "dueDate", "userIds"].map((key) => (
                    <div
                      key={key}
                      className="flex-1 px-6 py-3 cursor-pointer"
                      onClick={() => handleSort(key)}
                    >
                      {key === "userIds" ? "Assigned To" : key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortConfig.key === key && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Data Rows */}
                <div className="divide-y divide-gray-200">
                  {currentProjects.length > 0 ? (
                    currentProjects.map((project) => (
                      <div key={project._id} className="flex p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 px-6 py-4 text-sm font-medium text-gray-900">
                          {project.title}
                        </div>
                        <div className="flex-1 px-6 py-4 text-sm text-gray-500">
                          {project.project}
                        </div>
                        <div className="flex-1 px-6 py-4 text-sm text-gray-500">
                          {project.description}
                        </div>
                        <div className="flex-1 px-6 py-4 text-sm text-gray-500">
                          {new Date(project.dueDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex-1 px-6 py-4 text-sm text-gray-500">
                          {project.userIds && Array.isArray(project.userIds) && project.userIds.length > 0
                            ? project.userIds
                              .map(userId => {
                                const assignedUser = project.users?.find(user => user._id === userId);
                                return assignedUser ? assignedUser.name : null;
                              })
                              .filter(name => name !== null)
                              .join(", ") || "No users assigned"
                            : "No users assigned"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No projects found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Projects Cards for sm and below */}
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProjects.length > 0 ? (
                currentProjects.map((project) => (
                  <div key={project._id} className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800">{project.title}</h3>
                    <p className="text-sm text-gray-500">{project.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Assigned To: </strong>
                      {project.userIds && Array.isArray(project.userIds) && project.userIds.length > 0
                        ? project.userIds
                          .map(userId => {
                            const assignedUser = project.users?.find(user => user._id === userId);
                            return assignedUser ? assignedUser.name : null;
                          })
                          .filter(name => name !== null)
                          .join(", ") || "No users assigned"
                        : "No users assigned"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Due Date: </strong>
                      {new Date(project.dueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No projects found.
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              {Array.from({ length: Math.ceil(filteredProjects.length / projectsPerPage) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`mx-1 px-4 py-2 rounded-lg ${currentPage === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
