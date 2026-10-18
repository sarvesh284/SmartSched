import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // CR-101, Lab-1
    type: { type: String, enum: ["lecture", "lab"], required: true },
    // capacity removed
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
