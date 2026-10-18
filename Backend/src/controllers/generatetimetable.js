import Faculty from "../models/faculty.model.js";
import Room from "../models/room.model.js";
import Subject from "../models/subject.model.js";
import TimetableSchema from "../models/timetable.model.js";
import GeneratedTimetableEntry from "../models/generatedtimetable.model.js";
import Class from "../models/class.model.js";

/* -------------------------
   Helper: TaskDomain (CSP)
   ------------------------- */
class TaskDomain {
  constructor(task, allFaculties, allRooms, normalizedTimeSlots) {
    this.task = task;
    this.possibleAssignments = [];
    this.initialize(allFaculties, allRooms, normalizedTimeSlots);
  }

  initialize(allFaculties, allRooms, normalizedTimeSlots) {
    // rooms matching this task type (labs/lectures)
    this.suitableRooms = allRooms.filter(
      (r) =>
        r.type ===
        (this.task.type === "composite_lab_pair" ? "lab" : this.task.type)
    );

    const candidates = this.task.facultyCandidates?.length
      ? this.task.facultyCandidates
      : this.task.facultyId
        ? [this.task.facultyId]
        : [null];

    // precompute teaching periods (same for all days)
    const slots = normalizedTimeSlots.days[0].slots;
    let tpCounter = 0;
    const teachingPeriods = slots.map((slot) => {
      if (slot.type === "break") return null;
      tpCounter++;
      return tpCounter;
    });

    const dur = this.task.duration || 1;

    for (const day of normalizedTimeSlots.days) {
      for (let startIdx = 0; startIdx < slots.length; startIdx++) {
        const startSlot = slots[startIdx];
        const startTP = teachingPeriods[startIdx];
        if (startTP === null) continue;

        const endIdx = startIdx + dur - 1;
        if (endIdx >= slots.length) continue;

        const endSlot = slots[endIdx];
        let valid = true;
        for (let j = startIdx; j <= endIdx; j++) {
          if (teachingPeriods[j] === null) {
            valid = false;
            break;
          }
        }
        if (!valid) continue;

        const endTP = teachingPeriods[endIdx];
        if (endTP !== startTP + dur - 1) continue;

        for (const room of this.suitableRooms) {
          for (const fac of candidates) {
            this.possibleAssignments.push({
              day: day.name,
              startTime: startSlot.startTime,
              endTime: endSlot.endTime,
              room,
              facultyId: fac,
              startTeachingPeriodNumber: startTP,
            });
          }
        }
      }
    }

    // NEW: Sort lab assignments to prefer even distribution across days
    // Group by day and shuffle within each day, then interleave days
    if (this.task.type === "lab" || this.task.type === "composite_lab_pair") {
      const assignmentsByDay = new Map();

      this.possibleAssignments.forEach((assignment) => {
        if (!assignmentsByDay.has(assignment.day)) {
          assignmentsByDay.set(assignment.day, []);
        }
        assignmentsByDay.get(assignment.day).push(assignment);
      });

      // Interleave assignments from different days to try different days first
      const interleaved = [];
      const dayArrays = Array.from(assignmentsByDay.values());
      let maxLength = Math.max(...dayArrays.map((arr) => arr.length));

      for (let i = 0; i < maxLength; i++) {
        for (const dayArray of dayArrays) {
          if (i < dayArray.length) {
            interleaved.push(dayArray[i]);
          }
        }
      }

      this.possibleAssignments = interleaved;
    }
  }

  size() {
    return this.possibleAssignments.length;
  }

  // defensive iterator copy
  assignments() {
    return Array.isArray(this.possibleAssignments)
      ? [...this.possibleAssignments]
      : [];
  }
}

/* -------------------------
   Constraint check helpers
   ------------------------- */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1),
    e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2),
    e2 = timeToMinutes(end2);
  return !(e1 <= s2 || e2 <= s1);
}

function getGroupKey(taskOrEntry) {
  return taskOrEntry.batchName
    ? `${taskOrEntry.classId.toString()}-${taskOrEntry.batchName}`
    : taskOrEntry.classId.toString();
}

// NEW: Helper functions for even lab distribution
function countLabsOnDay(currentTimetable, classId, day, type = "lab") {
  return currentTimetable.filter(
    (entry) =>
      entry.classId.toString() === classId.toString() &&
      entry.day === day &&
      entry.type === type
  ).length;
}

function getLabDistributionScore(
  currentTimetable,
  classId,
  proposedDay,
  normalizedTimeSlots
) {
  // Count labs per day for this class
  const labCountsByDay = new Map();

  normalizedTimeSlots.days.forEach((dayObj) => {
    labCountsByDay.set(
      dayObj.name,
      countLabsOnDay(currentTimetable, classId, dayObj.name)
    );
  });

  // Add one for the proposed day
  const proposedDayCount = (labCountsByDay.get(proposedDay) || 0) + 1;
  labCountsByDay.set(proposedDay, proposedDayCount);

  // Calculate variance (lower is better - more even distribution)
  const counts = Array.from(labCountsByDay.values());
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) /
    counts.length;

  return variance;
}

function sortAssignmentsByLabDistribution(
  assignments,
  task,
  currentTimetable,
  normalizedTimeSlots
) {
  if (task.type !== "lab" && task.type !== "composite_lab_pair") {
    return assignments;
  }

  // Score each assignment based on how it affects lab distribution
  const scoredAssignments = assignments.map((assignment) => {
    const score = getLabDistributionScore(
      currentTimetable,
      task.classId,
      assignment.day,
      normalizedTimeSlots
    );
    return { assignment, score };
  });

  // Sort by score (lower variance = better distribution = lower score)
  scoredAssignments.sort((a, b) => a.score - b.score);

  return scoredAssignments.map((item) => item.assignment);
}

