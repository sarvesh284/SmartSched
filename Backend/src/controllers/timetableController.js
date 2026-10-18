import TimetableSchema from "../models/timetable.model.js";

// Create new timetable schema
export const createTimetable = async (req, res) => {
  try {
    const timetableSchema = new TimetableSchema(req.body);
    await timetableSchema.save();
    res.status(201).json(timetableSchema);
  } catch (error) {
    res.status(500).json({ message: "Error creating timetable schema", error });
  }
};

// Get all timetable schemas
export const getAllTimetable = async (req, res) => {
  try {
    const schemas = await TimetableSchema.find();
    res.status(200).json(schemas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching timetable schemas", error });
  }
};

// Get single timetable schema
export const getTimetableById = async (req, res) => {
  try {
    const schema = await TimetableSchema.findById(req.params.id);
    if (!schema) return res.status(404).json({ message: "Schema not found" });
    res.status(200).json(schema);
  } catch (error) {
    res.status(500).json({ message: "Error fetching timetable schema", error });
  }
};

// Update timetable schema
export const updateTimetable = async (req, res) => {
  try {
    const schema = await TimetableSchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!schema) return res.status(404).json({ message: "Schema not found" });
    res.status(200).json(schema);
  } catch (error) {
    res.status(500).json({ message: "Error updating timetable schema", error });
  }
};

// Delete timetable schema
export const deleteTimetable = async (req, res) => {
  try {
    const schema = await TimetableSchema.findByIdAndDelete(req.params.id);
    if (!schema) return res.status(404).json({ message: "Schema not found" });
    res.status(200).json({ message: "Timetable schema deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting timetable schema", error });
  }
};
