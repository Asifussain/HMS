"use client";

import { useEffect, useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import {
  BarChart3,
  PieChart,
  RefreshCw,
  Users,
  ClipboardList,
  Home,
  CheckCircle,
  ChevronLeft,
  Settings,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// ===== REUSABLE COMPONENTS =====

// Dashboard Header Component with Navigation Elements
const DashboardHeader = ({ onRefresh, isLoading }) => (
  <motion.header
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm"
  >
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link href="/admin" className="mr-4">
            <ChevronLeft className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />
          </Link>
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Hostel Management Insights</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:block">
            <div className="bg-gray-100 py-1 px-3 rounded-full text-sm text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isLoading}
            className={`bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg py-2 px-4 shadow-sm transition-colors flex items-center ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            aria-label="Refresh Data"
          >
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{
                repeat: isLoading ? Infinity : 0,
                duration: 1,
                ease: "linear",
              }}
              className="mr-2"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Refresh</span>
          </motion.button>
        </div>
      </div>
    </div>
  </motion.header>
);

// Hostel Selector Component with Additional Stats
const HostelSelector = ({
  hostels,
  selectedHostel,
  onChange,
  totalRooms,
  occupied,
  vacant,
}) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
    className="bg-white rounded-xl shadow-sm p-5 mb-6"
  >
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
      {/* Dropdown */}
      <div className="w-full lg:w-80">
        <label
          htmlFor="hostelSelect"
          className="block text-sm font-medium text-gray-600 mb-1.5"
        >
          Select Hostel Block
        </label>
        <select
          id="hostelSelect"
          value={selectedHostel}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition duration-200 ease-in-out"
        >
          {hostels.map((item) => (
            <option key={item.hostel_block} value={item.hostel_block}>
              {item.hostel_block} Hostel
            </option>
          ))}
        </select>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-4 w-full lg:w-auto">
        <div className="flex-1 min-w-[120px]">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Total Rooms</span>
              <Home className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalRooms}</p>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Occupied</span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700 mt-1">{occupied}</p>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Vacant</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700 mt-1">{vacant}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Chart Card Component with Improved Styling
const ChartCard = ({ title, icon: Icon, children, description = "" }) => (
  <motion.div
    initial={{ scale: 0.98, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
  >
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center">
        {Icon && <Icon className="w-5 h-5 text-blue-500 mr-3" />}
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
      </div>
      {description && (
        <span className="text-xs text-gray-500 hidden sm:inline">{description}</span>
      )}
    </div>
    <div className="p-5">{children}</div>
  </motion.div>
);

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, icon: Icon, color = "text-gray-800", bgColor = "bg-white", isPercentage = false }) => (
  <motion.div
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
    className={`${bgColor} rounded-xl shadow-sm p-5 border border-gray-100`}
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>
          {value}{isPercentage ? "%" : ""}
        </p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
      {Icon && <div className={`${color.replace("text", "bg").replace("600", "100")} p-3 rounded-lg`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>}
    </div>
  </motion.div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen flex items-center justify-center bg-gray-50"
  >
    <div className="flex flex-col items-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: 360,
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 0.1,
        }}
        className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500"
      />
      <p className="mt-5 text-lg font-medium text-gray-600">Loading Dashboard Data...</p>
      <p className="text-sm text-gray-400">Please wait while we fetch the latest information</p>
    </div>
  </motion.div>
);

// ===== MAIN DASHBOARD COMPONENT =====

export default function AnalyticsDashboard() {
  const [occupancyData, setOccupancyData] = useState(null);
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validHostels = ["CVR", "APJ", "VSB", "DA"]; // Keep only valid hostels
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState("");

  // Fetch data function
  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }
      const data = await res.json();

      setOccupancyData(data.occupancy);
      setComplaintData(data.complaints);

      // Filter occupancy data for valid hostel names
      if (data.occupancy?.hostels) {
        const filtered = data.occupancy.hostels.filter((item) =>
          validHostels.includes(item.hostel_block)
        );
        setFilteredHostels(filtered);
        
        if (filtered.length > 0 && (!selectedHostel || !filtered.some(h => h.hostel_block === selectedHostel))) {
          setSelectedHostel(filtered[0].hostel_block);
        } else if (filtered.length === 0) {
          setSelectedHostel("");
        }
      } else {
        setFilteredHostels([]);
        setSelectedHostel("");
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch data on initial mount
  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate data for the selected hostel
  const selectedHostelData = filteredHostels.find(
    (item) => item.hostel_block === selectedHostel
  );

  const totalRoomsPerHostel = 20; // Assuming 20 rooms per hostel
  const occupiedRooms = selectedHostelData
    ? parseInt(selectedHostelData.occupied, 10)
    : 0;
  const vacantRooms = selectedHostelData ? totalRoomsPerHostel - occupiedRooms : totalRoomsPerHostel;

  // Chart Data Preparation with Enhanced Colors
  const occupancyChartData = {
    labels: ["Occupied", "Vacant"],
    datasets: [
      {
        label: "Room Status",
        data: [occupiedRooms, vacantRooms],
        backgroundColor: ["#10b981", "#ef4444"], // Modern green for occupied, red for vacant
        hoverBackgroundColor: ["#059669", "#dc2626"],
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const complaintChartData = {
    labels: ["Pending", "In Progress", "Resolved"],
    datasets: [
      {
        label: "Complaints",
        data: [
          complaintData?.pending ?? 0,
          complaintData?.["in progress"] ?? 0,
          complaintData?.completed ?? 0,
        ],
        backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"], // Amber, Blue, Green
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  };

  // Chart Options with More Modern Styling
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%", // Make the doughnut thinner
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          boxWidth: 12,
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: 12,
        bodyFont: { size: 13 },
        bodySpacing: 6,
        boxPadding: 6,
        callbacks: {
          label: function (context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
              
              // Add percentage calculation
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              if (total > 0) {
                const percentage = Math.round((context.parsed / total) * 100);
                label += ` (${percentage}%)`;
              }
            }
            return label;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        boxPadding: 6,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          precision: 0, 
          stepSize: 1,
          font: { size: 12 },
        },
        grid: {
          color: "#f3f4f6", // Lighter grid lines
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 12 },
        }
      },
    },
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    }
  };

  // Calculations for Summary Cards
  const totalComplaints = (complaintData?.pending ?? 0) + (complaintData?.["in progress"] ?? 0) + (complaintData?.completed ?? 0);
  const resolvedComplaints = complaintData?.completed ?? 0;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
  const totalSystemRooms = filteredHostels.length * totalRoomsPerHostel;
  const totalOccupiedSystemWide = filteredHostels.reduce((sum, hostel) => sum + parseInt(hostel.occupied, 10), 0);
  const overallOccupancyRate = totalSystemRooms > 0 ? Math.round((totalOccupiedSystemWide / totalSystemRooms) * 100) : 0;

  // Handle loading and error states
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-red-700">Data Retrieval Error</h2>
        <p className="mb-4 text-red-600 text-center max-w-md">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg transition duration-200 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onRefresh={fetchAnalytics} isLoading={loading} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <SummaryCard
            title="Occupancy Rate"
            value={overallOccupancyRate}
            isPercentage={true}
            subtitle="System-wide occupancy percentage"
            icon={TrendingUp}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <SummaryCard
            title="Total Complaints"
            value={totalComplaints}
            subtitle="Across all hostels"
            icon={ClipboardList}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <SummaryCard
            title="Resolution Rate"
            value={resolutionRate}
            isPercentage={true}
            subtitle="Complaints resolved successfully"
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <SummaryCard
            title="Total Rooms"
            value={totalSystemRooms}
            subtitle="Across monitored hostels"
            icon={Home}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
        </motion.div>

        {/* Hostel Selector */}
        <HostelSelector
          hostels={filteredHostels}
          selectedHostel={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
          totalRooms={totalRoomsPerHostel}
          occupied={occupiedRooms}
          vacant={vacantRooms}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard 
            title={`${selectedHostel} Hostel Occupancy`} 
            icon={PieChart} 
            description="Room allocation status"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedHostel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-72 relative"
              >
                {selectedHostelData ? (
                  <Doughnut data={occupancyChartData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-gray-500">No data available for this hostel.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Quick stats for the Doughnut chart */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-green-700 font-medium">Occupied</p>
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-800">{occupiedRooms}</p>
                {totalRoomsPerHostel > 0 && 
                  <p className="text-xs text-green-600 mt-1">
                    {Math.round((occupiedRooms/totalRoomsPerHostel)*100)}% of capacity
                  </p>
                }
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-red-700 font-medium">Vacant</p>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-800">{vacantRooms}</p>
                {totalRoomsPerHostel > 0 && 
                  <p className="text-xs text-red-600 mt-1">
                    {Math.round((vacantRooms/totalRoomsPerHostel)*100)}% of capacity
                  </p>
                }
              </div>
            </div>
          </ChartCard>

          <ChartCard 
            title="Complaint Status" 
            icon={BarChart3} 
            description="All hostel maintenance requests"
          >
            <div className="h-72 relative">
              <Bar data={complaintChartData} options={barOptions} />
            </div>
            
            {/* Quick stats for the Bar chart */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-amber-700">Pending</p>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                </div>
                <p className="text-xl font-bold text-amber-800">{complaintData?.pending ?? 0}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-blue-700">In Progress</p>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
                <p className="text-xl font-bold text-blue-800">{complaintData?.["in progress"] ?? 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-green-700">Resolved</p>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
                <p className="text-xl font-bold text-green-800">{resolvedComplaints}</p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Additional Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
            Hostel Performance Overview
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel Block</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vacant</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHostels.map((hostel) => {
                  const occupied = parseInt(hostel.occupied, 10);
                  const vacant = totalRoomsPerHostel - occupied;
                  const rate = Math.round((occupied / totalRoomsPerHostel) * 100);
                  
                  return (
                    <tr key={hostel.hostel_block} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{hostel.hostel_block}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{totalRoomsPerHostel}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{occupied}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">{vacant}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${rate > 75 ? 'bg-green-500' : rate > 50 ? 'bg-blue-500' : rate > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-5 text-gray-500 text-sm border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4">
          <p>Hostel Management Analytics Dashboard &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}