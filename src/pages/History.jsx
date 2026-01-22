import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetMoodHistory } from '../services/api';
import { Card } from '../components/ui';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

const History = () => {
  const { user, space } = useApp();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiGetMoodHistory(space.id);
        setMoods(data || []);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [space.id]);

  // Calendar Logic
  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  // Stats Logic
  const myMoods = moods.filter(m => m.user_id === user.id);
  const partnerMoods = moods.filter(m => m.user_id !== user.id);

  const getMostFrequentMood = (userMoods) => {
    if (!userMoods.length) return 'N/A';
    const counts = {};
    userMoods.forEach(m => {
      counts[m.emoji] = (counts[m.emoji] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const calculateOverlap = () => {
    // Simple overlap: same mood emoji on the same day
    let overlaps = 0;
    // Group by day first to avoid O(N^2) somewhat, though N is small (100)
    const myMoodsByDay = {};
    myMoods.forEach(m => {
        const day = format(parseISO(m.created_at), 'yyyy-MM-dd');
        // Take the last mood of the day as the "mood of the day"
        if (!myMoodsByDay[day] || new Date(m.created_at) > new Date(myMoodsByDay[day].created_at)) {
            myMoodsByDay[day] = m;
        }
    });

    const partnerMoodsByDay = {};
    partnerMoods.forEach(m => {
        const day = format(parseISO(m.created_at), 'yyyy-MM-dd');
        if (!partnerMoodsByDay[day] || new Date(m.created_at) > new Date(partnerMoodsByDay[day].created_at)) {
            partnerMoodsByDay[day] = m;
        }
    });

    let commonDays = 0;
    Object.keys(myMoodsByDay).forEach(day => {
        if (partnerMoodsByDay[day]) {
            commonDays++;
            if (myMoodsByDay[day].emoji === partnerMoodsByDay[day].emoji) {
                overlaps++;
            }
        }
    });

    return commonDays === 0 ? 0 : Math.round((overlaps / commonDays) * 100);
  };

  return (
    <div className="pt-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-800">Mood History</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-blue/20 border-none">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top Mood</span>
          <span className="text-4xl mt-2">{getMostFrequentMood(myMoods)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-pink/20 border-none">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">In Sync</span>
          <span className="text-3xl mt-2 font-bold text-gray-700">{calculateOverlap()}%</span>
        </Card>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
        <h2 className="text-lg font-bold text-gray-700 mb-4">{format(today, 'MMMM yyyy')}</h2>
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['S','M','T','W','T','F','S'].map(d => (
            <div key={d} className="text-xs text-gray-400 font-bold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            
            // Find moods for this day (latest first in array, but we need to check all to find one for this day)
            // Ideally we'd optimize this but for < 100 items it's fine
            const myMood = moods.find(m => m.user_id === user.id && isSameDay(parseISO(m.created_at), day));
            const partnerMood = moods.find(m => m.user_id !== user.id && isSameDay(parseISO(m.created_at), day));
            
            return (
              <div key={dayStr} className="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-xl relative overflow-hidden">
                <span className="text-[10px] text-gray-400 absolute top-1 left-1">{format(day, 'd')}</span>
                
                {/* Mood Indicators */}
                <div className="flex gap-0.5 mt-2">
                   {/* My Mood */}
                   <div className="text-sm z-10">{myMood?.emoji || ''}</div>
                   {/* Partner Mood (slightly offset or smaller?) */}
                   {partnerMood && (
                       <div className="text-xs absolute bottom-1 right-1 opacity-80">{partnerMood.emoji}</div>
                   )}
                </div>
                
                {/* Background color if I logged */}
                {myMood && (
                    <div className={`absolute inset-0 opacity-20 ${myMood.color}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* List View (Recent) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide ml-2">Recent Updates</h3>
        {moods.slice(0, 5).map(mood => (
            <div key={mood.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${mood.color} bg-opacity-50`}>
                    {mood.emoji}
                </div>
                <div>
                    <p className="font-bold text-gray-800">{mood.users?.name || 'Partner'}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(mood.created_at), 'MMM d, h:mm a')}</p>
                </div>
                <div className="ml-auto font-medium text-gray-600 text-sm">
                    {mood.label}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default History;
