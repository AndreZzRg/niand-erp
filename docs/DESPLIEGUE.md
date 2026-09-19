# Despliegue — ERP Módulos Básicos

## 1. GitHub Pages (recomendado)

El repositorio incluye `.github/workflows/pages.yml`. Con Pages activado, cada `push` a
`main` construye y publica de forma automática.

### Primera publicación

```bash
# Opción A — con GitHub CLI
gh repo create AndreZzRg/niand-erp --public --source=. --remote=origin --push

# Opción B — repositorio vacío ya creado en github.com
git remote add origin https://github.com/AndreZzRg/niand-erp.git
git branch -M main
git push -u origin main
```

Luego, una sola vez:

**Settings → Pages → Build and deployment → Source: _GitHub Actions_**

El sitio queda en:

```
https://andrezzrg.github.io/niand-erp/
```

### Qué hace el flujo de trabajo

| Paso | Detalle |
|---|---|
| `actions/checkout@v5` | Descarga el código |
| `actions/setup-node@v5` | Node 22 con caché de npm |
| `npm ci` | Instalación reproducible desde `package-lock.json` |
| `npx vite build` | Construcción de producción en `dist/` |
| `cp dist/index.html dist/404.html` | Recarga correcta en rutas profundas |
| `actions/upload-pages-artifact@v4` | Empaqueta `dist/` |
| `actions/deploy-pages@v4` | Publica en el entorno `github-pages` |

Los permisos son los mínimos: `contents: read`, `pages: write`, `id-token: write`.

## 2. Otras plataformas

| Plataforma | Comando | Directorio |
|---|---|---|
| Netlify | `npm run build` | `dist` |
| Vercel | preajuste *Vite* | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |
| Servidor propio | `npm run build` | copie `dist/` |

Como la base es relativa, no hay que configurar nada más.

### Contenedor

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 3. Dominio propio

1. Agregue el archivo `public/CNAME` con su dominio, por ejemplo `erp-modulos-basicos.niandlabs.co`.
2. En su proveedor de DNS, cree un `CNAME` que apunte a `andrezzrg.github.io`.
3. En **Settings → Pages**, escriba el dominio y active **Enforce HTTPS**.

## 4. Variables de entorno

Copie `.env.example` a `.env`. Vite solo expone al navegador las variables con prefijo
`VITE_`, y **todo lo que se expone al navegador es público**.

Esta aplicación no requiere ninguna variable de entorno para funcionar.

## 5. Verificación previa

```bash
npm run verify     # formato, lint, tipos y pruebas
npm run build      # construcción de producción
npm run preview    # sirve dist/ igual que Pages
```

## 6. Resolución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Página en blanco tras desplegar | Base incorrecta | Confirme `base: './'` en `vite.config.ts` |
| 404 al recargar | Falta `404.html` | El flujo ya lo copia; revise la traza del despliegue |
| El flujo falla en `npm ci` | `package-lock.json` desincronizado | `npm install` y confirme el lockfile |
| El despliegue no arranca | Pages sin origen *GitHub Actions* | Settings → Pages → Source |
| Estilos sin aplicar | Caché del navegador | Recarga forzada (⌘⇧R / Ctrl+F5) |
| Tipos fallan en CI y no en local | Versión distinta de Node | Use la versión de `.nvmrc` |

## 7. Publicar una versión

```bash
npm version minor          # actualiza package.json y crea la etiqueta
git push --follow-tags
gh release create v1.1.0 --generate-notes
```

Actualice [`CHANGELOG.md`](../CHANGELOG.md) en el mismo cambio.
