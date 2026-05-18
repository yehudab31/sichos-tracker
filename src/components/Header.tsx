import { BookOpen, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
}

export default function Header({ user }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
            <nav className="hidden md:flex items-center gap-5">
              <span className="text-xs text-[#4a3f30] truncate max-w-[180px]">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-[#4a3f30] hover:text-red-600 transition-colors duration-150"
              >
                <LogOut size={14} />
                Log Out
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-[#4a3f30]">Sign in to start tracking</span>
            </nav>
          )}

          {user && (
            <button
              className="md:hidden p-2 rounded-md text-[#4a3f30] hover:bg-[#f7f3ed] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="md:hidden bg-white border-t border-[#ddd4c0] px-4 py-3 space-y-2">
          <div className="text-xs text-[#4a3f30] truncate py-1">{user.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 py-2"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      )}
    </header>
  );
}
