import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  isAnonJwt,
  isPublishableKey,
  normalizeSupabaseUrl,
  resolveSupabaseConfig,
} from './supabaseConfig';

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

const anonJwt = jwt({ role: 'anon' });
const serviceJwt = jwt({ role: 'service_role' });
const publishable = 'sb_publishable_examplekey123';

describe('normalizeSupabaseUrl', () => {
  it('trims whitespace and drops trailing slashes', () => {
    expect(normalizeSupabaseUrl('  https://abc.supabase.co/ \n')).toBe('https://abc.supabase.co');
  });
});

describe('key shapes', () => {
  it('accepts a classic anon JWT and a publishable key', () => {
    expect(isAnonJwt(anonJwt)).toBe(true);
    expect(isPublishableKey(publishable)).toBe(true);
    expect(isAnonJwt(serviceJwt)).toBe(false);
    expect(isPublishableKey('sb_secret_examplekey123')).toBe(false);
  });
});

describe('resolveSupabaseConfig', () => {
  it('names each missing variable', () => {
    const resolved = resolveSupabaseConfig({ url: '  ', anonKey: '' });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.issues.map((issue) => `${issue.variable} ${issue.problem}`)).toEqual([
        'VITE_SUPABASE_URL missing',
        'VITE_SUPABASE_ANON_KEY missing',
      ]);
      expect(resolved.issues[0].message).toContain('VITE_SUPABASE_URL');
      expect(resolved.issues[1].message).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });

  it('names a malformed URL or key', () => {
    const resolved = resolveSupabaseConfig({
      url: 'https://abc.supabase.co/rest/v1',
      anonKey: 'your-anon-key',
    });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.issues.map((issue) => issue.variable)).toEqual([
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
      ]);
      expect(resolved.issues.every((issue) => issue.problem === 'malformed')).toBe(true);
    }
  });

  it('rejects a secret key by name', () => {
    const resolved = resolveSupabaseConfig({
      url: 'https://abc.supabase.co',
      anonKey: serviceJwt,
    });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.issues[0].variable).toBe('VITE_SUPABASE_ANON_KEY');
      expect(resolved.issues[0].message).toContain('sb_publishable_');
    }
  });

  it('normalizes the URL and builds a client for both key formats', () => {
    for (const anonKey of [anonJwt, publishable]) {
      const resolved = resolveSupabaseConfig({
        url: ' https://abc.supabase.co/ ',
        anonKey: `  ${anonKey}  `,
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) continue;
      expect(resolved.url).toBe('https://abc.supabase.co');
      const client = createClient(resolved.url, resolved.anonKey);
      expect(client).toBeTruthy();
    }
  });
});
