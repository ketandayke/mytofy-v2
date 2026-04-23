import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    hostId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    password: {
        type: String, // Hashed password if isPrivate is true
        default: null
    }
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);
