import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/authContext";

/**
 * A wrapper for routes that require authentication.
 * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated.
 * @param {boolean} [props.adminOnly=false] - If true, requires the user to have the 'admin' role.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If the auth state is still loading, don't render anything yet
  if (loading) {
    return null; // Or a loading spinner
  }

  // 1. Check if user is logged in
  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back there after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if the route is admin-only and if the user is an admin
  if (adminOnly && user.role !== "admin") {
    // Redirect them to the home page if they are not an admin
    return <Navigate to="/" replace />;
  }

  // 3. If all checks pass, render the child component
  return children;
};

export default ProtectedRoute;