function isValidAssignment(
  currentTimetable,
  task,
  proposedDay,
  proposedStartTime,
  proposedEndTime,
  proposedRoom,
  allFaculties,
  startTeachingPeriodNumber,
  otherEntries = []
) {
  const allScheduledEntriesForCheck = [...currentTimetable, ...otherEntries];
  const dur = task.duration || 1;

  // Faculty checks
  if (task.facultyId) {
    const faculty = allFaculties.find(
      (f) => f._id.toString() === task.facultyId.toString()
    );
    if (!faculty) return false;

    const tpsNeeded = Array.from(
      { length: dur },
      (_, i) => startTeachingPeriodNumber + i
    );
    const available = faculty.availability.some(
      (a) =>
        a.day === proposedDay && tpsNeeded.every((tp) => a.slots.includes(tp))
    );
    if (!available) return false;

    const facultyConflict = allScheduledEntriesForCheck.some(
      (entry) =>
        entry.faculty &&
        entry.faculty.toString() === task.facultyId.toString() &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
    );
    if (facultyConflict) return false;
  }

  // Room type sanity (task should match room type except composite handled earlier)
  if (task.type !== "composite_lab_pair" && task.type !== proposedRoom.type)
    return false;

  // Room conflict
  const roomConflict = allScheduledEntriesForCheck.some(
    (entry) =>
      entry.room &&
      entry.room.toString() === proposedRoom._id.toString() &&
      entry.day === proposedDay &&
      overlaps(
        entry.startTime,
        entry.endTime,
        proposedStartTime,
        proposedEndTime
      )
  );
  if (roomConflict) return false;

  // ELECTIVE SLOT BLOCKING: If an elective is scheduled for this year at this time,
  // no other lecture or lab can be scheduled (electives are year-wide or year+dept-wide)
  const electiveConflict = allScheduledEntriesForCheck.some(
    (entry) =>
      entry.type === 'elective' &&
      entry.year === task.year &&  // Match by year instead of classId
      entry.day === proposedDay &&
      overlaps(
        entry.startTime,
        entry.endTime,
        proposedStartTime,
        proposedEndTime
      )
  );
  if (electiveConflict) return false;

  // Class & Year group conflicts
  if (task.type === "lecture") {
    const classLectureConflict = allScheduledEntriesForCheck.some(
      (entry) =>
        entry.classId.toString() === task.classId.toString() &&
        entry.type === "lecture" &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
    );
    if (classLectureConflict) return false;

    const lectureLabOverlap = allScheduledEntriesForCheck.some(
      (entry) =>
        entry.classId.toString() === task.classId.toString() &&
        entry.type === "lab" &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
    );
    if (lectureLabOverlap) return false;

    // Prevent multiple lectures for the same subject on the same day (per group: class or batch)
    const taskGroupKey = getGroupKey(task);
    const sameDayLectureConflict = allScheduledEntriesForCheck.some((entry) => {
      const entryGroupKey = getGroupKey(entry);
      return (
        entry.day === proposedDay &&
        entry.subject.toString() === task.subjectId.toString() &&
        entry.type === "lecture" &&
        entryGroupKey === taskGroupKey
      );
    });
    if (sameDayLectureConflict) return false;
  } else if (task.type === "lab") {
    const lectureBlocking = allScheduledEntriesForCheck.some(
      (entry) =>
        entry.classId.toString() === task.classId.toString() &&
        entry.type === "lecture" &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
    );
    if (lectureBlocking) return false;

    // concurrent labs for same class limit (max 2)
    let concurrentLabs = 0;
    allScheduledEntriesForCheck.forEach((entry) => {
      if (
        entry.classId.toString() === task.classId.toString() &&
        entry.type === "lab" &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
      )
        concurrentLabs++;
    });
    if (concurrentLabs + 1 > 2) return false;

    // batch cannot have two labs overlapping
    const batchConflict = allScheduledEntriesForCheck.some(
      (entry) =>
        entry.type === "lab" &&
        entry.batchName === task.batchName &&
        entry.day === proposedDay &&
        overlaps(
          entry.startTime,
          entry.endTime,
          proposedStartTime,
          proposedEndTime
        )
    );
    if (batchConflict) return false;
  }

  return true;
}

/* -------------------------
   Forward checking
   ------------------------- */
function forwardCheck(domains, assignment, currentTimetable, allFaculties) {
  // domains: Map(taskId -> TaskDomain | plain object)
  const updated = new Map();

  for (const [taskId, domainObj] of domains.entries()) {
    // skip domain for the task we just assigned (we'll remove it by caller by filtering tasks)
    const d = domainObj;
    const assignmentsArray = Array.isArray(d.possibleAssignments)
      ? d.possibleAssignments
      : [];

    const filtered = assignmentsArray.filter((possible) => {
      const domainTask = d.task;

      // Prune same-day lectures for same subject (per group) - time independent
      if (
        domainTask.type === "lecture" &&
        assignment.type === "lecture" &&
        domainTask.subjectId &&
        assignment.subject &&
        domainTask.subjectId.toString() === assignment.subject.toString()
      ) {
        const domainGroupKey = getGroupKey(domainTask);
        const assignmentGroupKey = getGroupKey(assignment);
        if (
          domainGroupKey === assignmentGroupKey &&
          possible.day === assignment.day
        ) {
          return false;
        }
      }

      // If no overlap, keep
      if (
        possible.day !== assignment.day ||
        !overlaps(
          possible.startTime,
          possible.endTime,
          assignment.startTime,
          assignment.endTime
        )
      ) {
        return true;
      }

      // Overlaps: check conflicts
      // room conflict
      if (
        possible.room &&
        assignment.room &&
        possible.room._id.toString() === assignment.room.toString()
      )
        return false;

      // faculty conflict
      if (
        possible.facultyId &&
        assignment.facultyId &&
        possible.facultyId.toString() === assignment.facultyId.toString()
      )
        return false;

      // class-level checks
      if (
        domainTask &&
        domainTask.classId &&
        assignment.classId &&
        domainTask.classId.toString() === assignment.classId.toString()
      ) {
        // lecture vs lecture
        if (domainTask.type === "lecture" && assignment.type === "lecture")
          return false;

        // lecture vs lab overlap
        if (
          (domainTask.type === "lab" && assignment.type === "lecture") ||
          (domainTask.type === "lecture" && assignment.type === "lab")
        )
          return false;

        // same batch can't have two labs
        if (
          domainTask.type === "lab" &&
          assignment.type === "lab" &&
          domainTask.batchName === assignment.batchName
        )
          return false;
      }

      return true;
    });

    // create new domain object mimic
    const newDomain = {
      task: d.task,
      possibleAssignments: filtered,
      size() {
        return this.possibleAssignments.length;
      },
    };

    updated.set(taskId, newDomain);
  }

  return updated;
}

/* -------------------------
   Domain utils + MRV
   ------------------------- */
function domainSize(domainObj) {
  if (!domainObj) return 0;
  if (typeof domainObj.size === "function") return domainObj.size();
  if (Array.isArray(domainObj.possibleAssignments))
    return domainObj.possibleAssignments.length;
  return 0;
}

function selectTaskWithMRV(tasks, domains) {
  let minTask = null;
  let min = Infinity;
  for (const t of tasks) {
    const tid =
      t.id ||
      t.originalLabSessionId ||
      t.originalLecturePerWeekId ||
      t.originalId;
    const d = domains.get(tid);
    const s = domainSize(d);
    if (s < min) {
      min = s;
      minTask = t;
      if (min === 1) break;
    }
  }
  return minTask;
}

/* -------------------------
   Recursive solver (MRV + forward check)
   ------------------------- */
