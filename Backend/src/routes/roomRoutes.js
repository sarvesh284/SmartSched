import express from "express";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

// Create a room
router.post("/", createRoom);

// Get all rooms
router.get("/", getAllRooms);

// Get single room by ID
router.get("/:id", getRoomById);

// Update room
router.put("/:id", updateRoom);

// Delete room
router.delete("/:id", deleteRoom);

export default router;
