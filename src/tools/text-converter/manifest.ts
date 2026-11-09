import { ToolManifest } from '../types';
import TextConverter from './index';

export const textConverterManifest: ToolManifest = {
  slug: 'text-converter',
  name: 'Text Converter',
  description: 'Convert case, clean text, count words and characters, sort lines, and more.',
  category: 'Text',
  icon: '📝',
  component: TextConverter,
};
