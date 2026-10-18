import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../../axiosConfig.js";

const AddEditFacultyModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  // Stores selected subject IDs (string array)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  // Stores all available subjects fetched from API (array of { _id, name, code, type })
  const [availableSubjects, setAvailableSubjects] = useState([]);
  // For availability, manage a structured array for UI, then convert to JSON for submit
  const [availabilityEntries, setAvailabilityEntries] = useState([]);
  const [formError, setFormError] = useState(null);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  // --- Fetch Available Subjects ---
  useEffect(() => {
    if (isOpen) {
      // Only fetch when modal is open
      const fetchAvailableSubjects = async () => {
        try {
          setSubjectsLoading(true);
          setSubjectsError(null);
          // Make an actual API call to your backend endpoint for subjects
          const res = await axios.get("/api/subject/");
          setAvailableSubjects(res.data);
        } catch (err) {
          setSubjectsError(
            err.response?.data?.message || "Failed to fetch available subjects."
          );
          console.error("Error fetching subjects:", err);
        } finally {
          setSubjectsLoading(false);
        }
      };
      fetchAvailableSubjects();
    }
  }, [isOpen]);

  // --- Populate Form Data (for Edit or Add) ---
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      // For editing, set selected subject IDs based on initialData's subjects (objects with _id)
      setSelectedSubjectIds(
        initialData.subjects && Array.isArray(initialData.subjects)
          ? initialData.subjects.map((sub) => sub._id)
          : []
      );
      // Convert initial availability (array of objects) to structured entries for UI
      setAvailabilityEntries(
        initialData.availability && Array.isArray(initialData.availability)
          ? initialData.availability.map((avail) => ({
              day: avail.day || "",
              slots: Array.isArray(avail.slots) ? avail.slots.join(",") : "",
            }))
          : [{ day: "", slots: "" }]
      ); // Always ensure at least one entry for UI
    } else {
      // If no initialData, reset form for adding new faculty
      setName("");
      setSelectedSubjectIds([]);
      setAvailabilityEntries([{ day: "", slots: "" }]); // Start with one empty slot
    }
    setFormError(null); // Clear any previous form errors when modal opens/changes mode
  }, [isOpen, initialData]);

  // Handle changes to faculty name
  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  // Handle adding a new subject dropdown field
  const handleAddSubjectField = () => {
    setSelectedSubjectIds([...selectedSubjectIds, ""]); // Add an empty string for a new selection
  };

  // Handle removing a subject dropdown field
  const handleRemoveSubjectField = (index) => {
    const newSelectedSubjectIds = selectedSubjectIds.filter(
      (_, i) => i !== index
    );
    setSelectedSubjectIds(newSelectedSubjectIds);
  };

  // Handle changes to individual subject dropdown selection
  const handleSubjectSelectionChange = (index, subjectId) => {
    const newSelectedSubjectIds = [...selectedSubjectIds];
    newSelectedSubjectIds[index] = subjectId;
    setSelectedSubjectIds(newSelectedSubjectIds);
  };

  // Handle adding a new availability entry
  const handleAddAvailability = () => {
    setAvailabilityEntries([...availabilityEntries, { day: "", slots: "" }]);
  };

  // Handle removing an availability entry
  const handleRemoveAvailability = (index) => {
    const newAvailabilityEntries = availabilityEntries.filter(
      (_, i) => i !== index
    );
    setAvailabilityEntries(newAvailabilityEntries);
  };

  // Handle changes to individual availability entry (day or slots)
  const handleAvailabilityChange = (index, field, value) => {
    const newAvailabilityEntries = [...availabilityEntries];
    newAvailabilityEntries[index] = {
      ...newAvailabilityEntries[index],
      [field]: value,
    };
    setAvailabilityEntries(newAvailabilityEntries);
  };

  // Handles form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setFormError(null);

      try {
        // 1. Process Selected Subject IDs
        // Ensure only valid, non-empty IDs are sent
        const subjectsToSend = selectedSubjectIds.filter(
          (id) => id.trim() !== ""
        );

        // If subjects are required, you might add a validation here:
        // if (subjectsToSend.length === 0) {
        //   throw new Error("At least one subject must be selected.");
        // }

        // 2. Process Availability Entries to JSON Array
        const availabilityToSend = availabilityEntries
          .map((entry) => {
            // Only process entries that have at least a day or slots entered
            if (!entry.day.trim() && !entry.slots.trim()) return null;

            const day = entry.day.trim();
            const slots = entry.slots
              .split(",")
              .map((s) => {
                const num = parseInt(s.trim(), 10);
                if (isNaN(num)) {
                  throw new Error(
                    `Invalid slot "${s.trim()}" for day "${day}". Slots must be comma-separated numbers.`
                  );
                }
                return num;
              })
              .filter((s) => !isNaN(s)); // Filter out any non-numeric results

            if (!day) {
              throw new Error("Day cannot be empty for an availability entry.");
            }
            if (slots.length === 0) {
              throw new Error(`No valid slots provided for day "${day}".`);
            }

            return { day, slots };
          })
          .filter(Boolean); // Filter out any nulls from skipped empty entries

        // Basic validation for name
        if (!name.trim()) {
          throw new Error("Faculty Name is required.");
        }

        onSubmit({
          name: name.trim(),
          subjects: subjectsToSend,
          availability: availabilityToSend,
        });
      } catch (err) {
        setFormError(
          err.message ||
            "An unexpected error occurred. Please check your inputs."
        );
        console.error("Form processing error:", err);
      }
    },
    [name, selectedSubjectIds, availabilityEntries, onSubmit]
  );

  // If modal is not open, render nothing
  if (!isOpen) return null;

  // Framer Motion variants for modal animation
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
      onClick={onClose} // Close modal when clicking on the overlay
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside it
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          &times;
        </button>

        {/* Modal Title */}
        <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">
          {initialData ? "Edit Faculty" : "Add New Faculty"}
        </h2>

        {/* Form Error Message */}
        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
              role="alert"
            >
              <span className="block sm:inline">{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Faculty Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Faculty Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              required
            />
          </div>

          {/* Subjects Input (Dynamic List of Selects) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects
            </label>
            {subjectsLoading ? (
              <p className="text-gray-600">Loading subjects...</p>
            ) : subjectsError ? (
              <p className="text-red-500">
                Error loading subjects: {subjectsError}
              </p>
            ) : availableSubjects.length === 0 ? (
              <p className="text-gray-600">No subjects available to select.</p>
            ) : (
              <>
                {selectedSubjectIds.map((subjectId, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      value={subjectId}
                      onChange={(e) =>
                        handleSubjectSelectionChange(index, e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    >
                      <option value="">Select a Subject</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubjectField(index)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            <button
              type="button"
              onClick={handleAddSubjectField}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200"
            >
              Add Subject Field
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Select subjects from the dropdowns. You can add multiple fields.
            </p>
          </div>

          {/* Availability Input (Dynamic List) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            {availabilityEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-end space-x-2 mb-3 p-2 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="w-1/3">
                  <label
                    htmlFor={`day-${index}`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Day
                  </label>
                  <select
                    id={`day-${index}`}
                    value={entry.day}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "day", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm"
                    required={!!entry.slots.trim()} // Required if slots are entered
                  >
                    <option value="">Select Day</option>
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label
                    htmlFor={`slots-${index}`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Slots (comma-separated numbers)
                  </label>
                  <input
                    type="text"
                    id={`slots-${index}`}
                    value={entry.slots}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "slots", e.target.value)
                    }
                    placeholder="e.g., 1,2,3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm"
                    required={!!entry.day.trim()} // Required if day is entered
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAvailability(index)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm transition-colors self-center"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAvailability}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200"
            >
              Add Availability
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Add multiple day and slot entries.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            {initialData ? "Update Faculty" : "Add Faculty"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddEditFacultyModal;
