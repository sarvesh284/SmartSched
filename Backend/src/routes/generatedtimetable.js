import express from "express";
import {
  createGeneratedEntry,
  getAllGeneratedEntries,
  getEntriesByClass,
  updateGeneratedEntry,
  deleteGeneratedEntry,
  getEntriesBySchema,
  getFreeResourcesBySlot,
  moveGeneratedEntry,
  getAvailableResources,
  updateEntryWithValidation,
  getDebugSlot,
} from "../controllers/generatedtimetableController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", createGeneratedEntry);
router.post("/move", authenticateUser, moveGeneratedEntry);
router.get("/", getAllGeneratedEntries);
router.get("/debug-slot", getDebugSlot);
router.get("/available-resources", authenticateUser, getAvailableResources); // Must be before /:timetableschema
router.get("/free-resources/:timetableSchemaId", authenticateUser, getFreeResourcesBySlot);
router.get("/class/:classId", getEntriesByClass);
router.get("/:timetableschema", getEntriesBySchema);
router.put("/:id/validated", authenticateUser, updateEntryWithValidation);
router.put("/:id", updateGeneratedEntry);
router.delete("/:id", deleteGeneratedEntry);

export default router;
