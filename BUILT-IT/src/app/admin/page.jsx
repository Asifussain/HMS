"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  UserIcon, 
  LayoutDashboardIcon, 
  FileSpreadsheetIcon, 
  WrenchIcon, 
  BarChart3Icon, 
  BellIcon, 
  MessageSquareTextIcon,
  LogOutIcon,
  ChevronRightIcon,
} from "lucide-react";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const router = useRouter();

  // Authentication and Session Management
  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Logout Handling
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  // Admin Dashboard Cards Configuration
  const adminDashboardCards = [
    { 
      title: "Student Management", 
      link: "/admin/students-data",
      icon: <UserIcon className="w-7 h-7" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      description: "Comprehensive student record management",
    },
    { 
      title: "Room Allocation", 
      link: "/admin/room-request-tracking",
      icon: <LayoutDashboardIcon className="w-7 h-7" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      description: "Dynamic room change request system",
    },
    { 
      title: "Data Integration", 
      link: "/admin/spreadsheet-integration",
      icon: <FileSpreadsheetIcon className="w-7 h-7" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      bgGradient: "from-green-50 to-green-100",
      description: "Advanced data management tools",
    },
    { 
      title: "Maintenance", 
      link: "/admin/maintenance-tracking",
      icon: <WrenchIcon className="w-7 h-7" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      bgGradient: "from-red-50 to-red-100",
      description: "Comprehensive maintenance tracking",
    },
    { 
      title: "Analytics", 
      link: "/admin/analytics-dashboard",
      icon: <BarChart3Icon className="w-7 h-7" />,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      description: "Advanced reporting and insights",
    },
    { 
      title: "Notifications", 
      link: "/admin/notification-management",
      icon: <BellIcon className="w-7 h-7" />,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      description: "Intelligent communication system",
    },
    { 
      title: "Feedback", 
      link: "/admin/feedback",
      icon: <MessageSquareTextIcon className="w-7 h-7" />,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      bgGradient: "from-pink-50 to-pink-100",
      description: "Comprehensive feedback system",
    },
    { 
      title: "Employee Details", 
      link: "/admin/user-roles",
      icon: <UserIcon className="w-7 h-7" />,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      bgGradient: "from-sky-50 to-sky-100",
      description: "Staff roles and management",
    },
  ];

  // Base text and background classes
  const bgClass = "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800";
  const cardBg = "bg-white border-gray-200";
  const textColors = {
    title: "text-gray-800",
    description: "text-gray-600",
    details: "text-gray-700"
  };

  // Authentication Required View
  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="w-full max-w-md">
          <div className={`${cardBg} shadow-2xl rounded-2xl overflow-hidden`}>
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <UserIcon className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${textColors.title}`}>
                Secure Administrator Access
              </h2>
              <p className={`mb-6 ${textColors.description}`}>
                Please log in to access the administrative dashboard
              </p>
              <button 
                onClick={() => router.push("/sign-in")}
                className="w-full py-3 px-4 rounded-lg transition-all duration-300 font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Professional Header */}
      <header className={`${cardBg} shadow-md border-b`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${textColors.title}`}>
              Admin Dashboard
            </h1>
            <p className={`text-sm ${textColors.description}`}>
              Welcome, Administrator
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200"
          >
            <LogOutIcon className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard Grid - Modified to have 3 cards per row */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {adminDashboardCards.map((card, index) => (
            <Link 
              key={index} 
              href={card.link}
              className="block"
            >
              <motion.div 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  bg-gradient-to-br ${card.bgGradient}
                  border border-gray-200
                  rounded-xl
                  shadow-md
                  hover:shadow-lg
                  transition-all 
                  duration-300 
                  p-5
                  h-full
                  group
                  relative
                  overflow-hidden
                `}
              >
                <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  {card.icon}
                </div>
                
                <div className="flex justify-between items-start mb-3">
                  <div className={`${card.iconBg} ${card.iconColor} p-2.5 rounded-xl shadow`}>
                    {card.icon}
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className={`text-xl font-semibold mb-2 ${textColors.title}`}>
                  {card.title}
                </h3>
                <p className={`text-sm ${textColors.description}`}>
                  {card.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}