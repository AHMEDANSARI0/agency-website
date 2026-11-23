export interface BrandAssetConfig {
  brandName: string;
  tagline: string;
  altText: string;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  symbolUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  showTextFallback: boolean;
  updatedAt: string;
  updatedBy?: string;
}
