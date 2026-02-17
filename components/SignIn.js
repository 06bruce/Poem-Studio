'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

export default function SignIn({ onSuccess, onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signin } = useAuth();

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

  return (
    <div className="max-w-md mx-auto p-10 rounded-[2.5rem] glass relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-colors duration-700"></div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black tracking-tight text-slate-100 mb-2">Welcome Back</h2>
        <p className="text-slate-500 text-sm font-medium">Rejoin the sanctuary of words</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-medium animate-fadeIn">
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-800/30 border border-slate-700/50 focus-within:border-blue-500/50 transition-all duration-300 group/input">
            <FiMail size={20} className="text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="poet@example.com"
              className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-600"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Secret Key</label>
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-800/30 border border-slate-700/50 focus-within:border-blue-500/50 transition-all duration-300 group/input">
            <FiLock size={20} className="text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-600"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white transition-all duration-300 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Transcending...</span>
            </>
          ) : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-white/5">
        <p className="text-slate-500 text-sm font-medium">
          New to the studio?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
