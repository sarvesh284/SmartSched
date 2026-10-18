// import React, { useEffect, useState, useRef } from "react";
// import axios from "../../axiosConfig.js";
// import { motion } from "framer-motion";
// import { useAuth } from "../../Context/authContext.jsx";
// import { useNavigate } from "react-router-dom";

// const CompactGridTimetable = () => {
//   // Metadata state
//   const [classes, setClasses] = useState([]);
//   const [timetables, setTimetables] = useState([]);

//   // Selection state
//   const [selectedClassId, setSelectedClassId] = useState("");
//   const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
//     useState("");

//   // Timetable state
//   const [generatedTimetable, setGeneratedTimetable] = useState([]);
//   const [viewedClassId, setViewedClassId] = useState(null);
//   const [viewedSchemaId, setViewedSchemaId] = useState(null);

//   // Loading and error state
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [viewLoading, setViewLoading] = useState(false);
//   const [fetchError, setFetchError] = useState(null);
//   const [viewMessage, setViewMessage] = useState(null);

//   // Auth and navigation
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // Lookup maps (cached references)
//   const subjectMap = useRef(new Map());
//   const roomMap = useRef(new Map());
//   const facultyMap = useRef(new Map());
//   const timetableSchemaMap = useRef(new Map());
//   const classMap = useRef(new Map());

//   // --- Fetch initial metadata ---
//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     const fetchData = async () => {
//       setInitialLoading(true);
//       setFetchError(null);

//       try {
//         const [classesRes, timetablesRes, subjectsRes, roomsRes, facultiesRes] =
//           await Promise.all([
//             axios.get("/api/class/"),
//             axios.get("/api/timetable/"),
//             axios.get("/api/subject/"),
//             axios.get("/api/room/"),
//             axios.get("/api/faculty/"),
//           ]);

//         // Add "All Classes" option
//         const fetchedClasses = [
//           { _id: "all-classes", name: "All Classes", year: "" },
//           ...classesRes.data,
//         ];
//         setClasses(fetchedClasses);
//         classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

//         setTimetables(timetablesRes.data || []);
//         (timetablesRes.data || []).forEach((tt) =>
//           timetableSchemaMap.current.set(tt._id, tt)
//         );

//         (subjectsRes.data || []).forEach((s) =>
//           subjectMap.current.set(s._id, s)
//         );
//         (roomsRes.data || []).forEach((r) => roomMap.current.set(r._id, r));
//         (facultiesRes.data || []).forEach((f) =>
//           facultyMap.current.set(f._id, f)
//         );

//         if (fetchedClasses.length > 0)
//           setSelectedClassId(fetchedClasses[0]._id);
//         if ((timetablesRes.data || []).length > 0)
//           setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
//       } catch (err) {
//         console.error("Initial data load error:", err);
//         setFetchError(
//           err?.response?.data?.message || "Failed to load initial data."
//         );
//       } finally {
//         setInitialLoading(false);
//       }
//     };

//     fetchData();
//   }, [user, navigate]);

//   // --- Handle class change ---
//   const handleClassChange = (e) => {
//     setSelectedClassId(e.target.value);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);
//     setFetchError(null);
//     setViewMessage(null);
//   };

//   // --- Handle schema change ---
//   const handleSchemaChange = (e) => {
//     setSelectedTimetableSchemaId(e.target.value);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);
//     setFetchError(null);
//     setViewMessage(null);
//   };

//   // --- Handle view timetable ---
//   const handleViewClick = async () => {
//     setFetchError(null);
//     setViewMessage(null);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);

//     if (!selectedTimetableSchemaId) {
//       setFetchError("Please select a timetable schema.");
//       return;
//     }

//     try {
//       setViewLoading(true);

//       if (selectedClassId === "all-classes") {
//         // Fetch timetable for all classes
//         const timetableResults = {};
//         for (const cls of classes.filter((c) => c._id !== "all-classes")) {
//           try {
//             const res = await axios.get(
//               `/api/generatedtimetable/class/${cls._id}`,
//               { params: { timetableSchemaId: selectedTimetableSchemaId } }
//             );
//             timetableResults[cls._id] = res.data || [];
//           } catch (err) {
//             timetableResults[cls._id] = {
//               error: true,
//               message: "Failed to fetch timetable.",
//             };
//           }
//         }
//         console.log(timetableResults);

//         setGeneratedTimetable(timetableResults);
//         setViewedClassId("all-classes");
//         setViewedSchemaId(selectedTimetableSchemaId);
//       } else {
//         // Fetch timetable for single class
//         const res = await axios.get(
//           `/api/generatedtimetable/class/${selectedClassId}`,
//           { params: { timetableSchemaId: selectedTimetableSchemaId } }
//         );

//         const data = res.data || [];
//         setGeneratedTimetable(data);
//         setViewedClassId(selectedClassId);
//         setViewedSchemaId(selectedTimetableSchemaId);

//         if (!data || (Array.isArray(data) && data.length === 0)) {
//           setViewMessage(
//             `No timetable generated for "${
//               classMap.current.get(selectedClassId)?.name || "this class"
//             }" using "${
//               timetableSchemaMap.current.get(selectedTimetableSchemaId)?.name ||
//               "this schema"
//             }".`
//           );
//         }
//       }
//     } catch (err) {
//       console.error("Error fetching class timetable:", err);
//       setFetchError(
//         err?.response?.data?.message ||
//           "Failed to fetch timetable for the selected class."
//       );
//     } finally {
//       setViewLoading(false);
//     }
//   };

//   // --- Render timetable for one class ---
//   const renderSingleClassTable = (schema, classId, timetableEntries) => {
//     const sortedTimeSlots = [...(schema.slots || [])].sort((a, b) => {
//       const timeA = new Date(`2000/01/01 ${a.startTime}`);
//       const timeB = new Date(`2000/01/01 ${b.startTime}`);
//       return timeA - timeB;
//     });

//     const organizedTimetable = {};
//     (schema.days || []).forEach((day) => {
//       organizedTimetable[day] = {};
//       sortedTimeSlots.forEach((slot) => {
//         organizedTimetable[day][slot.startTime] = [];
//       });
//     });

//     (timetableEntries || []).forEach((entry) => {
//       if (
//         organizedTimetable[entry.day] &&
//         organizedTimetable[entry.day][entry.startTime]
//       ) {
//         organizedTimetable[entry.day][entry.startTime].push({
//           batchName: entry.batchName,
//           subjectName: entry.subject?.name || "N/A",
//           subjectCode: entry.subject?.code || "N/A",
//           subjectType: entry.subject?.type || "N/A",
//           facultyName: entry.facultyName || "N/A",
//           roomName: entry.room?.name || "N/A",
//         });
//       }
//     });

//     const headerDays = schema.days || [];
//     const currentClassName =
//       classMap.current.get(classId)?.name || "Selected Class";
//     const displayTimeSlots = sortedTimeSlots;

//     return (
//       <div className="overflow-x-auto mt-8 p-4 bg-white rounded-lg shadow-md font-inter">
//         <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
//           Timetable for {currentClassName}
//         </h2>
//         <div className="border border-gray-300 rounded-lg overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-300">
//             <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
//               <tr>
//                 <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-32 sticky left-0 rounded-tl-lg">
//                   Time Slot
//                 </th>
//                 {headerDays.map((day) => (
//                   <th
//                     key={day}
//                     className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
//                   >
//                     {day}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {displayTimeSlots.map((slot, slotIndex) => (
//                 <tr
//                   key={slot.startTime}
//                   className={
//                     slot.type === "break"
//                       ? "bg-yellow-100 font-semibold text-yellow-800"
//                       : slotIndex % 2 === 0
//                       ? "bg-gray-50 hover:bg-gray-100"
//                       : "bg-white hover:bg-gray-50"
//                   }
//                 >
//                   <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 bg-inherit">
//                     {slot.startTime} - {slot.endTime}
//                   </td>

//                   {headerDays.map((day) => (
//                     <td
//                       key={`${day}-${slot.startTime}`}
//                       className="px-4 py-3 border-r border-gray-200 text-center align-top"
//                     >
//                       {slot.type === "break" ? (
//                         "Break"
//                       ) : organizedTimetable[day][slot.startTime]?.length >
//                         0 ? (
//                         organizedTimetable[day][slot.startTime].map(
//                           (assignment, idx) => (
//                             <div
//                               key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
//                               className={`mb-2 p-2 rounded-md shadow-sm text-xs text-left last:mb-0
//                   ${
//                     assignment.subjectType === "lecture"
//                       ? "bg-indigo-50 border border-indigo-200 text-indigo-800"
//                       : assignment.subjectType === "lab"
//                       ? "bg-green-50 border border-green-200 text-green-800"
//                       : "bg-gray-50 border border-gray-200 text-gray-700"
//                   }`}
//                             >
//                               <p className="font-bold">
//                                 {assignment.subjectName} (
//                                 {assignment.subjectCode})
//                               </p>
//                               <p>
//                                 Batch:{" "}
//                                 <span className="font-medium">
//                                   {assignment.batchName}
//                                 </span>
//                               </p>
//                               <p>
//                                 Faculty:{" "}
//                                 <span className="font-medium">
//                                   {assignment.facultyName}
//                                 </span>
//                               </p>
//                               <p>
//                                 Room:{" "}
//                                 <span className="font-medium">
//                                   {assignment.roomName}
//                                 </span>
//                               </p>
//                               <p className="text-gray-600 text-xs mt-1 italic">
//                                 {assignment.subjectType
//                                   .charAt(0)
//                                   .toUpperCase() +
//                                   assignment.subjectType.slice(1)}
//                               </p>
//                             </div>
//                           )
//                         )
//                       ) : (
//                         <div className="text-center text-gray-400 text-xs py-2">
//                           -
//                         </div>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   // --- Render timetable wrapper ---
//   const renderTimetableTable = () => {
//     const schemaIdToUse = viewedSchemaId;
//     if (!schemaIdToUse) return null;

//     const selectedSchema = timetableSchemaMap.current.get(schemaIdToUse);
//     if (!selectedSchema) {
//       return (
//         <p className="text-red-500 text-center mt-8 text-lg">
//           Error: Selected timetable schema details not found.
//         </p>
//       );
//     }

