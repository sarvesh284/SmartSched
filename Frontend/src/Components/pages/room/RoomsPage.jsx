// src/pages/RoomsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "../../../axiosConfig.js"; // Import your configured axios instance
import { motion, AnimatePresence } from "framer-motion";
import AddEditRoomModal from "../room/AddEditRoomModal.jsx"; // Import the new modal component
import { useAuth } from "../../../Context/authContext.jsx"; // Assuming authentication is needed for adding/editing
import { useNavigate } from "react-router-dom"; // For redirection if not logged in

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [editingRoom, setEditingRoom] = useState(null); // State to hold data for editing (null for add)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // State for delete confirmation
  const [roomToDelete, setRoomToDelete] = useState(null); // State to hold room to be deleted

  const { user } = useAuth(); // Get user object from authentication context
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Function to fetch room data from the backend API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors when fetching
      const res = await axios.get("/api/room/"); // Your endpoint
      setRooms(res.data); // Set the fetched data to state
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch rooms. Please ensure the backend is running and the API endpoint is correct."
      );
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Handler for submitting the Add/Edit form from the modal
  const handleAddEditSubmit = async (formData) => {
    try {
      if (editingRoom) {
        // If editingRoom is set, it's an update (PUT) operation
        await axios.put(`/api/room/${editingRoom._id}`, formData);
        console.log("Room updated successfully!");
      } else {
        // If editingRoom is null, it's an add (POST) operation
        await axios.post("/api/room/", formData);
        console.log("Room added successfully!");
      }
      fetchRooms(); // Re-fetch all rooms to update the list
      closeModal(); // Close the modal on successful operation
    } catch (err) {
      // Set error if API call fails
      setError(err.response?.data?.message || "Failed to save room.");
      console.error("Error saving room:", err);
      // Note: For a better UX, you might want to pass this error back to the modal
      // so the user can see it without the modal closing.
    }
  };

  // Handler for initiating room deletion
  const handleDeleteClick = (room) => {
    if (!user) {
      // Check if user is NOT logged in
      navigate("/login"); // Redirect to login page
      return; // Stop execution
    }
    setRoomToDelete(room); // Set the room to be deleted
    setShowConfirmDelete(true); // Show the confirmation dialog
  };

  // Handler for confirming deletion
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return; // Should not happen if button is clicked after setting roomToDelete

    try {
      await axios.delete(`/api/room/${roomToDelete._id}`);
      console.log("Room deleted successfully!");
      fetchRooms(); // Re-fetch all rooms to update the list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete room.");
      console.error("Error deleting room:", err);
    } finally {
      setShowConfirmDelete(false); // Hide the confirmation dialog
      setRoomToDelete(null); // Clear the room to be deleted
    }
  };

  // Opens the modal for adding a new room, with login check
  const openAddModal = () => {
    if (!user) {
      // Check if user is NOT logged in
      navigate("/login"); // Redirect to login page
      return; // Stop execution
    }
    setEditingRoom(null); // Clear any previous editing data
    setShowModal(true); // Show the modal
  };

  // Opens the modal for editing an existing room, with login check
  const openEditModal = (room) => {
    if (!user) {
      // Check if user is NOT logged in
      navigate("/login"); // Redirect to login page
      return; // Stop execution
    }
    setEditingRoom(room); // Set the room data to be edited
    setShowModal(true);
  };

  // Closes the modal and resets editing state
  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
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
          Manage Rooms
        </motion.h1>

        {/* Add New Room Button */}
        <div className="flex justify-end mb-6">
          <motion.button
            onClick={openAddModal}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add New Room
          </motion.button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="ml-4 text-gray-600">Loading rooms...</p>
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

        {/* No Rooms Found Message */}
        {!loading && !error && rooms.length === 0 && (
          <p className="text-center text-gray-600 text-lg">No rooms found.</p>
        )}

        {/* Rooms Grid */}
        {!loading && !error && rooms.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {rooms.map((room) => (
              <motion.div
                key={room._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl font-bold text-orange-700 mb-2">
                  {room.name}
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="font-semibold">Type:</span> {room.type}
                </p>

                {/* Edit and Delete Buttons */}
                <div className="mt-auto flex justify-end space-x-2">
                  {" "}
                  {/* Added space-x-2 for spacing */}
                  <button
                    onClick={() => openEditModal(room)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(room)}
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

      {/* Modal for Add/Edit Room */}
      <AnimatePresence>
        {showModal && (
          <AddEditRoomModal
            isOpen={showModal}
            onClose={closeModal}
            initialData={editingRoom}
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
                Are you sure you want to delete room "{roomToDelete?.name}"?
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

export default RoomsPage;
