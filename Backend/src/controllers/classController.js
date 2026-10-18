// controllers/class.controller.js
import Class from "../models/class.model.js";
import mongoose from "mongoose";

// Helper function for validating subjects
const validateSubjects = (subjects, context) => {
  for (const sub of subjects) {
    if (!sub.subject || !sub.lecturesPerWeek) {
      return `${context} must have a subject ID and lecturesPerWeek.`;
    }
  }
  return null;
};

export const createClass = async (req, res) => {
  try {
    const { name, year, department, batches, lectureSubjects, electiveGroups } = req.body;

    // Convert all subject strings to ObjectIds
    const convertedBatches = batches.map((batch) => ({
      ...batch,
      subjects: batch.subjects.map((subj) => ({
        subject: new mongoose.Types.ObjectId(subj.subject),
        lecturesPerWeek: subj.lecturesPerWeek,
      })),
    }));

    const convertedLectureSubjects = lectureSubjects.map((subj) => ({
      subject: new mongoose.Types.ObjectId(subj.subject),
      lecturesPerWeek: subj.lecturesPerWeek,
    }));

    // Convert electiveGroups subjects to ObjectIds
    const convertedElectiveGroups = (electiveGroups || []).map((eg) => ({
      groupName: eg.groupName,
      electiveType: eg.electiveType,
      lecturesPerWeek: eg.lecturesPerWeek || 3,
      subjects: (eg.subjects || []).map((subId) => new mongoose.Types.ObjectId(subId)),
    }));

    const newClass = new Class({
      name,
      year,
      department: department || null,
      batches: convertedBatches,
      lectureSubjects: convertedLectureSubjects,
      electiveGroups: convertedElectiveGroups,
    });

    await newClass.save();

    res
      .status(201)
      .json({ message: "Class created successfully", class: newClass });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all Classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate({
        path: "batches",
        populate: {
          path: "subjects.subject",
          model: "Subject",
        },
      })
      .populate({
        path: "lectureSubjects.subject",
        model: "Subject",
      })
      .populate({
        path: "electiveGroups.subjects",
        model: "Subject",
      });

    res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting all classes:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Class by ID
export const getClassById = async (req, res) => {
  try {
    const foundClass = await Class.findById(req.params.id)
      .populate({
        path: "batches",
        populate: {
          path: "subjects.subject",
          model: "Subject",
        },
      })
      .populate({
        path: "lectureSubjects.subject",
        model: "Subject",
      })
      .populate({
        path: "electiveGroups.subjects",
        model: "Subject",
      });

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(foundClass);
  } catch (error) {
    console.error("Error getting class by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update Class// Corrected updateClass function

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { name, year, department, batches, lectureSubjects, electiveGroups } = req.body;

    if (!name || !year) {
      return res
        .status(400)
        .json({ message: "Class name and year are required for update." });
    }

    // Convert subject strings to ObjectIds for batches
    const convertedBatches = batches.map((batch) => ({
      ...batch,
      subjects: batch.subjects.map((subj) => ({
        subject: new mongoose.Types.ObjectId(subj.subject),
        lecturesPerWeek: subj.lecturesPerWeek,
      })),
    }));

    // Convert subject strings to ObjectIds for lectureSubjects
    const convertedLectureSubjects = lectureSubjects.map((subj) => ({
      subject: new mongoose.Types.ObjectId(subj.subject),
      lecturesPerWeek: subj.lecturesPerWeek,
    }));

    // Convert electiveGroups subjects to ObjectIds
    const convertedElectiveGroups = (electiveGroups || []).map((eg) => ({
      groupName: eg.groupName,
      electiveType: eg.electiveType,
      lecturesPerWeek: eg.lecturesPerWeek || 3,
      subjects: (eg.subjects || []).map((subId) => new mongoose.Types.ObjectId(subId)),
    }));

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          year,
          department: department || null,
          batches: convertedBatches,
          lectureSubjects: convertedLectureSubjects,
          electiveGroups: convertedElectiveGroups,
        },
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: "batches",
        populate: {
          path: "subjects.subject",
          model: "Subject",
        },
      })
      .populate({
        path: "lectureSubjects.subject",
        model: "Subject",
      })
      .populate({
        path: "electiveGroups.subjects",
        model: "Subject",
      });

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res
      .status(200)
      .json({ message: "Class updated successfully", class: updatedClass });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ message: error.message });
  }
};
// Delete Class
export const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);

    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ message: error.message });
  }
};
