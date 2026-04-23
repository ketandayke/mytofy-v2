import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { usePlayerSync } from '../hooks/usePlayerSync';
import { useAuth } from '../contexts/AuthContext';
import YouTubePlayer from '../components/Player/YouTubePlayer';
import { Users, ListMusic, MessageSquare, Search, Plus, ArrowLeft, Crown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const chatEndRef = useRef(null);
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [isHost, setIsHost] = useState(false);
  
  const [hasInteracted, setHasInteracted] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
      const handleInteract = () => setHasInteracted(true);
      document.addEventListener("click", handleInteract, { once: true });
      return () => document.removeEventListener("click", handleInteract);
  }, []);

  const socketEvents = useSocket(roomId);
  const { 
    setPlayer, 
    currentSongId, 
    handlePlay, 
    handlePause, 
    handleNext 
  } = usePlayerSync(socketEvents, isHost, roomId);

  const [queue, setQueue] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch Room Details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
         const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/rooms/${roomId}`, { withCredentials: true });
         setRoomDetails(data.data);
         if (user && data.data.hostId._id === user._id) {
            setIsHost(true);
         }
      } catch (err) {
         if (err.response?.status === 403 && err.response?.data?.isPrivate) {
            toast.error("This is a private room. Join from the dashboard.");
            navigate("/home");
            return;
         }
         toast.error("Failed to load room");
         navigate("/home");
      }
    };
    if (user) {
        fetchRoom();
    }
  }, [roomId, user, navigate]);

  // Listen for initial sync and queue updates
  useEffect(() => {
    const unsubSync = socketEvents.on("room_sync", (payload) => {
      if (payload.queue) setQueue(payload.queue);
      if (payload.chatHistory) setChatMessages(payload.chatHistory);
    });
    const unsubQueue = socketEvents.on("queue_updated", (newQueue) => {
      setQueue(newQueue);
    });
    return () => {
      unsubSync();
      unsubQueue();
    };
  }, [socketEvents]);

  // Listen for new chat messages
  useEffect(() => {
    return socketEvents.on("new_message", (message) => {
      setChatMessages((prev) => [...prev, message]);
    });
  }, [socketEvents]);

  // Auto-scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Listen for user count (Presence)
  useEffect(() => {
      const unsubJoined = socketEvents.on("user_joined", () => setActiveUsers(prev => prev + 1));
      const unsubLeft = socketEvents.on("user_left", () => setActiveUsers(prev => Math.max(0, prev - 1)));
      return () => {
          unsubJoined();
          unsubLeft();
      };
  }, [socketEvents]);

  const handleSendMessage = (e) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      socketEvents.emit("send_message", { roomId, message: newMessage });
      setNewMessage("");
  };

  const handleSearch = async (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      try {
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/youtube/search?q=${encodeURIComponent(searchQuery)}`, { withCredentials: true });
          setSearchResults(data.data);
      } catch (error) {
          toast.error("Failed to search songs");
      } finally {
          setIsSearching(false);
      }
  };

  const handleAddToQueue = (song) => {
      socketEvents.emit("add_to_queue", { 
          roomId, 
          songId: song.videoId, 
          title: song.title, 
          thumbnail: song.thumbnail 
      });
      toast.success("Added to Queue!");
      setSearchResults([]);
      setSearchQuery("");
  };

  const formatTime = (timestamp) => {
      if (!timestamp) return "";
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen lg:h-screen bg-mytofy-dark-blue p-3 md:p-4 lg:p-5 flex flex-col lg:flex-row gap-3 md:gap-4 lg:overflow-hidden">
      
      {/* Main Content (Player & Search) */}
      <div className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
          
        {/* Header / Room Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#1b263b] rounded-xl p-3 md:p-4 shadow border border-white/5 shrink-0 gap-3">
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/home')} className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition shrink-0">
                   <ArrowLeft size={18} />
               </button>
               <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-white font-secondary tracking-wide flex items-center gap-2 truncate">
                        {roomDetails?.name || "Loading Room..."}
                        {isHost && <span className="bg-mytofy-accent-coral/20 text-mytofy-accent-coral text-xs px-2 py-0.5 rounded font-sans shrink-0">HOST</span>}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-mytofy-fade-green text-xs md:text-sm flex items-center gap-1">
                            <Users size={12} /> {activeUsers + 1} listening
                        </p>
                        {roomDetails?.hostId?.username && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Crown size={12} className="text-yellow-400" /> {roomDetails.hostId.username}
                            </p>
                        )}
                    </div>
               </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Invite link copied!");
                    }}
                    className="flex-1 sm:flex-none px-3 py-2 border border-mytofy-fade-green/50 text-mytofy-fade-green hover:bg-mytofy-fade-green/10 rounded transition-colors font-medium text-xs md:text-sm"
                >
                    Copy Invite
                </button>
                {isHost && (
                    <button onClick={handleNext} className="flex-1 sm:flex-none px-3 py-2 bg-mytofy-fade-green/20 text-mytofy-fade-green hover:bg-mytofy-fade-green hover:text-[#1b263b] rounded transition-colors font-medium text-xs md:text-sm">
                        Skip Next
                    </button>
                )}
            </div>
        </div>

        {/* Player Container - capped height on desktop, natural on mobile */}
        <div className="bg-[#1b263b] rounded-xl p-2 shadow-xl border border-white/5 relative overflow-hidden shrink-0" style={{ height: 'clamp(200px, 40vh, 400px)' }}>
            {currentSongId ? (
                <YouTubePlayer 
                    key={currentSongId}
                    videoId={currentSongId} 
                    setPlayerRef={setPlayer}
                    isHost={isHost}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnd={handleNext}
                />
            ) : (
                <div className="w-full h-full bg-black/40 rounded flex items-center justify-center flex-col gap-3 border border-mytofy-fade-green/20">
                    <ListMusic size={40} className="text-mytofy-fade-green animate-bounce" />
                    <p className="text-lg text-mytofy-text-secondary font-medium">Player is empty</p>
                    <p className="text-sm text-gray-400">Search for a song below to start the party</p>
                </div>
            )}

            {/* Browser Autoplay Policy Overlay */}
            {!hasInteracted && !isHost && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center rounded backdrop-blur-sm">
                    <button 
                        onClick={() => setHasInteracted(true)} 
                        className="px-6 py-3 bg-mytofy-fade-green text-[#1b263b] font-bold rounded-full text-base shadow-xl hover:scale-105 transition"
                    >
                        Click to Join Audio
                    </button>
                    <p className="mt-3 text-sm text-gray-300">Your browser requires interaction to play synced music</p>
                </div>
            )}
        </div>

        {/* Search Bar section */}
        <div className="shrink-0 bg-[#1b263b] rounded-xl p-3 md:p-4 shadow-xl border border-white/5 relative">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search YouTube for a song..." 
                        className="w-full bg-black/20 text-white text-sm pl-9 pr-4 py-2.5 rounded border border-white/5 focus:outline-none focus:border-mytofy-fade-green transition-colors"
                    />
                </div>
                <button type="submit" disabled={isSearching} className="px-4 bg-mytofy-accent-coral text-white rounded font-medium hover:bg-mytofy-accent-hover transition-colors text-sm">
                    {isSearching ? "..." : "Search"}
                </button>
            </form>

            {/* Search Results Dropdown/List */}
            {searchResults.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {searchResults.map((song) => (
                        <div key={song.videoId} className="flex gap-3 items-center bg-black/20 p-2 rounded hover:bg-black/40 transition-colors">
                            <img src={song.thumbnail} alt="thumbnail" className="w-14 h-10 object-cover rounded" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-white truncate font-medium">{song.title}</p>
                                <p className="text-xs text-gray-400 truncate">{song.channelTitle}</p>
                            </div>
                            <button 
                                onClick={() => handleAddToQueue(song)}
                                className="p-2 bg-mytofy-fade-green/20 text-mytofy-fade-green rounded hover:bg-mytofy-fade-green hover:text-white transition-colors shrink-0"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Sidebar (Queue & Chat) */}
      <div className="w-full lg:w-[420px] flex flex-col gap-3 md:gap-4 shrink-0 lg:h-full">
        {/* Queue */}
        <div className="bg-[#1b263b] rounded-xl p-3 md:p-4 shadow-xl border border-white/5 flex-1 flex flex-col min-h-[180px] lg:min-h-0">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 shrink-0">
                <ListMusic size={16} className="text-mytofy-accent-coral" />
                Up Next
                {queue.length > 0 && <span className="text-xs text-gray-400 font-normal">({queue.length})</span>}
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                {queue.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-6">No songs in queue</p>
                ) : (
                    queue.map((item, index) => {
                        const song = JSON.parse(item.value);
                        return (
                            <div key={index} className="flex gap-3 items-center bg-black/20 p-2 rounded hover:bg-black/40 transition-colors">
                                <span className="text-xs text-gray-500 w-5 text-center shrink-0">{index + 1}</span>
                                <img src={song.thumbnail} alt="thumbnail" className="w-10 h-8 object-cover rounded shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-white truncate font-medium">{song.title}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

        {/* Live Chat */}
        <div className="bg-[#1b263b] rounded-xl p-3 md:p-4 shadow-xl border border-white/5 flex flex-col min-h-[250px] lg:flex-1">
             <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 shrink-0">
                <MessageSquare size={16} className="text-mytofy-fade-green" />
                Live Chat
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1 mb-3">
                {chatMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-auto mb-auto">Be the first to say hi!</p>
                ) : (
                    chatMessages.map((msg, idx) => {
                        const isMe = msg.sender._id === user?._id;
                        return (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && (
                                    <span className="text-[10px] text-gray-400 font-medium mb-1 ml-1 flex items-center gap-1">
                                        {msg.sender.username} {msg.sender._id === roomDetails?.hostId?._id ? '👑' : ''}
                                    </span>
                                )}
                                <div className={`px-3 py-2 rounded-2xl max-w-[85%] break-words shadow-sm ${isMe ? 'bg-mytofy-fade-green text-[#1b263b] rounded-tr-sm' : 'bg-black/30 text-white rounded-tl-sm border border-white/5'}`}>
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                                <span className={`text-[10px] text-gray-500 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="shrink-0 flex gap-2">
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Say something..." 
                    className="flex-1 bg-black/20 text-sm text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-mytofy-fade-green border border-transparent"
                />
                <button type="submit" className="bg-mytofy-accent-coral text-white px-3 rounded hover:bg-mytofy-accent-hover font-medium text-sm">
                    Send
                </button>
            </form>
        </div>
      </div>

    </div>
  );
}
