import { createClient } from '@supabase/supabase-js';

// Supabase Configuration from Project Dashboard
export const SUPABASE_URL = 'https://vjiuwzlubgsjaumrubpc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_94cPK_sA_plMIbSjE3RkXw_hHtk_krs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
