import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IS_DEMO_MODE } from './demo/config'
import { mockSupabase } from './demo/mockSupabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-noop.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key'

// En mode demo : tout passe par le mock (localStorage).
// En prod : vrai client Supabase.
export const supabase = (IS_DEMO_MODE
  ? (mockSupabase as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey))
