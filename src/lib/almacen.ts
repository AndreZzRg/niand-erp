/**
 * Persistencia tipada en `localStorage`.
 *
 * Nada de lo que se lee del almacenamiento es confiable: el usuario puede
 * editarlo a mano y puede venir de una versión anterior de la aplicación. Por
 * eso toda lectura pasa por un esquema Zod y por una comprobación de versión.
 */
import type { ZodType } from 'zod';

const PREFIJO = 'niand-erp:';

export type Sobre<T> = { version: number; datos: T };

function disponible(): boolean {
  try {
    const p = PREFIJO + '__prueba';
    localStorage.setItem(p, '1');
    localStorage.removeItem(p);
    return true;
  } catch {
    // Navegación privada, almacenamiento lleno o bloqueado por política.
    return false;
  }
}

export const almacenDisponible = disponible();

/**
 * Lee un valor validándolo contra su esquema. Devuelve `respaldo` si no
 * existe, si la versión no coincide o si el contenido no supera la validación.
 */
export function leer<T>(clave: string, esquema: ZodType<T>, version: number, respaldo: T): T {
  if (!almacenDisponible) return respaldo;
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (!crudo) return respaldo;

    const sobre = JSON.parse(crudo) as Partial<Sobre<unknown>>;
    if (sobre?.version !== version) return respaldo;

    const r = esquema.safeParse(sobre.datos);
    if (!r.success) {
      console.warn(`[almacen] "${clave}" no superó la validación; se descarta.`, r.error.issues);
      return respaldo;
    }
    return r.data;
  } catch (e) {
    console.warn(`[almacen] no se pudo leer "${clave}".`, e);
    return respaldo;
  }
}

export function escribir<T>(clave: string, version: number, datos: T): boolean {
  if (!almacenDisponible) return false;
  try {
    const sobre: Sobre<T> = { version, datos };
    localStorage.setItem(PREFIJO + clave, JSON.stringify(sobre));
    return true;
  } catch (e) {
    console.warn(`[almacen] no se pudo escribir "${clave}".`, e);
    return false;
  }
}

export function borrar(clave: string): void {
  if (!almacenDisponible) return;
  localStorage.removeItem(PREFIJO + clave);
}

/** Borra todo lo que esta aplicación guardó, sin tocar otras del mismo origen. */
export function borrarTodo(): void {
  if (!almacenDisponible) return;
  for (const c of Object.keys(localStorage)) {
    if (c.startsWith(PREFIJO)) localStorage.removeItem(c);
  }
}

/** Claves gestionadas por esta aplicación, sin el prefijo. */
export function claves(): string[] {
  if (!almacenDisponible) return [];
  return Object.keys(localStorage)
    .filter((c) => c.startsWith(PREFIJO))
    .map((c) => c.slice(PREFIJO.length));
}

/** Adaptador para el middleware `persist` de Zustand. */
export const almacenZustand = {
  getItem: (nombre: string): string | null =>
    almacenDisponible ? localStorage.getItem(PREFIJO + nombre) : null,
  setItem: (nombre: string, valor: string): void => {
    if (almacenDisponible) localStorage.setItem(PREFIJO + nombre, valor);
  },
  removeItem: (nombre: string): void => {
    if (almacenDisponible) localStorage.removeItem(PREFIJO + nombre);
  },
};
