import { ToolManifest } from '../types';
import Clipboard from './index';

export const clipboardManifest: ToolManifest = {
  slug: 'clipboard',
  name: 'Pastebin',
  description: 'Share code and text with syntax highlighting, custom expiry, and public or private links.',
  category: 'Text',
  icon: '📋',
  component: Clipboard,
};
