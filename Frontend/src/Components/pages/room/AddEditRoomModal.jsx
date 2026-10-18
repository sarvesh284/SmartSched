// src/components/AddEditRoomModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AddEditRoomModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [formError, setFormError] = useState(null);

  // Effect to populate form data when modal opens or initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      // If initialData is provided, pre-fill the form for editing
      setName(initialData.name || "");
      setType(initialData.type || "");
    } else {
      // If no initialData, reset form for adding new room
      setName("");
      setType("");
    }
    setFormError(null); // Clear any previous form errors when modal opens/changes mode
  }, [isOpen, initialData]); // Depend on isOpen and initialData to re-run effect

  // Handles changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    else if (name === "type") setType(value);
  };

  // Handles form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setFormError(null); // Clear error before new submission attempt

      try {
        // Basic validation
        if (!name.trim()) {
          throw new Error("Room Name is required.");
        }
        if (!type.trim()) {
          throw new Error("Room Type is required.");
        }

        // Call the onSubmit prop function with the formatted data
        onSubmit({
          name: name.trim(),
          type: type.trim(),
        });
      } catch (err) {
        // Set form-specific error if validation fails
        setFormError(
          err.message ||
          "An unexpected error occurred. Please check your inputs."
        );
        console.error("Form validation error:", err);
      }
    },
    [name, type, onSubmit]
  ); // Dependencies for useCallback

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
        <h2 className="text-2xl font-bold text-center mb-6 text-orange-700">
          {initialData ? "Edit Room" : "Add New Room"}
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

        {/* Room Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Room Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleChange}
              placeholder="e.g., Lab 2, Conference Room A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Room Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            >
              <option value="">Select Type</option>
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            {initialData ? "Update Room" : "Add Room"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddEditRoomModal;
