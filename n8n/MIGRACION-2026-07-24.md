# Migración de n8n — notas de la sesión 2026-07-24

Contexto: se canceló n8n Cloud, se empezó a autoalojar en Docker en la sobremesa
local (Windows, Cloudflare Tunnel para el webhook de Telegram). El usuario decidió
a mitad de sesión mover el destino final a un VPS de Oracle Cloud (Always Free)
en vez de quedarse en la sobremesa. Este documento es lo aprendido para no
repetir la investigación desde cero.

## Credenciales necesarias (se reintroducen a mano, no viajan en el export)

| Servicio | Dónde sacarlas | Nota |
|---|---|---|
| Telegram | `@BotFather` → `/mybots` → `@secforge_alerts_bot` → API Token | Bot: `@secforge_alerts_bot`, grupo `-1004318171372` ("SecForge Alerts") |
| Supabase | Supabase → proyecto → Settings → API | **Host = `https://aarzgpypqqeptwophtbe.supabase.co`** (NO la URL del dashboard, ese fue el primer error de esta sesión). Secret Key = la `service_role` de la pestaña "Legacy anon, service_role API keys" |
| Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier |
| GitHub | GitHub → Settings → Developer settings → Fine-grained tokens | Scope solo a `secforge-git/breachfolio`, permiso Contents: Read and write |
| Email (SMTP) | Cuenta Gmail a decidir (`secforgeweb@gmail.com` o personal) + contraseña de aplicación en myaccount.google.com/apppasswords | Nodos: "Email de candidatos", "Enviar email resumen" — quedó pendiente de configurar del todo |
| RSS | — | Sin credencial, feeds públicos |

## Las 6 Data Tables — hay que recrearlas en la instancia nueva

Cada instancia nueva de n8n genera IDs de tabla distintos — tras crearlas, hay
que reapuntar el `dataTableId` de cada nodo del workflow (ver script más abajo).

| Nombre | Columnas | Notas |
|---|---|---|
| `config` | `key` (string), `value` (string) | Filas iniciales: `frecuencia_noticias_dias`, `ultima_ejecucion_noticias`, `frecuencia_guias_dias`, `ultima_ejecucion_guias` (valores string, fecha antigua tipo `2026-01-01` para que el primer cron se dispare) |
| `guias_cola` | `status` (string), `in_scope` (string `"true"/"false"`), `relevancia` (number) | Puede faltarle alguna columna de contenido (tema/título) no verificada — añadir sobre la marcha si sale error de columna. **Se llena a mano, ningún nodo inserta filas nuevas aquí.** |
| `guias_pendientes` | `draft_json` (string), `status` (string), `created_at` (string) | |
| `recap_pool_telegram` | `candidates` (string/JSON), `sent_at` (string ISO), `selected` (string/JSON), `resolved` (boolean) | |
| `recap_seleccion_telegram` | `pool_id` (string), `idx` (number) | Una fila por pulsación de botón |
| `pool_imagenes` | `filename` (string), `uses` (number), `last_used_at` (string), **`scope` (string)**, **`keywords` (string)** | **OJO: `scope` y `keywords` se descubrieron tarde en esta sesión — la tabla se había creado sin ellas y por eso la publicación de noticias se quedaba muda sin error** (el nodo `Elegir imagenes noticias (Code)` filtra `scope !== 'guide'` y usa `keywords` para puntuar qué imagen encaja con cada artículo). Sin esto, "Leer pool imagenes noticias" devuelve 0 filas y todo lo posterior no hace nada, SIN marcar error — parece que "no pasa nada" en vez de fallar. |

### Seed de `pool_imagenes`

