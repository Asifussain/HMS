"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheetIcon, UploadIcon, CheckCircleIcon, XCircleIcon, FileIcon } from "lucide-react";

export default function SpreadsheetUpload() {
  const [fileContent, setFileContent] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const fileInputRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // When a file is selected, read it as text
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset states when a new file is selected
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setUploadStatus("");
    setIsSuccess(false);
    setIsError(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
      setSelectedFileName(file.name);
    };
    reader.readAsText(file);
  };

  // When the admin clicks "Upload CSV", send the file content to the API
  const handleUpload = async () => {
    if (!fileContent) {
      setUploadStatus("Please select a CSV file first.");
      setIsError(true);
      statusTimeoutRef.current = setTimeout(() => {
        setUploadStatus("");
        setIsError(false);
      }, 5000);
      return;
    }
    
    setIsUploading(true);
    
    try {
      const res = await fetch("/api/admin/uploadStudents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: fileContent }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
        setUploadStatus(`Upload successful! Processed ${data.successCount} rows.`);
        if (data.errors && data.errors.length > 0) {
          setUploadStatus((prev) => `${prev} Errors: ${data.errors.join(" | ")}`);
          setIsError(true);
        }
      } else {
        setIsError(true);
        setUploadStatus(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setIsError(true);
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      
      // Clear the status after 5 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setUploadStatus("");
        setIsSuccess(false);
        setIsError(false);
      }, 5000);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFileContent("");
    setSelectedFileName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Data Integration
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Upload and process student data spreadsheets
              </p>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center mt-2 md:mt-0"
            >
              <FileSpreadsheetIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-700">Secure CSV Processing</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md md:max-w-xl mx-auto"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="
              bg-gradient-to-br from-green-50 to-green-100
              border border-gray-200
              rounded-xl 
              shadow-lg 
              hover:shadow-xl 
              p-6 md:p-8
              group
              relative
              overflow-hidden
            "
          >
            {/* Background decorative elements */}
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <FileSpreadsheetIcon className="w-32 h-32 text-green-800" />
              </motion.div>
            </div>
            
            <div className="absolute -bottom-12 -left-12 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              >
                <FileSpreadsheetIcon className="w-40 h-40 text-green-800" />
              </motion.div>
            </div>
            
            {/* Header section */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <motion.div 
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="bg-green-200 text-green-700 p-3 rounded-xl shadow-md"
              >
                <FileSpreadsheetIcon className="w-8 h-8" />
              </motion.div>
            </div>
            
            <h3 className="text-xl md:text-2xl font-semibold mb-3 text-gray-800 relative z-10">
              CSV Student Data Upload
            </h3>
            <p className="mb-6 text-gray-600 relative z-10">
              Upload a CSV file to import and process student records
            </p>

            {/* File Input */}
            <div className="mb-5 relative z-10">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="hidden" 
                id="csv-upload"
                ref={fileInputRef}
              />
              <label 
                htmlFor="csv-upload" 
                className="
                  w-full 
                  flex 
                  items-center 
                  justify-center 
                  py-4
                  px-4 
                  border 
                  border-dashed 
                  border-green-300 
                  rounded-lg 
                  text-green-600 
                  hover:bg-green-50 
                  cursor-pointer
                  transition-all
                  duration-300
                  group-hover:border-green-400
                "
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 2 }}
                  className="flex items-center"
                >
                  {selectedFileName ? (
                    <>
                      <FileIcon className="mr-2 w-5 h-5" />
                      <span className="truncate max-w-xs">{selectedFileName}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault();
                          resetFileInput();
                        }}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 w-5 h-5" />
                      <span>Select CSV File</span>
                    </>
                  )}
                </motion.div>
              </label>
            </div>

            {/* Upload Button */}
            <motion.button 
              onClick={handleUpload} 
              disabled={!fileContent || isUploading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                w-full 
                py-4 
                px-4 
                rounded-lg 
                font-semibold 
                transition-all
                duration-300
                flex 
                items-center 
                justify-center
                relative
                overflow-hidden
                ${!fileContent || isUploading 
                  ? 'bg-green-400 cursor-not-allowed text-white/80' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'}
              `}
            >
              {isUploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 w-5 h-5" />
                  <span>Upload CSV</span>
                </>
              )}
            </motion.button>

            {/* Status Message */}
            <AnimatePresence>
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`
                    mt-4 
                    text-center 
                    text-sm 
                    font-medium 
                    py-3
                    px-4 
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    ${isError 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : isSuccess 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'}
                  `}
                >
                  {isError ? (
                    <XCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  ) : isSuccess ? (
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  ) : (
                    <FileSpreadsheetIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  )}
                  <span>{uploadStatus}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Extra info/help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center text-sm text-gray-500"
          >
            <p>Only CSV files are supported. For help with formatting, contact support.</p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}