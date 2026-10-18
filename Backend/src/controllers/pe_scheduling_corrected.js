// CORRECTED PE Scheduling Function
// Replace lines 934-1100 in generatetimetable.js with this

// Function to schedule Synchronized Professional Electives (PE)
// CONCEPT: All PE subjects for a year run at THE SAME TIME as OPTIONS
// Example: Monday 10AM - ML in Room 101, DIP in Room 102 (students choose)
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
        console.log("\n🔍 DEBUG: scheduleSynchronizedElectives called");

        const classesByYear = new Map();
        classes.forEach((cls) => {
            if (!classesByYear.has(cls.year)) classesByYear.set(cls.year, []);
            classesByYear.get(cls.year).push(cls);
        });

        const scheduledPESubjectIds = new Set();

        for (const [year, yearClasses] of classesByYear.entries()) {
            console.log(`\n📅 Year: "${year}" with ${yearClasses.length} divisions`);

            // Collect ALL UNIQUE PE subjects (these are the OPTIONS)
            const yearPESubjectsMap = new Map();

            yearClasses.forEach((cls) => {
                cls.lectureSubjects.forEach((ls) => {
                    if (ls.subject && ls.subject.isElective && ls.subject.electiveType === "PE") {
                        const sid = ls.subject._id.toString();

                        if (!yearPESubjectsMap.has(sid)) {
                            yearPESubjectsMap.set(sid, {
                                subject: ls.subject,
                                maxLecturesPerWeek: ls.lecturesPerWeek
                            });
                        } else {
                            const existing = yearPESubjectsMap.get(sid);
                            existing.maxLecturesPerWeek = Math.max(existing.maxLecturesPerWeek, ls.lecturesPerWeek);
                        }

                        scheduledPESubjectIds.add(sid);
                    }
                });
            });

            if (yearPESubjectsMap.size === 0) {
                console.log(`   ℹ️  No PE subjects - skipping`);
                continue;
            }

            const peSubjectsArray = Array.from(yearPESubjectsMap.values());
            console.log(`\n🔄 Found ${peSubjectsArray.length} PE subjects as OPTIONS:`);
            peSubjectsArray.forEach(pe => console.log(`   - ${pe.subject.name} (${pe.maxLecturesPerWeek}/week)`));

            const maxLecturesNeeded = Math.max(...peSubjectsArray.map(pe => pe.maxLecturesPerWeek));
            console.log(`\n   📍 Need ${maxLecturesNeeded} slots with ALL ${peSubjectsArray.length} PEs in PARALLEL`);

            let slotsScheduled = 0;
            const days = normalizedTimeSlots.days;

            for (const dayObj of days) {
                if (slotsScheduled >= maxLecturesNeeded) break;

                const slots = dayObj.slots.filter(s => s.type !== "break");

                for (const slot of slots) {
                    if (slotsScheduled >= maxLecturesNeeded) break;

                    console.log(`\n   🔍 Trying: ${dayObj.name} ${slot.startTime}`);

                    const proposedEntries = [];
                    let slotWorksForAll = true;
                    const usedFaculties = new Set();
                    const usedRooms = new Set();

                    // Schedule EACH PE subject at this time
                    for (const peInfo of peSubjectsArray) {
                        const subject = peInfo.subject;
                        const sid = subject._id.toString();

                        const alreadyScheduled = allGeneratedEntries.filter(e =>
                            e.subject.toString() === sid
                        ).length;

                        if (alreadyScheduled >= peInfo.maxLecturesPerWeek) {
                            console.log(`      ✓ ${subject.name} complete (${alreadyScheduled}/${peInfo.maxLecturesPerWeek})`);
                            continue;
                        }

                        const facultyCandidates = subjectToFacultyCandidates.get(sid) || [];

                        if (facultyCandidates.length === 0) {
                            console.log(`      ❌ No faculty for "${subject.name}"`);
                            slotWorksForAll = false;
                            break;
                        }

                        let assignedFaculty = null;

                        for (const facId of facultyCandidates) {
                            if (usedFaculties.has(facId.toString())) continue;

                            const facultyConflict = allGeneratedEntries.some(e =>
                                e.faculty &&
                                e.faculty.toString() === facId.toString() &&
                                e.day === dayObj.name &&
                                e.startTime === slot.startTime
                            );

                            if (!facultyConflict) {
                                assignedFaculty = facId;
                                usedFaculties.add(facId.toString());
                                const facName = faculties.find(f => f._id.toString() === facId.toString())?.name;
                                console.log(`      ✓ ${subject.name} -> ${facName}`);
                                break;
                            }
                        }

                        if (!assignedFaculty) {
                            console.log(`      ❌ No available faculty for "${subject.name}"`);
                            slotWorksForAll = false;
                            break;
                        }

                        const availableRoom = rooms.find(r => {
                            if (r.type !== "lecture") return false;
                            if (usedRooms.has(r._id.toString())) return false;

                            return !allGeneratedEntries.some(e =>
                                e.room &&
                                e.room.toString() === r._id.toString() &&
                                e.day === dayObj.name &&
                                e.startTime === slot.startTime
                            );
                        });

                        if (!availableRoom) {
                            console.log(`      ❌ No room for "${subject.name}"`);
                            slotWorksForAll = false;
                            break;
                        }

                        usedRooms.add(availableRoom._id.toString());

                        proposedEntries.push({
                            classId: yearClasses[0]._id,
                            day: dayObj.name,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            subject: subject._id,
                            faculty: assignedFaculty,
                            facultyName: faculties.find(f => f._id.toString() === assignedFaculty.toString())?.name || "Unassigned",
                            room: availableRoom._id,
                            type: "lecture",
                            year: year,
                            duration: 1,
                        });
                    }

                    if (slotWorksForAll && proposedEntries.length > 0) {
                        proposedEntries.forEach(entry => allGeneratedEntries.push(entry));
                        slotsScheduled++;
                        console.log(`   ✅ PE slot ${slotsScheduled}: ${dayObj.name} ${slot.startTime} (${proposedEntries.length} subjects)`);
                    }
                }
            }

            if (slotsScheduled < maxLecturesNeeded) {
                console.warn(`   ⚠️  Only ${slotsScheduled}/${maxLecturesNeeded} PE slots scheduled`);
            } else {
                console.log(`   ✨ All ${slotsScheduled} PE slots scheduled successfully`);
            }
        }

        return scheduledPESubjectIds;
    } catch (err) {
        console.error("❌ ERROR in scheduleSynchronizedElectives:", err);
        return new Set();
    }
}
