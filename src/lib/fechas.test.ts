import { describe, expect, it } from 'vitest';
import {
  aISO,
  desdeISO,
  diasComerciales,
  domingoPascua,
  esFestivo,
  esHabil,
  esISO,
  estadoPlazo,
  festivosDe,
  habilesEntre,
  nombreFestivo,
  siguienteHabil,
  sumarDias,
  sumarHabiles,
  sumarMeses,
  trasladarALunes,
} from './fechas';

describe('conversión de fechas', () => {
  it('convierte ida y vuelta sin desfase de zona horaria', () => {
    expect(aISO(desdeISO('2026-09-17'))).toBe('2026-09-17');
    expect(aISO(desdeISO('2026-01-01'))).toBe('2026-01-01');
    expect(aISO(desdeISO('2026-12-31'))).toBe('2026-12-31');
  });

  it('rechaza cadenas que no son fechas válidas', () => {
    expect(esISO('2026-09-17')).toBe(true);
    expect(esISO('2026-02-30')).toBe(false);
    expect(esISO('17/09/2026')).toBe(false);
    expect(esISO(20260917)).toBe(false);
  });

  it('lanza al recibir una cadena malformada', () => {
    expect(() => desdeISO('no-es-fecha')).toThrow(RangeError);
  });
});

describe('aritmética de calendario', () => {
  it('suma días cruzando el cambio de año', () => {
    expect(sumarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(sumarDias('2026-01-02', -3)).toBe('2025-12-30');
  });

  it('ajusta al último día cuando el mes destino es más corto', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29'); // bisiesto
    expect(sumarMeses('2026-03-15', -3)).toBe('2025-12-15');
  });
});

describe('días comerciales de 30 y año de 360 (CST arts. 249 y 306)', () => {
  it('cuenta un año completo como 360 días', () => {
    expect(diasComerciales('2026-01-01', '2027-01-01')).toBe(360);
  });

  it('cuenta un mes como 30 días sin importar los días reales', () => {
    expect(diasComerciales('2026-01-01', '2026-02-01')).toBe(30);
    expect(diasComerciales('2026-02-01', '2026-03-01')).toBe(30);
  });

  it('trata el día 31 como día 30', () => {
    expect(diasComerciales('2026-01-31', '2026-02-28')).toBe(28);
  });
});

describe('domingo de Pascua', () => {
  // Fechas contrastadas contra el calendario litúrgico.
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2030, '2030-04-21'],
  ])('en %i cae el %s', (anio, esperado) => {
    expect(domingoPascua(anio)).toBe(esperado);
  });
});

describe('traslado al lunes (Ley 51 de 1983, art. 1)', () => {
  it('deja intacta una fecha que ya es lunes', () => {
    expect(trasladarALunes('2026-01-05')).toBe('2026-01-05'); // lunes
  });

  it('mueve al lunes siguiente cualquier otro día', () => {
    expect(trasladarALunes('2026-01-06')).toBe('2026-01-12'); // martes → lunes
    expect(trasladarALunes('2026-08-15')).toBe('2026-08-17'); // sábado → lunes
  });
});

describe('festivos nacionales de Colombia', () => {
  it('reconoce 18 festivos al año', () => {
    expect(festivosDe(2026).size).toBe(18);
    expect(festivosDe(2027).size).toBe(18);
  });

  it('conserva la fecha de los festivos del art. 2 de la Ley 51 de 1983', () => {
    expect(esFestivo('2026-01-01')).toBe(true);
    expect(esFestivo('2026-05-01')).toBe(true);
    expect(esFestivo('2026-07-20')).toBe(true);
    expect(esFestivo('2026-08-07')).toBe(true);
    expect(esFestivo('2026-12-08')).toBe(true);
    expect(esFestivo('2026-12-25')).toBe(true);
  });

  it('traslada Reyes Magos de 2026 al lunes 12 de enero', () => {
    expect(esFestivo('2026-01-06')).toBe(false);
    expect(nombreFestivo('2026-01-12')).toBe('Reyes Magos');
  });

  it('ubica la Semana Santa de 2026 a partir de la Pascua del 5 de abril', () => {
    expect(nombreFestivo('2026-04-02')).toBe('Jueves Santo');
    expect(nombreFestivo('2026-04-03')).toBe('Viernes Santo');
  });

  it('coloca en lunes los tres festivos religiosos móviles', () => {
    for (const nombre of ['Ascensión del Señor', 'Corpus Christi', 'Sagrado Corazón']) {
      const iso = [...festivosDe(2026)].find(([, n]) => n === nombre)?.[0];
      expect(iso, nombre).toBeDefined();
      expect(desdeISO(iso!).getDay(), nombre).toBe(1);
    }
  });

  it('no marca como festivo un día laboral corriente', () => {
    expect(esFestivo('2026-09-17')).toBe(false);
  });
});

describe('días hábiles', () => {
  it('excluye fines de semana y festivos', () => {
    expect(esHabil('2026-09-17')).toBe(true); // jueves
    expect(esHabil('2026-09-19')).toBe(false); // sábado
    expect(esHabil('2026-09-20')).toBe(false); // domingo
    expect(esHabil('2026-01-01')).toBe(false); // festivo
  });

  it('no cuenta el día de partida al sumar plazos', () => {
    // Jueves 17 + 1 hábil = viernes 18.
    expect(sumarHabiles('2026-09-17', 1)).toBe('2026-09-18');
    // Viernes 18 + 1 hábil salta el fin de semana.
    expect(sumarHabiles('2026-09-18', 1)).toBe('2026-09-21');
  });

  it('salta el puente cuando el lunes es festivo', () => {
    // Viernes 9 de enero de 2026 + 1 hábil: el lunes 12 es Reyes trasladado.
    expect(sumarHabiles('2026-01-09', 1)).toBe('2026-01-13');
  });

  it('cuenta hacia atrás con plazos negativos', () => {
    expect(sumarHabiles('2026-09-21', -1)).toBe('2026-09-18');
  });

  it('devuelve la misma fecha con plazo cero', () => {
    expect(sumarHabiles('2026-09-17', 0)).toBe('2026-09-17');
  });

  it('es consistente con el conteo inverso', () => {
    const destino = sumarHabiles('2026-09-17', 10);
    expect(habilesEntre('2026-09-17', destino)).toBe(10);
    expect(habilesEntre(destino, '2026-09-17')).toBe(-10);
  });

  it('adelanta al siguiente hábil cuando la fecha cae en descanso', () => {
    expect(siguienteHabil('2026-09-19')).toBe('2026-09-21');
    expect(siguienteHabil('2026-09-17')).toBe('2026-09-17');
  });
});

describe('estado de un vencimiento', () => {
  const hoy = '2026-09-17';

  it('clasifica según los días hábiles restantes', () => {
    expect(estadoPlazo('2026-09-16', hoy)).toBe('vencido');
    expect(estadoPlazo(sumarHabiles(hoy, 3), hoy)).toBe('critico');
    expect(estadoPlazo(sumarHabiles(hoy, 10), hoy)).toBe('proximo');
    expect(estadoPlazo(sumarHabiles(hoy, 40), hoy)).toBe('holgado');
  });

  it('trata el día del vencimiento como crítico, no como vencido', () => {
    expect(estadoPlazo(hoy, hoy)).toBe('critico');
  });
});
