import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import logger from "./config/logger.js";
import { setupSocket } from "./sockets/index.js"; 

dotenv.config({
  path: "./.env",
});

const server = createServer(app);

setupSocket(server);

connectDB()
  .then(() => {
    return connectRedis();
  })
  .then(() => {
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      logger.info(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Initialization failed !!! ", err);
  });
