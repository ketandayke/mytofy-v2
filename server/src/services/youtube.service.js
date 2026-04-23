import axios from "axios";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

export const searchYoutube = async (query) => {
    const cacheKey = `search:${query.toLowerCase().trim()}`;

    try {
        // 1. Check Redis Cache
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            logger.info(`[YouTube Cache Hit]: ${query}`);
            return JSON.parse(cachedResults);
        }

        logger.info(`[YouTube Cache Miss]: Fetching ${query} from YouTube API`);

        // 2. Fetch from YouTube API
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                q: query + " audio", // Prioritize audio/songs
                part: "snippet",
                type: "video",
                maxResults: 10,
                videoCategoryId: "10" // Music category
            }
        });

        // 3. Clean and format results
        const videos = response.data.items.map((item) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url
        }));

        // 4. Cache results in Redis with TTL (10 minutes)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(videos));

        return videos;
    } catch (error) {
        logger.error(`YouTube Search Error: ${error.message}`);
        throw error;
    }
};
