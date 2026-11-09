import { ToolManifest } from '../types';
import ImageCompressor from './index';

export const imageCompressorManifest: ToolManifest = {
  slug: 'image-compressor',
  name: 'Image Compressor',
  description: 'Compress JPG, PNG, and WebP images in your browser. Adjustable quality, before/after comparison.',
  category: 'Image',
  icon: '🗜️',
  component: ImageCompressor,
};
