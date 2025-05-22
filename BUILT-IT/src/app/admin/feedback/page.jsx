"use client";
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
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
  PaperclipIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  BarChart4Icon, 
  FilterIcon,
  MessageSquareIcon,
  ChevronRightIcon
} from "lucide-react";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dropdown states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHostel, setSelectedHostel] = useState("");
  const [activeFeedback, setActiveFeedback] = useState(null);

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/feedback");
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setFeedbacks(data);
        }
      } catch (error) {
        setError(error?.message || "Failed to fetch feedback data");
      } finally {
        setLoading(false);
      }
    }
    fetchFeedbacks();
  }, []);

  // Filter feedbacks by month, year, and hostel
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const feedbackDate = new Date(fb.created_at);
    const matchesMonth = feedbackDate.getMonth() + 1 === selectedMonth;
    const matchesYear = feedbackDate.getFullYear() === selectedYear;
    const matchesHostel = selectedHostel ? fb.hostel_block === selectedHostel : true;
    return matchesMonth && matchesYear && matchesHostel;
  });

  // Get unique hostel values from feedbacks
  const uniqueHostels = Array.from(
    new Set(feedbacks.map((fb) => fb.hostel_block).filter(Boolean))
  );

  // Group feedback by week (using the feedback_week field, e.g. "Week 1")
  const grouped = filteredFeedbacks.reduce((acc, fb) => {
    const week = fb.feedback_week || "Unknown";
    if (!acc[week]) {
      acc[week] = { count: 0, infra: 0, technical: 0, cleanliness: 0, overall: 0 };
    }
    acc[week].count += 1;
    acc[week].infra += parseFloat(fb.infra_rating) || 0;
    acc[week].technical += parseFloat(fb.technical_rating) || 0;
    acc[week].cleanliness += parseFloat(fb.cleanliness_rating) || 0;
    acc[week].overall += parseFloat(fb.overall_rating) || 0;
    return acc;
  }, {});

  // Sort weeks (assuming the week label format is "Week X")
  const weeks = Object.keys(grouped).sort((a, b) => {
    // Handle "Unknown" week
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    
    // Extract numbers from week labels
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });

  // Calculate averages safely (prevent division by zero)
  const safeAverage = (total, count) => {
    return count > 0 ? (total / count).toFixed(1) : "0.0";
  };

  const infraAverages = weeks.map(w => safeAverage(grouped[w].infra, grouped[w].count));
  const technicalAverages = weeks.map(w => safeAverage(grouped[w].technical, grouped[w].count));
  const cleanlinessAverages = weeks.map(w => safeAverage(grouped[w].cleanliness, grouped[w].count));
  const overallAverages = weeks.map(w => safeAverage(grouped[w].overall, grouped[w].count));

  const chartData = {
    labels: weeks,
    datasets: [
      { 
        label: "Infrastructure", 
        data: infraAverages, 
        backgroundColor: "rgba(37, 99, 235, 0.7)",
        borderColor: "rgb(37, 99, 235)",
        borderWidth: 1
      },
      { 
        label: "Technical", 
        data: technicalAverages, 
        backgroundColor: "rgba(168, 85, 247, 0.7)",
        borderColor: "rgb(168, 85, 247)",
        borderWidth: 1
      },
      { 
        label: "Cleanliness", 
        data: cleanlinessAverages, 
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1
      },
      { 
        label: "Overall", 
        data: overallAverages, 
        backgroundColor: "rgba(236, 72, 153, 0.7)",
        borderColor: "rgb(236, 72, 153)",
        borderWidth: 1
      },
    ],
  };

  const getRatingBadge = (rating) => {
    const numRating = parseFloat(rating) || 0;
    if (numRating >= 4) {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">{numRating}</span>
    } else if (numRating >= 3) {
      return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">{numRating}</span>
    } else if (numRating >= 2) {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">{numRating}</span>
    } else {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">{numRating}</span>
    }
  }

  // Get stats for KPI cards
  const getAverageForCategory = (category) => {
    if (!filteredFeedbacks.length) return 0;
    
    const sum = filteredFeedbacks.reduce((acc, fb) => {
      return acc + (parseFloat(fb[category]) || 0);
    }, 0);
    
    return (sum / filteredFeedbacks.length).toFixed(1);
  };

  const stats = [
    {
      title: "Overall Rating",
      value: getAverageForCategory("overall_rating"),
      icon: <BarChart4Icon className="w-6 h-6" />,
      color: "from-green-500 to-green-700",
      bgGradient: "from-green-50 to-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Infrastructure",
      value: getAverageForCategory("infra_rating"),
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: "from-blue-500 to-blue-700",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Technical",
      value: getAverageForCategory("technical_rating"),
      icon: <ClockIcon className="w-6 h-6" />,
      color: "from-purple-500 to-purple-700",
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Cleanliness",
      value: getAverageForCategory("cleanliness_rating"),
      icon: <PaperclipIcon className="w-6 h-6" />,
      color: "from-pink-500 to-pink-700",
      bgGradient: "from-pink-50 to-pink-100",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600"
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-red-200 rounded-xl p-6 max-w-lg w-full shadow-xl"
        >
          <h2 className="text-red-700 text-xl font-bold flex items-center">
            <XCircleIcon className="w-6 h-6 mr-2" />
            An error occurred
          </h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-40 bg-gray-200 rounded mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <MessageSquareIcon className="mr-3 w-7 h-7 text-pink-600" />
            Feedback Management
          </h1>
          <p className="mt-1 text-gray-600 max-w-2xl">
            Monitor and analyze student feedback across different hostels and time periods
          </p>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className={`bg-gradient-to-br ${stat.bgGradient} border border-gray-200 rounded-xl shadow-lg overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-xl shadow-md`}>
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-gray-800">{stat.value}</div>
                </div>
                <div className="flex justify-between items-end">
                  <h2 className="text-lg font-semibold text-gray-800">{stat.title}</h2>
                  <div className="text-xs text-gray-500">
                    {filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'response' : 'responses'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Options */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-5 flex items-center border-b border-gray-200">
            <FilterIcon className="w-5 h-5 mr-2 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Filter Options</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Month",
                  value: selectedMonth,
                  onChange: (e) => setSelectedMonth(parseInt(e.target.value)),
                  options: Array.from({ length: 12 }, (_, i) => ({
                    value: i + 1,
                    label: new Date(0, i).toLocaleString("default", { month: "long" })
                  }))
                },
                {
                  label: "Year",
                  value: selectedYear,
                  onChange: (e) => setSelectedYear(parseInt(e.target.value)),
                  options: Array.from({ length: 5 }, (_, i) => ({
                    value: new Date().getFullYear() - i,
                    label: new Date().getFullYear() - i
                  }))
                },
                {
                  label: "Hostel Block",
                  value: selectedHostel,
                  onChange: (e) => setSelectedHostel(e.target.value),
                  options: [
                    { value: "", label: "All Hostels" },
                    ...uniqueHostels.map(hostel => ({ value: hostel, label: hostel }))
                  ]
                }
              ].map((filter, index) => (
                <div key={filter.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={filter.onChange}
                    className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Weekly Ratings Overview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden h-full">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 flex items-center border-b border-gray-200">
                <BarChart4Icon className="w-5 h-5 mr-2 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Weekly Ratings Overview</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-t-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
                  </div>
                ) : weeks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-medium text-gray-700">No data available</h3>
                    <p className="text-gray-500 mt-2">No feedback found for the selected filters.</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <Bar 
                      data={chartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              font: {
                                family: 'Inter, system-ui, sans-serif',
                                size: 11
                              },
                              boxWidth: 15,
                              padding: 15
                            }
                          },
                          title: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#1f2937',
                            bodyColor: '#1f2937',
                            bodyFont: {
                              family: 'Inter, system-ui, sans-serif'
                            },
                            titleFont: {
                              family: 'Inter, system-ui, sans-serif',
                              weight: 'bold'
                            },
                            padding: 12,
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            callbacks: {
                              title: (tooltipItems) => {
                                return tooltipItems[0].label;
                              },
                              label: (context) => {
                                return `${context.dataset.label}: ${context.formattedValue}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                              stepSize: 1,
                              font: {
                                family: 'Inter, system-ui, sans-serif'
                              }
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            }
                          },
                          x: {
                            ticks: {
                              font: {
                                family: 'Inter, system-ui, sans-serif'
                              }
                            },
                            grid: {
                              display: false
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Feedback Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-5 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center">
                  <MessageSquareIcon className="w-5 h-5 mr-2 text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Feedback Details</h2>
                </div>
                <span className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-medium">
                  {filteredFeedbacks.length} items
                </span>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    <LoadingSkeleton />
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-xl font-medium text-gray-700">No feedback found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters to see more results.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Mobile card view for small screens */}
                    <div className="block md:hidden space-y-4">
                      {filteredFeedbacks.map((fb, index) => (
                        <motion.div 
                          key={fb.feedback_id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-md"
                        >
                          <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
                            <div>
                              <span className="font-medium text-gray-800">{fb.hostel_block || "Unknown"}</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-sm text-gray-500">{fb.feedback_week || "Unknown"}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(fb.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="whitespace-pre-wrap text-sm text-gray-700 mb-4">{fb.feedback_text}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                                <span className="text-xs font-medium text-blue-800">Infra:</span>
                                {getRatingBadge(fb.infra_rating)}
                              </div>
                              <div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                                <span className="text-xs font-medium text-purple-800">Technical:</span>
                                {getRatingBadge(fb.technical_rating)}
                              </div>
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                                <span className="text-xs font-medium text-green-800">Clean:</span>
                                {getRatingBadge(fb.cleanliness_rating)}
                              </div>
                              <div className="flex items-center justify-between bg-pink-50 p-2 rounded-lg">
                                <span className="text-xs font-medium text-pink-800">Overall:</span>
                                {getRatingBadge(fb.overall_rating)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Table view for larger screens */}
                    <table className="w-full hidden md:table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredFeedbacks.map((fb, index) => (
                          <motion.tr 
                            key={fb.feedback_id || index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03, duration: 0.3 }}
                            whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
                            className="cursor-pointer group"
                            onClick={() => setActiveFeedback(activeFeedback === index ? null : index)}
                          >
                            <td className="py-4 px-4 text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600 transition-colors">
                                  <ChevronRightIcon className={`w-5 h-5 transform transition-transform ${activeFeedback === index ? 'rotate-90' : ''}`} />
                                </div>
                                <p className={`whitespace-pre-wrap ml-2 ${activeFeedback === index ? '' : 'line-clamp-2'}`}>
                                  {fb.feedback_text}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="flex items-center w-full bg-blue-50 p-1 rounded-md">
                                  <span className="w-20 text-xs font-medium text-blue-800">Infra:</span>
                                  {getRatingBadge(fb.infra_rating)}
                                </div>
                                <div className="flex items-center w-full bg-purple-50 p-1 rounded-md">
                                  <span className="w-20 text-xs font-medium text-purple-800">Technical:</span>
                                  {getRatingBadge(fb.technical_rating)}
                                </div>
                                <div className="flex items-center w-full bg-green-50 p-1 rounded-md">
                                  <span className="w-20 text-xs font-medium text-green-800">Clean:</span>
                                  {getRatingBadge(fb.cleanliness_rating)}
                                </div>
                                <div className="flex items-center w-full bg-pink-50 p-1 rounded-md">
                                  <span className="w-20 text-xs font-medium text-pink-800">Overall:</span>
                                  {getRatingBadge(fb.overall_rating)}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-700">{fb.feedback_week || "Unknown"}</td>
                            <td className="py-4 px-4 text-sm font-medium text-gray-700">{fb.hostel_block || "Unknown"}</td>
                            <td className="py-4 px-4 text-sm text-gray-700">
                              {new Date(fb.created_at).toLocaleDateString()}
                              <div className="text-xs text-gray-500">
                                {new Date(fb.created_at).toLocaleTimeString()}
                              </div>
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
        </div>
        
        {/* Footer with information */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-center text-gray-500 text-sm border-t border-gray-200 pt-6"
        >
          <p>Feedback Dashboard v2.0 | Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-1">Total feedbacks: {feedbacks.length} | Filtered results: {filteredFeedbacks.length}</p>
        </motion.div>
      </div>
    </div>
  );
}