import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../../axiosConfig";
import { motion } from "framer-motion";
import { useAuth } from "../../../Context/authContext";

const MySchedulePage = () => {
  const { user } = useAuth();

  // State for metadata and selections
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState("");

  // State for displaying the schedule
  const [schedule, setSchedule] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  // Loading and error states
  const [initialLoading, setInitialLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch available timetable schemas on component mount
  useEffect(() => {
    if (!user) return;

    const fetchTimetableSchemas = async () => {
      try {
        setInitialLoading(true);
        const res = await axios.get("/api/timetable/");
        if (res.data && res.data.length > 0) {
          setTimetables(res.data);
          setSelectedTimetableId(res.data[0]._id); // Set a default selection
        }
        setError("");
      } catch (err) {
        setError("Failed to load available timetable schemas.");
        console.error("Fetch Schemas Error:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTimetableSchemas();
  }, [user]);

  // Function to fetch and display the schedule
  const handleViewSchedule = async () => {
    if (!user || !selectedTimetableId) {
      setError("Please select a timetable schema.");
      return;
    }

    try {
      setScheduleLoading(true);
      setHasSearched(true);
      setSchedule({});
      setError("");

      // Fetch the full generated timetable
      const res = await axios.get("/api/generatedtimetable/");

      // Filter entries for the selected schema and the current faculty member
      const facultySchedule = res.data.filter(
        (entry) =>
          entry.timetableSchemaRef === selectedTimetableId &&
          entry.facultyName === user.name
      );

      // Group the filtered schedule by day
      const groupedSchedule = facultySchedule.reduce((acc, entry) => {
        const day = entry.day;
        if (!acc[day]) acc[day] = [];
        acc[day].push(entry);
        acc[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return acc;
      }, {});

      setSchedule(groupedSchedule);
    } catch (err) {
      setError("Failed to fetch schedule. Please try again later.");
      console.error("Fetch Schedule Error:", err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sortedDays = Object.keys(schedule).sort(
    (a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)
  );

  const ArrowLeftIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 mr-2"
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-full mx-auto px-4">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-indigo-600 group transition-colors"
          >
            <ArrowLeftIcon />
            <span className="group-hover:underline">Back to Dashboard</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800">
              My Weekly Schedule
            </h1>
            <p className="mt-1 text-slate-500">
              Select a timetable schema to view your personal teaching schedule.
            </p>
          </div>

          {/* Controls Section */}
          <div className="p-6 mb-8 bg-white rounded-xl shadow-md border border-slate-200 space-y-4">
            {initialLoading ? (
              <p className="text-slate-500">Loading schemas...</p>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="select-timetable-schema"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Timetable Schema
                  </label>
                  <select
                    id="select-timetable-schema"
                    value={selectedTimetableId}
                    onChange={(e) => setSelectedTimetableId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
                    disabled={timetables.length === 0}
                  >
                    {timetables.length > 0 ? (
                      timetables.map((tt) => (
                        <option key={tt._id} value={tt._id}>
                          {tt.name}
                        </option>
                      ))
                    ) : (
                      <option>No schemas available</option>
                    )}
                  </select>
                </div>
                <motion.button
                  onClick={handleViewSchedule}
                  className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                  disabled={scheduleLoading || timetables.length === 0}
                >
                  {scheduleLoading ? "Loading..." : "View Schedule"}
                </motion.button>
              </>
            )}
          </div>

          {/* Schedule Display Section */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          {scheduleLoading && (
            <p className="text-center p-8 text-slate-500">
              Loading your schedule...
            </p>
          )}

          {hasSearched &&
            !scheduleLoading &&
            !error &&
            sortedDays.length === 0 && (
              <div className="text-center py-12 px-6 bg-white rounded-xl shadow-md border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-700">
                  No Classes Found
                </h3>
                <p className="text-slate-500 mt-2">
                  There are no classes scheduled for you in the selected
                  timetable.
                </p>
              </div>
            )}

          {/* Centering wrapper for the grid */}
          <div className="flex justify-center">
            <div className="inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {sortedDays.map((day) => (
                <motion.div
                  key={day}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800">{day}</h3>
                  </div>
                  <ul className="divide-y divide-slate-200">
                    {schedule[day].map((entry) => (
                      <li key={entry._id} className="p-4 space-y-1">
                        <p className="font-semibold text-indigo-700">
                          {entry.startTime} - {entry.endTime}
                        </p>
                        <p className="text-slate-800 font-medium">
                          {entry.subject?.name || "N/A"} (
                          {entry.subject?.code || "N/A"})
                        </p>
                        <p className="text-sm text-slate-500">
                          Class: {entry.classId?.name || "N/A"} (
                          {entry.batchName})
                        </p>
                        <p className="text-sm text-slate-500">
                          Room: {entry.room?.name || "N/A"}
                        </p>
                        <span
                          className={`text-xs font-medium inline-block px-2 py-0.5 rounded-full ${
                            entry.type === "lab"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MySchedulePage;
