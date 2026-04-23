import { createClient } from "redis";
import logger from "./logger.js";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
// Ensure it uses secure connection for upstash even if they accidentally provided 'redis://'
const parsedUrl = redisUrl.includes("upstash.io") ? redisUrl.replace("redis://", "rediss://") : redisUrl;

const redisClient = createClient({
  url: parsedUrl,
  socket: {
    tls: parsedUrl.startsWith("rediss://"),
    rejectUnauthorized: false, // Prevents sudden drops due to strict SSL checks
  }
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis connected successfully"));

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;
