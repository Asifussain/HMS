"use client";
import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import {
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  LogInIcon,
  LogOutIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function VisitorManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("success"); // success or error

  // Fetch all visitor requests
  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/guard/visitorRequest");
        const data = await res.json();

        // Sort the data with most recent first
        const sortedData = data.sort((a, b) => 
          new Date(b.requested_on_time) - new Date(a.requested_on_time)
        );
        
        setRequests(sortedData);
        setStatusMsg("");
      } catch (error) {
        console.error("Error fetching visitor requests:", error);
        setStatusMsg("Failed to load visitor data. Please try again.");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  // Compute overview counts:
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const insideCount = requests.filter((r) => r.arrival_time && !r.departure_time && r.status !== 'cancelled').length;
  const checkedOutCount = requests.filter((r) => r.arrival_time && r.departure_time && r.status !== 'cancelled').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;
  const totalCount = requests.length;

  // Improved pie chart data with optimized colors including cancelled
  const pieData = {
    labels: ["Pending", "Inside", "Checked Out", "Cancelled"],
    datasets: [
      {
        data: [pendingCount, insideCount, checkedOutCount, cancelledCount],
        backgroundColor: ["#FFC107", "#2196F3", "#4BC0C0", "#FF5252"],
        borderColor: ["#E6A800", "#1976D2", "#3EA9A9", "#D32F2F"],
        borderWidth: 2,
        hoverBackgroundColor: ["#FFD54F", "#64B5F6", "#80CBC4", "#FF8A80"],
        hoverBorderColor: ["#FFC107", "#2196F3", "#4BC0C0", "#FF5252"],
        hoverBorderWidth: 2,
      },
    ],
  };

  // Enhanced pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 15
    },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'center',
        labels: {
          padding: 15,
          boxWidth: 15,
          boxHeight: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        titleFont: {
          weight: 'bold',
          size: 14
        },
        bodyColor: '#555',
        bodyFont: {
          size: 13
        },
        padding: 12,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderAlign: 'center',
        hoverOffset: 7
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    cutout: '50%',
    radius: '95%'
  };

  // Action handler: check in, check out, or cancel a visitor request
  const handleAction = async (request_id, action) => {
    try {
      console.log(`Starting ${action} action for request ${request_id}`); // Debug line
      setStatusMsg(`Processing ${action} action...`);
      setStatusType("info");
      
      const res = await fetch("/api/guard/visitorRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id, action }),
      });
      
      console.log(`Response status: ${res.status}`); // Debug line
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }
      
      const data = await res.json();
      console.log(`Response data:`, data); // Debug line
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Show appropriate success message based on action
      let actionMessage = "Visitor status updated successfully!";
      if (action === "check_in") actionMessage = "Visitor checked in successfully!";
      if (action === "check_out") actionMessage = "Visitor checked out successfully!";
      if (action === "cancel") actionMessage = "Visitor request cancelled successfully!";
      
      setStatusMsg(actionMessage);
      setStatusType("success");
      
      // Refresh requests
      const res2 = await fetch("/api/guard/visitorRequest");
      if (!res2.ok) {
        throw new Error("Failed to refresh data after update");
      }
      
      const data2 = await res2.json();
      
      // Sort the data with most recent first
      const sortedData = data2.sort((a, b) => 
        new Date(b.requested_on_time) - new Date(a.requested_on_time)
      );
      
      setRequests(sortedData);
    } catch (error) {
      console.error("Error during visitor action:", error);
      setStatusMsg("Error: " + error.message);
      setStatusType("error");
    }
  };

  const getStatusBadge = (request) => {
    if (request.status === 'cancelled') {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <XCircleIcon className="w-4 h-4 mr-1" /> Cancelled
      </span>
    } else if (!request.arrival_time) {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <ClockIcon className="w-4 h-4 mr-1" /> Pending
      </span>
    } else if (!request.departure_time) {
      return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <UserCircleIcon className="w-4 h-4 mr-1" /> Inside
      </span>
    } else {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
        <CheckCircleIcon className="w-4 h-4 mr-1" /> Checked Out
      </span>
    }
  };

  // Format date function to make dates more readable
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading visitor records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/guard" className="mr-4">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </motion.div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Visitor Management</h1>
              <p className="text-sm text-gray-600">
                Monitor and manage campus visitors
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Status Message */}
          {statusMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="lg:col-span-3"
            >
              <div className={`p-4 rounded-xl shadow border flex items-center
                ${statusType === "success" ? "bg-green-50 border-green-200" : 
                  statusType === "info" ? "bg-blue-50 border-blue-200" : 
                  "bg-red-50 border-red-200"}`}>
                {statusType === "success" ? (
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                ) : statusType === "info" ? (
                  <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                ) : (
                  <AlertCircleIcon className="w-5 h-5 mr-2 text-red-600" />
                )}
                <p className={
                  statusType === "success" ? "text-green-700" : 
                  statusType === "info" ? "text-blue-700" : 
                  "text-red-700"
                }>
                  {statusMsg}
                </p>
              </div>
            </motion.div>
          )}

          {/* Dashboard Overview Section */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  Visitor Overview
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100"
                  >
                    <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
                    <p className="text-gray-600 text-sm mt-1">Total</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100"
                  >
                    <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    <p className="text-gray-600 text-sm mt-1">Pending</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100"
                  >
                    <p className="text-3xl font-bold text-blue-600">{insideCount}</p>
                    <p className="text-gray-600 text-sm mt-1">Inside</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-green-50 p-4 rounded-lg text-center border border-green-100"
                  >
                    <p className="text-3xl font-bold text-green-600">{checkedOutCount}</p>
                    <p className="text-gray-600 text-sm mt-1">Checked Out</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="lg:col-span-2 bg-red-50 p-4 rounded-lg text-center border border-red-100"
                  >
                    <p className="text-3xl font-bold text-red-600">{cancelledCount}</p>
                    <p className="text-gray-600 text-sm mt-1">Cancelled</p>
                  </motion.div>
                </div>
                
                {/* Chart Container */}
                <div className="h-64 mt-8">
                  <h3 className="text-gray-700 font-medium mb-4 text-center">Status Distribution</h3>
                  <div className="relative h-56">
                    {totalCount > 0 ? (
                      <Pie data={pieData} options={pieOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-gray-500">No data to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Visitor Requests Table */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ClipboardIcon className="w-5 h-5 mr-2" />
                  Visitor Requests
                </h2>
              </div>
              <div className="p-6">
                {requests.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-xl font-medium text-gray-700">No visitor requests</h3>
                    <p className="text-gray-500 mt-2">There are no visitor requests at this time.</p>
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor Info</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((req, index) => (
                          <motion.tr
                            key={req.request_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`hover:bg-gray-50 ${req.status === 'cancelled' ? 'bg-red-50' : ''}`}
                          >
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">{req.visitor_name}</div>
                              <div className="text-sm text-gray-500">Visiting: {req.roll_no}</div>
                              <div className="text-sm text-gray-500">Purpose: {req.info}</div>
                              <div className="text-sm text-gray-500">Hostel: {req.hostel_block}</div>
                              {req.room_number && <div className="text-sm text-gray-500">Room: {req.room_number}</div>}
                            </td>
                            <td className="px-4 py-4">
                              {getStatusBadge(req)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span>Requested: {formatDate(req.requested_on_time)}</span>
                                </div>
                                {req.arrival_time && (
                                  <div className="flex items-center">
                                    <LogInIcon className="w-4 h-4 mr-2 text-blue-500" />
                                    <span>Arrived: {formatDate(req.arrival_time)}</span>
                                  </div>
                                )}
                                {req.departure_time && (
                                  <div className="flex items-center">
                                    <LogOutIcon className="w-4 h-4 mr-2 text-green-500" />
                                    <span>Departed: {formatDate(req.departure_time)}</span>
                                  </div>
                                )}
                                {req.status === 'cancelled' && (
                                  <div className="flex items-center">
                                    <XCircleIcon className="w-4 h-4 mr-2 text-red-500" />
                                    <span>Cancelled: {formatDate(req.cancelled_time || req.requested_on_time)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {!req.arrival_time && req.status !== 'cancelled' && (
                                <div className="flex flex-col space-y-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(req.request_id, "check_in")}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center text-sm"
                                  >
                                    <LogInIcon className="w-4 h-4 mr-1" />
                                    Check In
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAction(req.request_id, "cancel")}
                                    className="bg-gradient-to-r from-red-500 to-red-700 text-white py-2 px-4 rounded-lg hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center text-sm"
                                  >
                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                    Cancel
                                  </motion.button>
                                </div>
                              )}
                              {req.arrival_time && !req.departure_time && req.status !== 'cancelled' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAction(req.request_id, "check_out")}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center text-sm w-full"
                                >
                                  <LogOutIcon className="w-4 h-4 mr-1" />
                                  Check Out
                                </motion.button>
                              )}
                              {(req.departure_time || req.status === 'cancelled') && (
                                <div className="text-sm text-gray-500 italic text-center">
                                  No actions available
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

// Missing icon definition
const ClipboardIcon = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  );
};