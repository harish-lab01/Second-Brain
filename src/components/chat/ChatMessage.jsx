import { Brain, User } from 'lucide-react';

function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<div key={`space-${i}`} className="h-2" />);
      i++;
      continue;
    }

    if (/^[-•*]\s/.test(line.trim())) {
      const bulletLines = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[-•*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1.5 text-slate-300">
          {bulletLines.map((b, j) => <li key={j}>{inlineFormat(b)}</li>)}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const numLines = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numLines.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-1.5 text-slate-300">
          {numLines.map((b, j) => <li key={j}>{inlineFormat(b)}</li>)}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-slate-300">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith('**'))
      parts.push(<strong key={match.index} className="text-slate-100 font-semibold">{match[2]}</strong>);
    else
      parts.push(<em key={match.index} className="text-slate-200">{match[3]}</em>);
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-primary to-primary-700 shadow-glow-sm'
          : 'bg-surface-200 border border-white/[0.08]'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Brain className="w-3.5 h-3.5 text-primary-300" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-primary to-primary-700 text-white rounded-tr-sm shadow-glow-sm'
          : 'bg-surface-50/80 border border-white/[0.07] text-slate-300 rounded-tl-sm backdrop-blur-sm'
      }`}>
        {isUser
          ? message.content
          : <div className="space-y-1">{renderMarkdown(message.content)}</div>
        }
      </div>
    </div>
  );
}
