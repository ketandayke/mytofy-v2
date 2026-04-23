import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfilePanel from './ProfilePanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (location.pathname.startsWith('/room/')) return null;

  return (
    <>
    <nav className="w-full bg-[#1b263b] shadow-md py-4 px-8 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="relative flex items-center justify-center">
            <span className="text-mytofy-accent-coral opacity-80 group-hover:opacity-100 transition-opacity">
               <Play fill="currentColor" size={24} />
            </span>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-mytofy-fade-green h-8 text-2xl animate-pulse">
                ♪
            </span>
        </div>
        <span className="text-mytofy-text-primary text-2xl font-bold font-secondary tracking-wide">
          Mytofy
        </span>
      </Link>
      
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link to="/home" className="px-6 py-2 rounded border border-mytofy-fade-green text-mytofy-fade-green hover:bg-mytofy-fade-green hover:text-[#1b263b] transition-colors duration-300 font-medium">
              Dashboard
            </Link>
            <div className="relative">
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full bg-mytofy-fade-green/20 flex items-center justify-center border border-mytofy-fade-green/50 hover:bg-mytofy-fade-green/30 transition"
                >
                    <User className="text-mytofy-fade-green" size={20} />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#121a28] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1">
                        <div className="px-4 py-2 border-b border-white/5">
                            <p className="text-sm text-white font-medium truncate">{user.username}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button 
                            onClick={() => { setProfileOpen(true); setDropdownOpen(false); }} 
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition"
                        >
                            <Settings size={16} /> Profile Settings
                        </button>
                        <button 
                            onClick={() => { logout(); setDropdownOpen(false); }} 
                            className="w-full text-left px-4 py-2 text-sm text-mytofy-accent-coral hover:bg-white/5 flex items-center gap-2 transition"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>
          </>
        ) : (
          <>
            <Link to="/auth?tab=login" className="px-6 py-2 rounded border border-mytofy-fade-green text-mytofy-text-primary hover:bg-mytofy-fade-green hover:text-[#1b263b] transition-colors duration-300 font-medium">
              Login
            </Link>
            <Link to="/auth?tab=signup" className="px-6 py-2 rounded bg-mytofy-accent-coral text-white hover:bg-mytofy-accent-hover transition-colors duration-300 font-medium shadow-lg shadow-mytofy-accent-coral/20">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
    
    <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

