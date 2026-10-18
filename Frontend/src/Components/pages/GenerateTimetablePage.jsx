// import React, { useState, useEffect, useRef } from "react";
// import axios from "../../axiosConfig.js";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "../../Context/authContext.jsx";
// import { useNavigate } from "react-router-dom";

// const GenerateTimetablePage = () => {
//   const [classes, setClasses] = useState([]);
//   const [timetables, setTimetables] = useState([]);
//   const [selectedClassId, setSelectedClassId] = useState("all"); // Default to "all" for all classes
//   const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
//     useState("");
//   const [loading, setLoading] = useState(true);
//   const [generationLoading, setGenerationLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [generationMessage, setGenerationMessage] = useState(null);
//   const [generatedTimetable, setGeneratedTimetable] = useState([]);

//   // These states are not directly used in the renderGeneratedTimetable logic for all subjects/rooms,
//   // but kept for completeness if needed elsewhere or for future features.
//   const [allSubjects, setAllSubjects] = useState([]);
//   const [allRooms, setAllRooms] = useState([]);

//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // Use refs for maps to avoid re-creating on every render and ensure stable references
//   const subjectMap = useRef(new Map());
//   const roomMap = useRef(new Map());
//   const timetableSchemaMap = useRef(new Map());
//   const classMap = useRef(new Map());

//   // --- Fetch All Necessary Data on Mount ---
//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Fetch classes and populate map
//         const classesRes = await axios.get("/api/class/");
//         setClasses(classesRes.data);
//         classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

//         // Fetch timetable schemas and populate map
//         const timetablesRes = await axios.get("/api/timetable/");
//         setTimetables(timetablesRes.data);
//         timetablesRes.data.forEach((tt) =>
//           timetableSchemaMap.current.set(tt._id, tt)
//         );

//         // Fetch subjects and populate map
//         const subjectsRes = await axios.get("/api/subject/");
//         setAllSubjects(subjectsRes.data);
//         subjectsRes.data.forEach((sub) => subjectMap.current.set(sub._id, sub));

//         // Fetch rooms and populate map
//         const roomsRes = await axios.get("/api/room/");
//         setAllRooms(roomsRes.data);
//         roomsRes.data.forEach((room) => roomMap.current.set(room._id, room));

//         // Set initial selected schema if available
//         if (timetablesRes.data.length > 0) {
//           setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
//         }
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             "Failed to fetch necessary data (classes, timetables, subjects, rooms)."
//         );
//         console.error("Error fetching data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [user, navigate]);

//   // Handle class change
//   const handleClassChange = (e) => {
//     setSelectedClassId(e.target.value);
//     setGeneratedTimetable([]); // Clear previous timetable when class selection changes
//     setGenerationMessage(null);
//   };

//   // Handle timetable schema change
//   const handleSchemaChange = (e) => {
//     setSelectedTimetableSchemaId(e.target.value);
//     setGeneratedTimetable([]); // Clear previous timetable when schema selection changes
//     setGenerationMessage(null);
//   };

//   // --- Handle Timetable Generation Submission ---
//   const handleGenerateSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setGenerationMessage(null);
//     setGeneratedTimetable([]);

//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     if (!selectedTimetableSchemaId) {
//       setError("Please select a Timetable Schema.");
//       return;
//     }

//     try {
//       setGenerationLoading(true);
//       let endpoint = "";
//       let payload = { timetableSchemaId: selectedTimetableSchemaId };

//       if (selectedClassId === "all") {
//         // Endpoint for generating for all classes
//         endpoint = `/api/generate/generate/by-schema/${selectedTimetableSchemaId}`;
//         console.log(
//           `Generating for ALL Classes using schema: ${selectedTimetableSchemaId}`
//         );
//       } else {
//         // Endpoint for generating for a specific class
//         endpoint = `/api/generate/generate/${selectedClassId}`;
//         // The backend expects timetableSchemaId in the body for specific class generation
//         payload = { ...payload, classId: selectedClassId };
//         console.log(
//           `Generating for Class ${selectedClassId} using schema: ${selectedTimetableSchemaId}`
//         );
//       }

//       const res = await axios.post(endpoint, payload);

//       setGenerationMessage(
//         res.data.message || "Timetable generated successfully!"
//       );
//       setGeneratedTimetable(res.data.timetable || []);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Failed to generate timetable. Please check inputs and server logs."
//       );
//       console.error("Timetable generation error:", err);
//     } finally {
//       setGenerationLoading(false);
//     }
//   };

//   // --- Render Generated Timetable for a Single Class ---
//   const renderClassTimetable = (classId, timetableEntries, selectedSchema) => {
//     const currentClass = classMap.current.get(classId);
//     if (!currentClass) return null;

