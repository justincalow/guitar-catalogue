export type TextPart = { type: 'text' | 'link'; value: string };

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/** Split prose into text and http(s) links. Trailing punctuation stays outside the link. */
function pushText(parts: TextPart[], value: string) {
  if (!value) return;
  const last = parts[parts.length - 1];
  if (last?.type === 'text') last.value += value;
  else parts.push({ type: 'text', value });
}

export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const trimmed = raw.replace(/[.,);:\]]+$/g, '');
    if (start > cursor) pushText(parts, text.slice(cursor, start));
    if (trimmed) parts.push({ type: 'link', value: trimmed });
    pushText(parts, raw.slice(trimmed.length));
    cursor = start + raw.length;
  }
  if (cursor < text.length) pushText(parts, text.slice(cursor));
  if (parts.length === 0) parts.push({ type: 'text', value: text });
  return parts;
}
