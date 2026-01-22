import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetQuestions, apiGetAnswers, apiSubmitAnswer } from '../services/api';
import { supabase } from '../lib/supabase';
import { Card, Button } from '../components/ui';
import { getDayOfYear } from 'date-fns';

const QnA = () => {
  const { user, space } = useApp();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Get all questions
        const allQuestions = await apiGetQuestions();
        if (!allQuestions || allQuestions.length === 0) {
            setQuestion(null);
            return;
        }

        // 2. Pick today's question deterministically
        const dayOfYear = getDayOfYear(new Date());
        const questionIndex = dayOfYear % allQuestions.length;
        const todaysQuestion = allQuestions[questionIndex];
        setQuestion(todaysQuestion);

        // 3. Get answers for this question
        if (todaysQuestion) {
            const answersData = await apiGetAnswers(space.id, todaysQuestion.id);
            setAnswers(answersData || []);
        }

      } catch (error) {
        console.error("Failed to load QnA", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Realtime subscription for answers
    const channel = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'answers', filter: `space_id=eq.${space.id}` },
        () => {
             // Reload to simplify state management
             loadData();
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [space.id]);

  const handleAnswer = async (index) => {
    if (!question) return;
    setSubmitting(true);
    try {
        await apiSubmitAnswer(user.id, space.id, question.id, index);
        // Optimistic update or wait for realtime
    } catch (error) {
        console.error("Failed to submit answer", error);
        alert("Failed to submit answer");
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center pt-20 text-gray-400">Loading daily question...</div>;
  if (!question) return <div className="text-center pt-20 text-gray-400">No questions available yet!</div>;

  const myAnswer = answers.find(a => a.user_id === user.id);
  const partnerAnswer = answers.find(a => a.user_id !== user.id);
  
  // Parse options safely
  let options = [];
  try {
      options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
  } catch (e) {
      options = ["Yes", "No"];
  }

  const showResults = myAnswer && partnerAnswer;

  return (
    <div className="pt-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-800">Daily Question</h1>
      
      <Card className="min-h-[400px] flex flex-col justify-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-pastel-yellow/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pastel-blue/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-8 leading-relaxed">
                {question.text}
            </h2>

            <div className="space-y-3">
                {options.map((opt, idx) => {
                    const isSelected = myAnswer?.selected_option_index === idx;
                    const isPartnerSelected = partnerAnswer?.selected_option_index === idx;
                    
                    let btnClass = "bg-gray-50 hover:bg-gray-100 text-gray-700"; // Default
                    
                    if (showResults) {
                        if (isSelected && isPartnerSelected) {
                            btnClass = "bg-pastel-green text-gray-800 ring-2 ring-green-400 border-green-400"; // Match!
                        } else if (isSelected) {
                            btnClass = "bg-pastel-blue text-white"; // My choice
                        } else if (isPartnerSelected) {
                            btnClass = "bg-pastel-pink text-gray-800 border-pastel-pink"; // Partner choice
                        } else {
                            btnClass = "opacity-50";
                        }
                    } else if (myAnswer) {
                        // Waiting state
                        if (isSelected) {
                            btnClass = "bg-pastel-blue text-white";
                        } else {
                            btnClass = "opacity-40 cursor-not-allowed";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => !myAnswer && handleAnswer(idx)}
                            disabled={!!myAnswer || submitting}
                            className={`w-full p-4 rounded-xl text-left font-medium transition-all relative overflow-hidden ${btnClass}`}
                        >
                            <span className="relative z-10 flex justify-between items-center">
                                {opt}
                                {showResults && isPartnerSelected && (
                                    <span className="text-xs bg-white/80 px-2 py-1 rounded-full text-gray-600 shadow-sm">Partner</span>
                                )}
                                {showResults && isSelected && !isPartnerSelected && (
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white">You</span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {!showResults && myAnswer && !partnerAnswer && (
                <div className="mt-8 text-center animate-pulse text-gray-500 text-sm font-medium bg-gray-50 py-3 rounded-full">
                    Waiting for partner to answer... 🤫
                </div>
            )}
            
            {!showResults && myAnswer && partnerAnswer && (
                 // Should be covered by showResults logic, but just in case
                 <div className="mt-8 text-center text-green-500 font-bold">
                    Both answered! Revealing...
                </div>
            )}
            
            {showResults && (
                <div className="mt-8 text-center">
                    {myAnswer.selected_option_index === partnerAnswer.selected_option_index ? (
                        <p className="text-pastel-green font-bold text-lg">It's a Match! 🎉</p>
                    ) : (
                        <p className="text-gray-400">Interesting difference! 🤔</p>
                    )}
                </div>
            )}
        </div>
      </Card>
    </div>
  );
};

export default QnA;
