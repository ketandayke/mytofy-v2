import React, { useState } from 'react';
import { X, User, Mail, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePanel({ isOpen, onClose }) {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      toast.error("Fields cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/profile`,
        { username: username.trim(), email: email.trim() },
        { withCredentials: true }
      );
      updateUser(data.data);
      toast.success("Profile updated!");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/profile`,
        { withCredentials: true }
      );
      toast.success("Account deleted.");
      logout();
      navigate('/');
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#121a28] border-l border-white/10 shadow-2xl z-[70] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white font-secondary">Your Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition">
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 rounded-full bg-mytofy-fade-green/20 border-2 border-mytofy-fade-green/50 flex items-center justify-center mb-4">
            <User className="text-mytofy-fade-green" size={36} />
          </div>
          <p className="text-white font-bold text-lg">{user?.username}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="px-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/30 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-mytofy-fade-green transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 text-white pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-mytofy-fade-green transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-mytofy-fade-green text-[#1b263b] font-bold rounded-lg hover:bg-mytofy-fade-green/90 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="px-6 mt-10 border-t border-white/5 pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Danger Zone</p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 size={16} /> Delete My Account
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={16} />
                <span className="font-bold text-sm">This action is irreversible</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">All your data, rooms, and messages will be permanently deleted.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded text-sm font-bold hover:bg-red-600 transition"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
