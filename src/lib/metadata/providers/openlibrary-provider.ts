import axios from 'axios';
import { IMetadataProvider } from '../types';
import { MetadataLookupResult } from '@/types';

export class OpenLibraryProvider implements IMetadataProvider {
  public name = 'openlibrary';

  public supports(input: string): boolean {
    // Supports ISBN-10, ISBN-13, or general titles
    return true;
  }

  public async lookup(input: string): Promise<MetadataLookupResult | null> {
    const cleanInput = input.trim();

    try {
      // 1. Try ISBN direct lookup if numeric or standard ISBN format
      const isbnMatch = cleanInput.replace(/[-\s]/g, '').match(/^(?:[0-9]{9}[0-9X]|[0-9]{13})$/i);
      if (isbnMatch) {
        const isbn = isbnMatch[0];
        try {
          const isbnRes = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`, { timeout: 6000 });
          const bookData = isbnRes.data;

          let authorName = 'Unknown Author';
          if (bookData.authors && bookData.authors.length > 0) {
            try {
              const authorKey = bookData.authors[0].key;
              const authorRes = await axios.get(`https://openlibrary.org${authorKey}.json`, { timeout: 4000 });
              authorName = authorRes.data.name || authorName;
            } catch {
              // fallback
            }
          }

          const coverUrl = bookData.covers && bookData.covers.length > 0
            ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
            : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

          return {
            title: bookData.title || 'Untitled',
            author: authorName,
            description: typeof bookData.description === 'string' ? bookData.description : bookData.description?.value,
            isbn,
            pageCount: bookData.number_of_pages || 300,
            coverUrl,
            publishDate: bookData.publish_date,
            source: 'openlibrary'
          };
        } catch {
          // continue to search API
        }
      }

      // 2. Search Open Library by title / general query
      const searchRes = await axios.get('https://openlibrary.org/search.json', {
        params: { q: cleanInput, limit: 1 },
        timeout: 6000
      });

      const docs = searchRes.data?.docs;
      if (!docs || docs.length === 0) {
        return null;
      }

      const topBook = docs[0];
      const isbn = topBook.isbn?.[0];
      const coverId = topBook.cover_i;
      const coverUrl = coverId 
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : undefined);

      return {
        title: topBook.title,
        author: topBook.author_name?.[0] || 'Unknown Author',
        isbn,
        pageCount: topBook.number_of_pages_median || 280,
        publishDate: topBook.first_publish_year ? String(topBook.first_publish_year) : undefined,
        genre: topBook.subject?.[0] || 'General',
        coverUrl,
        source: 'openlibrary'
      };
    } catch (err) {
      console.warn('[OpenLibraryProvider] Lookup error:', err);
      return null;
    }
  }
}
