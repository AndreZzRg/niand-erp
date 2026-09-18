/**
 * Piezas de interfaz del sistema NiAnd Labs.
 * Todas respetan los tokens semánticos de `brand.css`: cambian de tema sin
 * recargar y conservan contraste AA en ambos modos.
 */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

/* ── Utilidad de clases ───────────────────────────────────────────── */
export function cx(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ');
}

/* ── Botón ────────────────────────────────────────────────────────── */
type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type TamanoBoton = 'sm' | 'md' | 'lg';

const BOTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium ' +
  'transition-[background-color,color,border-color,opacity] duration-200 ' +
  'disabled:opacity-45 disabled:cursor-not-allowed select-none';

const BOTON_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-marca text-marca-contraste hover:bg-indigo-hondo dark:hover:bg-indigo-suave',
  secundario: 'bg-superficie-2 text-texto border border-borde hover:border-borde-fuerte',
  fantasma: 'text-texto-2 hover:text-texto hover:bg-superficie-2',
  peligro: 'bg-alerta text-white hover:bg-alerta/90',
};

const BOTON_TAMANO: Record<TamanoBoton, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Boton({
  variante = 'primario',
  tamano = 'md',
  className,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
}) {
  return (
    <button
      type="button"
      className={cx(BOTON_BASE, BOTON_VARIANTE[variante], BOTON_TAMANO[tamano], className)}
      {...resto}
    />
  );
}

/* ── Tarjeta ──────────────────────────────────────────────────────── */
export function Tarjeta({
  children,
  className,
  titulo,
  descripcion,
  acciones,
}: {
  children?: ReactNode;
  className?: string;
  titulo?: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <section
      className={cx(
        'rounded-2xl border border-borde bg-superficie shadow-ni',
        titulo ? 'overflow-hidden' : 'p-5',
        className,
      )}
    >
      {titulo && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde bg-superficie-3 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold">{titulo}</h2>
            {descripcion && <p className="mt-1 text-sm text-texto-2">{descripcion}</p>}
          </div>
          {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
        </header>
      )}
      {titulo ? <div className="p-5">{children}</div> : children}
    </section>
  );
}

/* ── Campo de formulario ──────────────────────────────────────────── */
const CONTROL =
  'w-full rounded-xl border border-borde bg-superficie px-3 py-2 text-sm text-texto ' +
  'placeholder:text-texto-3 transition-colors hover:border-borde-fuerte ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
  requerido,
}: {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  children: (id: string) => ReactNode;
  requerido?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-texto">
        {etiqueta}
        {requerido && (
          <span className="ml-1 text-alerta" aria-hidden>
            *
          </span>
        )}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs font-medium text-alerta" role="alert">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-texto-3">{ayuda}</p>
      )}
    </div>
  );
}

export function Entrada({ className, ...resto }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, className)} {...resto} />;
}

export function Seleccion({ className, ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(CONTROL, 'cursor-pointer', className)} {...resto} />;
}

export function AreaTexto({ className, ...resto }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'min-h-24 resize-y', className)} {...resto} />;
}

/* ── Insignia y semáforo ──────────────────────────────────────────── */
export type Tono = 'neutro' | 'marca' | 'ok' | 'alerta' | 'riesgo' | 'info';

const TONO_INSIGNIA: Record<Tono, string> = {
  neutro: 'bg-superficie-2 text-texto-2 border-borde',
  marca: 'bg-indigo/12 text-marca border-indigo/25',
  ok: 'bg-senal/14 text-senal-hondo dark:text-senal-suave border-senal/30',
  alerta: 'bg-ambar-suave/18 text-ambar dark:text-ambar-suave border-ambar-suave/35',
  riesgo: 'bg-alerta/12 text-alerta dark:text-alerta-suave border-alerta/30',
  info: 'bg-destello/14 text-senal-hondo dark:text-destello border-destello/30',
};

