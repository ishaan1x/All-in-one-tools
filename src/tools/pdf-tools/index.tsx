import { useRef, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

type Op = 'merge' | 'split' | 'rotate' | 'reorder' | 'imagesToPdf' | 'pdfToImages';

export default function PdfTools() {
  const [op, setOp] = useState<Op>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const accepted = Array.from(fl).filter((f) =>
      op === 'imagesToPdf' ? f.type.startsWith('image/') : f.type === 'application/pdf'
    );
    setFiles((p) => [...p, ...accepted]);
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const run = async () => {
    if (!files.length) { toast('Add files first', 'error'); return; }
    setBusy(true);
    try {
      if (op === 'merge') {
        const merged = await PDFDocument.create();
        for (const file of files) {
          const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => merged.addPage(p));
        }
        downloadBlob(new Blob([await merged.save()], { type: 'application/pdf' }), 'merged.pdf');
      }

      if (op === 'split') {
        const doc = await PDFDocument.load(await files[0].arrayBuffer());
        for (let i = 0; i < doc.getPageCount(); i++) {
          const sub = await PDFDocument.create();
          const [page] = await sub.copyPages(doc, [i]);
          sub.addPage(page);
          downloadBlob(new Blob([await sub.save()], { type: 'application/pdf' }), `page-${i + 1}.pdf`);
        }
      }

      if (op === 'rotate') {
        const doc = await PDFDocument.load(await files[0].arrayBuffer());
        doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + 90) % 360)));
        downloadBlob(new Blob([await doc.save()], { type: 'application/pdf' }), 'rotated.pdf');
      }

      if (op === 'reorder') {
        const doc = await PDFDocument.load(await files[0].arrayBuffer());
        const indices = doc.getPageIndices().reverse(); // example: reverse order
        const out = await PDFDocument.create();
        const pages = await out.copyPages(doc, indices);
        pages.forEach((p) => out.addPage(p));
        downloadBlob(new Blob([await out.save()], { type: 'application/pdf' }), 'reordered.pdf');
      }

      if (op === 'imagesToPdf') {
        const doc = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          let img;
          if (file.type === 'image/jpeg') img = await doc.embedJpg(bytes);
          else if (file.type === 'image/png') img = await doc.embedPng(bytes);
          else { toast('Only JPG/PNG supported for images→PDF', 'error'); continue; }
          const page = doc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        downloadBlob(new Blob([await doc.save()], { type: 'application/pdf' }), 'images.pdf');
      }

      if (op === 'pdfToImages') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ data: await files[0].arrayBuffer() }).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
          downloadBlob(blob, `page-${i}.png`);
        }
      }

      toast('Done', 'success');
    } catch (err: any) {
      if (String(err).toLowerCase().includes('encrypt')) {
        toast('This PDF is encrypted and cannot be processed. Remove the password first.', 'error');
      } else {
        toast(err.message || 'PDF operation failed', 'error');
      }
    } finally { setBusy(false); }
  };

  const OPS: { id: Op; label: string; desc: string }[] = [
    { id: 'merge', label: 'Merge', desc: 'Combine multiple PDFs into one' },
    { id: 'split', label: 'Split', desc: 'Split every page into its own PDF' },
    { id: 'rotate', label: 'Rotate', desc: 'Rotate all pages 90°' },
    { id: 'reorder', label: 'Reverse', desc: 'Reverse page order' },
    { id: 'imagesToPdf', label: 'Images → PDF', desc: 'Combine JPG/PNG into one PDF' },
    { id: 'pdfToImages', label: 'PDF → Images', desc: 'Render each page to PNG' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {OPS.map((o) => (
          <button key={o.id} onClick={() => { setOp(o.id); setFiles([]); }}
            className={`p-3 rounded-xl border text-left transition ${op === o.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted'}`}>
            <p className="font-medium">{o.label}</p>
            <p className="text-xs text-text-muted mt-1">{o.desc}</p>
          </button>
        ))}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        className="p-10 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary"
      >
        <p>Add files</p>
        <input ref={inputRef} type="file" multiple hidden
          accept={op === 'imagesToPdf' ? 'image/*' : op === 'pdfToImages' ? 'application/pdf' : 'application/pdf,image/*'}
          onChange={(e) => addFiles(e.target.files)} />
        {files.length > 0 && <p className="mt-2 text-sm text-text-muted">{files.length} file(s): {files.map((f) => f.name).join(', ')}</p>}
      </div>

      <Button onClick={run} disabled={busy || !files.length}>{busy ? 'Processing…' : `Run ${op}`}</Button>
      <p className="text-xs text-text-muted">All PDF processing happens locally. Encrypted PDFs must be unlocked first.</p>
    </div>
  );
}
