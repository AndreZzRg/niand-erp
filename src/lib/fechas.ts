/**
 * Calendario laboral colombiano: festivos, días hábiles y aritmética de plazos.
 *
 * Fundamento normativo:
 * · Ley 51 de 1983 («Ley Emiliani»), art. 1 — traslada al lunes siguiente los
 *   festivos que no caen en lunes, con las excepciones del art. 2.
 * · Ley 51 de 1983, art. 2 — conservan su fecha: 1 de enero, 1 de mayo,
 *   20 de julio, 7 de agosto, 8 de diciembre y 25 de diciembre, además de
 *   Jueves y Viernes Santo.
 *
 * Todas las funciones trabajan sobre fechas civiles (año, mes, día) en hora
 * local y son deterministas: ninguna consulta el reloj del sistema.
 */

/** Fecha civil en formato ISO `AAAA-MM-DD`. */
export type FechaISO = string;

const MS_DIA = 86_400_000;

/* ── Conversión ───────────────────────────────────────────────────── */

export function aISO(f: Date): FechaISO {
  const a = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Convierte `AAAA-MM-DD` a una fecha local a medianoche. */
export function desdeISO(iso: FechaISO): Date {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) throw new RangeError(`Fecha ISO inválida: "${iso}"`);
  return new Date(a, m - 1, d);
}

export function esISO(valor: unknown): valor is FechaISO {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const f = new Date(valor + 'T00:00:00');
  return !Number.isNaN(f.getTime()) && aISO(f) === valor;
}

/* ── Aritmética básica ────────────────────────────────────────────── */

