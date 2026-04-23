import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import { setupSocket } from "./sockets/index.js"; 
import { startLogCleanupCron } from "./services/logCron.service.js";

dotenv.config({
  path: "./.env",
});

const server = createServer(app);

setupSocket(server);

const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`⚙️ Server is running at port : ${PORT}`);
  startLogCleanupCron();

  // Initialize connections after starting the server
  connectDB()
    .then(() => {
      return connectRedis();
    })
    .catch((err) => {
      logger.error("Database or Redis initialization failed !!! ", err);
    });
});
