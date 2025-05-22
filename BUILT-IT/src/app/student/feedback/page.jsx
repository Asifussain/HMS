"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  StarIcon, 
  CheckCircleIcon, 
  ClipboardIcon, 
  LogOutIcon,
  BarChart3Icon,
  MessageSquareTextIcon,
  ChevronRightIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

const getCurrentWeekLabel = () => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  if (dayOfMonth <= 7) return "Week 1";
  if (dayOfMonth <= 14) return "Week 2";
  if (dayOfMonth <= 21) return "Week 3";
  if (dayOfMonth <= 28) return "Week 4";
  return "Week 5";
};

export default function StudentFeedback() {
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Form state
  const [feedbackText, setFeedbackText] = useState("");
  const [infraRating, setInfraRating] = useState("");
  const [techRating, setTechRating] = useState("");
  const [cleanRating, setCleanRating] = useState("");
  const [overallRating, setOverallRating] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // All feedbacks for this student
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchStudent() {
      if (session && session.user) {
        const email = session.user.email;
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
        }
      }
    }
    fetchStudent();
  }, [session]);

  useEffect(() => {
    async function checkFeedback() {
      if (student) {
        const currentWeek = getCurrentWeekLabel();
        try {
          const res = await fetch(
            `/api/student/feedback?studentId=${student.student_id}&week=${currentWeek}`
          );
          const data = await res.json();
          if (data.exists) {
            setFeedbackSubmitted(true);
          } else {
            setFeedbackSubmitted(false);
          }
        } catch (err) {
          console.error("Error checking feedback:", err);
        }
      }
    }
    checkFeedback();
  }, [student]);

  useEffect(() => {
    async function fetchAllFeedbacks() {
      if (student) {
        setLoadingFeedbacks(true);
        try {
          const res = await fetch(`/api/student/feedback/all?studentId=${student.student_id}`);
          if (!res.ok) {
            const text = await res.text();
            console.error("Non-OK response:", text);
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          setAllFeedbacks(data);
        } catch (err) {
          console.error("Error fetching all feedbacks:", err);
        } finally {
          setLoadingFeedbacks(false);
        }
      }
    }
    fetchAllFeedbacks();
  }, [student, statusMsg]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) {
      setStatusMsg("Student record not loaded.");
      return;
    }
    const weekLabel = getCurrentWeekLabel();
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.student_id,
          feedback_text: feedbackText,
          infra_rating: parseFloat(infraRating),
          technical_rating: parseFloat(techRating),
          cleanliness_rating: parseFloat(cleanRating),
          overall_rating: parseFloat(overallRating),
          feedback_week: weekLabel,
          hostel_block: student.hostel_block,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatusMsg("Error: " + data.error);
      } else {
        setStatusMsg("Feedback submitted successfully!");
        setFeedbackText("");
        setInfraRating("");
        setTechRating("");
        setCleanRating("");
        setOverallRating("");
        setFeedbackSubmitted(true);
        const res2 = await fetch(`/api/student/feedback/all?studentId=${student.student_id}`);
        const data2 = await res2.json();
        setAllFeedbacks(data2);
      }
    } catch (err) {
      setStatusMsg("Error: " + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  // Rating stars component
  const RatingInput = ({ value, onChange, label, icon, color }) => {
    return (
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <span className={`mr-2 p-1 rounded-lg ${color}`}>{icon}</span>
          {label}
        </label>
        <div className="flex items-center">
          <div className="flex flex-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                  parseFloat(value) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => onChange(star)}
              />
            ))}
          </div>
          <input
            type="number"
            step="0.1"
            min="1"
            max="5"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
            className="w-16 border border-gray-300 rounded-md px-3 py-2 ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  // Get rating data for visualization
  const getRatingCategoryIcon = (category) => {
    switch (category) {
      case "infrastructure":
        return "🏗️";
      case "technical":
        return "💻";
      case "cleanliness":
        return "🧹";
      case "overall":
        return "⭐";
      default:
        return "📊";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <MessageSquareTextIcon className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Student Feedback Portal
              </h2>
              <p className="mb-6 text-gray-600">
                Please sign in to submit your weekly feedback
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

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading student record...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg w-full">
          <h2 className="text-red-700 text-lg font-medium">An error occurred</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      {/* Professional Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Student Feedback Portal
            </h1>
            <p className="text-sm text-gray-600">
              Welcome, {student.full_name || `Student ${student.roll_no}`}
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

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Week Feedback Form */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden h-full"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <MessageSquareTextIcon className="w-5 h-5 mr-2" />
                  {getCurrentWeekLabel()} Feedback
                </h2>
              </div>

              <div className="p-5">
                {feedbackSubmitted ? (
                  <div className="text-center py-8">
                    <div className="mb-4 flex justify-center">
                      <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">Feedback Submitted</h3>
                    <p className="text-gray-500 mt-2">
                      You have already submitted feedback for {getCurrentWeekLabel()}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <span className="mr-2 bg-indigo-100 p-1 rounded-lg text-indigo-600">
                          <MessageSquareTextIcon className="w-4 h-4" />
                        </span>
                        Your Feedback
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        required
                        rows="4"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Please share your thoughts and suggestions..."
                      />
                    </div>

                    <RatingInput
                      value={infraRating}
                      onChange={setInfraRating}
                      label="Infrastructure Rating"
                      icon={<BarChart3Icon className="w-4 h-4" />}
                      color="bg-blue-100 text-blue-600"
                    />
                    
                    <RatingInput
                      value={techRating}
                      onChange={setTechRating}
                      label="Technical Rating"
                      icon={<BarChart3Icon className="w-4 h-4" />}
                      color="bg-purple-100 text-purple-600"
                    />
                    
                    <RatingInput
                      value={cleanRating}
                      onChange={setCleanRating}
                      label="Cleanliness Rating"
                      icon={<BarChart3Icon className="w-4 h-4" />}
                      color="bg-green-100 text-green-600"
                    />
                    
                    <RatingInput
                      value={overallRating}
                      onChange={setOverallRating}
                      label="Overall Rating"
                      icon={<BarChart3Icon className="w-4 h-4" />}
                      color="bg-yellow-100 text-yellow-600"
                    />
                    
                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:opacity-90 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Submit Feedback
                    </button>
                  </form>
                )}
                
                {statusMsg && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="text-green-700 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      {statusMsg}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Feedback History */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-5 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ClipboardIcon className="w-5 h-5 mr-2" />
                  Your Feedback History
                </h2>
              </div>

              <div className="p-5">
                {loadingFeedbacks ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : allFeedbacks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mb-6 flex justify-center">
                      <div className="bg-gray-100 p-4 rounded-full">
                        <ClipboardIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700">No feedback submitted</h3>
                    <p className="text-gray-500 mt-2">You haven't provided any feedback yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allFeedbacks.map((fb, index) => (
                      <motion.div 
                        key={fb.feedback_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 hover:shadow-md transition group relative overflow-hidden"
                      > 
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-4">
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl shadow">
                              <ClipboardIcon className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {fb.feedback_week}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Submitted on {new Date(fb.created_at).toLocaleDateString()} at {new Date(fb.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              Hostel {fb.hostel_block}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-gray-700">{fb.feedback_text}</p>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                            <div className="mr-3 bg-blue-100 text-blue-600 p-2 rounded-lg">
                              <BarChart3Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Infrastructure</div>
                              <div className="font-semibold">{fb.infra_rating}/5</div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                            <div className="mr-3 bg-purple-100 text-purple-600 p-2 rounded-lg">
                              <BarChart3Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Technical</div>
                              <div className="font-semibold">{fb.technical_rating}/5</div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                            <div className="mr-3 bg-green-100 text-green-600 p-2 rounded-lg">
                              <BarChart3Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Cleanliness</div>
                              <div className="font-semibold">{fb.cleanliness_rating}/5</div>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                            <div className="mr-3 bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                              <BarChart3Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Overall</div>
                              <div className="font-semibold">{fb.overall_rating}/5</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}