// File: src/routes/timetableGeneratorRoutes.js

import express from "express";
import { generateAndSaveTimetable } from "../controllers/generatetimetable.js";

const router = express.Router();

// This route will trigger the timetable generation process
router.post("/generate", generateAndSaveTimetable);
//router.post("/generate", (req, res) => res.send(console.log("gsldjf")));
router.post("/generate/:classId", generateAndSaveTimetable);
router.post("/generate/by-schema/:timetableSchemaId", generateAndSaveTimetable);

export default router;
