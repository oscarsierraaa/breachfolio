# Estándar editorial — LEER ANTES DE ESCRIBIR NADA

> Creado el **2026-08-26** a petición del usuario. Este directorio no se sirve:
> `.htaccess` deniega `/docs/` y está en `robots.txt`.
>
> **Esto es lo primero que hay que abrir antes de generar un artículo.** No es
> una guía de estilo opcional: recoge errores que ya se cometieron, con su
> fecha, y las comprobaciones que los habrían evitado.

---

## 0. El dato que justifica todo lo demás

**225 artículos publicados. 9 producen clics.**

| | |
|---|---|
| Artículos publicados | 225 |
| Páginas que han dado **algún** clic en 3 meses | 12 |
| De esas, portadas o duplicados `www` | 3 |
| **Artículos que de verdad funcionan** | **9 · el 4 %** |
| Clics totales en 3 meses | 129 |

Y esos 9 concentran el 74 % de los clics. **El 96 % del catálogo no aporta
nada**: ni clics, ni casi impresiones.

Eso no se arregla publicando el artículo 226 igual que los anteriores. Es lo que
llevó al usuario a decir, el 26-08, que la web no puede ser mediocre y que ya
está harto de artículos parecidos con nombres distintos. **Tenía razón, y este
documento existe por eso.**

---

## 0.1 Por qué existe

El usuario lo pidió así, literalmente: que la web no sea mediocre, que los
artículos tengan peso, que no se repitan, que no lleven títulos que no busca
nadie, y que de verdad se entere uno de lo que está pasando.

Hasta hoy se han cometido estos fallos, **todos evitables con una comprobación
previa**:

| Fecha | Fallo | Lo habría evitado |
|---|---|---|
| 16-08 | Propuesto reescribir un tema que **ya existía** (guía de denuncias en España) | Buscar el tema en el repo antes de proponerlo |
| 23-08 | Artículo publicado **muy por debajo** del listón: 6 puntos de lista frente a 22 del anterior | Medirlo contra la mejor pieza del mismo tipo |
| 23-08 | Imagen equivocada, propagada a la portada | Comprobar qué imagen usa cada página |
| 26-08 | Propuesto un tema (**hijo en apuros**) que ya estaba cubierto en su variante telefónica | Lo mismo que el 16-08 |
| 26-08 | Generado solo en español: hreflang roto | Este sitio **no tiene artículos monolingües** |

---

## 1. La puerta: ningún tema sin evidencia

**Un tema no se escribe hasta que pasa estas cuatro.** Si falla una, se
descarta y se busca otro.

### 1.1 ¿Ya existe?

    grep -rli "<palabra clave>" --include=index.html es/ | head

Y mirar el listado completo de la sección. **Se ha propuesto contenido
duplicado dos veces.** El sitio tiene 288 páginas: no se recuerdan de memoria.

### 1.2 ¿Lo busca alguien de verdad? El método, que no es una fórmula

Prohibido escribir por intuición. Pero **igual de prohibido es hacer siempre la
misma búsqueda**: si se repite el mismo patrón de consulta, salen los mismos
temas de siempre con otro nombre, que es exactamente lo que el usuario rechazó
el 26-08.

Estos son **seis ángulos distintos**. Se combinan, no se aplican en orden:

**a) Los datos propios, siempre primero.**
Search Console → Rendimiento → 3 meses → filtro País = España → Consultas. Es
la mejor fuente que hay: consultas reales que ya están llegando al sitio. Así
salió `suplantan tu web`, que en tres días estaba en posición 6.

**b) Buscar el síntoma, no el nombre del ataque.**
Nadie busca «pig butchering»; busca *«la app no me deja sacar el dinero»*. Hay
que teclear lo que escribiría la persona describiendo lo que le pasa.

**c) Comprobar si hay negocio montado alrededor.**
Es la señal más fiable de demanda sostenida. Si existen **empresas que cobran
por resolver eso**, hay gente buscándolo todos los días. Con el DNI apareció al
instante: `protegemidni.es`, `removegroup`, `borrarcontenido`. Nadie monta una
empresa sobre una búsqueda que no existe.

**d) Mirar qué publican los demás, y si todos publican lo mismo.**
Si los diez primeros resultados son la misma lista superficial, hay hueco: se
entra diciendo lo que ellos evitan. Si arriba está TechRadar con un artículo
serio y mil enlaces, **se descarta y se busca otra cosa**.

