"use client";
import { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Search, Filter, Home, Users, RefreshCw, XIcon } from "lucide-react";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusInfo() {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(""); // Batch year (string for select)
  const [selectedFloor, setSelectedFloor] = useState(""); // Floor number (string for select)
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // --- STYLING CONSTANTS ---
  const bgClass = "bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800";
  const cardBg = "bg-white border border-slate-200/80";
  const textColors = { title: "text-slate-800", description: "text-slate-600", details: "text-slate-700" };
  const inputStyle = "w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm shadow-sm bg-white";
  const selectStyle = "border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm bg-white shadow-sm appearance-none";
  const buttonBaseStyle = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1";
  const primaryButtonStyle = `${buttonBaseStyle} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed`;
  const secondaryButtonStyle = `${buttonBaseStyle} bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400`;
  const dangerButtonStyle = `${buttonBaseStyle} bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500`;

  // --- ANIMATION VARIANTS ---
  const loadingVariants = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1, transition: { duration: 0.7, type: "spring", stiffness: 100, damping: 15 } } };
  const rowVariants = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, type: "spring", stiffness: 100, damping: 15 } }, exit: { opacity: 0, x: 10, transition: { duration: 0.2 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] } } };
  const filterPanelVariants = { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } }, exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: "easeInOut" } } };


  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      setError("");
      try {
        // Ensure this API endpoint returns all required fields:
        // roll_no, full_name, department, batch, room_number, hostel_block,
        // fees_paid, email, in_status, Floor_no, Degree, gender
        const res = await fetch("/api/admin/students");
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        // Add basic validation or transformation if needed
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching student status:", err);
        setError(err.message || "Failed to load student data.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // --- MEMOIZED CALCULATIONS ---

  // Helper function to get unique, sorted values from a filtered list
  const getUniqueOptions = (key, filterFunc) => {
    return Array.from(
      new Set(
        students
          .filter(filterFunc) // Apply all *other* filters
          .map((s) => s[key])
          .filter(Boolean) // Remove null/undefined/empty values
      )
    ).sort((a, b) => {
      // Sort numerically if possible, otherwise alphabetically
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a).localeCompare(String(b));
    });
  };

  // Define filter predicates (functions that check if a student matches a filter)
  const hostelFilter = (student) => !selectedHostel || student.hostel_block === selectedHostel;
  const statusFilter = (student) => !selectedStatus || (selectedStatus === "inside" ? student.in_status : !student.in_status);
  const departmentFilter = (student) => !selectedDepartment || student.department === selectedDepartment;
  const batchFilter = (student) => !selectedBatch || student.batch?.toString() === selectedBatch;
  const floorFilter = (student) => !selectedFloor || student.Floor_no?.toString() === selectedFloor;
  const degreeFilter = (student) => !selectedDegree || student.Degree === selectedDegree;
  const genderFilter = (student) => !selectedGender || student.gender === selectedGender;
  const searchFilter = (student) => !searchQuery ||
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_no?.toLowerCase().includes(searchQuery.toLowerCase());

  // Calculate unique options dynamically based on *other* active filters
  const uniqueHostels = useMemo(() => getUniqueOptions('hostel_block', student =>
    statusFilter(student) && departmentFilter(student) && batchFilter(student)  && floorFilter(student) && degreeFilter(student) && genderFilter(student) && searchFilter(student)
  ), [students, selectedStatus, selectedDepartment, selectedBatch,  selectedFloor, selectedDegree, selectedGender, searchQuery]);

  const uniqueDepartments = useMemo(() => getUniqueOptions('department', student =>
    hostelFilter(student) && statusFilter(student) && batchFilter(student)  && floorFilter(student) && degreeFilter(student) && genderFilter(student) && searchFilter(student)
  ), [students, selectedHostel, selectedStatus, selectedBatch,  selectedFloor, selectedDegree, selectedGender, searchQuery]);

  const uniqueBatches = useMemo(() => getUniqueOptions('batch', student =>
    hostelFilter(student) && statusFilter(student) && departmentFilter(student) && floorFilter(student) && degreeFilter(student) && genderFilter(student) && searchFilter(student)
  ), [students, selectedHostel, selectedStatus, selectedDepartment,  selectedFloor, selectedDegree, selectedGender, searchQuery]);

  const uniqueFloors = useMemo(() => getUniqueOptions('Floor_no', student =>
    hostelFilter(student) && statusFilter(student) && departmentFilter(student) && batchFilter(student)  && degreeFilter(student) && genderFilter(student) && searchFilter(student)
  ), [students, selectedHostel, selectedStatus, selectedDepartment, selectedBatch,  selectedDegree, selectedGender, searchQuery]);

  const uniqueDegrees = useMemo(() => getUniqueOptions('Degree', student =>
    hostelFilter(student) && statusFilter(student) && departmentFilter(student) && batchFilter(student)  && floorFilter(student) && genderFilter(student) && searchFilter(student)
  ), [students, selectedHostel, selectedStatus, selectedDepartment, selectedBatch,  selectedFloor, selectedGender, searchQuery]);

  const uniqueGenders = useMemo(() => getUniqueOptions('gender', student =>
    hostelFilter(student) && statusFilter(student) && departmentFilter(student) && batchFilter(student)  && floorFilter(student) && degreeFilter(student) && searchFilter(student)
  ), [students, selectedHostel, selectedStatus, selectedDepartment, selectedBatch,  selectedFloor, selectedDegree, searchQuery]);


  // Apply ALL filters to get the final list
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      hostelFilter(student) &&
      statusFilter(student) &&
      departmentFilter(student) &&
      batchFilter(student) &&
      floorFilter(student) &&
      degreeFilter(student) &&
      genderFilter(student) &&
      searchFilter(student)
    );
  }, [students, selectedHostel, selectedStatus, selectedDepartment, selectedBatch,  selectedFloor, selectedDegree, selectedGender, searchQuery]); // Add all dependencies

  // Calculate counts for the Pie chart overview based on the final filtered list
  const insideCount = useMemo(() => filteredStudents.filter((s) => s.in_status).length, [filteredStudents]);
  const outsideCount = useMemo(() => filteredStudents.filter((s) => !s.in_status).length, [filteredStudents]);

  // Pie Chart Data & Options
  const pieData = useMemo(() => ({
    labels: ["Inside Hostel", "Outside Hostel"],
    datasets: [
      {
        data: [insideCount, outsideCount],
        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  }), [insideCount, outsideCount]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, boxWidth: 12, font: { size: 12 } } },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.75)', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10 }
    }
  }), []);

  // --- HELPER FUNCTIONS ---
  const resetFilters = () => {
    setSelectedHostel("");
    setSelectedStatus("");
    setSelectedDepartment("");
    setSelectedBatch("");
    setSelectedFloor("");
    setSelectedDegree("");
    setSelectedGender("");
    setSearchQuery("");
    // setShowFilters(false); // Optionally close filter panel on reset
  };

  // Active filters count for badge
  const activeFiltersCount = [
    selectedHostel, selectedStatus, selectedDepartment, selectedBatch,
     selectedFloor, selectedDegree, selectedGender
  ].filter(Boolean).length;

  const showClearButton = activeFiltersCount > 0 || searchQuery;

  // --- RENDER LOGIC ---
  if (loading && students.length === 0) { // Show loading only initially
    return (
      <motion.div {...loadingVariants} className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="flex flex-col items-center bg-white shadow-xl rounded-xl p-10">
          <motion.div animate={{ rotate: 360, transition: { repeat: Infinity, duration: 1, ease: "linear" } }} className="rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></motion.div>
          <h3 className="mt-6 text-xl font-semibold text-slate-700">Loading Student Status</h3>
          <p className="mt-2 text-slate-500">Please wait...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Sticky Header */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className={`${cardBg} shadow-md border-b border-slate-200/80 sticky top-0 z-30`}>
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${textColors.title}`}>Student Status Overview</h1>
            <p className={`text-sm ${textColors.description} mt-0.5`}>
              Real-time tracking of student location status
              <span className="ml-2 text-xs text-slate-400">
                (Showing: {filteredStudents.length} / Total: {students.length})
              </span>
            </p>
          </div>
          {/* Optional: Add an action button like Export if needed */}
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 py-6 pb-16">

        {/* Error Message Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-300 text-red-800 rounded-lg p-4 mb-6 shadow-sm"
            role="alert"
          >
            <h2 className="font-semibold text-base mb-1">Error Loading Data</h2>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Filter and Search Section Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={`${cardBg} rounded-xl shadow-lg p-5 border mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputStyle}
                aria-label="Search students"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              {searchQuery && (
                   <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors" aria-label="Clear search">
                     <XIcon className="h-4 w-4" />
                   </button>
                 )}
            </div>
            <div className="flex space-x-2 justify-end flex-shrink-0">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowFilters(!showFilters)} className={`${secondaryButtonStyle} flex items-center whitespace-nowrap ${showFilters ? "bg-blue-100 !text-blue-700 ring-1 ring-blue-500" : ""}`} aria-expanded={showFilters}>
                <Filter className="w-4 h-4 mr-1.5" /> Filters
                {activeFiltersCount > 0 && ( <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"> {activeFiltersCount} </span> )}
              </motion.button>
              {showClearButton && (
                   <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={resetFilters} className={`${dangerButtonStyle} flex items-center whitespace-nowrap`} aria-label="Clear all filters and search">
                     <RefreshCw className="w-4 h-4 mr-1.5" /> Clear
                   </motion.button>
                 )}
            </div>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div {...filterPanelVariants} className="overflow-hidden">
                {/* Updated grid for more filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-lg border border-slate-200 mt-2 pt-4">
                   {/* Hostel Selection */}
                   <div>
                     <label htmlFor="hostelFilter" className="block text-xs font-medium text-slate-600 mb-1">Hostel Block</label>
                     <select
                       id="hostelFilter"
                       value={selectedHostel}
                       onChange={(e) => setSelectedHostel(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Hostel Block"
                     >
                       <option value="">All Hostels</option>
                       {uniqueHostels.map((hostel) => (
                         <option key={hostel} value={hostel}>
                           {hostel}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Status Selection */}
                   <div>
                     <label htmlFor="statusFilter" className="block text-xs font-medium text-slate-600 mb-1">Current Status</label>
                     <select
                       id="statusFilter"
                       value={selectedStatus}
                       onChange={(e) => setSelectedStatus(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Current Status"
                     >
                       <option value="">All Status</option>
                       <option value="inside">Inside Hostel</option>
                       <option value="outside">Outside Hostel</option>
                     </select>
                   </div>

                   {/* Department Selection */}
                   <div>
                     <label htmlFor="departmentFilter" className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                     <select
                       id="departmentFilter"
                       value={selectedDepartment}
                       onChange={(e) => setSelectedDepartment(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Department"
                     >
                       <option value="">All Departments</option>
                       {uniqueDepartments.map((dept) => (
                         <option key={dept} value={dept}>
                           {dept}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Batch Selection */}
                   <div>
                     <label htmlFor="batchFilter" className="block text-xs font-medium text-slate-600 mb-1">Batch</label>
                     <select
                       id="batchFilter"
                       value={selectedBatch}
                       onChange={(e) => setSelectedBatch(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Batch"
                     >
                       <option value="">All Batches</option>
                       {uniqueBatches.map((batch) => (
                         <option key={batch} value={batch}>
                           {batch}
                         </option>
                       ))}
                     </select>
                   </div>


                   {/* Floor Selection */}
                   <div>
                     <label htmlFor="floorFilter" className="block text-xs font-medium text-slate-600 mb-1">Floor No.</label>
                     <select
                       id="floorFilter"
                       value={selectedFloor}
                       onChange={(e) => setSelectedFloor(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Floor Number"
                     >
                       <option value="">All Floors</option>
                       {uniqueFloors.map((floor) => (
                         <option key={floor} value={floor}>
                           {floor}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Degree Selection */}
                   <div>
                     <label htmlFor="degreeFilter" className="block text-xs font-medium text-slate-600 mb-1">Degree</label>
                     <select
                       id="degreeFilter"
                       value={selectedDegree}
                       onChange={(e) => setSelectedDegree(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Degree"
                     >
                       <option value="">All Degrees</option>
                       {uniqueDegrees.map((degree) => (
                         <option key={degree} value={degree}>
                           {degree}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Gender Selection */}
                   <div>
                     <label htmlFor="genderFilter" className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                     <select
                       id="genderFilter"
                       value={selectedGender}
                       onChange={(e) => setSelectedGender(e.target.value)}
                       className={selectStyle}
                       aria-label="Filter by Gender"
                     >
                       <option value="">All Genders</option>
                       {uniqueGenders.map((gender) => (
                         <option key={gender} value={gender}>
                           {gender}
                         </option>
                       ))}
                     </select>
                   </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Statistics Overview Section */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Hostel Status Chart Card */}
          <div className={`${cardBg} rounded-lg shadow-lg p-5 border col-span-1 flex flex-col`}>
            <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-blue-600" />
              Status Distribution
            </h3>
            <div className="flex-grow h-64 min-h-[200px] relative">
              {(insideCount > 0 || outsideCount > 0) ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm italic">No status data</div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-600 uppercase tracking-wider">Inside</p>
                <p className="font-bold text-xl text-blue-800">{insideCount}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-600 uppercase tracking-wider">Outside</p>
                <p className="font-bold text-xl text-red-800">{outsideCount}</p>
              </div>
            </div>
          </div>

          {/* Student Stats Overview Card */}
          <div className={`${cardBg} rounded-lg shadow-lg p-5 border col-span-1 md:col-span-2`}>
            <h3 className="text-base font-semibold text-slate-700 mb-5 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Summary Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center md:text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Filtered Total</p>
                <p className="font-medium text-2xl text-slate-800 mt-1">{filteredStudents.length}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center md:text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Inside Ratio</p>
                <p className="font-medium text-2xl text-blue-800 mt-1">
                  {(insideCount + outsideCount) ? ((insideCount / (insideCount + outsideCount)) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center md:text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Outside Ratio</p>
                <p className="font-medium text-2xl text-red-800 mt-1">
                  {(insideCount + outsideCount) ? ((outsideCount / (insideCount + outsideCount)) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-500">
               {loading ? (
                   <span className="italic">Updating...</span>
                 ) : (
                   <span>{`Status based on ${filteredStudents.length} students matching criteria.`}</span>
                 )}
            </div>
          </div>
        </motion.div>

        {/* Student List Table Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={`${cardBg} shadow-lg rounded-lg overflow-hidden border`}>
           <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
             <h3 className="text-base font-semibold text-slate-700">
               Student Status List {filteredStudents.length > 0 ? `(${filteredStudents.length})` : ''}
             </h3>
             {/* Display active filter summary */}
             {showClearButton && ( // Show if any filter or search is active
               <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {selectedHostel && <span>Hostel: <strong>{selectedHostel}</strong></span>}
                  {selectedStatus && <span>Status: <strong>{selectedStatus === 'inside' ? 'Inside' : 'Outside'}</strong></span>}
                  {selectedDepartment && <span>Dept: <strong>{selectedDepartment}</strong></span>}
                  {selectedBatch && <span>Batch: <strong>{selectedBatch}</strong></span>}
                  {selectedFloor && <span>Floor: <strong>{selectedFloor}</strong></span>}
                  {selectedDegree && <span>Degree: <strong>{selectedDegree}</strong></span>}
                  {selectedGender && <span>Gender: <strong>{selectedGender}</strong></span>}
                  {searchQuery && <span>Search: <strong>"{searchQuery}"</strong></span>}
               </div>
             )}
           </div>

          {loading && filteredStudents.length === 0 && ( // Show spinner only if loading AND no results yet
            <div className="p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-slate-600">Loading students...</p>
            </div>
          )}

          {!loading && filteredStudents.length > 0 ? (
            <div className="overflow-x-auto relative">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Roll No</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Student Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Hostel Block</th>
                    {/* Optional: Add more columns if needed, e.g., Department */}
                    {/* <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Department</th> */}
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <AnimatePresence>
                       {filteredStudents.map((student) => (
                         <motion.tr
                           key={student.student_id || student.roll_no} // Use a unique key
                           variants={rowVariants} initial="initial" animate="animate" exit="exit"
                           className="hover:bg-sky-50/50 transition-colors duration-150"
                           layout // Add layout prop for smoother animation on filter changes
                         >
                           <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-700">{student.roll_no || '-'}</td>
                           <td className="px-5 py-3 whitespace-nowrap text-slate-800">{student.full_name || '-'}</td>
                           <td className="px-5 py-3 whitespace-nowrap text-slate-600">{student.hostel_block || "N/A"}</td>
                           {/* Optional: Add data for new columns */}
                           {/* <td className="px-5 py-3 whitespace-nowrap text-slate-600">{student.department || "N/A"}</td> */}
                           <td className="px-5 py-3 whitespace-nowrap">
                             {student.in_status ? (
                               <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                 Inside
                               </span>
                             ) : (
                               <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                                 Outside
                               </span>
                             )}
                           </td>
                           <td className="px-5 py-3 whitespace-nowrap">
                             <Link href={`/guard/student-profile?rollNo=${student.roll_no}`} passHref legacyBehavior>
                               <motion.a whileHover={{ scale: 1.05, color: "#2563eb" }} whileTap={{ scale: 0.95 }} className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wide hover:underline">
                                 View Profile
                               </motion.a>
                             </Link>
                           </td>
                         </motion.tr>
                       ))}
                     </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
               !loading && ( // Only show "No results" if not loading
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center py-16 px-6 flex flex-col items-center">
                   <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="text-6xl mb-4 text-slate-400">
                     <Search strokeWidth={1.5}/>
                   </motion.div>
                   <h3 className="text-lg font-semibold text-slate-700">No Students Found</h3>
                   <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
                     {showClearButton ? "Try adjusting your search or filter criteria." : "No student data matches the current view."}
                   </p>
                   {showClearButton && (
                       <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetFilters} className={`${primaryButtonStyle} mt-5 text-sm`}>
                         Clear Filters & Search
                       </motion.button>
                     )}
                 </motion.div>
               )
             )}
        </motion.div>
      </div> {/* --- End Main Content Area --- */}
    </div>
  );
}