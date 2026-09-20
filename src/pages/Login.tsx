import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sparkles, Database, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const Login: React.FC = () => {
  const { signInDemo, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [identifier, setIdentifier] = useState(''); // Email OR Username for sign in
  const [username, setUsername] = useState('');     // Username for sign up
  const [email, setEmail] = useState('');           // Email for sign up & forgot
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  // Helper to resolve a username to an email address
  const resolveEmailFromIdentifier = async (val: string): Promise<string> => {
    const clean = val.trim();
    if (clean.includes('@')) {
      return clean; // Already an email
    }

    // Try RPC function first (defined in SQL migration)
    try {
      const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
        p_username: clean,
      });
      if (!rpcErr && rpcEmail) {
        return rpcEmail as string;
      }
    } catch {
      // Fallback to direct query below
    }

    // Fallback: Query profiles table directly
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', clean)
      .maybeSingle();

    if (profErr || !prof?.email) {
      throw new Error(`No account found with username "${clean}". Please verify your username or sign in with your email.`);
    }

    return prof.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env, or use Demo Mode below.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const targetEmail = await resolveEmailFromIdentifier(identifier);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        if (error) throw error;

        // STRICT: check profile exists in public.profiles — if deleted, block login
        if (data?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!prof) {
            // Profile was deleted — sign out immediately and tell user to re-register
            await supabase.auth.signOut();
            throw new Error('Account profile not found. Your account may have been deleted. Please create a new account.');
          }
        }
      } else if (mode === 'signup') {
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        // Validate username format
        if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
          throw new Error('Username must be 3-24 characters and only contain letters, numbers, underscores, or hyphens.');
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error(`Username "${cleanUsername}" is already taken. Please choose another username.`);
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanUsername,
              name: cleanUsername,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Ensure profiles table has username and email recorded
        if (data?.user) {
          const { error: profileErr } = await supabase.from('profiles').upsert({
            id: data.user.id,
            username: cleanUsername,
            email: cleanEmail,
            name: cleanUsername,
            weekly_goal_hours: 10,
          }, { onConflict: 'id' });
          if (profileErr) {
            console.warn('[SignUp] Profile creation note:', profileErr.message);
          } else {
            console.log('[SignUp] Profile created in public.profiles for @' + cleanUsername);
          }
        }

        if (data?.session) {
          // Instantly authenticated!
        } else {
          setSuccess(`Account created for @${cleanUsername}! If confirmation is required, check your email inbox to verify, then sign in.`);
        }
      } else {
        // Forgot password: can use email or username
        const targetEmail = await resolveEmailFromIdentifier(email || identifier);
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess(`Password reset email sent to ${targetEmail} — check your inbox.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = {
    signin: { title: 'Welcome back', subtitle: 'Sign in with your username or email', cta: 'Sign In' },
    signup: { title: 'Create account', subtitle: 'Choose a username and set up your profile', cta: 'Create Account' },
    forgot: { title: 'Reset password', subtitle: "Enter your username or email for a reset link", cta: 'Send Reset Link' },
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-amber/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent-mint/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-amber flex items-center justify-center shadow-glow">
            <GraduationCap size={20} className="text-bg-base" />
          </div>
          <span className="text-xl font-bold text-txt-primary">
            Bedo<span className="text-accent-amber"> Learn</span>
          </span>
        </div>

        {/* Local / Supabase Mode Banner */}
        {!isSupabaseConfigured && (
          <div className="mb-4 bg-bg-surface border border-accent-amber/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-txt-muted">
              <Database size={14} className="text-accent-amber flex-shrink-0" />
              <span>Offline demo ready. No Supabase keys required.</span>
            </div>
            <button
              onClick={signInDemo}
              className="flex-shrink-0 px-2.5 py-1 bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber rounded-lg font-medium transition-colors cursor-pointer"
            >
              Enter Demo
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-8 shadow-card">
          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-xl font-bold text-txt-primary">{modeConfig[mode].title}</h1>
              <p className="text-sm text-txt-muted mt-1">{modeConfig[mode].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Error / Success banners */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-accent-coral/10 border border-accent-coral/20 rounded-xl px-3 py-2.5 mb-4 text-sm text-accent-coral"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-accent-mint/10 border border-accent-mint/20 rounded-xl px-3 py-2.5 mb-4 text-sm text-accent-mint"
              >
                ✓ {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* SIGN IN: Email OR Username */}
            {mode === 'signin' && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-bg-surface2 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>
            )}

            {/* SIGN UP: Username field */}
            {mode === 'signup' && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Username (e.g. bedo)"
                  value={username}
                  onChange={e => { setUsername(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-bg-surface2 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>
            )}

            {/* SIGN UP or FORGOT: Email field */}
            {mode !== 'signin' && (
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
                <input
                  type={mode === 'forgot' ? 'text' : 'email'}
                  placeholder={mode === 'forgot' ? 'Username or Email address' : 'Email address'}
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-bg-surface2 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>
            )}

            {/* Password (for signin & signup) */}
            {mode !== 'forgot' && (
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearMessages(); }}
                  required
                  className="w-full bg-bg-surface2 border border-white/8 rounded-xl pl-9 pr-10 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted outline-none focus:border-accent-amber/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); clearMessages(); }}
                  className="text-xs text-txt-muted hover:text-accent-amber transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent-amber hover:bg-accent-amber/90 text-bg-base font-semibold text-sm rounded-xl py-2.5 transition-colors shadow-glow disabled:opacity-60 mt-1 cursor-pointer"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {modeConfig[mode].cta}
            </button>
          </form>

          {/* Mode switch */}
          <div className="mt-4 text-center text-sm text-txt-muted">
            {mode === 'signin' && (
              <>Don't have an account yet?{' '}
                <button onClick={() => { setMode('signup'); clearMessages(); }} className="text-accent-amber hover:underline font-medium cursor-pointer">
                  Create an account
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); clearMessages(); }} className="text-accent-amber hover:underline font-medium cursor-pointer">
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button onClick={() => { setMode('signin'); clearMessages(); }} className="text-accent-amber hover:underline font-medium cursor-pointer">
                ← Back to sign in
              </button>
            )}
          </div>

          {/* Demo Mode Button */}
          <div className="mt-5 pt-4">
            <button
              type="button"
              onClick={signInDemo}
              className="w-full flex items-center justify-center gap-2 bg-bg-surface2 hover:bg-white/6 border border-accent-amber/30 text-accent-amber text-xs font-medium rounded-xl py-2 transition-all duration-150 cursor-pointer"
            >
              <Sparkles size={14} />
              Skip Login & Explore in Demo Mode
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-txt-muted mt-5">
          Secured by Supabase Auth & PostgreSQL 🔒
        </p>
      </motion.div>
    </div>
  );
};
