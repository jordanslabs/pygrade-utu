import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://bnasudkyanhosbvovenv.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_Nf68F4Clo8WE1R9FsOU8Mw_RY20OKgP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
