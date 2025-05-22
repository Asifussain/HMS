"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  ClipboardCheck, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Wrench,
  Phone,
  Home
} from "lucide-react";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MaintenanceTracking() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [resolutionMessage, setResolutionMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch technical complaints and students data in parallel
        const [complaintsRes, studentsRes] = await Promise.all([
          fetch("/api/admin/maintenance"),
          fetch("/api/admin/students")
        ]);
        
        const complaintsData = await complaintsRes.json();
        const studentsData = await studentsRes.json();
        
        // Properly match students with complaints using roll_no as the key
        const enhancedComplaints = complaintsData.map(complaint => {
          const student = studentsData.find(s => s.roll_no === complaint.roll_no) || {};
          return {
            ...complaint,
            student_name: student.full_name || "Unknown",
            mobile: student.emergency_contact || "Not provided",
            student_room: student.room_number || complaint.room_number || "Not assigned",
            hostel_block: complaint.hostel_block || student.hostel_block || "Not assigned",
            floor_no: student.Floor_no || "Not specified",
            unit_no: complaint.unit_no || student.unit_no || "Not specified",
            department: student.department || "Not specified",
            email: student.email || "Not provided"
          };
        });
        
        // Filter only technical complaints - this is redundant if API already filters,
        // but keeping it as a safety measure in case API changes
        const technicalComplaints = enhancedComplaints.filter(complaint => 
          complaint.type === 'technical'
        );
        
        setComplaints(technicalComplaints);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter complaints based on selected hostel
  const filteredComplaints = selectedHostel
    ? complaints.filter((comp) => comp.hostel_block === selectedHostel)
    : complaints;

  // Compute summary counts for bar graph - technical complaints only
  const summary = filteredComplaints.reduce(
    (acc, comp) => {
      if (comp.status === "pending") acc.pending++;
      else if (comp.status === "in progress") acc.inProgress++;
      else if (comp.status === "completed") acc.completed++;
      return acc;
    },
    { pending: 0, inProgress: 0, completed: 0 }
  );

  const chartData = {
    labels: ["Pending", "In Progress", "Completed"],
    datasets: [{
      label: "Technical Complaints",
      data: [summary.pending, summary.inProgress, summary.completed],
      backgroundColor: ["#FFCE56", "#4F46E5", "#10B981"],
    }],
  };

  // Get unique hostels from complaints
  const uniqueHostels = Array.from(
    new Set(complaints.map((comp) => comp.hostel_block).filter(Boolean))
  );

  const handleEditClick = (complaint) => {
    setEditingComplaint(complaint);
    setNewStatus(complaint.status);
    setResolutionMessage(complaint.resolution_info || "");
    setUpdateMessage("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingComplaint) return;
    
    const closedAt = newStatus === "completed" ? new Date().toISOString() : null;
    
    try {
      const res = await fetch("/api/admin/updateComplaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: editingComplaint.complaint_id,
          status: newStatus,
          resolution_info: resolutionMessage,
          closed_at: closedAt,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        setComplaints(complaints.map((comp) =>
          comp.complaint_id === editingComplaint.complaint_id
            ? { ...comp, status: newStatus, resolution_info: resolutionMessage, closed_at: closedAt }
            : comp
        ));
        
        setUpdateMessage("Complaint updated successfully!");
        setTimeout(() => {
          setEditingComplaint(null);
          setUpdateMessage("");
        }, 2000);
      } else {
        setUpdateMessage("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      setUpdateMessage("Error updating complaint");
    }
  };

  // Status badge component with icon
  const getStatusBadge = (status) => {
    const badges = {
      'pending': { icon: <Clock className="w-4 h-4 mr-1" />, class: "bg-yellow-100 text-yellow-800", text: "Pending" },
      'in progress': { icon: <ClipboardCheck className="w-4 h-4 mr-1" />, class: "bg-indigo-100 text-indigo-800", text: "In Progress" },
      'completed': { icon: <CheckCircle className="w-4 h-4 mr-1" />, class: "bg-green-100 text-green-800", text: "Completed" }
    };
    
    const badge = badges[status.toLowerCase()] || { icon: null, class: "bg-gray-100 text-gray-800", text: status };
    
    return (
      <span className={`${badge.class} px-3 py-1 rounded-full text-xs font-medium flex items-center`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  // Styling classes
  const bgClass = "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800";
  const cardBg = "bg-white border-gray-200";
  const textColors = {
    title: "text-gray-800",
    description: "text-gray-600",
    details: "text-gray-700"
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="bg-blue-100 p-4 rounded-full"
          >
            <Wrench className="w-12 h-12 text-blue-600" />
          </motion.div>
          <p className={`mt-4 ${textColors.description}`}>
            Loading technical maintenance tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Header */}
      <header className={`${cardBg} shadow-md border-b`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${textColors.title} flex items-center`}>
              <Wrench className="w-7 h-7 mr-3 text-red-600" />
              Technical Maintenance Tracking
            </h1>
            <p className={`text-sm ${textColors.description}`}>
              Technical complaints management system
            </p>
          </div>
          <Link href="/technician" className="flex items-center px-3 py-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200">
            <ChevronRight className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Table */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`${cardBg} rounded-xl shadow-lg border`}
            >
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${textColors.title}`}>
                  Technical Complaint Records
                </h2>
                <select 
                  value={selectedHostel} 
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  className="bg-white text-gray-800 rounded-md px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Hostels</option>
                  {uniqueHostels.map((hostel) => (
                    <option key={hostel} value={hostel}>{hostel}</option>
                  ))}
                </select>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Student", "Contact Info", "Description", "Status", "Created", "Actions"].map((header, index) => (
                        <th 
                          key={index} 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                          <div className="text-5xl mb-4">📋</div>
                          <h3 className="text-xl font-medium text-gray-700">No technical complaints found</h3>
                          <p className="text-gray-500 mt-2">No technical complaints match the current filter.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredComplaints.map((complaint) => (
                        <motion.tr 
                          key={complaint.complaint_id} 
                          whileHover={{ backgroundColor: "#f9fafb", scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-semibold">{complaint.student_name}</span>
                              <span className="text-xs text-gray-500">{complaint.roll_no}</span>
                              <span className="text-xs text-gray-500">{complaint.department}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-1 text-gray-500" />
                                <span>{complaint.mobile}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <Home className="w-4 h-4 mr-1 text-gray-500" />
                                <span className="text-gray-600">
                                  {complaint.hostel_block} - {complaint.student_room}
                                  {complaint.unit_no && ` (Unit ${complaint.unit_no})`}
                                  {complaint.floor_no && `, Floor ${complaint.floor_no}`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="max-w-xs truncate">{complaint.description}</div>
                            <div className="text-xs text-gray-500 mt-1">Type: Technical</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(complaint.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditClick(complaint)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition"
                            >
                              Edit
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
          
          {/* Right Column - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Technical Complaints Overview */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`${cardBg} rounded-xl shadow-lg border`}
            >
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 rounded-t-xl">
                <h2 className={`text-xl font-semibold ${textColors.title}`}>Technical Complaints Overview</h2>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <Bar 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                </div>
                
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  {[
                    { count: summary.pending, label: "Pending", color: "text-yellow-800", bg: "bg-yellow-50" },
                    { count: summary.inProgress, label: "In Progress", color: "text-indigo-800", bg: "bg-indigo-50" },
                    { count: summary.completed, label: "Completed", color: "text-green-800", bg: "bg-green-50" }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className={`${item.bg} p-4 rounded-lg`}
                    >
                      <div className={`${item.color} text-2xl font-bold`}>{item.count}</div>
                      <div className={`${item.color} text-sm opacity-70`}>{item.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Hostel Distribution - Technical Complaints */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`${cardBg} rounded-xl shadow-lg border`}
            >
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 rounded-t-xl">
                <h2 className={`text-xl font-semibold ${textColors.title}`}>Technical Complaints by Hostel</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {uniqueHostels.map((hostel) => {
                    const count = complaints.filter(c => c.hostel_block === hostel).length;
                    const percent = Math.round((count / complaints.length) * 100) || 0;
                    
                    return (
                      <motion.li 
                        key={hostel} 
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-700">{hostel}</span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5 }}
                              className="bg-green-600 h-2.5 rounded-full"
                            ></motion.div>
                          </div>
                          <span className="text-xs text-gray-500">{count} ({percent}%)</span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Modal for editing complaints */}
      {editingComplaint && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={`${cardBg} rounded-xl shadow-2xl w-full max-w-md`}
          >
            <div className="bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-medium">Update Technical Complaint #{editingComplaint.complaint_id}</h3>
            </div>
            <form onSubmit={handleUpdate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complaint Status
                  </label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Information
                  </label>
                  <textarea
                    value={resolutionMessage}
                    onChange={(e) => setResolutionMessage(e.target.value)}
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter resolution details or notes..."
                  />
                </div>
                
                {updateMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-md"
                  >
                    <p className="text-green-700 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {updateMessage}
                    </p>
                  </motion.div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setEditingComplaint(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Update Complaint
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}