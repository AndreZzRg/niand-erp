# Registro de decisiones de arquitectura — ERP Módulos Básicos

Cada decisión con consecuencia estructural queda aquí, con su contexto y su costo.
Formato: [ADR de Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

---

## ADR-001 · Aplicación estática, sin servidor

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** La herramienta trata información laboral y, en varios módulos, datos
personales de trabajadores. Un servidor propio implicaría responsabilidad de custodia
bajo la Ley 1581 de 2012, costo de operación e infraestructura que parchear.

**Decisión.** Toda la aplicación corre en el navegador. La persistencia es
`localStorage`. No hay cuenta de usuario ni backend.

**Consecuencias.**
- ✅ Los datos no salen del equipo del usuario.
- ✅ Publicación en GitHub Pages con costo cero y sin superficie de ataque de servidor.
- ✅ El artefacto es reproducible y auditable por cualquiera.
- ❌ No hay colaboración entre usuarios ni respaldo automático.
- ❌ Borrar los datos del sitio elimina la información sin recuperación.
- ➡️ Se mitiga con exportación e importación explícitas de los datos.

---

## ADR-002 · Dominio puro y aislado

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** Las reglas provienen de normas. Cuando una norma cambia hay que localizar
la regla, cambiarla y demostrar que lo demás sigue igual. Si el cálculo está enredado con
la interfaz, eso es una sesión de depuración en lugar de un cambio dirigido.

**Decisión.** `src/domain/` es TypeScript puro: sin React, sin DOM, sin almacenamiento y
sin `new Date()` implícito. La fecha de cálculo siempre entra como parámetro.

**Consecuencias.**
- ✅ Cada regla se prueba de forma aislada y determinista.
- ✅ El dominio se reutiliza desde Node, desde una API o desde otra interfaz.
- ✅ La cobertura exigida en CI se concentra donde importa.
- ❌ Más ceremonia: hay que pasar la fecha y la configuración explícitamente.

---

## ADR-003 · Zod en el límite, tipos adentro

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** Los datos entran desde formularios, desde `localStorage` y desde archivos
importados. Ninguna de esas fuentes es confiable: el usuario puede editar el
almacenamiento a mano y un archivo puede venir de una versión anterior.

**Decisión.** Se valida con Zod en los tres puntos de entrada. Hacia adentro, los tipos
de TypeScript bastan.

**Consecuencias.**
- ✅ Un dato corrupto se detecta donde entra, no tres capas después.
- ✅ Los esquemas documentan la forma real de los datos persistidos.
- ❌ Hay que mantener el esquema y el tipo sincronizados (se deriva con `z.infer`).

---

## ADR-004 · Tailwind CSS 4 con tokens de marca en `@theme`

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** La paleta y la tipografía las fija el manual de marca NL-06. Si el diseño
vive en clases sueltas, la marca se desvía repositorio a repositorio.

**Decisión.** Los tokens de NL-05 §3 se declaran en `@theme` y los tokens semánticos en
`@theme inline` sobre variables CSS, de modo que el cambio de tema es instantáneo.
El modo oscuro se conduce por atributo, no por media query, para que el selector del
encabezado mande sobre la preferencia del sistema.

**Consecuencias.**
- ✅ `text-marca`, `bg-superficie` o `border-borde` significan lo mismo en los 12 repositorios.
- ✅ Cambiar la paleta es editar un bloque, no rastrear literales de color.
- ❌ Depende de la sintaxis CSS-first de Tailwind 4, distinta de la v3.

---

## ADR-005 · Base relativa en la construcción

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** GitHub Pages sirve el proyecto bajo `/niand-erp/`. Fijar esa ruta en la
construcción ata el artefacto a un único destino.

**Decisión.** `base: './'`.

**Consecuencias.**
- ✅ El mismo `dist/` sirve en Pages, en Netlify, en un subdirectorio o desde el disco.
- ✅ Las vistas previas de pull request no necesitan configuración distinta.
- ❌ Obliga a navegación por estado en lugar de rutas del historial; para el alcance de
  esta herramienta es una simplificación, no una pérdida.

---

## ADR-006 · Sin dependencias de interfaz pesadas

**Fecha:** 17 de septiembre de 2026 · **Estado:** aceptada

**Contexto.** Una biblioteca de componentes resuelve rápido y después condiciona el
diseño, el tamaño del paquete y la superficie de actualizaciones.

**Decisión.** Las piezas de interfaz se escriben en `src/brand/ui.tsx` sobre Tailwind.
Las únicas dependencias de presentación son `react`, `react-dom` y `lucide-react`.

**Consecuencias.**
- ✅ Paquete pequeño y control total de accesibilidad y contraste.
- ✅ Menos superficie para Dependabot y para CodeQL.
- ❌ Hay que implementar a mano cada patrón que se necesite.

