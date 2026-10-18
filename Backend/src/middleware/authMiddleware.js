import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // Assuming you have a User model

// Middleware to verify JWT token and populate req.user
export const authenticateUser = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", ""); // Assuming token is passed in the Authorization header

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key here

    // Attach the user to the request object
    const user = await User.findById(decoded.userId); // Assuming the token has userId as payload

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // This makes the user data available in req.user
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err });
  }
};
