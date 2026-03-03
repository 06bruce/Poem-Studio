'use client';
import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import PoemList from '../components/PoemList'
import Notifications from '../components/Notifications'
import SignUp from '../components/SignUp'
import SignIn from '../components/SignIn'
import WeatherEffect from '../components/WeatherEffect'
import UserSearch from '../components/UserSearch'
import TrendingUsers from '../components/TrendingUsers'
import StoriesBar from '../components/StoriesBar'
import BottomNav from '../components/BottomNav'
import ComposeModal from '../components/ComposeModal'
import DailyPrompt from '../components/DailyPrompt'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

function MainContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [mood, setMood] = useState('neutral')
  const [showWeather, setShowWeather] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showCompose, setShowCompose] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(null)

  const poemListRef = useRef(null)

  function handleToggleWeather() {
    setShowWeather(s => !s)
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    setIsSigningUp(true)
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePoemCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveTab('home')
  }

  const toggleAuthForm = () => {
    setIsSigningUp(!isSigningUp)
  }

  const handleTabChange = (tabId) => {
    if (tabId === 'activity') {
      setActiveTab('activity')
    } else if (tabId === 'profile') {
      if (user) {
        router.push(`/profile/${user.username}`)
      } else {
        setShowAuth(true)
      }
    } else {
      setActiveTab(tabId)
    }
  }

  const handleCompose = (prompt = null) => {
    if (!user) {
      setShowAuth(true)
      return
    }
    setCurrentPrompt(prompt)
    setShowCompose(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden transition-colors duration-500">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Header
        onToggleSnow={handleToggleWeather}
        showSnow={showWeather}
        onAuthClick={() => setShowAuth(true)}
        onNotificationsClick={() => setActiveTab('activity')}
      />

      <main id="main-content" className="max-w-4xl mx-auto pt-8">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            <StoriesBar />
            <DailyPrompt onWritePrompt={handleCompose} />
            <div className="px-4">
              <PoemList ref={poemListRef} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="space-y-8 animate-fadeIn px-4">
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white mb-6 px-1">Discover</h2>
              <UserSearch />
            </div>
            <TrendingUsers />
            <div className="p-8 rounded-3xl glass border border-white/5 text-xs text-slate-500 relative overflow-hidden group">
              <p className="font-bold text-slate-400 uppercase tracking-widest mb-3">About Poem Studio</p>
              <p className="leading-relaxed">A sanctuary for the soul, crafted with passion for the global community of poets.</p>
              <p className="mt-4 italic text-slate-400 group-hover:text-blue-400 transition-colors duration-500">&quot;Poetry is the rhythmical creation of beauty in words.&quot;</p>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-fadeIn px-4 mt-4">
            <h2 className="text-2xl font-bold text-white mb-6">Activity</h2>
            <Notifications isOpen={true} onClose={() => setActiveTab('home')} inline={true} />
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center backdrop-blur-xl animate-fadeIn p-4"
          onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}
        >
          <div className="bg-slate-900 rounded-[2.5rem] p-2 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black ring-1 ring-white/10 w-full max-w-md">
            {isSigningUp ? (
              <SignUp onSuccess={handleAuthSuccess} onToggleForm={toggleAuthForm} onClose={() => setShowAuth(false)} />
            ) : (
              <SignIn onSuccess={handleAuthSuccess} onToggleForm={toggleAuthForm} onClose={() => setShowAuth(false)} />
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onPoemCreated={handlePoemCreated}
        dailyPrompt={currentPrompt}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCompose={() => handleCompose()}
        unreadCount={0}
      />

      {showWeather && <WeatherEffect mood={mood} />}
    </div>
  )
}

export default function Home() {
  return <MainContent />
}

