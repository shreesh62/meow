import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetMoodHistory } from '../services/api';
import { Card, Chip } from '../components/ui';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';

const History = () => {
  const { user, space } = useApp();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // month | week

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

  const today = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });
  const weekDays = eachDayOfInterval({
    start: startOfWeek(today, { weekStartsOn: 0 }),
    end: endOfWeek(today, { weekStartsOn: 0 }),
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
    <div className="space-y-6 pb-24">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">My Calendar</p>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Mood History</h1>
        </div>
        <div className="flex gap-2">
          <Chip active={view === 'month'} onClick={() => setView('month')}>
            Month
          </Chip>
          <Chip active={view === 'week'} onClick={() => setView('week')}>
            Week
          </Chip>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-blue/20 border-none">
          <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">Top Mood</span>
          <span className="text-4xl mt-2">{getMostFrequentMood(myMoods)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-pink/20 border-none">
          <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">Overlap</span>
          <span className="text-3xl mt-2 font-extrabold text-gray-800">{calculateOverlap()}%</span>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-pastel-yellow/30 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-pastel-green/30 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900">{format(today, 'MMMM yyyy')}</h2>
          </div>

          {view === 'month' ? (
            <>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['S','M','T','W','T','F','S'].map(d => (
                  <div key={d} className="text-xs text-gray-400 font-extrabold">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const myMood = moods.find(m => m.user_id === user.id && isSameDay(parseISO(m.created_at), day));
                  const partnerMood = moods.find(m => m.user_id !== user.id && isSameDay(parseISO(m.created_at), day));

                  return (
                    <div key={dayStr} className="aspect-square flex flex-col items-center justify-center bg-white/60 rounded-2xl relative overflow-hidden border border-white/60 shadow-sm">
                      <span className="text-[10px] text-gray-400 absolute top-1 left-1 font-semibold">{format(day, 'd')}</span>

                      <div className="flex gap-1 items-center">
                        <div className="text-sm z-10">{myMood?.emoji || ''}</div>
                        {partnerMood && (
                          <div className="text-xs z-10 opacity-80">{partnerMood.emoji}</div>
                        )}
                      </div>

                      {myMood && (
                        <div className={`absolute inset-0 opacity-15 ${myMood.color}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const myMood = moods.find(m => m.user_id === user.id && isSameDay(parseISO(m.created_at), day));
                const partnerMood = moods.find(m => m.user_id !== user.id && isSameDay(parseISO(m.created_at), day));

                return (
                  <div key={dayStr} className="flex items-center justify-between rounded-2xl bg-white/60 border border-white/60 shadow-sm px-4 py-4">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">{format(day, 'EEE')}</p>
                      <p className="text-xs text-gray-500 font-semibold">{format(day, 'MMM d')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xl border border-white/60 shadow-sm ${myMood?.color || 'bg-white'}`}>
                        {myMood?.emoji || '—'}
                      </div>
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xl border border-white/60 shadow-sm ${partnerMood?.color || 'bg-white'}`}>
                        {partnerMood?.emoji || '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
      
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-gray-700 tracking-wide">Recent</h3>
        {moods.slice(0, 5).map(mood => (
            <div key={mood.id} className="flex items-center gap-4 bg-white/70 p-4 rounded-3xl shadow-sm border border-white/60 backdrop-blur-xl">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${mood.color} border border-white/60 shadow-sm`}>
                    {mood.emoji}
                </div>
                <div>
                    <p className="font-extrabold text-gray-900">{mood.users?.name || 'Partner'}</p>
                    <p className="text-xs text-gray-500 font-semibold">{format(parseISO(mood.created_at), 'MMM d, h:mm a')}</p>
                </div>
                <div className="ml-auto font-extrabold text-gray-800 text-sm">
                    {mood.label}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default History;
