import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  resolveSupabaseConfig,
  type SupabaseConfigIssue,
} from './supabaseConfig';

const resolved = resolveSupabaseConfig({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const PHOTO_BUCKET = 'guitar-photos';
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

export function supabaseConfigIssues(): SupabaseConfigIssue[] {
  return resolved.ok ? [] : resolved.issues;
}

export function isSupabaseConfigured(): boolean {
  return resolved.ok;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!resolved.ok) {
    const names = [...new Set(resolved.issues.map((issue) => issue.variable))].join(' and ');
    throw new Error(
      `Supabase is not configured (${names}). Copy .env.example to .env.local, set the variables, and restart the dev server.`,
    );
  }
  if (!client) {
    client = createClient(resolved.url, resolved.anonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
