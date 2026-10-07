export interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  category: {
    id: number;
    name: string;
  };
  attributes?: { name: string; value: string }[];
  description?: string;
  isbn?: string;
}

export interface Category {
  id: number;
  name: string;
  product_count: number;
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
}