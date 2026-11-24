import fs from 'fs';
import path from 'path';
import axios from 'axios';

export class AssetStorageService {
  private static storageDir = path.join(process.cwd(), 'public', 'storage', 'covers');

  private static ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Downloads a remote image and persists it permanently in the local public folder.
   * Prevents broken external links from ruining the library.
   */
  public static async saveCoverFromUrl(url: string, bookId: string): Promise<string> {
    this.ensureStorageDir();

    try {
      // Determine file extension
      let ext = 'jpg';
      if (url.includes('.png')) ext = 'png';
      else if (url.includes('.webp')) ext = 'webp';

      const fileName = `${bookId}-${Date.now()}.${ext}`;
      const filePath = path.join(this.storageDir, fileName);

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      fs.writeFileSync(filePath, Buffer.from(response.data));
      return `/storage/covers/${fileName}`;
    } catch (error) {
      console.warn(`[AssetStorageService] Failed to download remote cover from ${url}, generating SVG fallback cover:`, error);
      return this.generateFallbackCover('Book', 'Unknown', bookId);
    }
  }

  /**
   * Saves a base64 encoded image directly to the local filesystem.
   */
  public static async saveCoverFromBase64(base64Data: string, bookId: string): Promise<string> {
    this.ensureStorageDir();

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = 'jpg';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const fileName = `${bookId}-${Date.now()}.${ext}`;
    const filePath = path.join(this.storageDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return `/storage/covers/${fileName}`;
  }

  /**
   * Generates a high quality visual SVG book cover as a guaranteed fallback.
   */
  public static generateFallbackCover(title: string, author: string, bookId: string, bgGradient = ['#1e293b', '#0f172a']): string {
    this.ensureStorageDir();

    const fileName = `${bookId}-fallback.svg`;
    const filePath = path.join(this.storageDir, fileName);

    // Escape XML entities
    const safeTitle = title.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
    const safeAuthor = author.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgGradient[0]}" />
            <stop offset="100%" stop-color="${bgGradient[1]}" />
          </linearGradient>
          <linearGradient id="spine-shadow" x1="0%" y1="0%" x2="10%" y2="0%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" rx="8" />
        <rect width="100%" height="100%" fill="url(#spine-shadow)" />
        <rect x="20" y="20" width="360" height="560" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" rx="4" />
        
        <circle cx="200" cy="180" r="50" fill="rgba(255,255,255,0.06)" />
        
        <text x="200" y="320" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" width="320">
          ${safeTitle.length > 30 ? safeTitle.substring(0, 27) + '...' : safeTitle}
        </text>
        <line x1="120" y1="360" x2="280" y2="360" stroke="#f59e0b" stroke-width="3" />
        <text x="200" y="410" font-family="system-ui, sans-serif" font-size="18" fill="#e2e8f0" text-anchor="middle">
          ${safeAuthor}
        </text>
      </svg>
    `.trim();

    fs.writeFileSync(filePath, svg, 'utf-8');
    return `/storage/covers/${fileName}`;
  }
}
