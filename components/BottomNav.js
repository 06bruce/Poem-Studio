'use client';
import React from 'react';
import { FiHome, FiSearch, FiPlusCircle, FiHeart, FiUser } from 'react-icons/fi';

export default function BottomNav({ activeTab, onTabChange, onCompose, unreadCount = 0 }) {
    const tabs = [
        { id: 'home', icon: FiHome, label: 'Home' },
        { id: 'explore', icon: FiSearch, label: 'Explore' },
        { id: 'compose', icon: FiPlusCircle, label: 'Write' },
        { id: 'activity', icon: FiHeart, label: 'Activity' },
        { id: 'profile', icon: FiUser, label: 'Profile' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 safe-area-pb"
            role="tablist"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around max-w-lg mx-auto px-2">
                {tabs.map((tab) => {
                    const isCompose = tab.id === 'compose';
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={tab.label}
                            onClick={() => isCompose ? onCompose?.() : onTabChange?.(tab.id)}
                            className={`
                relative flex flex-col items-center justify-center py-2 px-3 min-h-[56px] transition-all duration-200
                ${isCompose
                                    ? 'text-white'
                                    : isActive
                                        ? 'text-blue-400'
                                        : 'text-slate-500 hover:text-slate-300'
                                }
              `}
                        >
                            {isCompose ? (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/40 active:scale-90 transition-transform">
                                    <Icon size={22} strokeWidth={2.5} />
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                                        {tab.id === 'activity' && unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                                        {tab.label}
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