async function solveTimetableRecursiveOptimized(
  tasks,
  allFaculties,
  allRooms,
  normalizedTimeSlots,
  currentTimetable = [],
  domains = null,
  startTime = Date.now()
) {
  // Heartbeat logging
  if (!global.solverIterations) global.solverIterations = 0;
  global.solverIterations++;
  if (global.solverIterations % 5000 === 0) {
    // Show remaining tasks info for debugging
    const taskNames = tasks.slice(0, 5).map(t => t.subjectName || t.id).join(', ');
    console.log(
      `Heartbeat: ${global.solverIterations} iters. Depth: ${currentTimetable.length}, Tasks left: ${tasks.length} [${taskNames}...]`
    );
  }

  // Timeout check (120 seconds - increased for complex schedules)
  const elapsedTime = Date.now() - startTime;
  if (elapsedTime > 120000) {
    const remainingTasks = tasks.slice(0, 5).map(t => t.subjectName || t.id).join(', ');
    throw new Error(`Timetable generation timeout (${Math.floor(elapsedTime / 1000)}s). Stuck on tasks: ${remainingTasks}. Try reducing constraints.`);
  }

  // Base case
  if (tasks.length === 0) return currentTimetable;

  // init domains
  if (!domains) {
    domains = new Map();
    let tasksWithEmptyDomain = [];

    for (const task of tasks) {
      const taskId =
        task.id ||
        task.originalLabSessionId ||
        task.originalLecturePerWeekId ||
        task.originalId ||
        `task-${Math.random()}`;
      task.id = taskId;
      const domain = new TaskDomain(task, allFaculties, allRooms, normalizedTimeSlots);
      domains.set(taskId, domain);

      // DEBUG: Check if domain is empty
      if (domain.size() === 0) {
        tasksWithEmptyDomain.push(`${task.subjectName} (${task.type})`);
      }
    }

    // Log tasks with no valid assignments at start
    if (tasksWithEmptyDomain.length > 0) {
      console.log(`⚠️ WARNING: ${tasksWithEmptyDomain.length} tasks have NO valid assignments from start:`);
      tasksWithEmptyDomain.forEach(t => console.log(`   - ${t}`));
    }
  }

  // pick task by MRV
  const currentTask = selectTaskWithMRV(tasks, domains);
  if (!currentTask) return null; // MRV failed (no domain left)

  const currentTaskId = currentTask.id;
  const remainingTasks = tasks.filter((t) => t.id !== currentTaskId);

  // Composite labs: handle by trying pairs of lab rooms and faculty combos
  if (currentTask.type === "composite_lab_pair") {
    const lab1 = { ...currentTask.labTasks[0], duration: 2 };
    const lab2 = { ...currentTask.labTasks[1], duration: 2 };

    // NEW: Create assignments for composite labs and sort by distribution
    const compositeAssignments = [];

    for (const dayObj of normalizedTimeSlots.days) {
      const day = dayObj.name;
      const slots = dayObj.slots;

      // precompute teaching periods for this day
      let tpCounter = 0;
      const teachingPeriods = slots.map((slot) => {
        if (slot.type === "break") return null;
        tpCounter++;
        return tpCounter;
      });

      for (let startIdx = 0; startIdx < slots.length; startIdx++) {
        const startSlot = slots[startIdx];
        const startTP = teachingPeriods[startIdx];
        if (startTP === null) continue;

        const endIdx = startIdx + 1; // duration 2
        if (endIdx >= slots.length) continue;

        const endSlot = slots[endIdx];
        const validSpan =
          teachingPeriods[endIdx] !== null &&
          teachingPeriods[endIdx] === startTP + 1;
        if (!validSpan) continue;

        const startTime = startSlot.startTime;
        const endTime = endSlot.endTime;

        const labRooms = allRooms.filter((r) => r.type === "lab");
        if (labRooms.length < 2) continue;

        // Pre-compute valid room pairs (55% reduction: 100 -> 45 pairs for 10 rooms)
        const validRoomPairs = [];
        for (let r1 = 0; r1 < labRooms.length; r1++) {
          for (let r2 = r1 + 1; r2 < labRooms.length; r2++) {
            validRoomPairs.push([labRooms[r1], labRooms[r2]]);
          }
        }

        // Iterate over pre-computed pairs instead of nested loops
        for (const [room1, room2] of validRoomPairs) {
          const cand1 = lab1.facultyCandidates?.length
            ? lab1.facultyCandidates
            : lab1.facultyId
              ? [lab1.facultyId]
              : [null];
          const cand2 = lab2.facultyCandidates?.length
            ? lab2.facultyCandidates
            : lab2.facultyId
              ? [lab2.facultyId]
              : [null];

          for (const f1 of cand1) {
            for (const f2 of cand2) {
              if (f1 && f2 && f1.toString() === f2.toString()) continue;

              compositeAssignments.push({
                day,
                startTime,
                endTime,
                startTP,
                room1,
                room2,
                f1,
                f2,
              });
            }
          }
        }
      }
    }

    // Sort composite assignments by lab distribution
    const sortedCompositeAssignments = compositeAssignments
      .map((a) => {
        const score = getLabDistributionScore(
          currentTimetable,
          lab1.classId,
          a.day,
          normalizedTimeSlots
        );
        return { assignment: a, score };
      })
      .sort((a, b) => a.score - b.score)
      .map((item) => item.assignment);

    // Try sorted composite assignments
    for (const a of sortedCompositeAssignments) {
      const { day, startTime, endTime, startTP, room1, room2, f1, f2 } = a;

      const lab1WithFac = { ...lab1, facultyId: f1 };
      if (
        !isValidAssignment(
          currentTimetable,
          lab1WithFac,
          day,
          startTime,
          endTime,
          room1,
          allFaculties,
          startTP
        )
      )
        continue;

      const entry1 = {
        classId: lab1.classId,
        batchName: lab1.batchName,
        day,
        startTime,
        endTime,
        subject: lab1.subjectId,
        faculty: f1,
        facultyName: f1
          ? allFaculties.find((x) => x._id.toString() === f1.toString())
            ?.name || "Unassigned"
          : "Unassigned",
        room: room1._id,
        type: "lab",
        year: lab1.year,
        duration: 2,
        timetableSchemaRef: currentTask.timetableSchemaRef,
      };

      const lab2WithFac = { ...lab2, facultyId: f2 };
      if (
        !isValidAssignment(
          currentTimetable,
          lab2WithFac,
          day,
          startTime,
          endTime,
          room2,
          allFaculties,
          startTP,
          [entry1]
        )
      )
        continue;

      const entry2 = {
        classId: lab2.classId,
        batchName: lab2.batchName,
        day,
        startTime,
        endTime,
        subject: lab2.subjectId,
        faculty: f2,
        facultyName: f2
          ? allFaculties.find((x) => x._id.toString() === f2.toString())
            ?.name || "Unassigned"
          : "Unassigned",
        room: room2._id,
        type: "lab",
        year: lab2.year,
        duration: 2,
        timetableSchemaRef: currentTask.timetableSchemaRef,
      };

      // forward check both entries
      let newDomains = forwardCheck(
        domains,
        {
          day,
          startTime,
          endTime,
          room: room1._id,
          facultyId: f1,
          type: "lab",
          classId: lab1.classId,
          batchName: lab1.batchName,
          subject: lab1.subjectId,
          duration: 2,
        },
        currentTimetable,
        allFaculties
      );
      newDomains = forwardCheck(
        newDomains,
        {
          day,
          startTime,
          endTime,
          room: room2._id,
          facultyId: f2,
          type: "lab",
          classId: lab2.classId,
          batchName: lab2.batchName,
          subject: lab2.subjectId,
          duration: 2,
        },
        currentTimetable,
        allFaculties
      );

      const result = await solveTimetableRecursiveOptimized(
        remainingTasks,
        allFaculties,
        allRooms,
        normalizedTimeSlots,
        [...currentTimetable, entry1, entry2],
        newDomains,
        startTime
      );
      if (result) return result;
    }

    return null;
  }

  // Non-composite tasks: iterate domain assignments
  const domainObj = domains.get(currentTaskId);
  let assignments = domainObj
    ? Array.isArray(domainObj.possibleAssignments)
      ? domainObj.possibleAssignments
      : []
    : [];

  // NEW: Sort assignments to prefer even lab distribution
  if (currentTask.type === "lab" || currentTask.type === "composite_lab_pair") {
    assignments = sortAssignmentsByLabDistribution(
      assignments,
      currentTask,
      currentTimetable,
      normalizedTimeSlots
    );
  }

  // try assignments in order (now sorted for even distribution)
  for (const a of assignments) {
    const taskWithFac = { ...currentTask, facultyId: a.facultyId };

    if (
      !isValidAssignment(
        currentTimetable,
        taskWithFac,
        a.day,
        a.startTime,
        a.endTime,
        a.room,
        allFaculties,
        a.startTeachingPeriodNumber
      )
    )
      continue;

    const assignedFacultyName = a.facultyId
      ? allFaculties.find((f) => f._id.toString() === a.facultyId.toString())
        ?.name || "Unassigned"
      : "Unassigned";

    const newEntry = {
      classId: currentTask.classId,
      batchName: currentTask.batchName || undefined,
      day: a.day,
      startTime: a.startTime,
      endTime: a.endTime,
      subject: currentTask.subjectId,
      faculty: a.facultyId || null,
      facultyName: assignedFacultyName,
      room: a.room._id,
      type: currentTask.type,
      year: currentTask.year,
      duration: currentTask.duration || 1,
      timetableSchemaRef: currentTask.timetableSchemaRef,
    };

    const newDomains = forwardCheck(
      domains,
      {
        day: a.day,
        startTime: a.startTime,
        endTime: a.endTime,
        room: a.room._id,
        facultyId: a.facultyId,
        type: currentTask.type,
        classId: currentTask.classId,
        batchName: currentTask.batchName,
        subject: currentTask.subjectId,
        duration: currentTask.duration || 1,
      },
      currentTimetable,
      allFaculties
    );

    const result = await solveTimetableRecursiveOptimized(
      remainingTasks,
      allFaculties,
      allRooms,
      normalizedTimeSlots,
      [...currentTimetable, newEntry],
      newDomains,
      startTime
    );
    if (result) return result;
  }

  // no assignment leads to solution for this task
  return null;
}