//     const sortedTimeSlots = [...selectedSchema.slots].sort((a, b) => {
//       const timeA = new Date(`2000/01/01 ${a.startTime}`);
//       const timeB = new Date(`2000/01/01 ${b.startTime}`);
//       return timeA - timeB;
//     });

//     const organizedTimetable = {};
//     selectedSchema.days.forEach((day) => {
//       organizedTimetable[day] = {};
//       sortedTimeSlots.forEach((slot) => {
//         organizedTimetable[day][slot.startTime] = [];
//       });
//     });

//     timetableEntries.forEach((entry) => {
//       const subjectDetails = subjectMap.current.get(entry.subject);
//       const roomDetails = roomMap.current.get(entry.room);
//       const facultyName = entry.facultyName || "Unknown Faculty";

//       if (
//         organizedTimetable[entry.day] &&
//         organizedTimetable[entry.day][entry.startTime]
//       ) {
//         organizedTimetable[entry.day][entry.startTime].push({
//           batchName: entry.batchName,
//           subjectName: subjectDetails
//             ? `${subjectDetails.name}`
//             : "Unknown Subject",
//           subjectCode: subjectDetails ? subjectDetails.code : "",
//           subjectType: subjectDetails ? subjectDetails.type : "Unknown Type",
//           facultyName: facultyName,
//           roomName: roomDetails ? roomDetails.name : "Unknown Room",
//         });
//       }
//     });

//     const headerDays = selectedSchema.days;

//     return (
//       <div
//         key={classId}
//         className="mb-12 p-4 bg-white rounded-lg shadow-md font-inter"
//       >
//         <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
//           Timetable for {currentClass.name} ({currentClass.year})
//         </h3>
//         <div className="border border-gray-300 rounded-lg overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-300">
//             <thead className="bg-blue-600 text-white">
//               <tr>
//                 <th className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-24 sticky left-0 bg-blue-600">
//                   Time
//                 </th>
//                 {headerDays.map((day) => (
//                   <th
//                     key={day}
//                     className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
//                   >
//                     {day}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {sortedTimeSlots.map((slot, slotIndex) => {
//                 if (slot.type === "break") {
//                   return (
//                     <tr
//                       key={slot.startTime}
//                       className="bg-yellow-100 font-semibold text-yellow-800"
//                     >
//                       <td className="px-3 py-2 text-center whitespace-nowrap border-r border-gray-300 sticky left-0 bg-yellow-100">
//                         {slot.startTime} - {slot.endTime}
//                       </td>
//                       {headerDays.map((day) => (
//                         <td
//                           key={`break-${day}-${slot.startTime}`}
//                           className="px-3 py-2 text-center border-r border-gray-300"
//                         >
//                           Lunch Break
//                         </td>
//                       ))}
//                     </tr>
//                   );
//                 }

//                 return (
//                   <tr
//                     key={slot.startTime}
//                     className={slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
//                   >
//                     <td className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit">
//                       {slot.startTime} - {slot.endTime}
//                     </td>
//                     {headerDays.map((day) => (
//                       <td
//                         key={`${day}-${slot.startTime}`}
//                         className="px-3 py-2 border-r border-gray-200 align-top"
//                       >
//                         {organizedTimetable[day][slot.startTime]?.length > 0 ? (
//                           organizedTimetable[day][slot.startTime].map(
//                             (assignment, idx) => (
//                               <div
//                                 key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
//                                 className="mb-1 p-2 border border-dashed border-indigo-200 rounded-md bg-indigo-50 shadow-sm text-xs text-left last:mb-0"
//                               >
//                                 <p className="font-bold text-indigo-800">
//                                   {assignment.subjectName} (
//                                   {assignment.subjectCode})
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Batch:{" "}
//                                   <span className="font-medium">
//                                     {assignment.batchName}
//                                   </span>
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Faculty:{" "}
//                                   <span className="font-medium">
//                                     {assignment.facultyName}
//                                   </span>
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Room:{" "}
//                                   <span className="font-medium">
//                                     {assignment.roomName} (
//                                     {assignment.subjectType === "lecture"
//                                       ? "Lec"
//                                       : assignment.subjectType === "lab"
//                                       ? "Lab"
//                                       : "Tut"}
//                                     )
//                                   </span>
//                                 </p>
//                               </div>
//                             )
//                           )
//                         ) : (
//                           <div className="text-center text-gray-400 text-xs py-2">
//                             -
//                           </div>
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   // --- Main Render Function for All Timetables ---
//   const renderAllTimetables = () => {
//     if (!generatedTimetable || generatedTimetable.length === 0) {
//       return (
//         <p className="text-center text-gray-600 mt-8">
//           No timetable generated yet.
//         </p>
//       );
//     }

