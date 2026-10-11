# Breachfolio — Contexto de la automatización n8n (Recap semanal)

Documento de traspaso: léelo entero antes de tocar el workflow en un chat
nuevo. Antes de cambiar nada, usa las herramientas MCP de n8n
(`get_workflow_details` sobre el workflow de abajo) para confirmar que el
estado real sigue siendo el descrito aquí — este documento es una foto fija.

El propio workflow lleva **11 notas numeradas (00 → 10)** en el lienzo, con
código de color: 🟢 mapa general, 🔵 bloque automático que funciona,
🟣 interacción humana (Telegram), 🔴 pendiente o bloqueado. La nota **00** es
la leyenda y la **10** resume lo que falta. Si las notas y este documento se
contradicen, gana lo que diga `get_workflow_details`.

## Workflow

- **Nombre:** `Recap Semanal`
- **ID:** `yoUXqoUhRxOnYr1s`
- **URL:** https://breachfolio.app.n8n.cloud/workflow/yoUXqoUhRxOnYr1s
- **Estado:** publicado y activo, corre cada lunes 08:00 (Cron).
- **Nodos:** 72 (61 funcionales + 11 notas).

### Qué hace hoy en producción, de punta a punta

1. **(bloque 01)** Lee 12 fuentes RSS de ciberseguridad (BleepingComputer,
   The Hacker News, Krebs, Dark Reading, SecurityWeek, The Record, Help Net
   Security, The Register, SANS ISC, Infosecurity Magazine, CISA advisories,
   Xataka Ciberseguridad).
2. **(bloque 02)** Deduplica contra las noticias ya publicadas en Supabase,
   limita a 3 candidatas por fuente para que ninguna acapare la lista, y se
   queda con hasta 10. Si no hay ninguna nueva, termina aquí.
3. **(bloques 04 y 05)** Manda dos avisos en paralelo con la misma lista:
   - Un **email informativo** (no accionable, solo para leer).
   - Un **mensaje al grupo de Telegram** con un **teclado de botones inline**.
     La pool de esa semana se guarda en la Data Table `recap_pool_telegram`.
4. **(bloque 06)** Alguien del grupo marca noticias con los botones y pulsa
   `✅ Publicar seleccionadas` (o `🌐 Todas` / `👎 No publicar nada`).
5. **(bloques 07-09)** Las elegidas se insertan en Supabase, se regenera el
   JSON del sitio, se hace commit + deploy en GitHub/Hostinger, y se responde
   al grupo con **un único mensaje**.
6. Las noticias NO elegidas no se guardan en ningún sitio — pueden volver a
   salir como candidatas la semana siguiente.

## Hueco 1 — Redacción/priorización con IA (Claude)

Nota **03** del workflow. **Sigue pendiente** (verificado el 2026-07-10: no
existe ninguna credencial de Anthropic en la instancia).

- Nodos afectados (desactivados, pero ya conectados): `Redactar y priorizar
  candidatos (Claude)`, `Modelo Anthropic`, `Formato de salida (JSON)`.
- Qué debería hacer: Claude reescribe título/resumen en inglés, añade "por
  qué importa" y asigna prioridad (alta/media/baja) a cada candidata.
- Sin la credencial, `Construir email de candidatas` y `Construir mensaje
  Telegram` usan el texto crudo del RSS (fallback ya construido, no rompe
  nada: un nodo desactivado deja pasar los datos sin tocarlos).
- Activación: crea la credencial Anthropic API, asígnala en `Modelo
  Anthropic`, reactiva los 3 nodos y publica.

## Selección por Telegram — activa

- **Bot:** `@breachfolio_alerts_bot`. **Grupo (chat_id):** `-1004318171372`.
- **Credencial n8n:** `Telegram account` (`telegramApi`, id `AlxvZcELjIdbrArs`).
- El token del bot vive **solo** en la credencial de n8n, no en este repo. Si
  hace falta regenerarlo: `@BotFather` → `/token` → "Revoke current token".

