import express from "express";
import cors from "cors";
import morgan from "morgan";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./config/logger.js";

import authRouter from "./routes/auth.routes.js";
import youtubeRouter from "./routes/youtube.routes.js";
import roomRouter from "./routes/room.routes.js";
import cookieParser from "cookie-parser";

const app = express();

const morganFormat = ":method :url :status :res[content-length] - :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[4],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Apply global rate limiting
app.use("/api", globalLimiter);

// Setup Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/youtube", youtubeRouter);
app.use("/api/v1/rooms", roomRouter);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running perfectly" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
