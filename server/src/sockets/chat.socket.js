import { ChatMessage } from "../models/chatMessage.model.js";
import logger from "../config/logger.js";

export const registerChatHandlers = (io, socket) => {
    
    socket.on("send_message", async ({ roomId, message }) => {
        if (!message || message.trim() === "") return;

        const messageData = {
            roomId,
            senderId: socket.user._id,
            message: message.trim(),
            timestamp: Date.now()
        };

        // 1. Broadcast instantly to everyone in the room for real-time feel
        io.to(roomId).emit("new_message", {
            ...messageData,
            sender: {
                _id: socket.user._id,
                username: socket.user.username,
                avatar: socket.user.avatar
            }
        });

        // 2. Save to DB asynchronously (Mongo acts as history backup)
        try {
            await ChatMessage.create(messageData);
        } catch (error) {
            logger.error(`Error saving chat message to DB: ${error}`);
        }
    });

};
