import Subject from "../models/subject.model.js";
import Faculty from "../models/faculty.model.js";
import Room from "../models/room.model.js";

// Extract data from image using Gemini Vision API
export const extractDataFromImage = async (req, res) => {
    try {
        const { imageBase64, mimeType } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ message: "No image provided" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key not configured" });
        }

        // Prepare the prompt for Gemini
        const prompt = `Analyze this image and extract academic/institutional data. Return ONLY valid JSON with no markdown formatting, no code blocks, just pure JSON:

{
  "subjects": [
    { "name": "Full Subject Name", "code": "CS101", "type": "lecture" }
  ],
  "faculty": [
    { "name": "Dr. John Smith", "subjectCodes": ["CS101", "CS102"] }
  ],
  "rooms": [
    { "name": "CR-101", "type": "lecture" }
  ]
}

Rules:
- type must be exactly "lecture" or "lab"
- If specific data category is not found, return empty array []
- Extract all visible subject names, codes, faculty names, room names
- For faculty, list the subject codes they teach in subjectCodes array
- Make reasonable inferences (e.g., "Lab" in room name = type "lab")
- Be thorough - extract every piece of relevant data you can see`;

        // Call Gemini API - using gemini-flash-latest (verified working)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        console.log("Calling Gemini API...");
        console.log("API Key (first 10 chars):", apiKey.substring(0, 10) + "...");

        const makeRequest = async (retryCount = 0) => {
            const maxRetries = 3;
            const baseDelay = 2000; // 2 seconds

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: prompt },
                                    {
                                        inline_data: {
                                            mime_type: mimeType || "image/jpeg",
                                            data: imageBase64,
                                        },
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 8192,
                        },
                    }),
                });

                console.log(`Gemini API attempt ${retryCount + 1} status:`, response.status);

                if (response.status === 429 && retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
                    console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return makeRequest(retryCount + 1);
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Gemini API error response:", errorText);

                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { rawError: errorText };
                    }

                    // Throw to be caught by the caller
                    throw {
                        status: response.status,
                        message: "Failed to analyze image with AI",
                        error: errorData
                    };
                }

                return response;
            } catch (error) {
                // If it's the custom error object from above, rethrow it
                if (error.status) throw error;
                // Network errors or other fetch issues
                throw {
                    status: 500,
                    message: "Network error calling Gemini API",
                    error: error.message
                };
            }
        };

        let response;
        try {
            response = await makeRequest();
        } catch (requestError) {
            return res.status(requestError.status || 500).json({
                message: requestError.message,
                error: requestError.error || requestError.message,
                status: requestError.status,
            });
        }

        const data = await response.json();

        // Extract the text response
        const textResponse =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse JSON from response (handle potential markdown code blocks)
        let extractedData;
        try {
            // Find the first '{' and the last '}'
            const start = textResponse.indexOf('{');
            const end = textResponse.lastIndexOf('}');

            if (start === -1 || end === -1 || start > end) {
                throw new Error("No valid JSON object found in response");
            }

            const jsonStr = textResponse.substring(start, end + 1);
            extractedData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", textResponse);
            return res.status(500).json({
                message: "Failed to parse AI response",
                rawResponse: textResponse,
                error: parseError.message
            });
        }

        // Validate and normalize the extracted data
        const normalizedData = {
            subjects: Array.isArray(extractedData.subjects)
                ? extractedData.subjects.map((s, idx) => ({
                    id: `temp-subject-${idx}`,
                    name: s.name || "Unknown Subject",
                    code: s.code || `SUB${idx + 1}`,
                    type: s.type === "lab" ? "lab" : "lecture",
                }))
                : [],
            faculty: Array.isArray(extractedData.faculty)
                ? extractedData.faculty.map((f, idx) => ({
                    id: `temp-faculty-${idx}`,
                    name: f.name || "Unknown Faculty",
                    subjectCodes: Array.isArray(f.subjectCodes) ? f.subjectCodes : [],
                }))
                : [],
            rooms: Array.isArray(extractedData.rooms)
                ? extractedData.rooms.map((r, idx) => ({
                    id: `temp-room-${idx}`,
                    name: r.name || `Room ${idx + 1}`,
                    type: r.type === "lab" ? "lab" : "lecture",
                }))
                : [],
        };

        res.status(200).json({
            message: "Data extracted successfully",
            data: normalizedData,
        });
    } catch (error) {
        console.error("Error in extractDataFromImage:", error);
        res.status(500).json({
            message: "Internal server error during image analysis",
            error: error.message,
        });
    }
};

