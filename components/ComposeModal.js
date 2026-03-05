import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronDown, FiSend, FiZap, FiEdit3, FiMusic, FiCheckCircle, FiStar, FiSmile } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../contexts/ToastContext';

const moods = ['neutral', 'happy', 'sad', 'peaceful', 'mysterious'];
const themes = ['love', 'nature', 'life', 'loss', 'hope', 'freedom', 'solitude', 'dream', 'general'];

export default function ComposeModal({ isOpen, onClose, onPoemCreated, dailyPrompt = null }) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('neutral');
    const [theme, setTheme] = useState('general');
    const [showOptions, setShowOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [usePrompt, setUsePrompt] = useState(false);
    const [isMuseLoading, setIsMuseLoading] = useState(false);
    const [museSuggestion, setMuseSuggestion] = useState('');
    const textareaRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => titleRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMood('neutral');
        setTheme('general');
        setShowOptions(false);
        setUsePrompt(false);
        setMuseSuggestion('');
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Give your poem a title and some words');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const body = {
                title: title.trim(),
                content: content.trim(),
                mood,
                theme,
            };

            if (usePrompt && dailyPrompt) {
                body.promptTag = dailyPrompt.tag;
            }

            const response = await fetch('/api/poems', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to publish');
            }

            const newPoem = await response.json();
            toast.success('Your poem is live ✨');
            onPoemCreated?.(newPoem);
            resetForm();
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMuseAction = async (type) => {
        if (!content.trim() && type !== 'complete') {
            toast.error('Write something first for the Muse to work with');
            return;
        }

        setIsMuseLoading(true);
        setMuseSuggestion('');
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'assist_writing',
                    payload: { currentText: content, type }
                })
            });
            const data = await response.json();
            if (data.suggestion) {
                setMuseSuggestion(data.suggestion);
            } else {
                throw new Error(data.error || 'Muse is silent');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsMuseLoading(false);
        }
    };

    const handleAutoTag = async () => {
        if (!content.trim()) {
            toast.error('Write something first for the Muse to analyze');
            return;
        }

        setIsMuseLoading(true);
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze',
                    payload: { content }
                })
            });
            const data = await response.json();
            if (data.mood && data.theme) {
                setMood(data.mood);
                setTheme(data.theme);
                toast.success(`Detected: ${data.mood} & ${data.theme} ✨`);
            } else {
                throw new Error(data.error || 'Muse couldn\'t decide');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsMuseLoading(false);
        }
    };

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const lineCount = content.split('\n').filter(l => l.trim()).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
                <button
                    onClick={() => { resetForm(); onClose(); }}
                    className="p-2 rounded-xl hover:bg-white/5 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close"
                >
                    <FiX size={22} className="text-slate-400" />
                </button>
                <h2 className="text-base font-bold text-slate-200">New Poem</h2>
                <button
                    onClick={handleSubmit}
                    disabled={saving || !title.trim() || !content.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all disabled:opacity-40 disabled:bg-slate-700 active:scale-95 min-h-[44px] flex items-center gap-2"
                >
                    <FiSend size={14} />
                    {saving ? 'Posting...' : 'Publish'}
                </button>
            </div>

            {/* Daily Prompt Banner */}
            {dailyPrompt && (
                <button
                    onClick={() => {
                        setUsePrompt(!usePrompt);
                    }}
                    className={`mx-4 mt-3 p-3 rounded-xl border text-left transition-all text-sm ${usePrompt
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FiZap size={14} className={usePrompt ? 'text-amber-400' : 'text-slate-500'} />
                        <span className="font-semibold text-xs uppercase tracking-wider">
                            {usePrompt ? 'Writing for today\'s prompt' : 'Today\'s Ink Prompt'}
                        </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">&ldquo;{dailyPrompt.text}&rdquo;</p>
                </button>
            )}

            {/* Compose Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 lg:px-32 py-6">
                <div className="max-w-2xl mx-auto">
                    <input
                        ref={titleRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        maxLength={200}
                        className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-700 mb-6"
                        aria-label="Poem title"
                    />
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your poem..."
                        maxLength={5000}
                        className="w-full min-h-[40vh] text-base sm:text-lg bg-transparent border-none outline-none text-slate-300 placeholder:text-slate-700 leading-relaxed resize-none font-serif italic"
                        aria-label="Poem content"
                    />

                    {/* Muse Suggestion Box */}
                    {(isMuseLoading || museSuggestion) && (
                        <div className="mt-8 p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 animate-fadeIn relative group">
                            <div className="flex items-center gap-2 mb-3">
                                <FiZap size={14} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">The AI Muse</span>
                                {isMuseLoading && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-1" />}
                            </div>

                            {isMuseLoading ? (
                                <div className="space-y-2">
                                    <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                                    <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                                        {museSuggestion}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + museSuggestion);
                                                setMuseSuggestion('');
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600/30 transition-all"
                                        >
                                            Incorporate →
                                        </button>
                                        <button
                                            onClick={() => setMuseSuggestion('')}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Control Bar */}
            <div className="px-4 sm:px-6 py-2 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap mr-2">The Muse</span>
                    <button
                        onClick={() => handleMuseAction('complete')}
                        disabled={isMuseLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap"
                    >
                        <FiEdit3 size={12} />
                        Next lines
                    </button>
                    <button
                        onClick={() => handleMuseAction('rhyme')}
                        disabled={isMuseLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap"
                    >
                        <FiMusic size={12} />
                        Rhymes
                    </button>
                    <button
                        onClick={() => handleMuseAction('critique')}
                        disabled={isMuseLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap"
                    >
                        <FiCheckCircle size={12} />
                        Critique
                    </button>
                    <button
                        onClick={() => handleMuseAction('playful')}
                        disabled={isMuseLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 text-pink-400 text-xs hover:bg-pink-500/20 transition-all border border-pink-500/20 whitespace-nowrap"
                    >
                        <FiSmile size={12} />
                        Playful
                    </button>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>{wordCount} words</span>
                        <span>·</span>
                        <span>{lineCount} lines</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAutoTag}
                            disabled={isMuseLoading}
                            className={`p-2 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-all ${isMuseLoading ? 'animate-pulse' : ''}`}
                            title="Auto-detect Mood & Theme"
                        >
                            <FiStar size={16} />
                        </button>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5 transition min-h-[40px]"
                        >
                            <span className="capitalize">{mood}</span>
                            <span>·</span>
                            <span className="capitalize">{theme}</span>
                            <FiChevronDown size={14} className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Options Panel */}
                {showOptions && (
                    <div className="max-w-2xl mx-auto mt-3 p-4 rounded-2xl bg-white/5 border border-white/5 animate-fadeIn space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Mood</label>
                            <div className="flex flex-wrap gap-2">
                                {moods.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mood === m
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Theme</label>
                            <div className="flex flex-wrap gap-2">
                                {themes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${theme === t
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
