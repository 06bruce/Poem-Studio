'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { FiArrowLeft, FiEdit2, FiUsers, FiBook, FiBookmark, FiPlus, FiLoader, FiCheck, FiX, FiZap, FiGrid, FiList, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from '../../../contexts/ToastContext';
import PoemCard from '../../../components/PoemCard';
import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const username = params.username ? decodeURIComponent(params.username) : '';
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPoems, setUserPoems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    if (activeTab === 'bookshelf') {
      fetchCollections();
    }
  }, [username, activeTab]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const userResponse = await fetch(`/api/users/${username}`);
      if (!userResponse.ok) throw new Error('User not found');
      const userData = await userResponse.json();
      setProfileUser(userData);
      setFollowersCount(userData.followers?.length || 0);
      setIsFollowing(userData.followers?.includes(user?.id || user?._id));

      const poemsResponse = await fetch(`/api/users/${username}/poems`);
      if (poemsResponse.ok) {
        const poemsData = await poemsResponse.json();
        setUserPoems(poemsData);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.info('Sign in to follow fellow poets');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.action === 'followed');
        setFollowersCount(data.followersCount);
        toast.success(data.action === 'followed' ? `Following @${username}` : `Unfollowed @${username}`);
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, bio: editBio })
      });

      if (response.ok) {
        toast.success('Essence preserved');
        setShowEditModal(false);
        if (editUsername !== username) {
          router.push(`/profile/${editUsername}`);
        } else {
          fetchUserProfile();
        }
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to modify essence');
      }
    } catch (err) {
      toast.error('Connection failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/collections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  const handleLike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedPoem = await response.json();
        setUserPoems(poems => poems.map(p => p._id === poemId ? updatedPoem : p));
      }
    } catch (err) { }
  };

  const handleUnlike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/poems/${poemId}/unlike`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedPoem = await response.json();
        setUserPoems(poems => poems.map(p => p._id === poemId ? updatedPoem : p));
      }
    } catch (err) { }
  };

  const isLikedByUser = (poem) => {
    if (!user || !poem.likes) return false;
    return poem.likes.some(like => like.userId === user.id || like.userId === user._id);
  };

  const handleGoBack = () => router.back();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-full border-t-2 border-blue-500 animate-spin mb-4"></div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Consulting the muse...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <FiX size={32} className="text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Poet Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-xs">The ink has dried and the poet has vanished from our pages.</p>
        <button onClick={() => router.push('/')} className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-500 active:scale-95">
          Home
        </button>
      </div>
    );
  }

  const isOwnProfile = user && (user.username === username);
  const streak = profileUser.currentStreak || 0;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden pb-24">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600/10 to-transparent -z-10 opacity-50"></div>

      <Header />

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* Profile Info Section */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6 group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-2xl border-4 border-white/10 relative z-10">
              {profileUser.username.charAt(0).toUpperCase()}
            </div>
            {streak > 0 && (
              <div className="absolute -top-1 -right-1 z-20 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg border-2 border-slate-950 animate-bounce">
                <FiZap className="fill-current" />
                {streak} DAY STREAK
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">@{profileUser.username}</h1>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6 italic">&ldquo;{profileUser.bio || 'This soul expresses itself through mystery.'}&rdquo;</p>

          <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
            {isOwnProfile ? (
              <button
                onClick={() => {
                  setEditUsername(profileUser.username);
                  setEditBio(profileUser.bio || '');
                  setShowEditModal(true);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FiEdit2 size={14} /> Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={clsx(
                  "flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                  isFollowing
                    ? "bg-white/5 border border-white/10 text-slate-300"
                    : "bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all">
              <FiBook size={16} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 border-y border-white/5 py-6 mb-8 mt-4">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white leading-none">{userPoems.length}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Poems</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/5">
            <span className="text-lg font-bold text-white leading-none">{followersCount}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Admirers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white leading-none">{profileUser.following?.length || 0}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Inspired By</span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center justify-center gap-12 mb-8">
          <button onClick={() => setActiveTab('posts')} className={clsx(
            "p-3 rounded-full transition-all relative group",
            activeTab === 'posts' ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-slate-300"
          )}>
            <FiGrid size={22} />
            {activeTab === 'posts' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('bookshelf')} className={clsx(
            "p-3 rounded-full transition-all relative",
            activeTab === 'bookshelf' ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-slate-300"
          )}>
            <FiBookmark size={22} />
            {activeTab === 'bookshelf' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('activity')} className={clsx(
            "p-3 rounded-full transition-all relative",
            activeTab === 'activity' ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-slate-300"
          )}>
            <FiActivity size={22} />
            {activeTab === 'activity' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}
          </button>
        </div>

        {/* Content Feed */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            userPoems.length === 0 ? (
              <div className="py-20 text-center px-4">
                <p className="text-slate-500 text-sm mb-4 italic">No verses have been written here yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {userPoems.map(poem => (
                  <PoemCard
                    key={poem._id}
                    poem={poem}
                    currentUserId={user?._id || user?.id}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                    currentUserLiked={isLikedByUser(poem)}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === 'bookshelf' && (
            <div className="space-y-8 animate-fadeIn">
              {collections.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-500 text-sm italic">The digital shelf is empty.</p>
                </div>
              ) : (
                collections.map(col => (
                  <div key={col.name} className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-100">{col.name}</h3>
                      <span className="text-[10px] font-bold text-slate-600">{col.poems?.length || 0} ITEMS</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{col.description || 'Curated beauty.'}</p>
                    <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-300">Open Shelf →</button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 text-center animate-fadeIn py-12">
              <p className="text-slate-500 text-sm">Visualizing common resonance...</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Resilience', 'Night', 'Soul', 'Modern Echoes'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-slate-400 border border-white/5">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-scaleIn">
            <h2 className="text-2xl font-black text-white mb-6">Modify Essence</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={150}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 font-serif italic"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isUpdating ? <FiLoader className="animate-spin" /> : <FiCheck />} Preserve
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav
        activeTab="profile"
        onTabChange={(t) => router.push(t === 'home' ? '/' : `/?tab=${t}`)}
        onCompose={() => router.push('/?compose=true')}
      />
    </div>
  );
}

