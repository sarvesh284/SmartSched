import React, { useState, useRef } from "react";
import axios from "../../axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/authContext.jsx";
import { useNavigate } from "react-router-dom";

const AIDataExtraction = () => {
    const [imagePreview, setImagePreview] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [mimeType, setMimeType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [saveResults, setSaveResults] = useState(null);

    const fileInputRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect non-admin users
    if (!user || user.role !== "admin") {
        navigate("/");
        return null;
    }

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        setError(null);
        setExtractedData(null);
        setSaveResults(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target.result);
            // Extract base64 data (remove data:image/...;base64, prefix)
            const base64 = event.target.result.split(",")[1];
            setImageData(base64);
            setMimeType(file.type);
        };
        reader.readAsDataURL(file);
    };

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const input = fileInputRef.current;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            handleFileSelect({ target: { files: [file] } });
        }
    };

    // Extract data using AI
    const handleExtract = async () => {
        if (!imageData) {
            setError("Please select an image first");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await axios.post("/api/ai/extract-data", {
                imageBase64: imageData,
                mimeType: mimeType,
            });

            setExtractedData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to extract data from image");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Edit handlers
    const handleDeleteSubject = (index) => {
        setExtractedData((prev) => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index),
        }));
    };

    const handleEditSubject = (index, field, value) => {
        setExtractedData((prev) => ({
            ...prev,
            subjects: prev.subjects.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ),
        }));
    };

    const handleDeleteRoom = (index) => {
        setExtractedData((prev) => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index),
        }));
    };

    const handleEditRoom = (index, field, value) => {
        setExtractedData((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r, i) =>
                i === index ? { ...r, [field]: value } : r
            ),
        }));
    };

    const handleDeleteFaculty = (index) => {
        setExtractedData((prev) => ({
            ...prev,
            faculty: prev.faculty.filter((_, i) => i !== index),
        }));
    };

    const handleEditFaculty = (index, field, value) => {
        setExtractedData((prev) => ({
            ...prev,
            faculty: prev.faculty.map((f, i) =>
                i === index ? { ...f, [field]: value } : f
            ),
        }));
    };

    const handleEditFacultySubjects = (index, value) => {
        const codes = value.split(",").map((c) => c.trim()).filter(Boolean);
        setExtractedData((prev) => ({
            ...prev,
            faculty: prev.faculty.map((f, i) =>
                i === index ? { ...f, subjectCodes: codes } : f
            ),
        }));
    };

    // Save all data
    const handleSaveAll = async () => {
        if (!extractedData) return;

        try {
            setSaving(true);
            setError(null);

            const res = await axios.post("/api/ai/bulk-save", extractedData);
            setSaveResults(res.data.results);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save data");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Reset everything
    const handleReset = () => {
        setImagePreview(null);
        setImageData(null);
        setMimeType(null);
        setExtractedData(null);
        setSaveResults(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-100 py-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
                    AI Data Extraction
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Upload an image containing subject, faculty, or room information. AI will extract and structure the data for you.
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
                        {error}
                    </div>
                )}

                {saveResults && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                        <h3 className="font-bold mb-2">Save Complete!</h3>
                        <p>Subjects created: {saveResults.subjects.created}</p>
                        <p>Rooms created: {saveResults.rooms.created}</p>
                        <p>Faculty created: {saveResults.faculty.created}</p>
                        {(saveResults.subjects.errors.length > 0 ||
                            saveResults.rooms.errors.length > 0 ||
                            saveResults.faculty.errors.length > 0) && (
                                <div className="mt-2 text-sm">
                                    <p className="font-semibold">Notes:</p>
                                    {saveResults.subjects.errors.map((e, i) => (
                                        <p key={`se-${i}`}>• {e}</p>
                                    ))}
                                    {saveResults.rooms.errors.map((e, i) => (
                                        <p key={`re-${i}`}>• {e}</p>
                                    ))}
                                    {saveResults.faculty.errors.map((e, i) => (
                                        <p key={`fe-${i}`}>• {e}</p>
                                    ))}
                                </div>
                            )}
                        <button
                            onClick={handleReset}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Upload Another Image
                        </button>
                    </div>
                )}

                {!saveResults && (
                    <>
                        {/* Upload Section */}
                        <div
                            className="bg-white p-8 rounded-lg shadow mb-6 border-2 border-dashed border-gray-300 hover:border-indigo-400 transition cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            {imagePreview ? (
                                <div className="text-center">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-64 mx-auto rounded-lg shadow"
                                    />
                                    <p className="mt-4 text-gray-600">Click to change image</p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-16 w-16 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p className="mt-4 text-lg text-gray-600">
                                        Drag & drop an image here, or click to select
                                    </p>
                                    <p className="mt-2 text-sm text-gray-400">
                                        Supports: JPG, PNG, GIF, WebP
                                    </p>
                                </div>
                            )}
                        </div>

                        {imagePreview && !extractedData && (
                            <div className="text-center mb-6">
                                <button
                                    onClick={handleExtract}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing with AI...
                                        </span>
                                    ) : (
                                        "Extract Data with AI"
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Preview Section */}
                        <AnimatePresence>
                            {extractedData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                        Extracted Data Preview
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        Review and edit the extracted data below. Click "Confirm & Save All" to add to the system.
                                    </p>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                        {/* Subjects */}
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h3 className="font-bold text-green-700 mb-3">
                                                Subjects ({extractedData.subjects.length})
                                            </h3>
                                            {extractedData.subjects.length === 0 ? (
                                                <p className="text-gray-400 text-sm">No subjects found</p>
                                            ) : (
                                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                                    {extractedData.subjects.map((subject, idx) => (
                                                        <div
                                                            key={subject.id}
                                                            className="p-3 bg-gray-50 rounded border"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={subject.name}
                                                                    onChange={(e) =>
                                                                        handleEditSubject(idx, "name", e.target.value)
                                                                    }
                                                                    className="font-medium text-sm w-full border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleDeleteSubject(idx)}
                                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={subject.code}
                                                                    onChange={(e) =>
                                                                        handleEditSubject(idx, "code", e.target.value)
                                                                    }
                                                                    className="text-xs bg-green-100 px-2 py-1 rounded w-20 border-0 focus:ring-1 focus:ring-green-500"
                                                                    placeholder="Code"
                                                                />
                                                                <select
                                                                    value={subject.type}
                                                                    onChange={(e) =>
                                                                        handleEditSubject(idx, "type", e.target.value)
                                                                    }
                                                                    className="text-xs bg-blue-100 px-2 py-1 rounded border-0 focus:ring-1 focus:ring-blue-500"
                                                                >
                                                                    <option value="lecture">Lecture</option>
                                                                    <option value="lab">Lab</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rooms */}
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h3 className="font-bold text-blue-700 mb-3">
                                                Rooms ({extractedData.rooms.length})
                                            </h3>
                                            {extractedData.rooms.length === 0 ? (
                                                <p className="text-gray-400 text-sm">No rooms found</p>
                                            ) : (
                                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                                    {extractedData.rooms.map((room, idx) => (
                                                        <div
                                                            key={room.id}
                                                            className="p-3 bg-gray-50 rounded border"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={room.name}
                                                                    onChange={(e) =>
                                                                        handleEditRoom(idx, "name", e.target.value)
                                                                    }
                                                                    className="font-medium text-sm w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleDeleteRoom(idx)}
                                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                            <select
                                                                value={room.type}
                                                                onChange={(e) =>
                                                                    handleEditRoom(idx, "type", e.target.value)
                                                                }
                                                                className="text-xs bg-blue-100 px-2 py-1 rounded border-0 focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="lecture">Lecture Room</option>
                                                                <option value="lab">Lab</option>
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Faculty */}
                                        <div className="bg-white p-4 rounded-lg shadow">
                                            <h3 className="font-bold text-purple-700 mb-3">
                                                Faculty ({extractedData.faculty.length})
                                            </h3>
                                            {extractedData.faculty.length === 0 ? (
                                                <p className="text-gray-400 text-sm">No faculty found</p>
                                            ) : (
                                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                                    {extractedData.faculty.map((fac, idx) => (
                                                        <div
                                                            key={fac.id}
                                                            className="p-3 bg-gray-50 rounded border"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={fac.name}
                                                                    onChange={(e) =>
                                                                        handleEditFaculty(idx, "name", e.target.value)
                                                                    }
                                                                    className="font-medium text-sm w-full border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleDeleteFaculty(idx)}
                                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    Subject Codes (comma-separated):
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={fac.subjectCodes.join(", ")}
                                                                    onChange={(e) =>
                                                                        handleEditFacultySubjects(idx, e.target.value)
                                                                    }
                                                                    className="w-full text-xs bg-purple-50 px-2 py-1 rounded mt-1 border-0 focus:ring-1 focus:ring-purple-500"
                                                                    placeholder="CS101, CS102"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={handleReset}
                                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveAll}
                                            disabled={saving}
                                            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Confirm & Save All"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default AIDataExtraction;
