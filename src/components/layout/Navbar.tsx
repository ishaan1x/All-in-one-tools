import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link to="/" className="font-bold text-xl text-primary">
          AllInOne Tools
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/tools" className="hover:text-primary transition">Tools</Link>
          <Link to="/login" className="hover:text-primary transition">Login</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
