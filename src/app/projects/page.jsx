'use client';

import { useState, useEffect } from "react";

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
            const res = await fetch("http://localhost:3000/api/projects");
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
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Completed Projects</h1>
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Search projects..."
                            className="w-48 p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Projects Table */}
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["title", "project", "description", "dueDate", "userIds"].map((key) => (
                                            <th
                                                key={key}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort(key)}
                                            >
                                                {key === "userIds" ? "Assigned To" : key.charAt(0).toUpperCase() + key.slice(1)}
                                                {sortConfig.key === key && (
                                                    <span className="ml-1">
                                                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentProjects.length > 0 ? (
                                        currentProjects.map(project => (
                                            <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {project.title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {project.project}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-normal">
                                                    {project.description}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(project.dueDate).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric"
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {project.userIds && Array.isArray(project.userIds) && project.userIds.length > 0
                                                        ? project.userIds
                                                            .map(userId => {
                                                                const assignedUser = project.users?.find(user => user._id === userId);
                                                                return assignedUser ? assignedUser.name : null;
                                                            })
                                                            .filter(name => name !== null)
                                                            .join(", ") || "No users assigned"
                                                        : "No users assigned"}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-gray-500">
                                                No projects found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center mt-6">
                            {Array.from({ length: Math.ceil(filteredProjects.length / projectsPerPage) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`mx-1 px-4 py-2 rounded-lg ${
                                        currentPage === i + 1
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