import mongoose from "mongoose";

const timetableSchemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Science Block Default"
    days: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] }],
    slots: [
      {
        name: String, // "Period 1", "Lunch Break"
        startTime: String, // "09:00"
        endTime: String, // "10:00"
        type: {
          type: String,
          enum: ["lecture", "lab", "break"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Timetable", timetableSchemaSchema);
