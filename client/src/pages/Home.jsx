import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center">
      {/* Left Content */}
      <div className="w-1/2 pl-16 pr-8 z-10">
        <h1 className="text-6xl font-bold text-mytofy-text-primary mb-6 leading-tight font-secondary tracking-wide">
          Your World.<br />
          Your Music.<br />
          Together
        </h1>
        <p className="text-mytofy-text-secondary text-xl mb-10 leading-relaxed font-primary max-w-md">
          Dive into shared listening rooms, be the DJ, and chat with friends in real-time.
        </p>
        <Link to="/auth?tab=signup" className="inline-block px-8 py-3 rounded bg-mytofy-accent-coral text-white font-medium text-lg hover:bg-mytofy-accent-hover transition-colors shadow-lg shadow-mytofy-accent-coral/30">
          Get started - it's free
        </Link>
      </div>
      
      {/* Right Content - Abstract visualization placeholder */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center relative">
        <div className="text-center z-10 backdrop-blur-sm bg-mytofy-dark-blue/30 p-8 rounded-2xl border border-mytofy-fade-green/20">
            <h2 className="text-4xl font-bold text-mytofy-text-primary mb-2 font-secondary">Feel the Music</h2>
            <p className="text-mytofy-fade-green text-xl font-medium tracking-widest mb-6">Sync. Vibe. Play. Together.</p>
            
            {/* Simple audio visualizer bar placeholder */}
            <div className="flex items-end justify-center gap-1 h-16">
                {[...Array(15)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-2 bg-mytofy-accent-coral rounded-t"
                        style={{
                            height: `${Math.max(20, Math.random() * 100)}%`,
                            opacity: 0.8 - (Math.abs(7 - i) * 0.05)
                        }}
                    ></div>
                ))}
            </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-tr from-mytofy-dark-blue to-[#2a6f9a] opacity-50 pointer-events-none" style={{ clipPath: 'polygon(20% 0%, 100% 0, 100% 100%, 0% 100%)' }}></div>
      </div>
    </div>
  );
}
