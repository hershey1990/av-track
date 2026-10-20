/**
 * Versión del service worker.
 *
 * Al cambiarla se purga la caché anterior (`public/sw.js` usa la misma
 * versión como nombre de caché) y se recargan los assets estáticos.
 * IMPORTANTE: debe coincidir con la constante `CACHE` de `public/sw.js`.
 */
export const BB_SW_VERSION = 'v3'