export function Insignia({
  children,
  tono = 'neutro',
  className,
}: {
  children: ReactNode;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'font-mono text-[0.6875rem] font-medium tracking-wide uppercase whitespace-nowrap',
        TONO_INSIGNIA[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

const TONO_PUNTO: Record<Tono, string> = {
  neutro: 'bg-texto-3',
  marca: 'bg-marca',
  ok: 'bg-senal',
  alerta: 'bg-ambar-suave',
  riesgo: 'bg-alerta',
  info: 'bg-destello',
};

export function Semaforo({ tono, titulo }: { tono: Tono; titulo: string }) {
  return (
    <span
      className={cx('inline-block size-2.5 shrink-0 rounded-full', TONO_PUNTO[tono])}
      role="img"
      aria-label={titulo}
      title={titulo}
    />
  );
}

/* ── Llamado de atención ──────────────────────────────────────────── */
const TONO_LLAMADO: Record<Tono, string> = {
  neutro: 'border-borde bg-superficie-2',
  marca: 'border-indigo/30 bg-indigo/8',
  ok: 'border-senal/35 bg-senal/8',
  alerta: 'border-ambar-suave/40 bg-ambar-suave/10',
  riesgo: 'border-alerta/35 bg-alerta/8',
  info: 'border-destello/40 bg-destello/8',
};

export function Llamado({
  titulo,
  children,
  tono = 'neutro',
  icono,
  className,
}: {
  titulo?: ReactNode;
  children: ReactNode;
  tono?: Tono;
  icono?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('rounded-xl border p-4 text-sm', TONO_LLAMADO[tono], className)}>
      <div className="flex gap-3">
        {icono && <span className="mt-0.5 shrink-0">{icono}</span>}
        <div className="min-w-0 space-y-1">
          {titulo && <p className="font-semibold text-texto">{titulo}</p>}
          <div className="text-texto-2 [&_a]:text-marca [&_a]:underline">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Dato destacado ───────────────────────────────────────────────── */
export function Dato({
  rotulo,
  valor,
  detalle,
  tono = 'neutro',
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  detalle?: ReactNode;
  tono?: Tono;
}) {
  const acento: Record<Tono, string> = {
    neutro: 'text-texto',
    marca: 'text-marca',
    ok: 'text-senal-hondo dark:text-senal-suave',
    alerta: 'text-ambar dark:text-ambar-suave',
    riesgo: 'text-alerta dark:text-alerta-suave',
    info: 'text-senal-hondo dark:text-destello',
  };
  return (
    <div className="rounded-xl border border-borde bg-superficie-3 px-4 py-3">
      <p className="eyebrow">{rotulo}</p>
      <p className={cx('cifra mt-1 font-display text-xl font-semibold', acento[tono])}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-texto-3">{detalle}</p>}
    </div>
  );
}

/* ── Tabla ────────────────────────────────────────────────────────── */
export function Tabla({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={cx('w-full min-w-[34rem] border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  numerico,
}: {
  children?: ReactNode;
  className?: string;
  numerico?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cx(
        'border-b border-borde bg-superficie-2 px-3 py-2 font-display text-xs font-semibold',
        numerico ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  numerico,
}: {
  children?: ReactNode;
  className?: string;
  numerico?: boolean;
}) {
  return (
    <td
      className={cx(
        'border-b border-borde px-3 py-2 align-top',
        numerico && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  );
}

/* ── Estado vacío ─────────────────────────────────────────────────── */
export function Vacio({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-borde-fuerte px-6 py-12 text-center">
      <p className="font-display font-semibold text-texto">{titulo}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-texto-2">{children}</p>}
      {accion && <div className="mt-4 flex justify-center">{accion}</div>}
    </div>
  );
}

/* ── Interruptor ──────────────────────────────────────────────────── */
export function Interruptor({
  activo,
  onChange,
  etiqueta,
}: {
  activo: boolean;
  onChange: (v: boolean) => void;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onChange(!activo)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        activo ? 'bg-marca' : 'bg-borde-fuerte',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
          activo ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
