/**
 * Dígito de verificación del NIT.
 *
 * Algoritmo publicado por la DIAN: a cada dígito del NIT, leído de derecha a
 * izquierda, se le asigna un factor primo de la serie oficial; la suma de los
 * productos se divide entre once y el residuo determina el dígito. Cuando el
 * residuo es 0 o 1 el dígito es el propio residuo; en los demás casos es
 * once menos el residuo.
 */

/** Serie de factores de la DIAN, de derecha a izquierda. */
const FACTORES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

/** Deja solo los dígitos: el usuario suele escribir puntos y guiones. */
export function normalizarNIT(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Dígito de verificación de un NIT. Devuelve `null` si el número no tiene
 * entre uno y quince dígitos, que es el rango que admite la serie.
 */
export function digitoVerificacion(nit: string): string | null {
  const limpio = normalizarNIT(nit);
  if (limpio.length === 0 || limpio.length > FACTORES.length) return null;

  let suma = 0;
  for (let i = 0; i < limpio.length; i++) {
    // El dígito más a la derecha toma el primer factor de la serie.
    const digito = Number(limpio.charAt(limpio.length - 1 - i));
    suma += digito * (FACTORES[i] ?? 0);
  }

  const residuo = suma % 11;
  return String(residuo <= 1 ? residuo : 11 - residuo);
}

/** `true` si el dígito indicado corresponde al NIT. */
export function dvCorrecto(nit: string, dv: string): boolean {
  const esperado = digitoVerificacion(nit);
  return esperado !== null && esperado === dv.trim();
}

/** «901.234.567-8», que es como se escribe en una factura. */
export function nitFormateado(nit: string, dv?: string): string {
  const limpio = normalizarNIT(nit);
  if (!limpio) return '';
  const conPuntos = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const digito = dv ?? digitoVerificacion(limpio);
  return digito === null ? conPuntos : `${conPuntos}-${digito}`;
}
