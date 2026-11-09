import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

export default function TextConverter() {
  const [text, setText] = useState('');
  const { toast } = useToast();

  const stats = useMemo(() => ({
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
  }), [text]);

  const apply = (fn: (t: string) => string) => setText(fn(text));

  const actions = [
    ['UPPERCASE', (t: string) => t.toUpperCase()],
    ['lowercase', (t: string) => t.toLowerCase()],
    ['Title Case', (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase())],
    ['Sentence case', (t: string) => t.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())],
    ['Reverse', (t: string) => t.split('').reverse().join('')],
    ['Remove extra spaces', (t: string) => t.replace(/\s+/g, ' ').trim()],
    ['Remove duplicate lines', (t: string) => [...new Set(t.split('\n'))].join('\n')],
    ['Sort lines A-Z', (t: string) => t.split('\n').sort().join('\n')],
    ['Sort lines Z-A', (t: string) => t.split('\n').sort().reverse().join('\n')],
  ] as const;

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here..."
        className="w-full h-64 p-4 rounded-xl border border-border bg-surface font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-4 text-sm text-text-muted">
        <span>Characters: {stats.chars}</span>
        <span>Words: {stats.words}</span>
        <span>Lines: {stats.lines}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([label, fn]) => (
          <Button key={label} variant="outline" onClick={() => apply(fn)}>
            {label}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast('Copied to clipboard', 'success');
          }}
        >
          Copy
        </Button>
        <Button variant="ghost" onClick={() => setText('')}>Clear</Button>
      </div>
    </div>
  );
}
