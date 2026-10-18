import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SetupPage } from '../pages/SetupPage';
import { GuitarForm } from './GuitarForm';

describe('GuitarForm', () => {
  it('hides guitar-only fields for an amp and shows sale fields when sold', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GuitarForm onSubmit={async () => {}} submitLabel="Save" />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Number of strings')).toBeTruthy();
    expect(screen.getByLabelText('Pickup configuration')).toBeTruthy();
    expect(screen.queryByLabelText('Sold date')).toBeNull();

    await user.selectOptions(screen.getByLabelText('Kind'), 'amp');
    expect(screen.queryByLabelText('Number of strings')).toBeNull();
    expect(screen.queryByLabelText('Pickup configuration')).toBeNull();
    expect(screen.queryByLabelText('Type')).toBeNull();
    expect(screen.getByLabelText('Details')).toBeTruthy();

    await user.selectOptions(screen.getByLabelText('Status'), 'sold');
    expect(screen.getByLabelText('Sold date')).toBeTruthy();
    expect(screen.getByLabelText('Sold price (CAD)')).toBeTruthy();
  });
});

describe('SetupPage', () => {
  it('names each missing or malformed variable', () => {
    render(
      <SetupPage
        issues={[
          {
            variable: 'VITE_SUPABASE_URL',
            problem: 'missing',
            message:
              'VITE_SUPABASE_URL is missing. Add it to .env.local and restart the dev server.',
          },
          {
            variable: 'VITE_SUPABASE_ANON_KEY',
            problem: 'malformed',
            message:
              'VITE_SUPABASE_ANON_KEY is malformed. Use the anon JWT (eyJ…) or a publishable key that starts with sb_publishable_.',
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        'VITE_SUPABASE_URL is missing. Add it to .env.local and restart the dev server.',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/VITE_SUPABASE_ANON_KEY is malformed/)).toBeTruthy();
  });
});
