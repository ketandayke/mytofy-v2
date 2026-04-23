import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Plus, Music, Users, Clock, Lock, Eye, EyeOff, X, Globe } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Create Room State
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Room Lists
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [publicRooms, setPublicRooms] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searching, [] = no results

  // Password Modal
  const [passwordModal, setPasswordModal] = useState({ open: false, roomId: null, roomName: "" });
  const [joinPassword, setJoinPassword] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchPublicRooms = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/rooms/public`, { withCredentials: true });
        setPublicRooms(data.data);
      } catch (error) {
        console.error("Failed to load rooms");
      } finally {
        setLoadingRooms(false);
      }
    };

    const fetchRecentRooms = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/rooms/recent`, { withCredentials: true });
        setRecentRooms(data.data);
      } catch (error) {
        console.error("Failed to load recent rooms");
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchPublicRooms();
    fetchRecentRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    if (isPrivate && !roomPassword.trim()) {
      toast.error("Private rooms require a password");
      return;
    }

    setIsCreating(true);
    try {
      const payload = { name: roomName };
      if (isPrivate) {
        payload.isPrivate = true;
        payload.password = roomPassword;
      }
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/rooms`, payload, { withCredentials: true });
      if (data.success) {
        toast.success("Room created!");
        navigate(`/room/${data.data._id}`);
      }
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/rooms/search?q=${encodeURIComponent(searchQuery)}`, { withCredentials: true });
      setSearchResults(data.data);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  const handleRoomClick = async (room) => {
    if (room.isPrivate) {
      setPasswordModal({ open: true, roomId: room._id, roomName: room.name });
    } else {
      navigate(`/room/${room._id}`);
    }
  };

  const handleJoinPrivateRoom = async (e) => {
    e.preventDefault();
    if (!joinPassword.trim()) return;
    setJoining(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/rooms/${passwordModal.roomId}/join`,
        { password: joinPassword },
        { withCredentials: true }
      );
      setPasswordModal({ open: false, roomId: null, roomName: "" });
      setJoinPassword("");
      navigate(`/room/${passwordModal.roomId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect password");
    } finally {
      setJoining(false);
    }
  };

  const displayRooms = searchResults !== null ? searchResults : publicRooms;

  return (
    <div className="min-h-[calc(100vh-76px)] bg-mytofy-dark-blue p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white font-secondary tracking-wide">Welcome back, {user?.username}</h1>
                <p className="text-mytofy-fade-green mt-1">Ready to sync some vibes?</p>
            </div>

            <form onSubmit={handleSearch} className="relative w-full md:w-96">
                <input 
                    type="text" 
                    placeholder="Search for public rooms..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value === "") setSearchResults(null);
                    }}
                    className="w-full bg-[#1b263b] text-white px-4 py-3 pl-12 rounded-full border border-white/10 focus:outline-none focus:border-mytofy-fade-green transition-colors"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                {searchResults !== null && (
                    <button type="button" onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                )}
            </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Create Room & Recent) */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* Create Room Card */}
                <div className="bg-[#1b263b] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Music size={80} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-4 relative z-10">Start a Session</h2>
                    <form onSubmit={handleCreateRoom} className="relative z-10 flex flex-col gap-3">
                        <input 
                            type="text" 
                            placeholder="Give your room a name..." 
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="bg-black/20 text-white px-4 py-3 rounded border border-white/5 focus:outline-none focus:border-mytofy-fade-green"
                            required
                        />

                        {/* Private Room Toggle */}
                        <div className="flex items-center justify-between bg-black/20 rounded p-3 border border-white/5">
                            <div className="flex items-center gap-2">
                                <Lock size={16} className={isPrivate ? "text-mytofy-accent-coral" : "text-gray-500"} />
                                <span className="text-sm text-gray-300">Private Room</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${isPrivate ? 'bg-mytofy-accent-coral' : 'bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isPrivate ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Password Field (Animated) */}
                        <div className={`overflow-hidden transition-all duration-300 ${isPrivate ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Set a room password..."
                                    value={roomPassword}
                                    onChange={(e) => setRoomPassword(e.target.value)}
                                    className="w-full bg-black/20 text-white px-4 py-3 rounded border border-mytofy-accent-coral/30 focus:outline-none focus:border-mytofy-accent-coral pr-12"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isCreating}
                            className="w-full py-3 bg-mytofy-accent-coral text-white rounded font-medium hover:bg-mytofy-accent-hover transition-colors shadow-lg shadow-mytofy-accent-coral/20 flex justify-center items-center gap-2"
                        >
                            {isCreating ? <span className="animate-pulse">Creating...</span> : <><Plus size={18} /> Create Room</>}
                        </button>
                    </form>
                </div>

                {/* Recently Joined */}
                <div className="bg-[#1b263b] p-6 rounded-2xl border border-white/5 shadow-xl">
                     <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-mytofy-fade-green" />
                        Recently Joined
                    </h2>
                    
                    <div className="flex flex-col gap-3">
                        {loadingRecent ? (
                            Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} height={56} baseColor="#121a28" highlightColor="#1b263b" borderRadius={8} />
                            ))
                        ) : recentRooms.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">You haven't joined any rooms yet.</p>
                        ) : (
                            recentRooms.map(room => (
                                <div
                                    key={room._id}
                                    onClick={() => handleRoomClick(room)}
                                    className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-mytofy-fade-green/30 cursor-pointer transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-mytofy-fade-green/10 flex items-center justify-center shrink-0">
                                        {room.isPrivate ? <Lock size={18} className="text-mytofy-accent-coral" /> : <Music size={18} className="text-mytofy-fade-green" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate group-hover:text-mytofy-fade-green transition-colors">{room.name}</p>
                                        <p className="text-xs text-gray-500 truncate">Host: {room.hostId?.username || 'Unknown'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Right Column (Public Rooms / Search Results) */}
            <div className="lg:col-span-2">
                <div className="bg-[#1b263b] p-6 rounded-2xl border border-white/5 shadow-xl h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {searchResults !== null ? (
                                <><Search size={20} className="text-mytofy-fade-green" /> Search Results</>
                            ) : (
                                <><Globe size={20} className="text-mytofy-accent-coral" /> Live Public Rooms</>
                            )}
                        </h2>
                        {searchResults !== null && (
                            <span className="text-sm text-gray-400">{searchResults.length} result(s)</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {loadingRooms && searchResults === null ? (
                            Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} height={120} baseColor="#121a28" highlightColor="#1b263b" borderRadius={12} />
                            ))
                        ) : displayRooms.length === 0 ? (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500">
                                <Music size={48} className="opacity-20 mb-4" />
                                {searchResults !== null ? (
                                    <>
                                        <p>No rooms match "{searchQuery}"</p>
                                        <p className="text-sm mt-1">Try a different search term</p>
                                    </>
                                ) : (
                                    <>
                                        <p>No public rooms active right now.</p>
                                        <p className="text-sm mt-1">Be the first to start one!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            displayRooms.map(room => (
                                <div key={room._id} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-mytofy-fade-green/30 transition-colors cursor-pointer group" onClick={() => handleRoomClick(room)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white group-hover:text-mytofy-fade-green transition-colors flex items-center gap-2">
                                            {room.name}
                                            {room.isPrivate && <Lock size={14} className="text-mytofy-accent-coral" />}
                                        </h3>
                                        <span className="bg-mytofy-accent-coral/20 text-mytofy-accent-coral text-xs px-2 py-1 rounded">Live</span>
                                    </div>
                                    <p className="text-sm text-gray-400 flex items-center gap-1">Host: {room.hostId?.username || 'Unknown'}</p>
                                    <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
                                        <span>Click to join</span>
                                        {room.isPrivate && <span className="text-mytofy-accent-coral flex items-center gap-1"><Lock size={10} /> Password Required</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Password Modal for Private Rooms */}
      {passwordModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1b263b] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-8 relative">
              <button onClick={() => { setPasswordModal({ open: false, roomId: null, roomName: "" }); setJoinPassword(""); }} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                  <X size={20} />
              </button>
              
              <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-mytofy-accent-coral/20 flex items-center justify-center mb-4">
                      <Lock className="text-mytofy-accent-coral" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white font-secondary">Private Room</h3>
                  <p className="text-gray-400 text-sm mt-1">Enter the password for "{passwordModal.roomName}"</p>
              </div>

              <form onSubmit={handleJoinPrivateRoom} className="space-y-4">
                  <input
                      type="password"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Enter room password..."
                      className="w-full bg-black/30 text-white px-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-mytofy-accent-coral transition-colors"
                      autoFocus
                  />
                  <button
                      type="submit"
                      disabled={joining}
                      className="w-full py-3 bg-mytofy-accent-coral text-white font-bold rounded-lg hover:bg-mytofy-accent-hover transition shadow-lg"
                  >
                      {joining ? 'Joining...' : 'Join Room'}
                  </button>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
