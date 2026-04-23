import cron from "node-cron";
import fs from "fs";
import path from "path";
import readline from "readline";
import { SystemLog } from "../models/systemLog.model.js";
import logger from "../config/logger.js";

const processLogFile = async (filePath, logType) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const logEntries = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsedLog = JSON.parse(line);
      // Attempt to parse message if it's a JSON string
      if (typeof parsedLog.message === "string" && parsedLog.message.startsWith("{")) {
        try {
          parsedLog.message = JSON.parse(parsedLog.message);
        } catch (e) {
          // ignore, keep as string
        }
      }

      logEntries.push({
        level: parsedLog.level,
        message: parsedLog.message,
        service: parsedLog.service,
        timestamp: parsedLog.timestamp,
        logType,
        rawString: line,
      });
    } catch (error) {
      // If not JSON, save as raw string
      logEntries.push({
        logType,
        rawString: line,
      });
    }
  }

  if (logEntries.length > 0) {
    try {
      await SystemLog.insertMany(logEntries);
      // Clear the file after saving
      fs.truncateSync(filePath, 0);
      logger.info(`Successfully backed up and cleaned ${logType} log file.`);
    } catch (error) {
      logger.error(`Failed to backup ${logType} log to MongoDB:`, error);
    }
  }
};

export const startLogCleanupCron = () => {
  // Run every day at midnight: "0 0 * * *"
  // For testing or frequent cleanup, we can adjust the expression.
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running scheduled log cleanup task...");

    const combinedLogPath = path.resolve(process.cwd(), "combined.log");
    const errorLogPath = path.resolve(process.cwd(), "error.log");

    await processLogFile(combinedLogPath, "combined");
    await processLogFile(errorLogPath, "error");
  });
  
  logger.info("Log cleanup cron job scheduled.");
};
