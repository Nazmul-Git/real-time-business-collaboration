'use client';

import { useState, useEffect } from 'react';

export default function UserProfile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('loggedUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    console.log('user -- ', user)

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                        <img
                            src={user?.image}
                            alt="Profile"
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-800">{user?.name}</h1>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <button
                            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* User Information */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">User Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600">Username</h3>
                            <p className="text-gray-800">{user?.username}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600">Location</h3>
                            <p className="text-gray-800">{user?.location || 'Not Provided'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-600">Bio</h3>
                            <p className="text-gray-800">{user?.bio || 'No bio available'}</p>
                        </div>
                    </div>
                </div>

                {/* User Projects Section */}
                {/* <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Assigned Projects</h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project._id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-800">{project.title}</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <p className="text-sm text-gray-500 mt-2">Due Date: {new Date(project.dueDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No projects assigned yet.</p>
          )}
        </div> */}
            </div>
        </div>
    );
}
