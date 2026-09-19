/**
 * Armazón de aplicación NiAnd Labs: encabezado con identidad y selector de
 * tema, navegación por módulos, contenido y pie con el descargo obligatorio
 * exigido por NL-05 §7.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun, TriangleAlert } from 'lucide-react';
import { Logo } from './Logo';
import { cx } from './ui';

export const MODULOS = [
  { id: 'terceros', rotulo: 'Terceros' },
  { id: 'productos-e-inventario', rotulo: 'Productos e inventario' },
  { id: 'facturacion', rotulo: 'Facturación' },
  { id: 'tesoreria-y-cartera', rotulo: 'Tesorería y cartera' },
  { id: 'contabilidad', rotulo: 'Contabilidad' },
  { id: 'informes', rotulo: 'Informes' },
] as const;

export type ModuloId = (typeof MODULOS)[number]['id'];

const CLAVE_TEMA = 'niand:tema';

function leerTema(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useTema() {
  const [tema, setTema] = useState<'light' | 'dark'>(leerTema);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* Navegación privada o almacenamiento bloqueado: el tema no persiste. */
    }
  }, [tema]);

  return { tema, alternar: () => setTema((t) => (t === 'dark' ? 'light' : 'dark')) };
}

export function Shell({
  moduloActivo,
  onModulo,
  children,
}: {
  moduloActivo: ModuloId;
  onModulo: (id: ModuloId) => void;
  children: ReactNode;
}) {
  const { tema, alternar } = useTema();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      <header className="no-imprimir sticky top-0 z-30 border-b border-borde bg-superficie/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <a
            href="https://github.com/AndreZzRg/niand-erp"
            className="shrink-0"
            aria-label="Repositorio de ERP Módulos Básicos"
          >
            <Logo alto={28} />
          </a>

          <span className="hidden h-6 w-px bg-borde sm:block" aria-hidden />

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold">
              <span aria-hidden>🏢 </span>ERP Módulos Básicos
            </p>
            <p className="eyebrow truncate">Laboratorio · No es un cliente real</p>
          </div>

          <button
            type="button"
            onClick={alternar}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-borde text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto"
            aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {tema === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        <nav aria-label="Módulos" className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {MODULOS.map((m) => {
              const activo = m.id === moduloActivo;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onModulo(m.id)}
                    aria-current={activo ? 'page' : undefined}
                    className={cx(
                      'border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                      activo
                        ? 'border-marca text-marca'
                        : 'border-transparent text-texto-3 hover:border-borde-fuerte hover:text-texto',
                    )}
                  >
                    {m.rotulo}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="no-imprimir mt-8 border-t border-borde bg-superficie">
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl border border-ambar-suave/40 bg-ambar-suave/10 p-4 text-sm">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-ambar dark:text-ambar-suave" />
            <p className="text-texto-2">
              <strong className="text-texto">Los resultados son orientativos</strong> y no
              constituyen concepto jurídico profesional. Este es un proyecto de laboratorio
              construido por NiAnd&nbsp;Labs para demostrar capacidad técnica; no corresponde a un
              cliente real. Verifique la vigencia de cada norma antes de tomar una decisión.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-texto-3">
            <p>
              © 2026 NiAnd Labs S.A.S. · Licencia MIT · Construido por{' '}
              <a
                href="https://github.com/AndreZzRg"
                className="font-medium text-marca hover:underline"
              >
                AndreZzRg
              </a>
            </p>
            <p className="font-mono">
              <a
                href="https://github.com/AndreZzRg/niand-erp"
                className="hover:text-marca hover:underline"
              >
                niand-erp
              </a>{' '}
              · v1.0.0 · Los datos no salen de su navegador
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
