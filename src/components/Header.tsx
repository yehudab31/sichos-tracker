import { BookOpen, LogOut, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
}

export default function Header({ user }: Props) {
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleShare = async () => {
    if (!user) return;
    const url = `${window.location.origin}?share=${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard
      window.prompt('Copy your share link:', url);
    }
  };

  return (
    <header className="bg-white border-b border-[#ddd4c0] sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B1F3A] rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <span className="text-[#1c1610] font-semibold text-lg tracking-tight">Sichos Tracker</span>
              <span className="hidden sm:block text-[10px] text-[#4a3f30] tracking-widest uppercase ml-0.5 -mt-0.5">
                Likkutei Sichos
              </span>
            </div>
          </div>

          {user ? (
            <nav className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-[#4a3f30] truncate max-w-[180px]">{user.email}</span>

              {/* Share button */}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  copied
                    ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                    : 'text-[#4a3f30] border-[#ddd4c0] hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
                }`}
                title="Copy shareable link to your progress"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-[#4a3f30] hover:text-red-600 transition-colors duration-150"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-[#4a3f30]">Sign in to start tracking</span>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
