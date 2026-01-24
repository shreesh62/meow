import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useApp } from '../context/AppContext';
import { apiGetMoodHistory } from '../services/api';
import { Card, Chip } from '../components/ui';
import { supabase } from '../lib/supabase';

const toDayKey = (d) => format(d, 'yyyy-MM-dd');

const normalizeTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

const Calendar = () => {
  const { user, space } = useApp();
  const location = useLocation();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // month | week
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);

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
      .channel('calendar-moods')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${space.id}` }, () => {
        load();
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [space.id]);

  useEffect(() => {
    const focus = location?.state?.focus;
    if (!focus) return;
    const d = new Date(`${focus}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      setMonthCursor(d);
      setSelectedDay(d);
    }
  }, [location?.state?.focus]);

  const latestOfDayByUser = useMemo(() => {
    const map = new Map();
    for (const m of moods) {
      const key = `${m.user_id}:${toDayKey(parseISO(m.created_at))}`;
      if (!map.has(key)) map.set(key, m);
    }
    return map;
  }, [moods]);

  const days = useMemo(() => {
    if (view === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(monthCursor, { weekStartsOn: 0 }),
        end: endOfWeek(monthCursor, { weekStartsOn: 0 }),
      });
    }
    return eachDayOfInterval({ start: startOfMonth(monthCursor), end: endOfMonth(monthCursor) });
  }, [monthCursor, view]);

  const myMoods = useMemo(() => moods.filter((m) => m.user_id === user.id), [moods, user.id]);
  const partnerMoods = useMemo(() => moods.filter((m) => m.user_id !== user.id), [moods, user.id]);

  const mostFrequentEmoji = useMemo(() => {
    const counts = new Map();
    for (const m of myMoods) counts.set(m.emoji, (counts.get(m.emoji) || 0) + 1);
    let best = null;
    for (const [emoji, c] of counts.entries()) {
      if (!best || c > best.count) best = { emoji, count: c };
    }
    return best?.emoji || '—';
  }, [myMoods]);

  const overlapPct = useMemo(() => {
    const myByDay = new Map();
    const partnerByDay = new Map();
    for (const m of myMoods) {
      const k = toDayKey(parseISO(m.created_at));
      if (!myByDay.has(k)) myByDay.set(k, m);
    }
    for (const m of partnerMoods) {
      const k = toDayKey(parseISO(m.created_at));
      if (!partnerByDay.has(k)) partnerByDay.set(k, m);
    }
    let common = 0;
    let same = 0;
    for (const [k, m] of myByDay.entries()) {
      const p = partnerByDay.get(k);
      if (!p) continue;
      common += 1;
      if (p.emoji === m.emoji) same += 1;
    }
    if (common === 0) return 0;
    return Math.round((same / common) * 100);
  }, [myMoods, partnerMoods]);

  const detail = useMemo(() => {
    if (!selectedDay) return null;
    const k = toDayKey(selectedDay);
    const my = latestOfDayByUser.get(`${user.id}:${k}`) || null;
    const partnerId = partnerMoods[0]?.user_id;
    const partner = partnerId ? latestOfDayByUser.get(`${partnerId}:${k}`) || null : null;
    return { k, my, partner };
  }, [selectedDay, latestOfDayByUser, user.id, partnerMoods]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">My Calendar</p>
          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-gray-900">Calendar</h1>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Chip active={view === 'month'} onClick={() => setView('month')}>
            Month
          </Chip>
          <Chip active={view === 'week'} onClick={() => setView('week')}>
            Week
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthCursor((d) => addMonths(d, -1))}
            className="h-10 w-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl text-gray-800"
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl px-4 py-2 text-sm font-extrabold text-gray-900">
            {format(monthCursor, 'MMMM')}
          </div>
          <button
            type="button"
            onClick={() => setMonthCursor((d) => addMonths(d, 1))}
            className="h-10 w-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl text-gray-800"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-blue/20 border-none">
          <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">Top Mood</span>
          <span className="text-4xl mt-2">{mostFrequentEmoji}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center bg-pastel-pink/20 border-none">
          <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">Overlap</span>
          <span className="text-3xl mt-2 font-extrabold text-gray-800">{overlapPct}%</span>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-pastel-yellow/30 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-pastel-green/30 blur-3xl" />
        <div className="relative">
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {['S','M','T','W','T','F','S'].map((d) => (
              <div key={d} className="text-xs text-gray-400 font-extrabold">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const k = toDayKey(day);
              const my = latestOfDayByUser.get(`${user.id}:${k}`) || null;
              const partnerId = partnerMoods[0]?.user_id;
              const partner = partnerId ? latestOfDayByUser.get(`${partnerId}:${k}`) || null : null;
              const active = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-2xl border border-white/60 shadow-sm bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-[0.99] ${active ? 'ring-2 ring-gray-900/10' : ''}`}
                >
                  {my?.color ? <div className={`absolute inset-0 opacity-20 ${my.color}`} /> : null}
                  <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-400">{format(day, 'd')}</span>
                  <div className="text-xl">{my?.emoji || ''}</div>
                  {partner?.emoji ? (
                    <span className="absolute bottom-1 right-1 text-xs opacity-80">{partner.emoji}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm p-4">
          <button type="button" className="absolute inset-0" onClick={() => setSelectedDay(null)} aria-label="Close" />
          <div className="relative w-full max-w-md">
            <div className="rounded-t-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-3xl font-extrabold text-gray-900">{format(selectedDay, 'MMMM d')}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{format(selectedDay, 'yyyy')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="h-10 w-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm flex items-center justify-center text-gray-800"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-gray-500 font-semibold animate-pulse">Loading…</div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">You</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-2xl">{detail?.my?.emoji || '—'}</div>
                        <div>
                          <p className="font-extrabold text-gray-900">{detail?.my?.label || '—'}</p>
                          <p className="text-xs text-gray-500 font-semibold">
                            {detail?.my?.created_at ? format(parseISO(detail.my.created_at), 'h:mm a') : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Partner</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-2xl">{detail?.partner?.emoji || '—'}</div>
                        <div>
                          <p className="font-extrabold text-gray-900">{detail?.partner?.label || '—'}</p>
                          <p className="text-xs text-gray-500 font-semibold">
                            {detail?.partner?.created_at ? format(parseISO(detail.partner.created_at), 'h:mm a') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {detail?.my?.note ? (
                    <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Note</p>
                      <p className="mt-2 font-semibold text-gray-800">{String(detail.my.note)}</p>
                    </div>
                  ) : null}

                  {normalizeTags(detail?.my?.tags).length ? (
                    <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Tags</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {normalizeTags(detail?.my?.tags).map((t) => (
                          <div key={t} className="rounded-full bg-gray-900 text-white px-3 py-1 text-xs font-semibold">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