/* -------------------------
   Pre-validation utility
   ------------------------- */
function validateFacultyCoverage(subjectToFacultyCandidates, classes) {
  const missing = [];
  classes.forEach((cls) => {
    cls.lectureSubjects.forEach((ls) => {
      if (!ls.subject || !ls.subject._id) {
        missing.push({
          classId: cls._id,
          reason: "lecture subject reference missing or invalid",
          detail: ls,
        });
        return;
      }
      const sid = ls.subject._id.toString();
      if (
        !subjectToFacultyCandidates.has(sid) ||
        subjectToFacultyCandidates.get(sid).length === 0
      ) {
        missing.push({
          subjectId: sid,
          subjectName: ls.subject.name,
          classId: cls._id,
          reason: "lecture",
        });
      }
    });
    cls.batches.forEach((batch) => {
      batch.subjects.forEach((bs) => {
        if (!bs.subject || !bs.subject._id) {
          missing.push({
            classId: cls._id,
            batchName: batch.name,
            reason: "batch subject reference missing or invalid",
            detail: bs,
          });
          return;
        }
        const sid = bs.subject._id.toString();
        if (
          !subjectToFacultyCandidates.has(sid) ||
          subjectToFacultyCandidates.get(sid).length === 0
        ) {
          missing.push({
            subjectId: sid,
            subjectName: bs.subject.name,
            classId: cls._id,
            batchName: batch.name,
            reason: "batch lab/subject",
          });
        }
      });
    });
  });
  return missing;
}

