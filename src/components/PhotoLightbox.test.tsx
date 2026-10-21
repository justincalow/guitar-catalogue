import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PhotoLightbox } from './PhotoLightbox';

const photos = ['https://signed/a.jpg', 'https://signed/b.jpg', 'https://signed/c.jpg'];

function Harness({ initialIndex = 0, images = photos }: { initialIndex?: number; images?: string[] }) {
  const [index, setIndex] = useState(initialIndex);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open ? (
        <PhotoLightbox
          photos={images}
          index={index}
          label="Tele"
          onClose={() => setOpen(false)}
          onIndexChange={setIndex}
        />
      ) : null}
    </>
  );
}

function touch(target: Element, type: 'touchstart' | 'touchend', x: number, y: number) {
  const point = { clientX: x, clientY: y, identifier: 0, target };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'changedTouches', { value: [point] });
  Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [point] });
  act(() => {
    target.dispatchEvent(event);
  });
}

describe('PhotoLightbox', () => {
  it('shows the selected photo, moves with the controls, and closes from the backdrop', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: /photo 1 of 3/i });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(photos[0]);
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('dialog', { name: /photo 2 of 3/i })).toBeTruthy();
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('2 / 3');

    await user.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');

    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the photo open when the image is clicked and restores focus and scroll', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    render(<Harness />);
    const open = screen.getByRole('button', { name: 'Open' });

    await user.click(open);
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close photo' }));

    fireEvent.click(dialog.querySelector('img')!);
    expect(screen.getByRole('dialog')).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('moves with arrow keys, wraps, and traps tab within the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const close = screen.getByRole('button', { name: 'Close photo' });
    const prev = screen.getByRole('button', { name: 'Previous photo' });
    const next = screen.getByRole('button', { name: 'Next photo' });

    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('2 / 3');
    await user.keyboard('{ArrowLeft}');
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');
    await user.keyboard('{ArrowLeft}');
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('3 / 3');

    expect(document.activeElement).toBe(close);
    await user.tab();
    expect(document.activeElement).toBe(prev);
    await user.tab();
    expect(document.activeElement).toBe(next);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(next);
  });

  it('swipes left and right, and ignores a short or vertical gesture', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');

    touch(dialog, 'touchstart', 200, 80);
    touch(dialog, 'touchend', 40, 84);
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('2 / 3');

    touch(dialog, 'touchstart', 40, 80);
    touch(dialog, 'touchend', 200, 86);
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');

    touch(dialog, 'touchstart', 80, 40);
    touch(dialog, 'touchend', 90, 160);
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');

    touch(dialog, 'touchstart', 100, 80);
    touch(dialog, 'touchend', 130, 80);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 3');
  });

  it('hides navigation when there is a single photo', async () => {
    const user = userEvent.setup();
    render(<Harness images={['https://signed/only.jpg']} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 1');
    expect(screen.queryByRole('button', { name: 'Previous photo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next photo' })).toBeNull();
    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('1 / 1');
    await user.click(screen.getByRole('button', { name: 'Close photo' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
