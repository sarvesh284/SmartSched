import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../axiosConfig";

const AddSlotModal = ({
    isOpen,
    onClose,
    onSuccess,
    classId,
    className,
    classYear,
    day,
    startTime,
    endTime,
    timetableSchemaId
}) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Available resources
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [availableFaculty, setAvailableFaculty] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);

    // Form state
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("ALL");
    const [slotType, setSlotType] = useState("lecture");
    const [selectedElectiveGroup, setSelectedElectiveGroup] = useState("");

    // Batches (derived from class data)
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        if (isOpen && classId && day && startTime) {
            fetchInitialData();
        }
        // Reset form when modal opens
        if (isOpen) {
            setSelectedSubject("");
            setSelectedFaculty("");
            setSelectedRoom("");
            setSelectedBatch("ALL");
            setSlotType("lecture");
            setSelectedElectiveGroup("");
            setError(null);
        }
    }, [isOpen, classId, day, startTime]);

    // Fetch available faculty when subject changes
    useEffect(() => {
        if (selectedSubject && isOpen) {
            fetchAvailableFacultyForSubject();
        } else {
            setAvailableFaculty([]);
            setSelectedFaculty("");
        }
    }, [selectedSubject]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [subjectsRes, roomsRes, classRes] = await Promise.all([
                axios.get("/api/subject/"),
                axios.get("/api/room/"),
                axios.get(`/api/class/${classId}`)
            ]);

            const classInfo = classRes.data;
            setClassData(classInfo);

            // Get subjects associated with this class (from lectureSubjects and batches)
            const allSubjects = subjectsRes.data || [];
            const classSubjectIds = new Set();

            // Add lecture subjects
            if (classInfo.lectureSubjects) {
                classInfo.lectureSubjects.forEach(ls => {
                    if (ls.subject?._id) {
                        classSubjectIds.add(ls.subject._id);
                    } else if (ls.subject) {
                        classSubjectIds.add(ls.subject);
                    }
                });
            }

            // Add batch subjects (labs)
            if (classInfo.batches) {
                classInfo.batches.forEach(batch => {
                    if (batch.subjects) {
                        batch.subjects.forEach(bs => {
                            if (bs.subject?._id) {
                                classSubjectIds.add(bs.subject._id);
                            } else if (bs.subject) {
                                classSubjectIds.add(bs.subject);
                            }
                        });
                    }
                });
            }

            // Add elective groups subjects (PE/OE)
            if (classInfo.electiveGroups) {
                classInfo.electiveGroups.forEach(eg => {
                    if (eg.subjects) {
                        eg.subjects.forEach(subj => {
                            if (subj?._id) {
                                classSubjectIds.add(subj._id);
                            } else if (subj) {
                                classSubjectIds.add(subj);
                            }
                        });
                    }
                });
            }

            // Filter subjects that belong to this class
            const classSubjects = allSubjects.filter(s =>
                classSubjectIds.has(s._id)
            );

            // If no class-specific subjects found, show all subjects as fallback
            setAvailableSubjects(classSubjects.length > 0 ? classSubjects : allSubjects);

            // All rooms (will filter for conflicts when form is submitted)
            setAvailableRooms(roomsRes.data || []);

        } catch (err) {
            console.error(err);
            setError("Failed to fetch initial data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableFacultyForSubject = async () => {
        try {
            const res = await axios.get("/api/generatedtimetable/available-resources", {
                params: {
                    day,
                    startTime,
                    endTime,
                    subjectId: selectedSubject,
                }
            });
            setAvailableFaculty(res.data.availableFaculty || []);

            // Also update available rooms based on current slot
            const occupiedRoomIds = new Set();
            // Filter rooms that are already occupied
            const allRoomsRes = await axios.get("/api/room/");
            const availableRoomsList = allRoomsRes.data.filter(
                r => !res.data.occupiedRooms?.some(or => or._id === r._id)
            );
            setAvailableRooms(res.data.availableRooms || availableRoomsList);

        } catch (err) {
            console.error(err);
            setError("Failed to fetch available faculty.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSubject || !selectedFaculty || !selectedRoom) {
            setError("Please fill in all required fields.");
            return;
        }

        // Validate PE-specific fields
        if (slotType === "PE" && !selectedElectiveGroup && classData?.electiveGroups?.some(eg => eg.electiveType === "PE")) {
            setError("Please select a PE Group for this Professional Elective.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Get subject details to determine type and duration
            const subject = availableSubjects.find(s => s._id === selectedSubject);
            const faculty = availableFaculty.find(f => f._id === selectedFaculty);

            // Calculate end time based on type
            const duration = slotType === "lab" ? 2 : 1;

            // Calculate proper end time if lab
            let calculatedEndTime = endTime;
            if (slotType === "lab") {
                const [startHour, startMin] = startTime.split(":").map(Number);
                const endMinutes = startHour * 60 + startMin + (duration * 60);
                const endHour = Math.floor(endMinutes / 60);
                const endMin = endMinutes % 60;
                calculatedEndTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
            }

            // For PE entries, use type 'elective' with proper elective fields
            const isPE = slotType === "PE";
            const entryType = isPE ? "elective" : slotType;

            const newEntry = {
                classId: classId,
                batchName: isPE ? "ALL" : selectedBatch, // PE is always for all students
                day: day,
                startTime: startTime,
                endTime: calculatedEndTime,
                subject: selectedSubject,
                faculty: selectedFaculty,
                facultyName: faculty?.name || "Unknown",
                room: selectedRoom,
                type: entryType,
                year: classData?.year || classYear,
                duration: duration,
                timetableSchemaRef: timetableSchemaId,
                // PE-specific fields
                ...(isPE && {
                    electiveGroup: selectedElectiveGroup || subject?.electiveGroup || "PE",
                    electiveType: "PE"
                })
            };

            await axios.post("/api/generatedtimetable/", newEntry);

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to add slot.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    };

    // Generate batch options
    const batchOptions = ["ALL"];
    if (classData?.batches) {
        classData.batches.forEach(batch => {
            if (batch.name && !batchOptions.includes(batch.name)) {
                batchOptions.push(batch.name);
            }
        });
    }

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

                <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
                    Add New Slot
                </h2>

                {/* Slot Info */}
                <div className="bg-green-50 p-4 rounded-lg mb-6 text-sm text-green-800">
                    <p><strong>Class:</strong> {className}</p>
                    <p><strong>Time:</strong> {day} | {startTime} - {endTime}</p>
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <span className="ml-3 text-gray-600">Loading resources...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Slot Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slot Type
                            </label>
                            <select
                                value={slotType}
                                onChange={(e) => {
                                    setSlotType(e.target.value);
                                    setSelectedSubject(""); // Reset subject when type changes
                                    setSelectedElectiveGroup("");
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                            >
                                <option value="lecture">Lecture</option>
                                <option value="lab">Lab (2 slots)</option>
                                <option value="PE">PE (Professional Elective)</option>
                            </select>
                        </div>

                        {/* Elective Group Selection (only for PE) */}
                        {slotType === "PE" && classData?.electiveGroups?.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PE Group *
                                </label>
                                <select
                                    value={selectedElectiveGroup}
                                    onChange={(e) => setSelectedElectiveGroup(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                                    required
                                >
                                    <option value="">Select PE Group</option>
                                    {classData.electiveGroups
                                        .filter(eg => eg.electiveType === "PE")
                                        .map((eg) => (
                                            <option key={eg.groupName} value={eg.groupName}>
                                                {eg.groupName} ({eg.subjects?.length || 0} subjects)
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-purple-600 mt-1">
                                    Select the PE group this subject belongs to. All entries in the same group will sync together.
                                </p>
                            </div>
                        )}

                        {/* Subject Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject *
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                                required
                            >
                                <option value="">Select Subject</option>
                                {availableSubjects.map((sub) => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.name} ({sub.code}) - {sub.type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Batch Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Batch
                            </label>
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                            >
                                {batchOptions.map((batch) => (
                                    <option key={batch} value={batch}>
                                        {batch === "ALL" ? "All Students" : batch}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Select "All Students" for lectures/PE or a specific batch for labs.
                            </p>
                        </div>

                        {/* Faculty Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Faculty *
                            </label>
                            <select
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                                required
                                disabled={!selectedSubject}
                            >
                                <option value="">
                                    {selectedSubject ? "Select Faculty" : "Select a subject first"}
                                </option>
                                {availableFaculty.map((fac) => (
                                    <option key={fac._id} value={fac._id}>
                                        {fac.name}
                                    </option>
                                ))}
                            </select>
                            {selectedSubject && availableFaculty.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    No available faculty qualified for this subject at this time.
                                </p>
                            )}
                        </div>

                        {/* Room Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Room *
                            </label>
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                                required
                            >
                                <option value="">Select Room</option>
                                {availableRooms.map((room) => (
                                    <option key={room._id} value={room._id}>
                                        {room.name} ({room.type})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Only showing rooms available at this time.
                            </p>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedSubject || !selectedFaculty || !selectedRoom}
                                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Adding..." : "Add Slot"}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
};

export default AddSlotModal;
