"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Send, ChevronDown, MessageSquareText, // Existing icons
  Bookmark, Mail, History, CheckCircle2, XCircle,     // Existing & Added from OLD
  List, Filter, X, AlertTriangle, Info, Loader2      // Existing & Added from OLD
} from "lucide-react";

// Added a simple debounce helper (in a real app, consider lodash.debounce or similar)
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Keep TEMPLATES from NEW.jsx as they fit the Notification Center theme
const TEMPLATES = {
  OFFICE_CALL: {
    subject: "Urgent Meeting Request",
    message: "You are requested to visit the administration office in Room 205 by tomorrow 3 PM."
  },
  FEE_REMINDER: {
    subject: "Fee Payment Reminder",
    message: "Kindly clear your pending tuition fees by the end of this week."
  },
  DOCUMENT_SUBMISSION: {
    subject: "Document Submission Required",
    message: "Please submit your pending academic documents to the department office."
  },
  CUSTOM: {
    subject: "",
    message: ""
  }
};

// Animation variants (kept simple)
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState('compose');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Compose State (ensure all needed state exists)
  const [filters, setFilters] = useState({
    batch: "", dept: "", hostel: "", room: "", Floor_no: "", unitno: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]); // From OLD/NEW
  const [form, setForm] = useState({ subject: "", message: "" }); // From OLD/NEW
  const [sendStatus, setSendStatus] = useState(null); // From OLD/NEW { type: 'success' | 'error', message: string }
  const [sending, setSending] = useState(false); // From OLD/NEW Loading state for send button
  const [showTemplates, setShowTemplates] = useState(false); // From OLD/NEW

  // History State (remains unchanged)
  const [notifications, setNotifications] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    start: "", end: "", status: "all", search: ""
  });
  const [expandedNotification, setExpandedNotification] = useState(null); // ID of the expanded notification

  // Fetch initial data (remains unchanged)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSendStatus(null); // Clear status on load
      try {
        const [studentsRes, notificationsRes] = await Promise.all([
          fetch("/api/admin/students"), // For filtering recipients
          fetch("/api/notifications")   // For history tab
        ]);

        if (!studentsRes.ok) throw new Error(`Failed to fetch students: ${studentsRes.statusText}`);
        if (!notificationsRes.ok) throw new Error(`Failed to fetch notifications: ${notificationsRes.statusText}`);

        const studentsData = await studentsRes.json();
        const notificationsData = await notificationsRes.json();

        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      } catch (error) {
        console.error("Data fetch error:", error);
        setSendStatus({ type: 'error', message: `Failed to load initial data: ${error.message}` });
        setStudents([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students based on filters and search query (remains unchanged)
  useEffect(() => {
    const filtered = students.filter(student => {
      if (!student || typeof student.full_name !== 'string' || typeof student.email !== 'string') return false;

      const studentBatch = student.batch != null ? String(student.batch) : null;
      const studentFloor = student.Floor_no != null ? String(student.Floor_no) : null;
      const studentUnit = student.unit_no != null ? String(student.unit_no) : null;

      return (
        (!filters.batch || studentBatch === filters.batch) &&
        (!filters.dept || student.department === filters.dept) &&
        (!filters.hostel || student.hostel_block === filters.hostel) &&
        (!filters.room || student.room_number === filters.room) &&
        (!filters.Floor_no || studentFloor === filters.Floor_no) &&
        (!filters.unitno || studentUnit === filters.unitno) &&
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setFilteredStudents(filtered);
  }, [students, filters, searchQuery]);

  // Get unique values for filters (remains unchanged)
  const uniqueValues = useCallback((key, transform = v => v) => {
    const values = students
      .map(s => s && s[key] != null ? transform(s[key]) : null)
      .filter(v => v !== null && v !== undefined);
    return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [students]);

  // Dependent Filter Logic for UnitNo (remains unchanged)
  const availableUnitNos = useMemo(() => {
    if (!filters.Floor_no) {
      return uniqueValues('unit_no');
    }
    try {
        const selectedFloor = parseInt(filters.Floor_no, 10);
        if (isNaN(selectedFloor)) {
            return uniqueValues('unit_no');
        }
        const targetHundredDigit = selectedFloor + 1;
        const unitsForFloor = students
            .filter(student => student && String(student.Floor_no) === filters.Floor_no)
            .map(student => student.unit_no)
            .filter(unit => unit != null)
            .filter(unit => {
                const unitNum = parseInt(unit, 10);
                return !isNaN(unitNum) && Math.floor(unitNum / 100) === targetHundredDigit;
            })
            .map(String);
        return [...new Set(unitsForFloor)].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
    } catch (error) {
        console.error("Error calculating available unit numbers:", error);
        return uniqueValues('unit_no');
    }
  }, [filters.Floor_no, students, uniqueValues]);

  useEffect(() => {
    if (filters.unitno && !availableUnitNos.includes(filters.unitno)) {
      setFilters(prevFilters => ({ ...prevFilters, unitno: "" }));
    }
  }, [availableUnitNos, filters.unitno]); // Added filters.unitno dependency here


  // **ADDED from OLD.jsx**: Toggle recipient selection
  const toggleRecipient = (email) => {
    setSelectedRecipients(prev =>
        prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // Apply template content (use NEW.jsx TEMPLATES)
  const applyTemplate = (templateKey) => {
    const template = TEMPLATES[templateKey];
    if (template) {
        setForm({
            subject: template.subject,
            message: template.message
        });
    }
    setShowTemplates(false);
  };

  // **REPLACED with OLD.jsx logic**: Handle sending announcement
  const handleSendAnnouncement = async (e) => {
      e.preventDefault();
      if (!form.subject.trim() || !form.message.trim() || selectedRecipients.length === 0) {
          setSendStatus({ type: 'error', message: 'Subject, message, and at least one recipient are required.' });
          return;
      }
      setSending(true);
      setSendStatus(null);
      try {
          // **Use OLD.jsx endpoint**
          const res = await fetch("/api/guard/emergency-announcement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subject: form.subject, message: form.message, recipients: selectedRecipients }),
          });
          if (!res.ok) {
              let errorMsg = `Failed: ${res.statusText} (Status: ${res.status})`;
              try { const errorData = await res.json(); errorMsg = errorData.error || errorData.message || errorMsg; } catch {}
              throw new Error(errorMsg);
          }
          const data = await res.json();
          // **Use OLD.jsx success handling (does not update history tab)**
          if (data.success) {
              setSendStatus({ type: 'success', message: "Announcement sent successfully!" });
              setForm({ subject: "", message: "" });
              setSelectedRecipients([]); // Clear selection on success
          } else {
              setSendStatus({ type: 'error', message: data.error || data.message || "An unknown error occurred sending the announcement." });
          }
      } catch (error) {
          console.error("Error sending announcement:", error);
          setSendStatus({ type: 'error', message: `Sending failed: ${error.message}` });
      } finally {
          setSending(false);
      }
  };


  // Filter notification history (remains unchanged)
  const filteredHistory = useMemo(() => {
    return notifications.filter(notification => {
      if (!notification || !notification.sent_at) return false;
      const date = new Date(notification.sent_at);
      let start = historyFilters.start ? new Date(historyFilters.start) : null;
      let end = historyFilters.end ? new Date(historyFilters.end) : null;
      if (start && isNaN(start.getTime())) start = null;
      if (end && isNaN(end.getTime())) end = null;
      if (end) end.setHours(23, 59, 59, 999);
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesStatus = (historyFilters.status === 'all' || notification.status === historyFilters.status);
      const matchesSearch = [notification.subject, notification.message]
        .some(text => typeof text === 'string' && text.toLowerCase().includes(historyFilters.search.toLowerCase()));
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [notifications, historyFilters]);


  // Reset compose filters and search (remains unchanged)
  const resetFilters = () => {
    setFilters({ batch: "", dept: "", hostel: "", room: "", Floor_no: "", unitno: "" });
    setSearchQuery("");
    // Clear search input visually
    const searchInput = document.querySelector('input[placeholder="Search by name..."]');
    if (searchInput) searchInput.value = "";
  };

  // Clear selected recipients (remains unchanged)
  const clearSelectedRecipients = () => {
    setSelectedRecipients([]);
  };

  // Debounced search handler (remains unchanged)
  const debouncedSetSearchQuery = useCallback(debounce(setSearchQuery, 300), []);


  // Initial loading screen (**THEME UPDATED TO RED**)
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          // ** RED THEME **
          className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-700 mt-4">Loading System Data</h2>
        <p className="text-gray-500 mt-2 text-sm">Please wait...</p>
        {/* Display initial loading error */}
         <AnimatePresence>
             {sendStatus && sendStatus.type === 'error' && (
                 <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="hidden" className="mt-4 p-3 rounded-md flex items-start gap-2 text-sm bg-red-50 text-red-800 border border-red-200">
                     <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                     <span>{sendStatus.message}</span>
                 </motion.div>
             )}
         </AnimatePresence>
      </motion.div>
    </div>
  );

  // Main UI (**THEME UPDATED TO RED**)
  return (
    // ** RED THEME ** (Using gray/red subtle gradient)
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      {/* Header (**THEME UPDATED TO RED**) */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              {/* ** RED THEME ** */}
              <div className="bg-red-100 p-2 rounded-lg">
                <Mail className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Emergency Announcements</h1>
                <p className="text-gray-500 text-xs md:text-sm">Manage and send announcemnts to students</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-2 bg-gray-100 p-1 rounded-lg"
            >
              {/* ** RED THEME ** (Tabs focus/active state) */}
              <button
                onClick={() => setActiveTab('compose')}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium w-full md:w-auto ${
                  activeTab === 'compose'
                    ? 'bg-white text-red-700 shadow-sm' // Active tab text red
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Compose</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium w-full md:w-auto ${
                  activeTab === 'history'
                    ? 'bg-white text-red-700 shadow-sm' // Active tab text red
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'compose' ? (
            // **Compose Tab Content (Uses OLD.jsx structure/logic)**
            <motion.div
              key="compose"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8"
            >
              {/* **Compose Form Section (FROM OLD.jsx, adapted styles)** (**THEME UPDATED TO RED**) */}
              <motion.div
                variants={slideUp}
                className="lg:col-span-4 bg-white rounded-lg shadow border border-gray-200 p-5 md:p-6" // Kept NEW.jsx styling base
              >
                 {/* Title from OLD.jsx (**THEME UPDATED TO RED**) */}
                 <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-800">
                    <Send className="w-5 h-5 text-red-600" /> {/* ** RED ICON ** */}
                    Compose Announcement
                 </h2>
                 {/* Form submits to the new handleSendAnnouncement */}
                 <form onSubmit={handleSendAnnouncement} className="space-y-5">
                     {/* Template Selector (from OLD.jsx, uses NEW.jsx templates) (**THEME UPDATED TO RED**) */}
                     <div className="relative">
                         <button
                           type="button"
                           onClick={() => setShowTemplates(!showTemplates)}
                           // ** RED THEME FOCUS **
                           className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                           aria-expanded={showTemplates}
                           aria-haspopup="listbox"
                         >
                             <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                 <Bookmark className="w-4 h-4 text-gray-500"/> {/* Icon from OLD */}
                                 {form.subject && form.message ? "Custom / Applied Template" : "Select Template (Optional)"}
                             </span>
                             <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showTemplates ? 'rotate-180' : ''}`} />
                         </button>
                         <AnimatePresence>
                             {showTemplates && (
                                 <motion.ul // Animation and style from OLD.jsx
                                   role="listbox"
                                   initial={{ opacity: 0, y: -5, height: 0 }}
                                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                                   exit={{ opacity: 0, y: -5, height: 0 }}
                                   transition={{ duration: 0.2 }}
                                   className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto max-h-60 focus:outline-none"
                                 >
                                     {/* Maps over NEW.jsx TEMPLATES (**THEME UPDATED TO RED**) */}
                                     {Object.entries(TEMPLATES).map(([key, template]) => (
                                         <motion.li
                                           key={key}
                                           role="option"
                                           aria-selected={form.subject === template.subject && form.message === template.message}
                                           // ** RED THEME HOVER ** (red-50)
                                           whileHover={{ backgroundColor: 'rgba(254, 242, 242, 1)' }}
                                           onClick={() => applyTemplate(key)}
                                           className="p-3 cursor-pointer border-b border-gray-100 last:border-0 text-sm"
                                         >
                                           <div className="font-medium text-gray-800">{template.subject || 'Custom Template'}</div>
                                           {template.message && (
                                             <div className="text-xs text-gray-500 truncate mt-1">{template.message}</div>
                                           )}
                                         </motion.li>
                                     ))}
                                 </motion.ul>
                             )}
                         </AnimatePresence>
                     </div>

                     {/* Subject Input (from OLD.jsx) (**THEME UPDATED TO RED**) */}
                     <div>
                         <label htmlFor="subject" className="block text-sm font-medium mb-1.5 text-gray-700">Subject</label>
                         <input
                           id="subject"
                           value={form.subject}
                           onChange={e => setForm({...form, subject: e.target.value})}
                           // ** RED THEME FOCUS **
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm shadow-sm"
                           placeholder="Enter announcement subject"
                           required
                         />
                     </div>

                     {/* Message Textarea (from OLD.jsx) (**THEME UPDATED TO RED**) */}
                     <div>
                         <label htmlFor="message" className="block text-sm font-medium mb-1.5 text-gray-700">Message</label>
                         <textarea
                           id="message"
                           value={form.message}
                           onChange={e => setForm({...form, message: e.target.value})}
                           rows="6"
                           // ** RED THEME FOCUS **
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm resize-y shadow-sm"
                           placeholder="Type your announcement here..."
                           required
                         />
                     </div>

                     {/* Selected Recipients Display (from OLD.jsx) (**THEME UPDATED TO RED**) */}
                     {/* ** RED THEME ** (Using red-50 bg/border/text) */}
                     <div className="bg-red-50 p-3 rounded-md border border-red-100">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1.5">
                             <Users className="w-4 h-4 text-red-700" /> {/* ** RED ICON ** */}
                             <span className="text-sm font-medium text-gray-800">Recipients</span>
                           </div>
                           <motion.div
                               key={selectedRecipients.length} // Animate count change
                               animate={{ scale: selectedRecipients.length ? [1, 1.15, 1] : 1 }}
                               transition={{ duration: 0.3 }}
                               // ** RED THEME COUNT BADGE **
                               className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-bold"
                           >
                               {selectedRecipients.length}
                           </motion.div>
                         </div>

                         {selectedRecipients.length > 0 ? (
                           <div className="flex flex-col">
                             <div className="flex justify-end mb-1">
                                <button
                                 type="button"
                                 onClick={clearSelectedRecipients}
                                 // Style from OLD.jsx (red color for clear is already correct)
                                 className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                                  aria-label="Clear all selected recipients"
                               >
                                 <X className="w-3 h-3"/> Clear All
                               </button>
                             </div>
                             {/* List style from OLD.jsx (**THEME UPDATED TO RED SCROLLBAR**) */}
                             <div className="h-28 overflow-y-auto text-xs space-y-1 pr-1 bg-white rounded border border-red-100 p-2 scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-gray-100"> {/* ** RED BORDER/SCROLL ** */}
                               {selectedRecipients.map(email => (
                                 // Item style from OLD.jsx
                                 <div key={email} className="flex items-center justify-between group bg-gray-50 px-1.5 py-1 rounded">
                                   <span className="truncate text-gray-700" title={email}>{email}</span>
                                   <button
                                     type="button"
                                     onClick={() => toggleRecipient(email)} // Uses toggleRecipient from OLD.jsx
                                     className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                     aria-label={`Remove ${email}`}
                                   >
                                     <XCircle className="w-3.5 h-3.5"/>
                                   </button>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ) : (
                           // Placeholder from OLD.jsx
                           <div className="text-center py-3 text-gray-500 text-xs italic">
                             Select recipients from the list on the right.
                           </div>
                         )}
                     </div>

                     {/* Send Button (from OLD.jsx) (**THEME UPDATED TO RED**) */}
                     <motion.button
                       type="submit"
                       disabled={sending}
                       whileHover={{ scale: sending ? 1 : 1.02 }}
                       whileTap={{ scale: sending ? 1 : 0.98 }}
                       // ** RED THEME BUTTON **
                       className={`w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-md hover:bg-red-700 transition-colors font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${sending ? 'opacity-75 cursor-not-allowed' : ''}`}
                     >
                       {sending ? (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           <span>Sending...</span>
                         </>
                       ) : (
                         <>
                           <Send className="w-5 h-5" />
                           <span>Send Announcement</span> {/* Text from OLD */}
                         </>
                       )}
                     </motion.button>

                     {/* Send Status Message (from OLD.jsx, uses AlertTriangle - already correct colors) */}
                     <AnimatePresence>
                       {sendStatus && (
                         <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 10 }}
                           role="alert"
                           // Style from OLD.jsx (Green for success, Red for error)
                           className={`p-3 rounded-md flex items-start gap-2 text-sm border ${
                             sendStatus.type === 'success'
                               ? 'bg-green-50 text-green-800 border-green-200' // Keep success green
                               : 'bg-red-50 text-red-800 border-red-200' // Error is already red
                           }`}
                         >
                           {sendStatus.type === 'success' ? (
                             <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                           ) : (
                             // Use AlertTriangle for errors like in OLD.jsx example loading error
                             <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                           )}
                           <span className="flex-grow">{sendStatus.message}</span>
                           <button onClick={() => setSendStatus(null)} className="ml-2 text-gray-500 hover:text-gray-700" aria-label="Dismiss message">
                             <X className="w-4 h-4" />
                           </button>
                         </motion.div>
                       )}
                     </AnimatePresence>
                 </form>
              </motion.div>


              {/* Recipient Selection Section (FROM NEW.jsx - kept as is) (**THEME UPDATED TO RED**) */}
              <motion.div
                variants={slideUp}
                transition={{ delay: 0.1 }}
                className="lg:col-span-8 bg-white rounded-lg shadow border border-gray-200 overflow-hidden" // Added overflow hidden
              >
                {/* Filters and Search (**THEME UPDATED TO RED**) */}
                <div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50/50">
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                     {/* ** RED ICON ** */}
                     <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2"><Users className="w-5 h-5 text-red-600"/> Select Recipients</h3>
                     {/* Desktop Filter Toggle (**THEME UPDATED TO RED**) */}
                     <button
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} // Re-use mobile state for simplicity here
                        // ** RED TEXT/HOVER **
                        className="flex md:hidden items-center gap-1.5 text-sm text-red-600 font-medium px-3 py-1.5 border border-gray-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Filter className="w-4 h-4" /> Filters
                      </button>
                   </div>

                    {/* Filters Row (using NEW.jsx structure and state) (**THEME UPDATED TO RED**) */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { key: 'batch', stateKey: 'batch', label: 'All Batches', transform: (v) => v },
                        { key: 'department', stateKey: 'dept', label: 'All Depts', transform: (v) => v },
                        { key: 'hostel_block', stateKey: 'hostel', label: 'All Hostels', transform: (v) => `${v}` }, // Removed "Block" prefix for brevity
                      ].map(filter => (
                        <select
                          key={filter.key}
                          value={filters[filter.stateKey]}
                          onChange={e => setFilters({ ...filters, [filter.stateKey]: e.target.value })}
                          // ** RED THEME FOCUS **
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition shadow-sm bg-white appearance-none"
                          aria-label={`Filter by ${filter.label.replace('All ', '')}`}
                        >
                          <option value="">{filter.label}</option>
                          {uniqueValues(filter.key).map(value => (
                            <option key={value} value={value}>{filter.transform(value)}</option>
                          ))}
                        </select>
                      ))}
                      {/* Floor filter (**THEME UPDATED TO RED**) */}
                      <select
                        key='Floor_no'
                        value={filters.Floor_no}
                        onChange={e => setFilters({ ...filters, Floor_no: e.target.value, unitno: "" })} // Reset unit on floor change
                         // ** RED THEME FOCUS **
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition shadow-sm bg-white appearance-none"
                        aria-label={`Filter by Floor`}
                      >
                        <option value="">All Floors</option>
                        {uniqueValues('Floor_no').map(value => (
                          <option key={value} value={value}>{`Floor ${value}`}</option>
                        ))}
                      </select>
                      {/* Unit No filter (**THEME UPDATED TO RED**) */}
                       <select
                        key='unit_no'
                        value={filters.unitno}
                        onChange={e => setFilters({ ...filters, unitno: e.target.value })}
                         // ** RED THEME FOCUS **
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition shadow-sm bg-white appearance-none"
                        aria-label={`Filter by Unit No`}
                        disabled={availableUnitNos.length === 0} // Disable if no units available (e.g., no floor selected or floor has no matching units)
                       >
                           <option value="">All Units</option>
                           {availableUnitNos.map(value => (
                               <option key={value} value={value}>{`Unit ${value}`}</option>
                           ))}
                       </select>
                      {/* Room filter (**THEME UPDATED TO RED**) */}
                       <select
                        key='room_number'
                        value={filters.room}
                        onChange={e => setFilters({ ...filters, room: e.target.value })}
                         // ** RED THEME FOCUS **
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition shadow-sm bg-white appearance-none"
                        aria-label={`Filter by Room`}
                      >
                        <option value="">All Rooms</option>
                        {uniqueValues('room_number').map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                       {/* Search Input (**THEME UPDATED TO RED**) */}
                      <div className="relative col-span-2 sm:col-span-1 lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search by name..."
                          defaultValue={searchQuery}
                          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                           // ** RED THEME FOCUS **
                          className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition shadow-sm"
                          aria-label="Search recipients by name"
                        />
                      </div>
                       {/* Reset Filters Button */}
                       <button
                        onClick={resetFilters}
                        className="col-span-2 sm:col-span-full lg:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                      >
                        <X className="w-4 h-4"/> Reset
                      </button>
                    </div>
                </div>

                 {/* Student Table (Uses toggleRecipient from OLD.jsx now) (**THEME UPDATED TO RED**) */}
                 <div className="max-h-[calc(100vh-380px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"> {/* Adjusted max-h */}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"><span className="sr-only">Select</span></th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((user, index) => (
                        // Row style from OLD.jsx (red highlight), uses toggleRecipient
                         <tr key={user.email || index} className={`${selectedRecipients.includes(user.email) ? 'bg-red-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60')} hover:bg-red-50/70 transition-colors duration-150`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(user.email)}
                                onChange={() => toggleRecipient(user.email)} // ** Use toggleRecipient **
                                // ** RED THEME CHECKBOX **
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                aria-label={`Select ${user.full_name}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{user.full_name || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate" title={user.email}>{user.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.hostel_block ? `${user.hostel_block}` : '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.unit_no ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.room_number ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.Floor_no ?? '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 truncate" title={user.department}>{user.department || '-'}</td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>

                {/* No Results Message (kept from NEW.jsx) (**THEME UPDATED TO RED**) */}
                {filteredStudents.length === 0 && !loading && (
                  <div className="text-center py-10 px-4 text-gray-500">
                    <Info className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium">No Students Found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                    {Object.values(filters).some(v => v !== '') || searchQuery ? (
                       <button
                        onClick={resetFilters}
                        // ** RED TEXT HOVER **
                        className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 mx-auto"
                      >
                        <X className="w-3 h-3"/> Clear Filters & Search
                      </button>
                    ) : null}
                  </div>
                )}
              </motion.div>

            </motion.div>
          ) : (
            // History Tab Content (Remains unchanged from NEW.jsx) (**THEME UPDATED TO RED**)
            <motion.div
              key="history"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
              className="bg-white rounded-lg shadow border border-gray-200 p-5 md:p-6"
            >
              {/* ** RED ICON ** */}
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-800">
                <History className="w-5 h-5 text-red-600" />
                Notification History
              </h2>

              {/* History Filters (**THEME UPDATED TO RED**) */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <input
                    type="date"
                    value={historyFilters.start}
                    onChange={e => setHistoryFilters({...historyFilters, start: e.target.value})}
                    // ** RED THEME FOCUS **
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 shadow-sm"
                    aria-label="Filter history start date"
                  />
                  <input
                    type="date"
                    value={historyFilters.end}
                    onChange={e => setHistoryFilters({...historyFilters, end: e.target.value})}
                     // ** RED THEME FOCUS **
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 shadow-sm"
                    aria-label="Filter history end date"
                  />
                   <select
                     value={historyFilters.status}
                     onChange={e => setHistoryFilters({...historyFilters, status: e.target.value})}
                      // ** RED THEME FOCUS **
                     className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 shadow-sm bg-white appearance-none"
                     aria-label="Filter history by status"
                   >
                     <option value="all">All Statuses</option>
                     <option value="sent">Sent</option> {/* Adjust if your API uses different statuses */}
                     <option value="failed">Failed</option>
                   </select>
                  <div className="relative sm:col-span-1 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search subject/message..."
                      value={historyFilters.search}
                      onChange={e => setHistoryFilters({...historyFilters, search: e.target.value})}
                       // ** RED THEME FOCUS **
                      className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 shadow-sm"
                      aria-label="Search notification history"
                    />
                  </div>
               </div>

              {/* History List */}
               <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                 {filteredHistory.length > 0 ? filteredHistory.map(notif => (
                   <div key={notif._id || notif.id} className="border border-gray-200 rounded-lg overflow-hidden">
                     <button
                       onClick={() => setExpandedNotification(expandedNotification === (notif._id || notif.id) ? null : (notif._id || notif.id))}
                       className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                       aria-expanded={expandedNotification === (notif._id || notif.id)}
                     >
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-gray-800 truncate">{notif.subject}</p>
                         <p className="text-xs text-gray-500 mt-1">
                           Sent: {new Date(notif.sent_at).toLocaleString()} | Status: <span className={`font-medium ${notif.status === 'failed' ? 'text-red-600' : 'text-green-600'}`}>{notif.status || 'Unknown'}</span> | Recipients: {notif.recipients?.length || 0}
                         </p>
                       </div>
                       <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expandedNotification === (notif._id || notif.id) ? 'rotate-180' : ''}`} />
                     </button>
                     <AnimatePresence>
                       {expandedNotification === (notif._id || notif.id) && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ duration: 0.3 }}
                           className="overflow-hidden"
                         >
                           <div className="p-4 border-t border-gray-200 bg-white">
                             <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{notif.message}</p>
                             <h4 className="text-xs font-medium text-gray-600 mb-1">Recipients ({notif.recipients?.length || 0}):</h4>
                             <div className="text-xs text-gray-500 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-100 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
                               {notif.recipients && notif.recipients.length > 0 ? notif.recipients.join(', ') : 'None'}
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 )) : (
                   <div className="text-center py-10 text-gray-500">
                     <List className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                     <p className="text-sm font-medium">No History Found</p>
                     <p className="text-xs mt-1">No notifications match the current filters.</p>
                   </div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}