//     const selectedSchema = timetableSchemaMap.current.get(
//       selectedTimetableSchemaId
//     );
//     if (!selectedSchema) {
//       return (
//         <p className="text-red-500 text-center mt-8">
//           Error: Selected timetable schema details not found.
//         </p>
//       );
//     }

//     // Get unique class IDs from the generated timetable
//     const uniqueClassIds = [
//       ...new Set(generatedTimetable.map((entry) => entry.classId)),
//     ];

//     // If "All Classes" is selected, render a timetable for each unique class
//     if (selectedClassId === "all") {
//       return (
//         <div className="mt-8">
//           <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
//             Consolidated Timetable for All Classes
//           </h2>
//           {uniqueClassIds.map((classId) => {
//             const classEntries = generatedTimetable.filter(
//               (entry) => entry.classId === classId
//             );
//             return renderClassTimetable(classId, classEntries, selectedSchema);
//           })}
//         </div>
//       );
//     } else {
//       // If a specific class is selected, render only its timetable
//       const classEntries = generatedTimetable.filter(
//         (entry) => entry.classId === selectedClassId
//       );
//       return renderClassTimetable(
//         selectedClassId,
//         classEntries,
//         selectedSchema
//       );
//     }
//   };

//   const pageVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.6, ease: "easeOut" },
//     },
//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
//       initial="hidden"
//       animate="visible"
//       variants={pageVariants}
//     >
//       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
//         {" "}
//         {/* Increased max-w to 6xl */}
//         <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
//           Generate Timetable
//         </h1>
//         {loading && (
//           <div className="flex justify-center items-center h-40">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
//             <p className="ml-4 text-gray-600">Loading data...</p>
//           </div>
//         )}
//         {error && (
//           <div
//             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
//             role="alert"
//           >
//             <strong className="font-bold">Error: </strong>
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}
//         {!loading && !error && classes.length > 0 && timetables.length > 0 && (
//           <form onSubmit={handleGenerateSubmit} className="space-y-6">
//             {/* Timetable Schema Dropdown */}
//             <div>
//               <label
//                 htmlFor="select-timetable-schema"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Select Timetable Schema
//               </label>
//               <select
//                 id="select-timetable-schema"
//                 value={selectedTimetableSchemaId}
//                 onChange={handleSchemaChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
//                 required
//               >
//                 {timetables.map((tt) => (
//                   <option key={tt._id} value={tt._id}>
//                     {tt.name} ({tt.days.join(", ")})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <motion.button
//               type="submit"
//               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 transform hover:scale-105"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               disabled={generationLoading}
//             >
//               {generationLoading ? "Generating..." : "Generate Timetable"}
//             </motion.button>

//             <AnimatePresence>
//               {generationMessage && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: 10 }}
//                   className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center mt-6"
//                   role="status"
//                 >
//                   {generationMessage}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </form>
//         )}
//         {!loading &&
//           !error &&
//           generatedTimetable.length > 0 &&
//           renderAllTimetables()}{" "}
//         {/* Call the new main render function */}
//       </div>
//     </motion.div>
//   );
// };

// export default GenerateTimetablePage;
// import React, { useState, useEffect, useRef } from "react";
// import axios from "../../axiosConfig.js";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "../../Context/authContext.jsx";
// import { useNavigate } from "react-router-dom";

// const GenerateTimetablePage = () => {
//   const [classes, setClasses] = useState([]);
//   const [timetables, setTimetables] = useState([]);
//   const [selectedClassId, setSelectedClassId] = useState("all"); // Default to "all" for all classes
//   const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
//     useState("");
//   const [loading, setLoading] = useState(true);
//   const [generationLoading, setGenerationLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [generationMessage, setGenerationMessage] = useState(null);
//   const [generatedTimetable, setGeneratedTimetable] = useState([]);

//   // These states are not directly used in the renderGeneratedTimetable logic for all subjects/rooms,
//   // but kept for completeness if needed elsewhere or for future features.
//   const [allSubjects, setAllSubjects] = useState([]);
//   const [allRooms, setAllRooms] = useState([]);

//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // Use refs for maps to avoid re-creating on every render and ensure stable references
//   const subjectMap = useRef(new Map());
//   const roomMap = useRef(new Map());
//   const timetableSchemaMap = useRef(new Map());
//   const classMap = useRef(new Map());

//   // --- Fetch All Necessary Data on Mount ---
//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Fetch classes and populate map
//         const classesRes = await axios.get("/api/class/");
//         setClasses(classesRes.data);
//         classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

