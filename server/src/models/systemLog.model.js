import mongoose, { Schema } from "mongoose";

const systemLogSchema = new Schema(
  {
    level: {
      type: String,
    },
    message: {
      type: Schema.Types.Mixed,
    },
    service: {
      type: String,
    },
    timestamp: {
      type: String,
    },
    rawString: {
      type: String,
    },
    logType: {
      type: String,
      enum: ["combined", "error"],
    }
  },
  { timestamps: true }
);

export const SystemLog = mongoose.model("SystemLog", systemLogSchema);
