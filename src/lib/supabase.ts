import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzbelaoofgmurwhzadul.supabase.co';
const supabaseAnonKey = 'sb_publishable_K4bkt2akSPt2igA3unTObg_WEixyCgx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
