// High-end procedural spine generator for 100% visual consistency between 2.5D shelf and 3D model
// Prevents stretching by rendering with true physical spine aspect ratio
const spineCache = new Map<string, { canvas: HTMLCanvasElement; dataUrl: string; aspect: number }>();

export interface SpineOptions {
  id: string;
  title: string;
  author: string;
  pageCount?: number;
  spineColor?: string;
  spineTextColor?: string;
}

export function clearSpineCache(bookId?: string) {
  if (bookId) {
    spineCache.forEach((_, key) => {
      if (key.startsWith(bookId)) {
        spineCache.delete(key);
      }
    });
  } else {
    spineCache.clear();
  }
}

export function getSpineAspect(pageCount?: number): number {
  const pages = Math.max(60, Math.min(1600, pageCount || 280));
  // Dynamic page thickness curve based on physical paper bulk:
  // ~80-120 pages  -> slim booklet (~0.11 aspect, ~36px wide on shelf)
  // ~250-320 pages -> standard paperback (~0.165 aspect, ~53px wide on shelf)
  // ~450-600 pages -> substantial volume (~0.24 aspect, ~77px wide on shelf)
  // ~800-1200+ pages -> massive tome (~0.34-0.38 aspect, ~110px-120px wide on shelf)
  const baseAspect = 0.08 + (pages / 1000) * 0.28;
  return Number(Math.max(0.11, Math.min(0.38, baseAspect)).toFixed(3));
}

