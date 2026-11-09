import { ToolManifest } from '../types';
import Todo from './index';

export const todoManifest: ToolManifest = {
  slug: 'todo',
  name: 'To-Do List',
  description: 'Manage tasks with priorities, categories, deadlines, and search — synced to your account.',
  category: 'Productivity',
  icon: '✅',
  component: Todo,
  requiresAuth: true,
};
