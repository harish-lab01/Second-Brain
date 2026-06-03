import { Brain, User } from 'lucide-react';

// Lightweight markdown renderer — no external dependency needed
function renderMarkdown(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines (add spacing)
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Bullet points: lines starting with - or •
    if (/^[\-\•\*]\s/.test(line.trim())) {
      const bulletLines = [];
      while (i < lines.length && /^[\-\•\*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[\-\•\*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-1">
          {bulletLines.map((b, j) => (
            <li key={j}>{inlineFormat(b)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      const numLines = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numLines.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-1">
          {numLines.map((b, j) => (
            <li key={j}>{inlineFormat(b)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="leading-relaxed">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Handle **bold** and *italic* inline
function inlineFormat(text) {
  const parts = [];
  // Split on **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else {
      parts.push(<em key={match.index}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : text;
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
      }`}>
        {isUser
          ? message.content
          : <div className="space-y-1">{renderMarkdown(message.content)}</div>
        }
      </div>
    </div>
  );
}
