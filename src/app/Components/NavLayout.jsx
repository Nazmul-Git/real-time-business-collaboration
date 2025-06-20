'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    FaHome,
    FaProjectDiagram,
    FaUsers,
    FaCalendarAlt,
    FaInbox,
    FaUser,
    FaSignOutAlt,
    FaHeadset,
    FaComments
} from "react-icons/fa";
import { TiArrowShuffle } from "react-icons/ti";
import { GiReturnArrow } from "react-icons/gi";
import { IoChevronDownSharp } from "react-icons/io5";
import Cookies from "js-cookie";

const NavLayout = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState("/dashboard");
    const [showChatDropdown, setShowChatDropdown] = useState(false);

    // Check authentication status
    useEffect(() => {
        const checkAuth = () => {
            const loggedUser = Cookies.get('loggedUser');
            const token = Cookies.get('token');
            
            // If no logged user or token, redirect to login
            if (!loggedUser || !token) {
                // Don't redirect if already on login page
                if (pathname !== '/login') {
                    router.push('/login');
                }
            }
        };

        checkAuth();
    }, [pathname, router]);

    useEffect(() => {
        // Set initial active item based on current route
        const storedActiveItem = Cookies.get("activeNavItem");
        const currentActive = 
            pathname.startsWith("/chat") ? "/chat" :
            pathname.startsWith("/profile") ? "/profile" :
            pathname.startsWith("/projects") ? "/projects" :
            pathname.startsWith("/teams") ? "/teams" :
            pathname.startsWith("/meetings") ? "/meetings" :
            storedActiveItem || "/dashboard"; // Default to dashboard
        
        setActiveItem(currentActive);
        
        // Update cookie if needed
        if (!storedActiveItem || storedActiveItem !== currentActive) {
            Cookies.set("activeNavItem", currentActive, { path: '/' });
        }
    }, [pathname]);

    const handleNavClick = (item) => {
        setActiveItem(item);
        Cookies.set("activeNavItem", item, { path: '/' });
        closeNavbar();
    };

    const logout = () => {
        // Remove all relevant cookies
        Cookies.remove('loggedUser', { path: '/' });
        Cookies.remove('token', { path: '/' });
        Cookies.remove('activeNavItem', { path: '/' });
        Cookies.remove('roomId', { path: '/' });
        router.push('/login');
    };

    const closeNavbar = () => {
        setIsOpen(false);
    };

    return (
        <div className="fixed z-50">
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg focus:outline-none md:hidden"
                aria-label="Toggle navigation"
            >
                {isOpen ? (
                    <GiReturnArrow size={24} className="transform rotate-180" />
                ) : (
                    <TiArrowShuffle size={24} className="transform rotate-180" />
                )}
            </button>

            {/* Navigation sidebar */}
            <div
                className={`fixed top-0 right-0 w-64 bg-gray-900 text-white p-6 flex flex-col h-screen transform transition-transform duration-500 ease-in-out z-40 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } md:translate-x-0 md:relative md:w-64`}
            >
                <div className="text-center mb-8 mt-8 py-6">
                    <h2 className="text-2xl font-bold text-orange-500 tracking-wide">Business Collab</h2>
                </div>

                <div className="max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-hide pr-1">
                    <ul className="space-y-3">
                        {/* Main navigation items */}
                        {[
                            { href: "/dashboard", label: "Dashboard", icon: <FaHome /> },
                            { href: "/projects", label: "Projects", icon: <FaProjectDiagram /> },
                            { href: "/teams", label: "Teams", icon: <FaUsers /> },
                            { href: "/meetings", label: "Meetings", icon: <FaCalendarAlt /> },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} onClick={() => handleNavClick(item.href)}>
                                    <div
                                        className={`flex items-center gap-3 text-lg px-3 py-2 rounded transition duration-300 cursor-pointer ${
                                            activeItem === item.href ? "bg-orange-500 text-white" : "hover:bg-gray-700"
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}

                        {/* Chat dropdown */}
                        <li
                            className="relative"
                            onMouseEnter={() => setShowChatDropdown(true)}
                            onMouseLeave={() => setShowChatDropdown(false)}
                        >
                            <div
                                className={`flex items-center justify-between text-lg px-3 py-2 rounded transition duration-300 cursor-pointer ${
                                    activeItem?.startsWith("/chat") ? "bg-orange-500 text-white" : "hover:bg-gray-700"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FaComments />
                                    <span>Quick Chat</span>
                                </div>
                                <IoChevronDownSharp
                                    className={`transition-transform duration-200 ${
                                        showChatDropdown ? "rotate-180" : ""
                                    }`}
                                />
                            </div>

                            {showChatDropdown && (
                                <ul className="ml-6 mt-2 space-y-2 transition-all duration-200">
                                    {[
                                        { href: "/chat", label: "Chat", icon: <FaInbox /> },
                                        { href: "/room", label: "Chat Rooms", icon: <FaUsers /> },
                                        { href: "/support", label: "Support", icon: <FaHeadset /> }
                                    ].map((item) => (
                                        <li key={item.href}>
                                            <Link href={item.href} onClick={() => handleNavClick(item.href)}>
                                                <div
                                                    className={`flex items-center gap-3 text-md px-3 py-2 rounded transition duration-300 cursor-pointer ${
                                                        activeItem === item.href ? "bg-orange-500 text-white" : "hover:bg-gray-700"
                                                    }`}
                                                >
                                                    {item.icon}
                                                    <span>{item.label}</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>

                        {/* Profile */}
                        <li>
                            <Link href="/profile" onClick={() => handleNavClick("/profile")}>
                                <div
                                    className={`flex items-center gap-3 text-lg px-3 py-2 rounded transition duration-300 cursor-pointer ${
                                        activeItem === "/profile" ? "bg-orange-500 text-white" : "hover:bg-gray-700"
                                    }`}
                                >
                                    <FaUser />
                                    <span>Profile</span>
                                </div>
                            </Link>
                        </li>

                        {/* Logout */}
                        <li>
                            <div
                                onClick={logout}
                                className="flex items-center gap-3 text-lg hover:bg-gray-700 px-3 py-2 rounded transition duration-300 cursor-pointer"
                            >
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NavLayout;