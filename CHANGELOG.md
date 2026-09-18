# Registro de cambios

Todos los cambios relevantes de **ERP Módulos Básicos** se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado sigue [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Por hacer

- Ampliación de la cobertura de pruebas del dominio por encima del 90 %.

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

[No publicado]: https://github.com/AndreZzRg/niand-erp-basico/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndreZzRg/niand-erp-basico/releases/tag/v1.0.0
