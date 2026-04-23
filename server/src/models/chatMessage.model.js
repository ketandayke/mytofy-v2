import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema({
    roomId: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true,
        index: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Number,
        default: Date.now
    }
}, { timestamps: true });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
