# Registro de cambios

Todos los cambios relevantes de **ERP Módulos Básicos** se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Corregido

- **Node 20 no podía ejecutar la suite de pruebas.** La matriz de CI incluía
  Node 20, pero `jsdom 30` depende de `undici` y este de
  `worker_threads.markAsUncloneable`, disponible solo desde Node 22.10. En
  Node 20 ningún archivo de pruebas llegaba a arrancar y el paso «Pruebas con
  cobertura» fallaba. Se retira Node 20 de la matriz y se sube el mínimo
  declarado en `engines` a `>=22.10.0`, que es la versión que el entorno de
  pruebas exige de verdad; `.nvmrc` ya fijaba la 22.
- **La integración continua fallaba en todos sus pasos.** `package-lock.json` no
  estaba versionado, de modo que `npm ci` —primer paso de los flujos de CI, Pages
  y CodeQL— fallaba antes de ejecutar nada.
- **Faltaba la capa de aplicación.** `src/main.tsx` importaba `./App`, que no
  existía, junto con todo `src/domain/` y `src/features/`: la verificación de
  tipos y la construcción de producción fallaban.
- **Cobertura por debajo del umbral.** `src/lib/almacen.ts` y `src/lib/exportar.ts`
  no tenían pruebas y quedaban en 0 %, lo que arrastraba el total por debajo de los
  umbrales que aplica `npm run test:coverage` y hacía fallar ese paso aunque
  `vitest run` a secas pasara.
- **Nombre del repositorio.** La documentación, las insignias, `package.json`, el
  prefijo de almacenamiento local y el enlace de GitHub Pages apuntaban a
  `niand-erp-basico`, que no existe, en lugar de `niand-erp`.

### Agregado

- Cobertura de pruebas de `src/lib`: validación por esquema y versión del
  almacenamiento, y escape CSV conforme al RFC 4180 en la exportación.

---

## [1.0.0] — 2026-09-17

Primera versión pública del laboratorio.

### Agregado

- Módulo **Terceros**.
- Módulo **Productos e inventario**.
- Módulo **Facturación**.
- Módulo **Tesorería y cartera**.
- Módulo **Contabilidad**.
- Módulo **Informes**.
- Documentación completa en `docs/`: arquitectura, marco normativo, despliegue,
  guía de uso, decisiones de arquitectura y descargo de responsabilidad.
- Integración continua en tres versiones de Node (20, 22 y 24) con formato, análisis
  estático, verificación de tipos, pruebas con cobertura y construcción de producción.
- Despliegue automático en GitHub Pages desde `main`.
- Análisis de seguridad con CodeQL y actualización de dependencias con Dependabot.
- Sistema de diseño NiAnd Labs con modo claro y oscuro y contraste AA.

### Normativo

- Reglas derivadas de **Decreto 2420 de 2015**: Marco técnico normativo de información financiera (NIIF para pymes).
- Reglas derivadas de **Decreto 2650 de 1993**: Plan Único de Cuentas para comerciantes.
- Reglas derivadas de **Estatuto Tributario**: IVA, retención en la fuente, ReteIVA y ReteICA.
- Reglas derivadas de **Resolución DIAN 000165 de 2023**: Sistema de facturación electrónica.

> Verificación normativa: 17 de septiembre de 2026.

[No publicado]: https://github.com/AndreZzRg/niand-erp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndreZzRg/niand-erp/releases/tag/v1.0.0
