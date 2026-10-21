import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/** A horizontal swipe must travel at least this far, and farther than it drifts vertically. */
const SWIPE_DISTANCE = 48;

interface PhotoLightboxProps {
  photos: string[];
  index: number;
  label: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function swipeDelta(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

export function PhotoLightbox({ photos, index, label, onClose, onIndexChange }: PhotoLightboxProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onIndexChangeRef = useRef(onIndexChange);
  const indexRef = useRef(index);
  const countRef = useRef(photos.length);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const ignoreClick = useRef(false);
  const goRef = useRef<(delta: number) => void>(() => {});

  onCloseRef.current = onClose;
  onIndexChangeRef.current = onIndexChange;
  indexRef.current = index;
  countRef.current = photos.length;
  goRef.current = (delta: number) => {
    const total = countRef.current;
    if (total < 2) return;
    const current = ((indexRef.current % total) + total) % total;
    onIndexChangeRef.current((current + delta + total) % total);
  };

  const count = photos.length;
  const safeIndex = count === 0 ? 0 : ((index % count) + count) % count;
  const photo = photos[safeIndex];

  useEffect(() => {
    const root = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const closeButton = root?.querySelector<HTMLElement>('.lightbox-close');
    (closeButton ?? root)?.focus();

    function focusable(): HTMLElement[] {
      if (!root) return [];
      return [...root.querySelectorAll<HTMLElement>('button:not([disabled])')];
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goRef.current(-1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goRef.current(1);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !root?.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, []);

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0] ?? event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const delta = swipeDelta(touch.clientX - start.x, touch.clientY - start.y);
    if (delta === 0) return;
    ignoreClick.current = true;
    goRef.current(delta);
  }

  function onBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || target.closest('button, img')) return;
    onCloseRef.current();
  }

  if (!photo) return null;

  const multiple = count > 1;

  return createPortal(
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onClick={onBackdropClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h2 id={titleId} className="sr-only" aria-live="polite">
        {label}, photo {safeIndex + 1} of {count}
      </h2>
      <button
        type="button"
        className="lightbox-close"
        aria-label="Close photo"
        onClick={() => onCloseRef.current()}
      >
        <span aria-hidden="true">×</span>
      </button>
      {multiple ? (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Previous photo"
          onClick={() => goRef.current(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
      ) : null}
      <div className="lightbox-stage">
        <img src={photo} alt="" />
      </div>
      {multiple ? (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Next photo"
          onClick={() => goRef.current(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      ) : null}
      <p className="lightbox-count" aria-hidden="true">
        {safeIndex + 1} / {count}
      </p>
    </div>,
    document.body,
  );
}
