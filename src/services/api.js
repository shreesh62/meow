import { supabase } from '../lib/supabase';

// Helper to handle Supabase errors more gracefully
const handleSupabaseCall = async (promise) => {
  try {
    const { data, error } = await promise;
    if (error) {
      // Check for specific Supabase error codes or messages
      if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error('Supabase project might be paused or down. Please check your Supabase dashboard.');
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error("Network error: Cannot reach Supabase. If you haven't used the app in a week, your Supabase project might be paused. Log into Supabase to unpause it.");
    }
    throw err;
  }
};

// SPACES
export const apiCreateSpace = async () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return handleSupabaseCall(
    supabase
      .from('spaces')
      .insert([{ code }])
      .select()
      .single()
  );
};

export const apiGetSpaceByCode = async (code) => {
  return handleSupabaseCall(
    supabase
      .from('spaces')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
  );
};

export const apiGetSpaceById = async (id) => {
  return handleSupabaseCall(
    supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single()
  );
};

// USERS
export const apiCreateUser = async (spaceId, name, avatarColor) => {
  return handleSupabaseCall(
    supabase
      .from('users')
      .insert([{ space_id: spaceId, name, avatar_color: avatarColor }])
      .select()
      .single()
  );
};

export const apiGetUser = async (id) => {
  return handleSupabaseCall(
    supabase
      .from('users')
      .select('*, spaces(*)')
      .eq('id', id)
      .single()
  );
};

// MOODS
export const apiUpdateMood = async (userId, spaceId, emoji, label, color, tags = [], note = '') => {
  return handleSupabaseCall(
    supabase
      .from('moods')
      .insert([{ user_id: userId, space_id: spaceId, emoji, label, color, tags, note }])
  );
};

export const apiGetLatestMoods = async (spaceId) => {
  return handleSupabaseCall(
    supabase
      .from('moods')
      .select('*, users(name, avatar_color)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(10) // Get more to find unique users
  );
};

export const apiGetMoodHistory = async (spaceId) => {
  return handleSupabaseCall(
    supabase
      .from('moods')
      .select('*, users(name, avatar_color)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(100)
  );
};

// QNA
export const apiGetQuestions = async () => {
  return handleSupabaseCall(
    supabase.from('questions').select('*')
  );
};

export const apiGetAnswers = async (spaceId, questionId) => {
  return handleSupabaseCall(
    supabase
      .from('answers')
      .select('*, users(name, avatar_color)')
      .eq('space_id', spaceId)
      .eq('question_id', questionId)
  );
};

export const apiGetAllAnswers = async (spaceId) => {
  return handleSupabaseCall(
    supabase
      .from('answers')
      .select('*, users(name, avatar_color), questions(text, options)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
  );
};

export const apiSubmitAnswer = async (userId, spaceId, questionId, optionIndex) => {
  return handleSupabaseCall(
    supabase
      .from('answers')
      .upsert([{ 
        user_id: userId, 
        space_id: spaceId, 
        question_id: questionId, 
        selected_option_index: optionIndex 
      }])
  );
};
