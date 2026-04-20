// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Use empty strings as fallbacks so createClient doesn't throw a "required" error immediately
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// This check helps you debug in the browser console
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase keys are missing. Check your .env.local file and restart your server.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);