**e) Buscar qué está pasando de verdad esta semana.**
Para noticias. El modelo llega hasta mayo de 2026 y el pipeline de n8n está
caído, así que hay que buscar de verdad, contrastar en una fuente primaria y
separar lo comprobado de lo atribuido.

**f) Buscar la pregunta literal, entre comillas.**
Para ver si la gente la formula así. Una consulta entrecomillada con resultados
reales detrás vale más que cualquier intuición sobre volumen.

> **La prueba final la pone el usuario, no una fórmula:** ¿es un artículo con
> peso, que se lee bien, y que buscaría una persona real? Si la respuesta honesta
> es «es correcto pero a mí no me interesaría», no se publica.

Y el título va por **lo que teclea la gente**, no por el nombre técnico:

| Se busca | No se busca |
|---|---|
| `pantalla android coche` | `TWCore`, `MoYu` |
| `mejor gestor de contraseñas` | `bitwarden vs keepassxc 2026` (1 búsqueda/trimestre) |
| `suplantan tu web` | `brand impersonation` |
| `denunciar phishing` | `web fraudulenta` (4 impresiones frente a 46) |

### 1.3 ¿Podemos competir?

**El dominio se registró el 2026-07-11.** No gana consultas cabecera.

- **Sí:** consultas específicas, largas, en español, donde compiten blogs
  pequeños o nadie. Ahí el sitio llega al puesto 1-7 (demostrado).
- **No:** `mejor antivirus`, `mejor VPN`, `ai red teaming`. Ahí están TechRadar,
  Tom's Guide y CyberNews con miles de enlaces. **Se descartó por esto la
  comparativa de antivirus el 26-08, ya escrita y verificada.**

### 1.4 ¿Pasa el test de las once de la noche?

**¿Lo tecleraría alguien en Google, con inquietud, a las once de la noche?** Si
es una tarea de mantenimiento y no una duda, no genera búsquedas. Ver §3.

### 1.5 ¿Encaja donde el sitio convierte?

Datos propios, no teoría: **España convierte 7-9 veces mejor que Estados
Unidos** y posiciona mejor (29,4 frente a 34,8). El contenido de consumo en
español es el negocio; el técnico en inglés es prestigio.

---

## 2. El hueco actual del catálogo (análisis del 26-08)

| Sección | Qué es en realidad |
|---|---|
| Guías (25) | Casi todas **reactivas**: «me han estafado con X» |
| Ciberseguridad (32) | Conceptos para quien estudia seguridad |
| Recursos (10) | Chuletas técnicas |
| Comparativas (12) | Herramientas, casi todas de desarrollador |
| Laboratorio (8) | Práctica técnica |

**Lo que falta es lo PREVENTIVO para una persona normal.** Todo el sitio es «ya
te ha pasado, arréglalo» o «aprende conceptos». Casi nada de «haz esto antes».

El 26-08 se abrió esa vía con `comprobar-datos-filtrados`. **Esa es la
dirección de crecimiento**, no más variantes de estafa.

---

## 3. El error de fondo: catálogo de amenazas contra preguntas reales

> **Revisado el 2026-08-26 tras un rechazo del usuario, y es la corrección más
> importante de este documento.**

La primera versión de este apartado proponía: borrado seguro del móvil,
configurar el router, reconocer un SMS fraudulento, tiendas falsas en
marketplaces. **El usuario los rechazó con dos argumentos, los dos correctos:**

1. **Son tareas, no preguntas.** Nadie lee un blog sobre cómo borrar un móvil:
   lo busca, lo hace y se va. No hay gancho porque no hay duda.
2. **Son paraguas de lo que ya existe con otro nombre.** «Reconocer un SMS
   fraudulento» y «tiendas falsas» son la misma familia de las 25 guías que ya
   hay.

Y debajo está el problema estructural:

> **El sitio está organizado como un catálogo de amenazas, no como una lista de
> preguntas que la gente se hace.**

Las guías se titulan por el nombre del ataque: «estafa de la cuenta segura del
banco», «estafa de entrega de paquetes», «pig butchering». Pero **nadie se
levanta pensando «he sido víctima de pig butchering»**. Piensa *«esta app no me
deja sacar el dinero»*.

Consecuencias, que son exactamente las que se están viendo en Search Console:

- **Los temas se repiten**, porque el catálogo de estafas es finito y ya está
  agotado.
