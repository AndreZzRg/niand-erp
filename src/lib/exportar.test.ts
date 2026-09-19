/**
 * La exportación no tiene servidor: arma el archivo en memoria y lo entrega
 * con un enlace temporal. Estas pruebas fijan el contrato que Excel y los
 * lectores de calendario esperan, y que la URL temporal siempre se revoque.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  campoCSV,
  exportarCSV,
  exportarJSON,
  exportarTexto,
  leerArchivo,
  imprimir,
  sello,
} from './exportar';

/** Captura el blob y el nombre con que se dispara cada descarga. */
function espiarDescarga() {
  const creada: { contenido: string[]; nombre: string[]; tipo: string[] } = {
    contenido: [],
    nombre: [],
    tipo: [],
  };

  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (b: Blob) => {
      creada.tipo.push(b.type);
      return 'blob:prueba';
    },
    revokeObjectURL: vi.fn(),
  });

  const original = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((etiqueta: string) => {
    const el = original(etiqueta) as HTMLElement;
    if (etiqueta === 'a') {
      const a = el as HTMLAnchorElement;
      vi.spyOn(a, 'click').mockImplementation(() => {
        creada.nombre.push(a.download);
      });
    }
    return el;
  });

  // El contenido se lee del Blob que se pasó al constructor.
  const BlobOriginal = globalThis.Blob;
  vi.stubGlobal(
    'Blob',
    class extends BlobOriginal {
      constructor(partes: BlobPart[], opciones?: BlobPropertyBag) {
        super(partes, opciones);
        creada.contenido.push(partes.map(String).join(''));
      }
    },
  );

  return creada;
}

describe('sello de tiempo', () => {
  it('produce «AAAAMMDD-HHmm» con ceros a la izquierda', () => {
    expect(sello(new Date(2026, 0, 5, 9, 7))).toBe('20260105-0907');
    expect(sello(new Date(2026, 11, 31, 23, 59))).toBe('20261231-2359');
  });
});

describe('escape de campos CSV (RFC 4180)', () => {
  it('deja intacto lo que no tiene separadores', () => {
    expect(campoCSV('teclado')).toBe('teclado');
    expect(campoCSV(1500)).toBe('1500');
  });

  it('entrecomilla y duplica las comillas internas', () => {
    expect(campoCSV('a;b')).toBe('"a;b"');
    expect(campoCSV('a,b')).toBe('"a,b"');
    expect(campoCSV('dice "hola"')).toBe('"dice ""hola"""');
    expect(campoCSV('dos\nlíneas')).toBe('"dos\nlíneas"');
  });

  it('representa la ausencia de valor como campo vacío', () => {
    expect(campoCSV(null)).toBe('');
    expect(campoCSV(undefined)).toBe('');
  });
});

describe('descarga de artefactos', () => {
  let creada: ReturnType<typeof espiarDescarga>;

  beforeEach(() => {
    creada = espiarDescarga();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exporta JSON con sangría y tipo de contenido propio', () => {
    exportarJSON({ a: 1 }, 'datos');

    expect(creada.contenido[0]).toBe('{\n  "a": 1\n}');
    expect(creada.tipo[0]).toContain('application/json');
    expect(creada.nombre[0]).toMatch(/^niand-erp-datos-\d{8}-\d{4}\.json$/);
  });

  it('exporta CSV con BOM y separador de punto y coma para Excel', () => {
    exportarCSV(
      [
        ['codigo', 'nombre'],
        ['TEC-001', 'Teclado; mecánico'],
      ],
      'tabla',
    );

    const csv = creada.contenido[0] ?? '';
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('codigo;nombre');
    expect(csv).toContain('"Teclado; mecánico"');
    expect(csv).toContain('\r\n');
    expect(creada.nombre[0]).toMatch(/\.csv$/);
  });

  it('exporta texto con la extensión indicada', () => {
    exportarTexto('# Informe', 'informe', 'md');

    expect(creada.contenido[0]).toBe('# Informe');
    expect(creada.nombre[0]).toMatch(/\.md$/);
  });
});

describe('lectura de un archivo elegido por el usuario', () => {
  it('entrega el contenido como texto', async () => {
    const archivo = new File(['contenido'], 'datos.txt', { type: 'text/plain' });
    await expect(leerArchivo(archivo)).resolves.toBe('contenido');
  });
});

describe('impresión', () => {
  it('delega en la ventana de impresión del navegador', () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    window.print = print;

    imprimir();

    expect(print).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
