import { describe, expect, it } from 'vitest';
import {
  aPesos,
  dosDecimales,
  fechaConDia,
  fechaCorta,
  fechaLarga,
  numero,
  pesos,
  plural,
  porcentaje,
} from './formato';

/**
 * Intl inserta espacios de no separación y su presencia varía entre versiones
 * de ICU. Para comparar se elimina todo espacio en blanco.
 */
const limpiar = (s: string) => s.replace(/\s|\u00a0|\u202f/g, '');

describe('formato de moneda', () => {
  it('presenta pesos colombianos sin decimales', () => {
    expect(limpiar(pesos(1_423_500))).toContain('1.423.500');
    expect(limpiar(pesos(1_423_500))).toContain('$');
  });

  it('no rompe ante valores no finitos', () => {
    expect(limpiar(pesos(Number.NaN))).toContain('0');
    expect(limpiar(pesos(Number.POSITIVE_INFINITY))).toContain('0');
  });
});

describe('formato de números', () => {
  it('limita los decimales y marca lo no representable', () => {
    expect(limpiar(numero(1234.5678))).toBe('1.234,57');
    expect(numero(Number.NaN)).toBe('—');
  });

  it('presenta fracciones como porcentaje', () => {
    expect(limpiar(porcentaje(0.35))).toBe('35%');
    expect(limpiar(porcentaje(0.805, 1))).toBe('80,5%');
  });
});

describe('formato de fechas', () => {
  it('escribe la fecha larga en español', () => {
    expect(fechaLarga('2026-09-17')).toBe('17 de septiembre de 2026');
  });

  it('antepone el día de la semana correcto', () => {
    expect(fechaConDia('2026-09-17')).toBe('jueves, 17 de septiembre de 2026');
  });

  it('presenta la forma corta en orden colombiano', () => {
    expect(fechaCorta('2026-09-17')).toBe('17/09/2026');
  });

  it('devuelve la entrada si no es una fecha reconocible', () => {
    expect(fechaLarga('vacío')).toBe('vacío');
  });
});

describe('redondeo', () => {
  it('lleva a la unidad de peso', () => {
    expect(aPesos(1500.4)).toBe(1500);
    expect(aPesos(1500.5)).toBe(1501);
  });

  it('corrige el arrastre binario en dos decimales', () => {
    expect(dosDecimales(0.1 + 0.2)).toBe(0.3);
    expect(dosDecimales(1.005)).toBe(1.01);
  });
});

describe('pluralización', () => {
  it('concuerda el sustantivo con la cantidad', () => {
    expect(plural(1, 'día', 'días')).toBe('1 día');
    expect(plural(0, 'día', 'días')).toBe('0 días');
    expect(plural(15, 'día', 'días')).toBe('15 días');
  });
});
