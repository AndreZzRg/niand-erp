<div align="center">

<img src="public/favicon.svg" alt="NiAnd Labs" width="64" height="70" />

# 🏢 ERP Módulos Básicos

**Terceros, inventario, facturación, tesorería y contabilidad de partida doble**

Laboratorio 11 de la suite de cumplimiento operable de **NiAnd Labs S.A.S.**

[![CI](https://github.com/AndreZzRg/niand-erp/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreZzRg/niand-erp/actions/workflows/ci.yml)
[![Pages](https://github.com/AndreZzRg/niand-erp/actions/workflows/pages.yml/badge.svg)](https://github.com/AndreZzRg/niand-erp/actions/workflows/pages.yml)
[![CodeQL](https://github.com/AndreZzRg/niand-erp/actions/workflows/codeql.yml/badge.svg)](https://github.com/AndreZzRg/niand-erp/actions/workflows/codeql.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-4338CA)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.19-0E9F8E)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev)

### [▶ Abrir la aplicación](https://andrezzrg.github.io/niand-erp/)

</div>

---

> [!IMPORTANT]
> **Proyecto de laboratorio construido por NiAnd Labs para demostrar capacidad técnica.
> No corresponde a un cliente real.** Los resultados que produce son orientativos y no
> constituyen concepto jurídico profesional. Véase [`DESCARGO.md`](DESCARGO.md).

## Qué resuelve

ERP de alcance básico para pyme colombiana: maestro de terceros, catálogo de productos, inventario con costo promedio ponderado, facturación de venta con IVA y retenciones, cartera, tesorería y un motor contable de partida doble con plan único de cuentas y balance de prueba.


### Módulos

1. **Terceros**
2. **Productos e inventario**
3. **Facturación**
4. **Tesorería y cartera**
5. **Contabilidad**
6. **Informes**

---

## Puesta en marcha

Requiere **Node.js 20.19 o superior** (`.nvmrc` fija la 22) y npm 10+.

```bash
git clone https://github.com/AndreZzRg/niand-erp.git
cd niand-erp
npm install
npm run dev
```

La aplicación queda en <http://localhost:5173>.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verificación de tipos y construcción de producción en `dist/` |
| `npm run preview` | Sirve `dist/` como lo hará GitHub Pages |
| `npm test` | Pruebas unitarias |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run test:coverage` | Pruebas con reporte de cobertura y umbrales |
| `npm run lint` | Análisis estático |
| `npm run typecheck` | Verificación de tipos sin emitir |
| `npm run format` | Formateo del repositorio |
| `npm run verify` | Formato, lint, tipos y pruebas, en el orden de la CI |

---

## Despliegue en GitHub Pages

Este repositorio se publica solo. La configuración ya está hecha; usted solo activa Pages una vez.

<details>
<summary><strong>Publicar por primera vez (3 pasos)</strong></summary>

**1. Cree el repositorio y suba el código**

```bash
# Con GitHub CLI
gh repo create AndreZzRg/niand-erp --public --source=. --remote=origin --push

# O de forma manual, si ya creó el repositorio vacío en github.com
git remote add origin https://github.com/AndreZzRg/niand-erp.git
git branch -M main
git push -u origin main
```

**2. Active GitHub Pages**

En el repositorio: **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.

**3. Espere el flujo de trabajo**

La pestaña **Actions** mostrará *Desplegar en GitHub Pages*. Al terminar, el sitio queda en:

```
https://andrezzrg.github.io/niand-erp/
```

Cada `git push` a `main` vuelve a construir y publicar.

</details>

> La construcción usa `base: './'`, de modo que el mismo artefacto funciona en GitHub
> Pages, en un subdirectorio arbitrario de cualquier servidor y abierto desde el disco.

### Otras plataformas

| Plataforma | Cómo |
|---|---|
| **Netlify** | Comando `npm run build`, directorio de publicación `dist` |
| **Vercel** | Preajuste *Vite*, sin configuración adicional |
| **Cloudflare Pages** | Comando `npm run build`, salida `dist` |
| **Servidor propio** | Copie `dist/` a cualquier servidor de archivos estáticos |

---

## Pila tecnológica

| Herramienta | Para qué |
|---|---|
| **React 19** | Interfaz declarativa con el compilador y las APIs concurrentes vigentes. |
| **TypeScript 5.9** | Tipado estricto de extremo a extremo; `strict` y `noUncheckedIndexedAccess` activos. |
| **Vite 8** | Servidor de desarrollo instantáneo y construcción de producción con Rolldown. |
| **Tailwind CSS 4** | Sistema de diseño en CSS puro con `@theme`; los tokens de marca son utilidades. |
| **Zod 4** | Validación de esquemas en el límite de entrada y contratos de datos versionados. |
| **Zustand 5** | Estado de aplicación mínimo, con persistencia explícita en `localStorage`. |
| **date-fns 4** | Aritmética de fechas y cálculo de días hábiles sobre el calendario colombiano. |
| **Vitest 5** | Pruebas unitarias y de componente con cobertura V8 y umbrales exigidos en CI. |
| **Testing Library** | Pruebas de interfaz sobre el árbol accesible, no sobre detalles de implementación. |
| **ESLint 9** | Análisis estático con configuración plana y reglas de `typescript-eslint`. |
| **Prettier 3** | Formato único verificado en integración continua. |
| **GitHub Actions** | Integración continua en Node 20, 22 y 24, y despliegue automático. |
| **GitHub Pages** | Publicación estática desde `main`, sin servidor que administrar. |
| **CodeQL** | Análisis de seguridad del código en cada cambio y una vez por semana. |
| **Dependabot** | Actualización agrupada de dependencias de npm y de las acciones. |
| **lucide-react** | Iconografía vectorial coherente con la retícula de la marca. |

---

## Marco normativo

| **Decreto 2420 de 2015** | Marco técnico normativo de información financiera (NIIF para pymes). |
| **Decreto 2650 de 1993** | Plan Único de Cuentas para comerciantes. |
| **Estatuto Tributario** | IVA, retención en la fuente, ReteIVA y ReteICA. |
| **Resolución DIAN 000165 de 2023** | Sistema de facturación electrónica. |

Cada regla implementada declara la norma que la sustenta. El detalle, con artículo y
fecha de verificación, está en [`docs/MARCO-NORMATIVO.md`](docs/MARCO-NORMATIVO.md).

> **Última verificación normativa: 17 de septiembre de 2026.**
> Las normas cambian. Antes de usar un resultado en una decisión real, confirme la
> vigencia en la fuente oficial.

---

## Arquitectura en una pantalla

```
src/
├── domain/        Reglas de negocio. TypeScript puro y determinista.
│                  No importa React, ni el DOM, ni almacenamiento.
│                  Es lo que está cubierto por pruebas.
├── lib/           Utilidades transversales: formato, fechas hábiles,
│                  persistencia, exportación.
├── brand/         Sistema de diseño NiAnd Labs: Logo, Shell y piezas de UI.
├── features/      Un módulo de la aplicación por carpeta. Solo interfaz:
│                  lee del dominio, no decide reglas.
├── styles/        brand.css — tokens de marca y capa base.
├── App.tsx        Composición de módulos.
└── main.tsx       Punto de entrada.
```

**La regla que no se negocia:** el cálculo vive en `src/domain/` y no sabe que existe
una interfaz. Así se puede probar, auditar y reutilizar desde otro contexto sin tocar
una línea de React.

Detalle completo en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) y las decisiones
con su justificación en [`docs/DECISIONES.md`](docs/DECISIONES.md).

---

## Privacidad y datos

- La aplicación es **estática**: no hay servidor propio ni base de datos remota.
- Lo que usted captura se guarda en el `localStorage` de su navegador y **no sale de su equipo**.
- No hay analítica, ni rastreadores, ni cookies de terceros.
- Borrar los datos del sitio en el navegador elimina la información de forma definitiva.

Esto no releva a quien use la herramienta con datos personales reales de sus obligaciones
bajo la **Ley 1581 de 2012**. Véase [`SECURITY.md`](SECURITY.md).

---

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/GUIA-DE-USO.md`](docs/GUIA-DE-USO.md) | Recorrido funcional módulo por módulo |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Capas, dependencias y modelo de datos |
| [`docs/MARCO-NORMATIVO.md`](docs/MARCO-NORMATIVO.md) | Cada regla con su norma y fecha de verificación |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Registro de decisiones de arquitectura (ADR) |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Publicación, entornos y resolución de problemas |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Flujo de trabajo y umbrales de calidad |
| [`SECURITY.md`](SECURITY.md) | Reporte de vulnerabilidades y modelo de seguridad |
| [`CHANGELOG.md`](CHANGELOG.md) | Registro de cambios |
| [`DESCARGO.md`](DESCARGO.md) | Alcance y límites de la herramienta |

---

## Compromisos de calidad

Los mismos que NiAnd Labs publica y puede sustentar (NL-05 §2.4):

- Cobertura de pruebas **mínima del 80 % sobre el dominio crítico**, verificada en CI.
- **Quality Gate aprobado** en análisis estático como condición de despliegue.
- **Cero vulnerabilidades críticas y altas** al momento de la entrega.
- **Código y documentación entregados**, sin dependencia de la firma para operarlos.

---

## Licencia

[MIT](LICENSE) © 2026 Carlos Andrés Roncancio Guerrero — NiAnd Labs S.A.S.

## Autor

**AndreZzRg** · [andresrg1999@hotmail.com](mailto:andresrg1999@hotmail.com) · [github.com/AndreZzRg](https://github.com/AndreZzRg)

<div align="center">
<sub>Parte de la suite de cumplimiento operable de NiAnd Labs · Bogotá D.C., Colombia</sub>
</div>
