import { ToolManifest } from '../types';
import ImageConverter from './index';

export const imageConverterManifest: ToolManifest = {
  slug: 'image-converter',
  name: 'Image Converter',
  description: 'Convert between JPG, PNG, and WebP formats entirely in your browser.',
  category: 'Image',
  icon: '🔄',
  component: ImageConverter,
};
