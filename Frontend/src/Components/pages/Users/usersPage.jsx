import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../../axiosConfig";
import { motion } from "framer-motion";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [editError, setEditError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/users/all");
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch users. Please try again later.");
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Delete Functions ---
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`/api/users/${userToDelete._id}`);
      setUsers(users.filter((u) => u._id !== userToDelete._id));
      closeDeleteModal();
    } catch (err) {
      setError("Failed to delete user.");
      console.error("Delete user error:", err);
      closeDeleteModal();
    }
  };

  // --- Edit Functions ---
  const openEditModal = (user) => {
    setUserToEdit(user);
    setEditFormData({ name: user.name, email: user.email, role: user.role });
    setShowEditModal(true);
    setEditError("");
  };

  const closeEditModal = () => {
    setUserToEdit(null);
    setShowEditModal(false);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;
    try {
      const res = await axios.put(`/api/users/${userToEdit._id}`, editFormData);
      setUsers(
        users.map((user) => (user._id === userToEdit._id ? res.data : user))
      );
      closeEditModal();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update user.");
      console.error("Update user error:", err);
    }
  };

  // --- Icon Components ---
  const UserPlusIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 mr-2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="20" y1="8" x2="20" y2="14"></line>
      <line x1="17" y1="11" x2="23" y2="11"></line>
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 mr-2"
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-slate-600 hover:text-indigo-600 mb-4 group transition-colors"
          >
            <ArrowLeftIcon />
            <span className="group-hover:underline">Back to Dashboard</span>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                User Management
              </h1>
              <p className="mt-1 text-slate-500">
                View, create, edit, and delete user accounts.
              </p>
            </div>
            <Link
              to="/users/add"
              className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
            >
              <UserPlusIcon />
              Add New User
            </Link>
          </div>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <p className="text-center p-8 text-slate-500">
                  Loading users...
                </p>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        User ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                          {user._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Edit User: {userToEdit?.name}
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-slate-800">
              Confirm Deletion
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete user "{userToDelete?.name}"? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