//         // Fetch timetable schemas and populate map
//         const timetablesRes = await axios.get("/api/timetable/");
//         setTimetables(timetablesRes.data);
//         timetablesRes.data.forEach((tt) =>
//           timetableSchemaMap.current.set(tt._id, tt)
//         );

//         // Fetch subjects and populate map
//         const subjectsRes = await axios.get("/api/subject/");
//         setAllSubjects(subjectsRes.data);
//         subjectsRes.data.forEach((sub) => subjectMap.current.set(sub._id, sub));

//         // Fetch rooms and populate map
//         const roomsRes = await axios.get("/api/room/");
//         setAllRooms(roomsRes.data);
//         roomsRes.data.forEach((room) => roomMap.current.set(room._id, room));

//         // Set initial selected schema if available
//         if (timetablesRes.data.length > 0) {
//           setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
//         }
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             "Failed to fetch necessary data (classes, timetables, subjects, rooms)."
//         );
//         console.error("Error fetching data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [user, navigate]);

//   // Handle class change
//   const handleClassChange = (e) => {
//     setSelectedClassId(e.target.value);
//     setGeneratedTimetable([]); // Clear previous timetable when class selection changes
//     setGenerationMessage(null);
//   };

//   // Handle timetable schema change
//   const handleSchemaChange = (e) => {
//     setSelectedTimetableSchemaId(e.target.value);
//     setGeneratedTimetable([]); // Clear previous timetable when schema selection changes
//     setGenerationMessage(null);
//   };

//   // --- Handle Timetable Generation Submission ---
//   const handleGenerateSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setGenerationMessage(null);
//     setGeneratedTimetable([]);

//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     if (!selectedTimetableSchemaId) {
//       setError("Please select a Timetable Schema.");
//       return;
//     }

//     try {
//       setGenerationLoading(true);
//       let endpoint = "";
//       let payload = { timetableSchemaId: selectedTimetableSchemaId };

//       if (selectedClassId === "all") {
//         // Endpoint for generating for all classes
//         endpoint = `/api/generate/generate/by-schema/${selectedTimetableSchemaId}`;
//         console.log(
//           `Generating for ALL Classes using schema: ${selectedTimetableSchemaId}`
//         );
//       } else {
//         // Endpoint for generating for a specific class
//         endpoint = `/api/generate/generate/${selectedClassId}`;
//         // The backend expects timetableSchemaId in the body for specific class generation
//         payload = { ...payload, classId: selectedClassId };
//         console.log(
//           `Generating for Class ${selectedClassId} using schema: ${selectedTimetableSchemaId}`
//         );
//       }

//       const res = await axios.post(endpoint, payload);

//       setGenerationMessage(
//         res.data.message || "Timetable generated successfully!"
//       );
//       setGeneratedTimetable(res.data.timetable || []);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Failed to generate timetable. Please check inputs and server logs."
//       );
//       console.error("Timetable generation error:", err);
//     } finally {
//       setGenerationLoading(false);
//     }
//   };

//   // --- Render Generated Timetable for a Single Class ---
//   const renderClassTimetable = (classId, timetableEntries, selectedSchema) => {
//     const currentClass = classMap.current.get(classId);
//     if (!currentClass) return null;

//     const sortedTimeSlots = [...selectedSchema.slots].sort((a, b) => {
//       const timeA = new Date(`2000/01/01 ${a.startTime}`);
//       const timeB = new Date(`2000/01/01 ${b.startTime}`);
//       return timeA - timeB;
//     });

//     const organizedTimetable = {};
//     selectedSchema.days.forEach((day) => {
//       organizedTimetable[day] = {};
//       sortedTimeSlots.forEach((slot) => {
//         organizedTimetable[day][slot.startTime] = [];
//       });
//     });

//     timetableEntries.forEach((entry) => {
//       const subjectDetails = subjectMap.current.get(entry.subject);
//       const roomDetails = roomMap.current.get(entry.room);
//       const facultyName = entry.facultyName || "Unknown Faculty";

//       if (
//         organizedTimetable[entry.day] &&
//         organizedTimetable[entry.day][entry.startTime]
//       ) {
//         organizedTimetable[entry.day][entry.startTime].push({
//           batchName: entry.batchName,
//           subjectName: subjectDetails
//             ? `${subjectDetails.name}`
//             : "Unknown Subject",
//           subjectCode: subjectDetails ? subjectDetails.code : "",
//           subjectType: subjectDetails ? subjectDetails.type : "Unknown Type",
//           facultyName: facultyName,
//           roomName: roomDetails ? roomDetails.name : "Unknown Room",
//         });
//       }
//     });

//     const headerDays = selectedSchema.days;

