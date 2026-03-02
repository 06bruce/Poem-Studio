'use client';
import React, { useMemo } from 'react';
import { FiZap } from 'react-icons/fi';

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
    const todayPrompt = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
        return prompts[dayOfYear % prompts.length];
    }, []);

    return (
        <div className="mx-4 mb-4">
            <button
                onClick={() => onWritePrompt?.(todayPrompt)}
                className="w-full relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left group transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-transparent border border-amber-500/10 rounded-2xl group-hover:border-amber-500/20 transition-colors" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <FiZap size={12} className="text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">Daily Ink</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                        &ldquo;{todayPrompt.text}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 group-hover:text-amber-400/60 transition-colors">
                        Tap to write →
                    </p>
                </div>
            </button>
        </div>
    );
}

export function getTodayPrompt() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    return prompts[dayOfYear % prompts.length];
}
