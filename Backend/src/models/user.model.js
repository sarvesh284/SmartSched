import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String }, // optional profile image
    role: {
      type: String,
      enum: ["admin", "user"], // Defines the possible values for role
      default: "user", // Sets a default role for new users
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
