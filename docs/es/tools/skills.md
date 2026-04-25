---
read_when:
    - Agregar o modificar Skills
    - Cambiar las reglas de control o carga de Skills
summary: 'Skills: administradas frente a las del espacio de trabajo, reglas de control y configuración/env wiring'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw usa carpetas de Skills **compatibles con [AgentSkills](https://agentskills.io)** para enseñar al agente cómo usar herramientas. Cada Skill es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga **Skills incluidos** más sobrescrituras locales opcionales, y los filtra en tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga Skills desde estas fuentes:

1. **Carpetas de Skills adicionales**: configuradas con `skills.load.extraDirs`
2. **Skills incluidos**: se envían con la instalación (paquete npm o OpenClaw.app)
3. **Skills administradas/locales**: `~/.openclaw/skills`
4. **Skills personales del agente**: `~/.agents/skills`
5. **Skills del agente del proyecto**: `<workspace>/.agents/skills`
6. **Skills del espacio de trabajo**: `<workspace>/skills`

Si hay conflicto de nombre de Skill, la precedencia es:

`<workspace>/skills` (máxima) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidos → `skills.load.extraDirs` (mínima)

## Skills por agente frente a Skills compartidas

En configuraciones **multiagente**, cada agente tiene su propio espacio de trabajo. Eso significa:

- Las **Skills por agente** viven en `<workspace>/skills` solo para ese agente.
- Las **Skills del agente del proyecto** viven en `<workspace>/.agents/skills` y se aplican a
  ese espacio de trabajo antes de la carpeta normal `skills/` del espacio de trabajo.
- Las **Skills personales del agente** viven en `~/.agents/skills` y se aplican en todos los
  espacios de trabajo de esa máquina.
- Las **Skills compartidas** viven en `~/.openclaw/skills` (administradas/locales) y son visibles
  para **todos los agentes** de la misma máquina.
- También se pueden agregar **carpetas compartidas** mediante `skills.load.extraDirs` (precedencia
  más baja) si quieres un paquete común de Skills usado por varios agentes.

Si el mismo nombre de Skill existe en más de un lugar, se aplica la precedencia
habitual: el espacio de trabajo gana, luego las Skills del agente del proyecto, luego las Skills personales del agente,
después las administradas/locales, luego las incluidas y al final los directorios extra.

## Listas de permitidos de Skills por agente

La **ubicación** de la Skill y la **visibilidad** de la Skill son controles separados.

- Ubicación/precedencia decide qué copia gana cuando una Skill con el mismo nombre aparece varias veces.
- Las listas de permitidos por agente deciden qué Skills visibles puede usar realmente un agente.

Usa `agents.defaults.skills` para una base compartida y luego sobrescribe por agente con
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // hereda github, weather
      { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
      { id: "locked-down", skills: [] }, // sin Skills
    ],
  },
}
```

Reglas:

- Omite `agents.defaults.skills` para Skills sin restricción de forma predeterminada.
- Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
- Establece `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se combina con los valores predeterminados.

OpenClaw aplica el conjunto efectivo de Skills del agente en la construcción del prompt, el
descubrimiento de comandos con barra de Skills, la sincronización del sandbox y las instantáneas de Skills.

## Plugins + Skills

Los Plugins pueden incluir sus propias Skills listando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills del Plugin se cargan
cuando el Plugin está habilitado. Este es el lugar correcto para guías operativas
específicas de herramientas que son demasiado largas para la descripción de la herramienta, pero que deberían estar disponibles
siempre que el Plugin esté instalado; por ejemplo, el Plugin del navegador incluye una
Skill `browser-automation` para control del navegador en varios pasos. Actualmente esos
directorios se combinan en la misma ruta de baja precedencia que
`skills.load.extraDirs`, por lo que una Skill incluida, administrada, de agente o de espacio de trabajo
con el mismo nombre las sobrescribe.
Puedes controlarlas mediante `metadata.openclaw.requires.config` en la entrada de configuración del Plugin.
Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Tools](/es/tools) para la
superficie de herramientas que enseñan esas Skills.

## Skill Workshop

