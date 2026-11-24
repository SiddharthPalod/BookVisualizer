import axios from 'axios';
import * as cheerio from 'cheerio';
import { IMetadataProvider } from '../types';
import { MetadataLookupResult } from '@/types';

export class AmazonScraperProvider implements IMetadataProvider {
  public name = 'amazon';

  public supports(input: string): boolean {
    const isAmazonUrl = /(?:amazon\.[a-z.]+|amzn\.to)/i.test(input);
    const isAsin = /^[B0-9][A-Z0-9]{9}$/i.test(input.trim());
    return isAmazonUrl || isAsin;
  }

  public extractAsin(input: string): string | null {
    const trimmed = input.trim();
    if (/^[B0-9][A-Z0-9]{9}$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    const match = trimmed.match(/(?:dp|gp\/product|d)\/([B0-9][A-Z0-9]{9})/i);
    return match ? match[1].toUpperCase() : null;
  }

  public async lookup(input: string): Promise<MetadataLookupResult | null> {
    const asin = this.extractAsin(input);
    const targetUrl = input.startsWith('http') 
      ? input 
      : (asin ? `https://www.amazon.com/dp/${asin}` : null);

    if (!targetUrl && !asin) return null;

    // Direct Amazon image URL convention by ASIN
    const directAsinCover = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : undefined;

    try {
      const response = await axios.get(targetUrl!, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      const html = response.data;
      if (typeof html !== 'string' || html.includes('Robot Check') || html.includes('api-services-support@amazon.com')) {
        // Amazon anti-bot triggered, return partial metadata with direct ASIN cover
        if (asin) {
          return {
            title: this.deriveTitleFromUrl(input) || `Book (ASIN ${asin})`,
            author: 'Unknown Author',
            asin,
            coverUrl: directAsinCover,
            source: 'amazon'
          };
        }
        return null;
      }

      const $ = cheerio.load(html);

      // Title
      let title = $('#productTitle').text().trim() ||
                  $('h1.a-size-large').first().text().trim() ||
                  $('meta[name="title"]').attr('content')?.split(':')[0].trim() || '';

      // Clean extra Amazon marketing noise from title
      title = title.replace(/\s*\(.*?(Paperback|Hardcover|Edition|Kindle).*?\)/gi, '').trim();

      // Author
      let author = $('.author a.a-link-normal').first().text().trim() ||
                   $('#bylineInfo .author .a-declarative a').first().text().trim() ||
                   $('span.author a').first().text().trim() || '';

      if (!author) {
        const byline = $('#bylineInfo').text().trim();
        const authorMatch = byline.match(/by\s+([^,(\n]+)/i);
        if (authorMatch) author = authorMatch[1].trim();
      }

      // Cover Image
      let coverUrl: string | undefined = undefined;
      const landingImg = $('#landingImage, #imgBlkFront').first();
      const dynamicImages = landingImg.attr('data-a-dynamic-image');
      if (dynamicImages) {
        try {
          const parsed = JSON.parse(dynamicImages);
          const urls = Object.keys(parsed);
          if (urls.length > 0) {
            coverUrl = urls[0];
          }
        } catch {
          // ignore
        }
      }

      if (!coverUrl) {
        coverUrl = landingImg.attr('src') || directAsinCover;
      }

      // Description
      const description = $('#bookDescription_feature_div .a-expander-content').text().trim() ||
                          $('meta[name="description"]').attr('content')?.trim() || '';

      // Page Count
      let pageCount = 280;
      const pagesText = $('#rpi-attribute-book_details-fiona_pages .rpi-attribute-value').text().trim() ||
                        $('li:contains("pages"), li:contains("Pages")').text();
      const pageMatch = pagesText.match(/(\d+)\s*pages/i);
      if (pageMatch) {
        pageCount = parseInt(pageMatch[1], 10);
      }

      if (!title && asin) {
        title = `Book (${asin})`;
      }

      return {
        title: title || 'Untitled Book',
        author: author || 'Unknown Author',
        description,
        coverUrl,
        asin: asin || undefined,
        pageCount,
        source: 'amazon'
      };
    } catch (err) {
      console.warn('[AmazonScraperProvider] Request failed or blocked, falling back with ASIN:', err);
      if (asin) {
        return {
          title: this.deriveTitleFromUrl(input) || `Book (ASIN ${asin})`,
          author: 'Unknown Author',
          asin,
          coverUrl: directAsinCover,
          source: 'amazon'
        };
      }
      return null;
    }
  }

  private deriveTitleFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      // E.g. /Atomic-Habits-James-Clear/dp/1847941834 -> "Atomic Habits James Clear"
      if (segments.length > 0 && segments[0] !== 'dp' && segments[0] !== 'gp') {
        return segments[0].replace(/-/g, ' ');
      }
    } catch {
      // not a valid URL
    }
    return null;
  }
}
