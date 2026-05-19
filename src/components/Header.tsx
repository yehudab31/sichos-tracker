import { BookOpen, LogOut, Share2, Check, Star, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type AppView = 'shelf' | 'favorites' | 'bookmarks';

interface Props {
  user: User | null;
  view: AppView;
  onViewChange: (v: AppView) => void;
}

export default function Header({ user, view, onViewChange }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleShare() {
    if (!user) return;
    const url = `${window.location.origin}?share=${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy your share link:', url);
    }
  }

  return (
    <header className="bg-white border-b border-[#ddd4c0] sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — clicking returns to shelf */}
          <button
            onClick={() => onViewChange('shelf')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-[#0B1F3A] rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen size={18} className="text-white" strokeWidth={2} />
            </div>
            <div className="text-left">
              <span className="text-[#1c1610] font-semibold text-lg tracking-tight block leading-tight">Sichos Tracker</span>
              <span className="hidden sm:block text-[10px] text-[#4a3f30] tracking-widest uppercase leading-tight">Likkutei Sichos</span>
            </div>
          </button>

          {user ? (
            <nav className="flex items-center gap-2">
              <span className="hidden lg:block text-xs text-[#4a3f30] truncate max-w-[160px] mr-1">{user.email}</span>

              {/* Favorites tab */}
              <button
                onClick={() => onViewChange(view === 'favorites' ? 'shelf' : 'favorites')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  view === 'favorites'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'text-[#4a3f30] border-[#ddd4c0] hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                <Star size={12} fill={view === 'favorites' ? '#d97706' : 'none'} />
                <span className="hidden sm:inline">Favorites</span>
              </button>

              {/* Bookmarks tab */}
              <button
                onClick={() => onViewChange(view === 'bookmarks' ? 'shelf' : 'bookmarks')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  view === 'bookmarks'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'text-[#4a3f30] border-[#ddd4c0] hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Bookmark size={12} fill={view === 'bookmarks' ? '#3b82f6' : 'none'} />
                <span className="hidden sm:inline">Bookmarks</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  copied
                    ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                    : 'text-[#4a3f30] border-[#ddd4c0] hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
                }`}
                title="Copy shareable link"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>

              {/* Log out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-[#4a3f30] hover:text-red-600 transition-colors ml-1"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </nav>
          ) : (
            <span className="text-sm text-[#4a3f30] hidden md:block">Sign in to start tracking</span>
          )}
        </div>
      </div>
    </header>
  );
}