El Plugin opcional y experimental Skill Workshop puede crear o actualizar Skills del espacio de trabajo
a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado de
forma predeterminada y debe habilitarse explícitamente mediante
`plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, analiza el contenido generado,
admite aprobación pendiente o escrituras seguras automáticas, pone en cuarentena
propuestas no seguras y actualiza la instantánea de Skills después de escrituras correctas para que las nuevas
Skills puedan estar disponibles sin reiniciar Gateway.

Úsalo cuando quieras que correcciones como “la próxima vez, verifica la atribución del GIF” o
flujos de trabajo costosos de obtener, como listas de verificación de QA de medios, se conviertan en
instrucciones procedimentales duraderas. Empieza con aprobación pendiente; usa escrituras automáticas solo en
espacios de trabajo de confianza después de revisar sus propuestas. Guía completa:
[Plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalar + sincronizar)

ClawHub es el registro público de Skills para OpenClaw. Navega en
[https://clawhub.ai](https://clawhub.ai). Usa los comandos nativos `openclaw skills`
para descubrir/instalar/actualizar Skills, o la CLI separada `clawhub` cuando
necesites flujos de publicación/sincronización.
Guía completa: [ClawHub](/es/tools/clawhub).

Flujos comunes:

- Instalar una Skill en tu espacio de trabajo:
  - `openclaw skills install <skill-slug>`
- Actualizar todas las Skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (analizar + publicar actualizaciones):
  - `clawhub sync --all`

`openclaw skills install` nativo instala en el directorio `skills/` del espacio de trabajo activo. La CLI separada `clawhub` también instala en `./skills` bajo tu
directorio de trabajo actual (o usa como respaldo el espacio de trabajo OpenClaw configurado).
OpenClaw lo detecta como `<workspace>/skills` en la siguiente sesión.

## Notas de seguridad

- Trata las Skills de terceros como **código no confiable**. Léeselas antes de habilitarlas.
- Prefiere ejecuciones en sandbox para entradas no confiables y herramientas de riesgo. Consulta [Sandboxing](/es/gateway/sandboxing).
- El descubrimiento de Skills del espacio de trabajo y de directorios extra solo acepta raíces de Skills y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de Skills respaldadas por Gateway (`skills.install`, incorporación y la UI de configuración de Skills) ejecutan el escáner integrado de código peligroso antes de ejecutar metadatos de instalador. Los hallazgos `critical` bloquean de forma predeterminada a menos que quien llama establezca explícitamente la sobrescritura de peligro; los hallazgos sospechosos siguen siendo solo advertencias.
- `openclaw skills install <slug>` es distinto: descarga una carpeta de Skill de ClawHub al espacio de trabajo y no usa la ruta de metadatos de instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host**
  para ese turno del agente (no en el sandbox). Mantén los secretos fuera de los prompts y los registros.
- Para un modelo de amenazas más amplio y listas de verificación, consulta [Seguridad](/es/gateway/security).

## Formato (compatible con AgentSkills + Pi)

`SKILL.md` debe incluir al menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notas:

- Seguimos la especificación de AgentSkills para el diseño/la intención.
- El analizador usado por el agente integrado solo admite claves de frontmatter de **una sola línea**.
- `metadata` debe ser un **objeto JSON de una sola línea**.
- Usa `{baseDir}` en las instrucciones para referenciar la ruta de la carpeta de la Skill.
- Claves opcionales de frontmatter:
  - `homepage` — URL mostrada como “Website” en la UI de Skills de macOS (también compatible mediante `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predeterminado: `true`). Cuando es `true`, la Skill se expone como comando con barra para el usuario.
  - `disable-model-invocation` — `true|false` (predeterminado: `false`). Cuando es `true`, la Skill se excluye del prompt del modelo (sigue disponible mediante invocación del usuario).
  - `command-dispatch` — `tool` (opcional). Cuando se establece en `tool`, el comando con barra omite el modelo y se envía directamente a una herramienta.
  - `command-tool` — nombre de la herramienta que se invoca cuando está establecido `command-dispatch: tool`.
  - `command-arg-mode` — `raw` (predeterminado). Para el envío a herramientas, reenvía la cadena de argumentos en bruto a la herramienta (sin análisis del núcleo).

    La herramienta se invoca con parámetros:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Control (filtros en tiempo de carga)

