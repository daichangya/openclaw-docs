---
read_when:
    - Quieres administrar hooks del agente
    - Quieres inspeccionar la disponibilidad de hooks o habilitar hooks del espacio de trabajo
summary: Referencia de la CLI para `openclaw hooks` (hooks del agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Administra hooks del agente (automatizaciones orientadas a eventos para comandos como `/new`, `/reset` y el inicio del gateway).

Ejecutar `openclaw hooks` sin subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/es/automation/hooks)
- Hooks de Plugin: [Hooks de Plugin](/es/plugins/hooks)

## Listar todos los hooks

```bash
openclaw hooks list
```

Lista todos los hooks detectados de los directorios de espacio de trabajo, administrados, extra e incluidos.
El inicio del gateway no carga controladores internos de hooks hasta que al menos un hook interno esté configurado.

**Opciones:**

- `--eligible`: mostrar solo hooks elegibles (requisitos cumplidos)
- `--json`: salida en JSON
- `-v, --verbose`: mostrar información detallada, incluidos los requisitos faltantes

**Salida de ejemplo:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Ejemplo (verbose):**

```bash
openclaw hooks list --verbose
```

Muestra los requisitos faltantes para los hooks no elegibles.

**Ejemplo (JSON):**

```bash
openclaw hooks list --json
```

Devuelve JSON estructurado para uso programático.

## Obtener información de un hook

```bash
openclaw hooks info <name>
```

Muestra información detallada sobre un hook específico.

**Argumentos:**

- `<name>`: nombre del hook o clave del hook (por ejemplo, `session-memory`)

**Opciones:**

- `--json`: salida en JSON

**Ejemplo:**

```bash
openclaw hooks info session-memory
```

**Salida:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Comprobar elegibilidad de hooks

```bash
openclaw hooks check
```

Muestra un resumen del estado de elegibilidad de los hooks (cuántos están listos frente a cuántos no lo están).

**Opciones:**

- `--json`: salida en JSON

**Salida de ejemplo:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Habilitar un hook

```bash
openclaw hooks enable <name>
```

Habilita un hook específico agregándolo a tu configuración (`~/.openclaw/openclaw.json` de forma predeterminada).

**Nota:** Los hooks del espacio de trabajo están deshabilitados de forma predeterminada hasta que se habiliten aquí o en la configuración. Los hooks administrados por Plugins muestran `plugin:<id>` en `openclaw hooks list` y no se pueden habilitar/deshabilitar aquí. En su lugar, habilita/deshabilita el Plugin.

**Argumentos:**

- `<name>`: nombre del hook (por ejemplo, `session-memory`)

**Ejemplo:**

```bash
openclaw hooks enable session-memory
```

**Salida:**

```
✓ Enabled hook: 💾 session-memory
```

**Qué hace:**

- Comprueba si el hook existe y es elegible
- Actualiza `hooks.internal.entries.<name>.enabled = true` en tu configuración
- Guarda la configuración en disco

Si el hook proviene de `<workspace>/hooks/`, este paso de activación explícita es obligatorio antes de que el Gateway lo cargue.

**Después de habilitarlo:**

- Reinicia el gateway para que se recarguen los hooks (reinicio de la app de barra de menú en macOS, o reinicia tu proceso del gateway en desarrollo).

## Deshabilitar un hook

```bash
openclaw hooks disable <name>
```

Deshabilita un hook específico actualizando tu configuración.

**Argumentos:**

- `<name>`: nombre del hook (por ejemplo, `command-logger`)

**Ejemplo:**

```bash
openclaw hooks disable command-logger
```

**Salida:**

```
⏸ Disabled hook: 📝 command-logger
```

**Después de deshabilitarlo:**

- Reinicia el gateway para que se recarguen los hooks

## Notas

- `openclaw hooks list --json`, `info --json` y `check --json` escriben JSON estructurado directamente en stdout.
- Los hooks administrados por Plugins no se pueden habilitar ni deshabilitar aquí; en su lugar, habilita o deshabilita el Plugin propietario.

## Instalar paquetes de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instala paquetes de hooks mediante el instalador unificado de Plugins.

`openclaw hooks install` sigue funcionando como alias de compatibilidad, pero muestra una advertencia de desuso y reenvía a `openclaw plugins install`.

Las especificaciones de npm son **solo de registro** (nombre de paquete + **versión exacta** opcional o **dist-tag**).
Las especificaciones Git/URL/archivo y los rangos semver se rechazan. Las instalaciones de dependencias
se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones simples y `@latest` permanecen en la pista estable. Si npm resuelve
cualquiera de esas opciones a una versión preliminar, OpenClaw se detiene y te pide que des tu conformidad explícita con una
etiqueta de versión preliminar como `@beta`/`@rc` o una versión preliminar exacta.

**Qué hace:**

- Copia el paquete de hooks en `~/.openclaw/hooks/<id>`
- Habilita los hooks instalados en `hooks.internal.entries.*`
- Registra la instalación en `hooks.internal.installs`

**Opciones:**

- `-l, --link`: enlaza un directorio local en lugar de copiarlo (lo agrega a `hooks.internal.load.extraDirs`)
- `--pin`: registra las instalaciones de npm como `name@version` resuelto exacto en `hooks.internal.installs`

**Archivos compatibles:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Ejemplos:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Los paquetes de hooks enlazados se tratan como hooks administrados de un
directorio configurado por el operador, no como hooks del espacio de trabajo.

## Actualizar paquetes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Actualiza los paquetes de hooks basados en npm rastreados mediante el actualizador unificado de Plugins.

`openclaw hooks update` sigue funcionando como alias de compatibilidad, pero muestra una advertencia de desuso y reenvía a `openclaw plugins update`.

**Opciones:**

- `--all`: actualiza todos los paquetes de hooks rastreados
- `--dry-run`: muestra qué cambiaría sin escribir nada

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto recuperado,
OpenClaw muestra una advertencia y pide confirmación antes de continuar. Usa
`--yes` global para omitir prompts en ejecuciones de CI/no interactivas.

## Hooks incluidos

### session-memory

Guarda el contexto de la sesión en memoria cuando emites `/new` o `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Salida:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Ver:** [documentación de session-memory](/es/automation/hooks#session-memory)

### bootstrap-extra-files

Inyecta archivos bootstrap adicionales (por ejemplo, `AGENTS.md` / `TOOLS.md` locales de monorepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Ver:** [documentación de bootstrap-extra-files](/es/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos los eventos de comandos en un archivo de auditoría centralizado.

**Habilitar:**

```bash
openclaw hooks enable command-logger
```

**Salida:** `~/.openclaw/logs/commands.log`

**Ver logs:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Ver:** [documentación de command-logger](/es/automation/hooks#command-logger)

### boot-md

Ejecuta `BOOT.md` cuando se inicia el gateway (después de que se inician los canales).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Ver:** [documentación de boot-md](/es/automation/hooks#boot-md)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Hooks de automatización](/es/automation/hooks)
