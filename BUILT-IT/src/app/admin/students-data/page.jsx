"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileDownIcon, SearchIcon, UserIcon, ChevronRightIcon, FilterIcon, XIcon,
  BarChartIcon, ListIcon, // Added ListIcon for toggle
} from "lucide-react";

// --- Chart.js Integration ---
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors,
} from 'chart.js';

// Register Chart.js components
ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Colors );


// --- Color Palette for Charts --- (Added Gender)
const chartColorPalette = {
    "By Batch":     { background: 'rgba(59, 130, 246, 0.6)', border: 'rgba(59, 130, 246, 1)' },      // Blue
    "By Department":{ background: 'rgba(26, 188, 156, 0.6)', border: 'rgba(26, 188, 156, 1)' },    // Green
    "By Degree":    { background: 'rgba(241, 196, 15, 0.7)', border: 'rgba(241, 196, 15, 1)' },     // Yellow
    "By Hostel":    { background: 'rgba(155, 89, 182, 0.6)', border: 'rgba(155, 89, 182, 1)' },    // Purple
    "By Gender":    { background: 'rgba(231, 76, 60, 0.6)', border: 'rgba(231, 76, 60, 1)' },      // Red (Added)
};
// --- End Color Palette ---

export default function StudentsData() {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [analyticsViewMode, setAnalyticsViewMode] = useState('chart'); // Default to chart view

  // --- STYLING CONSTANTS ---
  const bgClass = "bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800";
  const cardBg = "bg-white border border-slate-200/80";
  const textColors = { title: "text-slate-800", description: "text-slate-600", details: "text-slate-700" };
  const inputStyle = "w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-sm";
  const buttonBaseStyle = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";
  const primaryButtonStyle = `${buttonBaseStyle} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed`;
  const secondaryButtonStyle = `${buttonBaseStyle} bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400`;
  const dangerButtonStyle = `${buttonBaseStyle} bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500`;
  const iconButtonStyle = `${buttonBaseStyle} bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-400 !p-2`; // For toggle button

  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        // Make sure your API returns fields including:
        // student_id, roll_no, full_name, department, Degree, batch, hostel_block, gender
        const res = await fetch("/api/admin/students"); // Replace with your actual API endpoint
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        // Removed fake data simulation
        setStudents(data || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // --- MEMOIZED CALCULATIONS (Including Gender) ---
  const uniqueBatches = useMemo(() => Array.from(new Set(students.map((s) => s.batch))).sort((a, b) => b - a), [students]);
  const uniqueDepts = useMemo(() => Array.from(new Set(students.map((s) => s.department))).sort(), [students]);
  const uniqueDegrees = useMemo(() => Array.from(new Set(students.map((s) => s.Degree))).filter(Boolean).sort(), [students]); // Filter out null/empty degrees
  const uniqueHostels = useMemo(() => Array.from(new Set(students.map((s) => s.hostel_block))).filter(Boolean).sort(), [students]); // Filter out null/empty hostels

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      (!batchFilter || student.batch?.toString() === batchFilter) &&
      (!deptFilter || student.department === deptFilter) &&
      (!degreeFilter || student.Degree === degreeFilter) &&
      (!hostelFilter || student.hostel_block === hostelFilter) &&
      (!searchTerm ||
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, batchFilter, deptFilter, degreeFilter, hostelFilter, searchTerm]);

  const analyticsData = useMemo(() => {
    if (!students || students.length === 0) {
      return { total: 0, byBatch: {}, byDept: {}, byDegree: {}, byHostel: {}, byGender: {} };
    }
    // Helper to count occurrences, handling potential null/undefined keys
    const countReducer = (keyExtractor, defaultValue = 'Not Specified') => (acc, s) => {
      const key = keyExtractor(s) || defaultValue; // Use defaultValue if key is null/undefined
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    };
    return {
      total: students.length,
      byBatch: students.reduce(countReducer(s => s.batch), {}),
      byDept: students.reduce(countReducer(s => s.department), {}),
      byDegree: students.reduce(countReducer(s => s.Degree), {}), // Handles null Degree
      byHostel: students.reduce(countReducer(s => s.hostel_block), {}), // Handles null hostel_block
      byGender: students.reduce(countReducer(s => s.gender), {}), // Handles null gender
    };
  }, [students]);

  // --- HELPER FUNCTIONS ---
  const resetFilters = () => {
    setBatchFilter(""); setDeptFilter(""); setDegreeFilter(""); setHostelFilter(""); setSearchTerm(""); setShowFilters(false);
  };

  const downloadPDF = () => {
    // Removed "Room No" from columns
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(44, 62, 80); doc.text("Students Data Report", 14, 22);
    doc.setFontSize(10); doc.setTextColor(127, 140, 141); doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);

    let filterInfo = [
      batchFilter && `Batch: ${batchFilter}`, deptFilter && `Dept: ${deptFilter}`,
      degreeFilter && `Degree: ${degreeFilter}`, hostelFilter && `Hostel: ${hostelFilter}`,
      searchTerm && `Search: "${searchTerm}"`
    ].filter(Boolean).join(" | ");
    let tableStartY = 36;
    if (filterInfo) {
      doc.setFontSize(9); doc.setTextColor(100); doc.text(`Active Filters: ${filterInfo}`, 14, 36);
      tableStartY = 42;
    }

    const tableColumn = ["Roll No", "Full Name", "Department", "Degree", "Batch", "Hostel Block"]; // Removed "Room No"
    const tableRows = filteredStudents.map(student => [
      student.roll_no || "-", student.full_name || "-", student.department || "-",
      student.Degree || "-", student.batch || "-", student.hostel_block || "-", // Removed room_number reference
    ]);

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: tableStartY,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] }, theme: 'striped', margin: { top: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
    doc.save(`students_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Renders a LIST section in the Analytics Panel
  const renderAnalyticsListSection = (title, data) => (
    <div className="mb-4"> {/* Added margin bottom */}
      <h3 className="text-base font-semibold mb-2 text-slate-700">{title}</h3>
      <ul className="space-y-1.5 text-sm pr-2 border-l-2 border-slate-200 pl-3">
        {Object.entries(data)
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([key, count]) => (
            <li key={key} className="flex justify-between items-center text-xs hover:bg-slate-50 rounded px-1.5 py-1">
              <span className="text-slate-700 truncate mr-2" title={key}>{key}:</span>
              <span className="font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs">{count}</span>
            </li>
          ))}
        {Object.keys(data).length === 0 && <li className="text-slate-500 text-xs italic px-1.5 py-1">No data</li>}
      </ul>
    </div>
  );

  // --- CHART Options and Rendering (Percentage Scale & Colors) ---
  const getChartOptions = (totalStudents) => ({
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    scales: {
        x: {
            beginAtZero: true, max: totalStudents > 0 ? 1 : 0, grid: { display: false },
            ticks: {
                font: { size: 10 },
                callback: value => (value >= 0 && value <= 1) ? `${(value * 100).toFixed(0)}%` : value
            }
        },
        y: { grid: { color: '#e2e8f0' }, ticks: { font: { size: 10 } } }
    },
    plugins: {
      legend: { display: false },
      title: { display: true, font: { size: 14, weight: '600' }, padding: { bottom: 15 } },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10,
        callbacks: {
           label: function(context) {
               const percentage = context.raw * 100;
               const count = context.dataset.counts[context.dataIndex]; // Get original count
               return `${context.label}: ${count} (${percentage.toFixed(1)}%)`;
           }
        }
      },
      colors: { enabled: true, forceOverride: false },
    },
    onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'; },
  });

  // Renders a CHART section in the Analytics Panel
  const renderAnalyticsChartSection = (title, data, totalStudents) => {
    const colorConfig = chartColorPalette[title] || { background: 'rgba(100, 116, 139, 0.6)', border: 'rgba(100, 116, 139, 1)' };
    const labels = Object.keys(data).sort((a, b) => data[b] - data[a]);
    const counts = labels.map(label => data[label]);
    const percentageData = counts.map(count => totalStudents > 0 ? count / totalStudents : 0);

    const chartData = {
        labels: labels,
        datasets: [{
            label: title, data: percentageData, counts: counts, // Store counts for tooltip
            backgroundColor: colorConfig.background, borderColor: colorConfig.border,
            borderWidth: 1, borderRadius: 3, barPercentage: 0.75, categoryPercentage: 0.7,
        }]
    };

    const specificChartOptions = {
        ...getChartOptions(totalStudents),
        plugins: { ...getChartOptions(totalStudents).plugins, title: { ...getChartOptions(totalStudents).plugins.title, text: title } }
    };
   // Estimate height based on number of labels + base height
   const estimatedHeight = Math.max(120, labels.length * 28 + 60);

    return (
       <div style={{ height: `${estimatedHeight}px`, marginBottom: '25px', position: 'relative' }}>
          {labels.length > 0 ? ( <Bar options={specificChartOptions} data={chartData} /> ) : (
              <div className="flex items-center justify-center h-full"><p className="text-slate-500 text-sm italic">No data for {title}</p></div>
          )}
       </div>
    );
  };
  // --- End Chart Component Updates ---

  // --- ANIMATION VARIANTS ---
  const loadingVariants = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1, transition: { duration: 0.7, type: "spring", stiffness: 100, damping: 15 } } };
  const rowVariants = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, type: "spring", stiffness: 100, damping: 15 } }, exit: { opacity: 0, x: 10, transition: { duration: 0.2 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] } } };
  const filterPanelVariants = { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } }, exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: "easeInOut" } } };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <motion.div {...loadingVariants} className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="flex flex-col items-center bg-white shadow-xl rounded-xl p-10">
          <motion.div animate={{ rotate: 360, transition: { repeat: Infinity, duration: 1, ease: "linear" } }} className="rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></motion.div>
          <h3 className="mt-6 text-xl font-semibold text-slate-700">Loading Student Data</h3>
          <p className="mt-2 text-slate-500">Please wait...</p>
        </div>
      </motion.div>
    );
  }

  const activeFiltersCount = [batchFilter, deptFilter, degreeFilter, hostelFilter].filter(Boolean).length;
  const showClearButton = activeFiltersCount > 0 || searchTerm;

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Sticky Header */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className={`${cardBg} shadow-md border-b border-slate-200/80 sticky top-0 z-30`}>
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${textColors.title}`}>Student Management</h1>
            <p className={`text-sm ${textColors.description} mt-0.5`}>
              {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} found
              <span className="ml-2 text-xs text-slate-400">(Total: {students.length})</span>
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03, y: -1, boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)" }} whileTap={{ scale: 0.97 }} onClick={downloadPDF} className={`${primaryButtonStyle} flex items-center`} disabled={filteredStudents.length === 0}>
            <FileDownIcon className="w-4 h-4 mr-2" />
            Export {filteredStudents.length > 0 ? `(${filteredStudents.length})` : 'Data'}
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 py-6 pb-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">

          {/* Left Column (Filters and Student List) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Search and Filter Section Card */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" className={`${cardBg} rounded-xl shadow-lg p-5 border`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div className="relative flex-grow">
                  <input type="text" placeholder="Search by name or roll number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={inputStyle} aria-label="Search students" />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  {searchTerm && ( <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors" aria-label="Clear search"> <XIcon className="h-4 w-4" /> </button> )}
                </div>
                <div className="flex space-x-2 justify-end flex-shrink-0">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowFilters(!showFilters)} className={`${secondaryButtonStyle} flex items-center whitespace-nowrap ${showFilters ? "bg-blue-100 !text-blue-700 ring-blue-500" : ""}`} aria-expanded={showFilters}>
                    <FilterIcon className="w-4 h-4 mr-1.5" /> Filters
                    {activeFiltersCount > 0 && ( <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"> {activeFiltersCount} </span> )}
                  </motion.button>
                  {showClearButton && ( <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={resetFilters} className={`${dangerButtonStyle} flex items-center whitespace-nowrap`} aria-label="Clear all filters and search"> <XIcon className="w-4 h-4 mr-1.5" /> Clear </motion.button> )}
                </div>
              </div>
              <AnimatePresence>
                {showFilters && (
                  <motion.div {...filterPanelVariants} className="overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-2 pt-4">
                      {[ // Filter options structure
                        { value: batchFilter, setter: setBatchFilter, options: uniqueBatches, label: "All Batches" },
                        { value: deptFilter, setter: setDeptFilter, options: uniqueDepts, label: "All Departments" },
                        { value: degreeFilter, setter: setDegreeFilter, options: uniqueDegrees, label: "All Degrees" },
                        { value: hostelFilter, setter: setHostelFilter, options: uniqueHostels, label: "All Hostels" },
                      ].map(filter => (
                        <select key={filter.label} value={filter.value} onChange={(e) => filter.setter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm bg-white shadow-sm appearance-none" aria-label={`Filter by ${filter.label.replace('All ', '')}`}>
                          <option value="">{filter.label}</option>
                          {filter.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Student List Display Card */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" className={`${cardBg} shadow-lg rounded-lg overflow-hidden border`}>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto relative">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {/* REMOVED "Room" header */}
                      {["Name", "Roll No", "Department", "Degree", "Batch", "Hostel", "Actions"].map(header => ( <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"> {header} </th> ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <AnimatePresence>
                      {filteredStudents.length > 0 && filteredStudents.map((student) => ( // Use student_id as key
                        <motion.tr
                             key={student.student_id} // Assuming student_id is always present and unique
                             variants={rowVariants} initial="initial" animate="animate" exit="exit"
                             className="hover:bg-sky-50/50 transition-colors duration-150"
                             layout
                        >
                          <td className="px-4 py-3 whitespace-nowrap flex items-center gap-3">
                             <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0"><UserIcon className="w-5 h-5 text-blue-600" /></div>
                             <span className="font-medium text-slate-800 truncate" title={student.full_name}>{student.full_name || '-'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500">{student.roll_no || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">{student.department || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">{student.Degree || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">{student.batch || '-'}</td>
                          {/* REMOVED Room Number TD */}
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">{student.hostel_block || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link href={`/admin/student-profile?rollNo=${student.roll_no}`} passHref legacyBehavior>
                              <motion.a whileHover={{ scale: 1.05, color: "#2563eb" }} whileTap={{ scale: 0.95 }} className="flex items-center text-blue-600 hover:text-blue-700 transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wide">
                                View <ChevronRightIcon className="w-3.5 h-3.5 ml-0.5" />
                              </motion.a>
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                <AnimatePresence>
                   {filteredStudents.length > 0 && filteredStudents.map((student) => ( // Use student_id as key
                    <motion.div
                        key={student.student_id} // Assuming student_id is always present and unique
                        variants={rowVariants} initial="initial" animate="animate" exit="exit"
                        className="p-4 hover:bg-slate-50 transition-colors" layout>
                      <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center min-w-0 mr-3 gap-3">
                            <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0"><UserIcon className="w-5 h-5 text-blue-600" /></div>
                            <div className="min-w-0">
                               <h3 className="font-semibold text-sm text-slate-800 truncate" title={student.full_name}>{student.full_name || '-'}</h3>
                               <p className="text-xs text-slate-500 truncate">{student.roll_no || '-'}</p>
                            </div>
                          </div>
                          <Link href={`/admin/student-profile?rollNo=${student.roll_no}`} passHref legacyBehavior>
                            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-blue-50 text-blue-600 p-2 rounded-lg inline-block cursor-pointer flex-shrink-0 hover:bg-blue-100 transition-colors" aria-label="View Profile">
                                <ChevronRightIcon className="w-4 h-4" />
                            </motion.a>
                          </Link>
                       </div>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-3 pt-3 border-t border-slate-100">
                         {[ // Fields for mobile view
                           { label: "Dept", value: student.department }, { label: "Degree", value: student.Degree },
                           { label: "Batch", value: student.batch },
                           // REMOVED Room Number row
                           { label: "Hostel", value: student.hostel_block, span: 2 }, // Hostel spans full width if others are missing
                         ].map(item => (item.value ? ( <div key={item.label} className={`${item.span === 2 ? 'col-span-2' : ''} truncate text-slate-700`}> <span className="text-slate-500 font-medium">{item.label}:</span> {item.value} </div> ) : null ))}
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* "No Results" Message */}
              {filteredStudents.length === 0 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center py-16 px-6 flex flex-col items-center">
                  <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="text-6xl mb-5 text-slate-400"> <SearchIcon strokeWidth={1.5}/> </motion.div>
                  <h3 className="text-lg font-semibold text-slate-700">No Students Found</h3>
                  <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto"> {showClearButton ? "Try adjusting your search or filter criteria." : "There is no student data matching your request."} </p>
                  {showClearButton && ( <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetFilters} className={`${primaryButtonStyle} mt-5 text-sm`}> Clear Filters & Search </motion.button> )}
                </motion.div>
              )}
            </motion.div>

          </div> {/* --- End Left Column --- */}

          {/* Right Column (Analytics Panel) */}
          <div className="lg:col-span-4 mt-6 lg:mt-0">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" className={`${cardBg} shadow-lg rounded-lg p-5 border sticky top-24`}>
              {/* Analytics Panel Header with View Toggle */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                   <h2 className="text-lg font-semibold text-slate-700 flex items-center">
                     {analyticsViewMode === 'chart' ? <BarChartIcon className="w-5 h-5 mr-2 text-blue-600" /> : <ListIcon className="w-5 h-5 mr-2 text-blue-600" />}
                     Analytics Overview
                   </h2>
                   {/* Toggle Button */}
                   <motion.button
                     whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                     onClick={() => setAnalyticsViewMode(prev => prev === 'list' ? 'chart' : 'list')}
                     className={`${iconButtonStyle} flex items-center`}
                     aria-label={analyticsViewMode === 'list' ? "Switch to Chart View" : "Switch to List View"}
                   >
                     {analyticsViewMode === 'list' ? <BarChartIcon className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                   </motion.button>
              </div>

              {/* Analytics Content (Conditional Rendering based on viewMode) */}
              {analyticsData.total > 0 ? (
                <>
                  {analyticsViewMode === 'chart' && (
                      <>
                        {renderAnalyticsChartSection("By Batch", analyticsData.byBatch, analyticsData.total)}
                        {renderAnalyticsChartSection("By Department", analyticsData.byDept, analyticsData.total)}
                        {renderAnalyticsChartSection("By Degree", analyticsData.byDegree, analyticsData.total)}
                        {renderAnalyticsChartSection("By Hostel", analyticsData.byHostel, analyticsData.total)}
                        {renderAnalyticsChartSection("By Gender", analyticsData.byGender, analyticsData.total)} {/* Added Gender Chart */}
                      </>
                  )}
                   {analyticsViewMode === 'list' && (
                      <>
                        {renderAnalyticsListSection("By Batch", analyticsData.byBatch)}
                        {renderAnalyticsListSection("By Department", analyticsData.byDept)}
                        {renderAnalyticsListSection("By Degree", analyticsData.byDegree)}
                        {renderAnalyticsListSection("By Hostel", analyticsData.byHostel)}
                        {renderAnalyticsListSection("By Gender", analyticsData.byGender)} {/* Added Gender List */}
                      </>
                  )}
                   {/* Display Total Students consistently */}
                   <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                        <p className="text-sm text-slate-500">Total Students Analyzed</p>
                        <p className="text-2xl font-bold text-slate-800">{analyticsData.total}</p>
                    </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BarChartIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" strokeWidth={1.5}/>
                  <p className="text-sm">No student data available for analysis.</p>
                </div>
              )}
            </motion.div>
          </div> {/* --- End Right Column --- */}

        </div> {/* --- End Grid --- */}
      </div> {/* --- End Main Content Area --- */}
    </div>
  );
}