OpenClaw **filtra Skills en tiempo de carga** usando `metadata` (JSON de una sola línea):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campos bajo `metadata.openclaw`:

- `always: true` — incluir siempre la Skill (omitir otros controles).
- `emoji` — emoji opcional usado por la UI de Skills de macOS.
- `homepage` — URL opcional mostrada como “Website” en la UI de Skills de macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Si se establece, la Skill solo es elegible en esos sistemas operativos.
- `requires.bins` — lista; cada uno debe existir en `PATH`.
- `requires.anyBins` — lista; al menos uno debe existir en `PATH`.
- `requires.env` — lista; la variable de entorno debe existir **o** proporcionarse en la configuración.
- `requires.config` — lista de rutas de `openclaw.json` que deben ser truthy.
- `primaryEnv` — nombre de la variable de entorno asociada con `skills.entries.<name>.apiKey`.
- `install` — matriz opcional de especificaciones de instalador usada por la UI de Skills de macOS (brew/node/go/uv/download).

Los bloques heredados `metadata.clawdbot` siguen aceptándose cuando
`metadata.openclaw` está ausente, por lo que las Skills instaladas más antiguas conservan sus
controles de dependencias e indicaciones de instalador. Las Skills nuevas y actualizadas deben usar
`metadata.openclaw`.

Nota sobre el sandboxing:

- `requires.bins` se comprueba en el **host** en tiempo de carga de la Skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**.
  Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada).
  `setupCommand` se ejecuta una vez después de que se crea el contenedor.
  Las instalaciones de paquetes también requieren salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
  Ejemplo: la Skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize`
  en el contenedor sandbox para ejecutarse allí.

Ejemplo de instalador:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Notas:

- Si se enumeran varios instaladores, el gateway elige una sola opción preferida (**brew** cuando está disponible, en caso contrario node).
- Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
- Las especificaciones de instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
- Las instalaciones de node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun).
  Esto solo afecta las **instalaciones de Skills**; el tiempo de ejecución de Gateway debe seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
- La selección de instalador respaldada por Gateway se basa en preferencias, no solo en node:
  cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando
  `skills.install.preferBrew` está habilitado y existe `brew`, luego `uv`, luego el
  gestor de node configurado y después otros respaldos como `go` o `download`.
- Si todas las especificaciones de instalación son `download`, OpenClaw muestra todas las opciones de descarga
  en lugar de contraerlas a un único instalador preferido.
- Instalaciones de Go: si `go` no existe y `brew` está disponible, el gateway instala primero Go mediante Homebrew y establece `GOBIN` en `bin` de Homebrew cuando es posible.
- Instalaciones por descarga: `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta archivo comprimido), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

Si no hay `metadata.openclaw`, la Skill siempre es elegible (a menos que
esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para Skills incluidas).

## Sobrescrituras de configuración (`~/.openclaw/openclaw.json`)

Las Skills incluidas/administradas pueden activarse o desactivarse y recibir valores de entorno:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena en texto plano
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Nota: si el nombre de la Skill contiene guiones, pon la clave entre comillas (JSON5 permite claves entre comillas).

Si quieres generación/edición de imágenes estándar dentro del propio OpenClaw, usa la herramienta central
`image_generate` con `agents.defaults.imageGenerationModel` en lugar de una
Skill incluida. Los ejemplos de Skills aquí son para flujos personalizados o de terceros.