- **Nadie busca el sitio**, porque la gente teclea su síntoma o su duda, nunca
  el nombre técnico del ataque.

### La prueba que hay que aplicar: el test de las once de la noche

**¿Alguien tecleraría esto en Google a las once de la noche, con inquietud?**

| Pasa | No pasa |
|---|---|
| «¿qué pueden hacer con una foto de mi DNI?» | «cómo hacer un borrado seguro del móvil» |
| «¿me están espiando el móvil?» | «cómo configurar el router» |
| «¿es seguro guardar las contraseñas en Chrome?» | «guía de hardening doméstico» |

Lo de la izquierda es **una duda con angustia detrás**. Lo de la derecha es una
tarea de mantenimiento. **Solo lo primero genera búsquedas y clics.**

---

## 3.1 Temas candidatos, reescritos con ese criterio

> Todos comprobados el 26-08: **ninguno tiene página dedicada**, y varios no se
> mencionan ni de pasada en las 288 páginas.

| Tema | Por qué pasa el test | Validación |
|---|---|---|
| ~~**¿Qué pueden hacer con una foto de tu DNI?**~~ | Angustia pura: alguien que acaba de mandarlo a un casero, un gimnasio o Wallapop. **Demanda comercial demostrada**: lo cubren BBVA e Infobae y hay **empresas enteras** montadas alrededor (`protegemidni.es`, `removegroup`, `borrarcontenido`) | ✅ **PUBLICADO 26-08** → `es/guias/foto-dni-riesgos/` |
| **¿Me están espiando el móvil?** | Consulta de ansiedad masiva. Y el ángulo honesto es contraintuitivo y útil: **casi siempre no**, y así se comprueba de verdad, en vez de vender miedo | Cero menciones en el sitio |
| ~~**¿Es seguro guardar las contraseñas en el navegador?**~~ | Lo hace todo el mundo y todo el mundo duda. La respuesta buena es matizada, no un sí o un no. **Enlaza de forma natural con la comparativa de gestores**, que es la única página monetizable | ✅ **PUBLICADO 29-08** → `es/guias/contrasenas-en-el-navegador/` |
| **¿Es seguro comprar en Temu o AliExpress?** | Volumen enorme en España. El ángulo que nadie da: no va de estafas, va de **qué datos entregas** | Cero menciones |
| **¿Cuánto vale tu cuenta robada en el mercado negro?** | Curiosidad con datos. Es material **citable y compartible**, del tipo que genera enlaces (ver `plan-enlaces-entrantes.md` §4 nivel 3) | Cero menciones |

**El patrón común, y la regla que sale de aquí:** todos son **preguntas en
primera persona con una duda detrás**, no nombres de ataque. Ese es el criterio
de selección a partir de ahora.

> **Matizado el 29-08 con datos, y el matiz es grande.** «Pregunta en primera
> persona» se queda corto. Lo que gana no es una pregunta: es **una confesión en
> pasado**. Ver §3.2, que es ahora la sección más importante de este documento.

---

## 3.2 La prueba, medida el 29-08: por qué gana la única página que gana

**309 páginas del sitio reciben impresiones. Una convierte.** Durante semanas se
dio por suerte. Al pedir su desglose de consultas, deja de serlo.

### Los números

`guides/fake-credit-card-website/` — «I entered my card on a fake website»

| | |
|---|---|
| Clics | **44 de los 145 del sitio entero (30 %)** |
| Impresiones | 3.227 |
| CTR | **1,4 %** |
| **Posición** | **9,5 — página 1** |

Y **sin un solo enlace entrante**. El dominio sigue con cero dominios de
referencia. Eso importa mucho: **demuestra que el sitio SÍ puede llegar a
página 1 sin autoridad**, si elige bien la consulta.

### Las consultas reales que le llegan

- «what if i entered my debit card into a fake website»
- «what if i entered my credit card into a fake website»
- «locked my credit card as i entered into suspicious website»
- «i put my card in a scam website but it didnt go thru what now»

Frases enteras. En primera persona. **En pasado.** Sin optimizar. Escritas por
alguien que acaba de hacer algo y está asustado.

Y un detalle revelador: **ninguna consulta visible tiene clics asignados**. Los
44 vienen de la cola larga que Search Console anonimiza por ser demasiado
específica y poco repetida. **Es decir: gana en consultas tan concretas que
Google ni las enseña.** Ahí no compite nadie.

### El contraste, que es donde está la lección

