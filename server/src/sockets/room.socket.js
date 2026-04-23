import { addSongToQueue, addUserToRoom, getQueue, getRoomState, popNextSong, removeUserFromRoom, updateRoomPlayback } from "../services/redis.service.js";
import logger from "../config/logger.js";
import { Room } from "../models/room.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";

export const registerRoomHandlers = (io, socket) => {
    
    // Middleware-like function to check if user is host
    const isHost = async (roomId, userId) => {
        const state = await getRoomState(roomId);
        return state && state.hostId === userId.toString();
    };

    socket.on("join_room", async ({ roomId }) => {
        try {
            socket.join(roomId);
            await addUserToRoom(roomId, socket.user._id);

            // Fetch Redis payload to sync client instantly (Reconnection Strategy)
            const state = await getRoomState(roomId);
            const queue = await getQueue(roomId);
            
            const rawChatHistory = await ChatMessage.find({ roomId }).sort({ createdAt: -1 }).limit(50).populate("senderId", "username avatar");
            const chatHistory = rawChatHistory.reverse().map(msg => ({
                roomId: msg.roomId,
                message: msg.message,
                timestamp: msg.timestamp || msg.createdAt,
                sender: {
                    _id: msg.senderId._id,
                    username: msg.senderId.username,
                    avatar: msg.senderId.avatar
                }
            }));

            // Send sync payload ONLY to the user joining
            socket.emit("room_sync", { state, queue, chatHistory });

            // Broadcast to others that someone joined
            socket.to(roomId).emit("user_joined", { userId: socket.user._id, username: socket.user.username });
            logger.info(`User ${socket.user.username} joined room ${roomId}`);
            
            socket.roomId = roomId; // Store for disconnect event
        } catch (error) {
            logger.error(`Error joining room ${roomId}: ${error}`);
        }
    });

    socket.on("add_to_queue", async ({ roomId, songId, title, thumbnail }) => {
        try {
            const state = await getRoomState(roomId);
            
            // Auto-play if nothing is currently playing
            if (!state.currentSongId || state.currentSongId === "") {
                const startedAt = Date.now();
                await updateRoomPlayback(roomId, "playing", startedAt, songId);
                io.to(roomId).emit("sync_play", { songId, startedAt });
            } else {
                // Score = Timestamp for fair ordering
                const score = Date.now();
                await addSongToQueue(roomId, JSON.stringify({ songId, title, thumbnail }), score);
                
                const updatedQueue = await getQueue(roomId);
                io.to(roomId).emit("queue_updated", updatedQueue);
            }
        } catch (error) {
            logger.error(`Error adding to queue: ${error}`);
        }
    });

    socket.on("play_song", async ({ roomId, songId, timestamp = 0 }) => {
        try {
            const hostAuth = await isHost(roomId, socket.user._id);
            if (!hostAuth) {
                return socket.emit("error", { message: "Only the host can control playback." });
            }

            // Adjust startedAt backward so when clients calculate (Date.now() - startedAt), it equals the timestamp.
            const startedAt = Date.now() - (timestamp * 1000);
            await updateRoomPlayback(roomId, "playing", startedAt, songId);

            io.to(roomId).emit("sync_play", { songId, startedAt });
        } catch (error) {
            logger.error(`Error playing song: ${error}`);
        }
    });

    socket.on("pause_song", async ({ roomId, timestamp }) => {
        try {
            const hostAuth = await isHost(roomId, socket.user._id);
            if (!hostAuth) return;

            // Save paused timestamp so clients know where to resume
            await updateRoomPlayback(roomId, "paused", timestamp);

            io.to(roomId).emit("sync_pause", { timestamp });
        } catch (error) {
            logger.error(`Error pausing song: ${error}`);
        }
    });
    
    socket.on("seek_song", async ({ roomId, timestamp }) => {
        try {
            const hostAuth = await isHost(roomId, socket.user._id);
            if (!hostAuth) return;

            // Update startedAt to reflect the new seek position for late joiners
            const newStartedAt = Date.now() - (timestamp * 1000);
            await updateRoomPlayback(roomId, "playing", newStartedAt);

            io.to(roomId).emit("sync_seek", { timestamp });
        } catch (error) {
            logger.error(`Error seeking song: ${error}`);
        }
    });

    socket.on("next_song", async ({ roomId }) => {
        try {
            const hostAuth = await isHost(roomId, socket.user._id);
            if (!hostAuth) return;

            const nextSongStr = await popNextSong(roomId);
            if (nextSongStr) {
                const nextSong = JSON.parse(nextSongStr);
                const startedAt = Date.now();
                await updateRoomPlayback(roomId, "playing", startedAt, nextSong.songId);
                
                const updatedQueue = await getQueue(roomId);
                
                io.to(roomId).emit("sync_play", { songId: nextSong.songId, startedAt });
                io.to(roomId).emit("queue_updated", updatedQueue);
            }
        } catch (error) {
            logger.error(`Error skipping to next song: ${error}`);
        }
    });

    socket.on("disconnecting", async () => {
        if (socket.roomId) {
            await removeUserFromRoom(socket.roomId, socket.user._id);
            io.to(socket.roomId).emit("user_left", { userId: socket.user._id, username: socket.user.username });
        }
    });
};
