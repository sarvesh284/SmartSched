import mongoose from "mongoose";
const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["lecture", "lab"], required: true },
    isElective: { type: Boolean, default: false },
    electiveType: { type: String, enum: ["PE", "OE", null], default: null },
    electiveGroup: { type: String, default: null }, // Groups related electives (e.g., "PE-III", "OE-II")
    code: { type: String }, // Optional: Subject code
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
