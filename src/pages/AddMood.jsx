import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiUpdateMood } from '../services/api';
import { Button, Card, Chip, Input } from '../components/ui';
import { MOOD_PRESETS } from '../lib/colors';

const TAGS = [
  'work',
  'family',
  'relationship',
  'friends',
  'myself',
  'health',
  'school',
  'money',
  'home',
  'sleep',
];

const greeting = (name) => {
  if (!name) return 'Dear you!';
  return `Dear ${name}!`;
};

const AddMood = () => {
  const { user, space } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleTag = (t) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const canSubmit = !!selected && !saving;

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const safeNote = String(note || '').trim().slice(0, 60);
      const tags = selectedTags.slice(0, 8);
      await apiUpdateMood(user.id, space.id, selected.emoji, selected.label, selected.color, {
        tags,
        note: safeNote || undefined,
      });
      if (navigator?.vibrate) navigator.vibrate(10);
      navigate('/', { replace: true });
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not save mood');
    } finally {
      setSaving(false);
    }
  };

  const tiles = useMemo(() => MOOD_PRESETS.slice(0, 9), []);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-gray-900 leading-tight">{greeting(user?.name)}</h1>
          <p className="mt-1 text-sm font-semibold text-gray-500">How was your day?</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur-xl flex items-center justify-center text-gray-800 hover:bg-white transition-all"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((m) => {
            const active = selected?.label === m.label;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => setSelected(m)}
                className={`rounded-2xl border border-white/60 shadow-sm p-4 text-center transition-all active:scale-[0.99] ${m.color} ${active ? 'ring-2 ring-gray-900/20' : ''}`}
              >
                <div className="text-3xl">{m.emoji}</div>
                <div className="mt-2 text-xs font-extrabold text-gray-900">{m.label}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="p-5 space-y-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">What was it about?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <Chip key={t} active={selectedTags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500">One-line note (optional)</p>
            <div className="mt-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A tiny title or note…"
                maxLength={60}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={submit} disabled={!canSubmit}>
              {saving ? 'Saving…' : 'Next'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AddMood;