//     if (viewedClassId === "all-classes") {
//       return (
//         <div className="space-y-12">
//           {classes
//             .filter((c) => c._id !== "all-classes")
//             .map((cls) => {
//               const classData = generatedTimetable[cls._id];
//               if (!classData || classData.length === 0) {
//                 return (
//                   <p key={cls._id} className="text-center text-gray-600">
//                     No timetable generated for {cls.name}.
//                   </p>
//                 );
//               }
//               return (
//                 <div key={cls._id}>
//                   {renderSingleClassTable(selectedSchema, cls._id, classData)}
//                 </div>
//               );
//             })}
//         </div>
//       );
//     }

//     return renderSingleClassTable(
//       selectedSchema,
//       viewedClassId,
//       generatedTimetable
//     );
//   };

//   // Page animation variants
//   const pageVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.45, ease: "easeOut" },
//     },
//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter"
//       initial="hidden"
//       animate="visible"
//       variants={pageVariants}
//     >
//       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
//         <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
//           View Timetable
//         </h1>

//         {initialLoading && (
//           <div className="flex justify-center items-center h-40">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
//             <p className="ml-4 text-gray-600">Loading data...</p>
//           </div>
//         )}

//         {fetchError && (
//           <div
//             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
//             role="alert"
//           >
//             <strong className="font-bold">Error: </strong>
//             <span className="block sm:inline">{fetchError}</span>
//           </div>
//         )}

//         {!initialLoading &&
//           !fetchError &&
//           classes.length === 1 &&
//           classes[0]._id === "all-classes" && (
//             <p className="text-center text-gray-600 text-lg mb-6">
//               No classes available. Please add classes first.
//             </p>
//           )}
//         {!initialLoading && !fetchError && timetables.length === 0 && (
//           <p className="text-center text-gray-600 text-lg mb-6">
//             No timetable schemas available. Please define a schema first.
//           </p>
//         )}

//         {!initialLoading &&
//           !fetchError &&
//           classes.length > 0 &&
//           timetables.length > 0 && (
//             <div className="space-y-6 mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//               <div>
//                 <label
//                   htmlFor="select-class"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Select Class
//                 </label>
//                 <select
//                   id="select-class"
//                   value={selectedClassId}
//                   onChange={handleClassChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
//                 >
//                   <option value="all-classes">All Classes</option>
//                   {classes
//                     .filter((c) => c._id !== "all-classes")
//                     .map((cls) => (
//                       <option key={cls._id} value={cls._id}>
//                         {cls.name} ({cls.year})
//                       </option>
//                     ))}
//                 </select>
//               </div>

//               <div>
//                 <label
//                   htmlFor="select-timetable-schema"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Select Timetable Schema
//                 </label>
//                 <select
//                   id="select-timetable-schema"
//                   value={selectedTimetableSchemaId}
//                   onChange={handleSchemaChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
//                 >
//                   {timetables.map((tt) => (
//                     <option key={tt._id} value={tt._id}>
//                       {tt.name} ({tt.days?.join(", ")})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="flex items-center gap-4">
//                 <motion.button
//                   onClick={handleViewClick}
//                   type="button"
//                   className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60"
//                   whileTap={{ scale: 0.98 }}
//                   disabled={viewLoading}
//                 >
//                   {viewLoading ? "Loading..." : "View Timetable"}
//                 </motion.button>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setGeneratedTimetable([]);
//                     setViewedClassId(null);
//                     setViewedSchemaId(null);
//                     setFetchError(null);
//                     setViewMessage(null);
//                   }}
//                   className="py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
//                 >
//                   Clear View
//                 </button>
//               </div>
//             </div>
//           )}

//         {viewMessage && (
//           <p className="text-center text-gray-600 mt-6 text-lg">
//             {viewMessage}
//           </p>
//         )}

//         {generatedTimetable && !viewLoading && renderTimetableTable()}
//       </div>
//     </motion.div>
//   );
// };

// export default CompactGridTimetable;
// // import React, { useEffect, useState, useRef } from "react";
// // import axios from "../../axiosConfig.js";
// // import { motion } from "framer-motion";
// // import { useAuth } from "../../Context/authContext.jsx";
// // import { useNavigate } from "react-router-dom";

// // const CompactGridTimetable = () => {
// //   // Metadata state
// //   const [classes, setClasses] = useState([]);
// //   const [timetables, setTimetables] = useState([]);

// //   // Selection state
// //   const [selectedClassId, setSelectedClassId] = useState("");
// //   const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
// //     useState("");

// //   // Timetable state
// //   const [generatedTimetable, setGeneratedTimetable] = useState([]);
// //   const [viewedClassId, setViewedClassId] = useState(null);
// //   const [viewedSchemaId, setViewedSchemaId] = useState(null);

// //   // Loading and error state
// //   const [initialLoading, setInitialLoading] = useState(true);
// //   const [viewLoading, setViewLoading] = useState(false);
// //   const [fetchError, setFetchError] = useState(null);
// //   const [viewMessage, setViewMessage] = useState(null);

// //   // Auth and navigation
// //   const { user } = useAuth();
// //   const navigate = useNavigate();

// //   // Lookup maps (cached references)
// //   const subjectMap = useRef(new Map());
// //   const roomMap = useRef(new Map());
// //   const facultyMap = useRef(new Map());
// //   const timetableSchemaMap = useRef(new Map());
// //   const classMap = useRef(new Map());

// //   // --- Fetch initial metadata ---
// //   useEffect(() => {
// //     if (!user) {
// //       navigate("/login");
// //       return;
// //     }

// //     const fetchData = async () => {
// //       setInitialLoading(true);
// //       setFetchError(null);

// //       try {
// //         const [classesRes, timetablesRes, subjectsRes, roomsRes, facultiesRes] =
// //           await Promise.all([
// //             axios.get("/api/class/"),
// //             axios.get("/api/timetable/"),
// //             axios.get("/api/subject/"),
// //             axios.get("/api/room/"),
// //             axios.get("/api/faculty/"),
// //           ]);

// //         // Add "All Classes" option
// //         const fetchedClasses = [
// //           { _id: "all-classes", name: "All Classes", year: "" },
// //           ...classesRes.data,
// //         ];
// //         setClasses(fetchedClasses);
// //         classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

// //         setTimetables(timetablesRes.data || []);
// //         (timetablesRes.data || []).forEach((tt) =>
// //           timetableSchemaMap.current.set(tt._id, tt)
// //         );

// //         (subjectsRes.data || []).forEach((s) =>
// //           subjectMap.current.set(s._id, s)
// //         );
// //         (roomsRes.data || []).forEach((r) => roomMap.current.set(r._id, r));
// //         (facultiesRes.data || []).forEach((f) =>
// //           facultyMap.current.set(f._id, f)
// //         );

// //         if (fetchedClasses.length > 0)
// //           setSelectedClassId(fetchedClasses[0]._id);
// //         if ((timetablesRes.data || []).length > 0)
// //           setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
// //       } catch (err) {
// //         console.error("Initial data load error:", err);
// //         setFetchError(
// //           err?.response?.data?.message || "Failed to load initial data."
// //         );
// //       } finally {
// //         setInitialLoading(false);
// //       }
// //     };

// //     fetchData();
// //   }, [user, navigate]);

// //   // --- Handle class change ---
// //   const handleClassChange = (e) => {
// //     setSelectedClassId(e.target.value);
// //     setGeneratedTimetable([]);
// //     setViewedClassId(null);
// //     setViewedSchemaId(null);
// //     setFetchError(null);
// //     setViewMessage(null);
// //   };

// //   // --- Handle schema change ---
// //   const handleSchemaChange = (e) => {
// //     setSelectedTimetableSchemaId(e.target.value);
// //     setGeneratedTimetable([]);
// //     setViewedClassId(null);
// //     setViewedSchemaId(null);
// //     setFetchError(null);
// //     setViewMessage(null);
// //   };

// //   // --- Handle view timetable ---
// //   const handleViewClick = async () => {
// //     setFetchError(null);
// //     setViewMessage(null);
// //     setGeneratedTimetable([]);
// //     setViewedClassId(null);
// //     setViewedSchemaId(null);

// //     if (!selectedTimetableSchemaId) {
// //       setFetchError("Please select a timetable schema.");
// //       return;
// //     }

// //     try {
// //       setViewLoading(true);

// //       if (selectedClassId === "all-classes") {
// //         // Fetch timetable for all classes
// //         const timetableResults = {};
// //         for (const cls of classes.filter((c) => c._id !== "all-classes")) {
// //           try {
// //             const res = await axios.get(
// //               `/api/generatedtimetable/class/${cls._id}`,
// //               { params: { timetableSchemaId: selectedTimetableSchemaId } }
// //             );
// //             timetableResults[cls._id] = res.data || [];
// //           } catch (err) {
// //             timetableResults[cls._id] = {
// //               error: true,
// //               message: "Failed to fetch timetable.",
// //             };
// //           }
// //         }
// //         console.log(timetableResults);

// //         setGeneratedTimetable(timetableResults);
// //         setViewedClassId("all-classes");
// //         setViewedSchemaId(selectedTimetableSchemaId);
// //       } else {
// //         // Fetch timetable for single class
// //         const res = await axios.get(
// //           `/api/generatedtimetable/class/${selectedClassId}`,
// //           { params: { timetableSchemaId: selectedTimetableSchemaId } }
// //         );

// //         const data = res.data || [];
// //         setGeneratedTimetable(data);
// //         setViewedClassId(selectedClassId);
// //         setViewedSchemaId(selectedTimetableSchemaId);

// //         if (!data || (Array.isArray(data) && data.length === 0)) {
// //           setViewMessage(
// //             `No timetable generated for "${
// //               classMap.current.get(selectedClassId)?.name || "this class"
// //             }" using "${
// //               timetableSchemaMap.current.get(selectedTimetableSchemaId)?.name ||
// //               "this schema"
// //             }".`
// //           );
// //         }
// //       }
// //     } catch (err) {
// //       console.error("Error fetching class timetable:", err);
// //       setFetchError(
// //         err?.response?.data?.message ||
// //           "Failed to fetch timetable for the selected class."
// //       );
// //     } finally {
// //       setViewLoading(false);
// //     }
// //   };

// //   // --- Render timetable for one class ---
// //   const renderSingleClassTable = (schema, classId, timetableEntries) => {
// //     const sortedTimeSlots = [...(schema.slots || [])].sort((a, b) => {
// //       const timeA = new Date(`2000/01/01 ${a.startTime}`);
// //       const timeB = new Date(`2000/01/01 ${b.startTime}`);
// //       return timeA - timeB;
// //     });

