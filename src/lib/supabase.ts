import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuzeuhltcagvfjqvdidp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1emV1aGx0Y2FndmZqcXZkaWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTc3MzcsImV4cCI6MjA2ODA3MzczN30.l3Q9-0eu2THGmM4isUGcXd_q4pjmnKkDuBc5n87FnPA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};