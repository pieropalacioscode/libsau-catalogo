// Configuración de catálogo por cliente. Un cliente nuevo = una entrada aquí
// (más su negocio en la base de datos y su archivo de despliegue), no código nuevo.
// Si un cliente no está listado, se usan los valores por defecto.
import type { SortKey } from "@/lib/catalog-query";
import type { HeroIcon } from "@/lib/hero-copy";

// Una diapositiva del hero. Los textos y enlaces se limpian y validan al pintarlos.
export type HeroSlide = {
  eyebrow?: string;
  title: string;
  highlight?: string; // segunda línea del título, en el color de acento
  text: string;
  ctas: { label: string; href: string }[]; // href: "#catalogo", "/categoria/<slug>" o "WHATSAPP"; el primero es el botón principal
  image?: { file?: string; fromCategory?: string }; // file: archivo junto al logo; fromCategory: 1.ª foto de esa categoría
};

// Portada de marca (hero, tarjetas, pasos). Sin esto, la portada es el catálogo de siempre.
export type HomeConfig = {
  eyebrow: string;
  headline: [string, string]; // la segunda línea va en el color de acento
  subtitle: string;
  primaryCta: string;
  secondaryCta: string; // abre WhatsApp; solo se muestra si el negocio tiene número
  trust: { icon: HeroIcon; text: string; short?: string }[]; // short = texto corto para móvil
  heroFrom: string; // slug de la categoría cuyas fotos van en el hero
  heroCenter?: string; // archivo (junto al logo) de la foto central del hero, de otro rubro
  slides?: HeroSlide[]; // con esto el hero es un carrusel; sin esto, el hero de siempre
  cards: {
    eyebrow: string;
    title: [string, string];
    items: { slug: string; title: string; blurb: string; cta: string }[];
  };
  catalogTitle: string;
  steps: { title: [string, string]; items: { title: string; text: string }[] };
  reasons: { title: string; items: { title: string; text: string }[] };
  banner: { title: [string, string]; text: string; button: string };
};

export type ClientConfig = {
  home?: HomeConfig;
  pageSize: number;
  sorts: SortKey[]; // opciones del selector de orden ("relevance" solo aparece al buscar)
  filters: {
    hide: string[]; // atributos que nunca se ofrecen como filtro
    order: string[]; // atributos que van primero, en este orden
    labels: Record<string, string>; // nombre mostrado distinto del nombre del atributo
    showPrice: boolean;
  };
  copy: {
    searchPlaceholder: string;
    itemPlural: string;
    emptyTitle: string;
    whatsappCta: string; // texto del botón de WhatsApp en la ficha
    pricePrefix: string; // "" o "Desde "
  };
  theme: {
    focus: "accent" | "brand"; // color del anillo de foco
    showNameWithLogo: boolean; // false = el logo ya trae el nombre escrito
    iconFile: string; // archivo del favicon junto al logo ("" = usar el logo)
    appleIconFile: string;
    whatsappStyle: "green" | "brand";
    paper: string; // fondo de página ("" = el de siempre)
    ink: string; // color del texto ("" = el de siempre)
    chip: string; // chips y marcas activas ("" = el color de marca)
    filtersPlacement: "inline" | "header" | "floating"; // dónde va el botón "Filtros" // color del botón de WhatsApp en la ficha
  };
};

const defaults: ClientConfig = {
  pageSize: 24,
  sorts: ["relevance", "name", "price_asc", "price_desc", "newest"],
  filters: { hide: [], order: [], labels: {}, showPrice: true },
  copy: {
    searchPlaceholder: "Buscar productos",
    itemPlural: "productos",
    emptyTitle: "No encontramos productos con esa búsqueda",
    whatsappCta: "Comprar por WhatsApp",
    pricePrefix: "",
  },
  theme: { focus: "accent", showNameWithLogo: true, iconFile: "", appleIconFile: "", whatsappStyle: "green", paper: "", ink: "", chip: "", filtersPlacement: "inline" },
};

type Override = {
  home?: HomeConfig;
  pageSize?: number;
  sorts?: SortKey[];
  filters?: Partial<ClientConfig["filters"]>;
  copy?: Partial<ClientConfig["copy"]>;
  theme?: Partial<ClientConfig["theme"]>;
};

