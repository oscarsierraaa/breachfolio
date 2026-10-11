# Copia de seguridad del workflow de n8n

> Creada el 2026-07-20, al agotarse la instancia de prueba de n8n Cloud.
> El flujo vivía **solo** dentro de esa instancia; esto es el rescate.

## Qué hay aquí

`breachfolio-contenido.workflow.json` — export completo del workflow
**«Breachfolio · Contenido (noticias + guías)»** (`yoUXqoUhRxOnYr1s`):
**169 nodos, 139 conexiones**, tomado con la instancia todavía activa.

Qué hacía, según su propia descripción en n8n:

> Noticias: RSS → dedupe en Supabase → Gemini (free tier) → aprobación por
> Telegram. Guías: en construcción. Ya no usa Anthropic (sustituido 2026-07-12).

## Importante al reimportarlo

n8n **redacta las credenciales al exportar**, así que este fichero **no contiene
ninguna clave** — por eso se puede commitear sin riesgo. La contrapartida es que
al importarlo hay que **volver a asignar a mano las credenciales** en los nodos
(Telegram, Supabase, Gemini, RSS...).

Referencias de este proyecto, para no mezclarlas con las de WattFigures:

| | Breachfolio |
|---|---|
| Bot de Telegram | `@secforge_alerts_bot` (`AlxvZcELjIdbrArs`) |
| Grupo | «SecForge Alerts» `-1004318171372` |
| Supabase | `VgRn3xBneYNXOsWC` |
| Prefijo de callbacks | `guiaidea:` / `recap_` |

## Cómo restaurarlo

1. Levantar n8n (autoalojado con Docker, o un plan de pago en n8n Cloud).
2. **Import from File** → este JSON.
3. Reasignar las credenciales en cada nodo que las pida.
4. Revisar los triggers de cron antes de activarlo, para que no publique de golpe.

Las opciones de migración (autoalojado / nube de pago / reconstruirlo como
GitHub Actions) están analizadas con más detalle en el repo de WattFigures:
`wattfigures/n8n/MIGRACION.md`.
