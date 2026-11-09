import { Link } from 'react-router-dom';
import { tools } from '@/tools/registry';
import ToolCard from '@/components/shared/ToolCard';
import SearchBar from '@/components/shared/SearchBar';
import { useState, useMemo } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return tools;
    const q = query.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-12">
      <section className="text-center py-16 space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          All Your Tools. <span className="text-primary">One Platform.</span>
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Fast, private, and free online tools for text, images, PDFs, security, and productivity.
        </p>
        <div className="max-w-md mx-auto">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">All Tools ({filtered.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-text-muted py-12">No tools found for "{query}"</p>
        )}
      </section>
    </div>
  );
}
