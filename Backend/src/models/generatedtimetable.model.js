import mongoose from "mongoose";

const generatedTimetableEntrySchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class", // Assuming your Class model is named 'Class'
      required: true,
    },
    batchName: {
      type: String,
      required: false, // Optional for electives (class-wide)
      default: "ALL",  // Default for elective entries
    },
    day: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject", // Assuming your Subject model is named 'Subject'
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty", // Assuming your Faculty model is named 'Faculty'
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", // Assuming your Room model is named 'Room'
      required: true,
    },
    type: {
      type: String, // e.g., 'lecture', 'lab', 'elective', 'PE'
      enum: ['lecture', 'lab', 'elective', 'PE'],
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    // Elective-specific fields
    electiveGroup: {
      type: String, // e.g., "PE-III", "OE-II"
      default: null,
    },
    electiveType: {
      type: String, // "PE" or "OE"
      enum: ["PE", "OE", null],
      default: null,
    },
    // ✨ This is the critical field to ensure it's in your schema
    timetableSchemaRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimetableSchema", // Assuming your TimetableSchema model is named 'TimetableSchema'
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const GeneratedTimetableEntry = mongoose.model(
  "GeneratedTimetableEntry",
  generatedTimetableEntrySchema
);
export default GeneratedTimetableEntry;
