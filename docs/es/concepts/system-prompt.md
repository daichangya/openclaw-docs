---
read_when:
    - Editar el texto del prompt del sistema, la lista de herramientas o las secciones de hora/heartbeat
    - Cambiar el bootstrap del espacio de trabajo o el comportamiento de inyección de Skills
summary: Qué contiene el prompt del sistema de OpenClaw y cómo se ensambla
title: Prompt del sistema
x-i18n:
    generated_at: "2026-04-06T03:07:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt del sistema

OpenClaw crea un prompt del sistema personalizado para cada ejecución de agente. El prompt es **propiedad de OpenClaw** y no usa el prompt predeterminado de pi-coding-agent.

El prompt es ensamblado por OpenClaw e inyectado en cada ejecución de agente.

Los plugins de proveedor pueden aportar orientación de prompt consciente de caché sin reemplazar el prompt completo propiedad de OpenClaw. El tiempo de ejecución del proveedor puede:

- reemplazar un pequeño conjunto de secciones principales con nombre (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- inyectar un **prefijo estable** por encima del límite de caché del prompt
- inyectar un **sufijo dinámico** por debajo del límite de caché del prompt

Usa contribuciones propiedad del proveedor para ajustes específicos de la familia de modelos. Mantén la mutación heredada del prompt `before_prompt_build` para compatibilidad o para cambios de prompt realmente globales, no para el comportamiento normal del proveedor.

## Estructura

El prompt es intencionalmente compacto y usa secciones fijas:

- **Tooling**: recordatorio de fuente de verdad de herramientas estructuradas más orientación en tiempo de ejecución para uso de herramientas.
- **Safety**: recordatorio breve de protecciones para evitar comportamiento de búsqueda de poder o elusión de supervisión.
- **Skills** (cuando están disponibles): le indica al modelo cómo cargar instrucciones de Skills bajo demanda.
- **OpenClaw Self-Update**: cómo inspeccionar la configuración de forma segura con
  `config.schema.lookup`, aplicar parches a la configuración con `config.patch`, reemplazar la configuración completa con `config.apply`, y ejecutar `update.run` solo a solicitud explícita del usuario. La herramienta `gateway`, solo para propietarios, también rechaza reescribir
  `tools.exec.ask` / `tools.exec.security`, incluidas las alias heredadas `tools.bash.*`
  que se normalizan a esas rutas protegidas de exec.
- **Workspace**: directorio de trabajo (`agents.defaults.workspace`).
- **Documentation**: ruta local a la documentación de OpenClaw (repositorio o paquete npm) y cuándo leerla.
- **Workspace Files (injected)**: indica que los archivos bootstrap están incluidos más abajo.
- **Sandbox** (cuando está habilitado): indica el tiempo de ejecución en sandbox, las rutas del sandbox y si exec elevado está disponible.
- **Current Date & Time**: hora local del usuario, zona horaria y formato de hora.
- **Reply Tags**: sintaxis opcional de etiquetas de respuesta para proveedores compatibles.
- **Heartbeats**: prompt de heartbeat y comportamiento de acuse de recibo.
- **Runtime**: host, SO, node, modelo, raíz del repositorio (cuando se detecta), nivel de razonamiento (una línea).
- **Reasoning**: nivel de visibilidad actual + pista sobre `/reasoning`.

La sección Tooling también incluye orientación en tiempo de ejecución para trabajos de larga duración:

- usa cron para seguimientos futuros (`check back later`, recordatorios, trabajo recurrente)
  en lugar de bucles de sueño con `exec`, trucos de retraso con `yieldMs` o sondeo repetido de `process`
- usa `exec` / `process` solo para comandos que empiezan ahora y siguen ejecutándose
  en segundo plano
- cuando la activación automática al finalizar está habilitada, inicia el comando una sola vez y confía en
  la ruta de activación basada en push cuando emita salida o falle
- usa `process` para registros, estado, entrada o intervención cuando necesites
  inspeccionar un comando en ejecución
- si la tarea es mayor, prefiere `sessions_spawn`; la finalización de subagentes es
  basada en push y se anuncia automáticamente al solicitante
- no sondees `subagents list` / `sessions_list` en un bucle solo para esperar
  la finalización

Cuando la herramienta experimental `update_plan` está habilitada, Tooling también le dice al
modelo que la use solo para trabajo no trivial de varios pasos, que mantenga exactamente un paso
`in_progress`, y que evite repetir todo el plan después de cada actualización.

Las protecciones de Safety en el prompt del sistema son orientativas. Guían el comportamiento del modelo, pero no aplican la política. Usa la política de herramientas, las aprobaciones de exec, el sandboxing y las listas de permitidos de canales para la aplicación estricta; los operadores pueden desactivarlas por diseño.

En canales con tarjetas/botones de aprobación nativos, el prompt de tiempo de ejecución ahora le dice al
agente que dependa primero de esa UI de aprobación nativa. Solo debe incluir un comando manual
`/approve` cuando el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o
que la aprobación manual es la única vía.

## Modos del prompt

OpenClaw puede renderizar prompts del sistema más pequeños para subagentes. El tiempo de ejecución establece un
`promptMode` para cada ejecución (no es una configuración visible para el usuario):

- `full` (predeterminado): incluye todas las secciones anteriores.
- `minimal`: se usa para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** y **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (cuando se conoce), Runtime y el
  contexto inyectado siguen estando disponibles.
- `none`: devuelve solo la línea base de identidad.

Cuando `promptMode=minimal`, los prompts adicionales inyectados se etiquetan como **Subagent
Context** en lugar de **Group Chat Context**.

## Inyección de bootstrap del espacio de trabajo

Los archivos bootstrap se recortan y se agregan en **Project Context** para que el modelo vea el contexto de identidad y perfil sin necesitar lecturas explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (solo en espacios de trabajo completamente nuevos)
- `MEMORY.md` cuando está presente; en caso contrario, `memory.md` como alternativa en minúsculas

Todos estos archivos se **inyectan en la ventana de contexto** en cada turno, lo que
significa que consumen tokens. Mantenlos concisos, especialmente `MEMORY.md`, que puede
crecer con el tiempo y provocar un uso de contexto inesperadamente alto y una compactación
más frecuente.

> **Nota:** Los archivos diarios `memory/*.md` **no** se inyectan automáticamente. Se
> accede a ellos bajo demanda mediante las herramientas `memory_search` y `memory_get`, por lo que
> no cuentan para la ventana de contexto a menos que el modelo los lea explícitamente.

Los archivos grandes se truncan con un marcador. El tamaño máximo por archivo se controla con
`agents.defaults.bootstrapMaxChars` (predeterminado: 20000). El contenido bootstrap total inyectado
entre archivos está limitado por `agents.defaults.bootstrapTotalMaxChars`
(predeterminado: 150000). Los archivos ausentes inyectan un marcador corto de archivo faltante. Cuando ocurre truncación,
OpenClaw puede inyectar un bloque de advertencia en Project Context; controla esto con
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
predeterminado: `once`).

