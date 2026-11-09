import { ToolManifest } from './types';
import { passwordGeneratorManifest } from './password-generator/manifest';
import { textConverterManifest } from './text-converter/manifest';
import { qrGeneratorManifest } from './qr-generator/manifest';

// Stage 2+ manifests will be imported here
// import { linkShortenerManifest } from './link-shortener/manifest';

export const tools: ToolManifest[] = [
  passwordGeneratorManifest,
  textConverterManifest,
  qrGeneratorManifest,
];

export function getTool(slug: string): ToolManifest | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): ToolManifest[] {
  return tools.filter((t) => t.category === category);
}

export function searchTools(query: string): ToolManifest[] {
  const q = query.toLowerCase();
  return tools.filter(
    (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  );
}
