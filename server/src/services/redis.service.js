import redisClient from "../config/redis.js";

export const initRoomState = async (roomId, hostId) => {
    // Single Source of Truth for live state
    await redisClient.hSet(`room:${roomId}:state`, {
        status: "paused",
        startedAt: Date.now().toString(),
        hostId: hostId.toString(),
        currentSongId: ""
    });
};

export const getRoomState = async (roomId) => {
    const state = await redisClient.hGetAll(`room:${roomId}:state`);
    return Object.keys(state).length === 0 ? null : state;
};

export const updateRoomPlayback = async (roomId, status, startedAt, currentSongId) => {
    const updates = { status, startedAt: startedAt.toString() };
    if (currentSongId !== undefined) updates.currentSongId = currentSongId;
    await redisClient.hSet(`room:${roomId}:state`, updates);
};

// Queue using Redis Sorted Sets
export const addSongToQueue = async (roomId, songId, score) => {
    // Score determines order. Can be timestamp or vote count
    await redisClient.zAdd(`room:${roomId}:queue`, [{
        score: score,
        value: songId
    }]);
};

export const getQueue = async (roomId) => {
    // Get all songs sorted by score descending
    return await redisClient.zRangeWithScores(`room:${roomId}:queue`, 0, -1, { REV: true });
};

export const popNextSong = async (roomId) => {
    const result = await redisClient.zPopMax(`room:${roomId}:queue`);
    return result ? result.value : null; // returns the songId with highest score
};

export const addUserToRoom = async (roomId, userId) => {
    await redisClient.sAdd(`room:${roomId}:users`, userId.toString());
};

export const removeUserFromRoom = async (roomId, userId) => {
    await redisClient.sRem(`room:${roomId}:users`, userId.toString());
};
