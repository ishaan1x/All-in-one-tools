import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface ConvertedItem {
  file: File;
  previewUrl: string;
  convertedUrl: string | null;
  targetFormat: string;
  size: number | null;
}

const FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default function ImageConverter() {
  const [items, setItems] = useState<ConvertedItem[]>([]);
  const [target, setTarget] = useState<string>('image/png');
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: ConvertedItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        convertedUrl: null,
        targetFormat: target,
        size: null,
      }));
    setItems((p) => [...p, ...newItems]);
  };

  const convert = async () => {
    setBusy(true);
    try {
      const out: ConvertedItem[] = [];
      for (const item of items) {
        const img = await createImageBitmap(item.file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('Convert failed'))), target, quality)
        );
        out.push({ ...item, convertedUrl: URL.createObjectURL(blob), targetFormat: target, size: blob.size });
      }
      setItems(out);
      toast('Conversion complete', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const download = (item: ConvertedItem) => {
    if (!item.convertedUrl) return;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = item.file.name.replace(/\.[^.]+$/, '') + '.' + (EXT[item.targetFormat] ?? 'img');
    a.click();
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="p-12 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary"
      >
        <p className="text-lg mb-2">Drop images to convert</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      <div className="flex flex-wrap gap-4 items-center p-4 rounded-xl border border-border">
        <label className="text-sm">
          Convert to
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="block mt-1 p-2 rounded-lg border border-border bg-surface">
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
        <label className="text-sm">
          Quality: {(quality * 100).toFixed(0)}%
          <input type="range" min={0.1} max={1} step={0.05} value={quality}
            onChange={(e) => setQuality(Number(e.target.value))} className="block w-48 accent-primary" />
        </label>
        <Button onClick={convert} disabled={busy || !items.length}>
          {busy ? 'Converting…' : `Convert (${items.length})`}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-border flex gap-4 items-center">
            <img src={item.convertedUrl ?? item.previewUrl} alt="" className="w-24 h-24 object-contain bg-surface-muted rounded" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.file.name}</p>
              <p className="text-xs text-text-muted">{item.file.type}</p>
              {item.size !== null && <p className="text-sm">{EXT[item.targetFormat]} — {(item.size / 1024).toFixed(1)} KB</p>}
            </div>
            {item.convertedUrl && <Button variant="outline" onClick={() => download(item)}>Download</Button>}
          </div>
        ))}
      </div>
    </div>
  );
}
