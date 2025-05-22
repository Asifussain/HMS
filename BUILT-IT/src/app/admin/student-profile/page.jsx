"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  UserIcon, 
  ArrowLeft, 
  LogOutIcon,
  CreditCardIcon,
  AlertOctagonIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  GraduationCapIcon,
  CalendarIcon,
  BookmarkIcon,
  HomeIcon
} from "lucide-react";

export default function StudentProfile({ searchParams }) {
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const rollNo = searchParams?.rollNo;

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

  useEffect(() => {
    async function fetchStudentData() {
      if (!rollNo) {
        setError("No roll number provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch student data from Supabase (unchanged)
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('roll_no', rollNo)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("No student found with this roll number");
        } else {
          setStudent(data);
        }
      } catch (err) {
        console.error("Error fetching student:", err);
        setError(err.message || "Failed to load student data");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchStudentData();
    }
  }, [rollNo, session]);

  // Enhanced animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    in: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    },
    out: { 
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    in: { y: 0, opacity: 1 },
    out: { y: -20, opacity: 0 }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    in: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    }
  };

  // Not authenticated view
  if (!session) {
    return (
      <motion.div 
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4"
      >
        <motion.div 
          variants={cardVariants}
          whileHover="hover"
          className="w-full max-w-md"
        >
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-indigo-100">
            <div className="p-8 text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                className="mb-6 flex justify-center"
              >
                <div className="bg-blue-100 p-5 rounded-full shadow-inner">
                  <UserIcon className="w-12 h-12 text-blue-600" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold mb-4 text-blue-900">
                Secure Administrator Access
              </h2>
              <p className="mb-8 text-blue-700 text-opacity-70">
                Please log in to access student profiles
              </p>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/sign-in")}
                className="w-full py-4 px-6 rounded-xl shadow-lg transition-all duration-300 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                Sign In
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Loading state with improved animation
  if (loading) {
    return (
      <motion.div 
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-4 bg-blue-200 rounded-full blur-xl opacity-50"
            />
            <motion.div 
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="relative z-10 w-16 h-16 border-4 border-transparent border-t-blue-600 border-b-indigo-600 rounded-full"
            />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-blue-800 font-medium"
          >
            Loading student profile...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4"
      >
        <motion.div 
          variants={cardVariants}
          whileHover="hover"
          className="w-full max-w-md"
        >
          <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-red-100">
            <div className="p-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mb-6 flex justify-center"
              >
                <div className="bg-red-100 p-5 rounded-full shadow-inner">
                  <AlertOctagonIcon className="w-12 h-12 text-red-600" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Error</h2>
              <p className="text-gray-600 mb-8 text-center">{error}</p>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex justify-center"
              >
                <Link 
                  href="/admin/students-data" 
                  className="py-3 px-8 rounded-xl shadow-md transition-all duration-300 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Students List
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // No student found
  if (!student) {
    return (
      <motion.div 
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4"
      >
        <motion.div 
          variants={cardVariants}
          whileHover="hover"
          className="w-full max-w-md"
        >
          <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-yellow-100">
            <div className="p-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="mb-6 flex justify-center"
              >
                <div className="bg-yellow-100 p-5 rounded-full shadow-inner">
                  <UserIcon className="w-12 h-12 text-yellow-600" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">No Student Found</h2>
              <p className="text-gray-600 mb-8 text-center">No student found with roll number: {rollNo}</p>
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex justify-center"
              >
                <Link 
                  href="/admin/students-data" 
                  className="py-3 px-8 rounded-xl shadow-md transition-all duration-300 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Students List
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main content - Student profile
  return (
    <motion.div 
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-blue-100"
    >
      {/* Enhanced Header Section */}
      <motion.header 
        variants={itemVariants}
        className="bg-white shadow-md border-b border-indigo-100 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/admin/students-data"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Back to List</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
                Student Profile
              </h1>
              <p className="text-xs sm:text-sm text-blue-600">
                Detailed Student Information
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200"
          >
            <LogOutIcon className="w-5 h-5 mr-2" />
            Logout
          </motion.button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Student Basic Info - Prominent Card */}
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="shrink-0"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                    <UserIcon className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>
                </motion.div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    {student.full_name || student.name}
                  </h2>
                  <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    Roll Number: {student.roll_no}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-center">
                      <BuildingIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">{student.department || "Not Available"}</span>
                    </div>
                    <div className="flex items-center">
                      <GraduationCapIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">Degree: {student.Degree || "Not Available"}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">Batch: {student.batch || "Not Available"}</span>
                    </div>
                    <div className="flex items-center">
                      <MailIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700 truncate">{student.email || `${student.roll_no}@iiti.ac.in`}</span>
                    </div>
                    <div className="flex items-center">
                      <HomeIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">
                        {student.hostel_block ? `${student.hostel_block}${student.room_number ? ` - ${student.room_number}` : ''}` : "Hostel Not Assigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
          
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial & Hostel Card */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl shadow-md"
                  >
                    <CreditCardIcon className="w-8 h-8 text-green-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Financial & Hostel
                    </h3>
                    <p className="text-sm text-gray-500">
                      Fees and Accommodation
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Hostel Block</span>
                    <span className="text-gray-800 font-medium">{student.hostel_block || "Not Assigned"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Room Number</span>
                    <span className="text-gray-800 font-medium">{student.room_number || "Not Assigned"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Fees Status</span>
                    <div className="flex items-center">
                      <span className={`font-medium ${student.fees_paid ? "text-green-600" : "text-red-600"}`}>
                        {student.fees_paid ? "Paid" : "Due"}
                      </span>
                      <span className={`ml-2 inline-block w-2 h-2 rounded-full ${student.fees_paid ? "bg-green-600" : "bg-red-600"}`}></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Department Details Card */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    initial={{ rotate: 10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl shadow-md"
                  >
                    <BuildingIcon className="w-8 h-8 text-purple-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Department Details
                    </h3>
                    <p className="text-sm text-gray-500">
                      Academic Information
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Faculty Advisor</span>
                    <span className="text-gray-800 font-medium">{student.faculty_advisor || "Not Available"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Class Representative</span>
                    <span className="text-gray-800 font-medium">{student.class_representative || "Not Assigned"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Head of Department</span>
                    <span className="text-gray-800 font-medium">{student.hod_name || "Not Available"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Department Email</span>
                    <span className="text-gray-800 font-medium truncate">{student.department_email || "Not Available"}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Emergency Contact Card */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-100 md:col-span-2"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1, rotate: [0, 5, 0, -5, 0] }}
                    transition={{ 
                      scale: { type: "spring", stiffness: 200 },
                      rotate: { duration: 0.5, delay: 0.2 }
                    }}
                    className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl shadow-md"
                  >
                    <AlertOctagonIcon className="w-8 h-8 text-red-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Emergency Contact Information
                    </h3>
                    <p className="text-sm text-gray-500">
                      Important contacts for urgent situations
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Contact Name</span>
                    <span className="text-gray-800 font-medium">{student.emergency_contact_name || "Not Provided"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Relationship</span>
                    <span className="text-gray-800 font-medium">{student.emergency_contact_relationship || "Not Specified"}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Primary Phone</span>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-800 font-medium">{student.emergency_contact_phone || "Not Available"}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Alternate Phone</span>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-800 font-medium">{student.alternate_emergency_phone || "Not Available"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}