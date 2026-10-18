import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authError';

describe('authErrorMessage', () => {
  it('turns a bare Failed to fetch into setup guidance', () => {
    const message = authErrorMessage(new TypeError('Failed to fetch'));
    expect(message).toContain('Failed to fetch');
    expect(message).toContain('.env.local');
    expect(message).toContain('restart the dev server');
    expect(message).toContain('VITE_SUPABASE_URL');
    expect(message).toContain('VITE_SUPABASE_ANON_KEY');
  });
});
