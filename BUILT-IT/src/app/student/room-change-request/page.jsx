"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient"; // Assuming this path is correct
import {
  CheckCircleIcon,
  AlertCircleIcon,
  HomeIcon,
  UserIcon,
  ArrowRightIcon,
  HelpCircleIcon,
  LogOutIcon,
  BuildingIcon,
  ShieldIcon,
} from "lucide-react"; // Using lucide-react icons

// Helper component for loading spinner
const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
  />
);

// Helper component for page loading indicator
const PageLoader = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 text-gray-800">
    <div className="flex flex-col items-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-800"
      ></motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-gray-600 font-medium"
      >
        {message}
      </motion.p>
    </div>
  </div>
);

// Helper component for error display
const ErrorDisplay = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 text-gray-800 p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg w-full shadow-lg"
    >
      <h2 className="text-red-700 text-lg font-medium flex items-center">
        <AlertCircleIcon className="w-5 h-5 mr-2" />
        An error occurred
      </h2>
      <p className="mt-2 text-red-600">{error}</p>
    </motion.div>
  </div>
);

// Main Component
export default function RoomChangeRequest() {
  // --- State Variables ---
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [currentUnit, setCurrentUnit] = useState("");
  const [preferredRoom, setPreferredRoom] = useState("");
  const [preferredUnit, setPreferredUnit] = useState("");
  const [reason, setReason] = useState("");
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [isAvailable, setIsAvailable] = useState(null); // null | true | false
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // --- Effects ---
  useEffect(() => {
    let isMounted = true;
    async function getSessionAndStudent() {
      setPageLoading(true);
      setError("");

      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(currentSession);

          if (currentSession?.user) {
            const email = currentSession.user.email;
            const rollNo = email?.split("@")[0];

            if (rollNo) {
              // Use environment variable for API base URL if available
              // const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
              // const res = await fetch(`${apiUrl}/api/student?rollNo=${rollNo}`);
              const res = await fetch(`/api/student?rollNo=${rollNo}`); // Assuming relative path works
              if (!res.ok) {
                const errorData = await res
                  .json()
                  .catch(() => ({
                    error: `HTTP error! status: ${res.status}`,
                  }));
                throw new Error(
                  errorData.error || `Failed to fetch student data`
                );
              }
              const data = await res.json();
              if (data.error) {
                throw new Error(data.error);
              }
              if (isMounted) {
                setStudent(data);
                setCurrentRoom(data.room_number || "");
                setCurrentUnit(data.unit_no?.toString() || "");
              }
            } else {
              throw new Error("Could not derive Roll Number from email.");
            }
          } else {
            // No user session
             if (isMounted) setPageLoading(false);
          }
        }
      } catch (err) {
        console.error("Initialization Error:", err);
        if (isMounted)
          setError(
            err.message || "An unexpected error occurred during initialization."
          );
      } finally {
        if (isMounted) setPageLoading(false);
      }
    }

    getSessionAndStudent();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isMounted) {
          const sessionChanged = session?.user?.id !== newSession?.user?.id;
          setSession(newSession);
           // Re-fetch student data only if the user actually changed or logged in/out
          if (sessionChanged) {
            getSessionAndStudent();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe(); // Check if subscription exists before unsubscribing
    };
  }, []); // Removed 'session' from dependency array to prevent re-runs just on session refresh

  // --- Event Handlers ---
  const handleCheckAvailability = async () => {
    if (!preferredRoom || !preferredUnit) {
      setAvailabilityMsg("Please enter both preferred unit and room number.");
      setIsAvailable(null);
      return;
    }
    if (!student?.hostel_block) {
      setAvailabilityMsg(
        "Error: Could not determine your current hostel block."
      );
      setIsAvailable(null);
      return;
    }

    setLoading(true);
    setAvailabilityMsg("");
    setIsAvailable(null);

    try {
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      // const res = await fetch(`${apiUrl}/api/student/checkRoomAvailability?room=...`);
      const res = await fetch(
        `/api/student/checkRoomAvailability?room=${encodeURIComponent(
          preferredRoom
        )}&unit=${encodeURIComponent(preferredUnit)}&hostel=${encodeURIComponent(
          student.hostel_block
        )}` // Assuming relative path
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: `HTTP error! status: ${res.status}` }));
        throw new Error(errorData.error || "Failed to check availability");
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      } else if (data.available) {
        setAvailabilityMsg("Success: Room is available.");
        setIsAvailable(true);
      } else {
        setAvailabilityMsg("Occupied: The selected room is not available.");
        setIsAvailable(false);
      }
    } catch (err) {
      console.error("Availability Check Error:", err);
      setAvailabilityMsg(
        `Error: ${err.message || "Could not check room availability."}`
      );
      setIsAvailable(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setError(""); // Clear previous errors on new submission

    if (!student) {
      setStatusMsg("Error: Student record not loaded.");
      return;
    }
    if (isAvailable === false) {
      setStatusMsg(
        "Error: Cannot submit request - the preferred room is occupied."
      );
      return;
    }
    if (isAvailable === null) {
      setStatusMsg("Error: Please check room availability before submitting.");
      return;
    }
    if (!reason.trim()) {
      setStatusMsg("Error: Please provide a reason for the room change.");
      return;
    }

    setLoading(true);
    setFormSubmitted(false);

    try {
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      // const res = await fetch(`${apiUrl}/api/student/roomChangeRequest`, { ... });
      const res = await fetch("/api/student/roomChangeRequest", { // Assuming relative path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.student_id,
          roll_no: student.roll_no,
          full_name: student.full_name || student.name, // Use appropriate name field
          current_room: currentRoom,
          current_unit: currentUnit,
          preferred_room: preferredRoom,
          preferred_unit: preferredUnit,
          reason: reason.trim(), // Trim reason
          hostel_block: student.hostel_block,
        }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: `HTTP error! status: ${res.status}` }));
        throw new Error(errorData.error || "Failed to submit request");
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      } else {
        setStatusMsg("Success: Room change request submitted successfully!");
        setFormSubmitted(true);
        // Reset form fields
        setPreferredRoom("");
        setPreferredUnit("");
        setReason("");
        setAvailabilityMsg("");
        setIsAvailable(null);

        // Clear success message after a delay
        setTimeout(() => {
          setStatusMsg("");
          setFormSubmitted(false);
        }, 7000);
      }
    } catch (err) {
      console.error("Submission Error:", err);
      setStatusMsg(`Error: ${err.message || "Could not submit the request."}`);
      setFormSubmitted(false); // Ensure formSubmitted is false on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true); // Set loading true during logout process
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // The onAuthStateChange listener should handle setting session to null
      // and trigger re-render automatically. No need to manually set states here.
    } catch (err) {
      console.error("Logout Error:", err);
      setError(err.message || "Failed to log out.");
      // Potentially show error to user in UI instead of just console
    } finally {
        // Ensure loading is set to false after logout attempt,
        // even if onAuthStateChange handles the UI update
        setLoading(false);
    }
  };

  // --- UI Rendering ---
  const bgClass =
    "bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 text-gray-800";
  const cardBg =
    "bg-white backdrop-blur-sm bg-opacity-80 border border-gray-200";
  const textColors = {
    title: "text-gray-800",
    description: "text-gray-600",
    details: "text-indigo-700",
  };

  // Page Loader
  if (pageLoading) {
    return <PageLoader message="Loading session and student data..." />;
  }

  // Global Error Display (e.g., failed to load session/student initially)
  if (error && !session) { // Only show full page error if session/student failed critically
    return <ErrorDisplay error={error} />;
  }

  // Login UI - Shown if not loading, no critical error, and no session
  if (!session) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass} p-4`}
      >
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-32 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <div
            className={`${cardBg} shadow-2xl rounded-2xl overflow-hidden border`}
          >
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="bg-indigo-100 p-4 rounded-full shadow-lg"
                >
                  <HomeIcon className="w-12 h-12 text-indigo-600" />
                </motion.div>
              </div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold mb-4 ${textColors.title}`}
              >
                Authentication Required
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`mb-6 ${textColors.description}`}
              >
                Please sign in to access the Room Change Portal.
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Replace alert with actual navigation logic to your login page
                  // Example using Next.js router:
                  // import { useRouter } from 'next/navigation'; // at the top
                  // const router = useRouter(); // inside the component
                  // router.push('/login');
                  alert("Redirecting to Sign In page (replace with actual navigation)");
                }}
                className="w-full py-3 px-4 rounded-lg transition-all duration-300 font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg hover:shadow-indigo-200"
              >
                Sign In
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Student Data Loader/Error - Shown if session exists but student data is missing/failed
  if (!student) {
     // If there was an error fetching student data after login
    if (error) return <ErrorDisplay error={error} />;
     // If still loading student data (should be brief after login)
    return <PageLoader message="Loading student record..." />;
  }

  // Main Authenticated UI
  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-32 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className={`${cardBg} shadow-md border-b sticky top-0 z-20`} // Increased z-index
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-md p-2 shadow-md">
              <BuildingIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${textColors.title}`}>
                Room Change Request
              </h1>
              <p className={`text-xs md:text-sm ${textColors.description}`}>
                Welcome,{" "}
                {student.name || student.full_name || `Student ${student.roll_no}`}
              </p>
            </div>
          </div>
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading} // Disable button while logout is in progress
            className="flex items-center px-3 py-2 md:px-4 rounded-md transition-colors text-sm md:text-base text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 shadow-sm disabled:opacity-50"
          >
            {loading && !statusMsg ? ( // Show spinner only when loading for logout/check availability
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 md:w-5 md:h-5 border-2 border-gray-600 border-t-transparent rounded-full mr-2"
              />
            ) : (
              <LogOutIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            )}
            Logout
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="relative z-10 pt-16 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            {/* Form Card */}
            <div
              className={`${cardBg} rounded-xl shadow-xl overflow-hidden border`}
            >
              <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 px-6 py-5">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Room Change Application
                </h2>
                <p className="text-indigo-200 text-sm mt-1">
                  Complete the form below to request a room change
                </p>
              </div>

              {/* Form Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Student Information Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200 shadow-sm"
                  >
                    <h3 className="text-lg font-medium text-indigo-800 mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Student Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm"
                      >
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <ShieldIcon className="w-4 h-4 mr-1 text-indigo-600" />{" "}
                          Roll Number
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 font-medium text-sm">
                          {student.roll_no}
                        </div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm"
                      >
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <UserIcon className="w-4 h-4 mr-1 text-indigo-600" />{" "}
                          Full Name
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 font-medium text-sm">
                          {student.name || student.full_name}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Current Location Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-5 border border-violet-200 shadow-sm"
                  >
                    <h3 className="text-lg font-medium text-violet-800 mb-4 flex items-center">
                      <HomeIcon className="w-5 h-5 mr-2 text-violet-600" />{" "}
                      Current Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <BuildingIcon className="w-4 h-4 mr-1 text-violet-600" />{" "}
                              Unit
                            </label>
                            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 font-medium text-sm">
                              {currentUnit || "N/A"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <HomeIcon className="w-4 h-4 mr-1 text-violet-600" />{" "}
                              Room
                            </label>
                            <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 font-medium text-sm">
                              {currentRoom || "N/A"}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm"
                      >
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <BuildingIcon className="w-4 h-4 mr-1 text-violet-600" />{" "}
                          Hostel Block
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 font-medium text-sm">
                          {student.hostel_block || "N/A"}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Preferred Room Location Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm"
                  >
                    <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                      <ArrowRightIcon className="w-5 h-5 mr-2 text-blue-600" />{" "}
                      Preferred Room Location
                    </h3>
                    {/* Input Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="preferredUnit"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Unit Number
                        </label>
                        <input
                          id="preferredUnit"
                          type="number"
                          value={preferredUnit}
                          onChange={(e) => {
                            setPreferredUnit(e.target.value);
                            setAvailabilityMsg(""); // Clear availability on change
                            setIsAvailable(null);
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition"
                          placeholder="e.g., 101"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="preferredRoom"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Room Number
                        </label>
                        <input
                          id="preferredRoom"
                          type="text"
                          value={preferredRoom}
                          onChange={(e) => {
                            setPreferredRoom(e.target.value);
                            setAvailabilityMsg(""); // Clear availability on change
                            setIsAvailable(null);
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition"
                          placeholder="e.g., A1"
                          required
                        />
                      </div>
                    </div>

                    {/* Check Availability Button */}
                    <motion.button
                      type="button"
                      onClick={handleCheckAvailability}
                      disabled={loading || !preferredRoom || !preferredUnit}
                      whileHover={{ scale: loading ? 1 : 1.03 }}
                      whileTap={{ scale: loading ? 1 : 0.97 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center shadow-md disabled:cursor-not-allowed font-medium"
                    >
                      {loading && availabilityMsg === "" ? ( // Show spinner only when checking
                        <>
                          <LoadingSpinner />
                          <span className="ml-2">Checking...</span>
                        </>
                      ) : (
                        <>
                          <HelpCircleIcon className="w-4 h-4 mr-2" /> Check
                          Availability
                        </>
                      )}
                    </motion.button>

                    {/* Availability Message */}
                    <AnimatePresence>
                      {availabilityMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                          className={`mt-3 p-3 rounded-md text-sm border ${
                            isAvailable === true
                              ? "bg-green-50 text-green-700 border-green-200"
                              : isAvailable === false
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200" // Includes initial prompt state
                          } flex items-center shadow-sm`}
                        >
                          {isAvailable === true ? (
                            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                          ) : isAvailable === false ? (
                            <AlertCircleIcon className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
                          ) : ( // Default/prompt icon
                            <HelpCircleIcon className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0" />
                          )}
                          <span className="font-medium">{availabilityMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                    <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm text-center"
                    >
                    <h3 className="text-lg font-medium text-purple-800 mb-4 flex items-center justify-center">
                      <HelpCircleIcon className="w-5 h-5 mr-2 text-purple-600" />{" "}
                      Reason for Room Change
                    </h3>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm transition text-center"
                      placeholder="Please provide specific reasons for requesting a room change..."
                      aria-label="Reason for room change"
                    />
                    <p className="text-xs md:text-sm text-gray-500 mt-2 italic">
                      Your request is more likely to be approved if detailed
                      reasons are provided.
                    </p>
                    </motion.div>
                    {/* Submit Button and Status Area */}
                    <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                    >
                    <motion.button
                      type="submit"
                      disabled={loading || !isAvailable || !reason.trim()} // Disable conditions
                      whileHover={{
                      scale:
                        loading || !isAvailable || !reason.trim() ? 1 : 1.03,
                      }}
                      whileTap={{
                      scale:
                        loading || !isAvailable || !reason.trim() ? 1 : 0.97,
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-900 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 font-medium shadow-lg disabled:cursor-not-allowed flex items-center justify-center" // Centering classes are here
                      aria-live="polite" // Announce changes for screen readers
                    >
                      {loading && statusMsg === "" ? ( // Show spinner only when submitting
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Submitting Request...</span>
                      </>
                      ) : (
                      <>
                        <ArrowRightIcon className="w-5 h-5 mr-2" /> Submit Room Change Request
                      </>
                      )}
                    </motion.button>
                    {/* Status Message Area */}
                    <AnimatePresence>
                      {statusMsg && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                          className={`mt-6 p-4 text-sm border rounded-lg shadow-md ${
                            statusMsg.toLowerCase().includes("error")
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-green-50 border-green-200 text-green-700"
                          }`}
                          role="alert" // Better accessibility
                        >
                          <div className="flex items-start">
                            {statusMsg.toLowerCase().includes("error") ? (
                              <AlertCircleIcon className="w-5 h-5 mr-3 text-red-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20,
                                }}
                              >
                                <CheckCircleIcon className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                              </motion.div>
                            )}
                            <p className="font-medium flex-grow">{statusMsg}</p>
                          </div>

                          {/* Additional confirmation text on success */}
                          {formSubmitted &&
                            !statusMsg.toLowerCase().includes("error") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ delay: 0.3 }}
                                className="mt-2 pl-8 text-xs md:text-sm" // Indent under the icon
                              >
                                Your request will be reviewed by the hostel
                                administration. You will be notified of the
                                decision.
                              </motion.div>
                            )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </form>
              </div>
            </div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-6 text-gray-500 text-xs md:text-sm"
            >
              <p>
                For urgent accommodation issues, please contact the hostel
                administration office directly.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}