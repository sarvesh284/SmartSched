// src/components/AddEditSubjectModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AddEditSubjectModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [code, setCode] = useState("");
  const [isElective, setIsElective] = useState(false);
  const [electiveType, setElectiveType] = useState("");
  const [electiveGroup, setElectiveGroup] = useState("");
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (initialData) {
      // If initialData is provided, pre-fill the form for editing
      setName(initialData.name || "");
      setType(initialData.type || "");
      setCode(initialData.code || "");
      setIsElective(initialData.isElective || false);
      setElectiveType(initialData.electiveType || "");
      setElectiveGroup(initialData.electiveGroup || "");
    } else {
      // If no initialData, reset form for adding new subject
      setName("");
      setType("");
      setCode("");
      setIsElective(false);
      setElectiveType("");
      setElectiveGroup("");
    }
    setFormError(null); // Clear any previous form errors when modal opens/changes mode
  }, [isOpen, initialData]); // Depend on isOpen and initialData to re-run effect

  // Handles changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    else if (name === "type") setType(value);
    else if (name === "code") setCode(value);
    else if (name === "isElective") {
      const checked = e.target.checked;
      setIsElective(checked);
      // Reset electiveType and electiveGroup when unchecking isElective
      if (!checked) {
        setElectiveType("");
        setElectiveGroup("");
      }
    }
    else if (name === "electiveType") setElectiveType(value);
    else if (name === "electiveGroup") setElectiveGroup(value);
  };

  // Handles form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setFormError(null); // Clear error before new submission attempt

      try {
        // Basic validation
        if (!name.trim()) {
          throw new Error("Subject Name is required.");
        }
        if (!type.trim()) {
          throw new Error("Subject Type is required.");
        }
        if (!code.trim()) {
          throw new Error("Subject Code is required.");
        }

        // Call the onSubmit prop function with the formatted data
        onSubmit({
          name: name.trim(),
          type: type.trim(),
          code: code.trim(),
          isElective,
          electiveType: isElective ? electiveType : null,
          electiveGroup: isElective ? electiveGroup.trim() : null,
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
    [name, type, code, isElective, electiveType, electiveGroup, onSubmit]
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
        <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
          {initialData ? "Edit Subject" : "Add New Subject"}
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

        {/* Subject Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleChange}
              placeholder="e.g., Database Management Systems"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            >
              <option value="">Select Type</option>
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={handleChange}
              placeholder="e.g., CS-401"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
          </div>

          {/* Is Elective Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isElective"
              name="isElective"
              checked={isElective}
              onChange={handleChange}
              className="rounded text-green-600 focus:ring-green-500 h-5 w-5"
            />
            <label
              htmlFor="isElective"
              className="text-gray-700 font-semibold cursor-pointer"
            >
              Is Elective?
            </label>
          </div>

          {/* Elective Type Dropdown - Only shown when isElective is true */}
          {isElective && (
            <div>
              <label
                htmlFor="electiveType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Elective Type
              </label>
              <select
                id="electiveType"
                name="electiveType"
                value={electiveType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
                required={isElective}
              >
                <option value="">Select Elective Type</option>
                <option value="PE">Professional Elective (PE)</option>
                <option value="OE">Open Elective (OE)</option>
              </select>
            </div>
          )}

          {/* Elective Group - Only shown when isElective is true */}
          {isElective && (
            <div>
              <label
                htmlFor="electiveGroup"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Elective Group
              </label>
              <input
                type="text"
                id="electiveGroup"
                name="electiveGroup"
                value={electiveGroup}
                onChange={handleChange}
                placeholder="e.g., PE-III, OE-II"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Subjects in the same group will be scheduled concurrently
              </p>
            </div>
          )}

          {/* Form Action Buttons */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            {initialData ? "Update Subject" : "Add Subject"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddEditSubjectModal;
