import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  availability: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      slots: [{ type: Number, required: true }], // e.g., [1, 2, 3] for lecture periods
    },
  ],
});

export default mongoose.model("Faculty", facultySchema);
