"use client";

import { useSearchParams } from "next/navigation";
import SearchForm from "./SearchForm";

// Muestra en el cuadro lo que se buscó. `key` reinicia el campo cuando cambia ?q=.
export default function SearchBox({ placeholder }: { placeholder: string }) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchForm key={q} defaultValue={q} placeholder={placeholder} />;
}
