import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/classController.js";

const router = express.Router();

// Create a class
router.post("/", createClass);

// Get all classes
router.get("/", getAllClasses);

// Get single class by ID
router.get("/:id", getClassById);

// Update class
router.put("/:id", updateClass);

// Delete class
router.delete("/:id", deleteClass);

export default router;
