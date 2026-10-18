import express from "express";
import {
  createTimetable,
  getAllTimetable,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
} from "../controllers/timetableController.js";

const router = express.Router();

router.post("/", createTimetable);
router.get("/", getAllTimetable);
router.get("/:id", getTimetableById);
router.put("/:id", updateTimetable);
router.delete("/:id", deleteTimetable);

export default router;
