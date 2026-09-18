# Política de seguridad — ERP Módulos Básicos

## Versiones con soporte

| Versión | Soporte |
|---|---|
| 1.x | ✅ |

## Cómo reportar una vulnerabilidad

Escriba a **<andresrg1999@hotmail.com>** con el asunto `[SEGURIDAD] niand-erp-basico`.

Incluya: descripción, pasos de reproducción, impacto estimado y versión afectada.
Se acusa recibo en un plazo de **72 horas hábiles** y se informa el plan de
corrección en **10 días hábiles**.

Por favor **no abra una incidencia pública** para vulnerabilidades explotables.

## Modelo de seguridad de esta aplicación

Esta aplicación es **estática y se ejecuta por completo en el navegador**:

- No hay servidor propio, ni base de datos remota, ni sesión de usuario.
- Los datos que usted captura se guardan en el `localStorage` de su navegador y
  **no salen de su equipo**. Borrar los datos del sitio los elimina de forma definitiva.
- No se incorporan servicios de analítica, rastreadores ni cookies de terceros.
- Las dependencias se vigilan con Dependabot y el código con CodeQL, en ejecución
  semanal y en cada pull request.

## Implicación en protección de datos

Que el tratamiento ocurra en el navegador del usuario no elimina las obligaciones de
la **Ley 1581 de 2012** para quien use la herramienta con datos personales reales: la
finalidad, la autorización del titular y las medidas de seguridad siguen siendo
responsabilidad del responsable del tratamiento. Véase `docs/MARCO-NORMATIVO.md`.

## Manejo de secretos

Ningún token, credencial ni clave se versiona en este repositorio. Los valores de
configuración sensibles se leen de variables de entorno declaradas en `.env.example`
y nunca se escriben en el código fuente.
