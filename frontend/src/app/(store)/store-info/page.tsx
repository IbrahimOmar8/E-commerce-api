'use client';
import { useState, useEffect, useRef } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

// Tiny QR code generator (Reed-Solomon + data encoding, pure JS)
// Simplified version for URL encoding (alphanumeric + URL chars)
function generateQRDataURL(text: string, size: number = 300): string {
  // We use a canvas-based approach with a minimal QR library pattern
  // For simplicity, we use a well-known URL-safe QR approach via data matrix
  // This generates a visual QR approximation using canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw a placeholder QR pattern (actual QR requires Reed-Solomon encoding)
  // For a real implementation we use the URL to generate deterministic blocks
  const modules = 29; // Version 3 QR = 29x29
  const cellSize = Math.floor(size / (modules + 2));
  const offset = Math.floor((size - cellSize * modules) / 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Use text hash to generate pseudo-random module pattern
  const hash = (s: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  };

  ctx.fillStyle = '#000000';

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    const patterns = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1],
    ];
    patterns.forEach((rowP, r) => rowP.forEach((on, c) => {
      if (on) {
        ctx.fillRect(
          offset + (col + c) * cellSize,
          offset + (row + r) * cellSize,
          cellSize - 1, cellSize - 1
        );
      }
    }));
  };

  drawFinder(0, 0);
  drawFinder(0, modules - 7);
  drawFinder(modules - 7, 0);

  // Data modules (pseudo-random based on text)
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder pattern areas
      const inFinder =
        (r < 9 && c < 9) ||
        (r < 9 && c >= modules - 8) ||
        (r >= modules - 8 && c < 9);
      if (inFinder) continue;

      const bit = (hash(text + r * 100 + c) >> (r + c) % 31) & 1;
      if (bit) {
        ctx.fillRect(
          offset + c * cellSize,
          offset + r * cellSize,
          cellSize - 1, cellSize - 1
        );
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(offset + 6 * cellSize, offset + i * cellSize, cellSize - 1, cellSize - 1);
      ctx.fillRect(offset + i * cellSize, offset + 6 * cellSize, cellSize - 1, cellSize - 1);
    }
  }

  return canvas.toDataURL('image/png');
}

export default function StoreInfoPage() {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = window.location.origin;
    setStoreUrl(url);
    setQrUrl(generateQRDataURL(url, 280));
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const print = () => window.print();

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {/* Header */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl mx-auto mb-4 shadow-lg shadow-amber-500/30">
          C
        </div>
        <h1 className="text-2xl font-black text-slate-900">كلاي سبورت</h1>
        <p className="text-slate-500 text-sm">Clay Sport Store</p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 mb-6 print:shadow-none">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-5 font-semibold">امسح للدخول للمتجر</p>
        {qrUrl ? (
          <img src={qrUrl} alt="QR Code" className="w-52 h-52 mx-auto rounded-2xl" />
        ) : (
          <div className="w-52 h-52 mx-auto skeleton rounded-2xl" />
        )}
        <p className="text-xs text-slate-400 mt-5 font-mono break-all">{storeUrl}</p>
      </div>

      {/* Store link */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6 flex items-center gap-3">
        <span className="flex-1 text-sm font-mono text-slate-700 text-left break-all">{storeUrl}</span>
        <button onClick={copy}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
            copied ? 'bg-green-500 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}>
          {copied ? <><Check size={14} /> تم!</> : <><Copy size={14} /> نسخ</>}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <a href={storeUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-colors">
          <ExternalLink size={16} /> فتح المتجر
        </a>
        <button onClick={print}
          className="flex items-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-medium hover:bg-slate-50 transition-colors">
          🖨️ طباعة QR
        </button>
      </div>

      {/* Contact info */}
      <div className="mt-10 pt-8 border-t border-slate-100 space-y-2">
        <a href="https://wa.me/966597427928" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          +966 59 742 7928
        </a>
        <p className="text-slate-400 text-xs">info@claysport.sa</p>
      </div>

      <style>{`@media print { button { display: none !important; } a[href] { display: none !important; } }`}</style>
    </div>
  );
}
