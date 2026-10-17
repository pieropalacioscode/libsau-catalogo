import { foldChar, foldKey } from "./text";

export type Segment = { text: string; hit: boolean };

// Parte `text` en tramos, marcando los que coinciden con alguna palabra de
// `query` sin distinguir tildes ni mayúsculas ("alge" marca "Álge" en "Álgebra").
export function highlight(text: string, query: string): Segment[] {
  const chars = Array.from(text);
  if (chars.length === 0) return [];
  const tokens = foldKey(query).split(/\s+/).filter(Boolean);
  const hit = new Array<boolean>(chars.length).fill(false);

  if (tokens.length > 0) {
    const folded = chars.map(foldChar).join("");
    for (const t of tokens) {
      for (let i = folded.indexOf(t); i !== -1; i = folded.indexOf(t, i + 1)) {
        for (let k = i; k < i + t.length; k++) hit[k] = true;
      }
    }
  }

  const out: Segment[] = [];
  let start = 0;
  for (let i = 1; i <= chars.length; i++) {
    if (i === chars.length || hit[i] !== hit[start]) {
      out.push({ text: chars.slice(start, i).join(""), hit: hit[start] });
      start = i;
    }
  }
  return out;
}
