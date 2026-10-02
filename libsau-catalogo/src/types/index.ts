export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: {
    id: number;
    name: string;
  };
  attributes?: { name: string; value: string }[]; // ← Actualizado
  description?: string;
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