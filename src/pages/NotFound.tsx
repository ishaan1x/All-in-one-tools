import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="text-center py-24 space-y-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl text-text-muted">Page not found</p>
      <Link to="/"><Button>Back to Home</Button></Link>
    </div>
  );
}
