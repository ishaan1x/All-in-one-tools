import { ToolManifest } from '../types';
import BioLink from './index';

export const bioLinkManifest: ToolManifest = {
  slug: 'bio-link',
  name: 'Bio Link Maker',
  description: 'Create a shareable personal bio page with all your links in one place.',
  category: 'Productivity',
  icon: '👤',
  component: BioLink,
  requiresAuth: true,
};
