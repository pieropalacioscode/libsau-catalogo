// Normalización de texto compartida (resaltado, sugerencias). Sin dependencias.
const MARKS = /\p{M}/gu;
const PLACEHOLDER = "\uFFFF";

// Minúsculas y sin tildes (Ñandú -> nandu). La longitud puede cambiar.
export const plain = (s: string): string => s.normalize("NFD").replace(MARKS, "").toLowerCase();

// Un carácter -> exactamente una unidad. Lo que no se reduzca a una unidad
// (un emoji, por ejemplo) pasa a ser un marcador, así los índices del texto
// plegado siguen alineados con los del original.
export function foldChar(ch: string): string {
  const f = plain(ch);
  return f.length === 1 ? f : PLACEHOLDER;
}

export function foldKey(s: string): string {
  let out = "";
  for (const ch of s) out += foldChar(ch);
  return out;
}
