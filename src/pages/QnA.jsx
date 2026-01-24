import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetAnswers, apiGetQuestions, apiSubmitAnswer } from '../services/api';
import { supabase } from '../lib/supabase';
import { Button, Card } from '../components/ui';

const safeOptions = (options) => {
  if (Array.isArray(options)) return options;
  try {
    if (typeof options === 'string') return JSON.parse(options);
  } catch {
    return [];
  }
  return [];
};

const QnA = () => {
  const { user, space } = useApp();
  const [questions, setQuestions] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    const qs = await apiGetQuestions();
    const list = qs || [];
    setQuestions(list);
    if (!activeQuestionId && list.length) setActiveQuestionId(list[0].id);
  };

  const loadAnswers = async (qid) => {
    if (!qid) return;
    const data = await apiGetAnswers(space.id, qid);
    setAnswers(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        await loadQuestions();
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [space.id]);

  useEffect(() => {
    loadAnswers(activeQuestionId);
  }, [activeQuestionId]);

  useEffect(() => {
    const channel = supabase
      .channel('answers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `space_id=eq.${space.id}` }, () => {
        loadAnswers(activeQuestionId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id, activeQuestionId]);

  const activeQuestion = useMemo(() => questions.find((q) => q.id === activeQuestionId) || null, [questions, activeQuestionId]);
  const options = useMemo(() => safeOptions(activeQuestion?.options), [activeQuestion?.options]);
  const myAnswer = useMemo(() => answers.find((a) => a.user_id === user.id) || null, [answers, user.id]);
  const partnerAnswer = useMemo(() => answers.find((a) => a.user_id !== user.id) || null, [answers, user.id]);
  const bothAnswered = !!myAnswer && !!partnerAnswer;

  const submit = async (optionIndex) => {
    if (!activeQuestionId) return;
    setSaving(true);
    try {
      await apiSubmitAnswer(user.id, space.id, activeQuestionId, optionIndex);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not save your answer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="pt-10 text-center text-gray-500 font-semibold animate-pulse">Loading…</div>;
  }

  if (!questions.length) {
    return (
      <div className="pt-10 text-center text-gray-500">
        <p className="font-semibold">No questions yet</p>
        <p className="text-xs text-gray-400 mt-1">Add questions in Supabase to use this tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-sm font-semibold text-gray-500">Q&A</p>
        <h1 className="font-serif text-4xl font-extrabold tracking-tight text-gray-900">Questions</h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">Answer anytime. Results appear when both have answered.</p>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-pastel-yellow/30 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-pastel-blue/30 blur-3xl" />
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveQuestionId(q.id)}
                className={`shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-extrabold transition-all ${
                  q.id === activeQuestionId ? 'bg-gray-900 text-white shadow-sm' : 'bg-white/70 text-gray-700 hover:bg-white'
                }`}
                aria-label={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Question</p>
            <h2 className="mt-2 text-xl font-extrabold text-gray-900 leading-snug">{activeQuestion?.text}</h2>

            <div className="mt-6 space-y-3">
              {options.map((opt, idx) => {
                const selected = myAnswer?.selected_option_index === idx;
                return (
                  <button
                    key={`${activeQuestionId}-${idx}`}
                    type="button"
                    onClick={() => submit(idx)}
                    disabled={saving}
                    className={`w-full rounded-2xl px-4 py-4 text-left font-semibold transition-all border ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white/70 text-gray-800 border-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="leading-relaxed">{opt}</span>
                      {selected ? <span className="text-xs font-extrabold bg-white/15 px-3 py-1 rounded-full">Saved</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {!bothAnswered && myAnswer ? (
              <div className="mt-6 rounded-2xl bg-white/70 border border-white/60 shadow-sm px-4 py-4 text-sm font-semibold text-gray-600">
                Your answer is saved. Whenever your partner answers, you’ll see both together.
              </div>
            ) : null}

            {bothAnswered ? (
              <div className="mt-6 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Reveal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">You</p>
                    <p className="mt-2 font-extrabold text-gray-900">
                      {options[myAnswer.selected_option_index] ?? '—'}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Partner</p>
                    <p className="mt-2 font-extrabold text-gray-900">
                      {options[partnerAnswer.selected_option_index] ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <Button variant="secondary" onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QnA;
