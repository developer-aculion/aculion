import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://buqtshfptmqieaqcghfx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key-to-prevent-startup-crash';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
