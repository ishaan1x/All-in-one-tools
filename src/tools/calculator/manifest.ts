import { ToolManifest } from '../types';
import Calculator from './index';

export const calculatorManifest: ToolManifest = {
  slug: 'calculator',
  name: 'Advanced Calculator',
  description: 'Standard, scientific, percentage, age, date, and unit conversion calculators with history.',
  category: 'Utility',
  icon: '🧮',
  component: Calculator,
};