function parseColorToRgb(colorStr: string): [number, number, number] {
  let hex = colorStr.trim();
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    if (!isNaN(num)) {
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
  }
  const rgbMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  return [30, 58, 95];
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getOptimalTextColor(bgHex: string): {
  isLightBg: boolean;
  textColor: string;
  authorColor: string;
  foilColor: string;
  foilShadow: string;
} {
  const [r, g, b] = parseColorToRgb(bgHex);
  const bgL = getRelativeLuminance(r, g, b);

  // Luminance of deep dark ink (#090d16) ~ 0.006; pure white (#ffffff) = 1.0
  const contrastWithDark = (bgL + 0.05) / (0.006 + 0.05);
  const contrastWithWhite = (1.0 + 0.05) / (bgL + 0.05);

  // Auto-switch to dark text if background is light/vibrant (e.g. orange, yellow, cream) to meet AAA contrast
  const isLightBg = contrastWithDark > contrastWithWhite || bgL > 0.20;

  if (isLightBg) {
    return {
      isLightBg: true,
      textColor: '#090d16', // Deep crisp midnight black ink
      authorColor: 'rgba(9, 13, 22, 0.88)',
      foilColor: 'rgba(9, 13, 22, 0.72)', // Deep ink cartouche & filigree bands
      foilShadow: 'rgba(255, 255, 255, 0.38)', // Debossed light reflection
    };
  }

  return {
    isLightBg: false,
    textColor: '#ffffff',
    authorColor: 'rgba(255, 255, 255, 0.88)',
    foilColor: 'rgba(238, 222, 185, 0.92)', // Classical gold foil leaf
    foilShadow: 'rgba(0, 0, 0, 0.55)',
  };
}

export function generateSpineCanvas(book: SpineOptions): { canvas: HTMLCanvasElement; dataUrl: string; aspect: number } {
  const aspect = getSpineAspect(book.pageCount);
  const spineColor = book.spineColor || '#1e3a5f';
  const optimal = getOptimalTextColor(spineColor);

  // Auto-switch to AAA contrast:
  // On light backgrounds, title and author MUST be dark ink (#090d16)
  // On dark backgrounds, title and author MUST be crisp light (#ffffff)
  const textColor = optimal.isLightBg ? optimal.textColor : '#ffffff';
  const authorColor = optimal.authorColor;
  const foilColor = optimal.foilColor;
  const foilShadow = optimal.foilShadow;
  const isLightBg = optimal.isLightBg;

  const cacheKey = `${book.id}-${spineColor}-${textColor}-${book.title}-${book.author}-${book.pageCount || 280}-v3`;
  if (spineCache.has(cacheKey)) {
    return spineCache.get(cacheKey)!;
  }

  // Create canvas with exact aspect ratio (height: 1000, width derived from aspect)
  const canvas = document.createElement('canvas');
  canvas.height = 1000;
  canvas.width = Math.round(canvas.height * aspect); // around 170px to 240px
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { canvas, dataUrl: '', aspect };
  }

  // 1. Base cloth / leather texture fill
  ctx.fillStyle = spineColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle leather grain texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      if ((x + y) % 6 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // 2. Realistic 3D cylindrical spine shading & groove highlights
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.08, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.16)');
  grad.addColorStop(0.50, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(0.78, 'rgba(255, 255, 255, 0.14)');
  grad.addColorStop(0.92, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Ornate Top & Bottom Filigree Bands (Classical Binder Tooling)
  const drawBand = (y: number) => {
    const pad = Math.max(8, Math.round(canvas.width * 0.07));
    ctx.fillStyle = foilColor;
    ctx.fillRect(pad, y, canvas.width - pad * 2, 2);
    ctx.fillRect(pad + 4, y + 4, canvas.width - (pad + 4) * 2, 1);
    ctx.fillRect(pad, y + 22, canvas.width - pad * 2, 2);
    ctx.fillRect(pad + 4, y + 18, canvas.width - (pad + 4) * 2, 1);

    ctx.fillStyle = foilShadow;
    ctx.fillRect(pad, y + 2, canvas.width - pad * 2, 1);
    ctx.fillRect(pad, y + 24, canvas.width - pad * 2, 1);

    // Filigree diamond / dot ornaments
    ctx.fillStyle = foilColor;
    const midY = y + 11;
    const step = Math.max(12, Math.round(canvas.width * 0.10));
    for (let x = pad + 12; x <= canvas.width - pad - 8; x += step) {
      ctx.beginPath();
      ctx.arc(x, midY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawBand(45);
  drawBand(canvas.height - 75);

  // 4. Central Embossed Cartouche / Frame for Title
  const cartoucheY = 110;
  const cartoucheH = canvas.height - 220;
  const cartouchePad = Math.max(8, Math.round(canvas.width * 0.08));

  ctx.strokeStyle = foilColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cartouchePad, cartoucheY, canvas.width - cartouchePad * 2, cartoucheH);
  ctx.strokeStyle = isLightBg ? 'rgba(9, 13, 22, 0.35)' : 'rgba(238, 222, 185, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cartouchePad + 4, cartoucheY + 4, canvas.width - (cartouchePad + 4) * 2, cartoucheH - 8);

  // Corner bracket accents
  const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.strokeStyle = foilColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + dx * 8, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * 8);
    ctx.stroke();
  };
  drawCorner(cartouchePad + 4, cartoucheY + 4, 1, 1);
  drawCorner(canvas.width - cartouchePad - 4, cartoucheY + 4, -1, 1);
  drawCorner(cartouchePad + 4, cartoucheY + cartoucheH - 4, 1, -1);
  drawCorner(canvas.width - cartouchePad - 4, cartoucheY + cartoucheH - 4, -1, -1);

  // 5. Centered Vertical Title & Author in Classical Serif Typography
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);

  // Format display title
  let displayTitle = book.title;
  if (displayTitle.length > 28) {
    displayTitle = displayTitle.substring(0, 25) + '...';
  }

  // Adjust font size and vertical offset dynamically based on physical spine thickness
  const titleFontSize = Math.min(46, Math.max(18, Math.round(canvas.width * 0.17)));
  const titleOffsetY = -Math.round(canvas.width * 0.07);
  const authorFontSize = Math.min(22, Math.max(11, Math.round(canvas.width * 0.09)));
  const authorOffsetY = Math.round(canvas.width * 0.15);
  const dividerLen = Math.min(70, Math.max(28, Math.round(canvas.width * 0.30)));

  ctx.fillStyle = textColor;
  ctx.font = `bold ${titleFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayTitle, 0, titleOffsetY);

  // Ornamental divider between title and author
  ctx.strokeStyle = foilColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-dividerLen, 8);
  ctx.lineTo(dividerLen, 8);
  ctx.stroke();

  // Diamond center
  ctx.fillStyle = foilColor;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(3.5, 8);
  ctx.lineTo(0, 11);
  ctx.lineTo(-3.5, 8);
  ctx.closePath();
  ctx.fill();

  // Author in elegant spaced sans-serif
  ctx.font = `500 ${authorFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = authorColor;
  ctx.letterSpacing = '1.5px';
  ctx.fillText(book.author.toUpperCase(), 0, authorOffsetY);

  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const result = { canvas, dataUrl, aspect };
  spineCache.set(cacheKey, result);
  return result;
}
