import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetAllAnswers, apiGetAnswers, apiGetQuestions, apiSubmitAnswer } from '../services/api';
import { supabase } from '../lib/supabase';
import { Button, Card, Chip } from '../components/ui';

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
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [allAnswers, setAllAnswers] = useState([]);
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

  const loadAll = async () => {
    const data = await apiGetAllAnswers(space.id);
    setAllAnswers(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        await loadQuestions();
        await loadAll();
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
        loadAll();
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

  const revealedDeck = useMemo(() => {
    const byQ = new Map();
    for (const a of allAnswers) {
      if (!a.question_id || !a.questions?.text) continue;
      if (!byQ.has(a.question_id)) byQ.set(a.question_id, []);
      byQ.get(a.question_id).push(a);
    }
    const out = [];
    for (const [qid, list] of byQ.entries()) {
      const mine = list.find((x) => x.user_id === user.id) || null;
      const partner = list.find((x) => x.user_id !== user.id) || null;
      if (!mine || !partner) continue;
      const opts = safeOptions(list[0]?.questions?.options);
      out.push({
        key: qid,
        question: list[0].questions.text,
        options: opts,
        you: opts[mine.selected_option_index] ?? '—',
        partner: opts[partner.selected_option_index] ?? '—',
      });
    }
    return out;
  }, [allAnswers, user.id]);

  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setCardIndex((i) => Math.min(i, Math.max(0, revealedDeck.length - 1)));
    setRevealed(false);
  }, [revealedDeck.length]);

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

      <div className="flex gap-2">
        <Chip active={tab === 'answer'} onClick={() => setTab('answer')} className="flex-1 justify-center">Answer</Chip>
        <Chip active={tab === 'flashcards'} onClick={() => setTab('flashcards')} className="flex-1 justify-center">Flashcards</Chip>
      </div>

      {tab === 'answer' && (
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
                  <div className="grid grid-cols-2 gap-3 transition-all duration-300 ease-out">
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
            </div>
          </div>
        </Card>
      )}

      {tab === 'flashcards' && (
        <Card className="relative overflow-hidden">
          <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-pastel-pink/25 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-pastel-green/25 blur-3xl" />
          <div className="relative">
            {!revealedDeck.length ? (
              <div className="py-10 text-center text-gray-500">
                <p className="font-semibold">No shared answers yet</p>
                <p className="text-xs text-gray-400 mt-1">Once both answer a question, it appears here.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500">{cardIndex + 1} / {revealedDeck.length}</p>
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => !r)}
                    className="text-xs font-extrabold text-gray-800 hover:text-gray-900 transition-all"
                  >
                    {revealed ? 'Hide' : 'Reveal'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.vibrate) navigator.vibrate(8);
                    setRevealed((r) => !r);
                  }}
                  className="w-full text-left mt-4"
                >
                  <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-6 transition-all duration-300 ease-out">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Flashcard</p>
                    <p className="mt-2 font-serif text-2xl font-extrabold text-gray-900 leading-snug">
                      {revealedDeck[cardIndex]?.question}
                    </p>

                    <div className="mt-6">
                      {!revealed ? (
                        <div className="rounded-2xl bg-gray-900 text-white px-4 py-4 font-semibold text-center">
                          Tap to reveal both answers
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 transition-opacity duration-300 ease-out">
                          <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">You</p>
                            <p className="mt-2 font-extrabold text-gray-900">{revealedDeck[cardIndex]?.you}</p>
                          </div>
                          <div className="rounded-3xl bg-white/70 border border-white/60 shadow-sm p-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Partner</p>
                            <p className="mt-2 font-extrabold text-gray-900">{revealedDeck[cardIndex]?.partner}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRevealed(false);
                      setCardIndex((i) => Math.max(0, i - 1));
                    }}
                    disabled={cardIndex === 0}
                  >
                    Prev
                  </Button>
                  <Button
                    onClick={() => {
                      setRevealed(false);
                      setCardIndex((i) => Math.min(revealedDeck.length - 1, i + 1));
                    }}
                    disabled={cardIndex >= revealedDeck.length - 1}
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
