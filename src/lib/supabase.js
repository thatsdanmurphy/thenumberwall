/**
 * THE NUMBER WALL — Supabase Client
 * Single instance, shared across the app.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://xnrkaywnlykqbwtqcbrx.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucmtheXdubHlrcWJ3dHFjYnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjI2MTYsImV4cCI6MjA5MDgzODYxNn0.E5pAEs6zaLT2F29aTUx0svjcdEnf6eYFeeYTuZvcgv8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