| Título | Encuadre | Posición | Clics |
|---|---|---|---|
| «I entered my card on a fake website» | **Confesión en pasado** | **9,5** | **44** |
| «Report a scam website: FTC, IC3, Google & MS» | Tarea administrativa | 40-80 | 1 / 5.106 impr. |
| «Cómo denunciar phishing y webs fraudulentas» | Cómo + verbo | profunda | 0 / 497 |
| «Is this domain fake or suspicious? How to check» | Herramienta | profunda | 2 / 448 |
| «Someone's impersonating you on Instagram» | **Segunda** persona | 26 | 0 / 737 |

**La diferencia no es el tema: los cinco van de fraude online.** Es el
encuadre. «Denunciar una web» es una categoría de tarea, y ahí compites con la
FTC, la policía y los grandes medios. «Metí mi tarjeta» es un momento concreto
de una persona concreta, y ahí no compite casi nadie.

Nótese que **Instagram, en segunda persona, tampoco funciona.** No basta con
que hable de una persona: tiene que ser **quien busca hablando de sí mismo**.

### El recuento incómodo

De los ~25 temas de guía del sitio, **solo dos están escritos así**:

- `tarjeta-web-falsa` / `fake-credit-card-website` ← **la que convierte**
- `correo-hackeado` / `hacked-email-account`

**Dos de veinticinco.** Y una de las dos se lleva el 30 % de todos los clics.

### La regla que sale de aquí, y sustituye a la anterior

**El título tiene que poder empezar por «He…» o «Me han…».** Si el tema no
admite esa forma, probablemente sea una categoría, no un momento.

| No | Sí |
|---|---|
| Cómo denunciar una web fraudulenta | **He comprado en una web falsa** |
| Qué es el SIM swapping | **Me he quedado sin cobertura de repente** |
| Seguridad en compras online | **He pagado y no me llega el pedido** |

**Y una autocrítica honesta, del mismo 29-08:** los dos artículos publicados el
26 y el 29 —la foto del DNI y las contraseñas del navegador— **están mejor que
el catálogo antiguo pero todavía no siguen este patrón**. «¿Es seguro guardar
las contraseñas en el navegador?» la busca alguien que curiosea; «He metido mi
tarjeta en una web falsa» la busca alguien que está temblando. Son públicos
distintos, con competencia distinta y posiciones distintas. **El siguiente
artículo tiene que ser una confesión, no una duda.**

### Descartados, con su motivo, para no volver a proponerlos

- `bitdefender vs norton vs kaspersky` — escrito y verificado, pero el SERP es
  de TechRadar y Tom's Guide. En `docs/borrador-2026-08-17-antivirus-consumo.md`.
- «Hijo en apuros» — **ya existe** la variante telefónica.
- **Borrado seguro del móvil, configurar el router, permisos de apps** — tareas
  de mantenimiento, sin gancho. Rechazados por el usuario el 26-08.
- **«Reconocer un SMS fraudulento», «tiendas falsas en marketplaces»** —
  paraguas de guías que ya existen. Mismo rechazo.
- Más artículos de IA sobre términos genéricos — 720 impresiones, **cero clics**.
- Más comparativas de herramientas de desarrollador — `sliver vs metasploit`
  son 14 impresiones en tres meses.

---

## 4. El listón, medido

**Antes de dar una pieza por buena, se mide contra la mejor del mismo tipo ya
publicada.** No es opinable: son números.

| Referencia | h2 | listas | puntos | negritas | FAQ | palabras |
|---|---|---|---|---|---|---|
| `comprobar-datos-filtrados` (guía) | 9 | 7 | 25 | 35 | 6 | 1.650 |
| `suplantan-tu-web` (guía) | 10 | 6 | 22 | 23 | 5 | 1.476 |
| `malware-pantallas-coche` (noticia) | 10 | 8 | 27 | 45 | 4 | 1.615 |

**Mínimos:** 8 h2, 5 listas, 18 puntos, 4 preguntas, 1.200 palabras. Por debajo
de eso, no se publica: se amplía.

Y una advertencia del 23-08: **las comprobaciones automáticas dan verde con un
artículo pobre.** Cuentan títulos, fechas, enlaces y esquema; ninguna mide si el
texto tiene estructura. La comparación con la mejor pieza la hace una persona.

---

## 5. Cómo se escribe