// NEW: Function to schedule Synchronized Electives (PE and OE)
// PE (Professional Elective): All PE options for a year+department run at THE SAME TIME SLOT
// OE (Open Elective): All OE options for a year across ALL departments run at THE SAME TIME SLOT
// This allows students to attend their chosen elective while all options run in parallel
async function scheduleSynchronizedElectives(
  classes,
  faculties,
  rooms,
  normalizedTimeSlots,
  subjectToFacultyCandidates,
  globalFacultyWorkload,
  allGeneratedEntries
) {
  try {
    const scheduledElectiveSubjectIds = new Set();

    // ========================================
    // PHASE A: Schedule Professional Electives (PE)
    // PE is scoped to: YEAR + DEPARTMENT
    // ========================================
    console.log("\n📚 Phase A: Scheduling Professional Electives (PE)...");

    // Group classes by Year + Department for PE
    const classesByYearDept = new Map(); // "year|department" -> [classes]
    classes.forEach(cls => {
      const key = `${cls.year}|${cls.department || 'default'}`;
      if (!classesByYearDept.has(key)) classesByYearDept.set(key, []);
      classesByYearDept.get(key).push(cls);
    });

    for (const [yearDeptKey, deptClasses] of classesByYearDept.entries()) {
      const [year, department] = yearDeptKey.split('|');

      // Collect all PE elective groups from these classes
      const peGroups = new Map(); // groupName -> { subjects[], lecturesPerWeek, classIds[] }

      deptClasses.forEach(cls => {
        // Check electiveGroups array (new model)
        if (cls.electiveGroups && cls.electiveGroups.length > 0) {
          cls.electiveGroups.forEach(eg => {
            if (eg.electiveType === 'PE') {
              if (!peGroups.has(eg.groupName)) {
                peGroups.set(eg.groupName, {
                  subjects: eg.subjects || [],
                  lecturesPerWeek: eg.lecturesPerWeek || 3,
                  classIds: new Set()
                });
              }
              peGroups.get(eg.groupName).classIds.add(cls._id.toString());
            }
          });
        }

        // Also check lectureSubjects for backward compatibility
        cls.lectureSubjects?.forEach(ls => {
          if (ls.subject?.isElective && ls.subject?.electiveType === 'PE' && ls.subject?.electiveGroup) {
            const groupName = ls.subject.electiveGroup;
            if (!peGroups.has(groupName)) {
              peGroups.set(groupName, {
                subjects: [],
                lecturesPerWeek: ls.lecturesPerWeek || 3,
                classIds: new Set()
              });
            }
            const group = peGroups.get(groupName);
            // Add subject if not already present
            if (!group.subjects.some(s => s._id?.toString() === ls.subject._id.toString())) {
              group.subjects.push(ls.subject);
            }
            group.classIds.add(cls._id.toString());
            scheduledElectiveSubjectIds.add(ls.subject._id.toString());
          }
        });
      });

      if (peGroups.size === 0) {
        console.log(`   ℹ️  No PE groups for ${year}/${department} - skipping`);
        continue;
      }

      console.log(`\n🎯 Processing PE for Year: ${year}, Department: ${department}`);
      console.log(`   Found ${peGroups.size} PE group(s)`);

      // Schedule each PE group
      for (const [groupName, groupData] of peGroups.entries()) {
        const { subjects, lecturesPerWeek, classIds } = groupData;
        const classIdsArray = Array.from(classIds);
        const relevantClasses = deptClasses.filter(c => classIdsArray.includes(c._id.toString()));

        console.log(`   📌 Group "${groupName}": ${subjects.length} options, ${lecturesPerWeek} slots/week`);

        if (subjects.length === 0) {
          console.log(`      ⚠️  No subjects in group - skipping`);
          continue;
        }

        // Find and schedule synchronized slots - ONE PER DAY for distribution
        let slotsScheduled = 0;
        const days = normalizedTimeSlots.days;
        const usedDays = new Set(); // Track which days already have a PE slot for this group

        for (const dayObj of days) {
          if (slotsScheduled >= lecturesPerWeek) break;
          if (usedDays.has(dayObj.name)) continue; // Skip if already scheduled on this day

          const slots = dayObj.slots.filter(s => s.type !== 'break');
          let scheduledOnThisDay = false;

          for (const slot of slots) {
            if (slotsScheduled >= lecturesPerWeek) break;
            if (scheduledOnThisDay) break; // Only ONE slot per day for PE (distribution)

            // Check if ALL classes in this group are free at this slot
            const allClassesFree = relevantClasses.every(cls =>
              !allGeneratedEntries.some(entry =>
                entry.classId.toString() === cls._id.toString() &&
                entry.day === dayObj.name &&
                overlaps(entry.startTime, entry.endTime, slot.startTime, slot.endTime)
              )
            );

            if (!allClassesFree) continue;

            // Try to schedule ALL PE options at this slot
            const proposedEntries = [];
            const usedFaculties = new Set();
            const usedRooms = new Set();
            let slotWorksForAll = true;

            // For each PE option subject
            for (const subject of subjects) {
              const sid = subject._id?.toString() || subject.toString();

              // Find available faculty for this subject
              const facultyCandidates = subjectToFacultyCandidates.get(sid) || [];
              let assignedFaculty = null;

              for (const facId of facultyCandidates) {
                const facIdStr = facId.toString();
                if (usedFaculties.has(facIdStr)) continue;

                // Check faculty availability
                const faculty = faculties.find(f => f._id.toString() === facIdStr);
                if (!faculty) continue;

                // Check against all generated entries
                const facultyConflict = allGeneratedEntries.some(e =>
                  e.faculty &&
                  e.faculty.toString() === facIdStr &&
                  e.day === dayObj.name &&
                  overlaps(e.startTime, e.endTime, slot.startTime, slot.endTime)
                );

                if (!facultyConflict) {
                  assignedFaculty = facId;
                  usedFaculties.add(facIdStr);
                  break;
                }
              }

              if (!assignedFaculty) {
                console.log(`      ⚠️  No faculty for "${subject.name || sid}" at ${dayObj.name} ${slot.startTime}`);
                slotWorksForAll = false;
                break;
              }

              // Find available lecture room
              const availableRoom = rooms.find(r => {
                if (r.type !== 'lecture') return false;
                if (usedRooms.has(r._id.toString())) return false;
                return !allGeneratedEntries.some(e =>
                  e.room &&
                  e.room.toString() === r._id.toString() &&
                  e.day === dayObj.name &&
                  overlaps(e.startTime, e.endTime, slot.startTime, slot.endTime)
                );
              });

              if (!availableRoom) {
                console.log(`      ⚠️  No room for "${subject.name || sid}" at ${dayObj.name} ${slot.startTime}`);
                slotWorksForAll = false;
                break;
              }

              usedRooms.add(availableRoom._id.toString());

              // CRITICAL FIX: Create ONE entry per PE option (not per class)
              // PE sessions are class-wide - all students attend the SAME session
              // Using first class as representative, but this applies to ALL classes
              proposedEntries.push({
                classId: relevantClasses[0]._id,  // Representative class
                day: dayObj.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subject._id || subject,
                faculty: assignedFaculty,
                facultyName: faculties.find(f => f._id.toString() === assignedFaculty.toString())?.name || 'Unassigned',
                room: availableRoom._id,
                type: 'elective',
                year: relevantClasses[0].year,
                duration: 1,
                electiveGroup: groupName,
                electiveType: 'PE',
                batchName: 'ALL'  // Indicates this applies to all divisions
              });

              scheduledElectiveSubjectIds.add(sid);
            }

            // Commit entries if all options were scheduled successfully
            if (slotWorksForAll && proposedEntries.length > 0) {
              proposedEntries.forEach(entry => allGeneratedEntries.push(entry));
              slotsScheduled++;
              scheduledOnThisDay = true;
              usedDays.add(dayObj.name);
              console.log(`      ✅ Slot ${slotsScheduled}: ${dayObj.name} ${slot.startTime} (${proposedEntries.length} entries)`);
            }
          }
        }

        if (slotsScheduled < lecturesPerWeek) {
          console.warn(`      ⚠️  Only scheduled ${slotsScheduled}/${lecturesPerWeek} slots for ${groupName}`);
        } else {
          console.log(`      ✨ Scheduled all ${slotsScheduled} slots for ${groupName}`);
        }
      }
    }

    // ========================================
    // PHASE B: Schedule Open Electives (OE)
    // OE is scoped to: YEAR (across all departments)
    // ========================================
    console.log("\n📚 Phase B: Scheduling Open Electives (OE)...");

    // Group classes by Year only for OE
    const classesByYear = new Map();
    classes.forEach(cls => {
      if (!classesByYear.has(cls.year)) classesByYear.set(cls.year, []);
      classesByYear.get(cls.year).push(cls);
    });

    for (const [year, yearClasses] of classesByYear.entries()) {
      // Collect all OE elective groups from these classes
      const oeGroups = new Map(); // groupName -> { subjects[], lecturesPerWeek, classIds[] }

      yearClasses.forEach(cls => {
        // Check electiveGroups array (new model)
        if (cls.electiveGroups && cls.electiveGroups.length > 0) {
          cls.electiveGroups.forEach(eg => {
            if (eg.electiveType === 'OE') {
              if (!oeGroups.has(eg.groupName)) {
                oeGroups.set(eg.groupName, {
                  subjects: eg.subjects || [],
                  lecturesPerWeek: eg.lecturesPerWeek || 3,
                  classIds: new Set()
                });
              }
              oeGroups.get(eg.groupName).classIds.add(cls._id.toString());
            }
          });
        }

        // Also check lectureSubjects for backward compatibility
        cls.lectureSubjects?.forEach(ls => {
          if (ls.subject?.isElective && ls.subject?.electiveType === 'OE' && ls.subject?.electiveGroup) {
            const groupName = ls.subject.electiveGroup;
            if (!oeGroups.has(groupName)) {
              oeGroups.set(groupName, {
                subjects: [],
                lecturesPerWeek: ls.lecturesPerWeek || 3,
                classIds: new Set()
              });
            }
            const group = oeGroups.get(groupName);
            if (!group.subjects.some(s => s._id?.toString() === ls.subject._id.toString())) {
              group.subjects.push(ls.subject);
            }
            group.classIds.add(cls._id.toString());
            scheduledElectiveSubjectIds.add(ls.subject._id.toString());
          }
        });
      });

      if (oeGroups.size === 0) {
        console.log(`   ℹ️  No OE groups for Year ${year} - skipping`);
        continue;
      }

      console.log(`\n🎯 Processing OE for Year: ${year} (all departments)`);
      console.log(`   Found ${oeGroups.size} OE group(s), ${yearClasses.length} classes total`);

      // Schedule each OE group (same logic as PE, but includes all classes in the year)
      for (const [groupName, groupData] of oeGroups.entries()) {
        const { subjects, lecturesPerWeek, classIds } = groupData;
        const classIdsArray = Array.from(classIds);
        const relevantClasses = yearClasses.filter(c => classIdsArray.includes(c._id.toString()));

        console.log(`   📌 Group "${groupName}": ${subjects.length} options, ${lecturesPerWeek} slots/week`);

        if (subjects.length === 0) {
          console.log(`      ⚠️  No subjects in group - skipping`);
          continue;
        }

        let slotsScheduled = 0;
        const days = normalizedTimeSlots.days;
        const usedDays = new Set(); // Track which days already have an OE slot for this group

        for (const dayObj of days) {
          if (slotsScheduled >= lecturesPerWeek) break;
          if (usedDays.has(dayObj.name)) continue; // Skip if already scheduled on this day

          const slots = dayObj.slots.filter(s => s.type !== 'break');
          let scheduledOnThisDay = false;

          for (const slot of slots) {
            if (slotsScheduled >= lecturesPerWeek) break;
            if (scheduledOnThisDay) break; // Only ONE slot per day for OE (distribution)

            // Check if ALL classes across all departments are free at this slot
            const allClassesFree = relevantClasses.every(cls =>
              !allGeneratedEntries.some(entry =>
                entry.classId.toString() === cls._id.toString() &&
                entry.day === dayObj.name &&
                overlaps(entry.startTime, entry.endTime, slot.startTime, slot.endTime)
              )
            );

            if (!allClassesFree) continue;

            const proposedEntries = [];
            const usedFaculties = new Set();
            const usedRooms = new Set();
            let slotWorksForAll = true;

            for (const subject of subjects) {
              const sid = subject._id?.toString() || subject.toString();

              const facultyCandidates = subjectToFacultyCandidates.get(sid) || [];
              let assignedFaculty = null;

              for (const facId of facultyCandidates) {
                const facIdStr = facId.toString();
                if (usedFaculties.has(facIdStr)) continue;

                const faculty = faculties.find(f => f._id.toString() === facIdStr);
                if (!faculty) continue;

                const facultyConflict = allGeneratedEntries.some(e =>
                  e.faculty &&
                  e.faculty.toString() === facIdStr &&
                  e.day === dayObj.name &&
                  overlaps(e.startTime, e.endTime, slot.startTime, slot.endTime)
                );

                if (!facultyConflict) {
                  assignedFaculty = facId;
                  usedFaculties.add(facIdStr);
                  break;
                }
              }

              if (!assignedFaculty) {
                console.log(`      ⚠️  No faculty for "${subject.name || sid}" at ${dayObj.name} ${slot.startTime}`);
                slotWorksForAll = false;
                break;
              }

              const availableRoom = rooms.find(r => {
                if (r.type !== 'lecture') return false;
                if (usedRooms.has(r._id.toString())) return false;
                return !allGeneratedEntries.some(e =>
                  e.room &&
                  e.room.toString() === r._id.toString() &&
                  e.day === dayObj.name &&
                  overlaps(e.startTime, e.endTime, slot.startTime, slot.endTime)
                );
              });

              if (!availableRoom) {
                console.log(`      ⚠️  No room for "${subject.name || sid}" at ${dayObj.name} ${slot.startTime}`);
                slotWorksForAll = false;
                break;
              }

              usedRooms.add(availableRoom._id.toString());

              // CRITICAL FIX: Create ONE entry per OE option (not per class)
              // OE sessions are year-wide - all students attend the SAME session  
              // Using first class as representative, but this applies to ALL classes
              proposedEntries.push({
                classId: relevantClasses[0]._id,  // Representative class
                day: dayObj.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subject._id || subject,
                faculty: assignedFaculty,
                facultyName: faculties.find(f => f._id.toString() === assignedFaculty.toString())?.name || 'Unassigned',
                room: availableRoom._id,
                type: 'elective',
                year: relevantClasses[0].year,
                duration: 1,
                electiveGroup: groupName,
                electiveType: 'OE',
                batchName: 'ALL'  // Indicates this applies to all divisions/departments
              });

              scheduledElectiveSubjectIds.add(sid);
            }

            if (slotWorksForAll && proposedEntries.length > 0) {
              proposedEntries.forEach(entry => allGeneratedEntries.push(entry));
              slotsScheduled++;
              scheduledOnThisDay = true;
              usedDays.add(dayObj.name);
              console.log(`      ✅ Slot ${slotsScheduled}: ${dayObj.name} ${slot.startTime} (${proposedEntries.length} entries)`);
            }
          }
        }

        if (slotsScheduled < lecturesPerWeek) {
          console.warn(`      ⚠️  Only scheduled ${slotsScheduled}/${lecturesPerWeek} slots for ${groupName}`);
        } else {
          console.log(`      ✨ Scheduled all ${slotsScheduled} slots for ${groupName}`);
        }
      }
    }

    console.log(`\n✅ Elective scheduling complete. Pre-scheduled ${scheduledElectiveSubjectIds.size} elective subjects.`);
    return scheduledElectiveSubjectIds;
  } catch (err) {
    console.error("❌ CRITICAL ERROR in scheduleSynchronizedElectives:", err);
    return new Set();
  }
}

