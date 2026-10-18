import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../axiosConfig";

const EditSlotModal = ({ isOpen, onClose, slotData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [availableFaculty, setAvailableFaculty] = useState([]);

    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedFaculty, setSelectedFaculty] = useState("");

    useEffect(() => {
        if (isOpen && slotData) {
            fetchAvailableResources();
            // Initialize checks with current values
            setSelectedRoom(slotData.room?._id || "");
            setSelectedFaculty(slotData.faculty?._id || "");
        }
    }, [isOpen, slotData]);

    const fetchAvailableResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const { day, startTime, endTime, subject, _id } = slotData;

            const res = await axios.get("/api/generatedtimetable/available-resources", {
                params: {
                    day,
                    startTime,
                    endTime,
                    subjectId: subject._id,
                    currentEntryId: _id,
                },
            });

            // Append current resources if they are not in the available list (to allowing keeping current allocation)
            let rooms = res.data.availableRooms;
            if (slotData.room && !rooms.find((r) => r._id === slotData.room._id)) {
                rooms.push(slotData.room);
            }
            // Sort rooms by name
            rooms.sort((a, b) => a.name.localeCompare(b.name));

            let faculties = res.data.availableFaculty;
            if (
                slotData.faculty &&
                !faculties.find((f) => f._id === slotData.faculty._id)
            ) {
                faculties.push(slotData.faculty);
            }
            faculties.sort((a, b) => a.name.localeCompare(b.name));

            setAvailableRooms(rooms);
            setAvailableFaculty(faculties);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch available resources.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);

            await axios.put(`/api/generatedtimetable/${slotData._id}/validated`, {
                roomId: selectedRoom,
                facultyId: selectedFaculty,
            });

            onSuccess(); // Refresh parent
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update slot.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to DELETE this slot? This cannot be undone.")) return;

        try {
            setSubmitting(true);
            setError(null);
            await axios.delete(`/api/generatedtimetable/${slotData._id}`);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to delete slot.");
            setSubmitting(false);
        }
    };

    if (!isOpen || !slotData) return null;

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    };

    return (
        <motion.div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-4 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold text-center mb-6 text-indigo-700">
                    Edit Slot Details
                </h2>

                {/* Slot Info */}
                <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-sm text-indigo-800">
                    <p><strong>Subject:</strong> {slotData.subject?.name} ({slotData.subject?.code})</p>
                    <p><strong>Time:</strong> {slotData.day} | {slotData.startTime} - {slotData.endTime}</p>
                    {slotData.type === 'elective' && (
                        <p className="mt-1 text-xs font-semibold text-orange-600">
                            ⚠️ Updating this elective slot will update all related entries for group {slotData.electiveGroup}.
                        </p>
                    )}
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
                        >
                            <span className="block sm:inline">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span className="ml-3 text-gray-600">Checking availability...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Faculty Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Faculty
                            </label>
                            <select
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                required
                            >
                                <option value="">Select Faculty</option>
                                {availableFaculty.map((fac) => (
                                    <option key={fac._id} value={fac._id}>
                                        {fac.name} {slotData.faculty?._id === fac._id ? "(Current)" : ""}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Only showing available faculty qualified for this subject.
                            </p>
                        </div>

                        {/* Room Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Room
                            </label>
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                required
                            >
                                <option value="">Select Room</option>
                                {availableRooms.map((room) => (
                                    <option key={room._id} value={room._id}>
                                        {room.name} ({room.type}) {slotData.room?._id === room._id ? "(Current)" : ""}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Only showing rooms available at this time.
                            </p>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg border border-red-300 transition duration-200 disabled:opacity-50"
                            >
                                Delete Slot
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
                            >
                                {submitting ? "Updating..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
};

export default EditSlotModal;