Las imágenes reales están en `assets/img/`, nombradas `NNN-<scope>-descripcion-con-guiones.webp`
(`scope` = `general`/`guide`/`news`, 001-100, 8 general + 47 guide + 45 news).
Derivar `keywords` de la propia descripción del nombre de archivo (quitar número
y scope, separar por guiones). `scope` para el filtro de noticias: cualquier
valor que NO sea literalmente `"guide"` cuenta como disponible para noticias
(revisar `Elegir imagenes noticias (Code)` en el JSON del workflow para la
lógica exacta; el nodo equivalente de guías es `Elegir imagen guia (Code)`,
sin verificar del todo esta sesión — revisar su filtro antes de asumir simetría).

**Pendiente de esta sesión**: no se llegó a insertar el seed completo de
`pool_imagenes` antes de cambiar de plan a Oracle. Hacerlo antes de dar por
buena la publicación de noticias/guías con imagen.

## Cómo reapuntar los nodos del workflow a las tablas nuevas (por API, no a mano)

Hacerlo a mano son 26 nodos. Patrón que funcionó bien esta sesión, vía API REST
de n8n (`X-N8N-API-KEY`, header en Settings → n8n API → Create an API key):

1. `POST /api/v1/data-tables` con `{"name":"...", "columns":[{"name":"...","type":"string|number|boolean"}]}` — crea cada tabla, devuelve su `id` nuevo.
2. `POST /api/v1/data-tables/:id/rows` con `{"data":[{...fila...}, ...]}` — para las filas de seed (`config`, `pool_imagenes`).
3. `GET /api/v1/workflows/:id` → guardar el JSON completo a un archivo (backup).
4. Con un script Node, recorrer `nodes[]`, buscar `parameters.dataTableId.value` que coincida con los IDs viejos (del `n8n/breachfolio-contenido.workflow.json` original: `rgqKS8JyWgvTcqeQ`=config, `8Yoo0wq0A3ZUAiWb`=guias_cola, `bJHxjoSKbiMgO82u`=guias_pendientes, `ZwtNVnaIbuiwf9Kf`=recap_pool_telegram, `8D2nNgvLp6jm9QA8`=recap_seleccion_telegram, `kr2f86q89dWzfyFz`=pool_imagenes) y sustituir por los IDs nuevos.
5. `PUT /api/v1/workflows/:id` con `{"name":..., "nodes":..., "connections":..., "settings":{}}` — **importante: `settings` tiene que ir vacío `{}`, cualquier propiedad dentro (`executionOrder`, `binaryMode`, etc.) devuelve `400 must NOT have additional properties`** en esta versión de la API pública. No mandar campos de solo lectura (`id`, `active`, `createdAt`, `versionId`...), el endpoint los rechaza.
6. **Verificar siempre después**: recontar nodos, comparar credenciales nodo a nodo antes/después (`node.credentials`), confirmar que ningún `dataTableId` se quedó con ID viejo. Un `PUT` mal formado puede sustituir el workflow entero por uno vacío sin avisar mucho — probado en esta sesión, recuperado desde backup sin pérdida real.

## Otros hallazgos de esta sesión

- **"Publish" en vez de "Active"**: esta versión de n8n usa un botón "Publish" con una "Production Checklist" (Enable MCP access, Set up error notifications, Track time saved) que bloquea publicar hasta marcarla — usar el enlace **"Ignore for all workflows"** del propio popup, ninguno de esos ítems es necesario para este workflow.
- **Nodos de email** ("Email de candidatos", "Enviar email resumen") necesitan credencial SMTP — quedó a medio configurar, decidir cuenta remitente antes de darlos por buenos.
- **Mensajes antiguos en el grupo de Telegram** (de la época de n8n Cloud) tienen referencias (`rowId`/`pool_id`) a filas que ya no existen en las tablas nuevas — pulsar sus botones no hace nada, no es un fallo del montaje nuevo. Probar siempre con mensajes generados por ejecuciones frescas del workflow ya migrado.
- **Un mensaje `[WattFigures]` apareció en el mismo grupo** — proyecto ajeno a Breachfolio que en su día compartió bot/grupo (conflicto ya documentado y resuelto en su momento). Por la regla de alcance del repo (`CLAUDE.md`), no se investiga ni se toca nada de WattFigures desde aquí.
