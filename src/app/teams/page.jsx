'use client';

import { useState, useEffect } from "react";
import { FcSearch } from "react-icons/fc";

export default function Team() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Separate admins and regular users
  const admins = users.filter((user) => user.role === "admin");
  const regularUsers = users.filter((user) => user.role === "user");

  // Filter users based on search query
  const filteredAdmins = admins.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRegularUsers = regularUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Team</h1>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-center gap-4">
          <div className="relative w-full md:w-72 lg:w-96">
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-2 pl-10 pr-4 rounded-full w-full focus:ring-2 focus:ring-blue-500"
            />
            <FcSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-500" />
          </div>
        </div>

        {/* Admins Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Admins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredAdmins.length > 0 ? (
              filteredAdmins.map((user) => (
                <div key={user._id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                  <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">Role: {user.role}</p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No admins found</p>
            )}
          </div>
        </div>

        {/* Regular Users Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredRegularUsers.length > 0 ? (
              filteredRegularUsers.map((user) => (
                <div key={user._id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300">
                  <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">Role: {user.role}</p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No team members found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
