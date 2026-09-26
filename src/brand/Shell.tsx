/**
 * Armazón de aplicación NiAnd Labs.
 *
 * La navegación es un riel de módulos, no una fila de pestañas: un ERP se
 * recorre por áreas de trabajo, y una pestaña sugiere vistas de un mismo
 * documento. El riel además admite el nombre completo del módulo sin
 * recortarlo y deja sitio para crecer.
 *
 * La aplicación abre en la portada, no dentro de un módulo: quien llega ve
 * primero de qué se compone la herramienta y dónde hay trabajo pendiente.
 *
 * En pantallas estrechas el riel se convierte en un cajón que se abre
 * sobre el contenido; por debajo de `lg` nunca ocupa ancho fijo.
 *
 * El pie conserva el descargo obligatorio que exige NL-05 §7.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Building2,
  ChartColumn,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { Pista, cx } from './ui';

export const MODULOS = [
  {
    id: 'terceros',
    rotulo: 'Terceros',
    descripcion: 'Maestro de clientes y proveedores, con dígito de verificación del NIT.',
    icono: Users,
  },
  {
    id: 'productos-e-inventario',
    rotulo: 'Productos e inventario',
    descripcion: 'Catálogo, movimientos y kardex al costo promedio ponderado.',
    icono: Package,
  },
  {
    id: 'facturacion',
    rotulo: 'Facturación',
    descripcion: 'Facturas de venta y compra con IVA, retenciones y su comprobante.',
    icono: FileText,
  },
  {
    id: 'tesoreria-y-cartera',
    rotulo: 'Tesorería y cartera',
    descripcion: 'Efectivo, cuentas por cobrar y por pagar con su antigüedad.',
    icono: Wallet,
  },
  {
    id: 'contabilidad',
    rotulo: 'Contabilidad',
    descripcion: 'Libro diario, balance de prueba y asiento de cierre en partida doble.',
    icono: BookOpen,
  },
  {
    id: 'informes',
    rotulo: 'Informes',
    descripcion: 'Estados financieros y resumen de impuestos del periodo.',
    icono: ChartColumn,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  rotulo: string;
  descripcion: string;
  icono: LucideIcon;
}>;

export type ModuloId = (typeof MODULOS)[number]['id'];

/** Lo que el armazón puede estar mostrando: la portada o un módulo. */
export type Vista = 'portada' | ModuloId;

/** Identidad de la aplicación, para el riel y la portada. */
export const APP = {
  nombre: 'ERP Módulos Básicos',
  resumen:
    'Terceros, inventario, facturación, tesorería y contabilidad de partida doble, sobre el Plan Único de Cuentas del Decreto 2650 de 1993.',
  icono: Building2,
  repositorio: 'https://github.com/AndreZzRg/niand-erp',
  version: 'v1.0.0',
} as const;

const CLAVE_TEMA = 'niand:tema';
const CLAVE_RIEL = 'niand:riel';

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

/** Preferencia de riel colapsado, recordada entre visitas. */
function useRielColapsado() {
  const [colapsado, setColapsado] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_RIEL) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_RIEL, colapsado ? '1' : '0');
    } catch {
      /* Sin almacenamiento la preferencia dura lo que la sesión. */
    }
  }, [colapsado]);

  return { colapsado, alternar: () => setColapsado((v) => !v) };
}

/* ── Riel de módulos ──────────────────────────────────────────────── */

