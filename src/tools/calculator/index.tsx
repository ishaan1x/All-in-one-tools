import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { evaluate } from './parser';

type Tab = 'standard' | 'scientific' | 'percentage' | 'age' | 'date' | 'units';

export default function Calculator() {
  const [tab, setTab] = useState<Tab>('standard');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border">
        {(['standard', 'scientific', 'percentage', 'age', 'date', 'units'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'standard' && <StandardCalc />}
      {tab === 'scientific' && <ScientificCalc />}
      {tab === 'percentage' && <PercentageCalc />}
      {tab === 'age' && <AgeCalc />}
      {tab === 'date' && <DateCalc />}
      {tab === 'units' && <UnitConverter />}
    </div>
  );
}

/* ---------- Standard ---------- */
function StandardCalc() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const pressDigit = (d: string) => {
    if (waiting) { setDisplay(d); setWaiting(false); }
    else setDisplay(display === '0' && d !== '.' ? d : display + d);
  };
  const pressDot = () => { if (!display.includes('.')) pressDigit('.'); };
  const clearAll = () => { setDisplay('0'); setPrev(null); setOp(null); setWaiting(false); };
  const negate = () => setDisplay(String(-parseFloat(display)));
  const back = () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  const percent = () => setDisplay(String(parseFloat(display) / 100));

  const pressOp = (nextOp: string) => {
    const val = parseFloat(display);
    if (prev === null) { setPrev(val); }
    else if (op) {
      const res = apply(prev, val, op);
      setPrev(res); setDisplay(String(res));
    }
    setOp(nextOp); setWaiting(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const val = parseFloat(display);
    const res = apply(prev, val, op);
    setHistory((h) => [`${prev} ${op} ${val} = ${res}`, ...h].slice(0, 20));
    setDisplay(String(res)); setPrev(null); setOp(null); setWaiting(true);
  };

  const apply = (a: number, b: number, o: string) =>
    o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : o === '/' ? a / b : a;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) pressDigit(e.key);
      else if (e.key === '.') pressDot();
      else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') pressOp(e.key);
      else if (e.key === 'Enter' || e.key === '=') equals();
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Escape') clearAll();
      else if (e.key === '%') percent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];

  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-4 max-w-3xl">
      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-border bg-surface-muted text-right">
          <p className="text-xs text-text-muted h-4 truncate">{prev !== null && op ? `${prev} ${op}` : ' '}</p>
          <p className="text-3xl font-mono break-all">{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={clearAll}>AC</Button>
          <Button variant="outline" onClick={back}>←</Button>
          <Button variant="outline" onClick={negate}>±</Button>
          <Button variant="outline" onClick={percent}>%</Button>
          {keys.map((k) => (
            <Button key={k} variant={['+','-','*','/','='].includes(k) ? 'primary' : 'outline'}
              onClick={() => k === '=' ? equals() : ['+','-','*','/'].includes(k) ? pressOp(k) : pressDigit(k)}>
              {k}
            </Button>
          ))}
        </div>
      </div>
      <aside className="p-4 rounded-xl border border-border">
        <h3 className="font-semibold mb-2 text-sm">History</h3>
        <div className="space-y-1 text-sm font-mono text-text-muted max-h-72 overflow-y-auto">
          {history.length === 0 ? <p className="text-xs">No calculations yet</p> : history.map((h, i) => (
            <div key={i} className="truncate">{h}</div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ---------- Scientific ---------- */
function ScientificCalc() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  const run = () => {
    try { setResult(String(evaluate(expr))); setError(''); }
    catch (e: any) { setError(e.message); setResult(''); }
  };

  const insert = (s: string) => setExpr((e) => e + s);

  return (
    <div className="space-y-3 max-w-2xl">
      <input value={expr} onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && run()}
        placeholder="e.g. sin(pi/2) + sqrt(16) ^ 2"
        className="w-full p-3 rounded-lg border border-border bg-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
        {['sin(','cos(','tan(','sqrt(','ln(','log(','pi','e','(',')','^','%','+','-','*','/'].map((k) => (
          <Button key={k} variant="outline" onClick={() => insert(k)}>{k}</Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={run}>Evaluate</Button>
        <Button variant="outline" onClick={() => { setExpr(''); setResult(''); setError(''); }}>Clear</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {result && <div className="p-4 rounded-lg border border-border bg-surface-muted font-mono text-lg">= {result}</div>}
    </div>
  );
}

/* ---------- Percentage ---------- */
function PercentageCalc() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const na = parseFloat(a), nb = parseFloat(b);
  const ok = !isNaN(na) && !isNaN(nb);

  return (
    <div className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="X"
          className="p-3 rounded-lg border border-border bg-surface" type="number" />
        <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Y"
          className="p-3 rounded-lg border border-border bg-surface" type="number" />
      </div>
      {ok && (
        <div className="space-y-2 p-4 rounded-lg border border-border text-sm">
          <p>{na}% of {nb} = <span className="font-mono text-primary">{(na / 100) * nb}</span></p>
          <p>{na} is {((na / nb) * 100).toFixed(2)}% of {nb}</p>
          <p>Change from {na} to {nb}: <span className={nb >= na ? 'text-green-600' : 'text-red-500'}>{(((nb - na) / na) * 100).toFixed(2)}%</span></p>
        </div>
      )}
    </div>
  );
}

/* ---------- Age ---------- */
function AgeCalc() {
  const [birth, setBirth] = useState('');
  if (!birth) return <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)}
    className="p-3 rounded-lg border border-border bg-surface" />;

  const b = new Date(birth);
  const now = new Date();
  if (isNaN(b.getTime()) || b > now) return <p className="text-red-500">Pick a valid past date.</p>;

  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now.getTime() - b.getTime()) / 86_400_000);

  return (
    <div className="space-y-3 max-w-md">
      <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)}
        className="p-3 rounded-lg border border-border bg-surface" />
      <div className="p-4 rounded-lg border border-border space-y-1">
        <p className="text-2xl font-bold">{years}y {months}m {days}d</p>
        <p className="text-sm text-text-muted">Total days: {totalDays.toLocaleString()}</p>
      </div>
    </div>
  );
}

