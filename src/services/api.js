import { supabase } from '../lib/supabase';

// SPACE
export const apiCreateSpace = async () => {
  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const { data, error } = await supabase
    .from('spaces')
    .insert([{ code }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const apiGetSpaceByCode = async (code) => {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) throw error;
  return data;
};

// USER
export const apiCreateUser = async (spaceId, name, color) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ space_id: spaceId, name, avatar_color: color }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const apiGetUser = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

// MOOD
export const apiUpdateMood = async (userId, spaceId, emoji, label, color) => {
  const { data, error } = await supabase
    .from('moods')
    .insert([{ user_id: userId, space_id: spaceId, emoji, label, color }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const apiGetLatestMoods = async (spaceId) => {
  // Get latest mood for each user in space
  // This is a bit tricky in simple SQL, but we can just fetch last 10 moods and filter in JS for MVP
  const { data, error } = await supabase
    .from('moods')
    .select('*, users(name, avatar_color)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) throw error;
  return data;
};

export const apiGetMoodHistory = async (spaceId) => {
  const { data, error } = await supabase
    .from('moods')
    .select('*, users(name, avatar_color)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })
    .limit(100); // Limit to last 100 for MVP
  
  if (error) throw error;
  return data;
};

// QNA
export const apiGetQuestions = async () => {
  const { data, error } = await supabase.from('questions').select('*');
  if (error) throw error;
  return data;
};

export const apiGetAnswers = async (spaceId, questionId) => {
  const { data, error } = await supabase
    .from('answers')
    .select('*, users(name, avatar_color)')
    .eq('space_id', spaceId)
    .eq('question_id', questionId);
  
  if (error) throw error;
  return data;
};

export const apiGetAllAnswers = async (spaceId) => {
  const { data, error } = await supabase
    .from('answers')
    .select('*, users(name, avatar_color), questions(text, options)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const apiSubmitAnswer = async (userId, spaceId, questionId, optionIndex) => {
  const { data, error } = await supabase
    .from('answers')
    .upsert([{ user_id: userId, space_id: spaceId, question_id: questionId, selected_option_index: optionIndex }], { onConflict: 'question_id, user_id' })
    .select();
  if (error) throw error;
  return data;
};
