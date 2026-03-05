import React, { useMemo, useState, useEffect } from 'react';
import { FiZap, FiRefreshCw } from 'react-icons/fi';

const prompts = [
    { text: "Write about a color you can't name but can feel.", tag: "unseen-color" },
    { text: "Describe the silence between two heartbeats.", tag: "between-beats" },
    { text: "A letter to the person you were five years ago.", tag: "past-self" },
    { text: "What does the rain remember?", tag: "rain-memory" },
    { text: "Write about something you lost and never looked for.", tag: "lost-things" },
    { text: "The first light of morning enters a room.", tag: "morning-light" },
    { text: "Words your hands would say if they could speak.", tag: "speaking-hands" },
    { text: "A poem that starts with goodnight and ends with hello.", tag: "night-to-day" },
    { text: "Write about a door you never opened.", tag: "closed-doors" },
    { text: "The sound of a city falling asleep.", tag: "sleeping-city" },
    { text: "Describe your favorite place without naming it.", tag: "unnamed-place" },
    { text: "A conversation between the moon and the sea.", tag: "moon-and-sea" },
    { text: "Write about the weight of an empty room.", tag: "empty-room" },
    { text: "What would you tell the next stranger you meet?", tag: "dear-stranger" },
    { text: "A poem about forgetting how to forget.", tag: "un-forgetting" },
    { text: "The space between what is said and what is meant.", tag: "between-words" },
    { text: "Write from the perspective of autumn's last leaf.", tag: "last-leaf" },
    { text: "A love poem where the word love never appears.", tag: "unnamed-love" },
    { text: "Describe time passing without mentioning a clock.", tag: "timeless" },
    { text: "The things we carry without knowing we carry them.", tag: "invisible-burdens" },
    { text: "Write about a sound that makes you feel small.", tag: "small-sounds" },
    { text: "A poem that is also an apology.", tag: "poem-apology" },
    { text: "What does your shadow do when you're not looking?", tag: "secret-shadow" },
    { text: "The taste of a word you've been afraid to say.", tag: "unspoken-word" },
    { text: "Write about growing up in seven lines or less.", tag: "growing-up" },
    { text: "An ode to something ordinary that deserves more praise.", tag: "ordinary-ode" },
    { text: "What would stillness write if it had a pen?", tag: "stillness-writes" },
    { text: "Describe a feeling that has no name in any language.", tag: "nameless-feeling" },
    { text: "A poem about the distance between two people sharing a meal.", tag: "shared-meal" },
    { text: "Write about coming home to a place you don't recognize.", tag: "changed-home" },
    { text: "The last dream before waking.", tag: "final-dream" },
];

export default function DailyPrompt({ onWritePrompt }) {
    const [dynamicPrompt, setDynamicPrompt] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const staticPrompt = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
        return prompts[dayOfYear % prompts.length];
    }, []);

    const fetchDynamicPrompt = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_daily_prompt' })
            });
            const data = await response.json();
            if (data.prompts && data.prompts.length > 0) {
                // Pick a random one from the generated list
                const randomPrompt = data.prompts[Math.floor(Math.random() * data.prompts.length)];
                setDynamicPrompt(randomPrompt);
            }
        } catch (error) {
            console.error("Failed to fetch dynamic prompt:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Option: fetch on mount or just stick with static unless user asks
        // For now, let's keep static as default and maybe add a "Surprise Me" button
    }, []);

    const todayPrompt = dynamicPrompt || staticPrompt;

    return (
        <div className="mx-4 mb-4">
            <div
                onClick={() => onWritePrompt?.(todayPrompt)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onWritePrompt?.(todayPrompt);
                    }
                }}
                tabIndex={0}
                role="button"
                className="w-full relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/20"
                aria-label="Daily writing prompt"
            >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-transparent border border-amber-500/10 rounded-2xl group-hover:border-amber-500/20 transition-colors" />

                <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <FiZap size={12} className="text-amber-400" />
                            </div>
                            <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">
                                {dynamicPrompt ? 'AI Ink' : 'Daily Ink'}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchDynamicPrompt();
                            }}
                            className={`p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                            title="Generate new AI prompt"
                        >
                            <FiRefreshCw size={12} />
                        </button>
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                        &ldquo;{todayPrompt.text}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 group-hover:text-amber-400/60 transition-colors">
                        {isLoading ? 'Whispering to the Muse...' : 'Tap to write →'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function getTodayPrompt() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    return prompts[dayOfYear % prompts.length];
}
