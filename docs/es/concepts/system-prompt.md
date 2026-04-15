---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de tiempo/Heartbeat
    - Cambiar el comportamiento de arranque del espacio de trabajo o de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-15T19:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt del sistema

OpenClaw crea un prompt del sistema personalizado para cada ejecución del agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt es ensamblado por OpenClaw e inyectado en cada ejecución del agente.

Los plugins de proveedor pueden aportar guía de prompt compatible con caché sin reemplazar el prompt completo propiedad de OpenClaw. El runtime del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de familias de modelos. Mantén la mutación heredada del prompt `before_prompt_build` para compatibilidad o para cambios de prompt verdaderamente globales, no para el comportamiento normal del proveedor.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Herramientas**: recordatorio de la fuente de verdad de herramientas estructuradas más la guía de uso de herramientas en runtime.
- **Seguridad**: breve recordatorio de barreras de protección para evitar conductas de búsqueda de poder o eludir la supervisión.
- **Skills** (cuando están disponibles): le indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **Autoactualización de OpenClaw**: cómo inspeccionar la configuración de forma segura con `config.schema.lookup`, modificar la configuración con `config.patch`, reemplazar la configuración completa con `config.apply`, y ejecutar `update.run` solo a solicitud explícita del usuario. La herramienta `gateway`, solo para propietarios, también rechaza reescribir `tools.exec.ask` / `tools.exec.security`, incluidas las alias heredadas `tools.bash.*` que se normalizan a esas rutas protegidas de exec.
- **Espacio de trabajo**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentación**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Archivos del espacio de trabajo (inyectados)**: indica que los archivos de arranque se incluyen más abajo.
- **Sandbox** (cuando está habilitado): indica el runtime aislado, las rutas del sandbox y si exec elevado está disponible.
- **Fecha y hora actuales**: hora local del usuario, zona horaria y formato de hora.
- **Etiquetas de respuesta**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de Heartbeat y comportamiento de acuse de recibo, cuando Heartbeats están habilitados para el agente predeterminado.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Razonamiento**: nivel de visibilidad actual + pista para alternar con /reasoning.

La sección de Herramientas también incluye guía de runtime para trabajos de larga duración:

- usa cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente) en lugar de bucles de espera con `exec`, trucos de retraso con `yieldMs` o sondeo repetido de `process`
- usa `exec` / `process` solo para comandos que comienzan ahora y siguen ejecutándose en segundo plano
- cuando la reactivación automática por finalización está habilitada, inicia el comando una sola vez y confía en la ruta de reactivación basada en push cuando emita salida o falle
- usa `process` para registros, estado, entrada o intervención cuando necesites inspeccionar un comando en ejecución
- si la tarea es más grande, prefiere `sessions_spawn`; la finalización del subagente se basa en push y se anuncia automáticamente al solicitante
- no sondees `subagents list` / `sessions_list` en un bucle solo para esperar la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Herramientas también le indica al modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un paso `in_progress` y que evite repetir el plan completo después de cada actualización.

Las barreras de protección de Seguridad en el prompt del sistema son de carácter orientativo. Guían el comportamiento del modelo, pero no aplican políticas. Usa la política de herramientas, aprobaciones de exec, sandboxing y listas permitidas de canales para una aplicación estricta; los operadores pueden deshabilitarlas por diseño.

En los canales con tarjetas o botones de aprobación nativos, el prompt de runtime ahora le indica al agente que primero confíe en esa IU de aprobación nativa. Solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta diga que las aprobaciones en el chat no están disponibles o que la aprobación manual es la única opción.

## Modos de prompt

