import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-4 text-sm text-text-muted">
        No account? <Link to="/register" className="text-primary hover:underline">Register</Link>
      </p>
    </div>
  );
}