/* ---------- Date ---------- */
function DateCalc() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [base, setBase] = useState('');
  const [add, setAdd] = useState('0');

  const diffDays = (() => {
    if (!start || !end) return null;
    const a = new Date(start), b = new Date(end);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
  })();

  const shifted = (() => {
    if (!base) return null;
    const d = new Date(base);
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + (parseInt(add) || 0));
    return d.toDateString();
  })();

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <h3 className="font-semibold">Days between dates</h3>
        <div className="flex gap-2">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="p-2 rounded-lg border border-border bg-surface" />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="p-2 rounded-lg border border-border bg-surface" />
        </div>
        {diffDays !== null && <p className="text-lg"><span className="font-mono text-primary">{diffDays}</span> days</p>}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Add / subtract days</h3>
        <div className="flex gap-2 items-center">
          <input type="date" value={base} onChange={(e) => setBase(e.target.value)} className="p-2 rounded-lg border border-border bg-surface" />
          <input type="number" value={add} onChange={(e) => setAdd(e.target.value)} className="p-2 rounded-lg border border-border bg-surface w-24" />
          <span className="text-sm text-text-muted">days (use - to subtract)</span>
        </div>
        {shifted && <p className="text-lg">→ <span className="text-primary font-medium">{shifted}</span></p>}
      </div>
    </div>
  );
}

/* ---------- Units ---------- */
const UNIT_GROUPS: Record<string, Record<string, number>> = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  Weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523 },
  Volume: { l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588, floz: 0.0295735 },
  Speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444 },
  Time: { s: 1, min: 60, h: 3600, d: 86400, wk: 604800 },
};

function UnitConverter() {
  const [group, setGroup] = useState('Length');
  const units = Object.keys(UNIT_GROUPS[group]);
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1] ?? units[0]);
  const [val, setVal] = useState('1');

  useEffect(() => {
    const u = Object.keys(UNIT_GROUPS[group]);
    setFrom(u[0]); setTo(u[1] ?? u[0]);
  }, [group]);

  const factorFrom = UNIT_GROUPS[group][from];
  const factorTo = UNIT_GROUPS[group][to];
  const result = (parseFloat(val) || 0) * factorFrom / factorTo;

  return (
    <div className="space-y-3 max-w-lg">
      <select value={group} onChange={(e) => setGroup(e.target.value)}
        className="w-full p-2 rounded-lg border border-border bg-surface">
        {Object.keys(UNIT_GROUPS).map((g) => <option key={g}>{g}</option>)}
      </select>
      <div className="flex gap-2 items-center">
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="p-2 rounded-lg border border-border bg-surface flex-1" />
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="p-2 rounded-lg border border-border bg-surface">
          {units.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
      <p className="text-center text-text-muted">↓</p>
      <div className="flex gap-2 items-center">
        <input readOnly value={result} className="p-2 rounded-lg border border-border bg-surface-muted flex-1 font-mono" />
        <select value={to} onChange={(e) => setTo(e.target.value)} className="p-2 rounded-lg border border-border bg-surface">
          {units.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
}
