"use client";

 import { useEffect, useState, useRef, useCallback } from "react";
 import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from "html5-qrcode"; // Import state enum
 import { motion, AnimatePresence } from "framer-motion";
 import {
   QrCodeIcon,
   CheckCircleIcon,
   XCircleIcon,
   InfoIcon,
   Loader2Icon,
   UserCheckIcon,
   UserXIcon,
   ScanLineIcon,
   CameraOffIcon,
 } from "lucide-react";

 const MESSAGE_TYPES = {
    NONE: 'none',
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
 };

 // Configuration for polling the DOM element
 const RENDER_DELAY = 100; // ms to wait between checks for the element
 const MAX_RENDER_ATTEMPTS = 10; // Max attempts to find the element

 export default function CheckInOut() {
   const [scannedRoll, setScannedRoll] = useState("");
   const [studentDetails, setStudentDetails] = useState(null);
   const [message, setMessage] = useState("");
   const [messageType, setMessageType] = useState(MESSAGE_TYPES.NONE);
   const [isScanning, setIsScanning] = useState(true); // Start scanning initially
   const [isLoadingStatus, setIsLoadingStatus] = useState(false);
   const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
   const [scannerError, setScannerError] = useState("");

   const scannerRef = useRef(null); // Ref to the Html5QrcodeScanner instance
   const stopScannerTimeoutRef = useRef(null); // Ref for cleanup timeout

   // --- Message Helper ---
   const showMessage = (text, type = MESSAGE_TYPES.INFO) => {
        setMessage(text);
        setMessageType(type);
   };

   // --- Scanner Cleanup ---
   const cleanupScanner = useCallback(async (attemptCleanup = true) => {
        // Clear any pending cleanup timeouts
        if (stopScannerTimeoutRef.current) {
            clearTimeout(stopScannerTimeoutRef.current);
            stopScannerTimeoutRef.current = null;
        }

        if (!attemptCleanup || !scannerRef.current) {
            // If cleanup is disabled or no scanner instance exists
            console.log("Cleanup skipped or no scanner instance.");
            scannerRef.current = null; // Ensure ref is nullified
            return;
        }

        const scannerInstance = scannerRef.current;
        scannerRef.current = null; // Nullify ref immediately to prevent race conditions

        try {
            const state = scannerInstance.getState();
             console.log("Scanner state before cleanup:", Html5QrcodeScannerState[state] || state);

            // Only attempt actions if the scanner is in a state that allows them
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                console.log("Attempting to stop scanner...");
                await scannerInstance.clear(); // Stops scanning and clears UI
                console.log("Scanner cleared successfully via clear().");
            } else if (state === Html5QrcodeScannerState.NOT_STARTED) {
                console.log("Scanner was not started, no cleanup needed.");
            } else {
                 console.log("Scanner in intermediate state, cleanup might be partial.");
                 // Depending on the library version, further cleanup might be needed
            }

        } catch (error) {
            console.error("Error during scanner cleanup:", error);
            // Avoid showing error to user for cleanup issues unless necessary
            // showMessage("Warning: Could not properly stop the scanner.", MESSAGE_TYPES.WARNING);
        }
   }, []);


   // --- Effect to Manage Scanner Lifecycle ---
   useEffect(() => {
    if (!isScanning) {
        cleanupScanner();
        return;
    }

    let attempts = 0;
    setScannerError("");

    const initScanner = () => {
        if (scannerRef.current) {
            console.log("Scanner already initialized.");
            return;
        }

        const readerElement = document.getElementById("qr-reader");

        if (readerElement) {
            console.log("Scanner UI element found. Initializing scanner...");

             if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                 setScannerError("Camera access is not supported or was denied.");
                 setIsScanning(false);
                 return;
             }

            const config = {
                fps: 5,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [0 /* SCAN_TYPE_CAMERA */],
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            };

            const html5Scanner = new Html5QrcodeScanner("qr-reader", config, false);
            scannerRef.current = html5Scanner;

            const onScanSuccess = (decodedText) => {
                // --- Same onScanSuccess logic as before ---
                if (!scannerRef.current) return;
                console.log("Raw Scan success:", decodedText);
                if (!decodedText || decodedText.length < 3) {
                     showMessage("Scanned invalid data. Please scan a valid student QR code.", MESSAGE_TYPES.WARNING);
                     return;
                }
                const currentScanner = scannerRef.current;
                scannerRef.current = null;
                showMessage("QR Code detected! Processing...", MESSAGE_TYPES.INFO);
                stopScannerTimeoutRef.current = setTimeout(async () => {
                     try {
                        if (currentScanner && currentScanner.getState() === Html5QrcodeScannerState.SCANNING) {
                             await currentScanner.clear();
                             console.log("Scanner stopped after successful scan.");
                         }
                     } catch (err) {
                         console.error("Error stopping scanner post-success:", err);
                     }
                    setIsScanning(false);
                    setIsLoadingStatus(true);
                    setScannedRoll(decodedText);
                    setStudentDetails(null);
                    fetchStudentStatus(decodedText);
                }, 50);
                // --- End of onScanSuccess logic ---
            };

            const onScanFailure = (error) => {
                // console.warn(`QR Scan Failure: ${error}`); // Keep this minimal
            };

            // --- CORRECTED RENDER CALL ---
            try {
                // Start scanning - No .catch() here!
                html5Scanner.render(onScanSuccess, onScanFailure);
                console.log("Scanner rendering process initiated.");
                 // Clear placeholder once render is likely initiated
                const placeholder = readerElement.querySelector('.scanner-placeholder');
                if(placeholder) placeholder.style.display = 'none';

            } catch (renderError) {
                // Catch potential synchronous errors during the render call itself
                console.error("Error directly calling html5Scanner.render():", renderError);
                setScannerError("Failed to initialize the scanner component. Please check permissions and refresh.");
                setIsScanning(false);
                scannerRef.current = null;
            }
            // --- END OF CORRECTION ---

        } else {
            // --- Same polling logic as before ---
            attempts++;
            if (attempts < MAX_RENDER_ATTEMPTS) {
                 console.log(`Scanner UI element not found yet. Attempt ${attempts}. Retrying in ${RENDER_DELAY}ms...`);
                setTimeout(initScanner, RENDER_DELAY);
            } else {
                console.error("Scanner UI element (#qr-reader) not found after multiple attempts.");
                setScannerError("Failed to load scanner UI. Please refresh the page.");
                setIsScanning(false);
            }
            // --- End of polling logic ---
        }
    };

    initScanner(); // Start initialization attempts

    return () => {
        console.log("Scanner effect cleanup triggered.");
        cleanupScanner(true); // Force cleanup on unmount or when isScanning becomes false
    };
}, [isScanning, cleanupScanner]); // Include cleanupScanner