function Riel({
  vista,
  onVista,
  colapsado,
  onColapsar,
  onNavegar,
}: {
  vista: Vista;
  onVista: (v: Vista) => void;
  colapsado: boolean;
  onColapsar: () => void;
  onNavegar?: () => void;
}) {
  const { tema, alternar } = useTema();

  const ir = (v: Vista) => {
    onVista(v);
    onNavegar?.();
  };

  return (
    <div className="flex h-full flex-col bg-riel">
      {/* Identidad */}
      <div
        className={cx(
          'flex items-center gap-3 border-b border-riel-borde px-4 py-4',
          colapsado && 'lg:justify-center lg:px-2',
        )}
      >
        <Pista texto="Abrir el repositorio en GitHub" lado="abajo">
          <a
            href={APP.repositorio}
            aria-label={`Repositorio de ${APP.nombre}`}
            className="shrink-0 rounded-lg"
          >
            <Logo alto={26} wordmark={!colapsado} />
          </a>
        </Pista>
      </div>

      {/* Nombre de la aplicación */}
      <div
        className={cx(
          'flex items-center gap-2.5 px-4 pt-4 pb-3',
          colapsado && 'lg:justify-center lg:px-2',
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-marca-tenue text-marca">
          <APP.icono size={17} />
        </span>
        {!colapsado && (
          <span className="min-w-0">
            <Pista texto={APP.resumen}>
              <span className="block truncate font-display text-sm font-semibold">
                {APP.nombre}
              </span>
            </Pista>
            <span className="eyebrow block truncate">Laboratorio</span>
          </span>
        )}
      </div>

      {/* Navegación */}
      <nav aria-label="Módulos" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <ul className="mb-3 space-y-0.5">
          <li>
            <Pista texto="Portada: todos los módulos y su estado" lado="abajo">
              <button
                type="button"
                onClick={() => ir('portada')}
                aria-current={vista === 'portada' ? 'page' : undefined}
                className={cx('modulo w-full text-left', colapsado && 'lg:justify-center')}
              >
                <LayoutDashboard size={17} className="shrink-0" />
                {!colapsado && <span className="truncate">Portada</span>}
              </button>
            </Pista>
          </li>
        </ul>

        {!colapsado && <p className="eyebrow nodo mb-2 px-1">Módulos</p>}
        <ul className="space-y-0.5">
          {MODULOS.map((m) => {
            const activo = m.id === vista;
            const Icono = m.icono;
            return (
              <li key={m.id}>
                <Pista texto={`${m.rotulo} · ${m.descripcion}`} lado="abajo">
                  <button
                    type="button"
                    onClick={() => ir(m.id)}
                    aria-current={activo ? 'page' : undefined}
                    className={cx('modulo w-full text-left', colapsado && 'lg:justify-center')}
                  >
                    <Icono size={17} className="shrink-0" />
                    {!colapsado && <span className="truncate">{m.rotulo}</span>}
                  </button>
                </Pista>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Acciones del pie del riel */}
      <div
        className={cx(
          'flex items-center gap-2 border-t border-riel-borde px-4 py-3',
          colapsado && 'lg:flex-col lg:px-2',
        )}
      >
        <Pista texto={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
          <button
            type="button"
            onClick={alternar}
            aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-borde text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto"
          >
            {tema === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </Pista>

        <Pista texto={colapsado ? 'Expandir el menú' : 'Colapsar el menú a solo íconos'}>
          <button
            type="button"
            onClick={onColapsar}
            aria-label={colapsado ? 'Expandir el menú de módulos' : 'Colapsar el menú de módulos'}
            className="hidden size-9 shrink-0 place-items-center rounded-lg border border-borde text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto lg:grid"
          >
            {colapsado ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </Pista>

        {!colapsado && (
          <Pista texto="Versión publicada de este laboratorio">
            <span className="ml-auto truncate font-mono text-[0.6875rem] text-texto-3">
              {APP.version}
            </span>
          </Pista>
        )}
      </div>
    </div>
  );
}

/* ── Armazón ──────────────────────────────────────────────────────── */

export function Shell({
  vista,
  onVista,
  children,
}: {
  vista: Vista;
  onVista: (v: Vista) => void;
  children: ReactNode;
}) {
  const { colapsado, alternar: alternarRiel } = useRielColapsado();
  const [cajonAbierto, setCajonAbierto] = useState(false);

  const modulo = MODULOS.find((m) => m.id === vista);
  const IconoCabecera = modulo?.icono ?? APP.icono;
  const tituloCabecera = modulo?.rotulo ?? APP.nombre;
  const descripcionCabecera = modulo?.descripcion ?? APP.resumen;

  // El cajón se cierra con Escape: es lo que espera quien navega con teclado.
  useEffect(() => {
    if (!cajonAbierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCajonAbierto(false);
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [cajonAbierto]);

  return (
    <div className="flex min-h-dvh">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      {/* Riel fijo en escritorio */}
      <aside
        className={cx(
          'no-imprimir sticky top-0 hidden h-dvh shrink-0 border-r border-riel-borde lg:block',
          'transition-[width] duration-200',
        )}
        style={{ width: colapsado ? 'var(--ancho-riel-min)' : 'var(--ancho-riel)' }}
      >
        <Riel vista={vista} onVista={onVista} colapsado={colapsado} onColapsar={alternarRiel} />
      </aside>

      {/* Cajón en pantallas estrechas */}
      {cajonAbierto && (
        <div className="no-imprimir fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar el menú de módulos"
            onClick={() => setCajonAbierto(false)}
            className="absolute inset-0 bg-tinta/50"
          />
          <div className="absolute inset-y-0 left-0 w-[17rem] border-r border-riel-borde shadow-ni-3">
            <Riel
              vista={vista}
              onVista={onVista}
              colapsado={false}
              onColapsar={alternarRiel}
              onNavegar={() => setCajonAbierto(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado */}
        <header className="no-imprimir sticky top-0 z-30 border-b border-borde bg-lienzo/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Pista texto="Abrir el menú de módulos" lado="abajo">
              <button
                type="button"
                onClick={() => setCajonAbierto(true)}
                aria-label="Abrir el menú de módulos"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-borde text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto lg:hidden"
              >
                <Menu size={17} />
              </button>
            </Pista>

            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marca-tenue text-marca">
              <IconoCabecera size={19} />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold">{tituloCabecera}</h1>
              <p className="truncate text-sm text-texto-2">{descripcionCabecera}</p>
            </div>

            <Pista
              texto="Proyecto de laboratorio: los resultados son orientativos y no constituyen concepto jurídico profesional."
              lado="abajo"
            >
              <span className="hidden shrink-0 items-center gap-2 rounded-full border border-ambar-suave/40 bg-ambar-suave/10 px-3 py-1 font-mono text-[0.6875rem] tracking-wide text-ambar uppercase sm:inline-flex dark:text-ambar-suave">
                <TriangleAlert size={12} />
                Laboratorio
              </span>
            </Pista>
          </div>
        </header>

        <main
          id="contenido"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>

        <footer className="no-imprimir mt-8 border-t border-borde bg-superficie">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-start gap-3 rounded-xl border border-ambar-suave/40 bg-ambar-suave/10 p-4 text-sm">
              <TriangleAlert
                size={18}
                className="mt-0.5 shrink-0 text-ambar dark:text-ambar-suave"
              />
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
                <a href={APP.repositorio} className="hover:text-marca hover:underline">
                  niand-erp
                </a>{' '}
                · {APP.version} · Los datos no salen de su navegador
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
