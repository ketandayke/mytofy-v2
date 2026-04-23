import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/home';
  
  const [isLogin, setIsLogin] = useState(searchParams.get('tab') !== 'signup');
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    setIsLogin(searchParams.get('tab') !== 'signup');
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
      
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload, {
          withCredentials: true
      });
      
      if (data.success) {
          toast.success(data.message);
          login(data.data.user);
          navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center bg-mytofy-dark-blue px-4">
      <div className="w-full max-w-4xl bg-[#1b263b] rounded-2xl shadow-2xl overflow-hidden flex border border-white/5">
        
        {/* Left Branding Side */}
        <div className="w-1/2 hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[#1b263b] to-[#121a28] p-12 border-r border-white/5 relative">
            <div className="relative flex items-center justify-center mb-8">
                <span className="text-mytofy-accent-coral">
                <Play fill="currentColor" size={64} />
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-mytofy-fade-green h-20 text-7xl animate-pulse">
                    ♪
                </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 font-secondary tracking-wide text-center">
                Join the Vibe.
            </h1>
            <p className="text-mytofy-text-secondary text-center text-lg">
                Your music, your friends, in perfect sync.
            </p>
            {/* Decorative element */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-mytofy-dark-blue/20 to-transparent"></div>
        </div>

        {/* Right Auth Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 relative">
            {/* Tabs */}
            <div className="flex w-full mb-8 bg-black/20 rounded-lg p-1">
                <button 
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all duration-300 ${isLogin ? 'bg-[#1b263b] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Login
                </button>
                <button 
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-all duration-300 ${!isLogin ? 'bg-[#1b263b] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
                <div>
                <label className="block text-sm font-medium text-mytofy-text-secondary mb-1">Username</label>
                <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className="w-full px-4 py-3 rounded bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-mytofy-fade-green transition-shadow border border-white/5"
                    required
                />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-mytofy-text-secondary mb-1">Email</label>
                <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. johndoe@gmail.com"
                className="w-full px-4 py-3 rounded bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-mytofy-fade-green transition-shadow border border-white/5"
                required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-mytofy-text-secondary mb-1">Password</label>
                <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-mytofy-fade-green transition-shadow border border-white/5"
                required
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 mt-4 rounded bg-mytofy-accent-coral text-white font-semibold hover:bg-mytofy-accent-hover transition-colors shadow-lg shadow-mytofy-accent-coral/20 flex justify-center items-center gap-2"
            >
                {loading ? <span className="animate-pulse">Processing...</span> : (isLogin ? 'Login' : 'Create Account')}
            </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4">
                <div className="h-[1px] bg-white/10 w-1/4"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="h-[1px] bg-white/10 w-1/4"></div>
            </div>

            <button 
            className="w-full py-3 mt-6 rounded border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex justify-center items-center gap-2"
            >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
            </button>
        </div>
      </div>
    </div>
  );
}