//     return (
//       <div
//         key={classId}
//         className="mb-12 p-4 bg-white rounded-lg shadow-md font-inter"
//       >
//         <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
//           Timetable for {currentClass.name} ({currentClass.year})
//         </h3>
//         <div className="border border-gray-300 rounded-lg overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-300">
//             <thead className="bg-blue-600 text-white">
//               <tr>
//                 <th className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-24 sticky left-0 bg-blue-600">
//                   Time
//                 </th>
//                 {headerDays.map((day) => (
//                   <th
//                     key={day}
//                     className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
//                   >
//                     {day}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {sortedTimeSlots.map((slot, slotIndex) => {
//                 if (slot.type === "break") {
//                   return (
//                     <tr
//                       key={slot.startTime}
//                       className="bg-yellow-100 font-semibold text-yellow-800"
//                     >
//                       <td className="px-3 py-2 text-center whitespace-nowrap border-r border-gray-300 sticky left-0 bg-yellow-100">
//                         {slot.startTime} - {slot.endTime}
//                       </td>
//                       {headerDays.map((day) => (
//                         <td
//                           key={`break-${day}-${slot.startTime}`}
//                           className="px-3 py-2 text-center border-r border-gray-300"
//                         >
//                           Lunch Break
//                         </td>
//                       ))}
//                     </tr>
//                   );
//                 }

//                 return (
//                   <tr
//                     key={slot.startTime}
//                     className={slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
//                   >
//                     <td className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit">
//                       {slot.startTime} - {slot.endTime}
//                     </td>
//                     {headerDays.map((day) => (
//                       <td
//                         key={`${day}-${slot.startTime}`}
//                         className="px-3 py-2 border-r border-gray-200 align-top"
//                       >
//                         {organizedTimetable[day][slot.startTime]?.length > 0 ? (
//                           organizedTimetable[day][slot.startTime].map(
//                             (assignment, idx) => (
//                               <div
//                                 key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
//                                 className="mb-1 p-2 border border-dashed border-indigo-200 rounded-md bg-indigo-50 shadow-sm text-xs text-left last:mb-0"
//                               >
//                                 <p className="font-bold text-indigo-800">
//                                   {assignment.subjectName} (
//                                   {assignment.subjectCode})
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Batch:{" "}
//                                   <span className="font-medium">
//                                     {assignment.batchName}
//                                   </span>
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Faculty:{" "}
//                                   <span className="font-medium">
//                                     {assignment.facultyName}
//                                   </span>
//                                 </p>
//                                 <p className="text-gray-700 text-xs">
//                                   Room:{" "}
//                                   <span className="font-medium">
//                                     {assignment.roomName} (
//                                     {assignment.subjectType === "lecture"
//                                       ? "Lec"
//                                       : assignment.subjectType === "lab"
//                                       ? "Lab"
//                                       : "Tut"}
//                                     )
//                                   </span>
//                                 </p>
//                               </div>
//                             )
//                           )
//                         ) : (
//                           <div className="text-center text-gray-400 text-xs py-2">
//                             -
//                           </div>
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   // --- Main Render Function for All Timetables ---
//   const renderAllTimetables = () => {
//     if (!generatedTimetable || generatedTimetable.length === 0) {
//       return (
//         <p className="text-center text-gray-600 mt-8">
//           No timetable generated yet.
//         </p>
//       );
//     }

//     const selectedSchema = timetableSchemaMap.current.get(
//       selectedTimetableSchemaId
//     );
//     if (!selectedSchema) {
//       return (
//         <p className="text-red-500 text-center mt-8">
//           Error: Selected timetable schema details not found.
//         </p>
//       );
//     }

//     // Get unique class IDs from the generated timetable
//     const uniqueClassIds = [
//       ...new Set(generatedTimetable.map((entry) => entry.classId)),
//     ];

//     // If "All Classes" is selected, render a timetable for each unique class
//     if (selectedClassId === "all") {
//       return (
//         <div className="mt-8">
//           <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
//             Consolidated Timetable for All Classes
//           </h2>
//           {uniqueClassIds.map((classId) => {
//             const classEntries = generatedTimetable.filter(
//               (entry) => entry.classId === classId
//             );
//             return renderClassTimetable(classId, classEntries, selectedSchema);
//           })}
//         </div>
//       );
//     } else {
//       // If a specific class is selected, render only its timetable
//       const classEntries = generatedTimetable.filter(
//         (entry) => entry.classId === selectedClassId
//       );
//       return renderClassTimetable(
//         selectedClassId,
//         classEntries,
//         selectedSchema
//       );
//     }
//   };

