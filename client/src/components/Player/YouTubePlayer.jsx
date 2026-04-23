import React from 'react';
import YouTube from 'react-youtube';

export default function YouTubePlayer({ videoId, setPlayerRef, isHost, onPlay, onPause, onEnd }) {
  
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      // Auto-play the video on load
      autoplay: 0,
      // Hide standard YouTube controls if we want custom UI
      controls: isHost ? 1 : 0, 
      disablekb: !isHost ? 1 : 0, // Disable keyboard shortcuts for guests
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin
    },
  };

  const onReady = (event) => {
    // Pass the player instance up to our sync hook
    setPlayerRef(event.target);
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-mytofy-fade-green/30 relative pointer-events-none">
        {/* We disable pointer events on the container for guests so they literally cannot click pause or timeline */}
        <div className={isHost ? "pointer-events-auto w-full h-full" : "w-full h-full"}>
            <YouTube 
                videoId={videoId} 
                opts={opts} 
                onReady={onReady} 
                onPlay={onPlay}
                onPause={onPause}
                onEnd={onEnd}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
        
        {!isHost && (
            <div className="absolute top-4 left-4 bg-mytofy-dark-blue/80 backdrop-blur text-white px-3 py-1 rounded text-sm font-medium border border-white/10 shadow">
                Syncing with Host
            </div>
        )}
    </div>
  );
}