// --- Rest of the component remains the same ---
// fetchStudentStatus, updateInStatus, resetScanner, getButtonProps, return(...)

   // --- Fetch Student Status Logic (Separated Function) ---
   const fetchStudentStatus = async (rollNo) => {
        showMessage(`Workspaceing status for Roll No: ${rollNo}...`, MESSAGE_TYPES.INFO);
        try {
            const res = await fetch(`/api/guard/getInStatus?roll_no=${rollNo}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            if (data.error) throw new Error(data.error);

             if (data.not_found) {
                showMessage(`Student with Roll No: ${rollNo} not found.`, MESSAGE_TYPES.ERROR);
                setStudentDetails(null);
            } else {
                setStudentDetails(data);
                showMessage(`Status fetched for ${data.full_name || rollNo}.`, MESSAGE_TYPES.SUCCESS);
            }
        } catch (error) {
            console.error("Error fetching student status:", error);
            showMessage(`Error fetching status: ${error.message}`, MESSAGE_TYPES.ERROR);
            setStudentDetails(null);
        } finally {
            setIsLoadingStatus(false);
        }
   };


   // --- Update Status Logic (No major changes needed) ---
   const updateInStatus = async (newStatus) => {
        if (!scannedRoll || !studentDetails) {
            showMessage("No valid student data available to update.", MESSAGE_TYPES.ERROR);
            return;
        }
        setIsUpdatingStatus(true);
        const action = newStatus ? "Checking In" : "Checking Out";
        showMessage(`${action} ${studentDetails.full_name || scannedRoll}...`, MESSAGE_TYPES.INFO);
        try {
            const res = await fetch("/api/guard/updateInStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roll_no: scannedRoll, in_status: newStatus }),
            });
            const responseBody = await res.json();
            if (!res.ok) throw new Error(responseBody.error || `Server error ${res.status}`);
            if (responseBody.error) throw new Error(responseBody.error);

            setStudentDetails(prev => ({ ...prev, in_status: newStatus }));
            showMessage(`Successfully ${newStatus ? "Checked In" : "Checked Out"} ${studentDetails.full_name || scannedRoll}.`, MESSAGE_TYPES.SUCCESS);
        } catch (error) {
            console.error("Error updating status:", error);
            showMessage(`Error updating status: ${error.message}`, MESSAGE_TYPES.ERROR);
        } finally {
            setIsUpdatingStatus(false);
        }
   };

   // --- Reset Function ---
   const resetScanner = () => {
        console.log("Resetting scanner...");
        // 1. Clean up the existing scanner instance forcefully
        cleanupScanner(true); // Pass true to ensure cleanup attempt

        // 2. Reset all relevant states
        setScannedRoll("");
        setStudentDetails(null);
        setMessage("");
        setMessageType(MESSAGE_TYPES.NONE);
        setIsLoadingStatus(false);
        setIsUpdatingStatus(false);
        setScannerError("");

        // 3. Set scanning to true to trigger the effect again
        setIsScanning(true);
   };

   // --- Button Props --- (No changes needed)
   const getButtonProps = () => {
        if (!studentDetails) return { text: "N/A", icon: InfoIcon, disabled: true, className: 'bg-gray-400 cursor-not-allowed' };
        const isInside = studentDetails.in_status;
        return {
            text: isInside ? "Check Out" : "Check In",
            icon: isInside ? UserXIcon : UserCheckIcon,
            disabled: isLoadingStatus || isUpdatingStatus,
            className: isInside
                ? 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
        };
   };
   const buttonProps = getButtonProps();

   // --- Render Logic ---
   return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-100 flex flex-col items-center justify-center p-4 antialiased">

            <motion.div
                layout // Animate layout changes
                transition={{ type: "spring", stiffness: 300, damping: 30 }} // Spring animation for layout changes
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                 {/* Header */}
                 <div className="bg-gradient-to-r from-indigo-700 to-purple-600 p-5 text-white text-center shadow-md">
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center">
                         <ScanLineIcon className="w-6 h-7 mr-2 flex-shrink-0" /> Guard Check-In/Out
                    </h1>
                    {/* <p className="text-xs text-indigo-200 mt-1">Scan QR Code to manage student entry/exit.</p> */}
                 </div>

                 <div className="p-6 md:p-8 relative"> {/* Added relative positioning */}
                    {/* Message Area - Adjusted for better layout */}
                    <div className="absolute top-0 left-6 right-6 -mt-3 z-10"> {/* Position message above content */}
                         <AnimatePresence>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className={`p-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center shadow-lg border ${
                                        messageType === MESSAGE_TYPES.SUCCESS ? 'bg-green-100 border-green-300 text-green-800' :
                                        messageType === MESSAGE_TYPES.ERROR ? 'bg-red-100 border-red-300 text-red-800' :
                                        messageType === MESSAGE_TYPES.WARNING ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                                        'bg-blue-100 border-blue-300 text-blue-800'
                                    }`}
                                >
                                    {messageType === MESSAGE_TYPES.SUCCESS && <CheckCircleIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                                    {messageType === MESSAGE_TYPES.ERROR && <XCircleIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                                    {messageType === MESSAGE_TYPES.WARNING && <InfoIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                                    {messageType === MESSAGE_TYPES.INFO && <InfoIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                                    <span className="text-center">{message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    {/* Scanner / Results Area - Added padding-top to account for message */}
                    <div className="pt-10">
                        <AnimatePresence mode="wait">
                            {isScanning ? (
                                <motion.div
                                    key="scanner"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center"
                                >
                                    <p className="text-gray-500 text-sm mb-3 text-center">Place the student's QR code within the frame.</p>
                                    <div id="qr-reader" className="w-full max-w-xs sm:max-w-sm border-4 border-dashed border-indigo-200 rounded-lg overflow-hidden shadow-inner bg-gray-50 min-h-[250px] flex items-center justify-center">
                                        {/* Scanner will be rendered here by the library */}
                                        {scannerError && (
                                            <div className="p-4 flex flex-col items-center justify-center text-red-600">
                                                <CameraOffIcon className="w-10 h-10 mb-2" />
                                                <p className="text-center text-sm font-medium">{scannerError}</p>
                                            </div>
                                        )}
                                         {/* Placeholder/Loading text while scannerError is empty */}
                                         {!scannerError && (
                                            <div className="p-4 flex flex-col items-center justify-center text-gray-400">
                                                <Loader2Icon className="w-8 h-8 animate-spin mb-2" />
                                                <p className="text-center text-xs">Initializing Scanner...</p>
                                             </div>
                                         )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center"
                                >
                                    {isLoadingStatus ? (
                                        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                            <Loader2Icon className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                                            <p className="text-sm">Loading Student Details...</p>
                                        </div>
                                    ) : studentDetails ? (
                                        <div className="space-y-4">
                                            {/* Student Details Display */}
                                            <InfoDisplay label="Roll Number" value={studentDetails.roll_no} isMono={true}/>
                                            <InfoDisplay label="Name" value={studentDetails.full_name || 'N/A'} />
                                             <InfoDisplay label="Current Status">
                                                 <StatusBadge isInside={studentDetails.in_status} />
                                             </InfoDisplay>

                                            {/* Action Button */}
                                            <button
                                                style={{ minWidth: '150px' }}
                                                className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 mt-3 text-base text-white font-semibold rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${buttonProps.className} ${isUpdatingStatus ? 'animate-pulse' : ''} focus:ring-indigo-500`}
                                                onClick={() => updateInStatus(!studentDetails.in_status)}
                                                disabled={buttonProps.disabled}
                                                aria-live="polite" // Announce changes for screen readers
                                            >
                                                {isUpdatingStatus ? (
                                                    <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                                                ) : (
                                                    <buttonProps.icon className="w-5 h-5 mr-2" />
                                                )}
                                                <span>{isUpdatingStatus ? (studentDetails.in_status ? 'Checking Out...' : 'Checking In...') : buttonProps.text}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        // Case: Loading finished, but no student details (error message shown above)
                                        <div className="p-6 text-center text-gray-500">
                                            <InfoIcon className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                                            <p className="text-sm">Cannot display student details.</p>
                                        </div>
                                    )}

                                    {/* Scan Another Button */}
                                    {!isLoadingStatus && (
                                        <button
                                            style={{ minWidth: '150px' }}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            onClick={resetScanner}
                                        >
                                            <QrCodeIcon className="w-5 h-5 mr-2" />
                                            Scan Another
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                 </div>
            </motion.div>

            <p className="text-xs text-gray-400 mt-6">© {new Date().getFullYear()} HMS</p>
        </div>
   );
 }


 // --- Helper Components ---

 function InfoDisplay({ label, value, children, isMono = false }) {
    return (
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            {value !== undefined && (
                <p className={`text-lg font-semibold text-gray-800 ${isMono ? 'font-mono' : ''}`}>
                    {value}
                 </p>
            )}
            {children}
        </div>
    );  
 }

 function StatusBadge({ isInside }) {
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block shadow-sm border ${
            isInside
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-amber-100 text-amber-800 border-amber-200'
        }`}>
            {isInside ? "Inside Hostel" : "Outside Hostel"}
        </span>
    );
 }