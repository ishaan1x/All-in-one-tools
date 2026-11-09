import { ToolManifest } from '../types';
import QrGenerator from './index';

export const qrGeneratorManifest: ToolManifest = {
  slug: 'qr-generator',
  name: 'QR Code Generator',
  description: 'Generate QR codes for URLs, text, email, phone, and Wi-Fi. Download as PNG or SVG.',
  category: 'Utility',
  icon: '📱',
  component: QrGenerator,
};
