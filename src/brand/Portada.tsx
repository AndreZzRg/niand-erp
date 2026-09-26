/**
 * Portada de módulos: el punto de entrada de la aplicación.
 *
 * Antes se caía directamente dentro del primer módulo, sin ver nunca el
 * sistema completo. La portada muestra de qué se compone la herramienta y,
 * cuando el módulo aporta una cifra, en qué estado está: se entra sabiendo
 * dónde hay trabajo, no eligiendo a ciegas.
 *
 * Dos disposiciones, porque sirven a momentos distintos: la rejilla para
 * reconocer y explorar, la lista para quien ya sabe adónde va y quiere
 * densidad. La preferencia se recuerda.
 *
 * El vocabulario gráfico sale del símbolo del manual —asta vertical,
 * diagonal ascendente y punto nodo—; no se inventa un estilo aparte.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, LayoutGrid, List, type LucideIcon } from 'lucide-react';

import { Pista, cx } from './ui';

export interface ModuloPortada {
  readonly id: string;
  readonly rotulo: string;
  readonly descripcion: string;
  readonly icono: LucideIcon;
}

/** Cifra que un módulo expone en la portada, si tiene una que valga la pena. */
export interface MetricaModulo {
  readonly valor: ReactNode;
  readonly detalle?: string;
  /** Tiñe la cifra cuando el estado lo amerita. */
  readonly tono?: 'neutro' | 'ok' | 'alerta' | 'riesgo';
}

type Disposicion = 'rejilla' | 'lista';
const CLAVE_DISPOSICION = 'niand:portada';

const TONO_CIFRA: Record<NonNullable<MetricaModulo['tono']>, string> = {
  neutro: 'text-texto',
  ok: 'text-senal-hondo dark:text-senal-suave',
  alerta: 'text-ambar dark:text-ambar-suave',
  riesgo: 'text-alerta dark:text-alerta-suave',
};

function useDisposicion() {
  const [disposicion, setDisposicion] = useState<Disposicion>(() => {
    try {
      return localStorage.getItem(CLAVE_DISPOSICION) === 'lista' ? 'lista' : 'rejilla';
    } catch {
      return 'rejilla';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_DISPOSICION, disposicion);
    } catch {
      /* Sin almacenamiento la preferencia dura lo que la sesión. */
    }
  }, [disposicion]);

  return { disposicion, setDisposicion };
}

