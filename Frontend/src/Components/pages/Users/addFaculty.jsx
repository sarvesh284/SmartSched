import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../axiosConfig"; // Using your pre-configured axios instance
import { motion } from "framer-motion";

const AddUserPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await axios.post("/api/users/register", {
        ...formData,
        avatar: "", // Avatar is optional
      });

      setSuccess(`User "${formData.name}" created successfully!`);
      setFormData({ name: "", email: "", password: "" });

      // Redirect after success
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create user. Please try again."
      );
      console.error("Add User error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-lg">
        <motion.div
          className="w-full bg-white shadow-lg rounded-xl border border-slate-200 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-center text-slate-800">
              Create New User
            </h2>
            <p className="text-center text-slate-500 text-sm">
              Create a new user account. They will be able to log in with these
              credentials.
            </p>

            {success && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md text-center"
                role="alert"
              >
                <p className="font-semibold">{success}</p>
              </div>
            )}

            {error && (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-center"
                role="alert"
              >
                <p className="font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Jane Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user.email@university.edu"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create User Account
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddUserPage;
