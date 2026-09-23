/** Brand form input used by create / edit flows. */
export type BrandFormInput = {
  name: string;
  industry: string;
  websiteUrl?: string;
  officialStoreUrl?: string;
  description?: string;
  coreProducts?: string;
  targetAudience?: string;
  priceTier?: string;
  desiredPositioning?: string;
  desiredKeywords?: string;
  /** MVP: up to 3 competitor names */
  competitors: string[];
};

export type BrandListItem = {
  id: string;
  name: string;
  industry: string;
  status: string;
  createdAt: Date;
};

export type BrandDetail = {
  id: string;
  name: string;
  industry: string;
  websiteUrl: string | null;
  officialStoreUrl: string | null;
  description: string | null;
  coreProducts: string | null;
  targetAudience: string | null;
  priceTier: string | null;
  desiredPositioning: string | null;
  desiredKeywords: string | null;
  status: string;
  createdAt: Date;
  competitors: Array<{
    id: string;
    name: string;
    websiteUrl: string | null;
  }>;
};
