"use client";
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  PencilIcon, 
  FilterIcon,
  ChevronDownIcon,
  XIcon,
  LayoutDashboardIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Simplified animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

export default function RoomRequestTracking() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [error, setError] = useState("");
  const [editingRequest, setEditingRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState("raised_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isMobileView, setIsMobileView] = useState(false);

  // Check window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/api/admin/roomChangeRequests");
        const data = await res.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching room change requests:", error);
        setError("Failed to fetch room change requests");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedRequests = [...(selectedHostel
    ? requests.filter((req) => req.hostel_block === selectedHostel)
    : requests)].sort((a, b) => {
      // Handle dates specially
      if (sortField === "raised_at") {
        const dateA = new Date(a[sortField]);
        const dateB = new Date(b[sortField]);
        return sortDirection === "asc" 
          ? dateA - dateB 
          : dateB - dateA;
      }
      
      // Regular string/number sorting
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const uniqueHostels = Array.from(
    new Set(requests.map((req) => req.hostel_block).filter(Boolean))
  );

  const handleEditClick = (request) => {
    setEditingRequest(request);
    setNewStatus(request.status);
    setUpdateStatus("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    const closedAt =
      newStatus === "approved" || newStatus === "rejected"
        ? new Date().toISOString()
        : null;
    try {
      const res = await fetch("/api/admin/updateRoomChangeRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: editingRequest.request_id,
          status: newStatus,
          closed_at: closedAt,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setRequests(
          requests.map((req) =>
            req.request_id === editingRequest.request_id
              ? { ...req, status: newStatus, closed_at: closedAt }
              : req
          )
        );
        setUpdateStatus("Request updated successfully!");
        setTimeout(() => {
          setEditingRequest(null);
          setUpdateStatus("");
        }, 2000);
      } else {
        setUpdateStatus("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error updating room change request:", error);
      setUpdateStatus("Error updating request");
    }
  };

  const summary = sortedRequests.reduce((acc, req) => {
    if (req.status === "pending") acc.pending++;
    else if (req.status === "approved") acc.approved++;
    else if (req.status === "rejected") acc.rejected++;
    else acc.other++;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0, other: 0 });

  const chartData = {
    labels: ["Pending", "Approved", "Rejected", "Other"],
    datasets: [
      {
        label: "Requests",
        data: [summary.pending, summary.approved, summary.rejected, summary.other],
        backgroundColor: ["#FFB84C", "#4CAF50", "#F44336", "#9E9E9E"],
        hoverBackgroundColor: ["#F5A623", "#3B9142", "#E53935", "#757575"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: 'Room Change Request Status',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(50, 50, 93, 0.9)',
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 6
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuad'
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <XCircleIcon className="w-4 h-4 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700">Loading room change requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg shadow-lg">
          <div className="flex items-start">
            <div className="mr-4 bg-red-100 p-3 rounded-full">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-red-700 text-xl font-bold mb-3">An error occurred</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <LayoutDashboardIcon className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Room Request Tracking</h1>
              <p className="text-sm text-gray-600">Manage and track room change requests</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {sortedRequests.length} request{sortedRequests.length !== 1 ? 's' : ''} 
            {selectedHostel ? ` in ${selectedHostel}` : ''}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              {selectedHostel ? `Filtered: ${selectedHostel}` : "Filter Hostel"}
              <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Hostel</h3>
                  <select
                    value={selectedHostel}
                    onChange={(e) => {
                      setSelectedHostel(e.target.value);
                      setIsFilterOpen(false);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  >
                    <option value="">All Hostels</option>
                    {uniqueHostels.map((hostel) => (
                      <option key={hostel} value={hostel}>
                        {hostel}
                      </option>
                    ))}
                  </select>
                  
                  {selectedHostel && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedHostel("");
                          setIsFilterOpen(false);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                      >
                        <XIcon className="w-3 h-3 mr-1" /> Clear Filter
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Pending", value: summary.pending, color: "text-yellow-800", bg: "bg-yellow-50", borderColor: "border-yellow-200", icon: <ClockIcon className="w-5 h-5 text-yellow-500" /> },
            { label: "Approved", value: summary.approved, color: "text-green-800", bg: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircleIcon className="w-5 h-5 text-green-500" /> },
            { label: "Rejected", value: summary.rejected, color: "text-red-800", bg: "bg-red-50", borderColor: "border-red-200", icon: <XCircleIcon className="w-5 h-5 text-red-500" /> },
            { label: "Total", value: sortedRequests.length, color: "text-blue-800", bg: "bg-blue-50", borderColor: "border-blue-200", icon: <LayoutDashboardIcon className="w-5 h-5 text-blue-500" /> }
          ].map(({ label, value, color, bg, borderColor, icon }, i) => (
            <motion.div 
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`${bg} p-4 rounded-xl border ${borderColor} flex items-center justify-between shadow-sm`}
            >
              <div>
                <p className={`text-sm font-medium ${color}`}>{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              <div className={`p-3 rounded-full bg-white shadow-sm`}>
                {icon}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Request List */}
          <div className="lg:col-span-3">
            <motion.div 
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <LayoutDashboardIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Room Change Requests
                </h2>
              </div>

              {/* Request Table */}
              <div className="p-4">
                {sortedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-xl font-medium text-gray-700">No requests found</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">There are no room change requests matching your filter.</p>
                    {selectedHostel && (
                      <button
                        onClick={() => setSelectedHostel("")}
                        className="mt-6 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                      >
                        Show All Requests
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            { label: "Roll No", field: "roll_no", sortable: true },
                            { label: "Student Name", field: "full_name", sortable: true },
                            { label: "Current Room", field: "current_room", sortable: true, hideMobile: true },
                            { label: "Preferred Room", field: "preferred_room", sortable: true, hideMobile: true },
                            { label: "Hostel", field: "hostel_block", sortable: true, hideMobile: isMobileView },
                            { label: "Status", field: "status", sortable: true },
                            { label: "Raised", field: "raised_at", sortable: true },
                            { label: "Actions", field: null, sortable: false }
                          ].filter(col => !col.hideMobile).map((column) => (
                            <th 
                              key={column.label} 
                              className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                              onClick={() => column.sortable && handleSort(column.field)}
                            >
                              <div className="flex items-center">
                                {column.label}
                                {column.sortable && getSortIcon(column.field)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedRequests.map((req, index) => (
                          <tr 
                            key={req.request_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.roll_no}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{req.full_name}</td>
                            {!isMobileView && <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{req.current_room || "-"}</td>}
                            {!isMobileView && <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{req.preferred_room || "-"}</td>}
                            {(!isMobileView || !isMobileView) && <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{req.hostel_block}</td>}
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {getStatusBadge(req.status)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(req.raised_at).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleEditClick(req)}
                                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center hover:bg-blue-100 transition duration-200"
                              >
                                <PencilIcon className="w-4 h-4 mr-1" /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-1">
            <motion.div 
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full"
            >
              <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <LayoutDashboardIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Request Overview
                </h2>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <Bar data={chartData} options={chartOptions} />
                </div>
                
                {/* Status Breakdown */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Pending", value: summary.pending, total: sortedRequests.length, color: "bg-yellow-500" },
                      { label: "Approved", value: summary.approved, total: sortedRequests.length, color: "bg-green-500" },
                      { label: "Rejected", value: summary.rejected, total: sortedRequests.length, color: "bg-red-500" },
                    ].map(({ label, value, total, color }) => {
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">{label}</span>
                            <span className="text-xs font-medium text-gray-700">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              style={{ width: `${percentage}%` }}
                              className={`h-2 rounded-full ${color}`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
            >
              <h3 className="text-xl font-semibold mb-4">Update Request #{editingRequest.request_id}</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Student Details</p>
                {[
                  { label: "Name", value: editingRequest.full_name },
                  { label: "Roll No", value: editingRequest.roll_no },
                  { label: "Current Room", value: editingRequest.current_room || "-" },
                  { label: "Preferred Room", value: editingRequest.preferred_room || "-" }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1 border-b last:border-b-0">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Reason:</p>
                  <p className="bg-gray-50 p-3 rounded text-sm">{editingRequest.reason || "No reason provided"}</p>
                </div>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <AnimatePresence>
                  {updateStatus && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md"
                    >
                      <p className="text-green-700 flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        {updateStatus}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingRequest(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}