OpenClaw puede renderizar prompts del sistema más pequeños para subagentes. El runtime establece un `promptMode` para cada ejecución (no es una configuración orientada al usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: se usa para subagentes; omite **Skills**, **Memory Recall**, **Autoactualización de OpenClaw**, **Alias de modelos**, **Identidad del usuario**, **Etiquetas de respuesta**, **Mensajería**, **Respuestas silenciosas** y **Heartbeats**. Herramientas, **Seguridad**, Espacio de trabajo, Sandbox, Fecha y hora actuales (cuando se conocen), Runtime y el contexto inyectado siguen disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts adicionales inyectados se etiquetan como **Contexto del subagente** en lugar de **Contexto de chat grupal**.

## Inyección de arranque del espacio de trabajo

Los archivos de arranque se recortan y se anexan en **Contexto del proyecto** para que el modelo vea la identidad y el contexto del perfil sin necesidad de lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando está presente; de lo contrario, `memory.md` como alternativa en minúsculas

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, a menos que se aplique una condición específica del archivo. `HEARTBEAT.md` se omite en ejecuciones normales cuando Heartbeats están deshabilitados para el agente predeterminado o `agents.defaults.heartbeat.includeSystemPromptSection` es false. Mantén los archivos inyectados concisos, especialmente `MEMORY.md`, que puede crecer con el tiempo y provocar un uso de contexto inesperadamente alto y una Compaction más frecuente.

> **Nota:** los archivos diarios `memory/*.md` **no** forman parte del Contexto del proyecto de arranque normal. En turnos normales se accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que no cuentan contra la ventana de contexto a menos que el modelo los lea explícitamente. Los turnos simples `/new` y `/reset` son la excepción: el runtime puede anteponer memoria diaria reciente como un bloque único de contexto de inicio para ese primer turno.

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo está controlado por `agents.defaults.bootstrapMaxChars` (predeterminado: 20000). El contenido total de arranque inyectado entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 150000). Los archivos ausentes inyectan un marcador breve de archivo faltante. Cuando se produce truncamiento, OpenClaw puede inyectar un bloque de advertencia en Contexto del proyecto; contrólalo con `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; predeterminado: `once`).

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos de arranque se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar los archivos de arranque inyectados (por ejemplo, cambiar `SOUL.md` por una personalidad alternativa).

Si quieres que el agente suene menos genérico, empieza con la [Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar frente a inyectado, truncamiento, además de la sobrecarga del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Contexto](/es/concepts/context).

## Manejo del tiempo

El prompt del sistema incluye una sección dedicada de **Fecha y hora actuales** cuando se conoce la zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado incluye una línea de marca de tiempo. La misma herramienta también puede establecer opcionalmente una anulación de modelo por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver los detalles completos del comportamiento.

## Skills

Cuando existen Skills aptas, OpenClaw inyecta una **lista compacta de Skills disponibles** (`formatSkillsForPrompt`) que incluye la **ruta del archivo** para cada Skill. El prompt le indica al modelo que use `read` para cargar el SKILL.md en la ubicación indicada (espacio de trabajo, administrado o incluido). Si no hay Skills aptas, se omite la sección Skills.

La aptitud incluye condiciones de metadatos de Skills, comprobaciones del entorno/configuración de runtime y la lista permitida efectiva de Skills del agente cuando `agents.defaults.skills` o `agents.list[].skills` está configurado.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base y, al mismo tiempo, permite el uso dirigido de Skills.

El presupuesto de la lista de Skills pertenece al subsistema de Skills:

- Predeterminado global: `skills.limits.maxSkillsPromptChars`
- Anulación por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Los extractos genéricos acotados de runtime usan una superficie distinta:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Esa división mantiene el dimensionamiento de Skills separado del dimensionamiento de lectura/inyección en runtime, como `memory_get`, resultados de herramientas en vivo y actualizaciones de `AGENTS.md` posteriores a Compaction.

## Documentación

Cuando está disponible, el prompt del sistema incluye una sección de **Documentación** que apunta al directorio local de documentación de OpenClaw (ya sea `docs/` en el espacio de trabajo del repositorio o la documentación incluida en el paquete npm) y también menciona el espejo público, el repositorio fuente, el Discord de la comunidad y ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. El prompt le indica al modelo que consulte primero la documentación local para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que ejecute `openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).