Para análisis nativo de imágenes, usa la herramienta `image` con `agents.defaults.imageModel`.
Para generación/edición nativa de imágenes, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, agrega también la autenticación o clave de API de ese proveedor.

Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada. Si una Skill define
`metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

Reglas:

- `enabled: false` desactiva la Skill incluso si está incluida o instalada.
- `env`: se inyecta **solo si** la variable no está ya establecida en el proceso.
- `apiKey`: atajo práctico para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena en texto plano o un objeto SecretRef (`{ source, provider, id }`).
- `config`: contenedor opcional para campos personalizados por Skill; las claves personalizadas deben ir aquí.
- `allowBundled`: lista de permitidos opcional solo para Skills **incluidas**. Si se establece, solo
  las Skills incluidas en la lista son elegibles (las Skills administradas/del espacio de trabajo no se ven afectadas).

## Inyección de entorno (por ejecución de agente)

Cuando empieza una ejecución de agente, OpenClaw:

1. Lee los metadatos de la Skill.
2. Aplica cualquier `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Construye el prompt del sistema con las Skills **elegibles**.
4. Restaura el entorno original cuando termina la ejecución.

Esto está **limitado a la ejecución del agente**, no a un entorno de shell global.

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea elegible como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolvedor nativo de Skills mientras
OpenClaw sigue controlando la precedencia, las listas de permitidos por agente, el control y la
inyección de env/claves de API de `skills.entries.*`. Otros backends CLI usan solo el
catálogo del prompt.

## Instantánea de sesión (rendimiento)

OpenClaw toma una instantánea de las Skills elegibles **cuando empieza una sesión** y reutiliza esa lista en los turnos posteriores de la misma sesión. Los cambios en Skills o configuración surten efecto en la siguiente sesión nueva.

Las Skills también pueden actualizarse a mitad de la sesión cuando el observador de Skills está habilitado o cuando aparece un nuevo Node remoto elegible (ver abajo). Piensa en esto como una **recarga en caliente**: la lista actualizada se recoge en el siguiente turno del agente.

Si la lista de permitidos efectiva de Skills del agente cambia para esa sesión, OpenClaw
actualiza la instantánea para que las Skills visibles permanezcan alineadas con el
agente actual.

## Nodes macOS remotos (Gateway Linux)

Si Gateway se está ejecutando en Linux pero hay un **Node macOS** conectado **con `system.run` permitido** (la seguridad de aprobaciones de Exec no está configurada en `deny`), OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando los binarios requeridos están presentes en ese Node. El agente debe ejecutar esas Skills mediante la herramienta `exec` con `host=node`.

Esto depende de que el Node informe su compatibilidad de comandos y de una sonda de binarios mediante `system.run`. Si el Node macOS se desconecta después, las Skills siguen visibles; las invocaciones pueden fallar hasta que el Node se vuelva a conectar.

## Observador de Skills (actualización automática)

De forma predeterminada, OpenClaw observa las carpetas de Skills y actualiza la instantánea de Skills cuando cambian los archivos `SKILL.md`. Configúralo en `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impacto en tokens (lista de Skills)

Cuando las Skills son elegibles, OpenClaw inyecta una lista XML compacta de Skills disponibles en el prompt del sistema (mediante `formatSkillsForPrompt` en `pi-coding-agent`). El costo es determinista:

- **Sobrecarga base (solo cuando hay ≥1 Skill):** 195 caracteres.
- **Por Skill:** 97 caracteres + la longitud de los valores XML escapados de `<name>`, `<description>` y `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- El escape XML expande `& < > " '` a entidades (`&amp;`, `&lt;`, etc.), aumentando la longitud.
- El recuento de tokens varía según el tokenizador del modelo. Una estimación aproximada al estilo OpenAI es ~4 caracteres/token, así que **97 caracteres ≈ 24 tokens** por Skill, además de las longitudes reales de tus campos.

## Ciclo de vida de las Skills administradas

OpenClaw incluye un conjunto base de Skills como **Skills incluidas** como parte de la
instalación (paquete npm o OpenClaw.app). `~/.openclaw/skills` existe para
sobrescrituras locales (por ejemplo, fijar/parchear una Skill sin cambiar la copia
incluida). Las Skills del espacio de trabajo pertenecen al usuario y sobrescriben ambas en caso de conflicto de nombres.

## Referencia de configuración

Consulta [Configuración de Skills](/es/tools/skills-config) para ver el esquema completo de configuración.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Creación de Skills](/es/tools/creating-skills) — crear Skills personalizadas
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos con barra](/es/tools/slash-commands) — todos los comandos con barra disponibles
- [Plugins](/es/tools/plugin) — descripción general del sistema de Plugins
