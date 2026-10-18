import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/:id", authenticateUser, getUserProfile);
router.get("/all", authenticateUser, getAllUsers);

router.put("/:id", authenticateUser, updateUser);
router.delete("/:id", authenticateUser, deleteUser);

export default router;
