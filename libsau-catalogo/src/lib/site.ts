// src/lib/site.ts — configuración de marca y validación de datos que vienen de la API.

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Color de respaldo si el negocio no trae primary_color (o trae algo inválido).
export const DEFAULT_BRAND = "#047857";

// El color llega de la API y se inyecta en un estilo: solo se acepta #RRGGBB.
export function safeColor(value: string | null | undefined): string {
  return value && HEX_COLOR.test(value) ? value : DEFAULT_BRAND;
}

// Solo URLs https válidas; cualquier otra cosa se descarta.
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// En VPS hay que definir SITE_URL (con https://). En Vercel se deriva sola.
export const siteUrl = process.env.SITE_URL
  ? process.env.SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Textos opcionales por despliegue. Si faltan, se usan valores genéricos.
export const siteConfig = {
  title: process.env.SITE_TITLE,
  description: process.env.SITE_DESCRIPTION,
  tagline: process.env.SITE_TAGLINE,
};