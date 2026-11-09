import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi';

export default function QrGenerator() {
  const [type, setType] = useState<QRType>('url');
  const [value, setValue] = useState('https://example.com');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getQRValue = (): string => {
    switch (type) {
      case 'email': return `mailto:${value}`;
      case 'phone': return `tel:${value}`;
      case 'wifi': return `WIFI:T:WPA;S:${value};P:password;;`;
      default: return value;
    }
  };

  const downloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast('SVG downloaded', 'success');
  };

  const downloadPNG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'qrcode.png';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = url;
    toast('PNG downloaded', 'success');
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['url', 'text', 'email', 'phone', 'wifi'] as QRType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize border transition ${
                type === t ? 'bg-primary text-white border-primary' : 'border-border hover:bg-surface-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === 'url' ? 'https://example.com' : type === 'wifi' ? 'Wi-Fi network name' : 'Enter value...'}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Foreground
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="block mt-1 w-full h-10 rounded cursor-pointer" />
          </label>
          <label className="text-sm">
            Background
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="block mt-1 w-full h-10 rounded cursor-pointer" />
          </label>
        </div>
        <label className="text-sm block">
          Size: {size}px
          <input type="range" min={128} max={512} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full mt-1 accent-primary" />
        </label>
        <div className="flex gap-2">
          <Button onClick={downloadPNG}>Download PNG</Button>
          <Button variant="outline" onClick={downloadSVG}>Download SVG</Button>
        </div>
      </div>
      <div ref={qrRef} className="flex items-center justify-center p-8 rounded-xl border border-border bg-white">
        {value ? (
          <QRCodeSVG value={getQRValue()} size={Math.min(size, 300)} fgColor={fg} bgColor={bg} level="M" />
        ) : (
          <p className="text-gray-400">Enter a value to generate QR code</p>
        )}
      </div>
    </div>
  );
}
