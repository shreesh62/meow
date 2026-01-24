import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { apiGetMoodHistory } from '../services/api';
import { Card } from '../components/ui';
import { supabase } from '../lib/supabase';

const greetingForNow = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning!';
  if (h < 18) return 'Good Afternoon!';
  return 'Good Evening!';
};

const softSubtext = () => {
  const options = [
    'No pressure. Just a tiny check-in.',
    'Whatever you feel is valid.',
    'Quiet days count too.',
  ];
  const idx = Math.floor((Date.now() / 1000 / 60 / 60) % options.length);
  return options[idx];
};

const dayKey = (d) => format(d, 'yyyy-MM-dd');

const Home = () => {
  const { user, space } = useApp();
  const navigate = useNavigate();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGetMoodHistory(space.id);
        if (!cancelled) setMoods(data || []);
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const channel = supabase
      .channel('home-moods')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${space.id}` }, () => {
        load();
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [space.id]);

  const latestByUser = useMemo(() => {
    const map = new Map();
    for (const m of moods) {
      if (!map.has(m.user_id)) map.set(m.user_id, m);
    }
    return map;
  }, [moods]);

  const myLatest = latestByUser.get(user.id) || null;
  const partnerLatest = Array.from(latestByUser.entries()).find(([uid]) => uid !== user.id)?.[1] || null;

  const partnerDot = useMemo(() => {
    if (!partnerLatest?.created_at) return 'bg-gray-300';
    const mins = (Date.now() - new Date(partnerLatest.created_at).getTime()) / 1000 / 60;
    if (mins <= 10) return 'bg-pastel-green';
    return 'bg-gray-300';
  }, [partnerLatest?.created_at]);

  const dailyEntries = useMemo(() => {
    const map = new Map();
    for (const m of moods) {
      if (m.user_id !== user.id) continue;
      const key = dayKey(parseISO(m.created_at));
      if (!map.has(key)) map.set(key, m);
    }
    return Array.from(map.values());
  }, [moods, user.id]);

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-gray-900">{greetingForNow()}</h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">{softSubtext()}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Partner</p>
            {partnerLatest ? (
              <div className="mt-2 flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${partnerDot}`} />
                <p className="text-lg font-extrabold text-gray-900">{partnerLatest.emoji} {partnerLatest.label}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-gray-500">Whenever they’re ready.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/add')}
            className="h-12 w-12 rounded-2xl bg-gray-900 text-white shadow-sm border border-white/40 flex items-center justify-center text-2xl"
            aria-label="Add mood"
          >
            +
          </button>
        </div>
        {partnerLatest?.created_at && (
          <p className="mt-3 text-xs font-semibold text-gray-500">
            Updated {formatDistanceToNow(parseISO(partnerLatest.created_at))} ago
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Memories</p>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all"
        >
          Open calendar
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500 font-semibold animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-3">
          {dailyEntries.map((m) => {
            const d = parseISO(m.created_at);
            const title = (m.note && String(m.note).trim()) ? String(m.note).trim() : m.label;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate('/calendar', { state: { focus: dayKey(d) } })}
                className="w-full text-left"
              >
                <div className={`rounded-3xl border border-white/60 shadow-sm backdrop-blur-xl overflow-hidden ${m.color || 'bg-white/70'}`}>
                  <div className="flex items-stretch gap-4 p-4">
                      <div className="w-14 flex flex-col items-center justify-center rounded-2xl bg-white/70 border border-white/60 shadow-sm">
                        <div className="text-2xl font-extrabold text-gray-900 leading-none">{format(d, 'dd')}</div>
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{format(d, 'MMM')}</div>
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-serif text-lg font-extrabold text-gray-900 truncate">{title}</p>
                          <div className="text-2xl">{m.emoji}</div>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-gray-500">{format(d, 'h:mm a')}</p>
                      </div>
                    </div>
                </div>
              </button>
            );
          })}

          {!dailyEntries.length && (
            <div className="py-10 text-center text-gray-500">
              <p className="font-semibold">Nothing saved yet.</p>
              <p className="text-xs text-gray-400 mt-1">Add a mood whenever you feel like it.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
