/**
 * Módulo «Terceros»: maestro de clientes y proveedores. El dígito de
 * verificación se calcula con el algoritmo de la DIAN mientras se escribe,
 * de modo que un NIT mal digitado se detecta antes de guardarlo.
 */
import { useMemo, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';

import {
  Boton,
  Campo,
  Entrada,
  Insignia,
  Interruptor,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { digitoVerificacion, nitFormateado, normalizarNIT } from '../domain/nit';
import { exportarCSV } from '../lib/exportar';
import { nuevoId, useEstado, type TipoTercero, type Tercero } from '../store';
import { BarraConfiguracion } from './Configuracion';

const TIPOS: ReadonlyArray<{ id: TipoTercero; rotulo: string }> = [
  { id: 'cliente', rotulo: 'Cliente' },
  { id: 'proveedor', rotulo: 'Proveedor' },
  { id: 'ambos', rotulo: 'Cliente y proveedor' },
];

const EN_BLANCO = {
  nit: '',
  nombre: '',
  tipo: 'cliente' as TipoTercero,
  municipio: '',
  correo: '',
  telefono: '',
  declarante: true,
  responsableIVA: true,
};

export function PanelTerceros() {
  const { terceros, agregarTercero, borrarTercero, editarTercero } = useEstado();
  const [borrador, setBorrador] = useState(EN_BLANCO);
  const [filtro, setFiltro] = useState('');

  const dv = useMemo(() => digitoVerificacion(borrador.nit), [borrador.nit]);
  const nitLimpio = normalizarNIT(borrador.nit);
  const duplicado = terceros.some((t) => t.nit === nitLimpio);

  const errorNIT =
    borrador.nit === ''
      ? null
      : dv === null
        ? 'El NIT debe tener entre uno y quince dígitos.'
        : duplicado
          ? 'Ya existe un tercero con este NIT.'
          : null;

  const puedeGuardar =
    nitLimpio !== '' && borrador.nombre.trim() !== '' && dv !== null && !duplicado;

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return terceros;
    return terceros.filter(
      (t) => t.nombre.toLowerCase().includes(q) || t.nit.includes(normalizarNIT(q)),
    );
  }, [terceros, filtro]);

  function guardar() {
    if (!puedeGuardar || dv === null) return;
    const t: Tercero = {
      id: nuevoId('ter'),
      nit: nitLimpio,
      dv,
      nombre: borrador.nombre.trim(),
      tipo: borrador.tipo,
      municipio: borrador.municipio.trim(),
      correo: borrador.correo.trim(),
      telefono: borrador.telefono.trim(),
      declarante: borrador.declarante,
      responsableIVA: borrador.responsableIVA,
    };
    agregarTercero(t);
    setBorrador(EN_BLANCO);
  }

  function exportar() {
    exportarCSV(
      [
        [
          'NIT',
          'DV',
          'Nombre',
          'Tipo',
          'Municipio',
          'Correo',
          'Teléfono',
          'Declarante',
          'Resp. IVA',
        ],
        ...terceros.map((t) => [
          t.nit,
          t.dv,
          t.nombre,
          t.tipo,
          t.municipio,
          t.correo,
          t.telefono,
          t.declarante ? 'Sí' : 'No',
          t.responsableIVA ? 'Sí' : 'No',
        ]),
      ],
      'terceros',
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <Tarjeta
        titulo="Nuevo tercero"
        descripcion="El dígito de verificación se calcula con el algoritmo de la DIAN."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            etiqueta="NIT o documento"
            requerido
            error={errorNIT}
            ayuda={dv !== null ? `Dígito de verificación: ${dv}` : 'Solo dígitos.'}
          >
            {(id) => (
              <Entrada
                id={id}
                inputMode="numeric"
                placeholder="901234567"
                value={borrador.nit}
                onChange={(e) => setBorrador({ ...borrador, nit: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Nombre o razón social" requerido>
            {(id) => (
              <Entrada
                id={id}
                value={borrador.nombre}
                onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Relación">
            {(id) => (
              <Seleccion
                id={id}
                value={borrador.tipo}
                onChange={(e) => setBorrador({ ...borrador, tipo: e.target.value as TipoTercero })}
              >
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.rotulo}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Municipio" ayuda="Determina la tarifa de ICA.">
            {(id) => (
              <Entrada
                id={id}
                value={borrador.municipio}
                onChange={(e) => setBorrador({ ...borrador, municipio: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Correo">
            {(id) => (
              <Entrada
                id={id}
                type="email"
                value={borrador.correo}
                onChange={(e) => setBorrador({ ...borrador, correo: e.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Teléfono">
            {(id) => (
              <Entrada
                id={id}
                value={borrador.telefono}
                onChange={(e) => setBorrador({ ...borrador, telefono: e.target.value })}
              />
            )}
          </Campo>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Interruptor
              activo={borrador.declarante}
              onChange={(v) => setBorrador({ ...borrador, declarante: v })}
              etiqueta="Declarante de renta"
            />
            Declarante de renta
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Interruptor
              activo={borrador.responsableIVA}
              onChange={(v) => setBorrador({ ...borrador, responsableIVA: v })}
              etiqueta="Responsable de IVA"
            />
            Responsable de IVA
          </label>

          <Boton className="ml-auto" onClick={guardar} disabled={!puedeGuardar}>
            <UserPlus size={16} /> Agregar tercero
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo={`Maestro de terceros (${terceros.length})`}
        descripcion="Clientes y proveedores registrados."
        acciones={
          terceros.length > 0 && (
            <Boton variante="secundario" tamano="sm" onClick={exportar}>
              Exportar CSV
            </Boton>
          )
        }
      >
        {terceros.length === 0 ? (
          <Vacio titulo="Todavía no hay terceros">
            Registre un cliente o un proveedor para poder facturar. También puede cargar el conjunto
            de ejemplo desde la barra superior.
          </Vacio>
        ) : (
          <>
            <div className="mb-4 max-w-xs">
              <Campo etiqueta="Buscar">
                {(id) => (
                  <Entrada
                    id={id}
                    type="search"
                    placeholder="Nombre o NIT"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  />
                )}
              </Campo>
            </div>

            <Tabla>
              <thead>
                <tr>
                  <Th>NIT</Th>
                  <Th>Nombre</Th>
                  <Th>Relación</Th>
                  <Th>Municipio</Th>
                  <Th>Condición</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {visibles.map((t) => (
                  <tr key={t.id}>
                    <Td className="font-mono text-xs">{nitFormateado(t.nit, t.dv)}</Td>
                    <Td>
                      <span className="font-medium">{t.nombre}</span>
                      {t.correo && <span className="block text-xs text-texto-3">{t.correo}</span>}
                    </Td>
                    <Td>
                      <Insignia tono={t.tipo === 'proveedor' ? 'info' : 'marca'}>
                        {TIPOS.find((x) => x.id === t.tipo)?.rotulo ?? t.tipo}
                      </Insignia>
                    </Td>
                    <Td>{t.municipio || '—'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Insignia tono={t.declarante ? 'ok' : 'neutro'}>
                          {t.declarante ? 'Declarante' : 'No declarante'}
                        </Insignia>
                        {t.responsableIVA && <Insignia tono="ok">Resp. IVA</Insignia>}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <Interruptor
                          activo={t.declarante}
                          onChange={(v) => editarTercero(t.id, { declarante: v })}
                          etiqueta={`Marcar a ${t.nombre} como declarante de renta`}
                        />
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          aria-label={`Eliminar a ${t.nombre}`}
                          onClick={() => borrarTercero(t.id)}
                        >
                          <Trash2 size={14} />
                        </Boton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>

            {visibles.length === 0 && (
              <p className="mt-4 text-center text-sm text-texto-3">
                Ningún tercero coincide con «{filtro}».
              </p>
            )}
          </>
        )}
      </Tarjeta>
    </div>
  );
}