// Bulk save extracted data to database
export const bulkSaveExtractedData = async (req, res) => {
    try {
        const { subjects, faculty, rooms } = req.body;

        const results = {
            subjects: { created: 0, errors: [] },
            rooms: { created: 0, errors: [] },
            faculty: { created: 0, errors: [] },
        };

        // 1. Create subjects first (we need their IDs for faculty mapping)
        const subjectCodeToId = new Map();

        if (Array.isArray(subjects)) {
            for (const subjectData of subjects) {
                try {
                    // Check if subject with same code already exists
                    const existingSubject = await Subject.findOne({
                        code: subjectData.code,
                    });
                    if (existingSubject) {
                        subjectCodeToId.set(subjectData.code, existingSubject._id);
                        results.subjects.errors.push(
                            `Subject ${subjectData.code} already exists`
                        );
                        continue;
                    }

                    const newSubject = new Subject({
                        name: subjectData.name,
                        code: subjectData.code,
                        type: subjectData.type,
                    });
                    const savedSubject = await newSubject.save();
                    subjectCodeToId.set(subjectData.code, savedSubject._id);
                    results.subjects.created++;
                } catch (err) {
                    results.subjects.errors.push(
                        `Failed to create subject ${subjectData.name}: ${err.message}`
                    );
                }
            }
        }

        // 2. Create rooms
        if (Array.isArray(rooms)) {
            for (const roomData of rooms) {
                try {
                    // Check if room with same name already exists
                    const existingRoom = await Room.findOne({ name: roomData.name });
                    if (existingRoom) {
                        results.rooms.errors.push(`Room ${roomData.name} already exists`);
                        continue;
                    }

                    const newRoom = new Room({
                        name: roomData.name,
                        type: roomData.type,
                    });
                    await newRoom.save();
                    results.rooms.created++;
                } catch (err) {
                    results.rooms.errors.push(
                        `Failed to create room ${roomData.name}: ${err.message}`
                    );
                }
            }
        }

        // 3. Create faculty with subject mappings
        if (Array.isArray(faculty)) {
            for (const facultyData of faculty) {
                try {
                    // Map subject codes to subject IDs
                    const subjectIds = [];
                    if (Array.isArray(facultyData.subjectCodes)) {
                        for (const code of facultyData.subjectCodes) {
                            const subjectId = subjectCodeToId.get(code);
                            if (subjectId) {
                                subjectIds.push(subjectId);
                            } else {
                                // Try to find existing subject by code
                                const existingSubject = await Subject.findOne({ code });
                                if (existingSubject) {
                                    subjectIds.push(existingSubject._id);
                                }
                            }
                        }
                    }

                    // Check if faculty with same name already exists
                    const existingFaculty = await Faculty.findOne({
                        name: facultyData.name,
                    });
                    if (existingFaculty) {
                        results.faculty.errors.push(
                            `Faculty ${facultyData.name} already exists`
                        );
                        continue;
                    }

                    const newFaculty = new Faculty({
                        name: facultyData.name,
                        subjects: subjectIds,
                        availability: [], // Empty availability - can be set later
                    });
                    await newFaculty.save();
                    results.faculty.created++;
                } catch (err) {
                    results.faculty.errors.push(
                        `Failed to create faculty ${facultyData.name}: ${err.message}`
                    );
                }
            }
        }

        res.status(200).json({
            message: "Bulk save completed",
            results,
        });
    } catch (error) {
        console.error("Error in bulkSaveExtractedData:", error);
        res.status(500).json({
            message: "Internal server error during bulk save",
            error: error.message,
        });
    }
};