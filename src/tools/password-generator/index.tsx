import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const generate = useCallback(() => {
    let pool = '';
    if (useUpper) pool += CHARSETS.upper;
    if (useLower) pool += CHARSETS.lower;
    if (useNumbers) pool += CHARSETS.numbers;
    if (useSymbols) pool += CHARSETS.symbols;
    if (excludeSimilar) pool = pool.replace(/[il1Lo0O]/g, '');

    if (!pool) {
      toast('Select at least one character type', 'error');
      return;
    }

    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    const result = Array.from(arr, (n) => pool[n % pool.length]).join('');
    setPassword(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeSimilar, toast]);

  const copy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast('Password copied to clipboard', 'success');
  };

  const strength = password.length > 20 ? 'Very Strong' : password.length > 12 ? 'Strong' : password.length > 8 ? 'Moderate' : 'Weak';
  const strengthColor = password.length > 20 ? 'text-green-600' : password.length > 12 ? 'text-blue-600' : password.length > 8 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="max-w-2xl space-y-6">
      {password && (
        <div className="p-4 rounded-xl border border-border bg-surface-muted">
          <div className="flex items-center justify-between gap-4">
            <code className="text-lg font-mono break-all">{password}</code>
            <Button onClick={copy} variant="outline">Copy</Button>
          </div>
          <p className={`mt-2 text-sm font-medium ${strengthColor}`}>Strength: {strength}</p>
        </div>
      )}

      <div className="space-y-4 p-6 rounded-xl border border-border">
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>Length</span>
            <span className="text-primary">{length}</span>
          </label>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Uppercase (A-Z)', useUpper, setUseUpper],
            ['Lowercase (a-z)', useLower, setUseLower],
            ['Numbers (0-9)', useNumbers, setUseNumbers],
            ['Symbols (!@#$)', useSymbols, setUseSymbols],
            ['Exclude similar (il1Lo0O)', excludeSimilar, setExcludeSimilar],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              {label as string}
            </label>
          ))}
        </div>

        <Button onClick={generate} className="w-full">Generate Password</Button>
      </div>
    </div>
  );
}
