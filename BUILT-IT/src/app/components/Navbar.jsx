"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image"; // Needed for IIT Indore logo
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import {
    UserIcon,
    LayoutDashboardIcon,
    FileSpreadsheetIcon,
    WrenchIcon,
    BarChart3Icon,
    BellIcon,
    LogOutIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    UsersIcon,
    FileTextIcon,
    AlertTriangleIcon,
    MenuIcon,
    XIcon,
    InfoIcon,
    SettingsIcon,
    HelpCircleIcon,
    BarChart2Icon as ChartIcon,
    MessageCircleIcon,
    MessageSquareText
} from "lucide-react";

export default function ResponsiveSidebar() {
    // --- State ---
    const [session, setSession] = useState(null);
    const [userData, setUserData] = useState(null);
    const [role, setRole] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [screenSize, setScreenSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
        isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
        isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [homePath, setHomePath] = useState("/");
    const [isLoading, setIsLoading] = useState(true);

    // --- Refs ---
    const sidebarRef = useRef(null);
    const isCollapsedRef = useRef(isCollapsed);
    const isMobileRef = useRef(screenSize.isMobile);

    // --- Routing & Navigation ---
    const router = useRouter();
    const pathname = usePathname();

    // --- Effects ---

    // Update refs when state changes
    useEffect(() => { isCollapsedRef.current = isCollapsed; }, [isCollapsed]);
    useEffect(() => { isMobileRef.current = screenSize.isMobile; }, [screenSize.isMobile]);

    // Click outside handler - RESTORED AUTO-COLLAPSE BEHAVIOR
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                if (!isMobileRef.current && !isCollapsedRef.current) {
                    setIsCollapsed(true); // Auto-collapse on desktop click-outside - RESTORED
                }
                if (isMobileRef.current && isMenuOpen) {
                    setIsMenuOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    // Responsive design detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const newIsMobile = width < 768;
            const newIsTablet = width >= 768 && width < 1024;
            const newIsDesktop = width >= 1024;

            setScreenSize({ width, height, isMobile: newIsMobile, isTablet: newIsTablet, isDesktop: newIsDesktop });

            if (newIsDesktop) {
                setIsMenuOpen(false);
                // Keep collapsed state as is unless you want to force expand/collapse on resize
            } else if (newIsTablet) {
                setIsMenuOpen(false);
                setIsCollapsed(true); // Default collapsed on tablet
            } else { // Mobile
                // Keep menu state as is, don't force collapse/expand visual state
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Run only once on mount

    // Authentication and role management
    useEffect(() => {
        async function getSessionData() {
            setIsLoading(true);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;
                if (!session) {
                    router.push("/sign-in");
                    return;
                }

                setSession(session);
                setUserData(session.user);
                const email = session.user.email;

                if (!email) throw new Error("User email not found in session.");

                try {
                    const res = await fetch(`/api/user/role?email=${encodeURIComponent(email)}`);
                    if (!res.ok) throw new Error(`Failed to fetch role: ${res.statusText}`);

                    const data = await res.json();
                    if (data.error) throw new Error(data.error);

                    const userRole = data.role || 'student'; // Fallback role
                    setRole(userRole);
                    setHomePath(
                        userRole === "admin" ? "/admin" :
                        userRole === "student" ? "/student" :
                        userRole === "guard" ? "/guard" : `/${userRole}` // Generic fallback
                    );
                } catch (roleError) {
                    console.error("Error fetching role:", roleError.message);
                    setRole('student'); // Apply fallback role on error
                    setHomePath('/student');
                }

            } catch (error) {
                console.error("Auth or fetch error:", error.message);
                // Avoid redirecting if already loading or if it's just a role fetch error after session confirmed
                if (!session && !isLoading) {
                    router.push("/sign-in");
                }
            } finally {
                // Add a small delay to prevent flicker on fast loads
                setTimeout(() => setIsLoading(false), 200);
            }
        }

        getSessionData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]); // router dependency is okay here


    // --- Handlers ---
    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push("/sign-in");
        } catch (error) {
            console.error("Logout error:", error);
            setIsLoading(false); // Stop loading indicator on error
        }
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobileMenu = () => setIsMenuOpen(!isMenuOpen);

    // --- Theme & Styling --- (Refreshed Look)
    const theme = {
        colors: {
            background: "bg-gray-50", // Slightly off-white background
            headerBackground: "bg-white",
            primary: "bg-indigo-600",
            primaryHover: "hover:bg-indigo-700",
            primaryText: "text-indigo-600",
            secondaryText: "text-gray-500",
            primaryInvertedText: "text-white",
            secondaryHover: "hover:bg-gray-100", // Subtle hover for links
            activeBackground: "bg-indigo-50", // Lighter active background
            activeText: "text-indigo-700",
            iconContainerBg: "bg-gray-100", // Neutral icon container
            borderColor: "border-gray-200", // Softer border color
            headingText: "text-black font-bold", // Added this for headings
        },
        shadows: {
            medium: "shadow-md",
            large: "shadow-lg"
        },
        transitions: "transition-all duration-200 ease-in-out" // Slightly faster transitions
    };

    // --- Navigation Links --- (No Badges)
    const navLinks = {
      admin: [
            { href: "/admin", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
            { href: "/admin/students-data", icon: UsersIcon, title: "Students", description: "Manage student records", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
            { href: "/admin/spreadsheet-integration", icon: FileSpreadsheetIcon, title: "Uploads", description: "Import spreadsheet data", bgColor: "bg-green-100", iconColor: "text-green-600" },
            { href: "/admin/maintenance-tracking", icon: WrenchIcon, title: "Maintenance", description: "Track facility issues", bgColor: "bg-red-100", iconColor: "text-red-600" },
            { href: "/admin/room-request-tracking", icon: LayoutDashboardIcon, title: "Rooms", description: "Manage room requests", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
            { href: "/admin/notification-management", icon: BellIcon, title: "Notifications", description: "Send announcements", bgColor: "bg-indigo-100", iconColor: "text-indigo-600" },
            { href: "/admin/analytics-dashboard", icon: ChartIcon, title: "Analytics", description: "View reports", bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
            { href: "/admin/feedback", icon: MessageSquareText, title: "Feedback", description: "Review user feedback", bgColor: "bg-pink-100", iconColor: "text-pink-600" },
            { href: "/admin/user-roles", icon: UserIcon, title: "Employee Details", description: "Manage employee info", bgColor: "bg-gray-200", iconColor: "text-gray-600" }
        ],
        student: [
            { href: "/student", icon: HomeIcon, title: "Dashboard", description: "Your home", exact: true, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
            { href: "/student/profile", icon: UserIcon, title: "Profile", description: "View & edit details", bgColor: "bg-green-100", iconColor: "text-green-600" },
            { href: "/student/complaints", icon: FileTextIcon, title: "Complaints", description: "Submit & track issues", bgColor: "bg-indigo-100", iconColor: "text-indigo-600" },
            { href: "/student/room-change-request", icon: LayoutDashboardIcon, title: "Room Change", description: "Request a room swap", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
            { href: "/student/feedback", icon: MessageSquareText, title: "Feedback", description: "Review user feedback", bgColor: "bg-indigo-100", iconColor: "text-indigo-600" },
            { href: "/student/visitor-request", icon: UsersIcon, title: "Visitors", description: "Manage your visitors", bgColor: "bg-yellow-100", iconColor: "text-yellow-600" }
        ],
        guard: [
            { href: "/guard", icon: HomeIcon, title: "Dashboard", description: "Guard overview", exact: true, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
            { href: "/guard/check-in-out", icon: BarChart3Icon, title: "Check-In/Out", description: "Log entries/exits", bgColor: "bg-green-100", iconColor: "text-green-600" },
            { href: "/guard/visitor-management", icon: UsersIcon, title: "Visitors", description: "Manage visitor logs", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
            { href: "/guard/emergency-announcements", icon: AlertTriangleIcon, title: "Emergency Announcements", description: "View campus alerts", bgColor: "bg-red-100", iconColor: "text-red-600" },
            { href: "/guard/status-info", icon: InfoIcon, title: "Status-Info", description: "Configure options", bgColor: "bg-indigo-200", iconColor: "text-indigo-600" }
        ],
         technician: [
          { href: "/techinician", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" }, 
          { href: "/technician/maintenance-tracking", icon: WrenchIcon, title: "Maintenance Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" } 
        ],
         plumber: [ 
          { href: "/plumber", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
          { href: "/plumber/maintenance-tracking", icon: WrenchIcon, title: "Plumbing Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" } 
        ],
         carpenter: [ 
          { href: "/carpenter", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
          { href: "/carpenter/maintenance-tracking", icon: WrenchIcon, title: "Carpentry Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" }
         ],
         electrician: [ 
          { href: "/electrician", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
          { href: "/electrician/maintenance-tracking", icon: WrenchIcon, title: "Electrical Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" } 
        ],
         cleaner: [ 
          { href: "/cleaner", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
          { href: "/cleaner/maintenance-tracking", icon: WrenchIcon, title: "Cleaning Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" } 
        ],
         other: [ 
          { href: "/other", icon: HomeIcon, title: "Dashboard", description: "Admin overview", exact: true, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
          { href: "/other/maintenance-tracking", icon: WrenchIcon, title: "Cleaning Tasks", description: "View assigned tasks", bgColor: "bg-red-100", iconColor: "text-red-600" } 
        ]
    };

    // --- Derived State & Variables ---
    const fullName = userData?.user_metadata?.full_name || "User";
    const userEmail = userData?.email || "";
    
    // Fixed: Always use first letter of full name for initial, only fallback to email
    const userInitial = fullName && fullName !== "User"
        ? fullName.charAt(0).toUpperCase()
        : (userEmail ? userEmail.charAt(0).toUpperCase() : "?");
        
    const currentLinks = role ? (navLinks[role] || []) : [];

    // --- Components ---

    // Refreshed NavLinkItem Component
    const NavLinkItem = ({ link, isActive, isCollapsed, isMobile, theme, onClick }) => {
        const IconComponent = link.icon;
        return (
            <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`group ${isCollapsed && !isMobile ? 'flex justify-center' : ''}`} // Centered when collapsed
                onClick={onClick}
            >
                <Link
                    href={link.href}
                    className={`
                        flex items-center w-full p-2.5 rounded-lg ${theme.transitions} relative
                        ${isCollapsed && !isMobile ? 'justify-center' : ''}
                        ${isActive
                            ? `${theme.colors.activeBackground} ${theme.colors.activeText} font-medium`
                            : `${theme.colors.secondaryText} ${theme.colors.secondaryHover} hover:${theme.colors.primaryText}`
                        }
                    `}
                    title={isCollapsed && !isMobile ? link.title : ''}
                >
                    {/* Active Indicator (Left Border) */}
                    {isActive && (
                        <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-0 bottom-0 w-1 ${theme.colors.primary} rounded-r-full`}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}

                    {/* Icon Container */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isCollapsed && !isMobile ? '' : 'mr-3'} ${link.bgColor} ${link.iconColor} group-hover:shadow-sm ${theme.transitions}`}>
                        <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Text Content */}
                    {(!isCollapsed || isMobile) && (
                        <div className="flex-grow overflow-hidden mr-2">
                            <p className={`text-sm truncate ${isActive ? theme.colors.activeText : theme.colors.headingText}`}>
                                {link.title}
                            </p>
                            {!isActive && ( // Only show description if not active for cleaner look
                                <p className={`text-xs truncate ${theme.colors.secondaryText}`}>
                                    {link.description}
                                </p>
                            )}
                        </div>
                    )}
                </Link>
            </motion.li>
        );
    };

    // Mobile Menu Toggle Button - REPOSITIONED to prevent logo overlap
    const MobileMenuToggle = () => (
        !isMenuOpen && screenSize.isMobile && (
            <motion.button
                onClick={toggleMobileMenu}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`fixed top-4 left-4 z-[60] text-gray-600 bg-white ${theme.shadows.medium} p-2 rounded-full flex items-center justify-center border ${theme.colors.borderColor}`}
                aria-label="Open menu"
                key="mobile-menu-toggle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
            >
                <MenuIcon className="w-5 h-5" />
            </motion.button>
        )
    );

    // Loading Overlay
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gray-100 bg-opacity-80 flex justify-center items-center z-[100]">
                 <div className="flex flex-col items-center">
                    <motion.div
                         animate={{ rotate: 360 }}
                         transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                         className={`w-10 h-10 border-4 ${theme.colors.primaryText} border-t-transparent rounded-full mb-3`}
                     />
                     <p className={`${theme.colors.headingText} font-medium`}>Loading...</p>
                 </div>
            </div>
        );
    }

    // --- Render ---
    if (!session) return null; // Render nothing if no session (redirect handled in useEffect)

    return (
        <>
            <AnimatePresence>
                <MobileMenuToggle />
            </AnimatePresence>

            {/* Overlay for Mobile Menu */}
            <AnimatePresence>
                {screenSize.isMobile && isMenuOpen && (
                    <motion.div
                        key="mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black bg-opacity-40 z-40"
                        onClick={toggleMobileMenu} // Close on overlay click
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                ref={sidebarRef}
                key="sidebar"
                initial={false}
                animate={{
                    width: screenSize.isMobile
                        ? (isMenuOpen ? '280px' : '0px')
                        : (isCollapsed ? '100px' : '280px'),
                    // Use translateX for mobile to ensure it slides out completely
                    x: screenSize.isMobile ? (isMenuOpen ? 0 : -280) : 0,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 35, duration: 0.3 }} // Slightly adjusted physics
                className={`
                    fixed left-0 top-0 h-full ${theme.colors.background} ${theme.shadows.large} z-50
                    flex flex-col border-r ${theme.colors.borderColor}
                `}
            >
                {/* Header */}
                 <div className={`
                    flex items-center p-3 ${theme.colors.headerBackground} border-b ${theme.colors.borderColor} flex-shrink-0 h-[65px]
                    ${(isCollapsed && !screenSize.isMobile) ? 'justify-center' : 'justify-between'}
                 `}>
                    {/* Logo and Brand Name Container */}
                     <div className={`flex items-center overflow-hidden whitespace-nowrap`}>
                        <Link
                            href={homePath}
                            className={`flex items-center`}
                            onClick={() => screenSize.isMobile && setIsMenuOpen(false)}
                        >
                            {/* Logo - Always Visible */}
                            <motion.div
                                whileHover={{ rotate: 5, scale: 1.05 }}
                                className="relative flex-shrink-0 mr-2" // Ensure margin for spacing
                            >
                                <Image
                                     src="/newlogo.png"
                                     alt="IIT Indore Logo"
                                     width={35} // Slightly increased size
                                     height={35}
                                     className="rounded-md object-contain"
                                />
                            </motion.div>

                            {/* Brand Name - Visible when expanded or mobile menu open */}
                            {(!isCollapsed || screenSize.isMobile) && (
                                <span className={`${theme.colors.headingText} text-lg`}>
                                    HMS-<span className={theme.colors.headingText}>IIT-INDORE</span>
                                 </span>
                             )}
                         </Link>
                    </div>

                    {/* Mobile Close Button (shows only when mobile menu is open) */}
                    {screenSize.isMobile && isMenuOpen && (
                        <motion.button
                            onClick={toggleMobileMenu}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 ${theme.transitions}`}
                            aria-label="Close menu"
                        >
                            <XIcon className="w-5 h-5" />
                        </motion.button>
                    )}

                    {/* Desktop/Tablet Collapse/Expand Button */}
                    {!screenSize.isMobile && (
                        <motion.button
                            onClick={toggleSidebar}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-full text-gray-500 hover:text-gray-800 ${theme.transitions}`}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                        </motion.button>
                    )}
                 </div>

                {/* Navigation */}
                <nav className="flex-grow p-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <ul className="space-y-1.5"> {/* Slightly increased spacing */}
                        {currentLinks.map((link) => {
                             const isActive = link.exact
                                ? pathname === link.href
                                : pathname.startsWith(link.href) && (link.href !== '/' || pathname === '/'); // Ensure exact match for root path if needed

                            return (
                                <NavLinkItem
                                    key={link.href}
                                    link={link}
                                    isActive={isActive}
                                    isCollapsed={isCollapsed}
                                    isMobile={screenSize.isMobile}
                                    theme={theme}
                                    onClick={() => screenSize.isMobile && setIsMenuOpen(false)}
                                />
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer / User Profile Section */}
                <div className={`
                    border-t ${theme.colors.borderColor} p-3 mt-auto flex-shrink-0 bg-white
                    ${(isCollapsed && !screenSize.isMobile) ? 'flex flex-col items-center py-3' : ''} // Adjusted padding
                `}>
                    {/* Profile Info Container */}
                    <div className={`flex items-center w-full ${(isCollapsed && !screenSize.isMobile) ? 'justify-center' : ''}`}>
                         {/* Profile Initial/Avatar - Always show first letter of full name */}
                         <motion.div
                             whileHover={{ scale: 1.05 }}
                             className="flex-shrink-0"
                         >
                             <div className={`
                                 ${theme.colors.primary} text-white rounded-full flex items-center justify-center font-semibold border-2 border-white shadow-sm
                                 ${(isCollapsed && !screenSize.isMobile) ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-base'}
                             `}>
                                 {userInitial}
                              </div>
                         </motion.div>

                        {/* User Details (Hidden when collapsed on desktop/tablet) */}
                        {(!isCollapsed || screenSize.isMobile) && (
                             <div className="ml-3 flex-grow overflow-hidden">
                                <p className={`text-sm ${theme.colors.headingText} truncate`}>
                                     {fullName}
                                 </p>
                                 <p className={`text-xs ${theme.colors.secondaryText} truncate`}>
                                     {userEmail}
                                 </p>
                                {role && (
                                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${theme.colors.primary} bg-opacity-10 ${theme.colors.headingText} font-medium`}>
                                        {role.toUpperCase()}
                                     </span>
                                 )}
                             </div>
                         )}
                     </div>

                    {/* Action Buttons Container */}
                    {/* Collapsed Logout Button */}
                    {isCollapsed && !screenSize.isMobile && (
                        <motion.button
                            title="Logout"
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }} // Red hover
                            whileTap={{ scale: 0.9 }}
                            onClick={handleLogout}
                            className={`mt-2 p-2 rounded-full text-gray-500 hover:text-red-600 ${theme.transitions}`}
                        >
                             <LogOutIcon className="w-5 h-5" />
                        </motion.button>
                    )}

                    {/* Expanded Action Buttons */}
                    {(!isCollapsed || screenSize.isMobile) && (
                         <div className="flex justify-around items-center mt-3 pt-3 border-t border-gray-200 w-full">
                            <Link href="/settings" title="Settings" className={`p-1.5 rounded-md text-gray-500 ${theme.colors.secondaryHover} hover:${theme.colors.primaryText} ${theme.transitions}`} onClick={() => screenSize.isMobile && setIsMenuOpen(false)}>
                                 <SettingsIcon className="w-4 h-4" />
                             </Link>
                             <Link href="/help" title="Help" className={`p-1.5 rounded-md text-gray-500 ${theme.colors.secondaryHover} hover:${theme.colors.primaryText} ${theme.transitions}`} onClick={() => screenSize.isMobile && setIsMenuOpen(false)}>
                                 <HelpCircleIcon className="w-4 h-4" />
                             </Link>
                             <motion.button
                                title="Logout"
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} // Red hover
                                whileTap={{ scale: 0.9 }}
                                onClick={handleLogout}
                                className={`p-1.5 rounded-md text-gray-500 hover:text-red-500 ${theme.transitions}`}
                            >
                                 <LogOutIcon className="w-4 h-4" />
                             </motion.button>
                         </div>
                     )}
                </div>
            </motion.aside>
        </>
    );
}