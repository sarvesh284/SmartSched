import React, { useState, useEffect } from "react";
import axios from "../../../axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";
import AddEditClassModal from "../../pages/class/AddEditClassModal.jsx";
import { useAuth } from "../../../Context/authContext.jsx";
import { useNavigate } from "react-router-dom";

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const { user } = useAuth(); // Get user object from authentication context
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Function to fetch class data from the backend API
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors when fetching
      const res = await axios.get("/api/class/"); // Your endpoint
      setClasses(res.data); // Set the fetched data to state
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch classes. Please ensure the backend is running and the API endpoint is correct."
      );
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Handler for submitting the Add/Edit form from the modal
  const handleAddEditSubmit = async (formData) => {
    try {
      if (editingClass) {
        await axios.put(`/api/class/${editingClass._id}`, formData);
        console.log("Class updated successfully!");
      } else {
        // If editingClass is null, it's an add (POST) operation
        await axios.post("/api/class/", formData);
        console.log("Class added successfully!");
      }
      fetchClasses(); // Re-fetch all classes to update the list
      closeModal(); // Close the modal on successful operation
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save class.");
      console.error("Error saving class:", err);
    }
  };

  const handleDeleteClick = (classItem) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setClassToDelete(classItem); // Set the class to be deleted
    setShowConfirmDelete(true); // Show the confirmation dialog
  };

  // Handler for confirming deletion
  const handleConfirmDelete = async () => {
    if (!classToDelete) return; // Should not happen if button is clicked after setting classToDelete

    try {
      await axios.delete(`/api/class/${classToDelete._id}`);
      console.log("Class deleted successfully!");
      fetchClasses(); // Re-fetch all classes to update the list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete class.");
      console.error("Error deleting class:", err);
    } finally {
      setShowConfirmDelete(false); // Hide the confirmation dialog
      setClassToDelete(null); // Clear the class to be deleted
    }
  };

  // Opens the modal for adding a new class, with login check
  const openAddModal = () => {
    if (!user) {
      navigate("/login"); // Redirect to login page
      return; // Stop execution
    }
    setEditingClass(null); // Clear any previous editing data
    setShowModal(true); // Show the modal
  };

  // Opens the modal for editing an existing class, with login check
  const openEditModal = (classItem) => {
    if (!user) {
      // Check if user is NOT logged in
      navigate("/login"); // Redirect to login page
      return; // Stop execution
    }
    setEditingClass(classItem); // Set the class data to be edited
    setShowModal(true);
  };

  // Closes the modal and resets editing state
  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setError(null); // Clear any main page errors related to modal submission
  };

  // Framer Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger animation for children cards
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-4xl font-extrabold text-gray-900 text-center mb-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Manage Classes
        </motion.h1>

        {/* Add New Class Button */}
        <div className="flex justify-end mb-6">
          <motion.button
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add New Class
          </motion.button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="ml-4 text-gray-600">Loading classes...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* No Classes Found Message */}
        {!loading && !error && classes.length === 0 && (
          <p className="text-center text-gray-600 text-lg">No classes found.</p>
        )}

        {/* Classes Grid */}
        {!loading && !error && classes.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {classes.map((classItem) => (
              <motion.div
                key={classItem._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-bold text-purple-700 mb-2">
                  {classItem.name}
                </h3>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">Year:</span> {classItem.year}
                </p>

                {/* Display Batches */}
                {classItem.batches && classItem.batches.length > 0 && (
                  <div className="mb-3">
                    <p className="font-semibold text-gray-700">Batches:</p>
                    <ul className="list-disc list-inside text-gray-600 ml-4">
                      {classItem.batches.map((batch, index) => (
                        <li key={batch._id || `batch-${index}`}>
                          {batch.name}:{" "}
                          {batch.subjects &&
                            batch.subjects
                              .map((subEntry) =>
                                subEntry.subject
                                  ? `${subEntry.subject.name} (${subEntry.lecturesPerWeek} L/W)`
                                  : "Unknown Subject"
                              )
                              .join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Display Lecture Subjects */}
                {classItem.lectureSubjects &&
                  classItem.lectureSubjects.length > 0 && (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-700">
                        Lecture Subjects:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 ml-4">
                        {classItem.lectureSubjects.map((subEntry, index) => (
                          <li key={subEntry._id || `lecture-sub-${index}`}>
                            {subEntry.subject
                              ? `${subEntry.subject.name} (${subEntry.lecturesPerWeek} L/W)`
                              : "Unknown Subject"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Edit and Delete Buttons */}
                <div className="mt-auto flex justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(classItem)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(classItem)}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal for Add/Edit Class */}
      <AnimatePresence>
        {showModal && (
          <AddEditClassModal
            isOpen={showModal}
            onClose={closeModal}
            initialData={editingClass}
            onSubmit={handleAddEditSubmit}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmDelete(false)} // Close on overlay click
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                Confirm Deletion
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Are you sure you want to delete class "{classToDelete?.name}"?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassesPage;
