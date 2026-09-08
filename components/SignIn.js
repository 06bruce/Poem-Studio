'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff,
  FiCopy, FiCheck, FiKey, FiCheckCircle
} from 'react-icons/fi';
import { signIn } from "next-auth/react";

const views = {
  signin: {
    title: 'Welcome Back',
    sub: 'Your words have missed you.'
  },
  forgot: {
    title: 'Lost the Key?',
    sub: 'Tell us your email and we\'ll forge a new one.'
  },
  reset: {
    title: 'Forge a New Key',
    sub: 'Your code is ready. Restore your password below.'
  },
  done: {
    title: 'Password Restored',
    sub: 'Your sanctuary is unlocked again.'
  }
};

function AuthHeader({ view, onBack, onToggleForm }) {
  const heading = views[view];
  const showTab = view === 'signin';

  return (
    <div className="relative flex flex-col items-center pt-2 pb-8">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-1 left-0 p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-200 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Go Back"
          aria-label="Go back"
        >
          <FiArrowLeft size={18} />
        </button>
      )}

      <div className="relative w-14 h-14 mb-5">
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/40 to-fuchsia-500/40 blur-lg"></div>
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-600 p-[1.5px] shadow-2xl shadow-blue-900/50 ring-1 ring-white/20">
          <div className="w-full h-full rounded-[0.92rem] bg-slate-950 flex items-center justify-center font-cosmic text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            P
          </div>
        </div>
      </div>

      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Poem Studio</span>

      {showTab ? (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/[0.04] ring-1 ring-white/10 w-full max-w-[240px]">
          <button
            type="button"
            className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white text-sm font-bold shadow-lg shadow-blue-900/30 ring-1 ring-white/10 transition-all duration-300"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onToggleForm}
            className="py-2.5 rounded-xl text-slate-400 text-sm font-bold hover:text-slate-100 transition-colors duration-300"
          >
            Sign Up
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl sm:text-[1.7rem] font-black tracking-tight text-slate-100 text-center leading-tight">
            {heading.title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 font-medium text-center">{heading.sub}</p>
        </>
      )}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="group/field">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">{label}</label>
      <div className="mt-2 flex items-center gap-3 px-4 h-12 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 group-focus-within/field:ring-blue-500/50 group-focus-within/field:bg-white/[0.06] transition-all duration-300">
        <Icon className="text-slate-500 group-focus-within/field:text-blue-400 transition-colors flex-shrink-0" size={16} />
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({ loading, loadingLabel, children, type = 'submit' }) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full h-12 rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] bg-left hover:bg-right transition-[background-position,opacity,transform] duration-500 shadow-lg shadow-blue-900/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {loadingLabel}
        </>
      ) : children}
    </button>
  );
}

export default function SignIn({ onSuccess, onToggleForm, onClose }) {
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signin } = useAuth();

  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    const result = await signin(email, password);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetEmail) {
      setError('Enter the email tied to your account');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setResetToken(data.resetToken || '');
      setView('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setView('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(resetToken);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const goBack = () => {
    if (view === 'signin') onClose();
    else setView('signin');
  };

  const renderError = () =>
    error && (
      <div className="mb-6 p-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/25 flex items-center gap-3 text-red-400 text-sm font-medium animate-fadeIn" role="alert">
        <FiAlertCircle size={18} className="flex-shrink-0" />
        {error}
      </div>
    );

  return (
    <div className="relative overflow-hidden max-w-md mx-auto p-6 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.07] via-transparent to-fuchsia-600/[0.07] pointer-events-none"></div>

      <AuthHeader
        view={view}
        onBack={goBack}
        onToggleForm={onToggleForm}
      />

      {renderError()}

      {view === 'signin' && (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Field label="Email Address" icon={FiMail}>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="poet@example.com"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
              disabled={loading}
              autoComplete="email"
            />
          </Field>

          <div>
            <Field label="Secret Key" icon={FiLock}>
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
                disabled={loading}
                autoComplete="current-password"
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
            <div className="flex justify-end mt-2 pr-1">
              <button
                type="button"
                onClick={() => { setError(''); if (!resetEmail && email) setResetEmail(email); setView('forgot'); }}
                className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors duration-300"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div className="pt-1 space-y-5">
            <PrimaryButton loading={loading} loadingLabel="Transcending...">
              <span className="flex items-center justify-center gap-2">
                Sign In <FiArrowRight size={16} />
              </span>
            </PrimaryButton>

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
              Sign In with Google
            </button>
          </div>
        </form>
      )}

      {view === 'forgot' && (
        <form onSubmit={handleForgotSubmit} className="space-y-6" noValidate>
          <div className="rounded-2xl p-4 bg-white/[0.03] ring-1 ring-white/10 flex items-center gap-3 mb-2">
            <FiKey className="text-blue-400 flex-shrink-0" size={18} />
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your email and we&apos;ll hand you a one-time code to restore your password. It expires in 15 minutes.
            </p>
          </div>

          <Field label="Email Address" icon={FiMail}>
            <input
              id="forgot-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="poet@example.com"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
              disabled={loading}
              autoComplete="email"
            />
          </Field>

          <PrimaryButton loading={loading} loadingLabel="Summoning...">
            <span className="flex items-center justify-center gap-2">
              Send Reset Code <FiArrowRight size={16} />
            </span>
          </PrimaryButton>
        </form>
      )}

      {view === 'reset' && (
        <form onSubmit={handleResetSubmit} className="space-y-6" noValidate>
          <div className="rounded-2xl p-4 bg-emerald-500/[0.07] ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1.5">Your reset code</p>
                <code className="block font-mono text-xs sm:text-sm text-emerald-200 break-all leading-snug">{resetToken}</code>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="flex-shrink-0 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Copy reset code"
              >
                {codeCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
              </button>
            </div>
          </div>

          <Field label="New Secret Key" icon={FiLock}>
            <input
              id="reset-password"
              type={showResetPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="text-slate-500 hover:text-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
              aria-label={showResetPassword ? 'Hide password' : 'Show password'}
            >
              {showResetPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </Field>

          <Field label="Confirm New Key" icon={FiLock}>
            <input
              id="confirm-password"
              type={showResetPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm min-w-0"
              disabled={loading}
              autoComplete="new-password"
            />
          </Field>
          <p className="text-[10px] text-slate-600 mt-1 px-1 font-bold uppercase tracking-widest -mt-3">Minimum 6 characters of essence</p>

          <PrimaryButton loading={loading} loadingLabel="Forging...">
            <span className="flex items-center justify-center gap-2">
              Restore Password <FiArrowRight size={16} />
            </span>
          </PrimaryButton>
        </form>
      )}

      {view === 'done' && (
        <div className="flex flex-col items-center text-center">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 blur-xl"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-900/40 ring-1 ring-white/20">
              <FiCheckCircle className="text-white" size={30} />
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-100">Password Restored</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Sign in with your new secret key.</p>
          <button
            type="button"
            onClick={() => {
              setView('signin');
              setError('');
              setResetToken('');
              setNewPassword('');
              setConfirmPassword('');
              setPassword('');
              if (resetEmail) setEmail(resetEmail);
            }}
            className="mt-8 w-full h-12 rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] bg-left hover:bg-right transition-[background-position] duration-500 shadow-lg shadow-blue-900/40 active:scale-[0.98]"
          >
            Return to Sign In
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
        The sanctuary keeps your verses safe
      </p>
    </div>
  );
}