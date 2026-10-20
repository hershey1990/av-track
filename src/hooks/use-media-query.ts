"use client";

import { useEffect, useState } from "react";

/**
 * Suscripción a una media query de CSS.
 *
 * El valor inicial se calcula de forma síncrona porque la app es un SPA (Vite)
 * sin renderizado en servidor: así el árbol de la primera pintura ya decide si
 * muestra el popover de escritorio o la hoja inferior de móvil, sin parpadeo.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
