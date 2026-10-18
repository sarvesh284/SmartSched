import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: [
    {
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
      lecturesPerWeek: { type: Number, required: true },
    },
  ],
});

const electiveGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true }, // e.g., "PE-III", "OE-II"
  electiveType: { type: String, enum: ["PE", "OE"], required: true },
  lecturesPerWeek: { type: Number, default: 3 },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }]
});

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    year: { type: String, required: true },
    department: { type: String, default: null }, // For PE scoping (e.g., "CSE", "IT", "ECE")
    batches: [batchSchema],
    lectureSubjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        lecturesPerWeek: { type: Number, required: true },
      },
    ],
    electiveGroups: [electiveGroupSchema], // Groups of electives that run concurrently
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
