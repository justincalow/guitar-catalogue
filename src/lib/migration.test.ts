import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('inventory migration', () => {
  const sql = readFileSync(
    'supabase/migrations/20261018120000_inventory_guitars_and_amps.sql',
    'utf8',
  );

  it('adds inventory columns idempotently and keeps owner RLS', () => {
    expect(sql).toContain('add column if not exists item_kind');
    expect(sql).toContain('add column if not exists status');
    expect(sql).toContain('add column if not exists list_price');
    expect(sql).toContain('add column if not exists floor_price');
    expect(sql).toContain('add column if not exists insurance_low');
    expect(sql).toContain('add column if not exists insurance_high');
    expect(sql).toContain('add column if not exists insurance_value');
    expect(sql).toContain('add column if not exists sold_date');
    expect(sql).toContain('add column if not exists sold_price');
    expect(sql).toContain('add column if not exists quantity');
    expect(sql).toContain('add column if not exists details');
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('force row level security');
    expect(sql.toLowerCase()).not.toContain('drop table');
    expect(sql).not.toContain('service_role');
  });
});
