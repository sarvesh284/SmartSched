// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/authContext.jsx"; // Import useAuth

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth(); // Destructure login function from useAuth

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/api/users/login", formData);

      // Call the login function from useAuth context
      // This will set the user state within your AuthContext
      login(res.data.user, res.data.token);

      // Store the token in localStorage, consistent with AuthPage
      localStorage.setItem("token", res.data.token);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      console.error("Login error:", err);
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
            key="login"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-center text-purple-700">
              Welcome Back
            </h2>
            <p className="text-center text-gray-500 text-sm">
              Log in to continue to your dashboard
            </p>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-300 shadow-md"
              >
                Log In
              </motion.button>
            </form>
            <p className="text-sm text-gray-400 text-center">
              Don’t have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-purple-600 hover:underline transition-all"
              >
                Sign up
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;
