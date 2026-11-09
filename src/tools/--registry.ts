import { imageCompressorManifest } from './image-compressor/manifest';
import { imageConverterManifest } from './image-converter/manifest';
import { pdfToolsManifest } from './pdf-tools/manifest';
import { notesManifest } from './notes/manifest';
import { clipboardManifest } from './clipboard/manifest';

export const tools: ToolManifest[] = [
  // ...Stage 1 & 2
  imageCompressorManifest,
  imageConverterManifest,
  pdfToolsManifest,
  notesManifest,
  clipboardManifest,
];
