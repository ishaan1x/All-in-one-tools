type Token = number | string;

function tokenize(input: string): Token[] {
  const s = input.replace(/\s+/g, '');
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      const n = parseFloat(num);
      if (isNaN(n)) throw new Error('Invalid number: ' + num);
      tokens.push(n);
    } else if (/[a-zA-Z]/.test(c)) {
      let id = '';
      while (i < s.length && /[a-zA-Z]/.test(s[i])) id += s[i++];
      tokens.push(id.toLowerCase());
    } else if ('+-*/%^()'.includes(c)) {
      tokens.push(c);
      i++;
    } else {
      throw new Error('Invalid character: ' + c);
    }
  }
  return tokens;
}

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp,
  abs: Math.abs,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

export function evaluate(expr: string): number {
  const tokens = tokenize(expr);
  let pos = 0;

  function parseExpr(): number {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      left = op === '+' ? left + parseTerm() : left - parseTerm();
    }
    return left;
  }
  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/' || tokens[pos] === '%')) {
      const op = tokens[pos++];
      const r = parseFactor();
      left = op === '*' ? left * r : op === '/' ? left / r : left % r;
    }
    return left;
  }
  function parseFactor(): number {
    if (tokens[pos] === '-') { pos++; return -parseFactor(); }
    if (tokens[pos] === '+') { pos++; return parseFactor(); }
    const base = parseAtom();
    if (tokens[pos] === '^') { pos++; return Math.pow(base, parseFactor()); }
    return base;
  }
  function parseAtom(): number {
    const t = tokens[pos];
    if (typeof t === 'number') { pos++; return t; }
    if (t === '(') {
      pos++;
      const v = parseExpr();
      if (tokens[pos] !== ')') throw new Error('Missing ")"');
      pos++;
      return v;
    }
    if (typeof t === 'string' && FUNCS[t] !== undefined) {
      if (tokens[pos + 1] !== '(') throw new Error('Expected "(" after ' + t);
      pos += 2;
      const v = parseExpr();
      if (tokens[pos] !== ')') throw new Error('Missing ")"');
      pos++;
      return FUNCS[t](v);
    }
    if (typeof t === 'string' && CONSTS[t] !== undefined) { pos++; return CONSTS[t]; }
    throw new Error('Unexpected: ' + String(t));
  }

  const v = parseExpr();
  if (pos !== tokens.length) throw new Error('Unexpected: ' + String(tokens[pos]));
  if (!isFinite(v)) throw new Error('Result is not finite');
  return v;
}
