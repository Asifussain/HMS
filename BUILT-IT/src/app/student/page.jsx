"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  UserIcon,
  LayoutDashboardIcon, 
  FileTextIcon,
  UsersIcon, 
  HomeIcon, 
  MessageSquareTextIcon,
  BookOpenIcon,
  UtensilsIcon,
  LogOutIcon,
  HeartPulseIcon,
  XIcon
} from "lucide-react";

export default function StudentDashboard() {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counselingLoading, setCounselingLoading] = useState(false);
  const [counselingStatus, setCounselingStatus] = useState(null);
  const [showCounselingConfirmation, setShowCounselingConfirmation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        setUserData(session.user);
      }
    }
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserData(session ? session.user : null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchStudent() {
      if (session && userData) {
        const email = userData.email;
        const rollNo = email.split("@")[0];
        try {
          const res = await fetch(`/api/student?rollNo=${rollNo}`);
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            setStudent(data);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingStudent(false);
        }
      }
    }
    fetchStudent();
  }, [session, userData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const openCounselingConfirmation = () => {
    setShowCounselingConfirmation(true);
  };

  const closeCounselingConfirmation = () => {
    setShowCounselingConfirmation(false);
  };

  const handleCounselingRequest = async () => {
    if (!userData) return;

    setCounselingLoading(true);
    setShowCounselingConfirmation(false);
    setCounselingStatus(null);

    try {
      const rollNo = userData.email.split("@")[0];
      
      const response = await fetch('/api/send-counseling-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rollNo: rollNo
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCounselingStatus({ 
          type: 'success', 
          message: 'Your counseling request has been sent successfully. Someone will contact you soon.' 
        });
      } else {
        setCounselingStatus({ 
          type: 'error', 
          message: 'Failed to send counseling request. Please try again later.' 
        });
      }
    } catch (err) {
      setCounselingStatus({ 
        type: 'error', 
        message: 'An error occurred. Please try again later.' 
      });
    } finally {
      setCounselingLoading(false);
      
      setTimeout(() => {
        setCounselingStatus(null);
      }, 10000);
    }
  };

  const dashboardCards = [
    { 
      title: 'Profile', 
      link: '/student/profile',
      icon: <UserIcon className="w-7 h-7" />,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      bgGradient: "from-teal-50 to-teal-100",
      description: "View and update your personal information"
    },
    { 
      title: 'Complaints', 
      link: '/student/complaints',
      icon: <FileTextIcon className="w-7 h-7" />,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      description: "Submit and track your complaints"
    },
    { 
      title: 'Room Change Requests', 
      link: '/student/room-change-request',
      icon: <LayoutDashboardIcon className="w-7 h-7" />,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      description: "Request and track room changes"
    },
    { 
      title: 'Feedback', 
      link: '/student/feedback',
      icon: <MessageSquareTextIcon className="w-7 h-7" />,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100",
      description: "Share your feedback and suggestions"
    },
    { 
      title: 'Visitor Request', 
      link: '/student/visitor-request',
      icon: <UsersIcon className="w-7 h-7" />,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100",
      description: "Share your feedback and suggestions"
    },
    { 
      title: 'Academic Portal', 
      link: 'https://academic.iiti.ac.in/app/login', 
      isExternal: true,
      icon: <BookOpenIcon className="w-7 h-7" />,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      bgGradient: "from-pink-50 to-pink-100",
      description: "Access your courses and academic records"
    },
    { 
      title: 'Dining Portal', 
      link: 'https://diningfee.iiti.ac.in', 
      isExternal: true,
      icon: <UtensilsIcon className="w-7 h-7" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      bgGradient: "from-green-50 to-green-100",
      description: "Manage dining preferences and meal plans"
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
                Student Access Required
              </h2>
              <p className={`mb-6 ${textColors.description}`}>
                Please sign in to access your Student Dashboard.
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

  if (loadingStudent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="w-full max-w-md">
          <div className={`${cardBg} shadow-2xl rounded-2xl overflow-hidden`}>
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${textColors.title}`}>
                Loading
              </h2>
              <p className={`mb-6 ${textColors.description}`}>
                Fetching your student record...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="w-full max-w-md">
          <div className={`${cardBg} shadow-2xl rounded-2xl overflow-hidden`}>
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-red-100 p-4 rounded-full">
                  <span className="text-4xl">⚠️</span>
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${textColors.title}`}>
                Error
              </h2>
              <p className={`mb-6 ${textColors.description}`}>
                {error}
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Your Roll No: {userData ? userData.email.split("@")[0] : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="w-full max-w-md">
          <div className={`${cardBg} shadow-2xl rounded-2xl overflow-hidden`}>
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-yellow-100 p-4 rounded-full">
                  <span className="text-4xl">🔍</span>
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${textColors.title}`}>
                No Record Found
              </h2>
              <p className={`mb-6 ${textColors.description}`}>
                No student record found for your account.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Your Roll No: {userData ? userData.email.split("@")[0] : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} relative`}>
      {/* Header */}
      <header className={`${cardBg} shadow-md border-b`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${textColors.title}`}>
              Student Dashboard
            </h1>
            <p className={`text-sm ${textColors.description}`}>
              Welcome, {student.full_name}
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
      
      {/* Counseling Status Message */}
      {counselingStatus && (
        <div className="container mx-auto px-4 mt-4">
          <div className={`p-4 rounded-lg ${
            counselingStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {counselingStatus.message}
          </div>
        </div>
      )}
      
      {/* Dashboard Cards */}
      <main className="container mx-auto px-4 py-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {dashboardCards.map((card, index) => {
            if (card.isExternal) {
              return (
                <motion.a 
                  href={card.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  key={index}
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
                    group
                    relative
                    overflow-hidden
                    block
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
                </motion.a>
              );
            } else {
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link 
                    href={card.link}
                    className={`
                      bg-gradient-to-br ${card.bgGradient}
                      border border-gray-200
                      rounded-xl
                      shadow-md
                      hover:shadow-lg
                      transition-all 
                      duration-300 
                      p-5
                      group
                      relative
                      overflow-hidden
                      block
                      h-full
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
                  </Link>
                </motion.div>
              );
            }
          })}
        </div>
      </main>
      
      {/* Counseling Button (Fixed at bottom right) */}
      <motion.button
        onClick={openCounselingConfirmation}
        disabled={counselingLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full shadow-lg p-3 flex items-center justify-center hover:bg-indigo-700 transition-all z-20"
      >
        {counselingLoading ? (
          <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
        ) : (
          <HeartPulseIcon className="w-6 h-6" />
        )}
      </motion.button>
      
      {/* Counseling Confirmation Modal */}
      {showCounselingConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <HeartPulseIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-indigo-900">Counseling Support</h3>
              </div>
              <button 
                onClick={closeCounselingConfirmation}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 mb-5">
                Are you sure you want to request confidential mental health support? 
                An email will be sent to our counseling team who will contact you soon.
              </p>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={closeCounselingConfirmation}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCounselingRequest}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Confirm Request
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}