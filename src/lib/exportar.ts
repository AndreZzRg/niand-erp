/**
 * Descarga de artefactos desde el navegador: JSON, CSV, texto e iCalendar.
 * No hay servidor; el archivo se construye en memoria y se entrega con un
 * enlace temporal que se revoca de inmediato.
 */

const NOMBRE_BASE = 'niand-erp-basico';

function descargar(contenido: BlobPart, nombre: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Se revoca en el siguiente ciclo para no cancelar la descarga en curso.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Sello `AAAAMMDD-HHmm` para nombrar archivos sin colisiones. */
export function sello(ahora: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${ahora.getFullYear()}${p(ahora.getMonth() + 1)}${p(ahora.getDate())}` +
    `-${p(ahora.getHours())}${p(ahora.getMinutes())}`
  );
}

export function exportarJSON(datos: unknown, sufijo = 'datos'): void {
  descargar(
    JSON.stringify(datos, null, 2),
    `${NOMBRE_BASE}-${sufijo}-${sello()}.json`,
    'application/json;charset=utf-8',
  );
}

export function exportarTexto(texto: string, sufijo: string, extension = 'md'): void {
  descargar(
    texto,
    `${NOMBRE_BASE}-${sufijo}-${sello()}.${extension}`,
    'text/plain;charset=utf-8',
  );
}

/** Escapa un campo para CSV según RFC 4180. */
export function campoCSV(valor: unknown): string {
  const s = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV con separador `;` y BOM UTF-8: es lo que Excel en español abre bien
 * sin pasar por el asistente de importación.
 */
export function exportarCSV(filas: ReadonlyArray<ReadonlyArray<unknown>>, sufijo = 'tabla'): void {
  const cuerpo = filas.map((f) => f.map(campoCSV).join(';')).join('\r\n');
  descargar(
    '\uFEFF' + cuerpo,
    `${NOMBRE_BASE}-${sufijo}-${sello()}.csv`,
    'text/csv;charset=utf-8',
  );
}

/** Lee un archivo elegido por el usuario y lo entrega como texto. */
export function leerArchivo(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result ?? ''));
    lector.onerror = () => rechazar(new Error(`No se pudo leer "${archivo.name}".`));
    lector.readAsText(archivo, 'utf-8');
  });
}

/** Abre la ventana de impresión del navegador (salida a PDF). */
export function imprimir(): void {
  window.print();
}
