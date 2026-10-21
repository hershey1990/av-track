"use client";

import { useEffect } from "react";
import { BB_SW_VERSION } from "@/config/pwa";

const SW_VERSION_KEY = "bb-sw-version";

export function PWARegister() {
  useEffect(() => {
    // La sesión de Supabase vive en localStorage (persistSession por defecto),
    // así que NO se toca aquí: borrarla cerraría la sesión del usuario en cada
    // actualización del service worker.
    localStorage.setItem(SW_VERSION_KEY, BB_SW_VERSION);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // If there's a waiting SW, notify user and reload when ready
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New SW available — reload to activate it
                window.location.reload();
              }
            });
          }
        });
      });

      // If the SW is already waiting, reload
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      }
    }
  }, []);

  return null;
}
