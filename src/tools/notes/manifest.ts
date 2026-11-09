import { ToolManifest } from '../types';
import Notes from './index';

export const notesManifest: ToolManifest = {
  slug: 'notes',
  name: 'Notes',
  description: 'Create rich-text notes with headings, bold, italic, lists, and links. Share publicly with a unique URL.',
  category: 'Productivity',
  icon: '📓',
  component: Notes,
  requiresAuth: true,
};
