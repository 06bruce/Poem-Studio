'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import { FiArrowLeft, FiEdit2, FiUsers, FiBook, FiBookmark, FiPlus, FiLoader, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from '../../../contexts/ToastContext';
import PoemCard from '../../../components/PoemCard';
import Header from '../../../components/Header';

export default function UserProfile() {
  const params = useParams();
  const username = params.username;
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPoems, setUserPoems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState('creations'); // 'creations' or 'bookshelf'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    if (activeTab === 'bookshelf') {
      fetchCollections();
    }
  }, [username, activeTab]);

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
        body: JSON.stringify({
          username: editUsername,
          bio: editBio
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowEditModal(false);
        if (editUsername !== username) {
          window.location.href = `/profile/${editUsername}`;
        } else {
          fetchUserProfile();
        }
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to modify essence');
      }
    } catch (err) {
      toast.error('Connection to the void failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user info
      const userResponse = await fetch(`/api/users/${username}`);
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      const userData = await userResponse.json();

      // Fetch user's poems
      const poemsResponse = await fetch(`/api/users/${username}/poems`);
      if (poemsResponse.ok) {
        const poemsData = await poemsResponse.json();
        setUserPoems(poemsData);
      }

      setProfileUser(userData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to like poem');
      }

      const updatedPoem = await response.json();
      setUserPoems(poems => poems.map(p => p._id === poemId ? updatedPoem : p));
      toast.success('Liked!');
    } catch (err) {
      console.error('Like error:', err);
      toast.error(err.message || 'Failed to like poem');
    }
  };

  const handleUnlike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/poems/${poemId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlike poem');
      }

      const updatedPoem = await response.json();
      setUserPoems(poems => poems.map(p => p._id === poemId ? updatedPoem : p));
      toast.success('Unliked');
    } catch (err) {
      console.error('Unlike error:', err);
      toast.error(err.message || 'Failed to unlike poem');
    }
  };

  const handleDelete = (poemId) => {
    setUserPoems(poems => poems.filter(p => p._id !== poemId));
    toast.success('Poem deleted successfully!');
  };

  const isLikedByUser = (poem) => {
    if (!user || !poem.likes) return false;
    return poem.likes.some(like => like.userId === user.id || like.userId === user._id);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 md:p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <Header />
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 backdrop-blur-sm"></div>
            </div>
          </div>
          <p className="mt-6 text-slate-400 font-medium tracking-wide animate-pulse">Summoning profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 md:p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] -z-10"></div>
        <Header />
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20 glass rounded-[2.5rem] border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiArrowLeft className="text-red-400 text-3xl" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-100">Poet Not Found</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">The soul behind @{username} has vanished into the literary void.</p>
            <button
              onClick={handleGoBack}
              className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all duration-300 font-bold active:scale-95 inline-flex items-center gap-2"
            >
              <FiArrowLeft />
              Return to Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user && (user.username === username);

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-16 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Header />

      <div className="max-w-5xl mx-auto mt-8">
        <button
          onClick={handleGoBack}
          className="group flex items-center gap-3 mb-8 text-slate-500 hover:text-slate-200 transition-all duration-300 font-semibold"
        >
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center group-hover:bg-slate-800 transition-colors">
            <FiArrowLeft />
          </div>
          <span>Return</span>
        </button>

        {/* Profile Header */}
        <div className="rounded-[2.5rem] glass p-10 mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-colors duration-700"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-blue-900/40 border-4 border-white/10 ring-8 ring-blue-500/5">
                {profileUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center border-4 border-slate-900 shadow-lg" title="Artist Active">
                <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h1 className="text-4xl font-black tracking-tight text-gradient">@{profileUser.username}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setEditUsername(profileUser.username);
                      setEditBio(profileUser.bio || '');
                      setShowEditModal(true);
                    }}
                    className="px-5 py-2 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 text-xs font-bold flex items-center gap-2 border-white/5 shadow-sm active:scale-95"
                  >
                    <FiEdit2 size={14} className="text-blue-400" />
                    Modify Essence
                  </button>
                )}
              </div>

              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed italic">
                "{profileUser.bio || 'This poet chooses silence over words for now.'}"
              </p>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-8">
                <div className="flex flex-col items-center md:items-start px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-2xl font-bold text-slate-100">{userPoems.length}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Creations</span>
                </div>
                <div className="flex flex-col items-center md:items-start px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-2xl font-bold text-slate-100">{profileUser.followers?.length || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admirers</span>
                </div>
                <div className="flex flex-col items-center md:items-start px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-2xl font-bold text-slate-100">{profileUser.following?.length || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inspirers</span>
                </div>
              </div>

              <div className="text-[10px] font-bold text-slate-600 mt-6 uppercase tracking-extra-widest">
                Initiated into Poem Studio on {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 mb-10 border-b border-white/5">
          <button
            onClick={() => setActiveTab('creations')}
            className={clsx(
              'pb-4 text-sm font-bold uppercase tracking-widest transition-all relative',
              activeTab === 'creations' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            Creations
            {activeTab === 'creations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('bookshelf')}
            className={clsx(
              'pb-4 text-sm font-bold uppercase tracking-widest transition-all relative',
              activeTab === 'bookshelf' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            Bookshelf
            {activeTab === 'bookshelf' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>}
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'creations' ? (
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                {isOwnProfile ? 'Vault of Verses' : `Anthology of @${profileUser.username}`}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            {userPoems.length === 0 ? (
              <div className="text-center py-24 rounded-[2.5rem] glass border-white/5 animate-fadeIn">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBook size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium text-lg">
                  {isOwnProfile ? "Your ink is waiting to be spilled." : "The pages are yet to be filled by this artist."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {userPoems.map((poem, index) => (
                  <div key={poem._id} className="animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                    <PoemCard
                      poem={poem}
                      currentUserId={user?.id || user?._id}
                      onLike={handleLike}
                      onUnlike={handleUnlike}
                      currentUserLiked={isLikedByUser(poem)}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-2xl font-black text-slate-100 tracking-tight">Saved Collections</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
            </div>

            {collections.length === 0 ? (
              <div className="text-center py-24 rounded-[2.5rem] glass border-white/5 animate-fadeIn">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiBookmark size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium text-lg">Your bookshelf is empty. Start collecting beautiful verses.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {collections.map((collection) => (
                  <div key={collection.name} className="animate-fadeIn">
                    <div className="flex items-end justify-between mb-8 px-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-100 mb-1">{collection.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">{collection.description || 'A private sanctuary of curated words'}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        {collection.poems?.length || 0} Poems
                      </span>
                    </div>

                    {collection.poems && collection.poems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-8">
                        {collection.poems.map((poem, pIndex) => (
                          <div key={poem._id || pIndex} className="animate-fadeIn">
                            <PoemCard
                              poem={poem}
                              currentUserId={user?.id || user?._id}
                              onLike={handleLike}
                              onUnlike={handleUnlike}
                              currentUserLiked={isLikedByUser(poem)}
                              onDelete={handleDelete}
                              isReadOnly={true}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 rounded-2xl border border-dashed border-white/5 text-center">
                        <p className="text-slate-600 text-sm">No poems in this collection yet.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Modify Essence Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass rounded-[2.5rem] p-10 w-full max-w-lg border border-white/10 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-2xl font-black text-slate-100 flex items-center gap-3 tracking-tight">
                <FiEdit2 className="text-blue-400" />
                Modify Essence
              </h4>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Pseudonym (@username)</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Your ink name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Poetic Essence (Bio)</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="What is your soul's frequency?"
                  maxLength={150}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all resize-none italic"
                />
                <div className="text-right mt-2">
                  <span className={clsx(
                    "text-[10px] font-bold tracking-widest uppercase",
                    editBio.length > 140 ? "text-red-400" : "text-slate-600"
                  )}>
                    {editBio.length}/150
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-10">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition-all border border-white/5"
              >
                Retreat
              </button>
              <button
                disabled={!editUsername.trim() || isUpdating}
                onClick={handleUpdateProfile}
                className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-blue-900/40"
              >
                {isUpdating ? <FiLoader className="animate-spin" /> : <FiCheck />}
                Preserve Essence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
