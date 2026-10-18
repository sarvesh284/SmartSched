import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./src/routes/userRoutes.js";
import facultyRoutes from "./src/routes/facultyRoutes.js";
import subjectRoutes from "./src/routes/subjectRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import classRoutes from "./src/routes/classRoutes.js";
import timetableRoute from "./src/routes/timetable.js";
import generatedtimetableRoute from "./src/routes/generatedtimetable.js";
import generatetimetableRoute from "./src/routes/generatetimetableRoute.js";
import aiRoutes from "./src/routes/aiRoutes.js";


dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import cors from "cors";
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // if using cookies/session
  })
);

app.use("/api/users", userRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/class", classRoutes);
app.use("/api/timetable", timetableRoute);
app.use("/api/generatedtimetable", generatedtimetableRoute);
app.use("/api/generate", generatetimetableRoute);
app.use("/api/ai", aiRoutes);
app.use("/api/ai", aiRoutes);

mongoose
  .connect(process.env.mongoURL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });
