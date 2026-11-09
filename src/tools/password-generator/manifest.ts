import { ToolManifest } from '../types';
import PasswordGenerator from './index';

export const passwordGeneratorManifest: ToolManifest = {
  slug: 'password-generator',
  name: 'Password Generator',
  description: 'Generate strong, secure passwords entirely in your browser. Nothing is stored or transmitted.',
  category: 'Security',
  icon: '🔐',
  component: PasswordGenerator,
};
