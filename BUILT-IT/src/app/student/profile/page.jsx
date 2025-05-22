"use client";
 import { useState, useEffect } from "react";
 import { useRouter } from "next/navigation"; // Correct import for App Router
 import { supabase } from "@/lib/supabaseClient";
 import { QRCodeCanvas } from "qrcode.react";
 import Link from "next/link";
 import {
   UserIcon,
   HomeIcon,
   BookIcon,
   CheckCircleIcon,
   XCircleIcon,
   BookOpenIcon,
   RefreshCwIcon,
   QrCodeIcon,
   ShieldIcon,
   ArrowLeftIcon,
   XIcon, // Icon for closing modal
   Maximize2Icon, // Icon indicating enlarge
   BuildingIcon, // Added icon for Unit Number
   ClockIcon, // Added icon for timer
 } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence

 // --- Reusable Modal Component ---
 function Modal({ isOpen, onClose, children }) {
   return (
     <AnimatePresence>
       {isOpen && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
           onClick={onClose} // Close on overlay click
         >
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
             className="bg-white rounded-2xl shadow-xl max-w-lg w-full m-4 relative"
             onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
           >
             <button
               onClick={onClose}
               className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition p-2 rounded-full hover:bg-gray-100"
               aria-label="Close modal"
             >
               <XIcon className="w-6 h-6" />
             </button>
             {children}
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }

 // --- Main Student Profile Component ---
 export default function StudentProfile() {
   const [session, setSession] = useState(null);
   const [student, setStudent] = useState(null);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState("personal");
   const [refreshing, setRefreshing] = useState(false);
   const [isQrModalOpen, setIsQrModalOpen] = useState(false); // State for QR Modal
   const [qrValue, setQrValue] = useState("LOADING_QR"); // State for dynamic QR value
   const [qrTimer, setQrTimer] = useState(120); // Timer countdown (seconds)
   const router = useRouter();

   // --- QR Code Generation/Refresh Logic ---
   useEffect(() => {
     let intervalId = null;
     let countdownId = null;

     const generateQrValue = () => {
        // *** Backend Integration Needed ***
        // Replace this placeholder logic with a fetch call to your backend
        // The backend should return a short-lived token/signed data
        // Example placeholder: Use roll number + timestamp
        const newValue = student?.roll_no ? `${student.roll_no}_${Date.now()}` : "INVALID_DATA";
        setQrValue(newValue);
        setQrTimer(120); // Reset timer
        console.log("QR Code Refreshed:", newValue);
     };

     // Run QR generation/refresh only when student data is available AND the modal is closed.
     if (student?.roll_no && !isQrModalOpen) {
       // Initial generation
       generateQrValue();

       // Set interval to refresh the QR value periodically (e.g., every 110 seconds)
       intervalId = setInterval(generateQrValue, 110 * 1000);

       // Set interval for the countdown timer display
       countdownId = setInterval(() => {
         setQrTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
       }, 1000);

     } else {
       // If no student data or the modal IS open, stop the refresh intervals.
       // When the modal opens, it will display the *last generated* dynamic QR code.
       // The QR code does NOT actively refresh *while* the modal is open.
       setQrValue(student?.roll_no ? qrValue : "WAITING_FOR_DATA"); // Keep the current dynamic value if opening modal
       setQrTimer(0); // Reset visual timer display when modal is open or no student
       if (intervalId) clearInterval(intervalId);
       if (countdownId) clearInterval(countdownId);
     }

     // Cleanup function to clear intervals on unmount or dependency change
     return () => {
       if (intervalId) clearInterval(intervalId);
       if (countdownId) clearInterval(countdownId);
     };
     // Rerun when roll_no changes or when the modal's open state changes.
   }, [student?.roll_no, isQrModalOpen]); // Dependency array includes isQrModalOpen


   // Get session (no change needed here)
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

   // Fetch student record (no change needed here)
   useEffect(() => {
     async function fetchStudent() {
       setLoading(true);
       setError("");
       setStudent(null);

       if (session && session.user) {
         const email = session.user.email;
         if (!email || !email.includes('@')) {
           setError("Invalid user email format.");
           setLoading(false);
           return;
         }
         const rollNo = email.split("@")[0];
         try {
           // *** IMPORTANT: Ensure your API returns the 'unit_no' field ***
           const res = await fetch(`/api/student?rollNo=${rollNo}`);
           if (!res.ok) {
             throw new Error(`API request failed with status ${res.status}`);
           }
           const data = await res.json();
           if (data.error) {
             setError(data.error);
           } else if (Object.keys(data).length === 0) {
             setError(`No student record found for roll number: ${rollNo}. Please contact administration.`);
           } else {
             setStudent(data); // Student data including unit_no should be set here
             setError("");
           }
         } catch (err) {
           console.error("Fetch Student Error:", err);
           setError(`Failed to fetch student data. ${err.message}`);
         } finally {
           setLoading(false);
         }
       } else {
         setLoading(false);
       }
     }
     fetchStudent();
   }, [session]);

   // Refresh Data (no change needed here)
   const refreshData = async () => {
     if (session && session.user) {
       setRefreshing(true);
       setError("");
       const email = session.user.email;
       if (!email || !email.includes('@')) {
        setError("Invalid user email format for refresh.");
        setRefreshing(false);
        return;
       }
       const rollNo = email.split("@")[0];
       try {
         const res = await fetch(`/api/student?rollNo=${rollNo}`);
         if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
         }
         const data = await res.json();
         if (data.error) {
           setError(data.error);
           setStudent(null);
         } else if (Object.keys(data).length === 0) {
           setError(`No student record found for roll number: ${rollNo} during refresh.`);
           setStudent(null);
         }
          else {
           setStudent(data);
         }
       } catch (err) {
         console.error("Refresh Data Error:", err);
         setError(`Failed to refresh data. ${err.message}`);
         setStudent(null);
       } finally {
         setRefreshing(false);
       }
     } else {
        setError("Cannot refresh data. User session not available.");
     }
   };

   // Function to open the QR Modal
   const handleQREnlargeClick = () => {
     if (student?.roll_no) {
       // When opening modal, ensure it shows the *current* dynamic value
       // The useEffect hook above handles stopping the refresh timer when isQrModalOpen becomes true.
       // The `qrValue` state already holds the latest dynamic value.
       setIsQrModalOpen(true);
     }
   };

   // Status Icon (no change needed)
   const getStatusIcon = (isInside) => {
     return isInside ? (
       <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
         <CheckCircleIcon className="w-4 h-4 mr-1.5" /> Inside Hostel
       </span>
     ) : (
       <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
         <XCircleIcon className="w-4 h-4 mr-1.5" /> Outside Hostel
       </span>
     );
   };

   // --- Render Logic ---

   // 1. Authentication Required Screen (no change)
   if (!session && !loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-200"
         >
           <div className="text-6xl mb-4 text-indigo-500">🔑</div>
           <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
           <p className="mt-2 text-gray-600 mb-6">Please sign in to access your HMS Portal.</p>
           <button className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-semibold">
             Go to Sign In
           </button>
         </motion.div>
       </div>
     );
   }

   // 2. Loading Screen (no change)
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
         <div className="flex flex-col items-center">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
           <p className="mt-4 text-lg font-medium text-gray-700">Loading Student Data...</p>
         </div>
       </div>
     );
   }

   // 3. Error Screen (no change)
   if (error) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="bg-white border border-red-200 rounded-xl p-8 max-w-lg w-full shadow-lg text-center"
         >
            <div className="text-5xl mb-4 text-red-500">😟</div>
           <h2 className="text-red-700 text-xl font-semibold mb-3">Oops! An Error Occurred</h2>
           <p className="mt-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>
           <button
             onClick={refreshData}
             disabled={refreshing}
             className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
           >
             <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
             {refreshing ? 'Retrying...' : 'Try Again'}
           </button>
            <p className="text-xs text-gray-500 mt-4">If the problem persists, contact support.</p>
         </motion.div>
       </div>
     );
   }

   // 4. No Student Record Found Screen (no change)
   if (!student) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="bg-white border border-orange-200 rounded-xl p-8 max-w-lg w-full shadow-lg text-center"
         >
           <div className="text-5xl mb-4 text-orange-500">🤔</div>
           <h2 className="text-orange-700 text-xl font-semibold mb-3">Student Record Not Found</h2>
           <p className="mt-2 text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
             We couldn't find a student record associated with the email <span className="font-medium">{session?.user?.email || 'your account'}</span>.
             Please ensure you are using the correct institute email address.
           </p>
            <p className="text-xs text-gray-500 mt-4 mb-6">If you believe this is an error, please contact the hostel administration.</p>
           <button
             onClick={refreshData}
             disabled={refreshing}
             className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
           >
             <RefreshCwIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
             {refreshing ? 'Refreshing...' : 'Refresh Data'}
           </button>
         </motion.div>
       </div>
     );
   }
   // 5. Main Profile View
   return (
     <>
       {/* Changed background gradient from indigo/purple to teal/cyan */}
       <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
         {/* Header */}
         <div className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white py-6 shadow-md sticky top-0 z-10">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
             <div className="text-center sm:text-left mb-4 sm:mb-0">
               <h1 className="text-2xl sm:text-3xl font-bold">STUDENT PROFILE</h1>
               <p className="mt-1 text-sm text-cyan-100">Student Dashboard</p>
             </div>
             <button
               onClick={refreshData}
               disabled={refreshing}
               className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <RefreshCwIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
               {refreshing ? 'Refreshing...' : 'Refresh'}
             </button>
           </div>
         </div>

         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

             {/* --- Left Column - Student Card --- */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="lg:col-span-4"
             >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
                   {/* Keeping the gradient for the avatar background */}
                   <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-black p-6 text-center">
                     <div className="mb-4">
                         <span className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-400 text-white text-4xl font-bold shadow-md ring-4 ring-white/30">
                             {student.full_name ? student.full_name.charAt(0).toUpperCase() : "S"}
                         </span>
                     </div>
                     <h2 className="text-xl font-bold text-white">{student.full_name}</h2>
                     <p className="text-sm text-gray-300">{student.roll_no}</p>
                     <div className="mt-4">
                         {getStatusIcon(student.in_status)}
                     </div>
                   </div>

                   <div className="p-6 space-y-4 flex-grow">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Info</h3>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <div className="flex items-center text-sm">
                                 {/* Using teal color */}
                                 <BookIcon className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
                                 <span className="text-gray-600">Department</span>
                             </div>
                             <span className="font-medium text-gray-800 text-sm text-right">{student.department || 'N/A'}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center text-sm">
                                <BookOpenIcon className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Batch</span>
                            </div>
                            <span className="font-medium text-gray-800 text-sm text-right">{student.batch || 'N/A'}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex items-center text-sm">
                                <UserIcon className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
                                <span className="text-gray-600">Email</span>
                           </div>
                           <span className="font-medium text-gray-800 text-sm text-right truncate" title={student.email}>{student.email || 'N/A'}</span>
                         </div>
                   </div>

                   <div className="p-6 mt-auto border-t border-gray-200 bg-gray-50">
                       <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Need Help?</h3>
                       {/* Using teal color accents */}
                       <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm">
                         <p className="text-gray-700 mb-1">
                             Contact Hostel Administration:
                         </p>
                         <p className="text-teal-700 font-medium">hostel.admin@example.com</p> {/* Replace with actual email */}
                         <p className="text-teal-700 font-medium">+91 12345 67890</p> {/* Replace with actual phone */}
                       </div>
                   </div>
                </div>
             </motion.div>


             {/* --- Right Column - Main Content (QR + Tabs) --- */}
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="lg:col-span-8 space-y-6 lg:space-y-8"
             >
               {/* QR Code Section */}
               <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   {/* Left Info */}
                   <div className="flex-1">
                     <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center mb-2">
                        {/* Using teal color */}
                       <QrCodeIcon className="w-6 h-6 mr-2 text-teal-600 flex-shrink-0" />
                       Quick Gate Entry/Exit
                     </h2>
                     <p className="text-gray-600 text-sm mb-2">
                       Tap the QR code to enlarge for scanning. This code refreshes automatically.
                     </p>
                     {/* Timer Display */}
                     <div className="text-sm text-gray-500 mb-4 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400"/>
                        {qrTimer > 0 ? (
                            <span>Refreshes in: <span className="font-medium text-gray-700">{Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}</span></span>
                        ) : (
                            <span className="text-amber-600 font-medium">Refreshing...</span>
                        )}
                     </div>
                     <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 flex items-center text-xs">
                       <ShieldIcon className="w-4 h-4 text-teal-600 mr-2 flex-shrink-0" />
                       <p className="text-teal-700">Secured by HMS Authentication System</p>
                     </div>
                   </div>

                   {/* Right QR Code Button */}
                   <motion.button
                     onClick={handleQREnlargeClick}
                     whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                     whileTap={{ scale: 0.98 }}
                     className={`p-3 bg-white rounded-lg border-2 ${qrTimer <= 10 ? 'border-red-300 animate-pulse' : 'border-teal-100'} shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer flex flex-col items-center`}
                     aria-label="Enlarge QR Code"
                     disabled={!student?.roll_no || qrValue === "LOADING_QR" || qrValue === "INVALID_DATA" || qrValue === "WAITING_FOR_DATA"} // Added more robust disable check
                   >
                     <QRCodeCanvas
                       key={qrValue} // Ensure re-render when value changes
                       value={qrValue}
                       size={160}
                       level="H" // High error correction
                       bgColor="#FFFFFF"
                       fgColor="#0D9488" // Teal color
                       includeMargin={false}
                     />
                      <span className="flex items-center text-teal-600 font-medium text-xs mt-2">
                        <Maximize2Icon className="w-3 h-3 mr-1"/> Tap to enlarge
                      </span>
                   </motion.button>
                 </div>
               </div>

               {/* Tabs Section */}
               <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                 {/* Tab Buttons (Using teal theme) */}
                 <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b border-gray-200">
                   <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1">
                     <TabButton
                       label="Personal Info"
                       icon={UserIcon}
                       isActive={activeTab === "personal"}
                       onClick={() => setActiveTab("personal")}
                       activeColor="teal"
                     />
                     <TabButton
                       label="Hostel Info"
                       icon={HomeIcon}
                       isActive={activeTab === "hostel"}
                       onClick={() => setActiveTab("hostel")}
                       activeColor="teal"
                     />
                   </div>
                 </div>

                 {/* Tab Content */}
                 <div className="p-6 min-h-[300px]">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       transition={{ duration: 0.2 }}
                     >
                       {activeTab === "personal" && <PersonalInfoTab student={student} activeColor="teal"/>}
                       {/* Pass student data to HostelInfoTab */}
                       {activeTab === "hostel" && <HostelInfoTab student={student} activeColor="teal"/>}
                     </motion.div>
                   </AnimatePresence>
                 </div>
               </div>
             </motion.div>

           </div>

           {/* Footer */}
           <div className="mt-12 text-center text-gray-500 text-xs">
             <p>© {new Date().getFullYear()} Hostel Management System | Your Institute Name</p>
           </div>
         </div>
       </div>

       {/* QR Code Modal (Uses the dynamic qrValue) */}
        <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)}>
            <div className="p-6 sm:p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                    <QrCodeIcon className="w-7 h-7 text-teal-600 mr-2" />
                    <h2 className="text-2xl font-bold text-gray-800">Gate Entry/Exit QR Code</h2>
                </div>
                <p className="text-gray-600 mb-6">
                    Show this QR code to the security personnel at the gate.
                    {/* Note: Expiration is handled by backend validation based on the timestamp */}
                </p>
                 <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl border-4 border-teal-100 shadow-inner">
                        <QRCodeCanvas
                            key={qrValue} // Re-render if value changes (safe)
                            value={qrValue} // Use the current dynamic value state
                            size={300}
                            level="H"
                            bgColor="#f9fafb" // Light gray background
                            fgColor="#0D9488" // Teal color
                            includeMargin={true}
                        />
                    </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                     <p className="font-semibold text-lg text-gray-800 mb-1">{student.full_name}</p>
                     <p className="text-teal-700 text-base font-mono">{student.roll_no}</p>
                </div>
                 {/* Removed the separate refresh button, using automatic refresh */}
                <button
                    onClick={() => setIsQrModalOpen(false)}
                    className="mt-6 w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition duration-300 font-semibold"
                >
                    Close
                </button>
            </div>
        </Modal>
     </>
   );
 }


 // --- Helper Components for Tabs ---

 // Reusable Tab Button (Added activeColor prop)
 function TabButton({ label, icon: Icon, isActive, onClick, activeColor = "indigo" }) {
    const colorClasses = {
        indigo: {
            activeBg: 'bg-indigo-100',
            activeText: 'text-indigo-700',
            activeIcon: 'text-indigo-600',
        },
        teal: {
            activeBg: 'bg-teal-100',
            activeText: 'text-teal-700',
            activeIcon: 'text-teal-600',
        }
    };
    const currentColors = colorClasses[activeColor] || colorClasses.indigo;

   return (
     <button
       onClick={onClick}
       className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
         isActive
           ? `${currentColors.activeBg} ${currentColors.activeText} shadow-sm`
           : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
       }`}
     >
       <Icon className={`w-4 h-4 mr-2 ${isActive ? currentColors.activeIcon : 'text-gray-500'}`} />
       {label}
     </button>
   );
 }

 // Personal Info Tab Content (Added activeColor prop)
 function PersonalInfoTab({ student, activeColor = "indigo" }) {
   const colorClasses = {
        indigo: {
            heading: 'text-indigo-800',
            buttonBg: 'bg-indigo-600',
            buttonHoverBg: 'hover:bg-indigo-700',
        },
        teal: {
            heading: 'text-teal-800',
            buttonBg: 'bg-teal-600',
            buttonHoverBg: 'hover:bg-teal-700',
        }
    };
    const currentColors = colorClasses[activeColor] || colorClasses.indigo;
   return (
     <div>
       <h2 className="text-xl font-semibold text-gray-800 mb-5">Personal Information</h2>
       <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
           <InfoItem label="Full Name" value={student.full_name} />
           <InfoItem label="Roll Number" value={student.roll_no} />
           <InfoItem label="Degree" value={student.Degree} />
           <InfoItem label="Department" value={student.department} />
           <InfoItem label="Batch" value={student.batch} />
           <InfoItem label="Email Address" value={student.email} isEmail={true} />
         </div>

         <div className="mt-6 pt-6 border-t border-gray-200">
           <h3 className={`text-md font-semibold ${currentColors.heading} mb-2`}>Academic Resources</h3>
           <p className="text-gray-700 text-sm mb-3">
             Access your grades, course registrations, and other academic details via the official portal.
           </p>
           <a href="https://academic.iiti.ac.in/app/login" target="_blank" rel="noopener noreferrer" className="inline-block">
             <button className={`${currentColors.buttonBg} text-white py-2 px-5 rounded-lg ${currentColors.buttonHoverBg} transition duration-300 text-sm font-semibold`}>
               Visit Academic Portal
             </button>
           </a>
         </div>
       </div>
     </div>
   );
 }

 // Hostel Info Tab Content (Added activeColor prop and Unit Number)
 function HostelInfoTab({ student, activeColor = "indigo" }) {
     const colorClasses = {
        indigo: {
            heading: 'text-indigo-800',
            valueText: 'text-indigo-700',
            contactText: 'text-indigo-700',
            buttonBg: 'bg-amber-600', // Keep amber for 'not assigned'
            buttonHoverBg: 'hover:bg-amber-700',
            border: 'border-indigo-100',
        },
        teal: {
            heading: 'text-teal-800',
            valueText: 'text-teal-700',
            contactText: 'text-teal-700',
            buttonBg: 'bg-amber-600', // Keep amber for 'not assigned'
            buttonHoverBg: 'hover:bg-amber-700',
            border: 'border-teal-100',
        }
    };
    const currentColors = colorClasses[activeColor] || colorClasses.indigo;

   return (
     <div>
       <h2 className="text-xl font-semibold text-gray-800 mb-5">Hostel Information</h2>
       {/* Check if ANY crucial info is missing */}
       {!student.room_number && !student.hostel_block && !student.unit_no ? (
         <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
           <div className="text-5xl mb-4">🏘️</div>
           <h3 className="text-lg font-medium text-amber-800">Hostel Details Missing</h3>
           <p className="mt-2 text-amber-700 text-sm mb-4">
             Your hostel block, room number, or unit number is not currently assigned in the system. Please contact the hostel administration for assistance.
           </p>
           <button className={`${currentColors.buttonBg} text-white py-2 px-5 rounded-lg ${currentColors.buttonHoverBg} transition duration-300 text-sm font-semibold`}>
             Contact Administration
           </button>
         </div>
       ) : (
         <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
           {/* Room Details - Added Unit Number */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {/* Hostel Block */}
             <div className={`bg-white p-4 rounded-lg border ${currentColors.border} text-center shadow-sm`}>
               <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1 tracking-wider flex items-center justify-center">
                 <HomeIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Hostel Block
               </h3>
               <p className={`text-2xl font-bold ${currentColors.valueText}`}>{student.hostel_block || 'N/A'}</p>
             </div>
             {/* Room Number */}
             <div className={`bg-white p-4 rounded-lg border ${currentColors.border} text-center shadow-sm`}>
               <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1 tracking-wider flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Room Number
               </h3>
               <p className={`text-2xl font-bold ${currentColors.valueText}`}>{student.room_number || 'N/A'}</p>
             </div>
             {/* Unit Number - NEW */}
             <div className={`bg-white p-4 rounded-lg border ${currentColors.border} text-center shadow-sm`}>
               <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1 tracking-wider flex items-center justify-center">
                   <BuildingIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Unit Number
               </h3>
               <p className={`text-2xl font-bold ${currentColors.valueText}`}>{student.unit_no ?? 'N/A'}</p> {/* Use nullish coalescing for 0 or null/undefined */}
             </div>
           </div>

           {/* Current Status (No change needed here) */}
           <div>
             <h3 className={`text-md font-semibold ${currentColors.heading} mb-2`}>Current Status</h3>
             <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
               <div className="flex items-center">
                 <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${student.in_status ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                 <p className={`text-base font-medium ${student.in_status ? 'text-emerald-700' : 'text-amber-700'}`}>
                   {student.in_status ? 'Currently Inside Hostel' : 'Currently Outside Hostel'}
                 </p>
               </div>
             </div>
           </div>

           {/* Facilities & Contacts */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
             <div>
               <h3 className={`text-md font-semibold ${currentColors.heading} mb-2`}>Hostel Facilities</h3>
               <ul className="space-y-2 text-gray-700 text-sm bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                 {['Laundry Service', '24/7 WiFi Access', 'Common Room', 'Mess Facility'].map(facility => (
                    <li key={facility} className="flex items-center">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {facility}
                    </li>
                 ))}
               </ul>
             </div>
             <div>
               <h3 className={`text-md font-semibold ${currentColors.heading} mb-2`}>Emergency Contacts</h3>
               <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-1 text-sm shadow-sm">
                 <p><span className="font-medium text-gray-600">Hostel Warden:</span> <span className={`${currentColors.contactText}`}>+91 98765 43210</span></p>
                 <p><span className="font-medium text-gray-600">Security Desk:</span> <span className={`${currentColors.contactText}`}>+91 98765 43211</span></p>
                 <p><span className="font-medium text-gray-600">Emergency Line:</span> <span className={`${currentColors.contactText}`}>+91 98765 43212</span></p>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

 // Reusable Info Item Component (no change)
 function InfoItem({ label, value, isEmail = false }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
            <p className={`text-base font-medium text-gray-800 ${isEmail ? 'truncate' : ''}`} title={value || 'N/A'}>
                {value || <span className="text-gray-400 italic">Not Provided</span>}
            </p>
        </div>
    );
 }