import { linkify } from '../lib/linkify';

export function LinkedText({ text }: { text: string }) {
  const parts = linkify(text);
  return (
    <p>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a key={index} href={part.value} target="_blank" rel="noopener noreferrer">
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </p>
  );
}
