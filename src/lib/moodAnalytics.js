import { format, parseISO, subDays } from 'date-fns';

export const moodTone = (label = '') => {
  const l = String(label).toLowerCase();
  if (['happy', 'loved', 'excited', 'cool', 'ecstatic'].some((k) => l.includes(k))) return 'high';
  if (['sad', 'annoyed', 'stressed', 'sick', 'furious', 'angry', 'frustrated', 'bad', 'terrible'].some((k) => l.includes(k))) return 'low';
  if (['tired', 'neutral', 'content', 'okay', 'fine'].some((k) => l.includes(k))) return 'neutral';
  return 'neutral';
};

export const toneColor = (tone) => {
  if (tone === 'high') return { stroke: '#2F6B4F', fill: '#CFE9DA' };
  if (tone === 'low') return { stroke: '#9B5B3F', fill: '#F3D4C8' };
  return { stroke: '#8A7F73', fill: '#EFE7DD' };
};

export const moodScore = (label = '') => {
  const t = moodTone(label);
  if (t === 'high') return 2;
  if (t === 'low') return 0;
  return 1;
};

export const groupLatestMoodPerDay = (moods = []) => {
  const map = new Map();
  for (const m of moods) {
    const day = format(parseISO(m.created_at), 'yyyy-MM-dd');
    if (!map.has(day)) map.set(day, m);
  }
  return map;
};

export const lastNDaysKeys = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    out.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return out;
};

