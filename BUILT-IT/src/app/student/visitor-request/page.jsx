"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserIcon,
  InfoIcon,
  CalendarIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  LogOutIcon,
  PlusCircleIcon,
} from "lucide-react";

export default function VisitorRequest() {
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [visitorName, setVisitorName] = useState("");
  const [info, setInfo] = useState("");
  const [statusMsg, setStatusMsg] = useState(""); // For success/error feedback
  const [requests, setRequests] = useState([]);
  const router = useRouter();

  // Get session using Supabase auth
  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    }
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
    // Cleanup listener on component unmount
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Fetch student record using roll_no (derived from email)
  useEffect(() => {
    async function fetchStudent() {
      if (session?.user) {
        const email = session.user.email;
        // Basic validation for email format expected
        if (!email || !email.includes("@")) {
           setError("Invalid user email format.");
           setStudent(null); // Ensure student is null if email is invalid
           return;
        }
        const rollNo = email.split("@")[0];
        setError(""); // Clear previous errors
        setStudent(null); // Clear previous student data while fetching

        try {
          const res = await fetch(`/api/student?rollNo=${rollNo}`);
          if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: `HTTP error! status: ${res.status}` }));
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          // Ensure data is an object and not an error structure from the API
          if (typeof data === 'object' && data !== null && !data.error) {
              setStudent(data);
          } else if (data.error) {
              setError(data.error);
          } else {
              // Handle case where API returns success but empty data or unexpected format
              setError(`Student record not found for ${rollNo}.`);
          }
        } catch (err) {
          console.error("Error fetching student record:", err);
          setError(`Failed to fetch student record: ${err.message}`);
        }
      } else {
         // Clear student data if there's no session
         setStudent(null);
      }
    }
    fetchStudent();
  }, [session]); // Depend only on session

  // Fetch all visitor requests for this student
  // Refetches when student record is loaded/changed or after a status message update (submit/cancel)
  useEffect(() => {
    async function fetchRequests() {
      // Only fetch if we have a valid student object
      if (student && student.roll_no) {
        setLoadingRequests(true);
        setError(""); // Clear previous request errors
        try {
          const res = await fetch(
            `/api/student/visitorRequest?rollNo=${student.roll_no}`
          );
           if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: `HTTP error! status: ${res.status}` }));
              throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          // Assuming the API returns an array on success
          if (Array.isArray(data)) {
              setRequests(data);
          } else if (data.error) {
              // Handle potential error structure from API
              console.error("API error fetching requests:", data.error);
              setError(`Failed to fetch requests: ${data.error}`);
              setRequests([]); // Clear requests on error
          } else {
              // Handle unexpected response format
              console.error("Unexpected data format fetching requests:", data);
              setError("Received unexpected data format for requests.");
              setRequests([]);
          }
        } catch (err) {
          console.error("Error fetching visitor requests:", err);
          setError(`Failed to fetch visitor requests: ${err.message}`);
          setRequests([]); // Clear requests on fetch error
        } finally {
          setLoadingRequests(false);
        }
      } else {
         // If no student, clear requests and loading state
         setRequests([]);
         setLoadingRequests(false);
      }
    }
    fetchRequests();
    // Dependency: fetch when student data is available or when a submit/cancel action updates statusMsg
  }, [student, statusMsg]);


  // Handle Visitor Request Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(""); // Clear previous message
    if (!student) {
      setStatusMsg("Error: Student record not loaded.");
      return;
    }
    // Basic validation for inputs
    if (!visitorName.trim() || !info.trim()) {
        setStatusMsg("Error: Visitor Name and Reason cannot be empty.");
        return;
    }

    try {
      const res = await fetch("/api/student/visitorRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_no: student.roll_no,
          hostel_block: student.hostel_block,
          room_number: student.room_number,
          emergency_contact: student.emergency_contact,
          visitor_name: visitorName,
          info: info,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      } else {
        setStatusMsg("Visitor request submitted successfully!"); // Trigger re-fetch via useEffect
        setVisitorName(""); // Clear form
        setInfo("");
        // No need for explicit re-fetch here, useEffect dependency on statusMsg handles it
      }
    } catch (err) {
      console.error("Submit error:", err);
      setStatusMsg("Error submitting request: " + err.message);
    }
  };

  // Handle Visitor Request Cancellation
  const handleCancel = async (requestId) => {
    setStatusMsg(""); // Clear previous message
    if (!student || !student.roll_no) {
        setStatusMsg("Error: Cannot cancel request without student context.");
        return;
    }
    try {
      const res = await fetch(
        `/api/student/visitorRequest?requestId=${requestId}`,
        {
          method: "DELETE", // This hits the API route that updates status to 'cancelled'
        }
      );
      const data = await res.json();
       if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      } else {
        setStatusMsg("Visitor request cancelled successfully!"); // Trigger re-fetch via useEffect
        // No need for explicit re-fetch here, useEffect dependency on statusMsg handles it
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setStatusMsg("Error cancelling request: " + err.message);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setStatusMsg(""); // Clear any messages
    await supabase.auth.signOut();
    router.push("/sign-in"); // Redirect to sign-in page
  };

  // Determine status badge based on request data (including the 'status' field)
  const getStatusBadge = (req) => {
    // Check in order of definitive states first
    if (req.departure_time) {
      return (
        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Departed
        </span>
      );
    } else if (req.status?.toLowerCase() === "cancelled") { // Check for cancelled status
      return (
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Cancelled
        </span>
      );
    } else if (req.arrival_time) {
      return (
        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Arrived
        </span>
      );
    } else { // Default to Pending if none of the above and not cancelled
      return (
        <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          <ClockIcon className="w-4 h-4 mr-1" />
          Pending
        </span>
      );
    }
  };

  // Conditional Rendering based on state

  // If no session, show login prompt
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200"
          >
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-yellow-100 p-4 rounded-full">
                  <UserIcon className="w-12 h-12 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Visitor Request Portal
              </h2>
              <p className="mb-6 text-gray-600">
                Please log in to submit or view visitor requests.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/sign-in")}
                className="w-full py-3 px-4 rounded-lg transition-all duration-300 font-semibold bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If session exists but student data is loading
  if (!student && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
          <p className="mt-4 text-gray-600">Loading student record...</p>
        </div>
      </div>
    );
  }

 // If there was an error fetching student or requests
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg w-full shadow-md">
          <div className="flex items-center mb-3">
             <XCircleIcon className="w-6 h-6 text-red-600 mr-2"/>
             <h2 className="text-red-700 text-lg font-semibold">An error occurred</h2>
          </div>
          <p className="mt-2 text-red-600">{error}</p>
           <button
               onClick={() => setError("")} // Allow dismissing the error
               className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
               Dismiss
            </button>
        </div>
      </div>
    );
  }

  // Main UI when session and student data are available
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-10">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Visitor Request Portal
            </h1>
            {/* Display student name if available */}
            {student && (
                 <p className="text-sm text-gray-600">
                 Welcome, {student.name || student.full_name || `Student ${student.roll_no}`}
               </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center px-3 py-2 rounded-md transition-colors text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
          >
            <LogOutIcon className="w-5 h-5 mr-1.5" />
            Logout
          </motion.button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Status Message Area */}
        {statusMsg && (
           <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-lg border ${
                statusMsg.startsWith("Error:")
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              } flex items-center justify-between shadow-sm`}
            >
               <div className="flex items-center">
                  {statusMsg.startsWith("Error:") ? (
                      <XCircleIcon className="w-5 h-5 mr-2"/>
                  ) : (
                      <CheckCircleIcon className="w-5 h-5 mr-2"/>
                  )}
                  {statusMsg}
               </div>
               <button onClick={() => setStatusMsg("")} className="text-sm opacity-70 hover:opacity-100">
                  <XCircleIcon className="w-4 h-4"/>
               </button>
            </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 px-5 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 mr-3">
                    <PlusCircleIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Request a Visitor
                  </h2>
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display Student Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                            <label className="block font-medium text-gray-500 mb-1">Roll No</label>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800">
                               {student.roll_no}
                            </div>
                         </div>
                         <div>
                            <label className="block font-medium text-gray-500 mb-1">Room</label>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800">
                               {student.room_number || <span className="text-gray-400 italic">N/A</span>}
                            </div>
                         </div>
                         <div>
                             <label className="block font-medium text-gray-500 mb-1">Hostel Block</label>
                             <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800">
                                {student.hostel_block || <span className="text-gray-400 italic">N/A</span>}
                             </div>
                         </div>
                         <div>
                             <label className="block font-medium text-gray-500 mb-1">Emergency Contact</label>
                             <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 truncate">
                                {student.emergency_contact || <span className="text-gray-400 italic">N/A</span>}
                             </div>
                         </div>
                     </div>
                     <hr/>
                  {/* Visitor Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visitor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="Enter visitor's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Visit <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={info}
                      onChange={(e) => setInfo(e.target.value)}
                      required
                      rows="4"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="Please provide details about the visit..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-yellow-500 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  >
                    Submit Request
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Visitor Requests List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 px-5 py-4 border-b border-gray-200">
                 <div className="flex items-center">
                   <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 mr-3">
                     <UserIcon className="w-6 h-6 text-yellow-600" />
                   </div>
                   <h2 className="text-xl font-semibold text-gray-800">
                     Your Visitor Requests
                   </h2>
                 </div>
              </div>
              <div className="p-5">
                {loadingRequests ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-5xl mb-4 text-gray-400">👥</div>
                    <h3 className="text-xl font-medium text-gray-700">
                      No visitor requests found
                    </h3>
                    <p className="text-gray-500 mt-2">
                      You haven't submitted any visitor requests yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4"> {/* Changed grid to space-y */}
                    {requests.map((req) => (
                      <motion.div
                        key={req.request_id} // Ensure request_id is returned by API
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.005, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                        className="bg-white border border-gray-200 rounded-xl p-5 transition shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                           {/* Left Side: Visitor Info */}
                           <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                             <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-full text-yellow-600">
                               <UserIcon className="w-6 h-6" />
                             </div>
                             <div>
                               <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                                 {req.visitor_name}
                               </h3>
                               <div className="flex items-center text-xs text-gray-500 mt-1">
                                 <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                                 Requested: {new Date(req.requested_on_time).toLocaleDateString()} at {new Date(req.requested_on_time).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: true })}
                               </div>
                               {/* Arrival/Departure condensed */}
                                {(req.arrival_time || req.departure_time) && (
                                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                     {req.arrival_time && (
                                        <span className="flex items-center mr-2">
                                             <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-green-500" />
                                              Arr: {new Date(req.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                                         </span>
                                     )}
                                      {req.departure_time && (
                                         <span className="flex items-center">
                                             <LogOutIcon className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                             Dep: {new Date(req.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                                         </span>
                                     )}
                                    </div>
                                )}
                             </div>
                           </div>
                           {/* Right Side: Status Badge */}
                           <div className="flex-shrink-0 self-start sm:self-center">
                               {getStatusBadge(req)}
                           </div>
                        </div>

                         {/* Reason Section */}
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                            <InfoIcon className="w-3.5 h-3.5 mr-1" />
                            Reason for Visit:
                          </h4>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm">
                            {req.info}
                          </p>
                        </div>

                        {/* Cancel Button - Conditionally Rendered */}
                        {/* Shows if status is not 'cancelled' AND visitor hasn't departed */}
                        {req.status !== "cancelled" && !req.departure_time && (
                          <div className="mt-4 flex justify-end">
                            <motion.button
                              onClick={() => handleCancel(req.request_id)}
                              whileHover={{ scale: 1.05, backgroundColor: '#DC2626' /* red-600 */}}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Cancel Request
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}