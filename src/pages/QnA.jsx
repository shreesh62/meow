import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetAllAnswers, apiGetQuestions, apiSubmitAnswer } from '../services/api';
import { supabase } from '../lib/supabase';
import { Button, Card, Chip } from '../components/ui';
import { normalizeBgClass } from '../lib/colors';

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
  const [tab, setTab] = useState('answer'); // answer | flashcards
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [qs, ans] = await Promise.all([apiGetQuestions(), apiGetAllAnswers(space.id)]);
    const safeQs = qs || [];
    const safeAns = ans || [];
    setQuestions(safeQs);
    setAnswers(safeAns);
    if (!activeQuestionId && safeQs.length > 0) setActiveQuestionId(safeQs[0].id);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        await loadData();
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();

    const channel = supabase
      .channel('answers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `space_id=eq.${space.id}` }, () => {
        run();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [space.id]);

  const myAnswersByQuestion = useMemo(() => {
    const map = new Map();
    for (const a of answers) {
      if (a.user_id === user.id) map.set(a.question_id, a);
    }
    return map;
  }, [answers, user.id]);

  const partnerAnswersDeck = useMemo(() => {
    const deck = [];
    for (const a of answers) {
      if (a.user_id === user.id) continue;
      if (!a.questions?.text) continue;
      deck.push(a);
    }
    return deck;
  }, [answers, user.id]);

  const activeQuestion = useMemo(() => questions.find((q) => q.id === activeQuestionId) || null, [questions, activeQuestionId]);
  const activeOptions = useMemo(() => safeOptions(activeQuestion?.options), [activeQuestion]);
  const myActiveAnswer = activeQuestionId ? myAnswersByQuestion.get(activeQuestionId) : null;

  const submit = async (optionIndex) => {
    if (!activeQuestionId) return;
    setSubmitting(true);
    try {
      await apiSubmitAnswer(user.id, space.id, activeQuestionId, optionIndex);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Failed to save your answer');
    } finally {
      setSubmitting(false);
    }
  };

  const [cardIndex, setCardIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    setReveal(false);
    setCardIndex((i) => Math.min(i, Math.max(0, partnerAnswersDeck.length - 1)));
  }, [partnerAnswersDeck.length]);

  const currentCard = partnerAnswersDeck[cardIndex] || null;

  if (loading) {
    return <div className="pt-10 text-center text-gray-500 font-semibold animate-pulse">Loading Q&A…</div>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Q&A</h1>
          <p className="text-sm text-gray-500 font-semibold">Answer anytime. See partner later as flashcards.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Chip active={tab === 'answer'} onClick={() => setTab('answer')} className="flex-1 justify-center">
          Answer
        </Chip>
        <Chip active={tab === 'flashcards'} onClick={() => setTab('flashcards')} className="flex-1 justify-center">
          Flashcards
        </Chip>
      </div>

      {tab === 'answer' && (
        <Card className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-pastel-yellow/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-pastel-blue/30 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap gap-2 mb-6">
              {questions.slice(0, 12).map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`h-9 w-9 rounded-2xl flex items-center justify-center text-sm font-extrabold transition-all ${
                    q.id === activeQuestionId ? 'bg-gray-900 text-white shadow-sm' : 'bg-white/70 text-gray-700 hover:bg-white'
                  }`}
                  aria-label={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 leading-snug">
              {activeQuestion?.text}
            </h2>
            <p className="mt-2 text-xs text-gray-500 font-semibold">
              {myActiveAnswer ? 'Saved' : 'Not answered yet'}
            </p>

            <div className="mt-6 space-y-3">
              {activeOptions.map((opt, idx) => {
                const selected = myActiveAnswer?.selected_option_index === idx;
                return (
                  <button
                    key={`${activeQuestionId}-${idx}`}
                    type="button"
                    onClick={() => submit(idx)}
                    disabled={submitting}
                    className={`w-full rounded-2xl px-4 py-4 text-left font-semibold transition-all border ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white/70 text-gray-800 border-white/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="leading-relaxed">{opt}</span>
                      {selected && <span className="text-xs font-extrabold bg-white/15 px-3 py-1 rounded-full">Selected</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <Button variant="secondary" onClick={() => setTab('flashcards')}>
                See partner flashcards
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'flashcards' && (
        <Card className="relative overflow-hidden">
          <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-pastel-pink/30 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-pastel-green/30 blur-3xl" />

          <div className="relative">
            {!partnerAnswersDeck.length ? (
              <div className="py-10 text-center">
                <p className="font-semibold text-gray-700">No partner answers yet</p>
                <p className="text-xs text-gray-500 mt-1">When they answer, their flashcards appear here.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xs font-semibold text-gray-500">
                    {cardIndex + 1} / {partnerAnswersDeck.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all"
                  >
                    {reveal ? 'Hide' : 'Reveal'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  className="w-full text-left"
                >
                  <div className={`rounded-3xl border border-white/60 shadow-sm bg-white/70 p-6 transition-all ${reveal ? 'scale-[0.99]' : ''}`}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`h-10 w-10 rounded-2xl ${normalizeBgClass(currentCard?.users?.avatar_color)} flex items-center justify-center text-xl border border-white/50 shadow-sm`}>
                        🙂
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Partner</p>
                        <p className="font-extrabold text-gray-900">{currentCard?.users?.name || 'Your person'}</p>
                      </div>
                    </div>

                    <p className="text-lg font-extrabold text-gray-900 leading-snug">{currentCard?.questions?.text}</p>
                    <div className="mt-6">
                      {!reveal ? (
                        <div className="rounded-2xl bg-gray-900 text-white px-4 py-4 font-semibold text-center">
                          Tap to reveal answer
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-pastel-yellow/40 border border-white/60 px-4 py-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Their answer</p>
                          <p className="mt-1 text-lg font-extrabold text-gray-900">
                            {safeOptions(currentCard?.questions?.options)[currentCard?.selected_option_index] ?? '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReveal(false);
                      setCardIndex((i) => Math.max(0, i - 1));
                    }}
                    disabled={cardIndex === 0}
                  >
                    Prev
                  </Button>
                  <Button
                    onClick={() => {
                      setReveal(false);
                      setCardIndex((i) => Math.min(partnerAnswersDeck.length - 1, i + 1));
                    }}
                    disabled={cardIndex >= partnerAnswersDeck.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QnA;
