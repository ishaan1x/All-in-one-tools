import { tools } from '@/tools/registry';
import ToolCard from '@/components/shared/ToolCard';

const categories = [...new Set(tools.map((t) => t.category))];

export default function ToolsDirectory() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">All Tools</h1>
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-xl font-semibold mb-4">{cat}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.filter((t) => t.category === cat).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
