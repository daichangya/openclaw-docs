---
read_when:
    - Instalar o configurar plugins
    - Entender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instala, configura y gestiona plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-06T03:13:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2472a3023f3c1c6ee05b0cdc228f6b713cc226a08695b327de8a3ad6973c83
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web,
búsqueda web y más. Algunos plugins son **core** (incluidos con OpenClaw), otros
son **externos** (publicados en npm por la comunidad).

## Inicio rápido

<Steps>
  <Step title="Ver qué está cargado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar un plugin">
    ```bash
    # Desde npm
    openclaw plugins install @openclaw/voice-call

    # Desde un directorio o archivo local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configura en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo del chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito o especificación simple de paquete (primero ClawHub, luego fallback a npm).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te indica
que uses `openclaw doctor --fix`. La única excepción de recuperación es una ruta específica de reinstalación de plugins empaquetados
para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugins:

| Formato     | Cómo funciona                                                       | Ejemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso       | Plugins oficiales, paquetes npm de la comunidad               |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Plugin Bundles](/es/plugins/bundles) para ver detalles de los bundles.

Si estás escribiendo un plugin native, empieza con [Creación de plugins](/es/plugins/building-plugins)
y el [Resumen del Plugin SDK](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete                | Documentación                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)   |

### Core (incluidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados de forma predeterminada)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — memory search empaquetado (predeterminado mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo de instalación bajo demanda con recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados de forma predeterminada)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador empaquetado para la herramienta browser, la CLI `openclaw browser`, el método de gateway `browser.request`, el runtime del navegador y el servicio predeterminado de control del navegador (habilitado de forma predeterminada; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente de VS Code Copilot Proxy (deshabilitado de forma predeterminada)
  </Accordion>
</AccordionGroup>

¿Buscas plugins de terceros? Consulta [Community Plugins](/es/plugins/community).

## Configuración

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)                           |
| `allow`          | Lista permitida de plugins (opcional)                               |
| `deny`           | Lista denegada de plugins (opcional; denegar prevalece)                     |
| `load.paths`     | Archivos/directorios adicionales de plugins                            |
| `slots`          | Selectores de slots exclusivos (por ejemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por plugin                               |

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se ejecuta con
observación de configuración + reinicio en proceso habilitados (la ruta predeterminada `openclaw gateway`), ese
reinicio suele realizarse automáticamente un momento después de que se escriba la configuración.

<Accordion title="Estados del plugin: deshabilitado vs faltante vs no válido">
  - **Deshabilitado**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Faltante**: la configuración hace referencia a un id de plugin que el descubrimiento no encontró.
  - **No válido**: el plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw escanea los plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths`: rutas explícitas de archivo o directorio.
  </Step>

  <Step title="Extensiones del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensiones globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empaquetados">
    Incluidos con OpenClaw. Muchos están habilitados de forma predeterminada (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins originados en el workspace están **deshabilitados de forma predeterminada** (deben habilitarse explícitamente)
- Los plugins empaquetados siguen el conjunto integrado habilitado por defecto, salvo sobrescritura
- Los slots exclusivos pueden forzar la habilitación del plugin seleccionado para ese slot

## Slots de plugins (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" para deshabilitar
      contextEngine: "legacy", // o un id de plugin
    },
  },
}
```

| Slot            | Qué controla      | Predeterminado             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memoria activo  | `memory-core`       |
| `contextEngine` | Motor de contexto activo | `legacy` (integrado) |

## Referencia de la CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas de detalle por plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (primero ClawHub, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir instalación existente
openclaw plugins install <path>            # instalar desde ruta local
openclaw plugins install -l <path>         # enlazar (sin copiar) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar especificación npm resuelta exacta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # actualizar un plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins empaquetados vienen con OpenClaw. Muchos están habilitados de forma predeterminada (por ejemplo,
proveedores de modelos empaquetados, proveedores de voz empaquetados y el plugin de navegador
empaquetado). Otros plugins empaquetados aún necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe in situ un plugin o paquete de hooks ya instalado.
No es compatible con `--link`, que reutiliza la ruta de origen en lugar de
copiar sobre un destino de instalación gestionado.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace conservan metadatos de origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones
y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aun así
no omite bloqueos de política `before_install` de plugins ni bloqueos por fallo del escaneo.

Este indicador de CLI se aplica solo a flujos de instalación/actualización de plugins. Las
instalaciones de dependencias de Skills respaldadas por gateway usan en su lugar la anulación de solicitud correspondiente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo independiente de descarga/instalación de Skills desde ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar plugins.
La compatibilidad actual de runtime incluye Skills de bundles, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y
`lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles con Codex.

`openclaw plugins inspect <id>` también informa capacidades detectadas del bundle, además de
entradas MCP y LSP server compatibles o no compatibles para plugins respaldados por bundles.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude de
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o ruta a
`marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio GitHub
o una URL git. En marketplaces remotos, las entradas de plugins deben permanecer dentro del
repositorio clonado del marketplace y usar solo fuentes de ruta relativa.

Consulta la [referencia de la CLI `openclaw plugins`](/cli/plugins) para obtener todos los detalles.

## Resumen de la API de plugins

Los plugins native exportan un objeto de entrada que expone `register(api)`. Los
plugins antiguos aún pueden usar `activate(api)` como alias heredado, pero los nuevos plugins deberían
usar `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw carga el objeto de entrada y llama a `register(api)` durante la
activación del plugin. El cargador aún recurre a `activate(api)` para plugins antiguos,
pero los plugins empaquetados y los nuevos plugins externos deben tratar `register` como el
contrato público.

Métodos comunes de registro:

| Método                                  | Qué registra           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta de agente                  |
| `registerHook` / `on(...)`              | Hooks del ciclo de vida             |
| `registerSpeechProvider`                | Texto a voz / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming               |
| `registerRealtimeVoiceProvider`         | Voz en tiempo real dúplex       |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio        |
| `registerImageGenerationProvider`       | Generación de imágenes            |
| `registerMusicGenerationProvider`       | Generación de música            |
| `registerVideoGenerationProvider`       | Generación de video            |
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web |
| `registerWebSearchProvider`             | Búsqueda web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI                |
| `registerContextEngine`                 | Motor de contexto              |
| `registerService`                       | Servicio en segundo plano          |

Comportamiento de guardas de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Para ver el comportamiento completo de hooks tipados, consulta [Resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — crea tu propio plugin
- [Plugin Bundles](/es/plugins/bundles) — compatibilidad de bundles con Codex/Claude/Cursor
- [Manifiesto del plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registro de herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un plugin
- [Internals de plugins](/es/plugins/architecture) — modelo de capacidades y pipeline de carga
- [Community Plugins](/es/plugins/community) — listados de terceros
