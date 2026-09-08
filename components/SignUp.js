'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { signIn } from "next-auth/react";

function AuthHeader({ onBack, onToggleForm }) {
  return (
    <div className="relative flex flex-col items-center pt-2 pb-8">
      <button
        onClick={onBack}
        className="absolute top-1 left-0 p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-200 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Go Back"
        aria-label="Go back"
      >
        <FiArrowLeft size={18} />
      </button>

      <div className="relative w-14 h-14 mb-5">
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-fuchsia-500/40 to-blue-500/40 blur-lg"></div>
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-600 via-indigo-500 to-blue-500 p-[1.5px] shadow-2xl shadow-purple-900/50 ring-1 ring-white/20">
          <div className="w-full h-full rounded-[0.92rem] bg-slate-950 flex items-center justify-center font-cosmic text-xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            P
          </div>
        </div>
      </div>

      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Poem Studio</span>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 w-full max-w-[240px]">
        <button
          type="button"
          onClick={onToggleForm}
          className="py-2.5 rounded-xl text-slate-400 text-sm font-bold hover:text-slate-100 transition-colors duration-300"
        >
          Sign In
        </button>
        <button
          type="button"
          className="py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600/90 to-purple-600/90 text-white text-sm font-bold shadow-lg shadow-purple-900/30 ring-1 ring-white/10 transition-all duration-300"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="group/field">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">{label}</label>
      <div className="mt-2 flex items-center gap-3 px-4 h-12 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 group-focus-within/field:ring-fuchsia-500/50 group-focus-within/field:bg-white/[0.06] transition-all duration-300">
        <Icon className="text-slate-500 group-focus-within/field:text-fuchsia-400 transition-colors flex-shrink-0" size={16} />
        {children}
      </div>
    </div>
  );
}

export default function SignUp({ onSuccess, onToggleForm, onClose }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !username || !password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signup(email, username, password);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="relative overflow-hidden max-w-md mx-auto p-6 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/[0.07] via-transparent to-blue-600/[0.07] pointer-events-none"></div>

      <AuthHeader onBack={onClose} onToggleForm={onToggleForm} />

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/25 flex items-center gap-3 text-red-400 text-sm font-medium animate-fadeIn" role="alert">
          <FiAlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Field label="Email Address" icon={FiMail}>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="poet@example.com"
            className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
            disabled={loading}
            autoComplete="email"
          />
        </Field>

        <Field label="Pseudonym" icon={FiUser}>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose your moniker"
            className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
            disabled={loading}
            autoComplete="username"
          />
        </Field>

        <div>
          <Field label="Secret Key" icon={FiLock}>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </Field>
          <p className="text-[10px] text-slate-600 mt-2 px-1 font-bold uppercase tracking-widest italic">Minimum 6 characters of essence</p>
        </div>

        <div className="pt-1 space-y-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-[length:200%_auto] bg-left hover:bg-right transition-[background-position] duration-500 shadow-lg shadow-purple-900/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Initiating...
              </>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Join the Studio <FiArrowRight size={16} />
              </span>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 text-slate-600 font-bold tracking-widest text-[10px]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google")}
            className="w-full h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 hover:ring-white/20 font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 group/google"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign Up with Google
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
        The sanctuary keeps your verses safe
      </p>
    </div>
  );
}