'use client';
import React, { useEffect, useRef, useState } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import Header from '../components/Header'
import PoemGenerator from '../components/PoemGenerator'
import PoemList from '../components/PoemList'
import Notifications from '../components/Notifications'
import SignUp from '../components/SignUp'
import SignIn from '../components/SignIn'
import WeatherEffect from '../components/WeatherEffect'
import UserSearch from '../components/UserSearch'
import TrendingUsers from '../components/TrendingUsers'

function MainContent() {
  const [mood, setMood] = useState('neutral')
  const [showWeather, setShowWeather] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const poemListRef = useRef(null)

  function handleToggleWeather() {
    setShowWeather(s => !s)
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    setIsSigningUp(true)
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePoemSaved = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const toggleAuthForm = () => {
    setIsSigningUp(!isSigningUp)
  }

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-16 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Header
        onToggleSnow={handleToggleWeather}
        showSnow={showWeather}
        onAuthClick={() => setShowAuth(true)}
        onNotificationsClick={() => setShowNotifications(true)}
      />
      <main className="max-w-6xl mx-auto mt-8">
        {showAuth && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 rounded-[2.5rem] p-2 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black ring-1 ring-white/10">
              {isSigningUp ? (
                <SignUp
                  onSuccess={handleAuthSuccess}
                  onToggleForm={toggleAuthForm}
                />
              ) : (
                <SignIn
                  onSuccess={handleAuthSuccess}
                  onToggleForm={toggleAuthForm}
                />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <UserSearch />
            <PoemGenerator
              onSave={handlePoemSaved}
              showAuthForm={() => setShowAuth(true)}
              setGlobalMood={setMood}
            />
            <PoemList ref={poemListRef} refreshTrigger={refreshTrigger} />
          </div>
          <aside className="hidden lg:block lg:col-span-4 sticky top-12 self-start space-y-8 h-fit">
            <TrendingUsers />
            <div className="p-8 rounded-3xl glass border border-white/5 text-xs text-slate-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
              <p className="font-bold text-slate-400 uppercase tracking-widest mb-3">About</p>
              <p className="leading-relaxed">© 2025 Poem Studio. A sanctuary for the soul, crafted with passion for the global community of poets.</p>
              <p className="mt-4 italic text-slate-400 group-hover:text-blue-400 transition-colors duration-500">"Poetry is the rhythmical creation of beauty in words."</p>
            </div>
          </aside>
        </div>
      </main>
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      {showWeather && <WeatherEffect mood={mood} />}
    </div>
  )
}

export default function Home() {
  return (
    <MainContent />
  )
}
