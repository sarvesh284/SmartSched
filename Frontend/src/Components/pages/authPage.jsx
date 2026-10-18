import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../axiosConfig.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/authContext.jsx";

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const toggleForm = () => {
    setIsRegister((prev) => !prev);
    setFormData({ name: "", email: "", password: "", avatar: "" });
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post("/api/users/register", formData);
      }

      const res = await axios.post("/api/users/login", {
        email: formData.email,
        password: formData.password,
      });

      login(res.data.user, res.data.token);
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.message || "Authentication failed");
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: isRegister ? 100 : -100 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRegister ? -100 : 100 },
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
            key={isRegister ? "register" : "login"}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-center text-purple-700">
              {isRegister ? "Create an Account" : "Welcome Back"}
            </h2>
            <p className="text-center text-gray-500 text-sm">
              {isRegister
                ? "Join us and start your journey"
                : "Log in to continue to your dashboard"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
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
              )}
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
              {isRegister && (
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
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-300 shadow-md"
              >
                {isRegister ? "Sign Up" : "Log In"}
              </motion.button>
            </form>
            <p className="text-sm text-gray-400 text-center">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-purple-600 hover:underline transition-all"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don’t have an account?{" "}
                  <button
                    onClick={toggleForm}
                    className="text-purple-600 hover:underline transition-all"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthPage;