export function Portada({
  titulo,
  descripcion,
  modulos,
  metricas,
  onAbrir,
  pie,
}: {
  titulo: string;
  descripcion: string;
  modulos: readonly ModuloPortada[];
  metricas?: Readonly<Record<string, MetricaModulo | undefined>>;
  onAbrir: (id: string) => void;
  /** Contenido opcional bajo la rejilla: avisos, estado global. */
  pie?: ReactNode;
}) {
  const { disposicion, setDisposicion } = useDisposicion();

  return (
    <div className="space-y-6">
      {/* Cabecera de la portada, sobre retícula de plano */}
      <section className="reticula diagonal overflow-hidden rounded-2xl border border-borde bg-superficie px-5 py-6 shadow-ni-1 sm:px-7 sm:py-8">
        <p className="eyebrow nodo">Suite de cumplimiento operable</p>
        <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{titulo}</h2>
        <p className="mt-2 max-w-2xl text-sm text-texto-2 sm:text-base">{descripcion}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.6875rem] tracking-wide text-texto-3 uppercase">
            {modulos.length} módulos
          </span>

          <span className="h-4 w-px bg-borde" aria-hidden />

          {/* Selector de disposición */}
          <div
            role="group"
            aria-label="Disposición de los módulos"
            className="inline-flex overflow-hidden rounded-lg border border-borde"
          >
            <Pista texto="Ver los módulos como tarjetas" lado="abajo">
              <button
                type="button"
                onClick={() => setDisposicion('rejilla')}
                aria-pressed={disposicion === 'rejilla'}
                className={cx(
                  'grid size-8 place-items-center transition-colors',
                  disposicion === 'rejilla'
                    ? 'bg-marca text-marca-contraste'
                    : 'text-texto-2 hover:bg-superficie-2 hover:text-texto',
                )}
              >
                <LayoutGrid size={15} />
                <span className="sr-only">Rejilla</span>
              </button>
            </Pista>

            <Pista texto="Ver los módulos como lista compacta" lado="abajo">
              <button
                type="button"
                onClick={() => setDisposicion('lista')}
                aria-pressed={disposicion === 'lista'}
                className={cx(
                  'grid size-8 place-items-center border-l border-borde transition-colors',
                  disposicion === 'lista'
                    ? 'bg-marca text-marca-contraste'
                    : 'text-texto-2 hover:bg-superficie-2 hover:text-texto',
                )}
              >
                <List size={15} />
                <span className="sr-only">Lista</span>
              </button>
            </Pista>
          </div>
        </div>
      </section>

      {/* Módulos */}
      {disposicion === 'rejilla' ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modulos.map((m) => {
            const Icono = m.icono;
            const metrica = metricas?.[m.id];
            return (
              <li key={m.id}>
                <Pista texto={`Abrir ${m.rotulo}: ${m.descripcion}`} className="h-full w-full">
                  <button
                    type="button"
                    onClick={() => onAbrir(m.id)}
                    className={cx(
                      'diagonal group h-full w-full rounded-2xl border border-borde bg-superficie p-5 text-left',
                      'shadow-ni-1 transition-[box-shadow,border-color,translate] duration-200',
                      'hover:-translate-y-0.5 hover:border-marca/40 hover:shadow-ni-2',
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-tenue text-marca transition-colors group-hover:bg-marca group-hover:text-marca-contraste">
                        <Icono size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-semibold">
                          {m.rotulo}
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-texto-2">
                          {m.descripcion}
                        </span>
                      </span>
                      <ArrowRight
                        size={16}
                        className="mt-1 shrink-0 text-texto-3 transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:text-marca"
                      />
                    </span>

                    {metrica && (
                      <span className="mt-4 flex items-baseline gap-2 border-t border-borde pt-3">
                        <span
                          className={cx(
                            'cifra font-display text-xl font-semibold',
                            TONO_CIFRA[metrica.tono ?? 'neutro'],
                          )}
                        >
                          {metrica.valor}
                        </span>
                        {metrica.detalle && (
                          <span className="text-xs text-texto-3">{metrica.detalle}</span>
                        )}
                      </span>
                    )}
                  </button>
                </Pista>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-borde bg-superficie shadow-ni-1">
          {modulos.map((m, i) => {
            const Icono = m.icono;
            const metrica = metricas?.[m.id];
            return (
              <li key={m.id} className={cx(i > 0 && 'border-t border-borde')}>
                <Pista
                  texto={`Abrir ${m.rotulo}: ${m.descripcion}`}
                  lado="abajo"
                  className="w-full"
                >
                  <button
                    type="button"
                    onClick={() => onAbrir(m.id)}
                    className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-superficie-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-marca-tenue text-marca transition-colors group-hover:bg-marca group-hover:text-marca-contraste">
                      <Icono size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{m.rotulo}</span>
                      <span className="block truncate text-xs text-texto-3">{m.descripcion}</span>
                    </span>

                    {metrica && (
                      <span className="hidden shrink-0 text-right sm:block">
                        <span
                          className={cx(
                            'cifra block font-display font-semibold',
                            TONO_CIFRA[metrica.tono ?? 'neutro'],
                          )}
                        >
                          {metrica.valor}
                        </span>
                        {metrica.detalle && (
                          <span className="block text-xs text-texto-3">{metrica.detalle}</span>
                        )}
                      </span>
                    )}

                    <ArrowRight
                      size={16}
                      className="shrink-0 text-texto-3 transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:text-marca"
                    />
                  </button>
                </Pista>
              </li>
            );
          })}
        </ul>
      )}

      {pie}
    </div>
  );
}
