import { socialLinks } from "@/lib/org";
import type { Business } from "@/types";

// Redes, dirección y horario salen del negocio; lo que esté vacío no se muestra.
export default function SiteFooter({ business, name }: { business: Business | null; name: string }) {
  const links = socialLinks(business);
  const address = business?.address?.trim();
  const hours = business?.opening_hours?.trim();
  const hasExtras = links.length > 0 || Boolean(address) || Boolean(hours);

  return (
    // [--focus:#fff]: el anillo de foco azul marino no se vería sobre el fondo de marca
    <footer className="bg-brand text-white py-6 text-center text-sm [--focus:#fff]">
      {hasExtras && (
        <div className="mx-auto mb-4 flex max-w-6xl flex-col items-center gap-2 px-4">
          {links.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                  >
                    {l.label}
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {address && <p>{address}</p>}
          {hours && <p className="whitespace-pre-line text-white/80">{hours}</p>}
        </div>
      )}
      <p>
        © {new Date().getFullYear()} {name}
      </p>
    </footer>
  );
}
