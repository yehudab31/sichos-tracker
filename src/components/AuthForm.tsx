import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
    setGoogleLoading(false);
  };

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
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-[#ddd4c0] bg-white text-[#1c1610] placeholder:text-[#4a3f30]/40 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a3f30]/50 hover:text-[#4a3f30] transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#ddd4c0]" />
        <span className="text-xs text-[#4a3f30]/60">or</span>
        <div className="flex-1 h-px bg-[#ddd4c0]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 border border-[#ddd4c0] bg-white text-[#1c1610] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f3ed] disabled:opacity-60 transition-colors duration-150"
      >
        {googleLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
        )}
        Continue with Google
      </button>
    </div>
  );
}
