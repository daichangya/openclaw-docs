---
read_when:
    - Añadiendo o modificando Skills
    - Cambiando la restricción de Skills o las reglas de carga
summary: 'Skills: gestionadas frente a workspace, reglas de restricción y cableado de configuración/entorno'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw usa carpetas de Skills compatibles con **[AgentSkills](https://agentskills.io)** para enseñar al agente a usar herramientas. Cada Skill es un directorio que contiene un `SKILL.md` con frontmatter YAML e instrucciones. OpenClaw carga **Skills incluidas** más anulaciones locales opcionales y las filtra en tiempo de carga según el entorno, la configuración y la presencia de binarios.

## Ubicaciones y precedencia

OpenClaw carga Skills desde estas fuentes:

1. **Carpetas adicionales de Skills**: configuradas con `skills.load.extraDirs`
2. **Skills incluidas**: enviadas con la instalación (paquete npm o OpenClaw.app)
3. **Skills gestionadas/locales**: `~/.openclaw/skills`
4. **Skills personales del agente**: `~/.agents/skills`
5. **Skills del agente del proyecto**: `<workspace>/.agents/skills`
6. **Skills del workspace**: `<workspace>/skills`

Si hay conflicto de nombres de Skills, la precedencia es:

`<workspace>/skills` (más alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluidas → `skills.load.extraDirs` (más baja)

## Skills por agente frente a compartidas

En configuraciones de **varios agentes**, cada agente tiene su propio workspace. Eso significa:

- Las **Skills por agente** viven en `<workspace>/skills` solo para ese agente.
- Las **Skills del agente del proyecto** viven en `<workspace>/.agents/skills` y se aplican a
  ese workspace antes de la carpeta normal `skills/` del workspace.
- Las **Skills personales del agente** viven en `~/.agents/skills` y se aplican en todos los
  workspaces de esa máquina.
- Las **Skills compartidas** viven en `~/.openclaw/skills` (gestionadas/locales) y son visibles
  para **todos los agentes** en la misma máquina.
- También se pueden añadir **carpetas compartidas** mediante `skills.load.extraDirs` (precedencia más
  baja) si quieres un paquete común de Skills usado por varios agentes.

Si el mismo nombre de Skill existe en más de un lugar, se aplica la precedencia
habitual: gana el workspace, luego las Skills del agente del proyecto, luego las Skills personales del agente,
después las gestionadas/locales, luego las incluidas y, por último, los directorios adicionales.

## Listas de permitidos de Skills por agente

La **ubicación** de la Skill y la **visibilidad** de la Skill son controles separados.

- La ubicación/precedencia decide qué copia gana cuando una Skill tiene el mismo nombre.
- Las listas de permitidos por agente deciden qué Skills visibles puede usar realmente un agente.

Usa `agents.defaults.skills` como base compartida y luego anula por agente con
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

- Omite `agents.defaults.skills` para Skills sin restricciones de forma predeterminada.
- Omite `agents.list[].skills` para heredar `agents.defaults.skills`.
- Establece `agents.list[].skills: []` para no tener Skills.
- Una lista no vacía en `agents.list[].skills` es el conjunto final para ese agente; no
  se fusiona con los valores predeterminados.

OpenClaw aplica el conjunto efectivo de Skills del agente en toda la construcción del prompt,
el descubrimiento de comandos slash de Skills, la sincronización del sandbox y las instantáneas de Skills.

## Plugins + Skills

Los plugins pueden incluir sus propias Skills listando directorios `skills` en
`openclaw.plugin.json` (rutas relativas a la raíz del Plugin). Las Skills del Plugin se cargan
cuando el Plugin está habilitado. Hoy esos directorios se fusionan en la misma ruta de baja precedencia que `skills.load.extraDirs`, de modo que una Skill incluida,
gestionada, de agente o de workspace con el mismo nombre las anula.
Puedes restringirlas mediante `metadata.openclaw.requires.config` en la entrada de configuración del Plugin.
Consulta [Plugins](/es/tools/plugin) para descubrimiento/configuración y [Herramientas](/es/tools) para la
superficie de herramientas que esas Skills enseñan.

## Skill Workshop

El Plugin opcional y experimental Skill Workshop puede crear o actualizar Skills del workspace
a partir de procedimientos reutilizables observados durante el trabajo del agente. Está deshabilitado
de forma predeterminada y debe habilitarse explícitamente mediante
`plugins.entries.skill-workshop`.

Skill Workshop escribe solo en `<workspace>/skills`, analiza el contenido generado,
admite aprobación pendiente o escrituras automáticas seguras, pone en cuarentena
propuestas inseguras y actualiza la instantánea de Skills después de escrituras exitosas para que las nuevas
Skills puedan estar disponibles sin reiniciar el Gateway.

Úsalo cuando quieras que correcciones como “la próxima vez, verifica la atribución del GIF” o
flujos de trabajo valiosos como listas de verificación de QA multimedia se conviertan en instrucciones procedimentales duraderas. Empieza con aprobación pendiente; usa escrituras automáticas solo en workspaces de confianza después de revisar sus propuestas. Guía completa:
[Plugin Skill Workshop](/es/plugins/skill-workshop).

## ClawHub (instalación + sincronización)

ClawHub es el registro público de Skills para OpenClaw. Explóralo en
[https://clawhub.ai](https://clawhub.ai). Usa comandos nativos `openclaw skills`
para descubrir/instalar/actualizar Skills, o la CLI separada `clawhub` cuando
necesites flujos de publicación/sincronización.
Guía completa: [ClawHub](/es/tools/clawhub).

Flujos comunes:

- Instalar una Skill en tu workspace:
  - `openclaw skills install <skill-slug>`
- Actualizar todas las Skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (analizar + publicar actualizaciones):
  - `clawhub sync --all`

La instalación nativa `openclaw skills install` instala en el directorio `skills/`
del workspace activo. La CLI separada `clawhub` también instala en `./skills` dentro de tu
directorio de trabajo actual (o usa como respaldo el workspace configurado de OpenClaw).
OpenClaw lo recoge como `<workspace>/skills` en la siguiente sesión.

## Notas de seguridad

- Trata las Skills de terceros como **código no confiable**. Léelas antes de habilitarlas.
- Prefiere ejecuciones con sandbox para entradas no confiables y herramientas de riesgo. Consulta [Sandboxing](/es/gateway/sandboxing).
- El descubrimiento de Skills en el workspace y en directorios adicionales solo acepta raíces de Skills y archivos `SKILL.md` cuyo realpath resuelto permanezca dentro de la raíz configurada.
- Las instalaciones de dependencias de Skills respaldadas por Gateway (`skills.install`, incorporación y la IU de configuración de Skills) ejecutan el escáner integrado de código peligroso antes de ejecutar metadatos del instalador. Los hallazgos `critical` bloquean de forma predeterminada a menos que quien llama establezca explícitamente la anulación de peligro; los hallazgos sospechosos solo generan advertencias.
- `openclaw skills install <slug>` es diferente: descarga una carpeta de Skill de ClawHub al workspace y no usa la ruta de metadatos del instalador anterior.
- `skills.entries.*.env` y `skills.entries.*.apiKey` inyectan secretos en el proceso **host**
  para ese turno del agente (no en el sandbox). Mantén los secretos fuera de los prompts y de los registros.
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

- Seguimos la especificación de AgentSkills para diseño/intención.
- El analizador usado por el agente integrado admite solo claves de frontmatter **de una sola línea**.
- `metadata` debe ser un **objeto JSON de una sola línea**.
- Usa `{baseDir}` en las instrucciones para hacer referencia a la ruta de la carpeta de la Skill.
- Claves opcionales del frontmatter:
  - `homepage` — URL mostrada como “Sitio web” en la IU de Skills de macOS (también compatible mediante `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (predeterminado: `true`). Cuando es `true`, la Skill se expone como un comando slash del usuario.
  - `disable-model-invocation` — `true|false` (predeterminado: `false`). Cuando es `true`, la Skill se excluye del prompt del modelo (sigue disponible mediante invocación del usuario).
  - `command-dispatch` — `tool` (opcional). Cuando se establece en `tool`, el comando slash omite el modelo y se despacha directamente a una herramienta.
  - `command-tool` — nombre de la herramienta que se invocará cuando `command-dispatch: tool` esté establecido.
  - `command-arg-mode` — `raw` (predeterminado). Para el despacho de herramientas, reenvía la cadena de argumentos en bruto a la herramienta (sin análisis del núcleo).

    La herramienta se invoca con parámetros:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Restricción (filtros en tiempo de carga)

OpenClaw **filtra las Skills en tiempo de carga** usando `metadata` (JSON de una sola línea):

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

Campos en `metadata.openclaw`:

- `always: true` — incluir siempre la Skill (omite otras restricciones).
- `emoji` — emoji opcional usado por la IU de Skills de macOS.
- `homepage` — URL opcional mostrada como “Sitio web” en la IU de Skills de macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Si se establece, la Skill solo es elegible en esos sistemas operativos.
- `requires.bins` — lista; cada binario debe existir en `PATH`.
- `requires.anyBins` — lista; al menos uno debe existir en `PATH`.
- `requires.env` — lista; la variable de entorno debe existir **o** estar proporcionada en la configuración.
- `requires.config` — lista de rutas de `openclaw.json` que deben ser verdaderas.
- `primaryEnv` — nombre de variable de entorno asociado con `skills.entries.<name>.apiKey`.
- `install` — arreglo opcional de especificaciones de instalador usado por la IU de Skills de macOS (brew/node/go/uv/download).

Nota sobre sandboxing:

- `requires.bins` se comprueba en el **host** en tiempo de carga de la Skill.
- Si un agente está en sandbox, el binario también debe existir **dentro del contenedor**.
  Instálalo mediante `agents.defaults.sandbox.docker.setupCommand` (o una imagen personalizada).
  `setupCommand` se ejecuta una vez después de que se crea el contenedor.
  Las instalaciones de paquetes también requieren salida de red, un sistema de archivos raíz escribible y un usuario root en el sandbox.
  Ejemplo: la Skill `summarize` (`skills/summarize/SKILL.md`) necesita la CLI `summarize`
  en el contenedor del sandbox para ejecutarse allí.

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

- Si se enumeran varios instaladores, el Gateway elige una única opción preferida (**brew** cuando está disponible; en caso contrario, node).
- Si todos los instaladores son `download`, OpenClaw enumera cada entrada para que puedas ver los artefactos disponibles.
- Las especificaciones de instalador pueden incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opciones por plataforma.
- Las instalaciones con Node respetan `skills.install.nodeManager` en `openclaw.json` (predeterminado: npm; opciones: npm/pnpm/yarn/bun).
  Esto solo afecta a las **instalaciones de Skills**; el tiempo de ejecución del Gateway debe seguir siendo Node
  (Bun no se recomienda para WhatsApp/Telegram).
- La selección del instalador respaldada por Gateway se basa en preferencias, no solo en node:
  cuando las especificaciones de instalación mezclan tipos, OpenClaw prefiere Homebrew cuando
  `skills.install.preferBrew` está habilitado y existe `brew`, luego `uv`, luego el
  gestor de node configurado y después otros respaldos como `go` o `download`.
- Si todas las especificaciones de instalación son `download`, OpenClaw muestra todas las opciones de descarga
  en lugar de reducirlas a un único instalador preferido.
- Instalaciones con Go: si falta `go` y `brew` está disponible, el Gateway instala primero Go mediante Homebrew y establece `GOBIN` en el `bin` de Homebrew cuando es posible.
- Instalaciones con descarga: `url` (obligatorio), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (predeterminado: automático cuando se detecta un archivo), `stripComponents`, `targetDir` (predeterminado: `~/.openclaw/tools/<skillKey>`).

Si no hay `metadata.openclaw`, la Skill siempre es elegible (a menos que
esté deshabilitada en la configuración o bloqueada por `skills.allowBundled` para Skills incluidas).

## Anulaciones de configuración (`~/.openclaw/openclaw.json`)

Las Skills incluidas/gestionadas pueden activarse o desactivarse y recibir valores de entorno:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena en texto sin formato
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

Si quieres generación/edición de imágenes estándar dentro de OpenClaw, usa la
herramienta principal `image_generate` con `agents.defaults.imageGenerationModel` en lugar de una
Skill incluida. Los ejemplos de Skills aquí son para flujos personalizados o de terceros.

Para análisis nativo de imágenes, usa la herramienta `image` con `agents.defaults.imageModel`.
Para generación/edición nativa de imágenes, usa `image_generate` con
`agents.defaults.imageGenerationModel`. Si eliges `openai/*`, `google/*`,
`fal/*` u otro modelo de imagen específico de proveedor, añade también la autenticación/clave API
de ese proveedor.

Las claves de configuración coinciden con el **nombre de la Skill** de forma predeterminada. Si una Skill define
`metadata.openclaw.skillKey`, usa esa clave en `skills.entries`.

Reglas:

- `enabled: false` deshabilita la Skill incluso si está incluida/instalada.
- `env`: se inyecta **solo si** la variable aún no está establecida en el proceso.
- `apiKey`: comodidad para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena en texto sin formato o un objeto SecretRef (`{ source, provider, id }`).
- `config`: contenedor opcional para campos personalizados por Skill; las claves personalizadas deben vivir aquí.
- `allowBundled`: lista de permitidos opcional solo para Skills **incluidas**. Si se establece, solo
  las Skills incluidas en la lista son elegibles (las Skills gestionadas/del workspace no se ven afectadas).

## Inyección de entorno (por ejecución de agente)

Cuando comienza una ejecución de agente, OpenClaw:

1. Lee los metadatos de la Skill.
2. Aplica cualquier `skills.entries.<key>.env` o `skills.entries.<key>.apiKey` a
   `process.env`.
3. Construye el system prompt con las Skills **elegibles**.
4. Restaura el entorno original después de que termina la ejecución.

Esto tiene **alcance de la ejecución del agente**, no de un entorno de shell global.

Para el backend incluido `claude-cli`, OpenClaw también materializa la misma
instantánea elegible como un Plugin temporal de Claude Code y la pasa con
`--plugin-dir`. Claude Code puede entonces usar su resolvedor nativo de Skills mientras
OpenClaw sigue siendo propietario de la precedencia, las listas de permitidos por agente, la restricción y la
inyección de entorno/clave API de `skills.entries.*`. Otros backends CLI usan solo el
catálogo del prompt.

## Instantánea de sesión (rendimiento)

OpenClaw toma una instantánea de las Skills elegibles **cuando comienza una sesión** y reutiliza esa lista en los turnos posteriores de la misma sesión. Los cambios en Skills o en la configuración surten efecto en la siguiente sesión nueva.

Las Skills también pueden actualizarse en mitad de la sesión cuando el watcher de Skills está habilitado o cuando aparece un nuevo nodo remoto elegible (consulta más abajo). Piensa en esto como una **recarga en caliente**: la lista actualizada se recoge en el siguiente turno del agente.

Si cambia la lista de permitidos efectiva de Skills del agente para esa sesión, OpenClaw
actualiza la instantánea para que las Skills visibles sigan alineadas con el
agente actual.

## Nodos remotos de macOS (Gateway en Linux)

Si el Gateway se está ejecutando en Linux pero hay un **nodo macOS** conectado **con `system.run` permitido** (la seguridad de aprobaciones de exec no está establecida en `deny`), OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando los binarios requeridos están presentes en ese nodo. El agente debe ejecutar esas Skills mediante la herramienta `exec` con `host=node`.

Esto depende de que el nodo informe su compatibilidad con comandos y de una sonda de binarios mediante `system.run`. Si el nodo macOS se desconecta más tarde, las Skills permanecen visibles; las invocaciones pueden fallar hasta que el nodo vuelva a conectarse.

## Watcher de Skills (actualización automática)

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

Cuando las Skills son elegibles, OpenClaw inyecta una lista XML compacta de Skills disponibles en el system prompt (mediante `formatSkillsForPrompt` en `pi-coding-agent`). El costo es determinista:

- **Sobrecarga base (solo cuando hay ≥1 Skill):** 195 caracteres.
- **Por Skill:** 97 caracteres + la longitud de los valores escapados en XML de `<name>`, `<description>` y `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- El escape XML expande `& < > " '` en entidades (`&amp;`, `&lt;`, etc.), aumentando la longitud.
- El conteo de tokens varía según el tokenizador del modelo. Una estimación aproximada al estilo OpenAI es ~4 caracteres/token, así que **97 caracteres ≈ 24 tokens** por Skill más la longitud real de tus campos.

## Ciclo de vida de las Skills gestionadas

OpenClaw incluye un conjunto base de Skills como **Skills incluidas** como parte de la
instalación (paquete npm o OpenClaw.app). `~/.openclaw/skills` existe para
anulaciones locales (por ejemplo, fijar/parchear una Skill sin cambiar la copia
incluida). Las Skills del workspace son propiedad del usuario y anulan ambas en caso de conflicto de nombre.

## Referencia de configuración

Consulta [configuración de Skills](/es/tools/skills-config) para ver el esquema completo de configuración.

## ¿Buscas más Skills?

Explora [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Creación de Skills](/es/tools/creating-skills) — crear Skills personalizadas
- [Configuración de Skills](/es/tools/skills-config) — referencia de configuración de Skills
- [Comandos slash](/es/tools/slash-commands) — todos los comandos slash disponibles
- [Plugins](/es/tools/plugin) — resumen del sistema de plugins
