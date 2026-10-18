import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../../axiosConfig.js";

const AddEditClassModal = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");

  // State for batches, including default empty batches for new class creation
  const [batches, setBatches] = useState([
    { name: "", subjects: [] },
    { name: "", subjects: [] },
  ]);

  // State for lecture subjects, storing objects { subjectId, lecturesPerWeek }
  const [lectureSubjects, setLectureSubjects] = useState([]);

  // State for elective groups (PE/OE)
  const [electiveGroups, setElectiveGroups] = useState([]);

  const [formError, setFormError] = useState(null);

  // States for fetching and filtering available subjects
  const [allSubjects, setAllSubjects] = useState([]); // All subjects fetched from API
  const [labSubjects, setLabSubjects] = useState([]); // Filtered lab subjects
  const [lectureSubjectsAvailable, setLectureSubjectsAvailable] = useState([]); // Filtered lecture subjects
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  // Effect to fetch all available subjects when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchAllSubjects = async () => {
        try {
          setSubjectsLoading(true);
          setSubjectsError(null);
          // Ensure this endpoint correctly returns all subjects
          const res = await axios.get("/api/subject/");
          setAllSubjects(res.data);
          setLabSubjects(res.data.filter((sub) => sub.type === "lab"));
          setLectureSubjectsAvailable(
            res.data.filter((sub) => sub.type === "lecture")
          );
        } catch (err) {
          setSubjectsError(
            err.response?.data?.message || "Failed to fetch subjects."
          );
          console.error("Error fetching subjects:", err);
        } finally {
          setSubjectsLoading(false);
        }
      };
      fetchAllSubjects();
    }
  }, [isOpen]); // Depend on isOpen to fetch subjects only when modal is active

  // Get elective subjects for dropdown
  const electiveSubjects = allSubjects.filter(sub => sub.isElective);

  // Effect to populate form fields when initialData (for editing) changes or modal opens/closes
  useEffect(() => {
    if (initialData) {
      // Populating for editing an existing class
      setName(initialData.name || "");
      setYear(initialData.year || "");
      setDepartment(initialData.department || "");

      // Map populated batch subjects (which are objects {subject: populated_doc, lecturesPerWeek})
      // to {subject: _id, lecturesPerWeek} for the form state.
      setBatches(
        initialData.batches && Array.isArray(initialData.batches)
          ? initialData.batches.map((batch) => ({
            name: batch.name || "",
            subjects:
              batch.subjects && Array.isArray(batch.subjects)
                ? batch.subjects.map((subEntry) => ({
                  subject: subEntry.subject ? subEntry.subject._id : "", // Store only ID
                  lecturesPerWeek: subEntry.lecturesPerWeek || 1,
                }))
                : [],
          }))
          : [
            { name: "", subjects: [] },
            { name: "", subjects: [] },
          ] // Default 2 empty if none
      );

      // Map populated lecture subjects similarly
      setLectureSubjects(
        initialData.lectureSubjects &&
          Array.isArray(initialData.lectureSubjects)
          ? initialData.lectureSubjects.map((subEntry) => ({
            subject: subEntry.subject ? subEntry.subject._id : "", // Store only ID
            lecturesPerWeek: subEntry.lecturesPerWeek || 1,
          }))
          : []
      );

      // Map elective groups
      setElectiveGroups(
        initialData.electiveGroups && Array.isArray(initialData.electiveGroups)
          ? initialData.electiveGroups.map((eg) => ({
            groupName: eg.groupName || "",
            electiveType: eg.electiveType || "PE",
            lecturesPerWeek: eg.lecturesPerWeek || 3,
            subjects: eg.subjects ? eg.subjects.map(s => s._id || s) : [],
          }))
          : []
      );
    } else {
      // Reset form for adding a new class
      setName("");
      setYear("");
      setDepartment("");
      setBatches([
        { name: "", subjects: [] },
        { name: "", subjects: [] },
      ]); // Default 2 empty batches
      setLectureSubjects([]); // Reset lecture subjects for new class
      setElectiveGroups([]); // Reset elective groups
    }
    setFormError(null); // Clear any previous form errors when modal opens/changes mode
  }, [initialData]); // Depend on initialData to re-populate when editing a different class

  // Handlers for basic class info
  const handleNameChange = (e) => setName(e.target.value);
  const handleYearChange = (e) => setYear(e.target.value);
  const handleDepartmentChange = (e) => setDepartment(e.target.value);

  // --- Batch Management Functions ---
  const handleAddBatch = () => {
    setBatches([...batches, { name: "", subjects: [] }]);
  };

  const handleRemoveBatch = (index) => {
    const newBatches = batches.filter((_, i) => i !== index);
    setBatches(newBatches);
  };

  const handleBatchNameChange = (index, value) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], name: value };
    setBatches(newBatches);
  };

  const handleBatchSubjectChange = (
    batchIndex,
    subjectId, // This is the string ID of the subject
    lecturesPerWeekInput
  ) => {
    const newBatches = [...batches];
    const currentSubjects = newBatches[batchIndex].subjects;
    const lecturesPerWeek = parseInt(lecturesPerWeekInput, 10); // Parse input to integer

    const existingSubjectIndex = currentSubjects.findIndex(
      (sub) => sub.subject === subjectId
    );

    if (existingSubjectIndex !== -1) {
      // If subject already exists in the batch, update its lecturesPerWeek or remove if 0/invalid
      if (lecturesPerWeek > 0) {
        currentSubjects[existingSubjectIndex] = {
          ...currentSubjects[existingSubjectIndex],
          lecturesPerWeek: lecturesPerWeek,
        };
      } else {
        // If lecturesPerWeek is 0 or invalid (e.g., NaN), remove the subject from the batch
        newBatches[batchIndex].subjects = currentSubjects.filter(
          (sub) => sub.subject !== subjectId
        );
      }
    } else {
      // If subject is new to the batch, add it only if lecturesPerWeek is valid (> 0)
      if (lecturesPerWeek > 0) {
        newBatches[batchIndex].subjects = [
          ...currentSubjects,
          { subject: subjectId, lecturesPerWeek: lecturesPerWeek },
        ];
      }
    }
    setBatches(newBatches);
  };

  // --- Lecture Subject Management Functions ---
  const handleAddLectureSubjectField = () => {
    setLectureSubjects([
      ...lectureSubjects,
      { subject: "", lecturesPerWeek: 1 }, // Add empty object for new selection with default lecturesPerWeek
    ]);
  };

  const handleRemoveLectureSubjectField = (index) => {
    const newLectureSubjects = lectureSubjects.filter((_, i) => i !== index);
    setLectureSubjects(newLectureSubjects);
  };

  const handleLectureSubjectChange = (index, field, value) => {
    const newLectureSubjects = [...lectureSubjects];
    if (field === "lecturesPerWeek") {
      // Parse lecturesPerWeek to integer, default to 1 if invalid
      newLectureSubjects[index][field] = parseInt(value, 10) || 1;
    } else {
      // 'subject' field: store the subject ID directly
      newLectureSubjects[index][field] = value;
    }
    setLectureSubjects(newLectureSubjects);
  };

  // --- Elective Groups Management Functions ---
  const handleAddElectiveGroup = () => {
    setElectiveGroups([
      ...electiveGroups,
      { groupName: "", electiveType: "PE", lecturesPerWeek: 3, subjects: [] },
    ]);
  };

  const handleRemoveElectiveGroup = (index) => {
    setElectiveGroups(electiveGroups.filter((_, i) => i !== index));
  };

  const handleElectiveGroupChange = (index, field, value) => {
    const newGroups = [...electiveGroups];
    if (field === "lecturesPerWeek") {
      newGroups[index][field] = parseInt(value, 10) || 3;
    } else if (field === "subjects") {
      // Handle multi-select for subjects
      newGroups[index][field] = value;
    } else {
      newGroups[index][field] = value;
    }
    setElectiveGroups(newGroups);
  };

  const handleElectiveSubjectToggle = (groupIndex, subjectId) => {
    const newGroups = [...electiveGroups];
    const currentSubjects = newGroups[groupIndex].subjects;
    if (currentSubjects.includes(subjectId)) {
      newGroups[groupIndex].subjects = currentSubjects.filter(id => id !== subjectId);
    } else {
      newGroups[groupIndex].subjects = [...currentSubjects, subjectId];
    }
    setElectiveGroups(newGroups);
  };

  // --- Form Submission Logic ---
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setFormError(null); // Clear previous errors

      try {
        // Basic validation for class name and year
        if (!name.trim()) {
          throw new Error("Class Name is required.");
        }
        if (!year.trim()) {
          throw new Error("Year is required.");
        }

        // Validate and process Batches for backend submission
        const batchesToSend = batches
          .filter((batch) => batch.name.trim() !== "") // Filter out batches with empty names
          .map((batch) => {
            if (!batch.name.trim()) {
              // This case should ideally be caught by the filter, but good for explicit error
              throw new Error(
                "Batch name cannot be empty for any included batch."
              );
            }
            // Filter out subjects with empty IDs or invalid lecturesPerWeek from the batch
            const subjectsInBatch = batch.subjects.filter(
              (subEntry) =>
                subEntry.subject.trim() !== "" && subEntry.lecturesPerWeek > 0
            );

            // Ensure each non-empty batch has at least one valid subject
            if (subjectsInBatch.length === 0) {
              throw new Error(
                `Batch '${batch.name}' must have at least one lab subject selected with lectures per week greater than 0.`
              );
            }

            return {
              name: batch.name.trim(),
              subjects: subjectsInBatch,
            };
          });

        // Ensure at least one batch if batches section is relevant (e.g., not an empty array by default)
        if (
          batchesToSend.length === 0 &&
          batches.some((b) => b.name.trim() !== "")
        ) {
          throw new Error(
            "At least one batch with a name and subjects is required."
          );
        }

        // Validate and process Lecture Subjects for backend submission
        const lectureSubjectsToSend = lectureSubjects.filter(
          (subEntry) =>
            subEntry.subject.trim() !== "" && subEntry.lecturesPerWeek > 0
        );

        // Ensure at least one lecture subject is selected
        if (lectureSubjectsToSend.length === 0) {
          throw new Error(
            "At least one lecture subject with lectures per week greater than 0 is required."
          );
        }

        // Validate and process Elective Groups for backend submission
        const electiveGroupsToSend = electiveGroups
          .filter((eg) => eg.groupName.trim() !== "" && eg.subjects.length > 0)
          .map((eg) => ({
            groupName: eg.groupName.trim(),
            electiveType: eg.electiveType,
            lecturesPerWeek: eg.lecturesPerWeek || 3,
            subjects: eg.subjects,
          }));

        // Call the onSubmit prop with the prepared data
        onSubmit({
          name: name.trim(),
          year: year.trim(),
          department: department.trim() || null,
          batches: batchesToSend,
          lectureSubjects: lectureSubjectsToSend,
          electiveGroups: electiveGroupsToSend,
        });
      } catch (err) {
        setFormError(
          err.message ||
          "An unexpected error occurred. Please check your inputs."
        );
        console.error("Form processing error:", err);
      }
    },
    [name, year, department, batches, lectureSubjects, electiveGroups, onSubmit]
  ); // Dependencies for useCallback

  // If modal is not open, render nothing
  if (!isOpen) return null;

  // Framer Motion variants for modal animation
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-4 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close modal when clicking outside
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold rounded-full p-1"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">
          {initialData ? "Edit Class" : "Add New Class"}
        </h2>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
              role="alert"
            >
              <span className="block sm:inline">{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Class Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., BTech-A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              required
            />
          </div>

          {/* Year Selection */}
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year
            </label>
            <select
              id="year"
              name="year"
              value={year}
              onChange={handleYearChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
              required
            >
              <option value="">Select Year</option>
              <option value="FY">First Year (FY)</option>
              <option value="SY">Second Year (SY)</option>
              <option value="TY">Third Year (TY)</option>
              <option value="Final">Final Year</option>
            </select>
          </div>

          {/* Department Selection (for PE scoping) */}
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={department}
              onChange={handleDepartmentChange}
              placeholder="e.g., CSE, IT, ECE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for PE scheduling (PE is department + year specific)
            </p>
          </div>

          {/* Batches Section (Lab Subjects) */}
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
            <label className="block text-lg font-bold text-purple-700 mb-3">
              Batches (Lab Subjects)
            </label>
            {subjectsLoading ? (
              <p className="text-gray-600 mb-2">Loading subjects...</p>
            ) : subjectsError ? (
              <p className="text-red-500 mb-2">
                Error loading subjects: {subjectsError}
              </p>
            ) : labSubjects.length === 0 ? (
              <p className="text-gray-600 mb-2">
                No lab subjects available to select.
              </p>
            ) : (
              batches.map((batch, batchIndex) => (
                <div
                  key={batchIndex}
                  className="p-3 border border-gray-200 rounded-lg bg-white mb-3 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor={`batch-name-${batchIndex}`}
                      className="block text-sm font-medium text-gray-600"
                    >
                      Batch Name
                    </label>
                    {batches.length > 1 && ( // Allow removing if more than 1 batch
                      <button
                        type="button"
                        onClick={() => handleRemoveBatch(batchIndex)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Remove Batch
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id={`batch-name-${batchIndex}`}
                    value={batch.name}
                    onChange={(e) =>
                      handleBatchNameChange(batchIndex, e.target.value)
                    }
                    placeholder="e.g., BTech-A1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm mb-3"
                    required
                  />

                  <p className="block text-xs font-medium text-gray-600 mb-2">
                    Select Lab Subjects for Batch and specify Lectures/Week:
                  </p>
                  <div className="space-y-2">
                    {labSubjects.map((subject) => {
                      const currentSubEntry = batch.subjects.find(
                        (subEntry) => subEntry.subject === subject._id
                      );
                      // Use empty string for unselected or 0 lectures per week
                      const lecturesPerWeek = currentSubEntry
                        ? currentSubEntry.lecturesPerWeek
                        : "";
                      return (
                        <div
                          key={subject._id}
                          className="flex items-center space-x-2"
                        >
                          <label
                            htmlFor={`batch-${batchIndex}-subject-${subject._id}`}
                            className="text-sm text-gray-700 flex-grow"
                          >
                            {subject.name} ({subject.code})
                          </label>
                          <input
                            type="number"
                            id={`batch-${batchIndex}-subject-${subject._id}`}
                            value={lecturesPerWeek}
                            onChange={(e) =>
                              handleBatchSubjectChange(
                                batchIndex,
                                subject._id,
                                e.target.value
                              )
                            }
                            min="0" // Allow 0 to effectively deselect
                            placeholder="Lec/Week"
                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={handleAddBatch}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200 transform hover:scale-105"
            >
              Add Another Batch
            </button>
          </div>

          {/* Lecture Subjects Section */}
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
            <label className="block text-lg font-bold text-purple-700 mb-3">
              Lecture Subjects
            </label>
            {subjectsLoading ? (
              <p className="text-gray-600 mb-2">Loading subjects...</p>
            ) : subjectsError ? (
              <p className="text-red-500 mb-2">
                Error loading subjects: {subjectsError}
              </p>
            ) : lectureSubjectsAvailable.length === 0 ? (
              <p className="text-gray-600 mb-2">
                No lecture subjects available to select.
              </p>
            ) : (
              lectureSubjects.map((subEntry, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <select
                    value={subEntry.subject}
                    onChange={(e) =>
                      handleLectureSubjectChange(
                        index,
                        "subject",
                        e.target.value
                      )
                    }
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                    required
                  >
                    <option value="">Select a Lecture Subject</option>
                    {lectureSubjectsAvailable.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={subEntry.lecturesPerWeek}
                    onChange={(e) =>
                      handleLectureSubjectChange(
                        index,
                        "lecturesPerWeek",
                        e.target.value
                      )
                    }
                    min="1"
                    placeholder="Lec/Week"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLectureSubjectField(index)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1 text-sm transition-colors shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={handleAddLectureSubjectField}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200 transform hover:scale-105"
            >
              Add Lecture Subject Field
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Select subjects of type 'lecture' and specify the number of
              lectures per week.
            </p>
          </div>

          {/* Elective Groups Section (PE/OE) */}
          <div className="border border-orange-200 p-4 rounded-lg bg-orange-50">
            <label className="block text-lg font-bold text-orange-700 mb-3">
              Elective Groups (PE/OE)
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Define elective groups. All subjects in a group will be scheduled at the same time slot,
              allowing students to choose which one to attend.
            </p>

            {electiveGroups.length === 0 ? (
              <p className="text-gray-500 text-sm mb-2">No elective groups defined.</p>
            ) : (
              electiveGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="p-3 border border-orange-200 rounded-lg bg-white mb-3 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Elective Group {groupIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveElectiveGroup(groupIndex)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Remove Group
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Group Name</label>
                      <input
                        type="text"
                        value={group.groupName}
                        onChange={(e) => handleElectiveGroupChange(groupIndex, "groupName", e.target.value)}
                        placeholder="e.g., PE-III, OE-II"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Type</label>
                      <select
                        value={group.electiveType}
                        onChange={(e) => handleElectiveGroupChange(groupIndex, "electiveType", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                      >
                        <option value="PE">Professional Elective (PE)</option>
                        <option value="OE">Open Elective (OE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Lectures/Week</label>
                    <input
                      type="number"
                      value={group.lecturesPerWeek}
                      onChange={(e) => handleElectiveGroupChange(groupIndex, "lecturesPerWeek", e.target.value)}
                      min="1"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Select Elective Subjects in this Group:
                    </label>
                    {electiveSubjects.length === 0 ? (
                      <p className="text-gray-500 text-xs">No elective subjects available. Add subjects marked as elective first.</p>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {electiveSubjects
                          .filter(sub => sub.electiveType === group.electiveType)
                          .map((subject) => (
                            <label
                              key={subject._id}
                              className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={group.subjects.includes(subject._id)}
                                onChange={() => handleElectiveSubjectToggle(groupIndex, subject._id)}
                                className="rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span>{subject.name} ({subject.code})</span>
                              <span className="text-xs text-gray-400">[{subject.electiveGroup || 'No group'}]</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={handleAddElectiveGroup}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-4 rounded-lg shadow-sm transition duration-200 transform hover:scale-105"
            >
              Add Elective Group
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
          >
            {initialData ? "Update Class" : "Add Class"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddEditClassModal;
