import { describe, expect, it } from 'vitest';
import { linkify } from './linkify';

describe('linkify', () => {
  it('keeps surrounding prose and trailing punctuation outside the link', () => {
    const parts = linkify('See https://example.com/path. and more');
    expect(parts).toEqual([
      { type: 'text', value: 'See ' },
      { type: 'link', value: 'https://example.com/path' },
      { type: 'text', value: '. and more' },
    ]);
  });
});