const overrides: Record<string, Override> = {
  libprep: {
    filters: { order: ["Proveedor", "Año de edición", "Impresión"] },
    copy: {
      searchPlaceholder: "Buscar por título, autor o editorial",
      itemPlural: "libros",
      emptyTitle: "No encontramos libros con esa búsqueda",
    },
    // Paleta fiel al logo (verde y naranja vienen del negocio). El logo ya trae el nombre escrito.
    theme: { focus: "brand", showNameWithLogo: false, iconFile: "icono.png", appleIconFile: "apple-touch-icon.png", whatsappStyle: "brand", paper: "#F4F7F5", ink: "#0B1512" },
  },
  luwart: {
    filters: {
      hide: ["Entrega", "Disponibilidad", "Tipo de producto", "Temática", "Alto (cm)", "Ancho (cm)", "Espesor (cm)", "Aplicación"],
      order: ["Ocasión", "Material", "Uso sugerido"],
    },
    copy: {
      searchPlaceholder: "Buscar piñatas, maquetas o componentes",
      itemPlural: "productos",
      emptyTitle: "No encontramos productos con esa búsqueda",
      whatsappCta: "Cotizar por WhatsApp",
      pricePrefix: "Desde ",
    },
    theme: { focus: "brand", showNameWithLogo: false, iconFile: "icono.png", appleIconFile: "apple-touch-icon.png", whatsappStyle: "brand", paper: "#F1F5F9", ink: "#0A1F4D", chip: "#2563EB", filtersPlacement: "header" },
    home: {
      eyebrow: "Hecho a mano · A pedido",
      headline: ["Piñatas y maquetas", "personalizadas"],
      subtitle: "Diseñamos tu piñata para tu cumpleaños y tus maquetas para el colegio, la universidad y más.",
      primaryCta: "Ver productos",
      secondaryCta: "Personalizar mi pedido",
      trust: [
        { icon: "sparkles", text: "Diseños únicos y personalizados", short: "Únicos" },
        { icon: "shield", text: "Materiales de calidad", short: "Calidad" },
        { icon: "sliders", text: "Tú eliges personaje, colores y medidas", short: "Tú eliges" },
      ],
      heroFrom: "pinatas",
      heroCenter: "maqueta-ascensor-3-pisos-con-encoder.avif",
      slides: [
        {
          eyebrow: "Hecho a mano · A pedido",
          title: "Piñatas y maquetas",
          highlight: "personalizadas",
          text: "Diseñamos tu piñata para tu cumpleaños y tus maquetas para el colegio, la universidad y más.",
          ctas: [
            { label: "Ver productos", href: "#catalogo" },
            { label: "Personalizar mi pedido", href: "WHATSAPP" },
          ],
          image: { file: "pinata-rayo-mcqueen-cars-deluxe-3d-luwart.avif" },
        },
        {
          eyebrow: "Para colegio y universidad",
          title: "Maquetas que",
          highlight: "sí impresionan",
          text: "Primaria, secundaria, preuniversitaria y universitaria. Tú nos dices el tema y las medidas.",
          ctas: [{ label: "Ver maquetas", href: "/categoria/maquetas-y-proyectos" }],
          image: { file: "maqueta-ascensor-3-pisos-con-encoder.avif" },
        },
        {
          eyebrow: "Robótica y electrónica",
          title: "Kits para",
          highlight: "armar tú mismo",
          text: "Brazos robóticos, carros, robots caminantes y kits de electrónica para armar en casa o en el colegio.",
          ctas: [{ label: "Ver kits", href: "/categoria/kits-para-armar" }],
          image: { fromCategory: "kits-para-armar" },
        },
        {
          eyebrow: "Para tus proyectos",
          title: "Componentes y",
          highlight: "Arduino",
          text: "Placas, motores y accesorios para darle movimiento a tu maqueta.",
          ctas: [{ label: "Ver componentes", href: "/categoria/componentes-y-accesorios" }],
          image: { fromCategory: "componentes-y-accesorios" },
        },
      ],
      cards: {
        eyebrow: "Nuestras categorías",
        title: ["¿Qué quieres", "crear?"],
        items: [
          { slug: "pinatas", title: "Piñatas personalizadas", blurb: "Para cumpleaños, fiestas y ocasiones especiales.", cta: "Ver piñatas" },
          { slug: "maquetas-y-proyectos", title: "Maquetas y proyectos", blurb: "Automatización, domótica y energía para colegio y universidad.", cta: "Ver maquetas" },
        ],
      },
      catalogTitle: "Nuestros productos",
      steps: {
        title: ["Así de fácil es", "crear con LUWART"],
        items: [
          { title: "Cuéntanos tu idea", text: "Escríbenos por WhatsApp y cuéntanos qué piñata o maqueta necesitas." },
          { title: "Cotizamos", text: "Te enviamos una propuesta con precio y tiempo de entrega." },
          { title: "Creamos", text: "Elaboramos tu pieza con materiales de calidad y mucho detalle." },
          { title: "Entregamos", text: "Coordinamos la entrega en Huancayo o te lo enviamos por Shalom u Olva." },
        ],
      },
      reasons: {
        title: "¿Por qué elegir LUWART?",
        items: [
          { title: "Hecho a mano", text: "Cada pieza se elabora artesanalmente en nuestro taller de Huancayo, con tu personaje, tus colores y tu tema." },
          { title: "Atención personalizada", text: "Te acompañamos por WhatsApp en todo el proceso para que tu idea quede justo como la imaginas." },
          { title: "Envíos a todo el Perú", text: "Entrega directa en Huancayo y envíos por Shalom y Olva a donde estés, con tu pedido bien protegido." },
        ],
      },
      banner: {
        title: ["¿Tienes una idea?", "La hacemos realidad."],
        text: "Escríbenos por WhatsApp, cuéntanos tu idea y te la enviamos donde estés.",
        button: "Cotizar por WhatsApp",
      },
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
    theme: { ...defaults.theme, ...o.theme },
    home: o.home,
  };
}
