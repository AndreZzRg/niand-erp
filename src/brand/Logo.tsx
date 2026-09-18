/**
 * Identidad NiAnd Labs — ligadura N/A con asta diagonal y punto nodo.
 * Geometría tomada literalmente del manual de logotipo (NL-06); no se
 * reescala de forma no uniforme ni se recolorea fuera de paleta.
 */

type Props = {
  /** Alto del símbolo en píxeles. Mínimo admitido por el manual: 24. */
  alto?: number;
  /** Muestra el wordmark junto al símbolo. */
  wordmark?: boolean;
  className?: string;
};

export function Simbolo({ alto = 32, className }: { alto?: number; className?: string }) {
  const ancho = Math.round((alto * 120) / 132);
  return (
    <svg
      width={ancho}
      height={alto}
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label="NiAnd Labs"
    >
      <polygon points="20,98 38,98 100,32 82,32" fill="currentColor" />
      <rect x="20" y="32" width="18" height="66" fill="currentColor" />
      <rect x="82" y="32" width="18" height="66" fill="currentColor" />
      <circle cx="91" cy="16" r="10" className="fill-senal" />
    </svg>
  );
}

export function Logo({ alto = 30, wordmark = true, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo alto={alto} className="text-marca shrink-0" />
      {wordmark && (
        <span
          className="font-display font-bold tracking-tight leading-none"
          style={{ fontSize: alto * 0.72 }}
        >
          <span className="text-texto">Ni</span>
          <span className="text-marca">And</span>
          <span className="text-texto-3 font-medium"> Labs</span>
        </span>
      )}
    </span>
  );
}
