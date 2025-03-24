'use client';

import { useState, useEffect } from 'react';

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);  
    const [error, setError] = useState(null);  

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('loggedUser');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const email = userData?.email;  // Extract email from the stored user
                
                if (email) {
                    try {
                        const response = await fetch(`/api/users?email=${email}`);
                        
                        if (!response.ok) {
                            throw new Error('Failed to fetch user data');
                        }

                        const data = await response.json();
                        setUser(data);  // Set user data from API response
                    } catch (error) {
                        setError(error.message);
                        console.error("Error fetching user data:", error);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setError('Email not found in local storage');
                    setLoading(false);
                }
            } else {
                setError('No user found in local storage');
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // If loading, display a loading message
    if (loading) {
        return <div>Loading...</div>;
    }

    // If an error occurred, display the error message
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
                    <div className="relative w-32 h-32 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 sm:mb-0">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
        </div>
    );
}
