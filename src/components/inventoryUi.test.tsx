import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SetupPage } from '../pages/SetupPage';
import { emptyDraft, type Guitar, type GuitarDraft } from '../types';
import { GuitarCard, GuitarListRow } from './GuitarCard';
import { GuitarForm } from './GuitarForm';
import { PhotoField } from './PhotoField';

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

function sampleGuitar(photos: string[]): Guitar {
  return {
    ...emptyDraft,
    id: 'g1',
    make: 'Fender',
    model: 'Telecaster',
    photos,
    photoPaths: photos.map((_, index) => `u1/g1/${index}.jpg`),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

describe('main photo', () => {
  it('uses the first photo as the card and list thumbnail', () => {
    const guitar = sampleGuitar(['https://signed/main.jpg', 'https://signed/other.jpg']);
    const { container } = render(
      <MemoryRouter>
        <GuitarCard guitar={guitar} />
        <GuitarListRow guitar={guitar} />
      </MemoryRouter>,
    );

    const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(sources).toEqual(['https://signed/main.jpg', 'https://signed/main.jpg']);
  });

  it('moves a photo to the front from the star and swaps neighbours with the arrows', async () => {
    const user = userEvent.setup();
    const photos = ['https://signed/a.jpg', 'https://signed/b.jpg', 'https://signed/c.jpg'];

    function Harness() {
      const [current, setCurrent] = useState(photos);
      return <PhotoField photos={current} onChange={setCurrent} />;
    }

    const { container } = render(<Harness />);
    const sources = () =>
      [...container.querySelectorAll('.photo-tile img')].map((img) => img.getAttribute('src'));

    expect(sources()).toEqual(photos);
    expect(screen.getAllByText('Main')).toHaveLength(1);
    expect((screen.getByRole('button', { name: 'Move photo 1 left' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole('button', { name: 'Main photo' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe(
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Set photo 3 as main' }));
    expect(sources()).toEqual(['https://signed/c.jpg', 'https://signed/a.jpg', 'https://signed/b.jpg']);
    expect(screen.getAllByText('Main')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Move photo 2 right' }));
    expect(sources()).toEqual(['https://signed/c.jpg', 'https://signed/b.jpg', 'https://signed/a.jpg']);
  });

  it('submits the reordered photos with the chosen main photo first', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(draft: GuitarDraft) => Promise<void>>(async () => {});
    render(
      <MemoryRouter>
        <GuitarForm
          guitar={sampleGuitar(['https://signed/a.jpg', 'https://signed/b.jpg'])}
          onSubmit={onSubmit}
          submitLabel="Save changes"
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Set photo 2 as main' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const saved = onSubmit.mock.calls[0]?.[0];
    expect(saved?.photos).toEqual(['https://signed/b.jpg', 'https://signed/a.jpg']);
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