1. **Gancho que aguante solo en una frase.** No «hay malware para coches», sino
   «entró por el canal de actualización oficial». No «hay una filtración», sino
   «no puedes borrarla; puedes hacer que no sirva». **Si el titular no se
   sostiene sin el artículo, el artículo no está listo.**
2. **Decir lo que nadie dice.** Antes de escribir, mirar qué publican los demás
   sobre el tema. Si el artículo va a ser la misma lista de herramientas que
   hay en veinte sitios, no aporta. Lo que diferencia suele ser la parte
   incómoda que los demás evitan.
3. **Separar lo comprobado de lo atribuido.** Los números son hechos; la
   autoría de una campaña es una valoración con su nivel de confianza. Y decir
   explícitamente **lo que la fuente NO dice** (marcas, cifras, países) cuando
   es justo lo que el lector querría saber.
4. **Sacar a estructura lo interesante.** Una cadena de infección en cuatro
   pasos numerados se entiende; en un párrafo, no. Ese fue el arreglo del 23-08.
5. **Preguntas frecuentes que alguien haría de verdad**, no de relleno. Y el
   `FAQPage` del JSON-LD **tiene que coincidir** con las visibles.
6. **Enlaces internos que vengan a cuento**, comprobando antes que la página
   destino existe.
7. **Sin enlaces de afiliado en la primera publicación.** Primero limpio, se
   mide, y después se decide.

---

## 6. Comprobaciones mecánicas, antes de subir

- [ ] **Las dos versiones, ES e inglesa.** Este sitio no tiene artículos
      monolingües: publicar en un solo idioma rompe el hreflang (pasó el 26-08).
- [ ] **Imagen abierta y mirada**, no elegida por el nombre del fichero. **Ha
      mentido tres veces** (un «microchip agrietado» era un SOC con un
      mapamundi).
- [ ] **Nombre del asset en inglés**, como los otros 50 de `assets/img`.
- [ ] **Comprobar qué imagen usa la página generada.** Una sustitución que no
      encuentra su cadena **falla en silencio** (23-08).
- [ ] `<title>` ≤ 65 caracteres · `description` entre 70 y 165.
- [ ] Tarjeta en el hub **y** entrada en el `ItemList` de los dos idiomas.
- [ ] **La ruta de la imagen en la tarjeta del hub español lleva `../../`**, no
      `../`. `guides/` cuelga de la raíz y `es/guias/` está un nivel más abajo,
      así que **no comparten prefijo** aunque las tarjetas sean idénticas. Con
      `../` la imagen apunta a `es/assets/`, que no existe (26-08).
- [ ] **La fecha no puede ser futura.** Si el artículo se escribió pensando en
      el hueco siguiente de la cadencia, hay que re-fecharlo al día en que se
      sube: artículo y hub, en los dos idiomas (26-08).
- [ ] `npm run build` **entero**, nunca pasos sueltos.
- [ ] Barrido estructural y comprobador de enlaces: **cero defectos**.
- [ ] Verificar en producción con anticaché, y **reintentar**: la CDN sirve
      404 durante el despliegue.

---

## 7. Cadencia

**Un artículo cada 2 o 3 días, priorizando la calidad.** Instrucción del
usuario del 26-08.

Un día de retraso no rompe nada; publicar algo flojo por cumplir el calendario,
sí. Si el tema no pasa la puerta del punto 1, **se busca otro, no se rebaja el
listón**.

---

## 8. Lo que NO se hace

- Escribir sobre un tema sin comprobar que no existe ya.
- Elegir tema por intuición en vez de por demanda.
- Competir de frente por términos cabecera con un dominio de dos meses.
- Publicar sin comparar con la mejor pieza del mismo tipo.
- Publicar en un solo idioma.
- Inferir permiso de publicar de un «genera el artículo». **Se pide «publica»
  explícitamente** (lección del 17-08, que costó un revert).
- **Proponer retitular o reescribir una página publicada sin ver antes su
  posición filtrada por página y sobre 3 meses.** Ha pasado tres veces
  (`instagram-impersonation`, `report-scam-website`, `suplantan-tu-web`) y las
  tres la hipótesis fue «el texto» y la respuesta de los datos fue «la
  posición». **Una ventana de 7 días con pocas impresiones da posiciones
  engañosamente buenas**: `suplantan-tu-web` marcaba 6,4 a 7 días y **28,9
  sobre su vida real**. Por debajo de posición 15 no hay redacción que
  arregle nada; lo que falta es autoridad.
