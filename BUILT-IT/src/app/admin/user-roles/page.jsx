// app/admin/user-roles/page.jsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  UsersIcon,
  UserIcon,
  ClipboardListIcon,
  FilterIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  PieChartIcon,
  PlusIcon,
  UserPlusIcon, // Icon for Add User button
  XIcon,
  AlertTriangleIcon,
  PhoneIcon // Added Phone Icon
} from "lucide-react";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Define the roles that can be assigned
const ALLOWED_ROLES_FOR_ASSIGNMENT = [
    "admin", "technician", "plumber", "carpenter", "cleaner",
    "manager", "supervisor", "staff", "user", "guest",
];

// --- Simple Modal Component ---
function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative border border-gray-200"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

export default function AdminUserRoles() {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [expandedRole, setExpandedRole] = useState(null);

  // --- State for the Add/Update Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'update'
  const [formData, setFormData] = useState({ // Consolidate form data
      email: '',
      role: ALLOWED_ROLES_FOR_ASSIGNMENT[0] || '',
      phoneNumber: '' // Added phone number
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  // --- End Modal State ---

  const fetchUserRoles = useCallback(async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    console.log("Attempting to fetch user roles from /api/admin/users-by-roles");

    try {
      const res = await fetch("/api/admin/users-by-roles"); // Correct path based on file structure
      console.log("Fetch response status:", res.status);

      if (!res.ok) {
        // Attempt to read error message from backend if possible
        let errorData = { error: `Failed to fetch data (status: ${res.status})`};
        try {
            errorData = await res.json();
        } catch (jsonError) {
            // Ignore if response is not JSON
            console.error("Response was not JSON:", await res.text());
        }
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Successfully fetched user roles:", data);
      setUserRoles(data);

    } catch (err) {
      console.error("Fetch or processing failed:", err);
      // Set a user-friendly error message, potentially based on the caught error type
      if (err.message.includes("fetch")) { // Generic fetch failure (network, DNS, CORS, server down)
           setError("Failed to connect to the server. Please check the network connection and ensure the backend server is running.");
      } else { // Error from backend response or JSON parsing
           setError(`An error occurred while fetching data: ${err.message}`);
      }
      setUserRoles([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  // --- Helper function to open the modal ---
  const openModal = (mode = 'add', initialData = {}) => {
      setModalMode(mode);
      setFormData({
          email: initialData.email || '',
          role: initialData.role || ALLOWED_ROLES_FOR_ASSIGNMENT[0] || '',
          phoneNumber: initialData.phoneNumber || ''
      });
      setModalError('');
      setModalSuccess('');
      setIsModalOpen(true);
  };

  // --- Handler for Modal Form Input Change ---
  const handleModalInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handler for Modal Submission (Unified) ---
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");

    const { email, role, phoneNumber } = formData;

    // Basic Validations
    if (!email || !role) {
        setModalError("Email and Role are required.");
        setModalLoading(false);
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
       setModalError("Please enter a valid email address.");
       setModalLoading(false);
       return;
    }

    const endpoint = modalMode === 'add' ? "/api/admin/add-user" : "/api/admin/update-user-role";
    const payload = modalMode === 'add'
        ? { email, role, phone_number: phoneNumber || null }
        : { email, role };

    console.log(`Attempting to ${modalMode} user via ${endpoint}`);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log(`${modalMode === 'add' ? 'Add' : 'Update'} User API Response Status:`, res.status);
      console.log(`${modalMode === 'add' ? 'Add' : 'Update'} User API Response Data:`, data);

      if (res.ok) {
        setModalSuccess(data.message || (modalMode === 'add'
            ? `User ${email} added successfully.`
            : `Role for ${email} updated successfully.`
            )
        );
        setFormData({ email: '', role: ALLOWED_ROLES_FOR_ASSIGNMENT[0] || '', phoneNumber: '' });
        await fetchUserRoles(); // Refresh the roles data
        setTimeout(() => {
           setIsModalOpen(false);
           setModalSuccess("");
        }, 2500);
      } else {
        setModalError(data.error || `Failed to ${modalMode} user (status: ${res.status})`);
      }
    } catch (err) {
      console.error(`${modalMode === 'add' ? 'Add' : 'Update'} user fetch/processing failed:`, err);
      setModalError(`Failed to send ${modalMode} request. Check network or server status.`);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredRoles = selectedRoleFilter
    ? userRoles.filter((role) => role.role === selectedRoleFilter)
    : userRoles;

  const uniqueRolesForFilter = Array.from(
    new Set(userRoles.map((role) => role.role))
  ).sort();

  const totalUsers = userRoles.reduce((sum, role) => sum + parseInt(role.count || 0, 10), 0);

  const chartData = {
    labels: userRoles.map(role => role.role),
    datasets: [
      {
        data: userRoles.map(role => role.count),
        backgroundColor: [
          "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
          "#EC4899", "#06B6D4", "#6366F1", "#84CC16", "#D97706",
          "#5EEAD4", "#F87171"
        ],
        borderColor: "#FFFFFF",
        borderWidth: 2,
      },
    ],
  };

  const toggleRoleExpansion = (role) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

   const getRoleColor = (roleName) => {
    const roleColors = {
      admin: { bg: "bg-blue-100", text: "text-blue-600" },
      manager: { bg: "bg-green-100", text: "text-green-600" },
      supervisor: { bg: "bg-yellow-100", text: "text-yellow-600" },
      staff: { bg: "bg-purple-100", text: "text-purple-600" },
      user: { bg: "bg-pink-100", text: "text-pink-600" },
      guest: { bg: "bg-cyan-100", text: "text-cyan-600" },
      technician: { bg: "bg-orange-100", text: "text-orange-600" },
      plumber: { bg: "bg-teal-100", text: "text-teal-600" },
      carpenter: { bg: "bg-lime-100", text: "text-lime-600" },
      cleaner: { bg: "bg-indigo-100", text: "text-indigo-600" },
    };
    const lookupKey = roleName ? roleName.toLowerCase() : '';
    return roleColors[lookupKey] || { bg: "bg-gray-100", text: "text-gray-600" };
  };

  // --- Error Display Component ---
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg w-full shadow-lg text-center">
           <div className="flex items-center justify-center mb-5">
                <div className="bg-red-100 p-3 rounded-full">
                 <AlertTriangleIcon className="h-8 w-8 text-red-600"/>
               </div>
             </div>
             <h2 className="text-2xl font-bold text-red-700 mb-3">An Error Occurred</h2>
             <p className="text-red-600 mb-6 text-sm">{error}</p>
             {/* Specific advice for connection errors */}
             {error.includes("connect") || error.includes("Failed to fetch") ? (
                 <p className="text-xs text-gray-500 mb-6">
                    Please ensure the backend server is running and accessible. Check the terminal logs for more details about the API routes (`/api/admin/...`).
                 </p>
              ) : (
                 <p className="text-xs text-gray-500 mb-6">
                    Please check the server logs for more details.
                 </p>
             )}
             <button
                 onClick={fetchUserRoles} // Retry button
                 className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                 Try Again
              </button>
           </div>
         </div>
       );
   }

   // --- Main JSX ---
   return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
       {/* Header */}
       <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="container mx-auto px-4 sm:px-6 py-3">
           <div className="flex justify-between items-center">
              {/* Left Side: Title */}
              <div className="flex items-center gap-3">
               <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                 <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
               </div>
               <div>
                 <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                   User Roles Management
                 </h1>
                 <p className="text-xs sm:text-sm text-gray-500 hidden md:block">
                   Analyze and manage user role distribution
                 </p>
               </div>
             </div>

              {/* Right Side: Buttons */}
             <div className="flex items-center gap-2 sm:gap-3">
                {/* Add User Button */}
                <button
                    onClick={() => openModal('add')}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-xs sm:text-sm font-medium shadow-sm border border-green-700 whitespace-nowrap"
                    title="Add New User"
                >
                    <UserPlusIcon className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add User</span>
                    <span className="sm:hidden">Add</span>
                </button>


                 <Link
                     href="/admin" // Adjust if necessary
                     className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors text-xs sm:text-sm font-medium shadow-sm border border-gray-200 whitespace-nowrap"
                     title="Back to Admin Dashboard"
                 >
                     <ArrowLeftIcon className="w-4 h-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">Dashboard</span>
                     <span className="sm:hidden">Back</span>
                 </Link>
             </div>
           </div>
         </div>
       </header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filter Card */}
         <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-200"
        >
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-700 flex items-center">
              <FilterIcon className="w-4 h-4 mr-2 text-gray-500" />
              Filter Options
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="roleFilter" className="block text-xs font-medium text-gray-600 mb-1">Filter by Role</label>
                <select
                  id="roleFilter"
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white disabled:bg-gray-100 capitalize"
                  disabled={loading || userRoles.length === 0}
                >
                  <option value="">All Roles</option>
                  {uniqueRolesForFilter.map(role => (
                    <option key={role} value={role} className="capitalize">{role}</option>
                  ))}
                </select>
              </div>
              {selectedRoleFilter && (
                 <div className="mt-2 md:mt-0">
                    <button
                       onClick={() => setSelectedRoleFilter("")}
                       className="w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                       Reset Filter
                    </button>
                  </div>
               )}
            </div>
          </div>
        </motion.div>

        {/* Loading Indicator */}
         {loading && (
            <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow border border-gray-200 mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600 font-medium">Loading User Data...</span>
            </div>
        )}

        {/* Content Grid (Chart & Details) */}
         {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden h-full border border-gray-200 flex flex-col"
                >
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-base font-semibold text-gray-700 flex items-center">
                            <PieChartIcon className="w-4 h-4 mr-2 text-blue-600" />
                            User Distribution
                        </h2>
                    </div>
                    <div className="p-5 flex-grow flex items-center justify-center min-h-[300px]">
                        {!userRoles || userRoles.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="flex justify-center mb-4"><div className="bg-blue-100 p-4 rounded-full"><UsersIcon className="h-10 w-10 text-blue-500" /></div></div>
                                <h3 className="text-lg font-medium text-gray-600">No Data Available</h3>
                                <p className="text-gray-500 text-sm mt-1">No user role data found.</p>
                            </div>
                        ) : (
                            <div className="w-full h-80">
                                <Pie data={chartData} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, boxWidth: 12, usePointStyle: true } },
                                        title: { display: true, text: `Total Users: ${totalUsers}`, font: { size: 14, weight: '600' }, padding: { top: 0, bottom: 15 } },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.75)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4,
                                            callbacks: { label: (ctx) => `${ctx.label || ''}: ${ctx.raw || 0} (${totalUsers > 0 ? ((ctx.raw / totalUsers) * 100).toFixed(1) : 0}%)` }
                                        }
                                    },
                                    animation: { animateScale: true, animateRotate: true }
                                }} />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Role Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                >
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-base font-semibold text-gray-700 flex items-center">
                            <ClipboardListIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Role Details {selectedRoleFilter && <span className="ml-2 text-sm text-blue-600 font-medium capitalize">- {selectedRoleFilter}</span>}
                        </h2>
                    </div>
                    <div className="p-5">
                        {filteredRoles.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="flex justify-center mb-4"><div className="bg-indigo-100 p-4 rounded-full">{selectedRoleFilter ? <UserIcon className="h-10 w-10 text-indigo-500" /> : <FilterIcon className="h-10 w-10 text-indigo-500" />}</div></div>
                                <h3 className="text-lg font-medium text-gray-600">{selectedRoleFilter ? `No users found with role '${selectedRoleFilter}'` : "No Roles Found"}</h3>
                                <p className="text-gray-500 text-sm mt-1">{selectedRoleFilter ? "There are currently no users assigned this role." : "Select a filter or check if data is available."}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredRoles.map((roleData) => {
                                    const roleColor = getRoleColor(roleData.role);
                                    const isExpanded = expandedRole === roleData.role;
                                    return (
                                        <motion.div
                                            key={roleData.role} layout
                                            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
                                        >
                                            <div
                                                className="bg-gray-50 hover:bg-gray-100 p-3 flex justify-between items-center cursor-pointer transition-colors"
                                                onClick={() => toggleRoleExpansion(roleData.role)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`${roleColor.bg} p-1.5 rounded-md flex-shrink-0`}><UserIcon className={`w-4 h-4 ${roleColor.text}`} /></div>
                                                    <h3 className="font-medium text-gray-800 capitalize text-sm">{roleData.role}</h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`${roleColor.bg} ${roleColor.text} px-2 py-0.5 rounded-full text-xs font-semibold`}>{roleData.count} {parseInt(roleData.count) === 1 ? 'user' : 'users'}</span>
                                                    <button className="text-gray-400 hover:text-gray-600"><ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} /></button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-200">
                                                    <div className="p-3">
                                                        {(!roleData.user_details || roleData.user_details.length === 0) ? (
                                                            <p className="text-center text-sm text-gray-500 py-4">No detailed user data available for this role.</p>
                                                        ) : (
                                                            <div className="overflow-x-auto max-h-60 rounded-md border border-gray-200 bg-white">
                                                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                                                    <thead className="bg-gray-100 sticky top-0 z-10"><tr>
                                                                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                                        <th scope="col" className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                                                                    </tr></thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {roleData.user_details.map((user, index) => (
                                                                            <tr key={index} className="hover:bg-gray-50">
                                                                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{user.email || <span className="text-gray-400 italic">N/A</span>}</td>
                                                                                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{user.phone_number || <span className="text-gray-400 italic">N/A</span>}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Summary Table Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}
                    className="lg:col-span-3 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mt-6 lg:mt-0"
                >
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-base font-semibold text-gray-700">User Role Summary</h2>
                    </div>
                    <div className="p-5">
                        {userRoles.length === 0 ? (
                            <div className="text-center py-8"><p className="text-gray-500 text-sm">No summary data available.</p></div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-100"><tr>
                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Distribution</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {userRoles.map((roleData, index) => {
                                            const roleColor = getRoleColor(roleData.role);
                                            const count = parseInt(roleData.count || 0, 10);
                                            const percentage = totalUsers > 0 ? ((count / totalUsers) * 100) : 0;
                                            const chartColor = chartData.datasets[0].backgroundColor[index % chartData.datasets[0].backgroundColor.length];
                                            return (
                                                <tr key={roleData.role} className="hover:bg-gray-50">
                                                    <td className="py-2 px-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`${roleColor.bg} p-1 rounded-sm`}><UserIcon className={`w-3.5 h-3.5 ${roleColor.text}`} /></div>
                                                            <span className="font-medium text-gray-700 capitalize">{roleData.role}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-600 text-center font-medium">{count}</td>
                                                    <td className="py-2 px-3 text-gray-600 text-center font-medium">{percentage.toFixed(1)}%</td>
                                                    <td className="py-2 px-3">
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2" title={`${percentage.toFixed(1)}%`}>
                                                            <div className="h-1.5 sm:h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: chartColor }}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300"><tr>
                                        <td className="py-2 px-3 text-sm font-semibold text-gray-700">Total</td>
                                        <td className="py-2 px-3 text-sm font-semibold text-gray-700 text-center">{totalUsers}</td>
                                        <td className="py-2 px-3 text-sm font-semibold text-gray-700 text-center">100%</td>
                                        <td className="py-2 px-3"><div className="w-full bg-blue-200 rounded-full h-1.5 sm:h-2"><div className="bg-blue-600 h-1.5 sm:h-2 rounded-full w-full"></div></div></td>
                                    </tr></tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </div>

      {/* --- Add/Update User Modal (Combined) --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h2 className="text-lg font-semibold mb-5 text-gray-800">
             {modalMode === 'add' ? 'Add New User' : 'Update User Role'}
          </h2>

          {modalError && <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{modalError}</p>}
          {modalSuccess && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md border border-green-200">{modalSuccess}</p>}

          <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                  <input
                      type="email" id="email" name="email" value={formData.email}
                      onChange={handleModalInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm disabled:bg-gray-100"
                      placeholder="user@example.com" required
                      disabled={modalLoading || modalMode === 'update'}
                  />
                  {modalMode === 'update' && <p className="text-xs text-gray-500 mt-1">Email cannot be changed when updating role.</p>}
              </div>

              {/* Role Field */}
              <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      {modalMode === 'add' ? 'Assign Role' : 'New Role'}
                  </label>
                  <select
                      id="role" name="role" value={formData.role} onChange={handleModalInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white capitalize disabled:bg-gray-100"
                      required disabled={modalLoading}
                  >
                      {ALLOWED_ROLES_FOR_ASSIGNMENT.map(roleOption => (
                         <option key={roleOption} value={roleOption} className="capitalize">{roleOption}</option>
                      ))}
                  </select>
              </div>

              {/* Phone Number Field (Only for Add Mode) */}
              {modalMode === 'add' && (
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                    <div className="relative">
                         <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                         </span>
                         <input
                             type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber}
                             onChange={handleModalInputChange}
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm disabled:bg-gray-100"
                             placeholder="+1234567890"
                             disabled={modalLoading}
                         />
                     </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end pt-3 gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={modalLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-60">Cancel</button>
                  <button type="submit" disabled={modalLoading}
                      className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] ${modalMode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`} >
                      {modalLoading ? (<><svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>)
                       : (modalMode === 'add' ? 'Add User' : 'Update Role')}
                  </button>
              </div>
          </form>
      </Modal>
      {/* --- End Modal --- */}

    </div> // End Page Wrapper
  );
}