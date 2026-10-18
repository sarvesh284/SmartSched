import express from "express";
import {
    extractDataFromImage,
    bulkSaveExtractedData,
} from "../controllers/aiController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Extract data from uploaded image using Gemini AI
router.post("/extract-data", authenticateUser, extractDataFromImage);

// Bulk save extracted and edited data
router.post("/bulk-save", authenticateUser, bulkSaveExtractedData);

export default router;
