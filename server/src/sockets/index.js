import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";
import { User } from "../models/user.model.js";
import { registerRoomHandlers } from "./room.socket.js";
import { registerChatHandlers } from "./chat.socket.js";

let io;

export const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket Middleware for Auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('accessToken=')[1]?.split(';')[0];
      
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }
      
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "fallback_secret");
      const user = await User.findById(decoded._id).select("-password");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      logger.error("Socket Auth Error: ", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`User Connected: ${socket.user.username} (${socket.id})`);

    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.info(`User Disconnected: ${socket.user.username} (${socket.id})`);
      // We handle leaving room logic in room.socket.js via 'disconnecting' event
    });
  });
};

export { io };