export function sumarDias(iso: FechaISO, dias: number): FechaISO {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

export function sumarMeses(iso: FechaISO, meses: number): FechaISO {
  const f = desdeISO(iso);
  const dia = f.getDate();
  f.setDate(1);
  f.setMonth(f.getMonth() + meses);
  // Si el mes destino es más corto, se ajusta al último día disponible.
  const ultimo = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
  f.setDate(Math.min(dia, ultimo));
  return aISO(f);
}

/** Días calendario entre dos fechas (`hasta` − `desde`). */
export function diasCalendario(desde: FechaISO, hasta: FechaISO): number {
  return Math.round((desdeISO(hasta).getTime() - desdeISO(desde).getTime()) / MS_DIA);
}

/**
 * Días de trabajo bajo el régimen laboral colombiano: el mes se cuenta de 30
 * días y el año de 360, con independencia de los días calendario reales
 * (CST, arts. 249 y 306, y doctrina reiterada del Ministerio del Trabajo).
 */
export function diasComerciales(desde: FechaISO, hasta: FechaISO): number {
  const a = desdeISO(desde);
  const b = desdeISO(hasta);
  const da = Math.min(a.getDate(), 30);
  const db = Math.min(b.getDate(), 30);
  return (b.getFullYear() - a.getFullYear()) * 360 + (b.getMonth() - a.getMonth()) * 30 + (db - da);
}

/* ── Pascua y festivos ────────────────────────────────────────────── */

/**
 * Domingo de Pascua por el algoritmo gregoriano anónimo
 * (Meeus / Jones / Butcher). Válido para todo el calendario gregoriano.
 */
export function domingoPascua(anio: number): FechaISO {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return aISO(new Date(anio, mes - 1, dia));
}

/** Traslada al lunes siguiente si la fecha no cae en lunes (Ley 51 de 1983). */
export function trasladarALunes(iso: FechaISO): FechaISO {
  const f = desdeISO(iso);
  const dia = f.getDay(); // 0 domingo … 6 sábado
  return dia === 1 ? iso : sumarDias(iso, (8 - dia) % 7);
}

const cacheFestivos = new Map<number, ReadonlyMap<FechaISO, string>>();

/** Festivos nacionales de Colombia de un año, con su nombre. */
export function festivosDe(anio: number): ReadonlyMap<FechaISO, string> {
  const enCache = cacheFestivos.get(anio);
  if (enCache) return enCache;

  const p = domingoPascua(anio);
  const fijo = (m: number, d: number) => aISO(new Date(anio, m - 1, d));

  const mapa = new Map<FechaISO, string>([
    // Conservan su fecha (Ley 51 de 1983, art. 2)
    [fijo(1, 1), 'Año Nuevo'],
    [fijo(5, 1), 'Día del Trabajo'],
    [fijo(7, 20), 'Independencia de Colombia'],
    [fijo(8, 7), 'Batalla de Boyacá'],
    [fijo(12, 8), 'Inmaculada Concepción'],
    [fijo(12, 25), 'Navidad'],
    [sumarDias(p, -3), 'Jueves Santo'],
    [sumarDias(p, -2), 'Viernes Santo'],

    // Se trasladan al lunes siguiente (Ley 51 de 1983, art. 1)
    [trasladarALunes(fijo(1, 6)), 'Reyes Magos'],
    [trasladarALunes(fijo(3, 19)), 'San José'],
    [trasladarALunes(fijo(6, 29)), 'San Pedro y San Pablo'],
    [trasladarALunes(fijo(8, 15)), 'Asunción de la Virgen'],
    [trasladarALunes(fijo(10, 12)), 'Día de la Raza'],
    [trasladarALunes(fijo(11, 1)), 'Todos los Santos'],
    [trasladarALunes(fijo(11, 11)), 'Independencia de Cartagena'],

    // Móviles ya trasladados al lunes
    [sumarDias(p, 43), 'Ascensión del Señor'],
    [sumarDias(p, 64), 'Corpus Christi'],
    [sumarDias(p, 71), 'Sagrado Corazón'],
  ]);

  cacheFestivos.set(anio, mapa);
  return mapa;
}

export function esFestivo(iso: FechaISO): boolean {
  return festivosDe(desdeISO(iso).getFullYear()).has(iso);
}

export function nombreFestivo(iso: FechaISO): string | null {
  return festivosDe(desdeISO(iso).getFullYear()).get(iso) ?? null;
}

export function esFinDeSemana(iso: FechaISO): boolean {
  const d = desdeISO(iso).getDay();
  return d === 0 || d === 6;
}

export function esDomingo(iso: FechaISO): boolean {
  return desdeISO(iso).getDay() === 0;
}

/** Día hábil: de lunes a viernes y que no sea festivo nacional. */
export function esHabil(iso: FechaISO): boolean {
  return !esFinDeSemana(iso) && !esFestivo(iso);
}

/* ── Plazos en días hábiles ───────────────────────────────────────── */

/**
 * Suma días hábiles. El día de partida no se cuenta, conforme a la regla
 * general de cómputo de términos del art. 118 del Código General del Proceso.
 * Con `dias` negativo cuenta hacia atrás.
 */
export function sumarHabiles(iso: FechaISO, dias: number): FechaISO {
  if (dias === 0) return iso;
  const paso = dias > 0 ? 1 : -1;
  let restantes = Math.abs(dias);
  let actual = iso;
  // Cota de seguridad: 40 días calendario por día hábil basta para cualquier
  // combinación de fines de semana y puentes.
  const tope = Math.abs(dias) * 40 + 40;
  let vueltas = 0;
  while (restantes > 0) {
    if (++vueltas > tope) throw new RangeError('No se pudo resolver el plazo en días hábiles.');
    actual = sumarDias(actual, paso);
    if (esHabil(actual)) restantes--;
  }
  return actual;
}

/** Días hábiles entre dos fechas, sin contar la de partida. */
export function habilesEntre(desde: FechaISO, hasta: FechaISO): number {
  if (desde === hasta) return 0;
  const haciaAdelante = desdeISO(hasta) > desdeISO(desde);
  const [a, b] = haciaAdelante ? [desde, hasta] : [hasta, desde];
  let cuenta = 0;
  let actual = a;
  while (actual !== b) {
    actual = sumarDias(actual, 1);
    if (esHabil(actual)) cuenta++;
  }
  return haciaAdelante ? cuenta : -cuenta;
}

/** Si la fecha no es hábil, devuelve el siguiente día hábil. */
export function siguienteHabil(iso: FechaISO): FechaISO {
  let actual = iso;
  while (!esHabil(actual)) actual = sumarDias(actual, 1);
  return actual;
}

/* ── Estado de un vencimiento ─────────────────────────────────────── */

export type EstadoPlazo = 'vencido' | 'critico' | 'proximo' | 'holgado';

/**
 * Clasifica un vencimiento respecto de una fecha de referencia.
 * · vencido  — la fecha ya pasó
 * · critico  — faltan 5 días hábiles o menos
 * · proximo  — faltan 15 días hábiles o menos
 * · holgado  — más de 15 días hábiles
 */
export function estadoPlazo(vencimiento: FechaISO, hoy: FechaISO): EstadoPlazo {
  const dias = habilesEntre(hoy, vencimiento);
  if (dias < 0) return 'vencido';
  if (dias <= 5) return 'critico';
  if (dias <= 15) return 'proximo';
  return 'holgado';
}
