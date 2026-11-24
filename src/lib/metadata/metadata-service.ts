import { IMetadataProvider } from './types';
import { AmazonScraperProvider } from './providers/amazon-scraper';
import { OpenLibraryProvider } from './providers/openlibrary-provider';
import { UnsplashProvider } from './providers/unsplash-provider';
import { MetadataLookupResult } from '@/types';

export class MetadataService {
  private static providers: IMetadataProvider[] = [
    new AmazonScraperProvider(),
    new OpenLibraryProvider(),
    new UnsplashProvider(),
  ];

  private static unsplash = new UnsplashProvider();

  public static async lookup(input: string): Promise<MetadataLookupResult> {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Input URL, ASIN, or Title cannot be empty.');
    }

    let result: MetadataLookupResult | null = null;

    // Check if input is specifically an Amazon URL or ASIN
    const isAmazon = /(?:amazon\.[a-z.]+|amzn\.to)/i.test(trimmed) || /^[B0-9][A-Z0-9]{9}$/i.test(trimmed);

    if (isAmazon) {
      const amazonProvider = new AmazonScraperProvider();
      result = await amazonProvider.lookup(trimmed);

      // If Amazon lookup provided ASIN/title but cover or description is missing, enrich via OpenLibrary
      if (result && (!result.coverUrl || !result.description)) {
        const query = result.asin || result.title;
        const openLibResult = await new OpenLibraryProvider().lookup(query);
        if (openLibResult) {
          result.description = result.description || openLibResult.description;
          result.pageCount = result.pageCount || openLibResult.pageCount;
          result.coverUrl = result.coverUrl || openLibResult.coverUrl;
          if (result.author === 'Unknown Author' && openLibResult.author !== 'Unknown Author') {
            result.author = openLibResult.author;
          }
        }
      }
    } else {
      // General title or ISBN lookup via OpenLibrary
      const openLib = new OpenLibraryProvider();
      result = await openLib.lookup(trimmed);
    }

    // Fallback if no provider matched or returned data
    if (!result) {
      result = {
        title: trimmed,
        author: 'Unknown Author',
        source: 'manual',
        pageCount: 280,
      };
    }

    // Guarantee a valid cover: if none found, match with closest Unsplash cover
    if (!result.coverUrl) {
      result.coverUrl = this.unsplash.findClosestCover(result.title + ' ' + (result.genre || ''));
    }

    return result;
  }

  /**
   * Generates a complementary spine color and text color based on the book title/author.
   */
  public static generateSpinePalette(title: string): { spineColor: string; spineTextColor: string } {
    const lower = title.toLowerCase();
    if (lower.includes('subtle art') || lower.includes('manson')) {
      return { spineColor: '#ea580c', spineTextColor: '#ffffff' };
    }
    if (lower.includes('atomic habits') || lower.includes('clear')) {
      return { spineColor: '#c2410c', spineTextColor: '#ffffff' };
    }

    const palette = [
      { spineColor: '#ea580c', spineTextColor: '#ffffff' }, // Signature Orange
      { spineColor: '#1e293b', spineTextColor: '#f8fafc' }, // Slate dark
      { spineColor: '#7f1d1d', spineTextColor: '#fef2f2' }, // Crimson leather
      { spineColor: '#14532d', spineTextColor: '#f0fdf4' }, // Forest green
      { spineColor: '#1e3a8a', spineTextColor: '#eff6ff' }, // Deep sapphire
      { spineColor: '#701a75', spineTextColor: '#fdf4ff' }, // Royal purple
      { spineColor: '#78350f', spineTextColor: '#fef3c7' }, // Classic amber leather
      { spineColor: '#c2410c', spineTextColor: '#ffffff' }, // Terracotta
      { spineColor: '#312e81', spineTextColor: '#e0e7ff' }, // Midnight indigo
      { spineColor: '#831843', spineTextColor: '#fdf2f8' }, // Dark wine
      { spineColor: '#262626', spineTextColor: '#fafafa' }, // Jet black
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % palette.length;
    return palette[index];
  }
}
