import { Link } from 'react-router-dom';
import { ToolManifest } from '@/tools/types';

export default function ToolCard({ tool }: { tool: ToolManifest }) {
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group p-6 rounded-xl border border-border bg-surface hover:border-primary hover:shadow-lg transition-all duration-200"
    >
      <div className="text-3xl mb-3">{tool.icon}</div>
      <h3 className="font-semibold text-lg group-hover:text-primary transition">{tool.name}</h3>
      <p className="text-sm text-text-muted mt-1">{tool.description}</p>
      <span className="inline-block mt-3 text-xs px-2 py-1 rounded-full bg-surface-muted text-text-muted">
        {tool.category}
      </span>
    </Link>
  );
}
