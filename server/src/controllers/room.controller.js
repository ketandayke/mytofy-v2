import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { initRoomState } from "../services/redis.service.js";
import bcrypt from "bcrypt";

const createRoom = asyncHandler(async (req, res) => {
    const { name, isPrivate, password } = req.body;
    
    if (!name?.trim()) {
        throw new ApiError(400, "Room name is required");
    }

    if (isPrivate && !password?.trim()) {
        throw new ApiError(400, "Password is required for private rooms");
    }

    let hashedPassword = null;
    if (isPrivate) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    const room = await Room.create({
        name: name.trim(),
        hostId: req.user._id,
        isPrivate: !!isPrivate,
        password: hashedPassword
    });

    await initRoomState(room._id.toString(), req.user._id.toString());

    // Add to host's recent rooms
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { recentRooms: room._id }
    });

    const roomResponse = room.toObject();
    delete roomResponse.password; // Don't send password hash to client

    return res.status(201).json(new ApiResponse(201, roomResponse, "Room created successfully"));
});

const getRoomDetails = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const room = await Room.findById(roomId).populate("hostId", "username avatar");

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const user = await User.findById(req.user._id);
    const hasJoined = user.recentRooms.includes(roomId) || room.hostId._id.toString() === req.user._id.toString();

    if (room.isPrivate && !hasJoined) {
        return res.status(403).json({ success: false, message: "Private Room", isPrivate: true });
    }

    const roomResponse = room.toObject();
    delete roomResponse.password;

    return res.status(200).json(new ApiResponse(200, roomResponse, "Room details fetched successfully"));
});

const joinRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { password } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    if (room.isPrivate) {
        if (!password) {
            throw new ApiError(400, "Password is required");
        }
        const isMatch = await bcrypt.compare(password, room.password);
        if (!isMatch) {
            throw new ApiError(401, "Incorrect password");
        }
    }

    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { recentRooms: room._id }
    });

    return res.status(200).json(new ApiResponse(200, {}, "Joined successfully"));
});

const getPublicRooms = asyncHandler(async (req, res) => {
    const rooms = await Room.find({ isPrivate: false })
        .populate("hostId", "username avatar")
        .sort({ createdAt: -1 })
        .limit(20);
        
    return res.status(200).json(new ApiResponse(200, rooms, "Public rooms fetched successfully"));
});

const searchRooms = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(200).json(new ApiResponse(200, [], "Empty query"));
    }

    const rooms = await Room.find({
        // isPrivate: false,
        name: { $regex: q, $options: "i" }
    })
    .populate("hostId", "username avatar")
    .limit(10);

    return res.status(200).json(new ApiResponse(200, rooms, "Search results fetched"));
});

const getRecentRooms = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "recentRooms",
        populate: { path: "hostId", select: "username avatar" }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, user.recentRooms.reverse().slice(0, 10), "Recent rooms fetched successfully"));
});

export { createRoom, getRoomDetails, joinRoom, getPublicRooms, searchRooms, getRecentRooms };
