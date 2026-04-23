import { useEffect, useState, useRef } from 'react';

export const usePlayerSync = (socketEvents, isHost, roomId) => {
  const [player, setPlayer] = useState(null);
  const [currentSongId, setCurrentSongId] = useState("");
  const isSyncing = useRef(false);

  const pendingState = useRef(null);

  const { on, emit } = socketEvents;

  // Apply state when player becomes ready
  useEffect(() => {
    if (player && pendingState.current) {
      const state = pendingState.current;
      try {
          if (state.status === "playing") {
             const delayInSeconds = (Date.now() - parseInt(state.startedAt)) / 1000;
             player.loadVideoById(state.currentSongId, delayInSeconds);
          } else {
             player.cueVideoById(state.currentSongId, parseInt(state.startedAt) || 0);
          }
      } catch (e) {
          console.error("Player sync error", e);
      }
      pendingState.current = null; // Clear it
    }
  }, [player]);

  // Handles the initial sync payload when joining/reconnecting
  useEffect(() => {
    return on("room_sync", (payload) => {
      const { state } = payload;
      if (state && state.currentSongId) {
        pendingState.current = state;
        
        if (state.currentSongId !== currentSongId) {
            setPlayer(null);
            setCurrentSongId(state.currentSongId);
            return;
        }

        if (player) {
            try {
                if (state.status === "playing") {
                   const delayInSeconds = (Date.now() - parseInt(state.startedAt)) / 1000;
                   player.seekTo(delayInSeconds, true);
                   player.playVideo();
                } else {
                   player.seekTo(parseInt(state.startedAt) || 0, true);
                   player.pauseVideo();
                }
            } catch(e) {}
        }
      }
    });
  }, [player, on, currentSongId]);

  // Handle Play Event
  useEffect(() => {
    return on("sync_play", ({ songId, startedAt }) => {
      pendingState.current = { status: "playing", currentSongId: songId, startedAt };

      if (songId !== currentSongId) {
        setPlayer(null); // Clear old player
        setCurrentSongId(songId); // Will trigger remount with new key
        return;
      }
      
      if (!player) return;
      
      isSyncing.current = true;
      const delayInSeconds = (Date.now() - startedAt) / 1000;

      try {
          player.seekTo(delayInSeconds, true);
          player.playVideo();
      } catch (e) {
          console.error("Play error", e);
      }
      setTimeout(() => isSyncing.current = false, 1000);
    });
  }, [player, on, currentSongId]);

  // Handle Pause Event
  useEffect(() => {
    return on("sync_pause", ({ timestamp }) => {
      if (!player) return;
      isSyncing.current = true;
      try {
          player.seekTo(timestamp, true);
          player.pauseVideo();
      } catch (e) {
          console.error("Pause error", e);
      }
      setTimeout(() => isSyncing.current = false, 1000);
    });
  }, [player, on]);

  // Handle Seek Event
  useEffect(() => {
    return on("sync_seek", ({ timestamp }) => {
      if (!player) return;
      if (!isHost) {
          isSyncing.current = true;
          try {
              player.seekTo(timestamp, true);
          } catch (e) {
              console.error("Seek error", e);
          }
          setTimeout(() => isSyncing.current = false, 1000);
      }
    });
  }, [player, on, isHost]);

  // Host manual seek detection via polling
  const lastTimeRef = useRef(0);
  useEffect(() => {
      if (!isHost || !player) return;

      const interval = setInterval(() => {
          try {
              const currentTime = player.getCurrentTime();
              const state = player.getPlayerState();
              
              if (isSyncing.current) {
                  lastTimeRef.current = currentTime;
                  return;
              }
              
              if (state === 1 || state === 2) { // Playing or Paused
                  const diff = Math.abs(currentTime - lastTimeRef.current);
                  const expectedDiff = state === 1 ? 1 : 0;
                  
                  // If the jump is unusually large, it's a manual scrub/seek
                  if (Math.abs(diff - expectedDiff) > 2 && lastTimeRef.current !== 0) {
                      emit("seek_song", { roomId, timestamp: currentTime });
                  }
                  lastTimeRef.current = currentTime;
              }
          } catch (e) {
              // Player might be unmounting
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [player, isHost, roomId, emit]);

  // Playback control actions (only allowed by Host)
  const handlePlay = () => {
    if (isSyncing.current || !isHost || !player) return;
    emit("play_song", { roomId, songId: currentSongId, timestamp: player.getCurrentTime() || 0 });
  };

  const handlePause = () => {
    if (isSyncing.current || !isHost) return;
    emit("pause_song", { roomId, timestamp: player.getCurrentTime() });
  };

  const handleNext = () => {
      if (!isHost) return;
      emit("next_song", { roomId });
  }

  return {
    setPlayer,
    currentSongId,
    handlePlay,
    handlePause,
    handleNext
  };
};
