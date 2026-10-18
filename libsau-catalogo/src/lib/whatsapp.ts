// Enlace wa.me con texto prellenado. null si el negocio no tiene número.
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const digits = phone?.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
