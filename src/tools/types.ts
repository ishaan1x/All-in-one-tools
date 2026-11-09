import { ComponentType } from 'react';

export interface ToolManifest {
  slug: string;
  name: string;
  description: string;
  category: 'Text' | 'Image' | 'PDF' | 'Security' | 'Utility' | 'Productivity';
  icon: string;
  component: ComponentType;
  requiresAuth?: boolean;
  isPro?: boolean;
}
