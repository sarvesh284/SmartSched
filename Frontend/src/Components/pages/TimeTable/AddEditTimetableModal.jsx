// src/components/AddEditTimetableModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AddEditTimetableModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState([]); // Array of selected day strings
  const [slots, setSlots] = useState([
    { startTime: "", endTime: "", type: "" },
  ]); // Array of slot objects
  const [formError, setFormError] = useState(null);

  const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slotTypes = ["lecture", "lab", "break"];

  // --- Populate Form Data (for Edit or Add) ---
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSelectedDays(initialData.days || []);
      setSlots(
        initialData.slots && Array.isArray(initialData.slots)
          ? initialData.slots.map((slot) => ({
              startTime: slot.startTime || "",
              endTime: slot.endTime || "",
              type: slot.type || "",
              _id: slot._id, // Keep _id if exists for potential keying in internal rendering
            }))
          : [{ startTime: "", endTime: "", type: "" }]
      ); // Default one empty slot
    } else {
      // Reset form for adding new timetable
      setName("");
      setSelectedDays([]);
      setSlots([{ startTime: "", endTime: "", type: "" }]); // Default one empty slot
    }
    setFormError(null); // Clear any previous form errors when modal opens/changes mode
  }, [isOpen, initialData]);

  // Handle changes to timetable name
  const handleNameChange = (e) => setName(e.target.value);

  // --- Day Selection Management (Checkboxes) ---
  const handleDayChange = (day) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day)
        ? prevDays.filter((d) => d !== day)
        : [...prevDays, day]
    );
  };

  // --- Slot Management ---
  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleAddSlot = () => {
    setSlots([...slots, { startTime: "", endTime: "", type: "" }]);
  };

  const handleRemoveSlot = (index) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
  };

  // --- Form Submission ---
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setFormError(null);

      try {
        // Basic validation
        if (!name.trim()) throw new Error("Timetable Name is required.");
        if (selectedDays.length === 0)
          throw new Error("At least one day must be selected.");

        // Process Slots
        const slotsToSend = slots
          .map((slot) => {
            const trimmedStartTime = slot.startTime.trim();
            const trimmedEndTime = slot.endTime.trim();
            const trimmedType = slot.type.trim();

            if (!trimmedStartTime && !trimmedEndTime && !trimmedType)
              return null; // Skip completely empty slot entries

            if (!trimmedStartTime || !trimmedEndTime || !trimmedType) {
              throw new Error(
                "All fields (Start Time, End Time, Type) are required for each slot."
              );
            }
            // Basic time format validation (HH:MM) - type="time" handles much of this natively
            if (
              !/^(?:2[0-3]|[01]?[0-9]):(?:[0-5]?[0-9])$/.test(trimmedStartTime)
            ) {
              throw new Error(
                `Invalid start time format for slot: "${trimmedStartTime}". Use HH:MM.`
              );
            }
            if (
              !/^(?:2[0-3]|[01]?[0-9]):(?:[0-5]?[0-9])$/.test(trimmedEndTime)
            ) {
              throw new Error(
                `Invalid end time format for slot: "${trimmedEndTime}". Use HH:MM.`
              );
            }

            return {
              startTime: trimmedStartTime,
              endTime: trimmedEndTime,
              type: trimmedType,
            };
          })
          .filter(Boolean); // Filter out nulls from skipped empty entries

        if (slotsToSend.length === 0)
          throw new Error("At least one valid slot must be added.");

        onSubmit({
          name: name.trim(),
          days: selectedDays,
          slots: slotsToSend,
        });
      } catch (err) {
        setFormError(
          err.message ||
            "An unexpected error occurred. Please check your inputs."
        );
        console.error("Form processing error:", err);
      }
    },
    [name, selectedDays, slots, onSubmit]
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

        <h2 className="text-2xl font-bold text-center mb-6 text-teal-700">
          {initialData ? "Edit Timetable" : "Add New Timetable"}
        </h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Timetable Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., Spring 2025 Schedule"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
              required
            />
          </div>

          {/* Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableDays.map((day) => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    value={day}
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                    className="mr-2 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className="text-sm text-gray-700"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one day.
              </p>
            )}
          </div>

          {/* Slots Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Slots
            </label>
            {slots.map((slot, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 mb-3 flex flex-col sm:flex-row sm:items-end sm:space-x-2 space-y-2 sm:space-y-0"
              >
                <div className="w-full sm:w-1/3">
                  <label
                    htmlFor={`start-time-${index}`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Start Time
                  </label>
                  <input
                    type="time" // Changed to type="time"
                    id={`start-time-${index}`}
                    value={slot.startTime}
                    onChange={(e) =>
                      handleSlotChange(index, "startTime", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none text-sm"
                    required
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label
                    htmlFor={`end-time-${index}`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    End Time
                  </label>
                  <input
                    type="time" // Changed to type="time"
                    id={`end-time-${index}`}
                    value={slot.endTime}
                    onChange={(e) =>
                      handleSlotChange(index, "endTime", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none text-sm"
                    required
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <label
                    htmlFor={`slot-type-${index}`}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Type
                  </label>
                  <select
                    id={`slot-type-${index}`}
                    value={slot.type}
                    onChange={(e) =>
                      handleSlotChange(index, "type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none text-sm"
                    required
                  >
                    <option value="">Select Type</option>
                    {slotTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {slots.length > 1 && ( // Allow removing if more than 1 slot
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm transition-colors self-center flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSlot}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200"
            >
              Add New Slot
            </button>
            {slots.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please add at least one slot.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            {initialData ? "Update Timetable" : "Add Timetable"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddEditTimetableModal;