export const generateAndSaveTimetable = async (req, res) => {
  try {
    console.log("🚀 START: generateAndSaveTimetable CALLED");
    const { classId: paramClassId, timetableSchemaId: paramTimetableSchemaId } =
      req.params;
    const { timetableSchemaId: bodyTimetableSchemaId } = req.body || {};
    let effectiveTimetableSchemaId =
      paramTimetableSchemaId || bodyTimetableSchemaId;

    let timetableSchema;
    if (effectiveTimetableSchemaId) {
      timetableSchema = await TimetableSchema.findById(
        effectiveTimetableSchemaId
      );
      if (!timetableSchema)
        return res.status(404).json({ message: "Timetable schema not found." });
    } else {
      timetableSchema = await TimetableSchema.findOne();
      if (!timetableSchema)
        return res.status(400).json({ message: "No timetable schema found." });
      effectiveTimetableSchemaId = timetableSchema._id;
    }

    let classesToProcess;
    if (paramClassId) {
      const specificClass = await Class.findById(paramClassId)
        .populate("lectureSubjects.subject")
        .populate("batches.subjects.subject")
        .populate("electiveGroups.subjects");
      if (!specificClass)
        return res.status(404).json({ message: "Class not found." });
      classesToProcess = [specificClass];
    } else {
      classesToProcess = await Class.find()
        .populate("lectureSubjects.subject")
        .populate("batches.subjects.subject")
        .populate("electiveGroups.subjects");
    }

    const faculties = await Faculty.find().populate("subjects");
    const rooms = await Room.find();

    // subject -> faculty candidates
    const subjectToFacultyCandidates = new Map();
    faculties.forEach((f) => {
      f.subjects.forEach((s) => {
        const key = s._id.toString();
        if (!subjectToFacultyCandidates.has(key))
          subjectToFacultyCandidates.set(key, []);
        subjectToFacultyCandidates.get(key).push(f._id);
      });
    });

    const missingCoverage = validateFacultyCoverage(
      subjectToFacultyCandidates,
      classesToProcess
    );
    if (missingCoverage.length > 0) {
      return res.status(400).json({
        message: "Some subjects have no assigned faculty.",
        missing: missingCoverage,
      });
    }

    const normalizedTimeSlots = {
      days: timetableSchema.days.map((dayName) => ({
        name: dayName,
        slots: timetableSchema.slots,
      })),
    };

    // faculty id -> name map (used later to ensure facultyName exists)
    const facultyIdNameMap = new Map(
      faculties.map((f) => [f._id.toString(), f.name])
    );

    // accumulate final generated entries (flat array)
    let allGeneratedEntries = [];

    // Track faculty workload: how many classes assigned per subject per faculty
    // Key: "${subjectId}-${facultyId}", Value: number of classes
    const globalFacultyWorkload = new Map();

    // NEW: Phase 1 - Schedule Synchronized PE Subjects common to Years
    console.log("⏳ Phase 1: Scheduling Synchronized Professional Electives...");
    const scheduledPESubjectIds = await scheduleSynchronizedElectives(
      classesToProcess,
      faculties,
      rooms,
      normalizedTimeSlots,
      subjectToFacultyCandidates,
      globalFacultyWorkload,
      allGeneratedEntries
    );
    console.log(`✅ Phase 1 Complete. Pre-scheduled PEs: ${scheduledPESubjectIds.size}`);


    // Progress tracking
    const totalClasses = classesToProcess.length;
    console.log(`\n🎯 Starting timetable generation for ${totalClasses} class${totalClasses > 1 ? 'es' : ''}...\n`);

    // FAIRNESS FIX: Randomize class order to give all classes equal chance
    // Without this, the last class always gets the worst remaining slots
    const shuffledClasses = [...classesToProcess].sort(() => Math.random() - 0.5);
    console.log(`🔀 Generation order: ${shuffledClasses.map(c => c.name).join(' → ')}\n`);

    for (let classIndex = 0; classIndex < shuffledClasses.length; classIndex++) {
      const cls = shuffledClasses[classIndex];
      // ------------------------
      // NEW: choose a single faculty per lecture subject for THIS class
      // ------------------------
      // Build a map subjectId -> chosenFacultyId (if we can choose one)
      const subjectFacultyAssignment = new Map();

      // helper chooses one faculty id (ObjectId) from candidate list for the subject
      // Heuristic: prefer faculties whose total availability slots >= timesRequired.
      // If none fully capable, pick the one with highest total available slots.
      // FALLBACK: If all faculty are at capacity, allow sharing (pick least loaded)
      function chooseFacultyForSubject(subjectIdStr, timesRequired) {
        const candidates = subjectToFacultyCandidates.get(subjectIdStr) || [];
        if (!candidates || candidates.length === 0) return null;

        let bestCand = null;
        let bestRemainingCapacity = -Infinity;
        let fallbackCand = null;
        let fallbackBestAvailability = -1;

        for (const candId of candidates) {
          const fac = faculties.find(
            (f) => f._id.toString() === candId.toString()
          );
          if (!fac) continue;

          // Calculate total availability
          let totalAvailable = 0;
          if (Array.isArray(fac.availability)) {
            for (const a of fac.availability) {
              if (Array.isArray(a.slots)) totalAvailable += a.slots.length;
            }
          }

          // Get current workload (how many classes already assigned for this subject)
          const workloadKey = `${subjectIdStr}-${candId.toString()}`;
          const classesAssigned = globalFacultyWorkload.get(workloadKey) || 0;

          // Calculate remaining capacity
          // Assuming each class uses timesRequired slots per week
          const usedSlots = classesAssigned * timesRequired;
          const remainingCapacity = totalAvailable - usedSlots;

          // Track best candidate with remaining capacity
          if (remainingCapacity >= timesRequired) {
            if (remainingCapacity > bestRemainingCapacity) {
              bestRemainingCapacity = remainingCapacity;
              bestCand = candId;
            }
          }

          // FALLBACK: Track candidate with highest total availability (for sharing)
          if (totalAvailable > fallbackBestAvailability) {
            fallbackBestAvailability = totalAvailable;
            fallbackCand = candId;
          }
        }

        // Return best candidate if found, otherwise fall back to sharing
        if (bestCand) {
          return bestCand;
        } else if (fallbackCand) {
          console.log(`   ⚠️ Faculty sharing: Using shared faculty for subject ${subjectIdStr} (no unique faculty available)`);
          return fallbackCand;
        }
        return null;
      }

      // Collect times required per subject for class-level lectures
      cls.lectureSubjects.forEach((ls) => {
        const subject = ls.subject;
        const times = ls.lecturesPerWeek || 0;
        if (!subject || !subject._id) return;
        const sidStr = subject._id.toString();

        // NEW: SKIP IF PE (Already scheduled)
        if (scheduledPESubjectIds.has(sidStr)) return;

        // Only choose if there are >0 lectures to schedule
        if (times > 0 && !subjectFacultyAssignment.has(sidStr)) {
          const chosen = chooseFacultyForSubject(sidStr, times);
          if (chosen) {
            subjectFacultyAssignment.set(sidStr, chosen);

            // Update global workload tracker
            const workloadKey = `${sidStr}-${chosen.toString()}`;
            globalFacultyWorkload.set(
              workloadKey,
              (globalFacultyWorkload.get(workloadKey) || 0) + 1
            );
          }
        }
      });

      // Also consider batch-level non-lab subjects treated as lectures
      cls.batches.forEach((batch) => {
        batch.subjects.forEach((bs) => {
          const subject = bs.subject;
          const times = bs.lecturesPerWeek || 0;
          if (!subject || !subject._id) return;
          if (subject.type !== "lab" && times > 0) {
            const sidStr = subject._id.toString();
            if (!subjectFacultyAssignment.has(sidStr)) {
              const chosen = chooseFacultyForSubject(sidStr, times);
              if (chosen) {
                subjectFacultyAssignment.set(sidStr, chosen);

                // Update global workload tracker
                const workloadKey = `${sidStr}-${chosen.toString()}`;
                globalFacultyWorkload.set(
                  workloadKey,
                  (globalFacultyWorkload.get(workloadKey) || 0) + 1
                );
              }
            }
          }
        });
      });

      // ------------------------
      // Build unique tasks (lectures and individual labs) and composite pairs per class
      // ------------------------
      const uniqueLectureTasks = new Map();
      const uniqueIndividualLabTasks = new Map();

      // lectures (class-level)
      cls.lectureSubjects.forEach((ls) => {
        const subject = ls.subject;
        const times = ls.lecturesPerWeek || 0;

        // NEW: SKIP IF PE (Already scheduled)
        if (subject && scheduledPESubjectIds.has(subject._id.toString())) return;

        for (let i = 0; i < times; i++) {
          const id = `${cls._id}-${subject._id}-lecture-${i}`;
          if (!uniqueLectureTasks.has(id)) {
            const sidStr = subject._id.toString();
            // If we chose a faculty for this subject/class, restrict candidates to that faculty only
            const chosenFaculty = subjectFacultyAssignment.get(sidStr);
            uniqueLectureTasks.set(id, {
              id,
              type: "lecture",
              classId: cls._id,
              batchName: cls.name,
              subjectId: subject._id,
              subjectName: subject.name,
              facultyCandidates: chosenFaculty
                ? [chosenFaculty]
                : subjectToFacultyCandidates.get(sidStr) || [],
              year: cls.year,
              duration: 1,
              timetableSchemaRef: effectiveTimetableSchemaId,
            });
          }
        }
      });

      // batch-level (labs and other)
      cls.batches.forEach((batch) => {
        batch.subjects.forEach((bs) => {
          const subject = bs.subject;
          const times = bs.lecturesPerWeek || 0;
          if (subject.type === "lab") {
            for (let i = 0; i < times; i++) {
              const id = `${cls._id}-${batch.name}-${subject._id}-lab-${i}`;
              if (!uniqueIndividualLabTasks.has(id)) {
                uniqueIndividualLabTasks.set(id, {
                  id,
                  type: "lab",
                  classId: cls._id,
                  batchName: batch.name,
                  subjectId: subject._id,
                  subjectName: subject.name,
                  facultyCandidates:
                    subjectToFacultyCandidates.get(subject._id.toString()) ||
                    [],
                  year: cls.year,
                  duration: 2,
                  timetableSchemaRef: effectiveTimetableSchemaId,
                });
              }
            }
          } else {
            // treat as batch-level lecture
            for (let i = 0; i < times; i++) {
              const id = `${cls._id}-${batch.name}-${subject._id}-lec-${i}`;
              if (!uniqueLectureTasks.has(id)) {
                const sidStr = subject._id.toString();
                const chosenFaculty = subjectFacultyAssignment.get(sidStr);
                uniqueLectureTasks.set(id, {
                  id,
                  type: "lecture",
                  classId: cls._id,
                  batchName: batch.name,
                  subjectId: subject._id,
                  subjectName: subject.name,
                  facultyCandidates: chosenFaculty
                    ? [chosenFaculty]
                    : subjectToFacultyCandidates.get(sidStr) || [],
                  year: cls.year,
                  duration: 1,
                  timetableSchemaRef: effectiveTimetableSchemaId,
                });
              }
            }
          }
        });
      });

      // pair labs into composite_lab_pair when possible (same class, different batch, DIFFERENT subjects)
      const individualLabTasksArray = Array.from(
        uniqueIndividualLabTasks.values()
      );
      const pairedIds = new Set();
      const compositeTasks = [];

      for (let i = 0; i < individualLabTasksArray.length; i++) {
        const l1 = individualLabTasksArray[i];
        if (pairedIds.has(l1.id)) continue;

        // find matching: same class, different batch, DIFFERENT subject
        const matchIndex = individualLabTasksArray.findIndex(
          (l2, idx) =>
            idx !== i &&
            !pairedIds.has(l2.id) &&
            l2.classId.toString() === l1.classId.toString() &&
            l2.batchName !== l1.batchName &&
            l2.subjectId.toString() !== l1.subjectId.toString() // KEY CHANGE: different subjects
        );
        if (matchIndex !== -1) {
          const l2 = individualLabTasksArray[matchIndex];
          pairedIds.add(l1.id);
          pairedIds.add(l2.id);
          compositeTasks.push({
            id: `composite-${l1.id}-${l2.id}`,
            type: "composite_lab_pair",
            classId: l1.classId,
            year: l1.year,
            subjectName: `${l1.subjectName} & ${l2.subjectName}`,
            labTasks: [
              { ...l1, duration: 2 },
              { ...l2, duration: 2 },
            ],
            duration: 2,
            timetableSchemaRef: effectiveTimetableSchemaId,
          });
        }
      }

      // leftover unpaired labs
      const leftoverLabs = individualLabTasksArray.filter(
        (l) => !pairedIds.has(l.id)
      );

      // final tasks list for class
      const finalTasksForClass = [
        ...Array.from(uniqueLectureTasks.values()),
        ...compositeTasks,
        ...leftoverLabs,
      ];

      // sort heuristic: composite first, then labs, then lectures
      finalTasksForClass.sort((a, b) => {
        const score = (t) =>
          t.type === "composite_lab_pair" ? 0 : t.type === "lab" ? 1 : 2;
        return score(a) - score(b);
      });

      // Progress logging
      console.log(`⏳ [${classIndex + 1}/${totalClasses}] Generating timetable for "${cls.name}" (${cls.year})...`);
      const classStartTime = Date.now();

      // Solve for this class (pass already-scheduled global entries for conflict checking)
      const classSolution = await solveTimetableRecursiveOptimized(
        finalTasksForClass,
        faculties,
        rooms,
        normalizedTimeSlots,
        allGeneratedEntries // current global timetable to avoid cross-class conflicts
      );

      if (!classSolution) {
        // fail: cannot generate for this class
        console.error(`❌ Failed to generate timetable for class ${cls.name}`);
        return res.status(500).json({
          message: `Could not generate a valid timetable for class ${cls.name}. Check constraints/resources.`,
        });
      }

      const classElapsed = ((Date.now() - classStartTime) / 1000).toFixed(2);
      console.log(`✅ [${classIndex + 1}/${totalClasses}] Successfully generated "${cls.name}" in ${classElapsed}s\n`);

      // ensure facultyName exists for each entry (use map fallback)
      const normalizedSolution = classSolution.map((e) => ({
        ...e,
        facultyName: e.faculty
          ? facultyIdNameMap.get(e.faculty.toString()) || "Unassigned"
          : "Unassigned",
      }));

      // append into global result
      allGeneratedEntries = allGeneratedEntries.concat(normalizedSolution);
    }
    // end for each class

    // Final summary
    console.log(`\n✨ Successfully generated timetables for all ${totalClasses} classes!\n`);

    // Deduplicate final flat array before saving
    const dedupeMap = new Map();
    for (const e of allGeneratedEntries) {
      // key: class + batch(optional) + day + start + subject + type
      const key = `${e.classId?.toString() || ""}::${e.batchName || ""}::${e.day
        }::${e.startTime}::${e.subject?.toString() || ""}::${e.type}`;
      if (!dedupeMap.has(key)) dedupeMap.set(key, e);
      // else: duplicate - skip
    }
    const toInsert = Array.from(dedupeMap.values());

    if (toInsert.length === 0) {
      return res
        .status(500)
        .json({ message: "No timetable entries generated to insert." });
    }

    // Delete old entries for this timetable schema (and class if param present)
    const deletionQuery = { timetableSchemaRef: effectiveTimetableSchemaId };
    if (paramClassId) deletionQuery.classId = paramClassId;
    await GeneratedTimetableEntry.deleteMany(deletionQuery);

    // Ensure every object to insert satisfies schema is shaped correctly
    const preparedInsert = toInsert.map((e) => ({
      classId: e.classId,
      batchName: e.batchName || undefined,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      subject: e.subject,
      faculty: e.faculty || null,
      facultyName:
        e.facultyName ||
        (e.faculty
          ? facultyIdNameMap.get(e.faculty.toString()) || "Unassigned"
          : "Unassigned"),
      room: e.room,
      type: e.type,
      year: e.year,
      duration: e.duration || 1,
      electiveGroup: e.electiveGroup || null,
      electiveType: e.electiveType || null,
      timetableSchemaRef: e.timetableSchemaRef || effectiveTimetableSchemaId,
    }));

    // Insert
    const savedEntries = await GeneratedTimetableEntry.insertMany(
      preparedInsert
    );

    // Build response (ensure facultyName present)
    const responseTimetable = savedEntries.map((s) => {
      const obj = s.toObject ? s.toObject() : s;
      return {
        ...obj,
        facultyName:
          obj.facultyName ||
          (obj.faculty
            ? facultyIdNameMap.get(obj.faculty.toString()) || "Unassigned"
            : "Unassigned"),
      };
    });

    return res.status(200).json({
      message: "Timetable generated and saved successfully!",
      timetable: responseTimetable,
    });
  } catch (err) {
    console.error("Error generating timetable:", err);

    // Check if it's a timeout error
    if (err.message && err.message.includes("timeout")) {
      return res.status(408).json({
        message: err.message,
        error: "Generation took too long. Consider reducing the number of classes or simplifying constraints.",
      });
    }

    return res.status(500).json({
      message: "Internal server error during timetable generation",
      error: err.message,
    });
  }
};
