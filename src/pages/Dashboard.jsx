import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetLatestMoods, apiUpdateMood } from '../services/api';
import { supabase } from '../lib/supabase';
import { Card, Button } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { MOOD_PRESETS, normalizeBgClass } from '../lib/colors';

const Dashboard = () => {
  const { user, space } = useApp();
  const [moods, setMoods] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMoods = async () => {
    try {
      const data = await apiGetLatestMoods(space.id);
      setMoods(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoods();

    const channel = supabase
      .channel('moods-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${space.id}` },
        () => fetchMoods()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id]);

  const handleUpdateMood = async (emojiObj) => {
    try {
      await apiUpdateMood(user.id, space.id, emojiObj.emoji, emojiObj.label, emojiObj.color);
      setShowPicker(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update mood');
    }
  };

  const myLatestMood = moods.find(m => m.user_id === user.id);
  const partnerLatestMood = moods.find(m => m.user_id !== user.id);

  const avatarBg = normalizeBgClass(user?.avatar_color);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-500">{greeting}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{user.name}</h1>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/60 px-3 py-1 text-xs font-semibold text-gray-600">
            <span className="font-mono tracking-widest">{space.code}</span>
            <span className="text-gray-400">space</span>
          </div>
        </div>
        <div className={`h-12 w-12 rounded-2xl ${avatarBg} flex items-center justify-center text-2xl shadow-sm border border-white/40`}>
          {myLatestMood?.emoji || '👤'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-800 tracking-wide">Your mood</h2>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-all"
            >
              {myLatestMood ? 'Change' : 'Set'}
            </button>
          </div>
          {myLatestMood ? (
            <div className="flex flex-col items-center py-4">
              <div className={`text-6xl mb-4 p-6 rounded-3xl ${myLatestMood.color} shadow-sm border border-white/50`}>
                {myLatestMood.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{myLatestMood.label}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Updated {formatDistanceToNow(new Date(myLatestMood.created_at))} ago
              </p>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="font-semibold">Pick a vibe for today</p>
              <p className="text-xs text-gray-400 mt-1">You can update it anytime.</p>
            </div>
          )}
          <Button onClick={() => setShowPicker(true)} className="mt-4">
            {myLatestMood ? 'Update mood' : 'Set mood'}
          </Button>
        </Card>

        <Card className={!partnerLatestMood ? 'bg-white/40 border-dashed' : ''}>
          <h2 className="text-sm font-extrabold text-gray-800 tracking-wide mb-4">Partner mood</h2>
          {partnerLatestMood ? (
            <div className="flex flex-col items-center py-4">
              <div className={`text-6xl mb-4 p-6 rounded-3xl ${partnerLatestMood.color} shadow-sm border border-white/50`}>
                {partnerLatestMood.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{partnerLatestMood.label}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Updated {formatDistanceToNow(new Date(partnerLatestMood.created_at))} ago
              </p>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="font-semibold">Waiting for your person…</p>
              <p className="text-xs text-gray-400 mt-1">They’ll appear here when they set a mood.</p>
            </div>
          )}
        </Card>
      </div>

      {showPicker && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-xl bg-white/90 backdrop-blur-xl border border-white/70">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-gray-900">Pick your mood</h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-500 hover:text-gray-900 transition-all">✕</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {MOOD_PRESETS.map((e) => (
                <button
                  key={e.label}
                  onClick={() => handleUpdateMood(e)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-[0.99] ${e.color} shadow-sm border border-white/50`}
                >
                  <span className="text-3xl mb-1">{e.emoji}</span>
                  <span className="text-xs font-semibold text-gray-800">{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
