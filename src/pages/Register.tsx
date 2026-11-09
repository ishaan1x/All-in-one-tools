import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email, password, displayName || undefined);
      toast('Account created!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="text" placeholder="Display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating…' : 'Create account'}</Button>
      </form>
      <p className="mt-4 text-sm text-text-muted">
        Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
