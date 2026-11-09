import { ToolManifest } from '../types';
import LinkShortener from './index';

export const linkShortenerManifest: ToolManifest = {
  slug: 'link-shortener',
  name: 'Link Shortener',
  description: 'Create short URLs with custom aliases, click tracking, and QR codes.',
  category: 'Utility',
  icon: '🔗',
  component: LinkShortener,
};
