import { MetadataLookupResult } from '@/types';

export interface IMetadataProvider {
  name: string;
  supports(input: string): boolean;
  lookup(input: string): Promise<MetadataLookupResult | null>;
}
