// Nombre de la cookie que el enlace de bio al cotizador IA deja con el
// session_id ya sembrado del lado del servidor. Vive en su propio archivo
// porque la escriben dos mundos: la ruta /<red>/cotizador (servidor, ver
// lib/bio-cotizador.ts) y ContactoFab (navegador, que la lee para adoptar esa
// sesión). Importar lib/bio-cotizador.ts desde el cliente arrastraría su
// process.env al bundle del navegador.
export const COOKIE_SESION_BIO = "lotus_ia_bio";