Las sesiones de subagentes solo inyectan `AGENTS.md` y `TOOLS.md` (los demás archivos bootstrap
se filtran para mantener pequeño el contexto del subagente).

Los hooks internos pueden interceptar este paso mediante `agent:bootstrap` para mutar o reemplazar
los archivos bootstrap inyectados (por ejemplo, sustituir `SOUL.md` por una persona alternativa).

Si quieres que el agente suene menos genérico, empieza con la
[Guía de personalidad de SOUL.md](/es/concepts/soul).

Para inspeccionar cuánto aporta cada archivo inyectado (sin procesar vs inyectado, truncación, además del overhead del esquema de herramientas), usa `/context list` o `/context detail`. Consulta [Context](/es/concepts/context).

## Manejo del tiempo

El prompt del sistema incluye una sección dedicada **Current Date & Time** cuando se conoce la
zona horaria del usuario. Para mantener estable la caché del prompt, ahora solo incluye
la **zona horaria** (sin reloj dinámico ni formato de hora).

Usa `session_status` cuando el agente necesite la hora actual; la tarjeta de estado
incluye una línea de marca temporal. La misma herramienta también puede configurar opcionalmente una anulación del
modelo por sesión (`model=default` la borra).

Configura con:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulta [Fecha y hora](/es/date-time) para ver el comportamiento completo.

## Skills

Cuando existen Skills elegibles, OpenClaw inyecta una **lista compacta de Skills disponibles**
(`formatSkillsForPrompt`) que incluye la **ruta de archivo** de cada Skill. El
prompt indica al modelo que use `read` para cargar el SKILL.md en la ubicación
indicada (workspace, gestionada o incluida). Si no hay Skills elegibles, la
sección Skills se omite.

La elegibilidad incluye compuertas de metadatos de Skills, comprobaciones del entorno/configuración en tiempo de ejecución,
y la lista de permitidos efectiva de Skills del agente cuando `agents.defaults.skills` o
`agents.list[].skills` está configurado.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Esto mantiene pequeño el prompt base mientras sigue permitiendo un uso dirigido de Skills.

## Documentation

Cuando está disponible, el prompt del sistema incluye una sección **Documentation** que apunta al
directorio local de documentación de OpenClaw (ya sea `docs/` en el espacio de trabajo del repositorio o la documentación incluida del paquete npm) y también menciona el espejo público, el repositorio fuente, el Discord de la comunidad y
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descubrir Skills. El prompt indica al modelo que consulte primero la documentación local
para el comportamiento, los comandos, la configuración o la arquitectura de OpenClaw, y que ejecute
`openclaw status` por sí mismo cuando sea posible (preguntando al usuario solo cuando no tenga acceso).
