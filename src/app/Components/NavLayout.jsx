'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaHome, FaProjectDiagram, FaUsers, FaCalendarAlt, FaComments, FaUser, FaSignOutAlt } from "react-icons/fa";
import { TiArrowShuffle } from "react-icons/ti";
import { GiReturnArrow } from "react-icons/gi";

const NavLayout = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState("");

    useEffect(() => {
        // Get active menu item from localStorage
        const storedActiveItem = localStorage.getItem("activeNavItem");
        if (storedActiveItem) {
            setActiveItem(storedActiveItem);
        }
    }, []);

    const handleNavClick = (item) => {
        setActiveItem(item);
        localStorage.setItem("activeNavItem", item);
        closeNavbar();
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedUser");
        localStorage.removeItem("activeNavItem"); // Clear active item on logout
        router.push("/login");
    };

    const closeNavbar = () => {
        setIsOpen(false);
    };

    return (
        <div className="fixed z-50">
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

            <div
                className={`fixed top-0 right-0 w-64 bg-gray-800 text-white p-6 flex flex-col h-screen transform transition-transform duration-500 ease-in-out z-40 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } md:translate-x-0 md:relative md:w-64`}
            >
                <div className="text-center mb-8 mt-8 py-6">
                    <h2 className="text-2xl font-semibold text-orange-500">Business Collab</h2>
                </div>

                {/* Scrollable Nav Items */}
                <div className="max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-hide">
                    <ul className="space-y-4">
                        {[
                            { href: "/dashboard", label: "Dashboard", icon: <FaHome className="mr-3" /> },
                            { href: "/projects", label: "Projects", icon: <FaProjectDiagram className="mr-3" /> },
                            { href: "/teams", label: "Teams", icon: <FaUsers className="mr-3" /> },
                            { href: "/meetings", label: "Meetings", icon: <FaCalendarAlt className="mr-3" /> },
                            { href: "/chat", label: "Chat", icon: <FaComments className="mr-3" /> },
                            { href: "/profile", label: "Profile", icon: <FaUser className="mr-3" /> },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={() => handleNavClick(item.href)}>
                                    <div
                                        className={`flex items-center text-lg px-3 py-2 rounded transition duration-300 cursor-pointer ${
                                            activeItem === item.href ? "bg-orange-500 text-white" : "hover:bg-gray-700"
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {/* Logout Button */}
                        <li>
                            <div
                                onClick={logout}
                                className="flex items-center text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer"
                            >
                                <FaSignOutAlt className="mr-3" />
                                Logout
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NavLayout;
