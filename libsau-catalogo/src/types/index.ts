export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
  parent?: { id: number; name: string; slug: string } | null;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  category: CategoryRef;
  updated_at?: string;
  attributes?: { name: string; value: string }[];
  description?: string;
  isbn?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  parent_slug?: string | null; // null/ausente = categoría raíz
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetAttribute {
  name: string;
  values: FacetValue[];
}

export interface Facets {
  categories: Category[];
  attributes: FacetAttribute[];
  price: { min: number; max: number };
  total: number;
}

export interface BusinessInfo {
  name: string;
  phone: string;
  color?: string;
}

export interface Business {
  slug: string;
  name: string;
  whatsapp_number: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  address?: string | null;
  opening_hours?: string | null;
}