//   const pageVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.6, ease: "easeOut" },
//     },
//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
//       initial="hidden"
//       animate="visible"
//       variants={pageVariants}
//     >
//       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
//         {" "}
//         {/* Increased max-w to 6xl */}
//         <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
//           Generate Timetable
//         </h1>
//         {loading && (
//           <div className="flex justify-center items-center h-40">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
//             <p className="ml-4 text-gray-600">Loading data...</p>
//           </div>
//         )}
//         {error && (
//           <div
//             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
//             role="alert"
//           >
//             <strong className="font-bold">Error: </strong>
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}
//         {!loading && !error && classes.length > 0 && timetables.length > 0 && (
//           <form onSubmit={handleGenerateSubmit} className="space-y-6">
//             {/* Timetable Schema Dropdown */}
//             <div>
//               <label
//                 htmlFor="select-timetable-schema"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Select Timetable Schema
//               </label>
//               <select
//                 id="select-timetable-schema"
//                 value={selectedTimetableSchemaId}
//                 onChange={handleSchemaChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
//                 required
//               >
//                 {timetables.map((tt) => (
//                   <option key={tt._id} value={tt._id}>
//                     {tt.name} ({tt.days.join(", ")})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <motion.button
//               type="submit"
//               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 transform hover:scale-105"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               disabled={generationLoading}
//             >
//               {generationLoading ? "Generating..." : "Generate Timetable"}
//             </motion.button>

//             <AnimatePresence>
//               {generationMessage && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: 10 }}
//                   className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center mt-6"
//                   role="status"
//                 >
//                   {generationMessage}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </form>
//         )}
//         {!loading &&
//           !error &&
//           generatedTimetable.length > 0 &&
//           renderAllTimetables()}{" "}
//         {/* Call the new main render function */}
//       </div>
//     </motion.div>
//   );
// };

// export default GenerateTimetablePage;

