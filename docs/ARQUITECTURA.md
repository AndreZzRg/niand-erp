# Arquitectura — ERP Módulos Básicos

> Documento vivo. Si cambia la estructura, este archivo cambia en el mismo pull request.

## 1. Decisión de fondo: aplicación estática de una sola página

La aplicación **se ejecuta por completo en el navegador**. No hay servidor propio, ni
base de datos remota, ni sesión de usuario.

Esto no es una limitación: es la decisión que hace posible el resto.

| Consecuencia | Por qué importa |
|---|---|
| Los datos no salen del equipo del usuario | Reduce de raíz la superficie de riesgo bajo la **Ley 1581 de 2012** |
| Se publica en GitHub Pages sin infraestructura | Costo de operación cero; no hay servidor que parchear |
| El artefacto es auditable y reproducible | Cualquiera puede construirlo y comparar el resultado |
| No hay superficie de ataque de servidor | El modelo de seguridad se reduce al navegador y a las dependencias |

El precio: no hay colaboración entre usuarios ni respaldo automático. Se asume de forma
consciente y está documentado en [`DECISIONES.md`](DECISIONES.md), ADR-001.

## 2. Capas

```
┌──────────────────────────────────────────────────────────┐
│  features/       Interfaz por módulo. React. Sin reglas.  │
│       │          Lee y compone; nunca decide.             │
│       ▼                                                   │
├──────────────────────────────────────────────────────────┤
│  brand/          Sistema de diseño. Presentación pura.    │
├──────────────────────────────────────────────────────────┤
│  lib/            Utilidades transversales: formato,       │
│       │          fechas hábiles, persistencia, export.    │
│       ▼                                                   │
├──────────────────────────────────────────────────────────┤
│  domain/         Reglas de negocio. TypeScript puro.      │
│                  Determinista. Sin React, sin DOM,        │
│                  sin almacenamiento, sin fecha del        │
│                  sistema implícita.                       │
└──────────────────────────────────────────────────────────┘
        Las dependencias apuntan hacia abajo. Nunca al revés.
```

### `src/domain/` — el corazón

Todo cálculo, validación de regla y transición de estado vive aquí.

**Restricciones de la capa:**

1. No importa `react`, ni nada de `src/brand/` o `src/features/`.
2. No lee `localStorage`, ni `window`, ni `document`.
3. No llama a `new Date()` sin que la fecha entre como parámetro: una función que
   depende del reloj del sistema no se puede probar.
4. Toda función exportada es **pura**: mismos argumentos, mismo resultado.
5. Tiene prueba. La CI exige 80 % de instrucciones y 70 % de ramas sobre esta carpeta.

Que el dominio sea puro es lo que permite responder «¿por qué salió esta cifra?» con un
archivo de pruebas en vez de con una sesión de depuración.

### `src/lib/`

Utilidades sin reglas de negocio: formato de moneda y fecha en configuración regional
`es-CO`, aritmética de días hábiles con el calendario de festivos de Colombia,
persistencia tipada en `localStorage` y exportación de archivos.

### `src/brand/`

`Logo.tsx` (geometría del manual NL-06), `Shell.tsx` (armazón, navegación y tema) y
`ui.tsx` (botón, tarjeta, campo, insignia, semáforo, llamado, tabla, estado vacío).
Estas piezas no conocen el dominio de la aplicación.

### `src/features/`

Una carpeta por módulo: `terceros`, `productos-e-inventario`, `facturacion`, `tesoreria-y-cartera`, `contabilidad`, `informes`.
Cada una expone un componente y consume el dominio. Si una función de `features/`
empieza a calcular, ese cálculo está en la capa equivocada.

## 3. Estado y persistencia

El estado de aplicación se maneja con **Zustand 5** y se persiste de forma explícita en
`localStorage` bajo claves con prefijo `niand-erp-basico:`.

```ts
// Toda escritura pasa por un esquema Zod antes de tocar el almacenamiento.
const resultado = Esquema.safeParse(datosCrudos);
if (!resultado.success) { /* se descarta y se registra */ }
```

**Versionado:** cada estructura persistida lleva un campo `version`. Al leer, si la
versión no coincide, se aplica una migración o se descarta el registro. Nunca se confía
en la forma de un dato leído del almacenamiento: el usuario pudo editarlo a mano, o
puede venir de una versión anterior de la aplicación.

## 4. Validación

**Zod 4** en el límite de entrada, en tres puntos:

1. Formularios, antes de construir una entidad del dominio.
2. Lectura de `localStorage`.
3. Importación de archivos JSON.

Dentro del dominio, los tipos de TypeScript bastan: si un dato llegó ahí, ya se validó.

## 5. Accesibilidad

- Contraste **AA** verificado en modo claro y oscuro (requisito de NL-05 §7).
- Navegación completa por teclado, con enlace de salto al contenido.
- Foco visible y uniforme, definido en la capa base de `brand.css`.
- Regiones `role="alert"` para los errores de formulario.
- Se respeta `prefers-reduced-motion`.

## 6. Pruebas

| Tipo | Herramienta | Alcance |
|---|---|---|
| Unitarias de dominio | Vitest | Cada regla de negocio, con sus casos borde |
| De componente | Vitest + Testing Library | Flujos de interfaz sobre el árbol accesible |
| Estáticas | TypeScript + ESLint | Tipos y reglas de código |
| Seguridad | CodeQL | Consultas `security-and-quality` |

Las pruebas de dominio son tablas de casos: entrada, salida esperada y la **norma o el
artículo** que justifica ese resultado. Una prueba sin sustento normativo documentado es
una prueba que nadie sabrá mantener.

## 7. Construcción

`Vite 8` con `base: './'`. La salida en `dist/` es un conjunto de archivos estáticos con
rutas relativas: funciona en GitHub Pages, en un subdirectorio cualquiera y abierta desde
el sistema de archivos. No hay variables de entorno necesarias para que la aplicación
arranque.
