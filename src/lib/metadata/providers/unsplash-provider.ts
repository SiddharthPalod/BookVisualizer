import { IMetadataProvider } from '../types';
import { MetadataLookupResult } from '@/types';

export class UnsplashProvider implements IMetadataProvider {
  public name = 'unsplash';

  // Curated high quality high-resolution book & thematic covers on Unsplash
  private static curatedThematicCovers: Record<string, string> = {
    habits: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    productivity: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    philosophy: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    psychology: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    science: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    minimal: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    classic: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    fiction: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
  };

  public supports(input: string): boolean {
    return true;
  }

  public async lookup(input: string): Promise<MetadataLookupResult | null> {
    const coverUrl = this.findClosestCover(input);
    return {
      title: input,
      author: 'Author',
      coverUrl,
      source: 'unsplash'
    };
  }

  public findClosestCover(query: string): string {
    const lower = query.toLowerCase();
    for (const [key, url] of Object.entries(UnsplashProvider.curatedThematicCovers)) {
      if (lower.includes(key)) {
        return url;
      }
    }

    // Default aesthetic book photography from Unsplash
    return UnsplashProvider.curatedThematicCovers.minimal;
  }
}