### Solo botones (y por qué)
El trigger `Telegram - mensaje recibido` escucha **únicamente
`callback_query`**. No escucha `message`, así que ningún texto del grupo
dispara el workflow.

Esto no es un capricho: con el **modo privacidad** de Telegram, un bot dentro
de un grupo no recibe los mensajes de texto sueltos, y desactivarlo en
BotFather **no se aplica a un grupo donde el bot ya estaba metido**. Se perdió
una sesión entera (2026-07-09) diagnosticando esto. Las pulsaciones de botones
siempre llegan al bot. **No reintroduzcas la selección por texto libre.**

### El teclado
```
[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]        -> recap_pick_N
[ 6 ][ 7 ][ 8 ][ 9 ][ 10]        (fuera de rango: "·" + recap_noop)
[ ✅ Publicar seleccionadas ]     -> recap_publish
[ 🔄 Limpiar ][ 🌐 Todas ][ 👎 No publicar nada ]
      recap_clear   recap_all      recap_none
```
El nodo Telegram **no admite un número dinámico de filas**, pero sí
expresiones en `text` y `callback_data`. Por eso hay 10 botones fijos y los
índices sobrantes se renderizan como `·`.

### El recorrido
```
Telegram - mensaje recibido
  → Cargar última pool (Data Table)
  → Preparar accion
  → [¿Es pick?  → Anadir seleccion]
    [¿Es limpiar? → Borrar seleccion]
  → Leer seleccion
  → Router seleccion
  → Guardar resuelto
  → Ack callback
  → ¿Publicar? → Expandir seleccionadas → Buscar sitio → …(publicación)
    ¿Nada?     → Confirmar nada seleccionado
    (resto)    → Sin accion
```

### Por qué la selección vive en su propia tabla
Al principio la selección era un campo `selected` en la fila del pool, que se
leía, modificaba y reescribía. **Eso perdía datos**: `Router seleccion` tarda
hasta ~1,5 s entre leer y escribir, así que dos pulsaciones seguidas (<2 s) se
pisaban y la primera desaparecía. Bug real, reproducido el 2026-07-10 pulsando
a velocidad normal.

Ahora cada pulsación **inserta su propia fila** en `recap_seleccion_telegram`
(`pool_id`, `idx`) y después se leen todas. Dos inserciones concurrentes no se
pisan, y al leer se deduplica con un `Set`, así que **pulsar el mismo número
dos veces nunca añade la noticia dos veces**. Si tocas este bloque, no vuelvas
a un patrón leer-modificar-escribir sobre un solo campo.

### Un solo mensaje al grupo, garantizado
- Los números y `🔄 Limpiar` responden solo con `answerCallbackQuery` (aviso
  privado, lo ve únicamente quien pulsa). **No escriben en el grupo.**
- Solo `✅ Publicar`, `🌐 Todas` y `👎 No publicar nada` mandan un mensaje.
- Al resolver, se marca `resolved = true` en la fila del pool. Cualquier
  pulsación posterior, de quien sea, recibe solo un aviso privado.

Esto corrige un caso real: dos personas distintas (`callback_query.from`
distinto) pulsaron el botón y el grupo recibió dos mensajes idénticos.

**Riesgo residual:** si dos personas pulsan una acción final en la misma
fracción de segundo (~0,2 s), ambas pueden leer `resolved=false`. La
deduplicación de Supabase (`¿Es duplicada?`) impide en cualquier caso que una
noticia se inserte dos veces.

## Bloque de selección por email/webhook — eliminado

Existía un webhook público `/webhook/recap-seleccionar` que se disparaba con un
comando `curl` incluido en el email. Se eliminó por completo (7 nodos + su nota)
al decidir que la aprobación se hace siempre por Telegram. El nodo del email se
renombró a `Construir email de candidatas` y ya no genera ningún `curl`: el
email semanal es **solo informativo**.

## Pendientes fuera de n8n (verificados el 2026-07-10)

