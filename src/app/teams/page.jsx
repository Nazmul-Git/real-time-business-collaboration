'use client';

import { useState, useEffect } from "react";
import { FcSearch, FcManager, FcBusinessman } from "react-icons/fc";
import { motion } from "framer-motion";

export default function Team() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
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

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-10"
        >
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Meet Our Team
          </h1>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            The talented individuals who make our organization thrive
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-10 flex justify-center px-2"
        >
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-sm sm:shadow-md p-2 xs:p-3 sm:p-4 pl-9 sm:pl-12 pr-4 sm:pr-6 rounded-full w-full focus:ring-2 focus:ring-blue-500 focus:shadow-md sm:focus:shadow-lg transition-all duration-200 text-xs xs:text-sm sm:text-base"
            />
            <FcSearch className="absolute left-2 sm:left-5 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl md:text-2xl text-gray-500" />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Admins Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 sm:mb-12"
            >
              <div className="flex items-center mb-3 sm:mb-5 px-2">
                <FcManager className="text-xl sm:text-2xl md:text-3xl mr-2 sm:mr-3" />
                <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-700">Leadership</h2>
              </div>
              
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map((user) => (
                    <motion.div 
                      key={user._id} 
                      variants={item}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }} 
                      className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md sm:hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500"
                    >
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mr-2 sm:mr-3">
                          <span className="text-base sm:text-lg md:text-xl font-bold text-blue-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{user.name}</h3>
                          <p className="text-[10px] xs:text-xs sm:text-sm text-blue-600 font-medium">Admin</p>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="flex items-center text-[10px] xs:text-xs sm:text-sm text-gray-600 truncate">
                          <svg className="w-3 h-3 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {user.email}
                        </p>
                        {user.department && (
                          <p className="flex items-center text-[10px] xs:text-xs sm:text-sm text-gray-600 truncate">
                            <svg className="w-3 h-3 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {user.department}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    variants={item}
                    className="col-span-full text-center py-6 sm:py-8"
                  >
                    <div className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">No leadership members found</div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Regular Users Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center mb-3 sm:mb-5 px-2">
                <FcBusinessman className="text-xl sm:text-2xl md:text-3xl mr-2 sm:mr-3" />
                <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-700">Team Members</h2>
              </div>
              
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                {filteredRegularUsers.length > 0 ? (
                  filteredRegularUsers.map((user) => (
                    <motion.div 
                      key={user._id} 
                      variants={item}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }} // Added for mobile touch feedback
                      className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md sm:hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500"
                    >
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mr-2 sm:mr-3">
                          <span className="text-base sm:text-lg md:text-xl font-bold text-purple-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">{user.name}</h3>
                          <p className="text-[10px] xs:text-xs sm:text-sm text-purple-600 font-medium">Team Member</p>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <p className="flex items-center text-[10px] xs:text-xs sm:text-sm text-gray-600 truncate">
                          <svg className="w-3 h-3 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {user.email}
                        </p>
                        {user.department && (
                          <p className="flex items-center text-[10px] xs:text-xs sm:text-sm text-gray-600 truncate">
                            <svg className="w-3 h-3 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {user.department}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    variants={item}
                    className="col-span-full text-center py-6 sm:py-8"
                  >
                    <div className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">No team members found</div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
