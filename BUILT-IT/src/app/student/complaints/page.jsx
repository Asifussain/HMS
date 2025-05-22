"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  PaperclipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MessageSquareTextIcon,
  LogOutIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  UserIcon
} from "lucide-react";

export default function StudentComplaints() {
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [complaintType, setComplaintType] = useState("technical");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

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
    async function fetchComplaints() {
      if (student) {
        try {
          const res = await fetch(`/api/complaints?RollNo=${student.roll_no}`);
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            setComplaints(data);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingComplaints(false);
        }
      }
    }
    fetchComplaints();
  }, [student]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) {
      setUploadStatus("Error: Student record not loaded."); // Added Error prefix
      return;
    }
    // Clear previous status
    setUploadStatus("");
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          RollNo: student.roll_no,
          type: complaintType,
          description,
          photo: photo || null,
          hostel_block: student.hostel_block,
          room_number: student.room_number,
          unit_no: student.unit_no || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setUploadStatus("Error: " + data.error);
      } else {
        setUploadStatus("Complaint filed successfully!");
        setComplaintType("technical");
        setDescription("");
        setPhoto(null);
        setPhotoPreview(null);
        setShowForm(false);
        // Refetch complaints after successful submission
        const res2 = await fetch(`/api/complaints?RollNo=${student.roll_no}`);
        const data2 = await res2.json();
        setComplaints(data2);
      }
    } catch (err) {
      setUploadStatus("Error: " + err.message);
    }
  };

  // Status badges remain the same for semantic clarity (Yellow for Pending, Green for Resolved, Indigo for Rejected)
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"><ClockIcon className="w-4 h-4 mr-1" /> Pending</span>;
      case 'resolved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1" /> Resolved</span>;
      case 'rejected':
        // Changed red to indigo for rejected status
        return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"><XCircleIcon className="w-4 h-4 mr-1" /> Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Complaint type icons remain the same
  const getComplaintTypeIcon = (type) => {
    switch(type) {
        case 'technical': return "💻";
        case 'electrician': return "⚡";
        case 'carpenter': return "🪚";
        case 'plumber': return "🚿";
        case 'cleanliness': return "🧹";
        case 'other': return "🔍";
        default: return "📋";
    }
  };

  // Complaint type background colors remain the same to differentiate types
  const getComplaintTypeColor = (type) => {
    switch(type) {
        case 'technical': return "from-blue-50 to-blue-100";
        case 'electrician': return "from-yellow-50 to-yellow-100";
        case 'carpenter': return "from-amber-50 to-amber-100";
        case 'plumber': return "from-sky-50 to-sky-100";
        case 'cleanliness': return "from-green-50 to-green-100";
        case 'other': return "from-purple-50 to-purple-100";
        default: return "from-gray-50 to-gray-100";
    }
  };

  // Authentication Required Screen
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                {/* Changed icon background to lighter indigo (indigo-50) */}
                <div className="bg-indigo-50 p-4 rounded-full">
                  {/* Changed icon color to lighter indigo (indigo-500) */}
                  <UserIcon className="w-12 h-12 text-indigo-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Authentication Required
              </h2>
              <p className="mb-6 text-gray-600">
                Please sign in to view and manage your complaints
              </p>
              {/* Changed button color to lighter indigo (indigo-500) and hover (indigo-600) */}
              <button className="w-full py-3 px-4 rounded-lg transition-all duration-300 font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading Student Record Screen
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          {/* Changed spinner border color to lighter indigo (indigo-500) */}
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading student record...</p>
        </div>
      </div>
    );
  }

  // Error Screen (changed red shades to indigo shades)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 max-w-lg w-full shadow-md">
          <h2 className="text-indigo-700 text-lg font-medium">An error occurred</h2>
          <p className="mt-2 text-indigo-600">{error}</p>
        </div>
      </div>
    );
  }

  // Main Content Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Student Complaints Portal
            </h1>
            <p className="text-sm text-gray-600">
              Welcome, {student.full_name || `Student ${student.roll_no}`}
            </p>
          </div>
          {/* Logout button kept neutral gray */}
          <button className="flex items-center px-3 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200">
            <LogOutIcon className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* New Complaint Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          // Changed button background to lighter indigo (indigo-500) and hover (indigo-600)
          className="mb-6 flex items-center px-5 py-3 bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-colors"
        >
          {showForm ?
            <><ChevronDownIcon className="w-5 h-5 mr-2" /> Hide Complaint Form</> :
            <><PlusCircleIcon className="w-5 h-5 mr-2" /> New Complaint</>
          }
        </motion.button>

        {/* Complaint Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden"
          >
            {/* Changed form header background to lighter indigo (indigo-500) */}
            <div className="bg-indigo-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <MessageSquareTextIcon className="w-5 h-5 mr-2" />
                File a New Complaint
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    // Changed focus ring to lighter indigo (indigo-400)
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="technical">💻 Technical Issue</option>
                    <option value="electrician">⚡ Electric Issue</option>
                    <option value="carpenter">🪚 Civil-Carpenter</option>
                    <option value="plumber">🚿 Civil-Plumber</option>
                    <option value="cleanliness">🧹 Cleanliness</option>
                    <option value="other">🔍 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows="4"
                    // Changed focus ring to lighter indigo (indigo-400)
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Please describe your issue in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photo (optional)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    {/* Changed dashed border to lighter indigo (indigo-200) - kept 200 for visibility */}
                    <label className="flex flex-col w-full h-32 border-2 border-indigo-200 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-7">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="h-16 w-auto object-contain" />
                        ) : (
                          <>
                            <PaperclipIcon className="w-8 h-8 text-gray-400" />
                            <p className="pt-1 text-sm text-gray-500">Click to upload an image</p>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    // Changed button background lighter (indigo-500), hover (indigo-600), and focus ring (indigo-400)
                    className="flex-1 bg-indigo-500 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  >
                    Submit Complaint
                  </button>
                  {/* Cancel button kept neutral gray */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setUploadStatus(""); // Clear status on cancel
                      setPhotoPreview(null); // Clear preview on cancel
                      // Optionally reset other form fields
                      // setComplaintType("technical");
                      // setDescription("");
                      // setPhoto(null);
                    }}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Upload status uses green for success, indigo for error */}
              {uploadStatus && (
                <div className={`mt-4 p-3 border rounded-md ${uploadStatus.startsWith("Error:") ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`flex items-center ${uploadStatus.startsWith("Error:") ? 'text-indigo-700' : 'text-green-700'}`}>
                    {uploadStatus.startsWith("Error:") ? <XCircleIcon className="w-5 h-5 mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                    {uploadStatus}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Complaints List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          {/* Changed list header background to lighter indigo (indigo-500) */}
          <div className="bg-indigo-500 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MessageSquareTextIcon className="w-5 h-5 mr-2" />
              Your Complaints
            </h2>
            {/* Changed total count badge text color to lighter indigo (indigo-500) */}
            <span className="bg-white text-indigo-500 px-3 py-1 rounded-full text-sm font-medium">
              {complaints.length} total
            </span>
          </div>
          <div className="p-6">
            {loadingComplaints ? (
              <div className="flex justify-center items-center h-64">
                {/* Changed spinner border color to lighter indigo (indigo-500) */}
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-700">No complaints filed</h3>
                <p className="text-gray-500 mt-2">You haven't submitted any complaints yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {complaints.map((comp) => (
                  <motion.div
                    key={comp.complaint_id}
                    whileHover={{ scale: 1.02 }}
                    // Kept individual card gradients for type differentiation
                    className={`bg-gradient-to-br ${getComplaintTypeColor(comp.type)} border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-3">
                        <div className="text-3xl flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm">
                          {getComplaintTypeIcon(comp.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">
                            {comp.type} Issue
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(comp.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        {/* Status badges now use indigo for 'rejected' */}
                        {getStatusBadge(comp.status)}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{comp.description}</p>
                    </div>

                    {comp.resolution_info && (
                      <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
                        <h4 className="text-xs font-medium text-gray-700">Resolution:</h4>
                        <p className="text-sm text-gray-700 mt-1">{comp.resolution_info}</p>
                      </div>
                    )}

                    {comp.closed_at && (
                      <div className="mt-4 text-xs text-gray-500">
                        <span className="font-medium">Closed:</span> {new Date(comp.closed_at).toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}