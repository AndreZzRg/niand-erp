# Guía de contribución — ERP Módulos Básicos

Gracias por su interés en mejorar este laboratorio de NiAnd Labs S.A.S..

## Principio rector

Este repositorio traduce obligaciones normativas colombianas a software. **Cualquier
cambio que altere un cálculo, un plazo o una regla de negocio debe venir acompañado
de la norma que lo sustenta**, con número, artículo y fecha de verificación, y debe
reflejarse en [`docs/MARCO-NORMATIVO.md`](docs/MARCO-NORMATIVO.md).

Un aporte sin sustento normativo verificable no se integra, por correcto que parezca.

## Flujo de trabajo

```bash
git clone https://github.com/AndreZzRg/niand-erp.git
cd niand-erp
npm install
npm run dev
```

1. Cree una rama desde `main`: `git switch -c feat/descripcion-corta`.
2. Trabaje con pruebas. El dominio (`src/domain/`) es código puro y debe tener prueba.
3. Ejecute `npm run verify` antes de abrir el pull request.
4. Abra el pull request usando la plantilla del repositorio.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verificación de tipos y construcción de producción |
| `npm run test` | Pruebas unitarias una sola vez |
| `npm run test:watch` | Pruebas en modo observación |
| `npm run test:coverage` | Pruebas con reporte de cobertura |
| `npm run lint` | Análisis estático |
| `npm run typecheck` | Verificación de tipos |
| `npm run format` | Formateo automático |
| `npm run verify` | Todo lo anterior, en el orden de la integración continua |

## Convención de mensajes de commit

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
feat(dominio): agrega el recargo dominical progresivo de 2027
fix(ui): corrige el contraste del estado de alerta en modo oscuro
docs(normativo): actualiza la verificación de la Circular 0048 de 2026
test(dominio): cubre el caso de jornada nocturna partida
chore(deps): actualiza vite a 8.3.0
```

Tipos admitidos: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`.

## Umbrales de calidad

La integración continua exige, sobre `src/domain/` y `src/lib/`:

- Cobertura de instrucciones y líneas: **80 %**
- Cobertura de ramas: **70 %**
- Cero errores de análisis estático y cero errores de tipos
- Formato verificado con Prettier

## Arquitectura

Antes de mover código, lea [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md). La regla
que no se negocia: **`src/domain/` no importa React, ni el DOM, ni almacenamiento**.
Es TypeScript puro y determinista.

## Contacto

AndreZzRg — <andresrg1999@hotmail.com>
