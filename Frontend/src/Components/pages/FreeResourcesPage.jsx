import React, { useState, useEffect } from "react";
import axios from "../../axiosConfig.js";
import { motion } from "framer-motion";
import { useAuth } from "../../Context/authContext.jsx";
import { useNavigate } from "react-router-dom";

const FreeResourcesPage = () => {
    const [timetables, setTimetables] = useState([]);
    const [selectedSchemaId, setSelectedSchemaId] = useState("");
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resourceData, setResourceData] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch timetable schemas on mount
    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        const fetchSchemas = async () => {
            try {
                setLoading(true);
                const res = await axios.get("/api/timetable/");
                setTimetables(res.data);
                if (res.data.length > 0) {
                    setSelectedSchemaId(res.data[0]._id);
                }
            } catch (err) {
                setError("Failed to fetch timetable schemas");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemas();
    }, [user, navigate]);

    // Fetch free resources when schema changes
    useEffect(() => {
        if (!selectedSchemaId) return;

        const fetchFreeResources = async () => {
            try {
                setDataLoading(true);
                setError(null);
                const res = await axios.get(
                    `/api/generatedtimetable/free-resources/${selectedSchemaId}`
                );
                setResourceData(res.data);
                setSelectedSlot(null);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch free resources");
                console.error(err);
            } finally {
                setDataLoading(false);
            }
        };

        fetchFreeResources();
    }, [selectedSchemaId]);

    // Group slots by day
    const groupSlotsByDay = () => {
        if (!resourceData?.slots) return {};
        const grouped = {};
        resourceData.slots.forEach((slot) => {
            if (!grouped[slot.day]) grouped[slot.day] = [];
            grouped[slot.day].push(slot);
        });
        return grouped;
    };

    const slotsByDay = groupSlotsByDay();
    const days = resourceData?.timetableSchema?.days || [];

    // Get color based on availability
    const getAvailabilityColor = (free, total) => {
        const ratio = free / total;
        if (ratio >= 0.7) return "bg-green-100 border-green-400 hover:bg-green-200";
        if (ratio >= 0.3) return "bg-yellow-100 border-yellow-400 hover:bg-yellow-200";
        return "bg-red-100 border-red-400 hover:bg-red-200";
    };

    const pageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-100 py-8 px-4"
            initial="hidden"
            animate="visible"
            variants={pageVariants}
        >
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
                    Free Rooms & Faculties
                </h1>

                {loading && (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
                        {error}
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Schema Selector */}
                        <div className="bg-white p-4 rounded-lg shadow mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Timetable Schema
                            </label>
                            <select
                                value={selectedSchemaId}
                                onChange={(e) => setSelectedSchemaId(e.target.value)}
                                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                            >
                                {timetables.map((tt) => (
                                    <option key={tt._id} value={tt._id}>
                                        {tt.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {dataLoading && (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                <span className="ml-3 text-gray-600">Loading resources...</span>
                            </div>
                        )}

                        {!dataLoading && resourceData && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Slots Grid */}
                                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                        Slot Overview (Click to see details)
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">
                                                        Time
                                                    </th>
                                                    {days.map((day) => (
                                                        <th
                                                            key={day}
                                                            className="px-3 py-2 text-center text-sm font-semibold text-gray-700"
                                                        >
                                                            {day}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resourceData.slots.length > 0 &&
                                                    [...new Set(resourceData.slots.map((s) => s.startTime))].map(
                                                        (time) => (
                                                            <tr key={time}>
                                                                <td className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
                                                                    {time}
                                                                </td>
                                                                {days.map((day) => {
                                                                    const slot = resourceData.slots.find(
                                                                        (s) => s.day === day && s.startTime === time
                                                                    );
                                                                    if (!slot) return <td key={day} className="border-b"></td>;

                                                                    return (
                                                                        <td key={day} className="px-2 py-2 border-b">
                                                                            <button
                                                                                onClick={() => setSelectedSlot(slot)}
                                                                                className={`w-full p-2 rounded border-2 transition-all cursor-pointer ${getAvailabilityColor(
                                                                                    slot.freeRoomCount,
                                                                                    resourceData.totalRooms
                                                                                )} ${selectedSlot?.day === slot.day &&
                                                                                        selectedSlot?.startTime === slot.startTime
                                                                                        ? "ring-2 ring-indigo-500"
                                                                                        : ""
                                                                                    }`}
                                                                            >
                                                                                <div className="text-xs">
                                                                                    <span className="font-semibold text-green-700">
                                                                                        {slot.freeRoomCount}
                                                                                    </span>
                                                                                    <span className="text-gray-500">
                                                                                        /{resourceData.totalRooms} Rooms
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-xs mt-1">
                                                                                    <span className="font-semibold text-blue-700">
                                                                                        {slot.freeFacultyCount}
                                                                                    </span>
                                                                                    <span className="text-gray-500">
                                                                                        /{resourceData.totalFaculties} Faculty
                                                                                    </span>
                                                                                </div>
                                                                            </button>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        )
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Detail Panel */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                        Slot Details
                                    </h2>
                                    {!selectedSlot ? (
                                        <p className="text-gray-500 text-center py-8">
                                            Click on a slot to see free rooms and faculties
                                        </p>
                                    ) : (
                                        <div>
                                            <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                                                <p className="font-semibold text-indigo-800">
                                                    {selectedSlot.day} | {selectedSlot.startTime} -{" "}
                                                    {selectedSlot.endTime}
                                                </p>
                                                <p className="text-sm text-gray-600">{selectedSlot.slotName}</p>
                                            </div>

                                            {/* Free Rooms */}
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-green-700 mb-2">
                                                    Free Rooms ({selectedSlot.freeRoomCount})
                                                </h3>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {selectedSlot.freeRooms.map((room) => (
                                                        <span
                                                            key={room._id}
                                                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                                        >
                                                            {room.name} ({room.type})
                                                        </span>
                                                    ))}
                                                    {selectedSlot.freeRooms.length === 0 && (
                                                        <span className="text-gray-400 text-sm">
                                                            No free rooms
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Occupied Rooms */}
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-red-700 mb-2">
                                                    Occupied Rooms ({selectedSlot.occupiedRoomCount})
                                                </h3>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {selectedSlot.occupiedRooms.map((room) => (
                                                        <span
                                                            key={room._id}
                                                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                                        >
                                                            {room.name}
                                                        </span>
                                                    ))}
                                                    {selectedSlot.occupiedRooms.length === 0 && (
                                                        <span className="text-gray-400 text-sm">
                                                            None occupied
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Free Faculties */}
                                            <div className="mb-4">
                                                <h3 className="font-semibold text-blue-700 mb-2">
                                                    Free Faculties ({selectedSlot.freeFacultyCount})
                                                </h3>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {selectedSlot.freeFaculties.map((fac) => (
                                                        <span
                                                            key={fac._id}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                                        >
                                                            {fac.name}
                                                        </span>
                                                    ))}
                                                    {selectedSlot.freeFaculties.length === 0 && (
                                                        <span className="text-gray-400 text-sm">
                                                            No free faculty
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Occupied Faculties */}
                                            <div>
                                                <h3 className="font-semibold text-orange-700 mb-2">
                                                    Occupied Faculties ({selectedSlot.occupiedFacultyCount})
                                                </h3>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {selectedSlot.occupiedFaculties.map((fac) => (
                                                        <span
                                                            key={fac._id}
                                                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                                                        >
                                                            {fac.name}
                                                        </span>
                                                    ))}
                                                    {selectedSlot.occupiedFaculties.length === 0 && (
                                                        <span className="text-gray-400 text-sm">
                                                            None occupied
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default FreeResourcesPage;
