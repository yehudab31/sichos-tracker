import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else if (data.session) {
        // Auto-confirmed: user is now logged in, state change will re-render App
      } else {
        setConfirmationNeeded(true);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  if (confirmationNeeded) {
    return (
      <div className="max-w-sm mx-auto text-center py-10">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={20} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-[#1c1610] mb-2">Check your email</h2>
        <p className="text-sm text-[#4a3f30] mb-6">
          We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
        <button
          onClick={() => { setConfirmationNeeded(false); setMode('login'); }}
          className="text-sm font-medium text-[#0B1F3A] hover:underline"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Tab toggle */}
      <div className="flex rounded-lg bg-[#f7f3ed] p-1 mb-6">
        <button
          onClick={() => { setMode('login'); setError(''); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors duration-150 ${
            mode === 'login' ? 'bg-white text-[#1c1610] shadow-sm' : 'text-[#4a3f30]'
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => { setMode('signup'); setError(''); }}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors duration-150 ${
            mode === 'signup' ? 'bg-white text-[#1c1610] shadow-sm' : 'text-[#4a3f30]'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[#4a3f30] uppercase tracking-wider mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/50" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-[#4a3f30] uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/50" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2.5 border border-red-100">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#0B1F3A] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#162d4f] disabled:opacity-60 transition-colors duration-150"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
