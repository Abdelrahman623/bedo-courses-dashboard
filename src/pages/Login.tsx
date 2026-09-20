import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Database, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const Login: React.FC = () => {
  const { isSupabaseConfigured } = useAuth();
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

    // Row Level Security means a logged-out visitor can't read public.profiles
    // directly any more (that's the point — it used to expose every account's
    // email). This SECURITY DEFINER RPC answers the one question the login
    // screen needs and nothing else. See supabase_admin_security.sql.
    const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
      p_username: clean,
    });

    if (rpcErr || !rpcEmail) {
      throw new Error(`No account found with username "${clean}". Please verify your username or sign in with your email.`);
    }

    return rpcEmail as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file, then reload.');
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

        // Check if username is already taken (RLS-safe: returns a bare boolean,
        // never anyone's id or email).
        const { data: usernameTaken } = await supabase.rpc('username_exists', {
          p_username: cleanUsername,
        });

        if (usernameTaken) {
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

        // Supabase returns a user with an EMPTY identities array (no error) when the
        // email is already registered — this is intentional, to prevent account
        // enumeration. Detect it so we don't falsely tell the user to "check email".
        const alreadyRegistered = !!data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

        if (alreadyRegistered) {
          throw new Error('This email is already registered. Try signing in instead, or use "Forgot password" if you don\'t remember your password.');
        }

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
          setSuccess(`Account created for @${cleanUsername}! Check your email inbox (and spam folder) for a confirmation link, then sign in.`);
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
    <div className="min-h-screen bg-gradient-to-b from-[#111A24] via-[#0D141C] to-[#080B10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-18%] left-[-12%] w-[520px] h-[520px] rounded-full bg-accent-secondary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-22%] right-[-12%] w-[480px] h-[480px] rounded-full bg-accent-tertiary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] rounded-full bg-accent-amber/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="brand-logo-glow relative flex items-center justify-center w-12 h-12 rounded-[14px] bg-[#081722] border flex-shrink-0 overflow-hidden">
            <img src="/nl-logo.png" alt="Noname Learn" className="w-9 h-9 object-contain" />
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="font-bold text-2xl leading-none tracking-tight text-white">Noname</span>
            <span className="text-accent-secondary text-2xl leading-none font-semibold tracking-tight">learn</span>
          </div>
        </div>

        {/* Supabase configuration warning */}
        {!isSupabaseConfigured && (
          <div className="mb-4 bg-[#131722] border border-rose-500/25 rounded-xl p-3 flex items-center gap-2 text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <Database size={14} className="text-rose-400 flex-shrink-0" />
            <span className="text-zinc-400">
              Not connected to Supabase. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file — every account and all of its data lives in Supabase, so sign-in won't work without it.
            </span>
          </div>
        )}

        {/* Card */}
        <div className="bg-[#131722] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/40">
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
              <h1 className="text-xl font-bold text-white tracking-tight">{modeConfig[mode].title}</h1>
              <p className="text-sm text-zinc-400 mt-1">{modeConfig[mode].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Error / Success banners */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5 mb-4 text-sm text-rose-400"
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
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 mb-4 text-sm text-emerald-400"
              >
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* SIGN IN: Email OR Username */}
            {mode === 'signin' && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>
            )}

            {/* SIGN UP: Username field */}
            {mode === 'signup' && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Username (e.g. bedo)"
                  value={username}
                  onChange={e => { setUsername(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-accent-amber/50 transition-colors font-mono"
                />
              </div>
            )}

            {/* SIGN UP or FORGOT: Email field */}
            {mode !== 'signin' && (
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type={mode === 'forgot' ? 'text' : 'email'}
                  placeholder={mode === 'forgot' ? 'Username or Email address' : 'Email address'}
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearMessages(); }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>
            )}

            {/* Password (for signin & signup) */}
            {mode !== 'forgot' && (
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearMessages(); }}
                  required
                  className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-accent-amber/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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
                  className="text-xs text-zinc-400 hover:text-accent-amber transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-accent-gradient w-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] text-[#0D1017] font-semibold text-sm rounded-lg py-2.5 transition-all duration-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-1 cursor-pointer"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {modeConfig[mode].cta}
            </button>
          </form>

          {/* Mode switch */}
          <div className="mt-4 text-center text-sm text-zinc-400">
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

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-5">
          Secured by Supabase Auth & PostgreSQL 🔒
        </p>
      </motion.div>
    </div>
  );
};
