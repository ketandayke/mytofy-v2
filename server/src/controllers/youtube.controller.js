import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { searchYoutube } from "../services/youtube.service.js";

const searchSongs = asyncHandler(async (req, res) => {
    const query = req.query.q;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    const videos = await searchYoutube(query);

    return res.status(200).json(
        new ApiResponse(200, videos, "Search results fetched successfully")
    );
});

export {
    searchSongs
};
