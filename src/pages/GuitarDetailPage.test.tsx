import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { emptyDraft, type Guitar } from '../types';
import { GuitarDetailPage } from './GuitarDetailPage';

const guitar: Guitar = {
  ...emptyDraft,
  id: 'g1',
  name: 'Tele',
  make: 'Fender',
  model: 'Telecaster',
  photos: ['https://signed/a.jpg', 'https://signed/b.jpg', 'https://signed/c.jpg'],
  photoPaths: ['u1/g1/a.jpg', 'u1/g1/b.jpg', 'u1/g1/c.jpg'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

vi.mock('../store', () => ({
  useGuitars: () => ({
    ready: true,
    getById: (id: string) => (id === guitar.id ? guitar : undefined),
    deleteGuitar: vi.fn(async () => {}),
  }),
}));

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/guitar/g1']}>
      <Routes>
        <Route path="/guitar/:id" element={<GuitarDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuitarDetailPage photos', () => {
  it('opens the lightbox from the hero or a thumbnail and keeps the hero in sync', async () => {
    const user = userEvent.setup();
    renderDetail();

    const hero = () => screen.getByRole('button', { name: /view tele photo \d of 3 full size/i });
    expect(hero().querySelector('img')?.getAttribute('src')).toBe('https://signed/a.jpg');

    await user.click(hero());
    expect(screen.getByRole('dialog', { name: /photo 1 of 3/i })).toBeTruthy();
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');

    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('2 / 3');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(hero().querySelector('img')?.getAttribute('src')).toBe('https://signed/b.jpg');

    await user.click(screen.getByRole('button', { name: 'View photo 3 full size' }));
    expect(screen.getByRole('dialog', { name: /photo 3 of 3/i })).toBeTruthy();
    expect(document.querySelector('.lightbox img')?.getAttribute('src')).toBe('https://signed/c.jpg');
    await user.click(screen.getByRole('button', { name: 'Close photo' }));
    expect(hero().querySelector('img')?.getAttribute('src')).toBe('https://signed/c.jpg');
  });
});
