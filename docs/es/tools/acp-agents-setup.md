---
read_when:
    - Instalar o configurar el harness `acpx` para Claude Code / Codex / Gemini CLI
    - Habilitar el puente MCP `plugin-tools` o `OpenClaw-tools`
    - Configurar los modos de permisos de ACP
summary: 'Configurar agentes ACP: configuración del harness `acpx`, configuración del Plugin y permisos'
title: Agentes ACP — configuración
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Para ver la descripción general, el manual operativo y los conceptos, consulta [Agentes ACP](/es/tools/acp-agents).

Las secciones siguientes cubren la configuración del harness `acpx`, la configuración del Plugin para los puentes MCP y la configuración de permisos.

## Compatibilidad actual del harness `acpx`

Alias actuales de harness integrados en `acpx`:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Cuando OpenClaw usa el backend `acpx`, prefiere estos valores para `agentId` a menos que tu configuración de `acpx` defina alias de agente personalizados.
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, sustituye el comando del agente `cursor` en tu configuración de `acpx` en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de `acpx` también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de `acpx` (no la ruta normal de `agentId` de OpenClaw).

## Configuración requerida

Línea base principal de ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; establece false para pausar el despacho de ACP mientras mantienes los controles /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de asociación de hilos es específica del adaptador de canal. Ejemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la creación de ACP asociada a hilos no funciona, primero verifica la flag de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Las asociaciones a la conversación actual no requieren la creación de hilos secundarios. Requieren un contexto de conversación activo y un adaptador de canal que exponga asociaciones de conversación de ACP.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend `acpx`

Las instalaciones nuevas incluyen el Plugin de runtime `acpx` habilitado de forma predeterminada, por lo que ACP
normalmente funciona sin un paso manual de instalación del Plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a un checkout local de desarrollo, usa la ruta explícita del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación desde espacio de trabajo local durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Después verifica el estado del backend:

```text
/acp doctor
```

### Configuración de comando y versión de `acpx`

De forma predeterminada, el Plugin `acpx` incluido usa su binario fijado local al Plugin (`node_modules/.bin/acpx` dentro del paquete del Plugin). En el arranque, registra el backend como no listo y un trabajo en segundo plano verifica `acpx --version`; si el binario falta o no coincide, ejecuta `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar. El Gateway sigue sin bloquearse durante todo el proceso.

Sustituye el comando o la versión en la configuración del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` acepta una ruta absoluta, una ruta relativa (resuelta desde el espacio de trabajo de OpenClaw) o un nombre de comando.
- `expectedVersion: "any"` deshabilita la coincidencia estricta de versión.
- Las rutas `command` personalizadas deshabilitan la instalación automática local al Plugin.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las
dependencias de runtime de `acpx` (binarios específicos de la plataforma) se instalan automáticamente
mediante un hook de postinstalación. Si la instalación automática falla, el Gateway sigue iniciando
con normalidad e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

De forma predeterminada, las sesiones ACPX **no** exponen las herramientas registradas por Plugins de OpenClaw al
harness ACP.

Si quieres que agentes ACP como Codex o Claude Code puedan llamar a herramientas de Plugins de
OpenClaw instalados, como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap
  de la sesión ACPX.
- Expone las herramientas de Plugin ya registradas por Plugins de OpenClaw instalados y habilitados.
- Mantiene la función explícita y desactivada de forma predeterminada.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a herramientas de Plugin ya activas en el Gateway.
- Trata esto como el mismo límite de confianza que permitir que esos Plugins se ejecuten en
  OpenClaw.
- Revisa los Plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de Plugin es una
comodidad adicional opcional, no un sustituto de la configuración genérica del servidor MCP.

### Puente MCP de herramientas de OpenClaw

De forma predeterminada, las sesiones ACPX tampoco exponen las herramientas integradas de OpenClaw mediante
MCP. Habilita el puente separado de herramientas principales cuando un agente ACP necesite herramientas
integradas seleccionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-tools` en el bootstrap
  de la sesión ACPX.
- Expone herramientas integradas seleccionadas de OpenClaw. El servidor inicial expone `cron`.
- Mantiene la exposición de herramientas principales explícita y desactivada de forma predeterminada.

### Configuración del tiempo de espera del runtime

El Plugin `acpx` incluido establece por defecto un tiempo de espera de 120 segundos
para los turnos del runtime embebido. Esto da a harnesses más lentos, como Gemini CLI, suficiente tiempo para completar
el arranque e inicialización de ACP. Sustitúyelo si tu host necesita un límite
de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el Gateway después de cambiar este valor.

### Configuración del agente de sondeo de estado

El Plugin `acpx` incluido sondea un agente de harness mientras decide si el
backend de runtime embebido está listo. Si `acp.allowedAgents` está establecido, el valor predeterminado es
el primer agente permitido; en caso contrario, el valor predeterminado es `codex`. Si tu implementación
necesita un agente ACP diferente para las comprobaciones de estado, establece explícitamente el agente de sondeo:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan de forma no interactiva: no hay TTY para aprobar o denegar solicitudes de permisos de escritura de archivos y ejecución de shell. El Plugin `acpx` proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos del harness ACPX son independientes de las aprobaciones de `exec` de OpenClaw y de las flags de omisión del proveedor del backend CLI, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de harness para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del harness sin solicitar confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y `exec` requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permisos.                      |

### `nonInteractivePermissions`

Controla qué sucede cuando se mostraría una solicitud de permisos pero no hay un TTY interactivo disponible (lo que siempre ocurre en las sesiones ACP).

| Valor  | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**            |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación elegante).   |

### Configuración

Establece estos valores mediante la configuración del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el Gateway después de cambiar estos valores.

> **Importante:** OpenClaw usa actualmente `permissionMode=approve-reads` y `nonInteractivePermissions=fail` como valores predeterminados. En sesiones ACP no interactivas, cualquier escritura o `exec` que active una solicitud de permisos puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden de forma elegante en lugar de fallar.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — descripción general, manual operativo, conceptos
- [Subagentes](/es/tools/subagents)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
