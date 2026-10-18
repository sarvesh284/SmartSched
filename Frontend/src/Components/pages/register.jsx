// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axiosConfig.js"; // Import your configured axios instance
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion for animations

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "", // Added avatar field for consistency with AuthPage
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Use the imported axios instance instead of native fetch
      const res = await axios.post("/api/users/register", formData);

      // Assuming successful registration should also log the user in,
      // similar to AuthPage's behavior which immediately logs in after register.
      // If not, you might navigate to a login page or success message.
      localStorage.setItem("userInfo", JSON.stringify(res.data)); // Store user info if applicable
      navigate("/"); // Navigate to home or dashboard after successful registration
    } catch (err) {
      // Axios errors often have a 'response' property with server details
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
      console.error("Registration error:", err); // Log the full error for debugging
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-indigo-200 to-blue-300 transition-all duration-1000">
      <motion.div
        className="w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl border border-gray-200 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="register"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-center text-purple-700">
              Create an Account
            </h2>
            <p className="text-center text-gray-500 text-sm">
              Join us and start your journey
            </p>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Avatar URL{" "}
                  <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition duration-200"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-300 shadow-md"
              >
                Sign Up
              </motion.button>
            </form>
            <p className="text-sm text-gray-400 text-center">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")} // Navigate to login page
                className="text-purple-600 hover:underline transition-all"
              >
                Log in
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
