import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectControllers.js";

const router = express.Router();

router.post("/", createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
