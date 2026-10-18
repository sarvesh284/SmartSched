import Faculty from "../models/faculty.model.js";
//import Subject from "../models/subject.model.js";

// CREATE Faculty
export const createFaculty = async (req, res) => {
  try {
    const { name, subjects, availability } = req.body;

    const newFaculty = new Faculty({ name, subjects, availability });
    const savedFaculty = await newFaculty.save();

    res.status(201).json(savedFaculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to create faculty", error });
  }
};

// GET All Faculty
export const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find().populate(
      "subjects",
      "name code type"
    );
    res.status(200).json(facultyList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty list", error });
  }
};

// GET Single Faculty by ID
export const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate(
      "subjects",
      "name code type"
    );
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty", error });
  }
};

// UPDATE Faculty
export const updateFaculty = async (req, res) => {
  try {
    const { name, subjects, availability } = req.body;

    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, subjects, availability },
      { new: true }
    ).populate("subjects", "name code type");

    if (!updatedFaculty)
      return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json(updatedFaculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to update faculty", error });
  }
};

// DELETE Faculty
export const deleteFaculty = async (req, res) => {
  try {
    const deletedFaculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!deletedFaculty)
      return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete faculty", error });
  }
};
