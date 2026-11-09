import { ToolManifest } from '../types';
import PdfTools from './index';

export const pdfToolsManifest: ToolManifest = {
  slug: 'pdf-tools',
  name: 'PDF Tools',
  description: 'Merge, split, rotate, reorder, compress, and convert PDFs entirely in your browser.',
  category: 'PDF',
  icon: '📄',
  component: PdfTools,
};
