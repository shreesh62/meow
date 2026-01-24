import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { useApp } from '../context/AppContext';
import { apiGetMoodHistory } from '../services/api';
import { Card, Chip } from '../components/ui';
import { supabase } from '../lib/supabase';
import { groupLatestMoodPerDay, lastNDaysKeys, moodTone, toneColor } from '../lib/moodAnalytics';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const catmullRomToBezier = (points) => {
  if (points.length < 2) return '';
  const d = [];
  d.push(`M ${points[0].x} ${points[0].y}`);
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
};

const scoreForTone = (tone) => {
  if (tone === 'high') return 2;
  if (tone === 'low') return 0;
  return 1;
};

const MoodTimeline = ({ title, seriesA, seriesB }) => {
  const [active, setActive] = useState(null);
  const dims = { w: 340, h: 160, padX: 16, padY: 18 };

  const prep = (series) => {
    const minS = 0;
    const maxS = 2;
    return series.map((p, idx) => {
      const x = dims.padX + (idx * (dims.w - dims.padX * 2)) / Math.max(1, series.length - 1);
      const tone = moodTone(p.label);
      const s = scoreForTone(tone);
      const y = dims.padY + ((maxS - s) * (dims.h - dims.padY * 2)) / (maxS - minS);
      return { ...p, x, y, tone };
    });
  };

  const a = useMemo(() => prep(seriesA), [seriesA]);
  const b = useMemo(() => (seriesB ? prep(seriesB) : []), [seriesB]);
  const pathA = useMemo(() => catmullRomToBezier(a.map(({ x, y }) => ({ x, y }))), [a]);
  const pathB = useMemo(() => catmullRomToBezier(b.map(({ x, y }) => ({ x, y }))), [b]);

  const activePoint = active ? (active.which === 'a' ? a[active.idx] : b[active.idx]) : null;
  const tc = activePoint ? toneColor(activePoint.tone) : toneColor('neutral');

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-pastel-yellow/25 blur-3xl" />
      <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-pastel-green/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">{title}</p>
            <p className="mt-2 text-sm font-semibold text-gray-600">A soft view of how days have felt.</p>
          </div>
          {activePoint ? (
            <div className="rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl px-3 py-2">
              <div className="text-xs font-extrabold text-gray-900">{activePoint.emoji} {activePoint.label}</div>
              <div className="text-[10px] font-semibold text-gray-600">{activePoint.dateLabel}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <svg viewBox={`0 0 ${dims.w} ${dims.h}`} className="w-full h-[160px]">
            <path d={pathA} fill="none" stroke="#111827" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
            <path d={pathA} fill="none" stroke={tc.stroke} strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />

            {pathB ? (
              <path d={pathB} fill="none" stroke="#111827" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />
            ) : null}
            {pathB ? (
              <path d={pathB} fill="none" stroke="#5B6470" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 6" />
            ) : null}

            {a.map((p, idx) => {
              const c = toneColor(p.tone);
              return (
                <g key={p.key}>
                  <circle cx={p.x} cy={p.y} r="6" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
                  <text x={p.x} y={clamp(p.y - 12, 12, dims.h - 12)} textAnchor="middle" fontSize="10">
                    {p.emoji}
                  </text>
                  <rect
                    x={p.x - 14}
                    y={p.y - 14}
                    width="28"
                    height="28"
                    fill="transparent"
                    onMouseEnter={() => setActive({ which: 'a', idx })}
                    onMouseLeave={() => setActive(null)}
                    onClick={() => {
                      if (navigator?.vibrate) navigator.vibrate(8);
                      setActive((cur) => (cur && cur.which === 'a' && cur.idx === idx ? null : { which: 'a', idx }));
                    }}
                  />
                </g>
              );
            })}

            {b.map((p, idx) => (
              <g key={p.key}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke="#5B6470" strokeOpacity="0.7" strokeWidth="2" />
                <rect
                  x={p.x - 14}
                  y={p.y - 14}
                  width="28"
                  height="28"
                  fill="transparent"
                  onMouseEnter={() => setActive({ which: 'b', idx })}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => {
                    if (navigator?.vibrate) navigator.vibrate(8);
                    setActive((cur) => (cur && cur.which === 'b' && cur.idx === idx ? null : { which: 'b', idx }));
                  }}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </Card>
  );
};

const Insights = () => {
  const { user, space } = useApp();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week'); // day | week | month

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
      .channel('insights-moods')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moods', filter: `space_id=eq.${space.id}` }, () => load())
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

  const keys = useMemo(() => {
    if (range === 'day') {
      const out = [];
      for (let i = 6; i >= 0; i -= 1) {
        out.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
      }
      return out;
    }
    if (range === 'month') return lastNDaysKeys(30);
    return lastNDaysKeys(7);
  }, [range]);

  const series = useMemo(() => {
    const my = moods.filter((m) => m.user_id === user.id);
    const partner = moods.filter((m) => m.user_id !== user.id);
    const myMap = groupLatestMoodPerDay(my);
    const partnerMap = groupLatestMoodPerDay(partner);

    const a = keys.map((k) => {
      const m = myMap.get(k);
      if (!m) return { key: `me-${k}`, created_at: `${k}T00:00:00`, emoji: '•', label: 'Quiet', dateLabel: format(new Date(`${k}T00:00:00`), 'EEE, MMM d') };
      return { key: `me-${k}`, created_at: m.created_at, emoji: m.emoji, label: m.label, dateLabel: format(parseISO(m.created_at), 'EEE, MMM d') };
    });

    const b = keys.map((k) => {
      const m = partnerMap.get(k);
      if (!m) return { key: `p-${k}`, created_at: `${k}T00:00:00`, emoji: '•', label: 'Quiet', dateLabel: format(new Date(`${k}T00:00:00`), 'EEE, MMM d') };
      return { key: `p-${k}`, created_at: m.created_at, emoji: m.emoji, label: m.label, dateLabel: format(parseISO(m.created_at), 'EEE, MMM d') };
    });

    return { a, b };
  }, [moods, user.id, keys]);

  const distribution = useMemo(() => {
    const my = moods.filter((m) => m.user_id === user.id);
    const counts = new Map();
    for (const m of my) counts.set(`${m.emoji} ${m.label}`, (counts.get(`${m.emoji} ${m.label}`) || 0) + 1);
    const entries = Array.from(counts.entries()).map(([k, v]) => ({ key: k, count: v, tone: moodTone(k) }));
    entries.sort((x, y) => y.count - x.count);
    return entries.slice(0, 8);
  }, [moods, user.id]);

  const overlapStats = useMemo(() => {
    const my = moods.filter((m) => m.user_id === user.id);
    const partner = moods.filter((m) => m.user_id !== user.id);
    const myMap = groupLatestMoodPerDay(my);
    const partnerMap = groupLatestMoodPerDay(partner);
    const days = Array.from(myMap.keys()).sort();
    let common = 0;
    let same = 0;
    let bestEmoji = null;
    const sharedCounts = new Map();

    let streak = 0;
    let bestStreak = 0;
    let prevDay = null;

    for (const d of days) {
      const p = partnerMap.get(d);
      const m = myMap.get(d);
      if (!p || !m) continue;
      common += 1;
      const isSame = p.emoji === m.emoji;
      if (isSame) {
        same += 1;
        const key = m.emoji;
        sharedCounts.set(key, (sharedCounts.get(key) || 0) + 1);
      }

      const dayDate = new Date(`${d}T00:00:00`);
      const prevDate = prevDay ? new Date(`${prevDay}T00:00:00`) : null;
      const consecutive = prevDate ? (dayDate.getTime() - prevDate.getTime()) === 86400000 : false;
      if (!consecutive) streak = 0;
      if (isSame) streak += 1;
      else streak = 0;
      bestStreak = Math.max(bestStreak, streak);
      prevDay = d;
    }

    for (const [emoji, c] of sharedCounts.entries()) {
      if (!bestEmoji || c > bestEmoji.count) bestEmoji = { emoji, count: c };
    }

    return {
      overlapPct: common ? Math.round((same / common) * 100) : 0,
      mostShared: bestEmoji?.emoji || '—',
      softStreak: bestStreak,
    };
  }, [moods, user.id]);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-sm font-semibold text-gray-500">Mood Insights</p>
        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-gray-900">Insights</h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">Optional, gentle patterns. No judgment.</p>
      </div>

      <div className="flex gap-2">
        <Chip active={range === 'day'} onClick={() => setRange('day')}>Day</Chip>
        <Chip active={range === 'week'} onClick={() => setRange('week')}>Week</Chip>
        <Chip active={range === 'month'} onClick={() => setRange('month')}>Month</Chip>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="h-5 w-32 bg-white/60 rounded-xl animate-pulse" />
          <div className="mt-4 h-40 bg-white/60 rounded-3xl animate-pulse" />
        </Card>
      ) : (
        <MoodTimeline title="Mood timeline" seriesA={series.a} seriesB={series.b} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">You</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-2xl">{myLatest?.emoji || '—'}</div>
            <div>
              <p className="font-extrabold text-gray-900">{myLatest?.label || 'Quiet'}</p>
              <p className="text-xs font-semibold text-gray-500">{myLatest?.created_at ? format(parseISO(myLatest.created_at), 'h:mm a') : ''}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Partner</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-2xl">{partnerLatest?.emoji || '—'}</div>
            <div>
              <p className="font-extrabold text-gray-900">{partnerLatest?.label || 'Quiet'}</p>
              <p className="text-xs font-semibold text-gray-500">{partnerLatest?.created_at ? format(parseISO(partnerLatest.created_at), 'h:mm a') : ''}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Mood distribution</p>
        <p className="mt-2 text-sm font-semibold text-gray-600">What shows up most often.</p>
        <div className="mt-4 space-y-2">
          {distribution.map((d) => {
            const c = toneColor(d.tone);
            return (
              <div key={d.key} className="flex items-center gap-3">
                <div className="w-28 text-sm font-extrabold text-gray-900 truncate">{d.key}</div>
                <div className="flex-1 h-3 rounded-full bg-white/60 border border-white/60 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${clamp(d.count * 12, 8, 100)}%`, backgroundColor: c.fill, borderRight: `2px solid ${c.stroke}` }} />
                </div>
                <div className="w-8 text-right text-xs font-extrabold text-gray-700">{d.count}</div>
              </div>
            );
          })}
          {!distribution.length ? (
            <div className="py-6 text-center text-gray-500 font-semibold">Nothing to summarize yet.</div>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">Sync & patterns</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Overlap</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{overlapStats.overlapPct}%</p>
          </div>
          <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Most shared</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{overlapStats.mostShared}</p>
          </div>
          <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Soft streak</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{overlapStats.softStreak || 0}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-gray-500">
          Streak is simply consecutive days with the same mood emoji — it’s not a score.
        </p>
      </Card>
    </div>
  );
};

export default Insights;

