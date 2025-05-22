"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, UserCheck, UserX, AlertCircle, ShieldCheck, 
  Calendar, MapPin, Mail, Phone, User, Clock, CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function StudentProfileGuardView({ searchParams }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccessLog, setShowAccessLog] = useState(false);
  const rollNo = searchParams?.rollNo;

  useEffect(() => {
    async function fetchStudentData() {
      if (!rollNo) {
        setError("No roll number provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/student?rollNo=${rollNo}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch student data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStudent(data);
        // Show access log with delay for animation
        setTimeout(() => setShowAccessLog(true), 800);
      } catch (err) {
        console.error("Error fetching student:", err);
        setError(err.message || "Failed to load student data");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [rollNo]);

  // Sample access log data - would be replaced with actual data
  const accessLogs = [
    {
      dateTime: new Date(),
      type: "Entry",
      checkpoint: "Main Gate",
      status: "Approved"
    },
    {
      dateTime: new Date(Date.now() - 86400000),
      type: "Exit",
      checkpoint: "Hostel Gate",
      status: "Approved"
    },
    {
      dateTime: new Date(Date.now() - 172800000),
      type: "Entry",
      checkpoint: "Academic Block",
      status: "Approved"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100">
        <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-6 text-lg text-gray-700 font-medium">Loading student profile...</p>
          <div className="mt-2 w-48 h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-indigo-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 p-4">
        <div className="bg-white border-l-4 border-red-500 rounded-lg p-6 max-w-lg w-full shadow-lg animate-fade-in">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500 mr-4" />
            <h2 className="text-red-700 text-xl font-semibold">Error</h2>
          </div>
          <p className="mt-3 text-gray-600">{error}</p>
          <div className="mt-5">
            <Link href="/guard/status-info" 
              className="flex items-center justify-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Status Info
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 p-4">
        <div className="bg-white border-l-4 border-yellow-500 rounded-lg p-6 max-w-lg w-full shadow-lg animate-fade-in">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mr-4" />
            <h2 className="text-yellow-700 text-xl font-semibold">No Student Found</h2>
          </div>
          <p className="mt-3 text-gray-600">No student found with roll number: {rollNo}</p>
          <div className="mt-5">
            <Link href="/guard/status-info" 
              className="flex items-center justify-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Status Info
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine status for guard's view
  const inStatus = student.in_status !== undefined ? student.in_status : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Navigation Bar with subtle gradient */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white py-3 px-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-xl font-bold">Guard Dashboard</h1>
          </div>
          <div className="flex items-center text-sm bg-indigo-800 bg-opacity-30 py-1 px-3 rounded-full">
            <Clock className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        {/* Navigation Breadcrumb with hover effect */}
        <div className="mb-6 animate-fade-in">
          <Link 
            href="/guard/status-info" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Status Info
          </Link>
        </div>
        
        {/* Main Content Grid with staggered fade-in */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Identity */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 animate-fade-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
              <h2 className="text-xl font-bold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Student Identity
              </h2>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full h-16 w-16 flex items-center justify-center mr-4 shadow-md">
                    <span className="text-2xl font-bold text-white">
                      {(student.full_name || student.name || "").charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{student.full_name || student.name}</h3>
                    <p className="text-gray-500 flex items-center">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs py-1 px-2 rounded-md mr-2">ID</span>
                      {student.roll_no}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center ${inStatus ? 'text-green-600' : 'text-red-600'} font-bold px-3 py-1 rounded-full ${inStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                  {inStatus ? <UserCheck className="w-5 h-5 mr-1" /> : <UserX className="w-5 h-5 mr-1" />}
                  {inStatus ? "In Campus" : "Off Campus"}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-gray-600 mr-2">Batch:</span>
                  <span className="font-medium">{student.batch || "Not Available"}</span>
                </div>
                
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-gray-600 mr-2">Department:</span>
                  <span className="font-medium">{student.department || "Not Available"}</span>
                </div>
                
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <MapPin className="w-5 h-5 text-indigo-500 mr-3" />
                  <span className="text-gray-600 mr-2">Degree:</span>
                  <span className="font-medium">{student.Degree || "Not Available"}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle Column - Hostel Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 animate-fade-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
              <h2 className="text-xl font-bold flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Hostel Information
              </h2>
            </div>
            
            <div className="p-5">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-5 mb-4 border border-indigo-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="transform transition-all hover:scale-105">
                      <p className="text-sm text-indigo-600 font-medium">Hostel Block</p>
                      <p className="font-bold text-lg text-gray-800">{student.hostel_block || "Not Assigned"}</p>
                    </div>
                    <div className="transform transition-all hover:scale-105">
                      <p className="text-sm text-indigo-600 font-medium">Room Number</p>
                      <p className="font-bold text-lg text-gray-800">{student.room_number || "Not Assigned"}</p>
                    </div>
                    <div className="transform transition-all hover:scale-105">
                      <p className="text-sm text-indigo-600 font-medium">Floor Number</p>
                      <p className="font-bold text-lg text-gray-800">{student.Floor_no || "Not Available"}</p>
                    </div>
                    <div className="transform transition-all hover:scale-105">
                      <p className="text-sm text-indigo-600 font-medium">Unit Number</p>
                      <p className="font-bold text-lg text-gray-800">{student.unit_no || "Not Available"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Emergency Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 animate-fade-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
              <h2 className="text-xl font-bold flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergency Information
              </h2>
            </div>
            
            <div className="p-5">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3">Contact Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Mail className="w-5 h-5 text-indigo-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{student.email || `${student.roll_no}@iiti.ac.in`}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Phone className="w-5 h-5 text-indigo-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className={`font-medium ${!student.emergency_contact ? "text-yellow-600" : ""}`}>
                          {student.emergency_contact || "Not Available"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                      <User className="w-5 h-5 text-indigo-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-medium">{student.gender || "Not Specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Notes with subtle animation */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border-l-4 border-yellow-400 transform transition-all hover:shadow-md">
                  <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                    Important Notes
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {student.additional_info || "No special instructions for this student."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Access Log Section with fade-in and expand animation */}
        <div className={`mt-8 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-500 ${showAccessLog ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0'}`}>
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Access Log
            </h2>
          </div>
          
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry/Exit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkpoint</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.dateTime.toLocaleDateString()} {log.dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === "Entry" ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.checkpoint}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-gradient-to-r from-indigo-800 to-indigo-900 mt-12 py-6 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-indigo-200 font-medium">Indian Institute of Technology Indore</p>
          <p className="text-indigo-300 text-sm mt-1">&copy; {new Date().getFullYear()} IIT Indore - Guard Portal</p>
        </div>
      </footer>

      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}