// //     const organizedTimetable = {};
// //     (schema.days || []).forEach((day) => {
// //       organizedTimetable[day] = {};
// //       sortedTimeSlots.forEach((slot) => {
// //         organizedTimetable[day][slot.startTime] = [];
// //       });
// //     });

// //     (timetableEntries || []).forEach((entry) => {
// //       if (
// //         organizedTimetable[entry.day] &&
// //         organizedTimetable[entry.day][entry.startTime]
// //       ) {
// //         organizedTimetable[entry.day][entry.startTime].push({
// //           batchName: entry.batchName,
// //           subjectName: entry.subject?.name || "N/A",
// //           subjectCode: entry.subject?.code || "N/A",
// //           subjectType: entry.subject?.type || "N/A",
// //           facultyName: entry.facultyName || "N/A",
// //           roomName: entry.room?.name || "N/A",
// //         });
// //       }
// //     });

// //     const headerDays = schema.days || [];
// //     const currentClassName =
// //       classMap.current.get(classId)?.name || "Selected Class";
// //     const displayTimeSlots = sortedTimeSlots;

// //     return (
// //       <div className="overflow-x-auto mt-8 p-4 bg-white rounded-lg shadow-md font-inter">
// //         <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
// //           Timetable for {currentClassName}
// //         </h2>
// //         <div className="border border-gray-300 rounded-lg overflow-hidden">
// //           <table className="min-w-full divide-y divide-gray-300">
// //             <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
// //               <tr>
// //                 <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-32 sticky left-0 rounded-tl-lg">
// //                   Time Slot
// //                 </th>
// //                 {headerDays.map((day) => (
// //                   <th
// //                     key={day}
// //                     className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
// //                   >
// //                     {day}
// //                   </th>
// //                 ))}
// //               </tr>
// //             </thead>
// //             <tbody className="bg-white divide-y divide-gray-200">
// //               {displayTimeSlots.map((slot, slotIndex) => (
// //                 <tr
// //                   key={slot.startTime}
// //                   className={
// //                     slot.type === "break"
// //                       ? "bg-yellow-100 font-semibold text-yellow-800"
// //                       : slotIndex % 2 === 0
// //                       ? "bg-gray-50 hover:bg-gray-100"
// //                       : "bg-white hover:bg-gray-50"
// //                   }
// //                 >
// //                   <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 bg-inherit">
// //                     {slot.startTime} - {slot.endTime}
// //                   </td>

// //                   {headerDays.map((day) => (
// //                     <td
// //                       key={`${day}-${slot.startTime}`}
// //                       className="px-4 py-3 border-r border-gray-200 text-center align-top"
// //                     >
// //                       {slot.type === "break" ? (
// //                         "Break"
// //                       ) : organizedTimetable[day][slot.startTime]?.length >
// //                         0 ? (
// //                         organizedTimetable[day][slot.startTime].map(
// //                           (assignment, idx) => (
// //                             <div
// //                               key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
// //                               className={`mb-2 p-2 rounded-md shadow-sm text-xs text-left last:mb-0
// //                   ${
// //                     assignment.subjectType === "lecture"
// //                       ? "bg-indigo-50 border border-indigo-200 text-indigo-800"
// //                       : assignment.subjectType === "lab"
// //                       ? "bg-green-50 border border-green-200 text-green-800"
// //                       : "bg-gray-50 border border-gray-200 text-gray-700"
// //                   }`}
// //                             >
// //                               <p className="font-bold">
// //                                 {assignment.subjectName} (
// //                                 {assignment.subjectCode})
// //                               </p>
// //                               <p>
// //                                 Batch:{" "}
// //                                 <span className="font-medium">
// //                                   {assignment.batchName}
// //                                 </span>
// //                               </p>
// //                               <p>
// //                                 Faculty:{" "}
// //                                 <span className="font-medium">
// //                                   {assignment.facultyName}
// //                                 </span>
// //                               </p>
// //                               <p>
// //                                 Room:{" "}
// //                                 <span className="font-medium">
// //                                   {assignment.roomName}
// //                                 </span>
// //                               </p>
// //                               <p className="text-gray-600 text-xs mt-1 italic">
// //                                 {assignment.subjectType
// //                                   .charAt(0)
// //                                   .toUpperCase() +
// //                                   assignment.subjectType.slice(1)}
// //                               </p>
// //                             </div>
// //                           )
// //                         )
// //                       ) : (
// //                         <div className="text-center text-gray-400 text-xs py-2">
// //                           -
// //                         </div>
// //                       )}
// //                     </td>
// //                   ))}
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>
// //     );
// //   };

// //   // --- Render timetable wrapper ---
// //   const renderTimetableTable = () => {
// //     const schemaIdToUse = viewedSchemaId;
// //     if (!schemaIdToUse) return null;

// //     const selectedSchema = timetableSchemaMap.current.get(schemaIdToUse);
// //     if (!selectedSchema) {
// //       return (
// //         <p className="text-red-500 text-center mt-8 text-lg">
// //           Error: Selected timetable schema details not found.
// //         </p>
// //       );
// //     }

// //     if (viewedClassId === "all-classes") {
// //       return (
// //         <div className="space-y-12">
// //           {classes
// //             .filter((c) => c._id !== "all-classes")
// //             .map((cls) => {
// //               const classData = generatedTimetable[cls._id];
// //               if (!classData || classData.length === 0) {
// //                 return (
// //                   <p key={cls._id} className="text-center text-gray-600">
// //                     No timetable generated for {cls.name}.
// //                   </p>
// //                 );
// //               }
// //               return (
// //                 <div key={cls._id}>
// //                   {renderSingleClassTable(selectedSchema, cls._id, classData)}
// //                 </div>
// //               );
// //             })}
// //         </div>
// //       );
// //     }

// //     return renderSingleClassTable(
// //       selectedSchema,
// //       viewedClassId,
// //       generatedTimetable
// //     );
// //   };

// //   // Page animation variants
// //   const pageVariants = {
// //     hidden: { opacity: 0, y: 20 },
// //     visible: {
// //       opacity: 1,
// //       y: 0,
// //       transition: { duration: 0.45, ease: "easeOut" },
// //     },
// //   };

// //   return (
// //     <motion.div
// //       className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter"
// //       initial="hidden"
// //       animate="visible"
// //       variants={pageVariants}
// //     >
// //       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
// //         <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
// //           View Timetable
// //         </h1>

// //         {initialLoading && (
// //           <div className="flex justify-center items-center h-40">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
// //             <p className="ml-4 text-gray-600">Loading data...</p>
// //           </div>
// //         )}

// //         {fetchError && (
// //           <div
// //             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
// //             role="alert"
// //           >
// //             <strong className="font-bold">Error: </strong>
// //             <span className="block sm:inline">{fetchError}</span>
// //           </div>
// //         )}

// //         {!initialLoading &&
// //           !fetchError &&
// //           classes.length === 1 &&
// //           classes[0]._id === "all-classes" && (
// //             <p className="text-center text-gray-600 text-lg mb-6">
// //               No classes available. Please add classes first.
// //             </p>
// //           )}
// //         {!initialLoading && !fetchError && timetables.length === 0 && (
// //           <p className="text-center text-gray-600 text-lg mb-6">
// //             No timetable schemas available. Please define a schema first.
// //           </p>
// //         )}

// //         {!initialLoading &&
// //           !fetchError &&
// //           classes.length > 0 &&
// //           timetables.length > 0 && (
// //             <div className="space-y-6 mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
// //               <div>
// //                 <label
// //                   htmlFor="select-class"
// //                   className="block text-sm font-medium text-gray-700 mb-1"
// //                 >
// //                   Select Class
// //                 </label>
// //                 <select
// //                   id="select-class"
// //                   value={selectedClassId}
// //                   onChange={handleClassChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
// //                 >
// //                   <option value="all-classes">All Classes</option>
// //                   {classes
// //                     .filter((c) => c._id !== "all-classes")
// //                     .map((cls) => (
// //                       <option key={cls._id} value={cls._id}>
// //                         {cls.name} ({cls.year})
// //                       </option>
// //                     ))}
// //                 </select>
// //               </div>

// //               <div>
// //                 <label
// //                   htmlFor="select-timetable-schema"
// //                   className="block text-sm font-medium text-gray-700 mb-1"
// //                 >
// //                   Select Timetable Schema
// //                 </label>
// //                 <select
// //                   id="select-timetable-schema"
// //                   value={selectedTimetableSchemaId}
// //                   onChange={handleSchemaChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
// //                 >
// //                   {timetables.map((tt) => (
// //                     <option key={tt._id} value={tt._id}>
// //                       {tt.name} ({tt.days?.join(", ")})
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>

// //               <div className="flex items-center gap-4">
// //                 <motion.button
// //                   onClick={handleViewClick}
// //                   type="button"
// //                   className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60"
// //                   whileTap={{ scale: 0.98 }}
// //                   disabled={viewLoading}
// //                 >
// //                   {viewLoading ? "Loading..." : "View Timetable"}
// //                 </motion.button>

// //                 <button
// //                   type="button"
// //                   onClick={() => {
// //                     setGeneratedTimetable([]);
// //                     setViewedClassId(null);
// //                     setViewedSchemaId(null);
// //                     setFetchError(null);
// //                     setViewMessage(null);
// //                   }}
// //                   className="py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
// //                 >
// //                   Clear View
// //                 </button>
// //               </div>
// //             </div>
// //           )}

// //         {viewMessage && (
// //           <p className="text-center text-gray-600 mt-6 text-lg">
// //             {viewMessage}
// //           </p>
// //         )}

// //         {generatedTimetable && !viewLoading && renderTimetableTable()}
// //       </div>
// //     </motion.div>
// //   );
// // };

// // export default CompactGridTimetable;

// import React, { useEffect, useState, useRef } from "react";
// import axios from "../../axiosConfig.js";
// import { motion } from "framer-motion";
// import { useAuth } from "../../Context/authContext.jsx";
// import { useNavigate } from "react-router-dom";

// const CompactGridTimetable = () => {
//   // Metadata state
//   const [classes, setClasses] = useState([]);
//   const [timetables, setTimetables] = useState([]);

//   // Selection state
//   const [selectedClassId, setSelectedClassId] = useState("");
//   const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
//     useState("");

//   // Timetable state
//   const [generatedTimetable, setGeneratedTimetable] = useState([]);
//   const [viewedClassId, setViewedClassId] = useState(null);
//   const [viewedSchemaId, setViewedSchemaId] = useState(null);

