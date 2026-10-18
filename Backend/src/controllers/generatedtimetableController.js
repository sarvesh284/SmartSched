import mongoose from "mongoose";
import GeneratedTimetableEntry from "../models/generatedtimetable.model.js";

// Create new timetable entry
export const createGeneratedEntry = async (req, res) => {
  try {
    const entry = new GeneratedTimetableEntry(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error creating timetable entry", error });
  }
};

// Get all timetable entries
export const getAllGeneratedEntries = async (req, res) => {
  try {
    const entries = await GeneratedTimetableEntry.find()
      .populate("classId")
      .populate("subject")
      .populate("faculty")
      .populate("room");
    res.status(200).json(entries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching timetable entries", error });
  }
};

// Get timetable entries by class
export const getEntriesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { timetableSchemaId } = req.query;

    // First get the class to find its year
    const Class = (await import("../models/class.model.js")).default;
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    let query = {
      $or: [
        { classId: classId },  // Regular entries for this class
        { type: 'elective', year: classDoc.year }  // Year-wide electives
      ]
    };

    if (timetableSchemaId) {
      query.timetableSchemaRef = timetableSchemaId;
    }

    const entries = await GeneratedTimetableEntry.find(query)
      .populate("classId")
      .populate("subject")
      .populate("faculty")
      .populate("room");
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching class timetable:", error);
    res
      .status(500)
      .json({
        message: "Error fetching class timetable",
        error: error.message,
      });
  }
};

