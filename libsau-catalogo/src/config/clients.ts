// Configuración de catálogo por cliente. Un cliente nuevo = una entrada aquí
// (más su negocio en la base de datos y su archivo de despliegue), no código nuevo.
// Si un cliente no está listado, se usan los valores por defecto.
import type { SortKey } from "@/lib/catalog-query";

export type ClientConfig = {
  pageSize: number;
  sorts: SortKey[]; // opciones del selector de orden ("relevance" solo aparece al buscar)
  filters: {
    hide: string[]; // atributos que nunca se ofrecen como filtro
    order: string[]; // atributos que van primero, en este orden
    labels: Record<string, string>; // nombre mostrado distinto del nombre del atributo
    showPrice: boolean;
  };
  copy: { searchPlaceholder: string; itemPlural: string; emptyTitle: string };
};

const defaults: ClientConfig = {
  pageSize: 24,
  sorts: ["relevance", "name", "price_asc", "price_desc", "newest"],
  filters: { hide: [], order: [], labels: {}, showPrice: true },
  copy: {
    searchPlaceholder: "Buscar productos",
    itemPlural: "productos",
    emptyTitle: "No encontramos productos con esa búsqueda",
  },
};

type Override = {
  pageSize?: number;
  sorts?: SortKey[];
  filters?: Partial<ClientConfig["filters"]>;
  copy?: Partial<ClientConfig["copy"]>;
};

const overrides: Record<string, Override> = {
  libprep: {
    filters: { order: ["Editorial", "Año de edición", "Impresión"] },
    copy: {
      searchPlaceholder: "Buscar por título, autor o editorial",
      itemPlural: "libros",
      emptyTitle: "No encontramos libros con esa búsqueda",
    },
  },
  // Borrador: se ajusta con el cliente cuando llegue su catálogo (ver decisión D2, tallas y colores).
  neochompa: {
    filters: { order: ["Talla", "Color"] },
    copy: {
      searchPlaceholder: "Buscar chompas, colores o tallas",
      itemPlural: "prendas",
      emptyTitle: "No encontramos prendas con esa búsqueda",
    },
  },
};

export function getClientConfig(slug: string = process.env.NEXT_PUBLIC_NEGOCIO_SLUG ?? ""): ClientConfig {
  const o = Object.prototype.hasOwnProperty.call(overrides, slug) ? overrides[slug] : {};
  return {
    pageSize: o.pageSize ?? defaults.pageSize,
    sorts: o.sorts ?? defaults.sorts,
    filters: { ...defaults.filters, ...o.filters },
    copy: { ...defaults.copy, ...o.copy },
  };
}