//   // Loading and error state
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [viewLoading, setViewLoading] = useState(false);
//   const [fetchError, setFetchError] = useState(null);
//   const [viewMessage, setViewMessage] = useState(null);

//   // Auth and navigation
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // Lookup maps (cached references)
//   const subjectMap = useRef(new Map());
//   const roomMap = useRef(new Map());
//   const facultyMap = useRef(new Map());
//   const timetableSchemaMap = useRef(new Map());
//   const classMap = useRef(new Map());

//   // --- Fetch initial metadata ---
//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     const fetchData = async () => {
//       setInitialLoading(true);
//       setFetchError(null);

//       try {
//         const [classesRes, timetablesRes, subjectsRes, roomsRes, facultiesRes] =
//           await Promise.all([
//             axios.get("/api/class/"),
//             axios.get("/api/timetable/"),
//             axios.get("/api/subject/"),
//             axios.get("/api/room/"),
//             axios.get("/api/faculty/"),
//           ]);

//         // Add "All Classes" option
//         const fetchedClasses = [
//           { _id: "all-classes", name: "All Classes", year: "" },
//           ...classesRes.data,
//         ];
//         setClasses(fetchedClasses);
//         classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

//         setTimetables(timetablesRes.data || []);
//         (timetablesRes.data || []).forEach((tt) =>
//           timetableSchemaMap.current.set(tt._id, tt)
//         );

//         (subjectsRes.data || []).forEach((s) =>
//           subjectMap.current.set(s._id, s)
//         );
//         (roomsRes.data || []).forEach((r) => roomMap.current.set(r._id, r));
//         (facultiesRes.data || []).forEach((f) =>
//           facultyMap.current.set(f._id, f)
//         );

//         if (fetchedClasses.length > 0)
//           setSelectedClassId(fetchedClasses[0]._id);
//         if ((timetablesRes.data || []).length > 0)
//           setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
//       } catch (err) {
//         console.error("Initial data load error:", err);
//         setFetchError(
//           err?.response?.data?.message || "Failed to load initial data."
//         );
//       } finally {
//         setInitialLoading(false);
//       }
//     };

//     fetchData();
//   }, [user, navigate]);

//   // --- Handle class change ---
//   const handleClassChange = (e) => {
//     setSelectedClassId(e.target.value);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);
//     setFetchError(null);
//     setViewMessage(null);
//   };

//   // --- Handle schema change ---
//   const handleSchemaChange = (e) => {
//     setSelectedTimetableSchemaId(e.target.value);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);
//     setFetchError(null);
//     setViewMessage(null);
//   };

//   // --- Handle view timetable ---
//   const handleViewClick = async () => {
//     setFetchError(null);
//     setViewMessage(null);
//     setGeneratedTimetable([]);
//     setViewedClassId(null);
//     setViewedSchemaId(null);

//     if (!selectedTimetableSchemaId) {
//       setFetchError("Please select a timetable schema.");
//       return;
//     }

//     try {
//       setViewLoading(true);

//       if (selectedClassId === "all-classes") {
//         // Fetch timetable for all classes
//         const timetableResults = {};
//         for (const cls of classes.filter((c) => c._id !== "all-classes")) {
//           try {
//             const res = await axios.get(
//               `/api/generatedtimetable/class/${cls._id}`,
//               { params: { timetableSchemaId: selectedTimetableSchemaId } }
//             );
//             timetableResults[cls._id] = res.data || [];
//           } catch (err) {
//             timetableResults[cls._id] = {
//               error: true,
//               message: "Failed to fetch timetable.",
//             };
//           }
//         }
//         console.log(timetableResults);

//         setGeneratedTimetable(timetableResults);
//         setViewedClassId("all-classes");
//         setViewedSchemaId(selectedTimetableSchemaId);
//       } else {
//         // Fetch timetable for single class
//         const res = await axios.get(
//           `/api/generatedtimetable/class/${selectedClassId}`,
//           { params: { timetableSchemaId: selectedTimetableSchemaId } }
//         );

//         const data = res.data || [];
//         setGeneratedTimetable(data);
//         setViewedClassId(selectedClassId);
//         setViewedSchemaId(selectedTimetableSchemaId);

//         if (!data || (Array.isArray(data) && data.length === 0)) {
//           setViewMessage(
//             `No timetable generated for "${
//               classMap.current.get(selectedClassId)?.name || "this class"
//             }" using "${
//               timetableSchemaMap.current.get(selectedTimetableSchemaId)?.name ||
//               "this schema"
//             }".`
//           );
//         }
//       }
//     } catch (err) {
//       console.error("Error fetching class timetable:", err);
//       setFetchError(
//         err?.response?.data?.message ||
//           "Failed to fetch timetable for the selected class."
//       );
//     } finally {
//     } finally {
//       setViewLoading(false);
//     }
//   };

//   // --- Drag and Drop Handlers ---
const handleDragStart = (e, entry) => {
  e.dataTransfer.setData("application/json", JSON.stringify(entry));
  e.dataTransfer.effectAllowed = "move";
};

const handleDragOver = (e) => {
  e.preventDefault(); // Necessary to allow dropping
  e.dataTransfer.dropEffect = "move";
};

const handleDrop = async (e, day, slot) => {
  e.preventDefault();
  const data = e.dataTransfer.getData("application/json");
  if (!data) return;

  const entry = JSON.parse(data);

  // Prevent dropping on self (same day same time)
  if (entry.day === day && entry.startTime === slot.startTime) return;

  // Check if slot is strictly valid format (HH:MM vs HH:MM)
  // Assuming backend validation handles most checks, but we can prevent obvious issues

  try {
    // Optimistic update or waiting state? Let's use loading state
    // setViewLoading(true); // Maybe too heavy to reload whole table, let's just show toast 

    const response = await axios.post("/api/generatedtimetable/move", {
      entryId: entry.entryId, // Ensure we passed ID in entryData
      newDay: day,
      newStartTime: slot.startTime,
      newEndTime: slot.endTime
    });

    // Show success
    setFetchError(null);
    setViewMessage(`Successfully moved ${entry.subjectName} to ${day} ${slot.startTime} `);

    // Reload timetable to show changes
    handleViewClick();

  } catch (err) {
    console.error("Move failed:", err);
    const msg = err.response?.data?.message || "Failed to move slot. Check conflicts.";
    // Show error in a more visible way?
    alert(msg); // Temporary, better to use a Toast component if available
  }
};


// --- Helper: Get slot index by start time ---
const getSlotIndex = (slots, startTime) => {
  return slots.findIndex((slot) => slot.startTime === startTime);
};