// Get timetable entries by timetable schema parameter
export const getEntriesBySchema = async (req, res) => {
  try {
    const { timetableschema } = req.params;

    // Example: Filter by "type" (lecture/lab) or any other field
    const entries = await GeneratedTimetableEntry.find({
      type: timetableschema,
    })
      .populate("classId")
      .populate("subject")
      .populate("faculty")
      .populate("room");

    res.status(200).json(entries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching timetable by schema", error });
  }
};
export const getEntriesByClassAndSchema = async (req, res) => {
  try {
    const { classId, timetableschemaId } = req.params;

    // First get the class to find its year
    const Class = (await import("../models/class.model.js")).default;
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    const query = {
      $or: [
        { classId: classId },  // Regular entries for this class
        { type: 'elective', year: classDoc.year }  // Year-wide electives
      ],
      timetableSchemaRef: timetableschemaId
    };

    const entries = await GeneratedTimetableEntry.find(query)
      .populate("classId")
      .populate("subject")
      .populate("faculty")
      .populate("room");

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching timetable by class and schema ID:", error);
    res.status(500).json({
      message: "Error fetching timetable entries by class and schema ID",
      error: error.message,
    });
  }
};

// ... (existing functions)
// Update timetable entry
export const updateGeneratedEntry = async (req, res) => {
  try {
    const entry = await GeneratedTimetableEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error updating timetable entry", error });
  }
};

// Delete timetable entry
export const deleteGeneratedEntry = async (req, res) => {
  try {
    const entry = await GeneratedTimetableEntry.findByIdAndDelete(
      req.params.id
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.status(200).json({ message: "Timetable entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting timetable entry", error });
  }
};

// Get free rooms and faculties for each slot
export const getFreeResourcesBySlot = async (req, res) => {
  try {
    const { timetableSchemaId } = req.params;

    // Import models dynamically to avoid circular dependencies
    const Room = (await import("../models/room.model.js")).default;
    const Faculty = (await import("../models/faculty.model.js")).default;
    const TimetableSchema = (await import("../models/timetable.model.js")).default;

    // Fetch the timetable schema to get days and slots
    const timetableSchema = await TimetableSchema.findById(timetableSchemaId);
    if (!timetableSchema) {
      return res.status(404).json({ message: "Timetable schema not found" });
    }

    // Fetch all rooms and faculties
    const allRooms = await Room.find().lean();
    const allFaculties = await Faculty.find().select("_id name subjects").lean();

    // Fetch generated timetable entries for this schema
    const entries = await GeneratedTimetableEntry.find({
      timetableSchemaRef: timetableSchemaId,
    }).lean();

    // Build a map of occupied resources per slot: { "Mon-09:00": { rooms: Set, faculties: Set } }
    const occupiedMap = new Map();

    entries.forEach((entry) => {
      const key = `${entry.day}-${entry.startTime}`;
      if (!occupiedMap.has(key)) {
        occupiedMap.set(key, { rooms: new Set(), faculties: new Set() });
      }
      const slot = occupiedMap.get(key);
      if (entry.room) slot.rooms.add(entry.room.toString());
      if (entry.faculty) slot.faculties.add(entry.faculty.toString());
    });

    // Build response: for each day and slot, calculate free resources
    const result = [];

    for (const day of timetableSchema.days) {
      for (const slot of timetableSchema.slots) {
        // Skip break slots
        if (slot.type === "break") continue;

        const key = `${day}-${slot.startTime}`;
        const occupied = occupiedMap.get(key) || { rooms: new Set(), faculties: new Set() };

        const freeRooms = allRooms.filter(
          (room) => !occupied.rooms.has(room._id.toString())
        );
        const occupiedRooms = allRooms.filter(
          (room) => occupied.rooms.has(room._id.toString())
        );

        const freeFaculties = allFaculties.filter(
          (faculty) => !occupied.faculties.has(faculty._id.toString())
        );
        const occupiedFaculties = allFaculties.filter(
          (faculty) => occupied.faculties.has(faculty._id.toString())
        );

        result.push({
          day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotName: slot.name,
          slotType: slot.type,
          freeRooms,
          occupiedRooms,
          freeFaculties,
          occupiedFaculties,
          freeRoomCount: freeRooms.length,
          occupiedRoomCount: occupiedRooms.length,
          freeFacultyCount: freeFaculties.length,
          occupiedFacultyCount: occupiedFaculties.length,
        });
      }
    }

    res.status(200).json({
      timetableSchema: {
        _id: timetableSchema._id,
        name: timetableSchema.name,
        days: timetableSchema.days,
      },
      slots: result,
      totalRooms: allRooms.length,
      totalFaculties: allFaculties.length,
    });
  } catch (error) {
    console.error("Error fetching free resources:", error);
    res.status(500).json({
      message: "Error fetching free resources",
      error: error.message,
    });
  }
};


// Move a timetable entry to a new slot (with transaction support for atomicity)
export const moveGeneratedEntry = async (req, res) => {
  // Try to start a session for transaction (may fail if not replica set)
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessionError) {
    // Transactions not available (standalone MongoDB), proceed without
    console.log("Transactions not available, proceeding without atomic guarantees");
    session = null;
  }

  try {
    const { entryId, newDay, newStartTime, newEndTime } = req.body;

    // Helper functions for time operations
    const timeToMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const minToTime = (min) => {
      const h = Math.floor(min / 60).toString().padStart(2, "0");
      const m = (min % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };
    const isOverlapping = (start1, end1, start2, end2) => {
      const s1 = timeToMin(start1);
      const e1 = timeToMin(end1);
      const s2 = timeToMin(start2);
      const e2 = timeToMin(end2);
      return s1 < e2 && s2 < e1;
    };

    // 1. Fetch the entry to be moved
    const queryOptions = session ? { session } : {};
    const entry = await GeneratedTimetableEntry.findById(entryId, null, queryOptions);
    if (!entry) {
      if (useTransaction) await session.abortTransaction();
      return res.status(404).json({ message: "Entry not found" });
    }

    // Calculate end time based on original duration to preserve length (e.g. 2hr labs)
    const originalDurationMin = timeToMin(entry.endTime) - timeToMin(entry.startTime);
    const finalEndTime = minToTime(timeToMin(newStartTime) + originalDurationMin);

    // 2. Collect all entries to move (single entry or entire elective group)
    let entriesToMove = [entry];

    if (entry.type === 'elective') {
      // Find ALL entries for this specific elective group at this time slot
      // Must be same year, electiveGroup, day, startTime, AND timetableSchema
      console.log('\n=== ELECTIVE SYNC DEBUG ===');
      console.log('Looking for electives with:');
      console.log('  year:', entry.year);
      console.log('  electiveGroup:', entry.electiveGroup);
      console.log('  day:', entry.day);
      console.log('  startTime:', entry.startTime);
      console.log('  timetableSchemaRef:', entry.timetableSchemaRef);

      entriesToMove = await GeneratedTimetableEntry.find({
        year: entry.year,
        electiveGroup: entry.electiveGroup,
        day: entry.day,
        startTime: entry.startTime,
        timetableSchemaRef: entry.timetableSchemaRef
      }, null, queryOptions);

      console.log('Found', entriesToMove.length, 'elective entries to move:');
      entriesToMove.forEach((e, i) => {
        console.log(`  [${i}] ID: ${e._id}, ClassId: ${e.classId}, Subject: ${e.subject}`);
      });
    }

    const idsToExclude = entriesToMove.map(e => e._id);

    // DEBUG: Log what we're moving
    console.log('\n=== MOVE DEBUG ===');
    console.log('Entry being moved:', entry._id, 'Type:', entry.type);
    console.log('TimetableSchemaRef:', entry.timetableSchemaRef);
    console.log('From:', entry.day, entry.startTime, '-> To:', newDay, newStartTime);
    console.log('Entries to move count:', entriesToMove.length);
    entriesToMove.forEach((e, i) => {
      console.log(`  [${i}] ID: ${e._id}, Room: ${e.room}, ClassId: ${e.classId}`);
    });
    console.log('IDs to exclude:', idsToExclude.map(id => id.toString()));

    // 3. Validate Conflicts for EACH entry involved in the move
    for (const moveCandidate of entriesToMove) {

      // A. Check Room Availability (filter by same timetableSchemaRef)
      const roomDayEntries = await GeneratedTimetableEntry.find({
        room: moveCandidate.room,
        day: newDay,
        timetableSchemaRef: entry.timetableSchemaRef,
        _id: { $nin: idsToExclude }
      }, null, queryOptions);

      // DEBUG: Enhanced logging for room conflict detection
      console.log(`\n=== ROOM CONFLICT CHECK ===`);
      console.log(`Moving entry ID: ${entry._id}`);
      console.log(`MoveCandidate ID: ${moveCandidate._id}, Room: ${moveCandidate.room}`);
      console.log(`FROM: ${entry.day} ${entry.startTime}-${entry.endTime}`);
      console.log(`TO: ${newDay} ${newStartTime}-${finalEndTime}`);
      console.log(`IDs being excluded:`, idsToExclude.map(id => id.toString()));
      console.log(`Found ${roomDayEntries.length} other entries in this room on ${newDay}:`);
      roomDayEntries.forEach(e => {
        const isExcluded = idsToExclude.some(id => id.toString() === e._id.toString());
        console.log(`    - ID: ${e._id}, Time: ${e.startTime}-${e.endTime}, Type: ${e.type}, Should be excluded: ${isExcluded}`);
      });

      const roomConflict = roomDayEntries.find(e =>
        isOverlapping(e.startTime, e.endTime, newStartTime, finalEndTime)
      );
      if (roomConflict) {
        const isSelfConflict = idsToExclude.some(id => id.toString() === roomConflict._id.toString());
        console.log(`  CONFLICT FOUND: ${roomConflict._id} at ${roomConflict.startTime}`);
        console.log(`  IS SELF-CONFLICT (BUG): ${isSelfConflict}`);
        const conflictDetails = await GeneratedTimetableEntry.findById(roomConflict._id, null, queryOptions)
          .populate('subject', 'name')
          .populate('classId', 'name')
          .lean();

        const conflictClass = conflictDetails.classId?.name || "another class";
        const conflictSubject = conflictDetails.subject?.name || "unknown subject";
        const Room = (await import("../models/room.model.js")).default;
        const occupiedRoom = await Room.findById(moveCandidate.room, 'name', queryOptions);

        if (useTransaction) await session.abortTransaction();
        return res.status(409).json({
          message: `Room Conflict: ${occupiedRoom?.name || 'Room'} is occupied by ${conflictClass} (${conflictSubject}) at ${newStartTime}`
        });
      }

      // B. Check Faculty Availability (filter by same timetableSchemaRef)
      const facultyDayEntries = await GeneratedTimetableEntry.find({
        faculty: moveCandidate.faculty,
        day: newDay,
        timetableSchemaRef: entry.timetableSchemaRef,
        _id: { $nin: idsToExclude }
      }, null, queryOptions);

      const facultyConflict = facultyDayEntries.find(e =>
        isOverlapping(e.startTime, e.endTime, newStartTime, finalEndTime)
      );
      if (facultyConflict) {
        const conflictDetails = await GeneratedTimetableEntry.findById(facultyConflict._id, null, queryOptions)
          .populate('classId', 'name')
          .populate('subject', 'name')
          .lean();
        const conflictClass = conflictDetails.classId?.name || "another class";
        const Faculty = (await import("../models/faculty.model.js")).default;
        const busyFaculty = await Faculty.findById(moveCandidate.faculty, 'name', queryOptions);

        if (useTransaction) await session.abortTransaction();
        return res.status(409).json({
          message: `Faculty Conflict: ${busyFaculty?.name || 'Faculty'} is busy with ${conflictClass} (${conflictDetails.subject?.name}) at ${newStartTime}`
        });
      }

      // C. Check Class Batch/Group Availability (Skipped for Electives)
      if (moveCandidate.type !== 'elective') {
        const classDayEntries = await GeneratedTimetableEntry.find({
          classId: moveCandidate.classId,
          day: newDay,
          timetableSchemaRef: entry.timetableSchemaRef,
          _id: { $nin: idsToExclude }
        }, null, queryOptions);

        const classConflict = classDayEntries.find(e => {
          if (!isOverlapping(e.startTime, e.endTime, newStartTime, finalEndTime)) return false;
          if (moveCandidate.type === 'lecture') return true;
          if (e.type === 'lecture') return true;
          if (e.batchName === 'ALL' || e.batchName === moveCandidate.batchName) return true;
          return false;
        });

        if (classConflict) {
          if (useTransaction) await session.abortTransaction();
          return res.status(409).json({ message: `Class/Batch Conflict: Class is busy at ${newStartTime} on ${newDay}` });
        }
      }
    }

    // 4. No Conflicts - Update ALL involved entries
    const saveOptions = session ? { session } : {};
    await Promise.all(entriesToMove.map(e => {
      e.day = newDay;
      e.startTime = newStartTime;
      e.endTime = finalEndTime;
      return e.save(saveOptions);
    }));

    // Commit transaction if using one
    if (useTransaction) {
      await session.commitTransaction();
    }

    // 5. Fetch updated entries with populated fields for frontend state update
    const updatedEntries = await GeneratedTimetableEntry.find({
      _id: { $in: idsToExclude }
    })
      .populate("classId")
      .populate("subject")
      .populate("faculty")
      .populate("room");

    res.status(200).json({
      message: "Moved successfully",
      updatedCount: entriesToMove.length,
      updatedEntries: updatedEntries
    });

  } catch (error) {
    // Abort transaction on error if one was started
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error moving entry:", error);
    res.status(500).json({ message: "Error moving timetable entry", error: error.message });
  } finally {
    // End session if one was created
    if (session) {
      session.endSession();
    }
  }
};

// Get available resources for a specific slot and subject
export const getAvailableResources = async (req, res) => {
  try {
    const { day, startTime, endTime, subjectId, currentEntryId } = req.query;

    if (!day || !startTime || !endTime || !subjectId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const Room = (await import("../models/room.model.js")).default;
    const Faculty = (await import("../models/faculty.model.js")).default;
    // const GeneratedTimetableEntry = (await import("../models/generatedtimetable.model.js")).default; // Already imported at top

    // 1. Fetch qualified resources
    const allRooms = await Room.find().lean();
    // Filter faculty by subject qualification
    const qualifiedFaculty = await Faculty.find({ subjects: subjectId }).select("_id name subjects").lean();

    // 2. Find overlapping entries
    // Helper for time overlap
    const timeToMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const isOverlapping = (start1, end1, start2, end2) => {
      const s1 = timeToMin(start1); const e1 = timeToMin(end1);
      const s2 = timeToMin(start2); const e2 = timeToMin(end2);
      return s1 < e2 && s2 < e1;
    };

    // Find entries on the same day that overlap
    const potentialConflicts = await GeneratedTimetableEntry.find({ day }).lean();

    // Filter strictly by overlap and exclude current entry
    const conflictingEntries = potentialConflicts.filter(entry => {
      if (currentEntryId && entry._id.toString() === currentEntryId) return false;
      return isOverlapping(entry.startTime, entry.endTime, startTime, endTime);
    });

    const occupiedRoomIds = new Set(conflictingEntries.filter(e => e.room).map(e => e.room.toString()));
    const occupiedFacultyIds = new Set(conflictingEntries.filter(e => e.faculty).map(e => e.faculty.toString()));

    // 3. Filter available resources
    const availableRooms = allRooms.filter(r => !occupiedRoomIds.has(r._id.toString()));
    const availableFaculty = qualifiedFaculty.filter(f => !occupiedFacultyIds.has(f._id.toString()));

    res.status(200).json({
      availableRooms,
      availableFaculty
    });

  } catch (error) {
    console.error("Error fetching available resources:", error);
    res.status(500).json({ message: "Error fetching available resources", error: error.message });
  }
};

export const getDebugSlot = async (req, res) => {
  try {
    const { day, startTime, subjectName, className, mode, roomName } = req.query;

    if (mode === 'stats') {
      const days = await GeneratedTimetableEntry.distinct("day");
      const total = await GeneratedTimetableEntry.countDocuments();
      const allEntries = await GeneratedTimetableEntry.find().select("day startTime room").limit(20).lean();
      return res.status(200).json({ days, total, sample: allEntries });
    }

    // Basic overlap check helpers
    if (subjectName || className || roomName) {
      let query = GeneratedTimetableEntry.find();

      if (subjectName) {
        query = query.populate({
          path: 'subject',
          match: { name: new RegExp(subjectName, 'i') }
        });
      } else {
        query = query.populate('subject', 'name');
      }

      if (className) {
        query = query.populate({
          path: 'classId',
          match: { name: new RegExp(className, 'i') }
        });
      } else {
        query = query.populate('classId', 'name');
      }

      if (roomName) {
        query = query.populate({
          path: 'room',
          match: { name: new RegExp(roomName, 'i') }
        });
      } else {
        query = query.populate('room', 'name');
      }

      const entries = await query
        .populate("faculty", "name")
        .lean();

      // Filter where relation was populated
      const matchedStats = entries.filter(e =>
        (subjectName ? e.subject : true) &&
        (className ? e.classId : true) &&
        (roomName ? e.room : true)
      ).map(e => ({
        id: e._id,
        class: e.classId?.name,
        subject: e.subject?.name,
        day: e.day,
        time: `${e.startTime}-${e.endTime}`,
        electiveGroup: e.electiveGroup,
        room: e.room?.name || 'N/A'
      }));
      return res.status(200).json(matchedStats);
    }


    const entries = await GeneratedTimetableEntry.find({ day: day || "Wednesday", startTime: startTime || "11:15" })
      .populate("classId", "name")
      .populate("subject", "name type")
      .populate("room", "name")
      .populate("faculty", "name")
      .lean();

    res.status(200).json({
      count: entries.length,
      entries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update entry with conflict validation
export const updateEntryWithValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomId, facultyId } = req.body;

    const entry = await GeneratedTimetableEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    // Validate if resources exist (optional but good)
    // const Room = (await import("../models/room.model.js")).default;
    // const Faculty = (await import("../models/faculty.model.js")).default;

    // Determine the scope of update (Single entry vs Elective Group)
    let entriesToUpdate = [entry];
    if (entry.type === 'elective') {
      entriesToUpdate = await GeneratedTimetableEntry.find({
        year: entry.year,
        electiveGroup: entry.electiveGroup,
        day: entry.day,
        startTime: entry.startTime,
        // Match the PREVIOUS resources to ensure we are updating the right group block
        subject: entry.subject,
        faculty: entry.faculty,
        room: entry.room
      });
    }

    // Helper for time overlap (reused)
    const timeToMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const isOverlapping = (start1, end1, start2, end2) => {
      const s1 = timeToMin(start1); const e1 = timeToMin(end1);
      const s2 = timeToMin(start2); const e2 = timeToMin(end2);
      return s1 < e2 && s2 < e1;
    };

    // Validate Conflicts for the new resources
    // We check against ALL entries on that day, EXCLUDING the ones we are updating
    const idsToExclude = entriesToUpdate.map(e => e._id.toString());

    const dayEntries = await GeneratedTimetableEntry.find({
      day: entry.day,
      _id: { $nin: idsToExclude }
    }).lean();

    // Check Room Conflict
    if (roomId) {
      const roomConflict = dayEntries.find(e =>
        e.room && e.room.toString() === roomId &&
        isOverlapping(e.startTime, e.endTime, entry.startTime, entry.endTime)
      );
      if (roomConflict) {
        return res.status(409).json({ message: `Room Conflict: Room is occupied at this time.` });
      }
    }

    // Check Faculty Conflict
    if (facultyId) {
      const facultyConflict = dayEntries.find(e =>
        e.faculty && e.faculty.toString() === facultyId &&
        isOverlapping(e.startTime, e.endTime, entry.startTime, entry.endTime)
      );
      if (facultyConflict) {
        return res.status(409).json({ message: `Faculty Conflict: Faculty is busy at this time.` });
      }
    }

    // Execute Update
    await Promise.all(entriesToUpdate.map(e => {
      if (roomId) e.room = roomId;
      if (facultyId) e.faculty = facultyId;
      return e.save();
    }));

    res.status(200).json({
      message: "Entry updated successfully",
      updatedCount: entriesToUpdate.length,
      entry // Return one entry
    });

  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ message: "Error updating entry", error: error.message });
  }
};
