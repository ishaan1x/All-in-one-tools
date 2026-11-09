import { useParams } from 'react-router-dom';
import { getTool } from './registry';
import NotFound from '@/pages/NotFound';

export default function ToolRenderer() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? getTool(slug) : undefined;
  if (!tool) return <NotFound />;
  const Component = tool.component;
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
        <p className="text-text-muted">{tool.description}</p>
      </div>
      <Component />
    </div>
  );
}
