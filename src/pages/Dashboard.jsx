import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetLatestMoods, apiUpdateMood } from '../services/api';
import { supabase } from '../lib/supabase';
import { Card, Button } from '../components/ui';
import { Plus, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EMOJIS = [
  { char: '😊', label: 'Happy', color: 'bg-pastel-yellow' },
  { char: '🥰', label: 'Loved', color: 'bg-pastel-pink' },
  { char: '😴', label: 'Tired', color: 'bg-pastel-lavender' },
  { char: '😤', label: 'Annoyed', color: 'bg-pastel-peach' },
  { char: '😢', label: 'Sad', color: 'bg-blue-100' },
  { char: '😎', label: 'Cool', color: 'bg-pastel-green' },
  { char: '🤒', label: 'Sick', color: 'bg-green-100' },
  { char: '🤯', label: 'Stressed', color: 'bg-red-100' },
  { char: '🥳', label: 'Excited', color: 'bg-purple-100' },
];

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

    // Real-time subscription
    const channel = supabase
      .channel('moods-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${space.id}` },
        (payload) => {
          console.log('New mood received!', payload);
          // Optimistic update or refetch. 
          // Since we need joined user data, refetching is safer for MVP, or we can just fetch the new row if we had the user info locally.
          fetchMoods(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id]);

  const handleUpdateMood = async (emojiObj) => {
    try {
      await apiUpdateMood(user.id, space.id, emojiObj.char, emojiObj.label, emojiObj.color);
      setShowPicker(false);
      // fetchMoods will be triggered by realtime, but we can also optimistically update
    } catch (error) {
      console.error(error);
      alert('Failed to update mood');
    }
  };

  const myLatestMood = moods.find(m => m.user_id === user.id);
  const partnerLatestMood = moods.find(m => m.user_id !== user.id);

  // Helper to handle opacity since v4 doesn't support bg-opacity-* utilities
  // We'll just rely on the base color for now or use style prop if needed for exact opacity,
  // or append /50 if the color string was just the color name.
  // But here we have full class names in DB. 
  // For MVP, we'll just use the color class as is, maybe with a wrapper div for opacity if needed,
  // or just accept solid colors for the "bubble".
  
  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hi, {user.name}</h1>
          <p className="text-sm text-gray-500">Space Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{space.code}</span></p>
        </div>
        <div className={`w-10 h-10 rounded-full bg-${user.avatar_color} flex items-center justify-center text-xl shadow-inner`}>
          {myLatestMood?.emoji || '👤'}
        </div>
      </div>

      {/* Mood Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* My Mood */}
        <Card className="relative overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">My Mood</h2>
          {myLatestMood ? (
            <div className="flex flex-col items-center py-4">
              <div className={`text-6xl mb-4 p-6 rounded-full ${myLatestMood.color} animate-bounce-slow`}>
                {myLatestMood.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{myLatestMood.label}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Updated {formatDistanceToNow(new Date(myLatestMood.created_at))} ago
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>How are you feeling?</p>
            </div>
          )}
          
          <Button 
            onClick={() => setShowPicker(!showPicker)}
            className="mt-4 bg-gray-800 text-white hover:bg-gray-700"
          >
            {myLatestMood ? 'Update Mood' : 'Set Mood'}
          </Button>
        </Card>

        {/* Partner Mood */}
        <Card className={!partnerLatestMood ? 'bg-gray-50 border-dashed' : ''}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Partner's Mood</h2>
          {partnerLatestMood ? (
            <div className="flex flex-col items-center py-4">
               <div className={`text-6xl mb-4 p-6 rounded-full ${partnerLatestMood.color}`}>
                {partnerLatestMood.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{partnerLatestMood.label}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Updated {formatDistanceToNow(new Date(partnerLatestMood.created_at))} ago
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Waiting for partner to join or update...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mood Picker Sheet/Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">How are you feeling?</h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {EMOJIS.map((e) => (
                <button
                  key={e.label}
                  onClick={() => handleUpdateMood(e)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-105 active:scale-95 ${e.color} bg-opacity-30 hover:bg-opacity-50`}
                >
                  <span className="text-3xl mb-1">{e.char}</span>
                  <span className="text-xs font-medium text-gray-700">{e.label}</span>
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