// --- Render timetable for one class ---
const renderSingleClassTable = (schema, classId, timetableEntries) => {
  const sortedTimeSlots = [...(schema.slots || [])].sort((a, b) => {
    const timeA = new Date(`2000 /01 /01 ${a.startTime} `);
    const timeB = new Date(`2000 /01 /01 ${b.startTime} `);
    return timeA - timeB;
  });

  const organizedTimetable = {};
  (schema.days || []).forEach((day) => {
    organizedTimetable[day] = {};
    sortedTimeSlots.forEach((slot) => {
      organizedTimetable[day][slot.startTime] = [];
    });
  });

  // Track which slots are occupied (for rowspan handling)
  const occupiedSlots = {};
  (schema.days || []).forEach((day) => {
    occupiedSlots[day] = {};
    sortedTimeSlots.forEach((slot) => {
      occupiedSlots[day][slot.startTime] = false;
    });
  });

  (timetableEntries || []).forEach((entry) => {
    if (
      organizedTimetable[entry.day] &&
      organizedTimetable[entry.day][entry.startTime]
    ) {
      const subjectType = entry.subject?.type || "N/A";
      const entryData = {
        entryId: entry._id, // IMPORTANT: Needed for DnD
        batchName: entry.batchName,
        subjectName: entry.subject?.name || "N/A",
        subjectCode: entry.subject?.code || "N/A",
        subjectType: subjectType,
        facultyName: entry.facultyName || "N/A",
        roomName: entry.room?.name || "N/A",
        duration: subjectType === "lab" ? 2 : 1,
        day: entry.day, // Needed for DnD check
        startTime: entry.startTime // Needed for DnD check
      };
      organizedTimetable[entry.day][entry.startTime].push(entryData);

      // Mark this slot and subsequent slots as occupied
      const startIdx = getSlotIndex(sortedTimeSlots, entry.startTime);
      if (startIdx !== -1) {
        for (let i = 0; i < entryData.duration; i++) {
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

  const headerDays = schema.days || [];
  const currentClassName =
    classMap.current.get(classId)?.name || "Selected Class";
  const displayTimeSlots = sortedTimeSlots;

  return (
    <div className="overflow-x-auto mt-8 p-4 bg-white rounded-lg shadow-md font-inter">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Timetable for {currentClassName}
      </h2>
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <tr>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-32 sticky left-0 rounded-tl-lg">
                Time Slot
              </th>
              {headerDays.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTimeSlots.map((slot, slotIndex) => {
              if (slot.type === "break") {
                return (
                  <tr
                    key={slot.startTime}
                    className="bg-yellow-100 font-semibold text-yellow-800"
                  >
                    <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 bg-inherit">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    {headerDays.map((day) => (
                      <td
                        key={`${day} -${slot.startTime} `}
                        className="px-4 py-3 border-r border-gray-200 text-center align-top"
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
                  className={
                    slotIndex % 2 === 0
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 bg-inherit">
                    {slot.startTime} - {slot.endTime}
                  </td>

                  {headerDays.map((day) => {
                    // Check if this slot is already occupied by a previous entry with duration > 1
                    const isOccupied = occupiedSlots[day][slot.startTime];
                    const entries =
                      organizedTimetable[day][slot.startTime] || [];

                    // If slot is occupied but has no entries starting here, skip rendering (part of rowspan)
                    if (isOccupied && entries.length === 0) {
                      return null;
                    }

                    // Determine rowspan for entries starting in this slot
                    const rowspan =
                      entries.length > 0 && entries[0].duration > 1
                        ? entries[0].duration
                        : 1;

                    return (
                      <td
                        key={`${day} -${slot.startTime} `}
                        rowSpan={rowspan}
                        className="px-4 py-3 border-r border-gray-200 text-center align-top relative transition-colors hover:bg-blue-50"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, slot)}
                      >
                        {entries.length > 0 ? (
                          entries.map((assignment, idx) => (
                            <div
                              key={`${day} -${slot.startTime} -${assignment.batchName} -${idx} `}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, assignment)}
                              className={`mb - 2 p - 2 rounded - md shadow - sm text - xs text - left last: mb - 0 cursor - move transform hover: scale - 105 transition - transform duration - 200 grab - cursor
                                  ${assignment.subjectType === "lecture"
                                  ? "bg-indigo-50 border border-indigo-200 text-indigo-800"
                                  : assignment.subjectType === "lab"
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : "bg-gray-50 border border-gray-200 text-gray-700"
                                } `}
                            >
                              <p className="font-bold">
                                {assignment.subjectName} (
                                {assignment.subjectCode})
                              </p>
                              <p>
                                Batch:{" "}
                                <span className="font-medium">
                                  {assignment.batchName}
                                </span>
                              </p>
                              <p>
                                Faculty:{" "}
                                <span className="font-medium">
                                  {assignment.facultyName}
                                </span>
                              </p>
                              <p>
                                Room:{" "}
                                <span className="font-medium">
                                  {assignment.roomName}
                                </span>
                              </p>
                              <p className="text-gray-600 text-xs mt-1 italic">
                                {assignment.subjectType
                                  .charAt(0)
                                  .toUpperCase() +
                                  assignment.subjectType.slice(1)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400 text-xs py-2 h-full min-h-[50px] flex items-center justify-center border-2 border-transparent border-dashed hover:border-blue-300 rounded-lg">
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

//   // --- Render timetable wrapper ---
//   const renderTimetableTable = () => {
//     const schemaIdToUse = viewedSchemaId;
//     if (!schemaIdToUse) return null;

//     const selectedSchema = timetableSchemaMap.current.get(schemaIdToUse);
//     if (!selectedSchema) {
//       return (
//         <p className="text-red-500 text-center mt-8 text-lg">
//           Error: Selected timetable schema details not found.
//         </p>
//       );
//     }

//     if (viewedClassId === "all-classes") {
//       return (
//         <div className="space-y-12">
//           {classes
//             .filter((c) => c._id !== "all-classes")
//             .map((cls) => {
//               const classData = generatedTimetable[cls._id];
//               if (!classData || classData.length === 0) {
//                 return (
//                   <p key={cls._id} className="text-center text-gray-600">
//                     No timetable generated for {cls.name}.
//                   </p>
//                 );
//               }
//               return (
//                 <div key={cls._id}>
//                   {renderSingleClassTable(selectedSchema, cls._id, classData)}
//                 </div>
//               );
//             })}
//         </div>
//       );
//     }

//     return renderSingleClassTable(
//       selectedSchema,
//       viewedClassId,
//       generatedTimetable
//     );
//   };

//   // Page animation variants
//   const pageVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.45, ease: "easeOut" },
//     },
//   };

//   return (
//     <motion.div
//       className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter"
//       initial="hidden"
//       animate="visible"
//       variants={pageVariants}
//     >
//       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl">
//         <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
//           View Timetable
//         </h1>

//         {initialLoading && (
//           <div className="flex justify-center items-center h-40">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
//             <p className="ml-4 text-gray-600">Loading data...</p>
//           </div>
//         )}

//         {fetchError && (
//           <div
//             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6"
//             role="alert"
//           >
//             <strong className="font-bold">Error: </strong>
//             <span className="block sm:inline">{fetchError}</span>
//           </div>
//         )}

//         {!initialLoading &&
//           !fetchError &&
//           classes.length === 1 &&
//           classes[0]._id === "all-classes" && (
//             <p className="text-center text-gray-600 text-lg mb-6">
//               No classes available. Please add classes first.
//             </p>
//           )}
//         {!initialLoading && !fetchError && timetables.length === 0 && (
//           <p className="text-center text-gray-600 text-lg mb-6">
//             No timetable schemas available. Please define a schema first.
//           </p>
//         )}

//         {!initialLoading &&
//           !fetchError &&
//           classes.length > 0 &&
//           timetables.length > 0 && (
//             <div className="space-y-6 mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
//               <div>
//                 <label
//                   htmlFor="select-class"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Select Class
//                 </label>
//                 <select
//                   id="select-class"
//                   value={selectedClassId}
//                   onChange={handleClassChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
//                 >
//                   <option value="all-classes">All Classes</option>
//                   {classes
//                     .filter((c) => c._id !== "all-classes")
//                     .map((cls) => (
//                       <option key={cls._id} value={cls._id}>
//                         {cls.name} ({cls.year})
//                       </option>
//                     ))}
//                 </select>
//               </div>

//               <div>
//                 <label
//                   htmlFor="select-timetable-schema"
//                   className="block text-sm font-medium text-gray-700 mb-1"
//                 >
//                   Select Timetable Schema
//                 </label>
//                 <select
//                   id="select-timetable-schema"
//                   value={selectedTimetableSchemaId}
//                   onChange={handleSchemaChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
//                 >
//                   {timetables.map((tt) => (
//                     <option key={tt._id} value={tt._id}>
//                       {tt.name} ({tt.days?.join(", ")})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="flex items-center gap-4">
//                 <motion.button
//                   onClick={handleViewClick}
//                   type="button"
//                   className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60"
//                   whileTap={{ scale: 0.98 }}
//                   disabled={viewLoading}
//                 >
//                   {viewLoading ? "Loading..." : "View Timetable"}
//                 </motion.button>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setGeneratedTimetable([]);
//                     setViewedClassId(null);
//                     setViewedSchemaId(null);
//                     setFetchError(null);
//                     setViewMessage(null);
//                   }}
//                   className="py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
//                 >
//                   Clear View
//                 </button>
//               </div>
//             </div>
//           )}

//         {viewMessage && (
//           <p className="text-center text-gray-600 mt-6 text-lg">
//             {viewMessage}
//           </p>
//         )}

//         {generatedTimetable && !viewLoading && renderTimetableTable()}
//       </div>
//     </motion.div>
//   );
// };

// export default CompactGridTimetable;

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "../../axiosConfig.js";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas-pro"; // Use html2canvas-pro to support oklch colors
import { useAuth } from "../../Context/authContext.jsx";
import { useNavigate } from "react-router-dom";
import EditSlotModal from "./EditSlotModal";
import AddSlotModal from "./AddSlotModal";

const CompactGridTimetable = () => {
  // Metadata state
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);

  // Selection state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTimetableSchemaId, setSelectedTimetableSchemaId] =
    useState("");

  // Timetable state
  const [generatedTimetable, setGeneratedTimetable] = useState([]);
  const [viewedClassId, setViewedClassId] = useState(null);
  const [viewedSchemaId, setViewedSchemaId] = useState(null);

  // Download selection state
  const [selectedClassesForDownload, setSelectedClassesForDownload] = useState(
    new Set()
  );

  // Loading and error state
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [viewMessage, setViewMessage] = useState(null);

  // Move error toast state
  const [moveError, setMoveError] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlotData, setEditingSlotData] = useState(null);

  // Add Slot Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSlotData, setAddSlotData] = useState(null);

  // Auth and navigation
  const { user } = useAuth();
  const navigate = useNavigate();

  // Refs
  const classTableRefs = useRef({});

  // Lookup maps (cached references)
  const subjectMap = useRef(new Map());
  const roomMap = useRef(new Map());
  const facultyMap = useRef(new Map());
  const timetableSchemaMap = useRef(new Map());
  const classMap = useRef(new Map());

  // --- Fetch initial metadata ---
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setInitialLoading(true);
      setFetchError(null);
      try {
        const [classesRes, timetablesRes, subjectsRes, roomsRes, facultiesRes] =
          await Promise.all([
            axios.get("/api/class/"),
            axios.get("/api/timetable/"),
            axios.get("/api/subject/"),
            axios.get("/api/room/"),
            axios.get("/api/faculty/"),
          ]);

        // Add "All Classes" option
        const fetchedClasses = [
          { _id: "all-classes", name: "All Classes", year: "" },
          ...classesRes.data,
        ];
        setClasses(fetchedClasses);
        classesRes.data.forEach((cls) => classMap.current.set(cls._id, cls));

        setTimetables(timetablesRes.data || []);
        (timetablesRes.data || []).forEach((tt) =>
          timetableSchemaMap.current.set(tt._id, tt)
        );

        (subjectsRes.data || []).forEach((s) =>
          subjectMap.current.set(s._id, s)
        );
        (roomsRes.data || []).forEach((r) => roomMap.current.set(r._id, r));
        (facultiesRes.data || []).forEach((f) =>
          facultyMap.current.set(f._id, f)
        );

        if (fetchedClasses.length > 0)
          setSelectedClassId(fetchedClasses[0]._id);
        if ((timetablesRes.data || []).length > 0)
          setSelectedTimetableSchemaId(timetablesRes.data[0]._id);
      } catch (err) {
        console.error("Initial data load error:", err);
        setFetchError(
          err?.response?.data?.message || "Failed to load initial data."
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  // --- Handle class change ---
  const handleClassChange = (e) => {
    setSelectedClassId(e.target.value);
    setGeneratedTimetable([]);
    setViewedClassId(null);
    setViewedSchemaId(null);
    setFetchError(null);
    setViewMessage(null);
    setSelectedClassesForDownload(new Set());
  };

  // --- Handle schema change ---
  const handleSchemaChange = (e) => {
    setSelectedTimetableSchemaId(e.target.value);
    setGeneratedTimetable([]);
    setViewedClassId(null);
    setViewedSchemaId(null);
    setFetchError(null);
    setViewMessage(null);
    setSelectedClassesForDownload(new Set());
  };

  // --- Handle Edit Slot ---
  const handleEditClick = (entryData) => {
    setEditingSlotData(entryData);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the view
    handleViewClick();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSlotData(null);
  };

  // --- Handle Add Slot ---
  const handleAddSlotClick = (classId, day, slot) => {
    const classInfo = classMap.current.get(classId);
    setAddSlotData({
      classId,
      className: classInfo?.name || "Unknown Class",
      classYear: classInfo?.year,
      day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timetableSchemaId: viewedSchemaId,
    });
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    // Refresh the view
    handleViewClick();
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddSlotData(null);
  };

  // --- Handle view timetable ---
  const handleViewClick = async () => {
    setFetchError(null);
    setViewMessage(null);
    // setGeneratedTimetable([]);
    // setViewedClassId(null);
    // setViewedSchemaId(null);
    setSelectedClassesForDownload(new Set());

    if (!selectedTimetableSchemaId) {
      setFetchError("Please select a timetable schema.");
      return;
    }

    try {
      setViewLoading(true);

      if (selectedClassId === "all-classes") {
        // Fetch timetable for all classes
        const timetableResults = {};
        for (const cls of classes.filter((c) => c._id !== "all-classes")) {
          try {
            const res = await axios.get(
              `/api/generatedtimetable/class/${cls._id}`,
              { params: { timetableSchemaId: selectedTimetableSchemaId } }
            );
            timetableResults[cls._id] = res.data || [];
          } catch (err) {
            timetableResults[cls._id] = {
              error: true,
              message: "Failed to fetch timetable.",
            };
          }
        }
        console.log(timetableResults);

        // Select all classes for download by default
        const allClassIds = classes
          .filter((c) => c._id !== "all-classes")
          .map((c) => c._id);
        setSelectedClassesForDownload(new Set(allClassIds));

        setGeneratedTimetable(timetableResults);
        setViewedClassId("all-classes");
        setViewedSchemaId(selectedTimetableSchemaId);
      } else {
        // Fetch timetable for single class
        const res = await axios.get(
          `/api/generatedtimetable/class/${selectedClassId}`,
          { params: { timetableSchemaId: selectedTimetableSchemaId } }
        );

        const data = res.data || [];
        setGeneratedTimetable(data);
        setViewedClassId(selectedClassId);
        setViewedSchemaId(selectedTimetableSchemaId);

        if (!data || (Array.isArray(data) && data.length === 0)) {
          setViewMessage(
            `No timetable generated for "${classMap.current.get(selectedClassId)?.name || "this class"
            }" using "${timetableSchemaMap.current.get(selectedTimetableSchemaId)?.name ||
            "this schema"
            } ".`
          );
        }
      }
    } catch (err) {
      console.error("Error fetching class timetable:", err);
      setFetchError(
        err?.response?.data?.message ||
        "Failed to fetch timetable for the selected class."
      );
    } finally {
      setViewLoading(false);
    }
  };

  // --- Download PDF ---
  const downloadPDF = async () => {
    console.log("Starting download");
    if (!viewedSchemaId) return;

    let selectedClassIds;
    if (viewedClassId === "all-classes") {
      selectedClassIds = Array.from(selectedClassesForDownload);
      if (selectedClassIds.length === 0) {
        alert("Please select at least one class for download.");
        return;
      }
    } else {
      selectedClassIds = [viewedClassId];
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 10;
      const pageHeight = doc.internal.pageSize.getHeight() - 20;
      let yPosition = 20;

      for (let i = 0; i < selectedClassIds.length; i++) {
        const classId = selectedClassIds[i];
        const className =
          classMap.current.get(classId)?.name || "Unknown Class";

        // Start new page for each class except the first
        if (i > 0) {
          doc.addPage();
          yPosition = 20;
        }

        // Add title for the class
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(`Timetable for ${className}`, margin, yPosition);
        yPosition += 15;

        const tableEl = classTableRefs.current[classId];
        if (!tableEl) {
          doc.setFontSize(12);
          doc.text("Table not available", margin, yPosition);
          yPosition += 10;
          continue;
        }

        const canvas = await html2canvas(tableEl, {
          scale: 3, // Higher scale for sharper image
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          letterRendering: true, // Better text rendering
          width: tableEl.scrollWidth,
          height: tableEl.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = doc.internal.pageSize.getWidth() - 2 * margin;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add image with multi-page support
        let position = 0;
        let heightLeft = pdfHeight;
        let currentY = yPosition;

        // First part
        const firstHeight = Math.min(pdfHeight, pageHeight - currentY);
        doc.addImage(imgData, "PNG", margin, currentY, pdfWidth, firstHeight);
        heightLeft -= firstHeight;
        currentY = pageHeight;

        // Subsequent parts if needed
        while (heightLeft > 0) {
          doc.addPage();
          currentY = 20;
          const partHeight = Math.min(heightLeft, pageHeight - currentY);
          const clipY = pdfHeight - heightLeft;
          // Note: jsPDF addImage doesn't support clipping directly, so approximate by adjusting position
          // For simplicity, since tables are typically not too tall, we can add full but overlap
          position = -(pdfHeight - heightLeft);
          doc.addImage(imgData, "PNG", margin, position, pdfWidth, pdfHeight);
          heightLeft -= partHeight;
        }
        yPosition = currentY + 10; // Space after table
      }

      const fileName =
        selectedClassIds.length === 1
          ? `${classMap.current.get(selectedClassIds[0])?.name || "timetable"
          }-timetable.pdf`
          : "selected-timetables.pdf";

      doc.save(fileName);
      console.log("PDF downloaded successfully");
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  // --- Download Excel ---
  const downloadExcel = async () => {
    console.log("Starting Excel download");
    if (!viewedSchemaId) return;

    let selectedClassIds;
    if (viewedClassId === "all-classes") {
      selectedClassIds = Array.from(selectedClassesForDownload);
      if (selectedClassIds.length === 0) {
        alert("Please select at least one class for download.");
        return;
      }
    } else {
      selectedClassIds = [viewedClassId];
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Timetable System';
      workbook.created = new Date();

      const schema = timetableSchemaMap.current.get(viewedSchemaId);
      if (!schema) {
        alert("Timetable schema not found.");
        return;
      }

      const sortedSlots = [...(schema.slots || [])].sort((a, b) => {
        const timeA = new Date(`2000/01/01 ${a.startTime}`);
        const timeB = new Date(`2000/01/01 ${b.startTime}`);
        return timeA - timeB;
      });

      // Helper to get slot index
      const getSlotIdx = (startTime) => sortedSlots.findIndex(s => s.startTime === startTime);

      for (const classId of selectedClassIds) {
        const className = classMap.current.get(classId)?.name || "Unknown";
        const sheetName = className.substring(0, 31).replace(/[\\/*?:\[\]]/g, "");

        const worksheet = workbook.addWorksheet(sheetName);

        // Get timetable data for this class
        let classEntries = [];
        if (viewedClassId === "all-classes") {
          classEntries = generatedTimetable[classId] || [];
        } else {
          classEntries = generatedTimetable || [];
        }

        // Build organized timetable with lab duration tracking
        const organizedData = {};
        const labSpans = {}; // Track which cells are spanned by labs: { "day-slotIndex": true }

        schema.days.forEach(day => {
          organizedData[day] = {};
          sortedSlots.forEach((slot, idx) => {
            organizedData[day][idx] = { entries: [], isSpannedByPrevious: false };
          });
        });

        // Populate entries and track lab spans
        classEntries.forEach(entry => {
          const slotIdx = getSlotIdx(entry.startTime);
          if (slotIdx === -1) return;

          const entryType = entry.type || entry.subject?.type || "lecture";
          const isLab = entryType === "lab";
          const duration = isLab ? 2 : 1;

          // Add entry to its starting slot
          if (organizedData[entry.day] && organizedData[entry.day][slotIdx]) {
            organizedData[entry.day][slotIdx].entries.push({
              ...entry,
              duration,
              isLab
            });
          }

          // Mark subsequent slots as spanned (for labs)
          if (isLab && duration > 1) {
            for (let i = 1; i < duration; i++) {
              const nextSlotIdx = slotIdx + i;
              if (nextSlotIdx < sortedSlots.length && organizedData[entry.day][nextSlotIdx]) {
                organizedData[entry.day][nextSlotIdx].isSpannedByPrevious = true;
                labSpans[`${entry.day}-${nextSlotIdx}`] = true;
              }
            }
          }
        });

        // Set wider column widths for better visibility
        worksheet.columns = [
          { header: 'Time Slot', key: 'time', width: 20 },
          ...schema.days.map(day => ({ header: day, key: day, width: 35 }))
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1F4E79' }
          };
          cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 12 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: '000000' } },
            bottom: { style: 'medium', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          };
        });

        // Track merge operations for labs
        const mergesToApply = [];

        // Add data rows
        sortedSlots.forEach((slot, slotIndex) => {
          const excelRowNum = slotIndex + 2; // +2 because row 1 is header (1-indexed)
          const isBreak = slot.type === "break";

          // Build row data
          const rowData = { time: `${slot.startTime} - ${slot.endTime}` };
          let maxEntriesInRow = 0;
          let hasLabInRow = false;

          schema.days.forEach((day, dayIndex) => {
            const colNum = dayIndex + 2; // Column B onwards (1-indexed, A=1 is time)
            const slotData = organizedData[day][slotIndex];

            if (isBreak) {
              rowData[day] = "BREAK";
            } else if (slotData.isSpannedByPrevious) {
              // This cell is part of a lab span from previous row - leave empty
              // The merge will cover this
              rowData[day] = "";
            } else if (slotData.entries.length > 0) {
              // Format entries for this cell
              const formattedEntries = slotData.entries.map(e => {
                const subjectName = e.subject?.name || e.subjectName || "N/A";
                const batchName = e.batchName || "ALL";
                const facultyName = e.faculty?.name || e.facultyName || "N/A";
                const roomName = e.room?.name || "N/A";
                const type = e.type || e.subject?.type || "";
                const typeLabel = type ? ` (${type.toUpperCase()})` : "";
                return `${subjectName}${typeLabel}\n[${batchName}] ${facultyName}\nRoom: ${roomName}`;
              });

              rowData[day] = formattedEntries.join("\n---\n");
              maxEntriesInRow = Math.max(maxEntriesInRow, slotData.entries.length);

              // Check for labs that need merging
              slotData.entries.forEach(e => {
                if (e.isLab && e.duration > 1) {
                  hasLabInRow = true;
                  // Schedule merge: from current row to current row + duration - 1
                  mergesToApply.push({
                    startRow: excelRowNum,
                    endRow: excelRowNum + e.duration - 1,
                    startCol: colNum,
                    endCol: colNum
                  });
                }
              });
            } else {
              rowData[day] = "-";
            }
          });

          const dataRow = worksheet.addRow(rowData);

          // Calculate row height based on content
          let rowHeight;
          if (isBreak) {
            rowHeight = 22;
          } else if (hasLabInRow) {
            rowHeight = 70; // Taller for labs
          } else if (maxEntriesInRow > 1) {
            rowHeight = 50 + (maxEntriesInRow - 1) * 30; // More entries = taller
          } else {
            rowHeight = 55; // Standard height for single entry
          }
          dataRow.height = rowHeight;

          // Style each cell
          dataRow.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin', color: { argb: '000000' } },
              bottom: { style: 'thin', color: { argb: '000000' } },
              left: { style: 'thin', color: { argb: '000000' } },
              right: { style: 'thin', color: { argb: '000000' } }
            };

            cell.alignment = {
              horizontal: colNumber === 1 ? 'center' : 'left',
              vertical: 'top',
              wrapText: true
            };

            // Break row styling
            if (isBreak) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2CC' } // Light yellow
              };
              cell.font = { bold: true, color: { argb: '806600' }, size: 10 };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Time column styling
            if (colNumber === 1) {
              cell.font = { bold: true, size: 10 };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'E2EFDA' } // Light green
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            }

            // Style lab cells with a distinct background
            if (colNumber > 1) {
              const dayIndex = colNumber - 2;
              const day = schema.days[dayIndex];
              const slotData = organizedData[day]?.[slotIndex];

              if (slotData && slotData.entries.some(e => e.isLab)) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'E2F0D9' } // Light green for labs
                };
                cell.font = { size: 10, color: { argb: '2E7D32' } };
              } else if (slotData && slotData.entries.some(e => e.type === 'elective')) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF3E0' } // Light orange for electives
                };
                cell.font = { size: 10, color: { argb: 'E65100' } };
              } else if (!isBreak && cell.value && cell.value !== "-") {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'E3F2FD' } // Light blue for lectures
                };
                cell.font = { size: 10, color: { argb: '1565C0' } };
              }
            }
          });
        });

        // Apply cell merges for labs (after all rows are added)
        mergesToApply.forEach(merge => {
          try {
            if (merge.endRow <= sortedSlots.length + 1) { // +1 for header
              worksheet.mergeCells(merge.startRow, merge.startCol, merge.endRow, merge.endCol);
              // Re-apply styling to merged cell
              const mergedCell = worksheet.getCell(merge.startRow, merge.startCol);
              mergedCell.alignment = {
                horizontal: 'left',
                vertical: 'top',
                wrapText: true
              };
            }
          } catch (mergeErr) {
            console.warn("Could not merge cells:", mergeErr.message);
          }
        });

        // Freeze header row
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        // Auto-fit columns based on content (approximate)
        worksheet.columns.forEach((column, idx) => {
          if (idx === 0) {
            column.width = 18; // Time column
          } else {
            column.width = 32; // Day columns - wide enough for content
          }
        });
      }

      // Generate and download
      const fileName = selectedClassIds.length === 1
        ? `${classMap.current.get(selectedClassIds[0])?.name || "timetable"}-timetable.xlsx`
        : "selected-timetables.xlsx";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log("Excel downloaded successfully");
    } catch (err) {
      console.error("Excel download error:", err);
      alert("Error generating Excel: " + err.message);
    }
  };


  // --- Helper: Get slot index by start time ---
  const getSlotIndex = (slots, startTime) => {
    return slots.findIndex((slot) => slot.startTime === startTime);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, entry) => {
    e.dataTransfer.setData("application/json", JSON.stringify(entry));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, day, slot) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;

    try {
      const entry = JSON.parse(data);
      // Prevent dropping on self
      if (entry.day === day && entry.startTime === slot.startTime) return;

      const response = await axios.post("/api/generatedtimetable/move", {
        entryId: entry.entryId,
        newDay: day,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime
      });

      setFetchError(null);
      setViewMessage(`Successfully moved ${entry.subjectName} to ${day} ${slot.startTime}`);

      // Use returned updated entries for immediate state update (no flicker)
      if (response.data.updatedEntries && response.data.updatedEntries.length > 0) {
        const updatedIds = new Set(response.data.updatedEntries.map(e => e._id));
        const hasElectives = response.data.updatedEntries.some(e => e.type === 'elective');

        // For electives, always refetch since they affect multiple classes
        if (hasElectives) {
          handleViewClick();
        } else if (viewedClassId === "all-classes") {
          // For all-classes view, update the nested structure
          setGeneratedTimetable(prev => {
            const newTimetable = { ...prev };
            // Update each class's entries
            Object.keys(newTimetable).forEach(classId => {
              if (Array.isArray(newTimetable[classId])) {
                newTimetable[classId] = [
                  ...newTimetable[classId].filter(e => !updatedIds.has(e._id)),
                  ...response.data.updatedEntries.filter(e =>
                    e.classId?._id === classId || e.classId === classId
                  )
                ];
              }
            });
            return newTimetable;
          });
        } else {
          // For single class view, update flat array
          setGeneratedTimetable(prev => [
            ...prev.filter(e => !updatedIds.has(e._id)),
            ...response.data.updatedEntries
          ]);
        }
      } else {
        // Fallback to full refetch if no updated entries returned
        handleViewClick();
      }

    } catch (err) {
      console.error("Move failed:", err);
      const errorMessage = err.response?.data?.message || "Failed to move slot. Check conflicts.";

      // Parse conflict type from message for better UI
      let conflictType = 'error';
      if (errorMessage.includes('Room Conflict')) conflictType = 'room';
      else if (errorMessage.includes('Faculty Conflict')) conflictType = 'faculty';
      else if (errorMessage.includes('Class') || errorMessage.includes('Batch')) conflictType = 'class';

      setMoveError({
        message: errorMessage,
        type: conflictType,
        timestamp: Date.now()
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setMoveError(null), 5000);
    }
  };

  // --- Render timetable for one class ---
  const renderSingleClassTable = (
    schema,
    classId,
    timetableEntries,
    tableRef
  ) => {
    const sortedTimeSlots = [...(schema.slots || [])].sort((a, b) => {
      const timeA = new Date(`2000/01/01 ${a.startTime}`);
      const timeB = new Date(`2000/01/01 ${b.startTime}`);
      return timeA - timeB;
    });

    const organizedTimetable = {};
    (schema.days || []).forEach((day) => {
      organizedTimetable[day] = {};
      sortedTimeSlots.forEach((slot) => {
        organizedTimetable[day][slot.startTime] = [];
      });
    });

    // Track which slots are occupied (for rowspan handling)
    const occupiedSlots = {};
    (schema.days || []).forEach((day) => {
      occupiedSlots[day] = {};
      sortedTimeSlots.forEach((slot) => {
        occupiedSlots[day][slot.startTime] = false;
      });
    });

    (timetableEntries || []).forEach((entry) => {
      if (
        organizedTimetable[entry.day] &&
        organizedTimetable[entry.day][entry.startTime]
      ) {
        const subjectType = entry.type || entry.subject?.type || "N/A";
        const entryData = {
          entryId: entry._id, // Added for DnD
          _id: entry._id,     // Full ID reference
          day: entry.day,     // Added for DnD
          startTime: entry.startTime, // Added for DnD
          endTime: entry.endTime,
          subject: entry.subject,
          faculty: entry.faculty,
          room: entry.room,
          electiveGroup: entry.electiveGroup,
          type: entry.type,
          batchName: entry.batchName,
          subjectName: entry.subject?.name || "N/A",
          subjectCode: entry.subject?.code || "N/A",
          subjectType: subjectType,
          facultyName: entry.faculty?.name || entry.facultyName || "N/A",
          roomName: entry.room?.name || "N/A",
          duration: subjectType === "lab" ? 2 : 1,
        };
        organizedTimetable[entry.day][entry.startTime].push(entryData);

        // Mark this slot and subsequent slots as occupied
        const startIdx = getSlotIndex(sortedTimeSlots, entry.startTime);
        if (startIdx !== -1) {
          for (let i = 0; i < entryData.duration; i++) {
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

    const headerDays = schema.days || [];
    const currentClassName =
      classMap.current.get(classId)?.name || "Selected Class";
    const displayTimeSlots = sortedTimeSlots;

    return (
      <div
        ref={tableRef}
        className="overflow-x-auto p-4 bg-white rounded-lg shadow-md font-inter print:p-1 print:rounded-none print:bg-white"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 print:text-lg print:mb-3 print:font-bold">
          Timetable for {currentClassName}
        </h2>
        <div className="border border-gray-300 rounded-lg overflow-hidden print:border print:border-black print:border-1">
          <table className="min-w-full divide-y divide-gray-300 print:table-fixed print:divide-y print:divide-gray-400">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white print:bg-blue-600">
              <tr className="print:bg-blue-600">
                <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 w-32 sticky left-0 rounded-tl-lg print:px-1 print:py-1.5 print:text-xs print:w-20 print:border-r print:border-white print:sticky left-0">
                  Time Slot
                </th>
                {headerDays.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-blue-700 print:px-1 print:py-1.5 print:text-xs print:border-r print:border-white"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 print:bg-white print:divide-y print:divide-gray-300">
              {displayTimeSlots.map((slot, slotIndex) => {
                if (slot.type === "break") {
                  return (
                    <tr
                      key={slot.startTime}
                      className="bg-yellow-100 font-semibold text-yellow-800 print:bg-yellow-200"
                    >
                      <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 bg-inherit print:px-1 print:py-1.5 print:text-xs print:border-r print:border-gray-400 print:sticky left-0 print:bg-yellow-200">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      {headerDays.map((day) => (
                        <td
                          key={`${day}-${slot.startTime}`}
                          className="px-4 py-3 border-r border-gray-200 text-center align-top print:px-1 print:py-1.5 print:text-xs print:border-r print:border-gray-400 print:bg-yellow-200"
                        >
                          Break
                        </td>
                      ))}
                    </tr>
                  );
                }

                const rowBgClass =
                  slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white";

                return (
                  // --- START OF CORRECTION ---
                  // We remove ${rowBgClass} from the <tr>. The <td> cells
                  // will handle their own backgrounds. This stops the <tr>
                  // background from appearing "behind" a spanned cell.
                  <tr
                    key={slot.startTime}
                    className={`hover:bg-gray-100 print:bg-white print:hover:bg-white`}
                  >
                    {/* --- END OF CORRECTION --- */}

                    <td
                      className={`px-4 py-3 text-center text-sm font-medium border-r border-gray-200 sticky left-0 ${rowBgClass} print:px-1 print:py-1.5 print:text-xs print:border-r print:border-gray-400 print:sticky left-0 print:bg-white print:${rowBgClass.replace(
                        "bg-",
                        "print:bg-"
                      )}`}
                    >
                      {slot.startTime} - {slot.endTime}
                    </td>

                    {headerDays.map((day) => {
                      const isOccupied = occupiedSlots[day][slot.startTime];
                      const entries =
                        organizedTimetable[day][slot.startTime] || [];

                      if (isOccupied && entries.length === 0) {
                        return null;
                      }

                      const rowspan =
                        entries.length > 0 && entries[0].duration > 1
                          ? entries[0].duration
                          : 1;

                      // The cell background comes from rowBgClass
                      const cellBgClass = rowBgClass;

                      return (
                        <td
                          key={`${day}-${slot.startTime}`}
                          rowSpan={rowspan}
                          // Apply the cellBgClass here. For a rowspan=2 cell,
                          // this background will now cover the full height.
                          className={`px-4 py-3 border-r border-gray-200 text-center align-top ${cellBgClass} print:px-1 print:py-1 print:text-xs print:border-r print:border-gray-400 print:bg-white print:align-top transition-colors hover:bg-blue-50`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, slot)}
                        >
                          {entries.length > 0 ? (
                            entries.map((assignment, idx) => (
                              <div
                                key={`${day}-${slot.startTime}-${assignment.batchName}-${idx}`}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, assignment)}
                                className={`mb-2 p-2 rounded-md shadow-sm text-xs text-left last:mb-0 print:mb-0.5 print:p-0.5 print:text-[8px] print:rounded print:shadow-none cursor-move hover:scale-105 transition-transform ${assignment.subjectType === "lecture"
                                  ? "bg-indigo-50 border border-indigo-200 text-indigo-800 print:bg-indigo-100 print:border-indigo-300 print:text-indigo-900"
                                  : assignment.subjectType === "lab"
                                    ? "bg-green-50 border border-green-200 text-green-800 print:bg-green-100 print:border-green-300 print:text-green-900"
                                    : assignment.subjectType === "elective"
                                      ? "bg-amber-50 border border-amber-200 text-amber-800 print:bg-amber-100 print:border-amber-300 print:text-amber-900"
                                      : "bg-gray-50 border border-gray-200 text-gray-700 print:bg-gray-100 print:border-gray-300 print:text-gray-800"
                                  } relative group`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(assignment);
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-indigo-600 bg-white bg-opacity-75 rounded-full p-1 transition-opacity print:hidden shadow-sm border border-gray-200"
                                  title="Edit Slot"
                                >
                                  ✏️
                                </button>
                                <p className="font-bold print:font-semibold print:text-[9px]">
                                  {assignment.subjectName} (
                                  {assignment.subjectCode})
                                </p>
                                <p className="print:text-[7px]">
                                  Batch:{" "}
                                  <span className="font-medium">
                                    {assignment.batchName}
                                  </span>
                                </p>
                                <p className="print:text-[7px]">
                                  Faculty:{" "}
                                  <span className="font-medium">
                                    {assignment.facultyName}
                                  </span>
                                </p>
                                <p className="print:text-[7px]">
                                  Room:{" "}
                                  <span className="font-medium">
                                    {assignment.roomName}
                                  </span>
                                </p>
                                <p className="text-gray-600 text-xs mt-1 italic print:text-[6px] print:mt-0.5 print:italic">
                                  {assignment.subjectType
                                    .charAt(0)
                                    .toUpperCase() +
                                    assignment.subjectType.slice(1)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div
                              className="text-center text-gray-400 text-xs py-2 print:text-[8px] print:py-0.5 group cursor-pointer min-h-[40px] flex items-center justify-center hover:bg-green-50 rounded-lg transition-colors"
                              onClick={() => handleAddSlotClick(classId, day, slot)}
                              title="Click to add a new slot"
                            >
                              <span className="group-hover:hidden">-</span>
                              <span className="hidden group-hover:flex items-center gap-1 text-green-600 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add
                              </span>
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

  // --- Render timetable wrapper ---
  const renderTimetableTable = () => {
    const schemaIdToUse = viewedSchemaId;
    if (!schemaIdToUse) return null;

    const selectedSchema = timetableSchemaMap.current.get(schemaIdToUse);
    if (!selectedSchema) {
      return (
        <p className="text-red-500 text-center mt-8 text-lg">
          Error: Selected timetable schema details not found.
        </p>
      );
    }

    if (viewedClassId === "all-classes") {
      return (
        <div className="space-y-12 print:space-y-6">
          {classes
            .filter((c) => c._id !== "all-classes")
            .map((cls) => {
              const classData = generatedTimetable[cls._id];
              if (!classData || classData.length === 0) {
                return (
                  <div
                    key={cls._id}
                    className="text-center text-gray-600 p-4 print:p-2"
                  >
                    No timetable generated for {cls.name}.
                  </div>
                );
              }

              return (
                <div key={cls._id} className="print:break-inside-avoid">
                  <div className="flex items-center mb-4 p-4 bg-gray-50 rounded-lg print:hidden">
                    <input
                      type="checkbox"
                      id={`download-${cls._id}`}
                      checked={selectedClassesForDownload.has(cls._id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedClassesForDownload);
                        if (e.target.checked) {
                          newSet.add(cls._id);
                        } else {
                          newSet.delete(cls._id);
                        }
                        setSelectedClassesForDownload(newSet);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                    />
                    <label
                      htmlFor={`download-${cls._id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Include {cls.name} in PDF Download
                    </label>
                  </div>
                  {renderSingleClassTable(
                    selectedSchema,
                    cls._id,
                    classData,
                    (el) => {
                      classTableRefs.current[cls._id] = el;
                    }
                  )}
                </div>
              );
            })}
        </div>
      );
    }

    // Single class view
    const classData = generatedTimetable;
    return renderSingleClassTable(
      selectedSchema,
      viewedClassId,
      classData,
      (el) => {
        classTableRefs.current[viewedClassId] = el;
      }
    );
  };

  // Page animation variants
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const isDownloadDisabled =
    !generatedTimetable ||
    viewLoading ||
    (viewedClassId === "all-classes" && selectedClassesForDownload.size === 0);

  return (
    <motion.div
      className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-inter"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-xl print:p-4 print:bg-white">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8 print:text-2xl print:mb-4">
          View Timetable
        </h1>

        {/* Move Error Toast Notification */}
        {moveError && (
          <div className="fixed top-6 right-6 z-50 w-96 print:hidden">
            <div className={`rounded-xl shadow-2xl p-6 border-l-4 ${moveError.type === 'room'
              ? 'bg-orange-50 border-orange-500 text-orange-800'
              : moveError.type === 'faculty'
                ? 'bg-purple-50 border-purple-500 text-purple-800'
                : moveError.type === 'class'
                  ? 'bg-blue-50 border-blue-500 text-blue-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {moveError.type === 'room' && (
                    <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {moveError.type === 'faculty' && (
                    <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {moveError.type === 'class' && (
                    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {moveError.type === 'error' && (
                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold">
                    {moveError.type === 'room' && '🏠 Room Conflict'}
                    {moveError.type === 'faculty' && '👤 Faculty Conflict'}
                    {moveError.type === 'class' && '📚 Class/Batch Conflict'}
                    {moveError.type === 'error' && '⚠️ Move Failed'}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed">
                    {moveError.message.replace(/Room Conflict:|Faculty Conflict:|Class\/Batch Conflict:/, '').trim()}
                  </p>
                </div>
                <button
                  onClick={() => setMoveError(null)}
                  className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {initialLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
            <p className="ml-4 text-gray-600">Loading data...</p>
          </div>
        )}

        {fetchError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center mb-6 print:bg-red-50 print:border-red-300 print:text-red-800"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {!initialLoading &&
          !fetchError &&
          classes.length === 1 &&
          classes[0]._id === "all-classes" && (
            <p className="text-center text-gray-600 text-lg mb-6 print:text-base">
              No classes available. Please add classes first.
            </p>
          )}

        {!initialLoading && !fetchError && timetables.length === 0 && (
          <p className="text-center text-gray-600 text-lg mb-6 print:text-base">
            No timetable schemas available. Please define a schema first.
          </p>
        )}

        {!initialLoading &&
          !fetchError &&
          classes.length > 0 &&
          timetables.length > 0 && (
            <div className="space-y-6 mb-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50 print:p-3 print:border print:border-gray-400 print:bg-gray-50 print:rounded-none">
              <div>
                <label
                  htmlFor="select-class"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Select Class
                </label>
                <select
                  id="select-class"
                  value={selectedClassId}
                  onChange={handleClassChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                >
                  <option value="all-classes">All Classes</option>
                  {classes
                    .filter((c) => c._id !== "all-classes")
                    .map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.year})
                      </option>
                    ))}
                </select>
              </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                >
                  {timetables.map((tt) => (
                    <option key={tt._id} value={tt._id}>
                      {tt.name} ({tt.days?.join(", ")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 print:flex-col print:gap-2">
                <motion.button
                  onClick={handleViewClick}
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60 print:bg-indigo-500 print:hover:bg-indigo-500"
                  whileTap={{ scale: 0.98 }}
                  disabled={viewLoading}
                >
                  {viewLoading ? "Loading..." : "View Timetable"}
                </motion.button>
                <motion.button
                  onClick={downloadPDF}
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed print:bg-green-500 print:hover:bg-green-500"
                  whileTap={{ scale: 0.98 }}
                  disabled={isDownloadDisabled}
                >
                  Download PDF
                </motion.button>
                <motion.button
                  onClick={downloadExcel}
                  type="button"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed print:hidden"
                  whileTap={{ scale: 0.98 }}
                  disabled={isDownloadDisabled}
                >
                  Download Excel
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedTimetable([]);
                    setViewedClassId(null);
                    setViewedSchemaId(null);
                    setFetchError(null);
                    setViewMessage(null);
                    setSelectedClassesForDownload(new Set());
                    classTableRefs.current = {};
                  }}
                  className="py-2 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 print:border-gray-400 print:bg-gray-100 print:hover:bg-gray-100"
                >
                  Clear View
                </button>
              </div>
            </div>
          )}

        {viewMessage && (
          <p className="text-center text-gray-600 mt-6 text-lg print:text-base">
            {viewMessage}
          </p>
        )}

        {generatedTimetable && renderTimetableTable()}

        <EditSlotModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          slotData={editingSlotData}
          onSuccess={handleEditSuccess}
        />

        <AddSlotModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onSuccess={handleAddSuccess}
          classId={addSlotData?.classId}
          className={addSlotData?.className}
          classYear={addSlotData?.classYear}
          day={addSlotData?.day}
          startTime={addSlotData?.startTime}
          endTime={addSlotData?.endTime}
          timetableSchemaId={addSlotData?.timetableSchemaId}
        />
      </div>
    </motion.div>
  );
};

export default CompactGridTimetable;
