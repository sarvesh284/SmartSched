import Room from "../models/room.model.js";

// Create a new Room
export const createRoom = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const newRoom = new Room({ name, type });
    await newRoom.save();

    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Rooms
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Room by ID
export const getRoomById = async (req, res) => {
  try {
    const foundRoom = await Room.findById(req.params.id);

    if (!foundRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(foundRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Room
export const updateRoom = async (req, res) => {
  try {
    // Exclude capacity from update if sent accidentally
    const { capacity, ...updateData } = req.body;

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res
      .status(200)
      .json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Room
export const deleteRoom = async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