- **`breachfolio.com`**: decidido pero **sin comprar**. El DNS responde
  `Non-existent domain`.
- **Hostinger**: migración de hosting planeada, sin hacer (se deduce de lo
  anterior: el dominio ni resuelve).
- **`deploy_hook_url`**: `NULL` en la tabla `sites` de Supabase. El nodo
  `Deploy hook` lo necesita para disparar el redeploy. `sites.status` sigue en
  `'draft'`.
- **Limpieza diaria de contenido** (expirar noticias antiguas): el workflow que
  lo hacía se borró y nunca se reconstruyó. En la instancia **solo existe este
  workflow**.

### Ya NO está pendiente (no lo rehagas)
- **Supabase sincronizado**: `articles` = 91 filas (antes 27).
- **Imágenes unificadas**: existía `imagenes/` (recepción) además de
  `assets/img/`. Se fusionaron en **`assets/img/`** (94 archivos); `imagenes/`
  ya no existe.

## IDs y accesos para retomar esto

- **n8n:** `breachfolio.app.n8n.cloud` (MCP conectado a nivel de usuario).
- **Workflow:** `yoUXqoUhRxOnYr1s`.
- **Supabase project ref:** `aarzgpypqqeptwophtbe` (`sites` 1, `articles` 91,
  `news` 4, `export_log` 5).
- **GitHub:** `breachfolio/pagina_ciber`.
- **Data Tables de n8n** (proyecto `ZHAsAS4IuxVlOxy1`) — internas, **no son
  Supabase**, no tocan la tabla `news`:
  - `recap_pool_telegram` (`ZwtNVnaIbuiwf9Kf`): `candidates` (JSON string),
    `sent_at` (ISO), `selected` (JSON string), `resolved` (boolean).
  - `recap_seleccion_telegram` (`8D2nNgvLp6jm9QA8`): `pool_id`, `idx`.
    Una fila por pulsación.

## Notas técnicas para quien edite este workflow por MCP

- **Bug recurrente, no resuelto de raíz:** casi cualquier `update_workflow`
  hace que los nodos con discriminador `resource`/`operation` los pierdan —
  aunque esa llamada no los toque. Afecta a `Crear archivo (si no existe)`,
  `Notificar candidatas (Telegram)`, `Ack callback (Telegram)`, `Confirmar nada
  seleccionado (Telegram)` y `Responder confirmación (Telegram)`.
  **Mitigación:** repón sus parámetros COMPLETOS con `updateNodeParameters`
  (`replace:true`) como **última llamada antes de `publish_workflow`**, y no
  publiques hasta ver `validationWarnings: []`.
- `setNodeParameter` (JSON Pointer) **no es fiable**: falla en silencio. Usa
  siempre `updateNodeParameters` con `replace:true` y el objeto completo.
- `get_workflow_details` **nunca** devuelve el campo `credentials`, ni siquiera
  de nodos con credencial funcionando. No lo interpretes como que falta. Para
  comprobarlo, usa `prepare_test_pin_data`: los nodos con credencial real salen
  en `nodesWithoutSchema`.
- Tras `publish_workflow`, n8n crea un **borrador nuevo**, así que `versionId`
  deja de coincidir con `activeVersionId`. No es un fallo. Si quieres asegurar
  que lo activo es exactamente lo que acabas de revisar, vuelve a publicar
  pasando ese `versionId` explícito.
- La salida de `get_workflow_details` **supera el límite de tokens**. Guárdala y
  léela con un script (jq/node) en vez de intentar leerla entera.
- `removeConnection` necesita el `sourceIndex` correcto cuando el origen es un
  `If` (rama true = 0, rama false = 1).
- `addNode` no hace upsert: si el nombre ya existe, la operación falla.
- Al borrar un nodo referenciado por expresión desde otro (`$('Nodo')`),
  reapunta esas expresiones **en la misma llamada atómica**, o dejarás una
  referencia rota.
- `answerCallbackQuery` = aviso privado. Solo `sendMessage` escribe en el grupo.