import React, { useState, useEffect, useRef } from "react";
import axios from "../../axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/authContext.jsx";
import { useNavigate } from "react-router-dom";
const GenerateTimetablePage = () => {
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationMessage, setGenerationMessage] = useState(null);
  const [generatedTimetable, setGeneratedTimetable] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const subjectMap = useRef(new Map());
  const roomMap = useRef(new Map());
  const timetableSchemaMap = useRef(new Map());
  const classMap = useRef(new Map());
  // --- Fetch All Necessary Data on Mount ---
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const classesRes = await axios.get("/api/class/");
        setClasses(classesRes.data);
        classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));
        const timetablesRes = await axios.get("/api/timetable/");
        setTimetables(timetablesRes.data);
        timetablesRes.data.forEach((tt) =>
          timetableSchemaMap.current.set(tt._id, tt)
        );
        const subjectsRes = await axios.get("/api/subject/");
        setAllSubjects(subjectsRes.data);
        subjectsRes.data.forEach((sub) => subjectMap.current.set(sub._id, sub));
        const roomsRes = await axios.get("/api/room/");
        setAllRooms(roomsRes.data);
        roomsRes.data.forEach((room) => roomMap.current.set(room._id, room));
        if (timetablesRes.data.length > 0) {
          setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Failed to fetch necessary data (classes, timetables, subjects, rooms)."
        );
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);
  const handleClassChange = (e) => {
    setSelectedClassId(e.target.value);
    setGeneratedTimetable([]);
    setGenerationMessage(null);
  };
  const handleSchemaChange = (e) => {
    setSelectedTimetableSchemaId(e.target.value);
    setGeneratedTimetable([]);
    setGenerationMessage(null);
  };
  // --- Handle Timetable Generation Submission ---
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGenerationMessage(null);
    setGeneratedTimetable([]);
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedTimetableSchemaId) {
      setError("Please select a Timetable Schema.");
      return;
    }
    try {
      setGenerationLoading(true);
      let endpoint = "";
      let payload = { timetableSchemaId: selectedTimetableSchemaId };
      if (selectedClassId === "all") {
        endpoint = `/api/generate/generate/by-schema/${selectedTimetableSchemaId}`;
        console.log(
          `Generating for ALL Classes using schema: ${selectedTimetableSchemaId}`
        );
      } else {
        endpoint = `/api/generate/generate/${selectedClassId}`;
        payload = { ...payload, classId: selectedClassId };
        console.log(
          `Generating for Class ${selectedClassId} using schema: ${selectedTimetableSchemaId}`
        );
      }
      const res = await axios.post(endpoint, payload);
      setGenerationMessage(
        res.data.message || "Timetable generated successfully!"
      );
      setGeneratedTimetable(res.data.timetable || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to generate timetable. Please check inputs and server logs."
      );
      console.error("Timetable generation error:", err);
    } finally {
      setGenerationLoading(false);
    }
  };
  // --- Helper: Get slot index by start time ---
  const getSlotIndex = (slots, startTime) => {
    return slots.findIndex((slot) => slot.startTime === startTime);
  };
  // --- Render Generated Timetable for a Single Class ---
  const renderClassTimetable = (classId, timetableEntries, selectedSchema) => {
    const currentClass = classMap.current.get(classId);
    if (!currentClass) return null;
    const sortedTimeSlots = [...selectedSchema.slots].sort((a, b) => {
      const timeA = new Date(`2000/01/01 ${a.startTime}`);
      const timeB = new Date(`2000/01/01 ${b.startTime}`);
      return timeA - timeB;
    });
    // Build organized structure: day -> startTime -> entries array
    const organizedTimetable = {};
    selectedSchema.days.forEach((day) => {
      organizedTimetable[day] = {};
      sortedTimeSlots.forEach((slot) => {
        organizedTimetable[day][slot.startTime] = [];
      });
    });
    // Track which slots are occupied (for rowspan handling)
    const occupiedSlots = {};
    selectedSchema.days.forEach((day) => {
      occupiedSlots[day] = {};
      sortedTimeSlots.forEach((slot) => {
        occupiedSlots[day][slot.startTime] = false;
      });
    });
    // Process entries and mark occupied slots
    timetableEntries.forEach((entry) => {
      const subjectDetails = subjectMap.current.get(entry.subject);
      const roomDetails = roomMap.current.get(entry.room);
      const facultyName = entry.facultyName || "Unknown Faculty";
      const duration = entry.duration || 1;
      if (
        organizedTimetable[entry.day] &&
        organizedTimetable[entry.day][entry.startTime] !== undefined
      ) {
        const entryData = {
          batchName: entry.batchName,
          subjectName: subjectDetails
            ? `${subjectDetails.name}`
            : "Unknown Subject",
          subjectCode: subjectDetails ? subjectDetails.code : "",
          subjectType:
            entry.type ||
            (subjectDetails ? subjectDetails.type : "Unknown Type"),
          facultyName: facultyName,
          roomName: roomDetails ? roomDetails.name : "Unknown Room",
          duration: duration,
          startTime: entry.startTime,
        };
        organizedTimetable[entry.day][entry.startTime].push(entryData);
        // Mark this slot and subsequent slots as occupied
        const startIdx = getSlotIndex(sortedTimeSlots, entry.startTime);
        if (startIdx !== -1) {
          for (let i = 0; i < duration; i++) {
            const slotIdx = startIdx + i;
            if (slotIdx < sortedTimeSlots.length) {
              const slot = sortedTimeSlots[slotIdx];
              if (slot.type !== "break") {
                occupiedSlots[entry.day][slot.startTime] = true;
              }
            }
          }
        }
      }
    });
    const headerDays = selectedSchema.days;
    return (
      <div
        key={classId}
        className="mb-12 p-4 bg-white rounded-lg shadow-md font-inter"
      >
        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
          Timetable for {currentClass.name} ({currentClass.year})
        </h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300 table-fixed">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-24 sticky left-0 bg-blue-600">
                  Time
                </th>
                {headerDays.map((day) => (
                  <th
                    key={day}
                    className="px-3 py-2 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTimeSlots.map((slot, slotIndex) => {
                if (slot.type === "break") {
                  return (
                    <tr
                      key={slot.startTime}
                      className="bg-yellow-100 font-semibold text-yellow-800"
                    >
                      <td className="px-3 py-2 text-center whitespace-nowrap border-r border-gray-300 sticky left-0 bg-yellow-100">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      {headerDays.map((day) => (
                        <td
                          key={`break-${day}-${slot.startTime}`}
                          className="px-3 py-2 text-center border-r border-gray-300"
                        >
                          Break
                        </td>
                      ))}
                    </tr>
                  );
                }
                return (
                  <tr
                    key={slot.startTime}
                    className={slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    {headerDays.map((day) => {
                      // Check if this slot is already occupied by a previous entry with duration > 1
                      const isOccupied = occupiedSlots[day][slot.startTime];
                      const entries =
                        organizedTimetable[day][slot.startTime] || [];

                      // If slot is occupied but has no entries starting here, skip rendering (it's part of a rowspan)
                      if (isOccupied && entries.length === 0) {
                        return null; // Cell will be covered by rowspan from previous entry
                      }
                      // Determine rowspan for entries starting in this slot
                      const rowspan =
                        entries.length > 0 && entries[0].duration > 1
                          ? entries[0].duration
                          : 1;
                      return (
                        <td
                          key={`${day}-${slot.startTime}`}
                          className="px-3 py-2 border-r border-gray-200 align-top"
                          rowSpan={
                            entries.length > 0 && entries[0].duration > 1
                              ? entries[0].duration
                              : 1
                          }
                        >
                          {entries.length > 0 ? (
                            entries.map((assignment, idx) => (
                              <div
                                key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
                                className={`mb-1 p-2 border border-dashed rounded-md shadow-sm text-xs text-left last:mb-0 ${assignment.subjectType === "lab"
                                  ? "border-green-300 bg-green-50"
                                  : "border-indigo-200 bg-indigo-50"
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p
                                    className={`font-bold ${assignment.subjectType === "lab"
                                      ? "text-green-800"
                                      : "text-indigo-800"
                                      }`}
                                  >
                                    {assignment.subjectName} (
                                    {assignment.subjectCode})
                                  </p>
                                  {assignment.duration > 1 &&
                                    assignment.subjectType !== "lab" && (
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${assignment.subjectType === "lab"
                                          ? "bg-green-200 text-green-800"
                                          : "bg-indigo-200 text-indigo-800"
                                          }`}
                                      >
                                        {assignment.duration}h
                                      </span>
                                    )}
                                </div>
                                <p className="text-gray-700 text-xs">
                                  Batch:{" "}
                                  <span className="font-medium">
                                    {assignment.batchName}
                                  </span>
                                </p>
                                <p className="text-gray-700 text-xs">
                                  Faculty:{" "}
                                  <span className="font-medium">
                                    {assignment.facultyName}
                                  </span>
                                </p>
                                <p className="text-gray-700 text-xs">
                                  Room:{" "}
                                  <span className="font-medium">
                                    {assignment.roomName}
                                  </span>{" "}
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${assignment.subjectType === "lecture"
                                      ? "bg-blue-100 text-blue-800"
                                      : assignment.subjectType === "lab"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                      }`}
                                  >
                                    {assignment.subjectType === "lecture"
                                      ? "Lec"
                                      : assignment.subjectType === "lab"
                                        ? "Lab"
                                        : "Tut"}
                                  </span>
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-400 text-xs py-2">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  // --- Main Render Function for All Timetables ---
  const renderAllTimetables = () => {
    if (!generatedTimetable || generatedTimetable.length === 0) {
      return (
        <p className="text-center text-gray-600 mt-8">
          No timetable generated yet.
        </p>
      );
    }
    const selectedSchema = timetableSchemaMap.current.get(
      selectedTimetableSchemaId
    );
    if (!selectedSchema) {
      return (
        <p className="text-red-500 text-center mt-8">
          Error: Selected timetable schema details not found.
        </p>
      );
    }
    const uniqueClassIds = [
      ...new Set(generatedTimetable.map((entry) => entry.classId)),
    ];
    if (selectedClassId === "all") {
      return (
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Consolidated Timetable for All Classes
          </h2>
          {uniqueClassIds.map((classId) => {
            const currentClass = classMap.current.get(classId);
            if (!currentClass) return null;

            // Include both class-specific AND year-wide elective entries
            const classEntries = generatedTimetable.filter(
              (entry) =>
                entry.classId === classId ||
                (entry.type === 'elective' && entry.year === currentClass.year)
            );
            return renderClassTimetable(classId, classEntries, selectedSchema);
          })}
        </div>
      );
    } else {
      const currentClass = classMap.current.get(selectedClassId);
      if (!currentClass) return null;

      // Include both class-specific AND year-wide elective entries
      const classEntries = generatedTimetable.filter(
        (entry) =>
          entry.classId === selectedClassId ||
          (entry.type === 'elective' && entry.year === currentClass.year)
      );
      return renderClassTimetable(
        selectedClassId,
        classEntries,
        selectedSchema
      );
    }
  };
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };
  return (
    <motion.div
      className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
          Generate Timetable
        </h1>
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-gray-600">Loading data...</p>
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {!loading && !error && classes.length > 0 && timetables.length > 0 && (
          <form onSubmit={handleGenerateSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="select-timetable-schema"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Timetable Schema
              </label>
              <select
                id="select-timetable-schema"
                value={selectedTimetableSchemaId}
                onChange={handleSchemaChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                required
              >
                {timetables.map((tt) => (
                  <option key={tt._id} value={tt._id}>
                    {tt.name} ({tt.days.join(", ")})
                  </option>
                ))}
              </select>
            </div>
            <motion.button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={generationLoading}
            >
              {generationLoading ? "Generating..." : "Generate Timetable"}
            </motion.button>
            <AnimatePresence>
              {generationMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center mt-6"
                  role="status"
                >
                  {generationMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
        {!loading &&
          !error &&
          generatedTimetable.length > 0 &&
          renderAllTimetables()}
      </div>
    </motion.div>
  );
};
export default GenerateTimetablePage;
