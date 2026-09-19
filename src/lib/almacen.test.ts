/**
 * El almacenamiento es la única frontera de la aplicación con datos que no
 * controla: lo que vuelve de `localStorage` pudo ser editado a mano o quedar
 * de una versión anterior. Estas pruebas fijan que nada entre sin validarse.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { borrar, borrarTodo, claves, escribir, leer, almacenZustand } from './almacen';

const Esquema = z.object({ nombre: z.string(), cantidad: z.number() });
type Dato = z.infer<typeof Esquema>;

const RESPALDO: Dato = { nombre: 'vacío', cantidad: 0 };
const VALIDO: Dato = { nombre: 'teclado', cantidad: 12 };

describe('lectura y escritura tipada', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('devuelve lo que se guardó cuando la versión y el esquema coinciden', () => {
    expect(escribir('caso', 1, VALIDO)).toBe(true);
    expect(leer('caso', Esquema, 1, RESPALDO)).toEqual(VALIDO);
  });

  it('devuelve el respaldo cuando la clave no existe', () => {
    expect(leer('ausente', Esquema, 1, RESPALDO)).toEqual(RESPALDO);
  });

  it('descarta el dato cuando cambia la versión del esquema', () => {
    escribir('caso', 1, VALIDO);
    expect(leer('caso', Esquema, 2, RESPALDO)).toEqual(RESPALDO);
  });

  it('descarta el dato que no supera la validación', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    escribir('caso', 1, { nombre: 'teclado', cantidad: 'doce' });

    expect(leer('caso', Esquema, 1, RESPALDO)).toEqual(RESPALDO);
    expect(aviso).toHaveBeenCalled();
  });

  it('descarta el contenido que ni siquiera es JSON', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('niand-erp:roto', '{no es json');

    expect(leer('roto', Esquema, 1, RESPALDO)).toEqual(RESPALDO);
    expect(aviso).toHaveBeenCalled();
  });
});

describe('gestión de claves', () => {
  beforeEach(() => localStorage.clear());

  it('borra una clave sin tocar las demás', () => {
    escribir('a', 1, VALIDO);
    escribir('b', 1, VALIDO);

    borrar('a');

    expect(leer('a', Esquema, 1, RESPALDO)).toEqual(RESPALDO);
    expect(leer('b', Esquema, 1, RESPALDO)).toEqual(VALIDO);
  });

  it('lista solo las claves de esta aplicación', () => {
    escribir('propia', 1, VALIDO);
    localStorage.setItem('otra-app:ajena', '1');

    expect(claves()).toEqual(['propia']);
  });

  it('borra todo lo propio y respeta lo ajeno', () => {
    escribir('propia', 1, VALIDO);
    localStorage.setItem('otra-app:ajena', '1');

    borrarTodo();

    expect(claves()).toEqual([]);
    expect(localStorage.getItem('otra-app:ajena')).toBe('1');
  });
});

describe('adaptador para Zustand', () => {
  beforeEach(() => localStorage.clear());

  it('escribe, lee y elimina bajo el prefijo de la aplicación', () => {
    almacenZustand.setItem('estado', '{"a":1}');

    expect(almacenZustand.getItem('estado')).toBe('{"a":1}');
    expect(localStorage.getItem('niand-erp:estado')).toBe('{"a":1}');

    almacenZustand.removeItem('estado');
    expect(almacenZustand.getItem('estado')).toBeNull();
  });
});
