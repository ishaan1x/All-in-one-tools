import { useCallback, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface Item {
  file: File;
  originalUrl: string;
  compressedUrl: string | null;
  originalSize: number;
  compressedSize: number | null;
}

export default function ImageCompressor() {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compress = useCallback(async (item: Item, q: number, fmt: string): Promise<Item> => {
    const img = await createImageBitmap(item.file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Compression failed'))), `image/${fmt}`, q)
    );
    return {
      ...item,
      compressedUrl: URL.createObjectURL(blob),
      compressedSize: blob.size,
    };
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!accepted.length) { toast('No image files selected', 'error'); return; }
    const newItems = accepted.map((file) => ({
      file,
      originalUrl: URL.createObjectURL(file),
      compressedUrl: null,
      originalSize: file.size,
      compressedSize: null,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const compressAll = async () => {
    setBusy(true);
    try {
      const updated: Item[] = [];
      for (const item of items) {
        if (item.compressedUrl) { updated.push(item); continue; }
        updated.push(await compress(item, quality, format));
      }
      setItems(updated);
      toast('Images compressed', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const download = (item: Item) => {
    if (!item.compressedUrl) return;
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    a.download = `compressed-${item.file.name.replace(/\.[^.]+$/, '')}.${format}`;
    a.click();
  };

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1_048_576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1_048_576).toFixed(2)} MB`;

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="p-12 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary transition"
      >
        <p className="text-lg mb-2">Drop images here or click to browse</p>
        <p className="text-sm text-text-muted">JPG, PNG, WebP — processed locally</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      <div className="flex flex-wrap gap-4 items-center p-4 rounded-xl border border-border">
        <label className="text-sm">
          Quality: {(quality * 100).toFixed(0)}%
          <input type="range" min={0.1} max={1} step={0.05} value={quality}
            onChange={(e) => setQuality(Number(e.target.value))} className="block w-48 accent-primary" />
        </label>
        <label className="text-sm">
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value as any)}
            className="block mt-1 p-2 rounded-lg border border-border bg-surface">
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
        <Button onClick={compressAll} disabled={busy || !items.length}>
          {busy ? 'Compressing…' : `Compress all (${items.length})`}
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-border flex gap-4">
            <img src={item.compressedUrl ?? item.originalUrl} alt="" className="w-32 h-32 object-contain bg-surface-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <p className="font-medium truncate">{item.file.name}</p>
              <p className="text-sm text-text-muted">
                Original: {formatSize(item.originalSize)}
                {item.compressedSize !== null && (
                  <> → Compressed: {formatSize(item.compressedSize)}{' '}
                    <span className="text-green-600 font-medium">
                      ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% smaller)
                    </span>
                  </>
                )}
              </p>
              {item.compressedUrl && (
                <Button variant="outline" onClick={() => download(item)}>Download</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
