import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Las páginas de búsqueda llevarán <meta robots="noindex"> (entrega B), no un
// Disallow aquí: si se bloquea el rastreo, Google nunca vería ese noindex.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
