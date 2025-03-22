'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaHome, FaProjectDiagram, FaUsers, FaCalendarAlt, FaComments, FaUser, FaSignOutAlt } from "react-icons/fa";
import { TiArrowShuffle } from "react-icons/ti";
import { GiReturnArrow } from "react-icons/gi";

const NavLayout = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        router.push("/login");
    };

    // Function to close the navbar
    const closeNavbar = () => {
        setIsOpen(false);
    };

    return (
        <div className="fixed">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg focus:outline-none md:hidden"
            >
                {isOpen ? (
                    <GiReturnArrow size={24} className="transform rotate-180" />
                ) : (
                    <TiArrowShuffle size={24} className="transform rotate-180" />
                )}
            </button>

            {/* Navbar */}
            <div
                className={`fixed top-0 right-0 w-64 bg-gray-800 text-white p-6 flex flex-col h-screen transform transition-transform duration-300 ease-in-out z-40 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } md:translate-x-0 md:relative md:w-64`}
            >
                <div className="text-center mb-8 mt-8 py-6">
                    <h2 className="text-2xl font-semibold text-orange-500">Business Collab</h2>
                </div>
                <ul className="space-y-4">
                    <li>
                        <Link href="/dashboard" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaHome className="mr-3" />
                                Dashboard
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/projects" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaProjectDiagram className="mr-3" />
                                Projects
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/teams" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaUsers className="mr-3" />
                                Teams
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/meetings" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaCalendarAlt className="mr-3" />
                                Meetings
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/chat" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaComments className="mr-3" />
                                Chat
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href="/profile" onClick={closeNavbar}>
                            <div className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer">
                                <FaUser className="mr-3" />
                                Profile
                            </div>
                        </Link>
                    </li>
                    {/* Logout Button */}
                    <li>
                        <div
                            onClick={() => {
                                closeNavbar();
                                logout();
                            }}
                            className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer"
                        >
                            <FaSignOutAlt className="mr-3" />
                            Logout
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default NavLayout;