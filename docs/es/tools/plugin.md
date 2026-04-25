---
read_when:
    - Instalar o configurar plugins
    - Comprender las reglas de descubrimiento y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y gestionar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T13:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos, harnesses de agente, herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con OpenClaw) y otros son **externos** (publicados en npm por la comunidad).

## Inicio rápido

<Steps>
  <Step title="Ver qué está cargado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar un Plugin">
    ```bash
    # Desde npm
    openclaw plugins install @openclaw/voice-call

    # Desde un directorio local o archivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configúralo en `plugins.entries.\<id\>.config` en tu archivo de configuración.

  </Step>
</Steps>

Si prefieres control nativo por chat, habilita `commands.plugins: true` y usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>` explícito o especificación simple de paquete (ClawHub primero, luego npm como respaldo).

Si la configuración no es válida, la instalación normalmente falla de forma cerrada y te dirige a `openclaw doctor --fix`. La única excepción de recuperación es una ruta limitada de reinstalación de plugins empaquetados para plugins que optan por `openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el árbol de dependencias de runtime de cada Plugin empaquetado. Cuando un Plugin empaquetado propiedad de OpenClaw está activo desde la configuración del Plugin, una configuración heredada de canal o un manifiesto habilitado por defecto, el inicio repara solo las dependencias de runtime declaradas de ese Plugin antes de importarlo. La desactivación explícita sigue teniendo prioridad: `plugins.entries.<id>.enabled: false`, `plugins.deny`, `plugins.enabled: false` y `channels.<id>.enabled: false` impiden la reparación automática de dependencias de runtime empaquetadas para ese Plugin/canal. Los plugins externos y las rutas de carga personalizadas deben seguir instalándose mediante `openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugins:

| Formato    | Cómo funciona                                                   | Ejemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Paquete** | Diseño compatible con Codex/Claude/Cursor; mapeado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulta [Paquetes de Plugin](/es/plugins/bundles) para detalles sobre paquetes.

Si vas a escribir un Plugin nativo, empieza con [Creación de plugins](/es/plugins/building-plugins)
y el [Resumen del SDK del Plugin](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete               | Documentación                             |
| --------------- | --------------------- | ----------------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/es/channels/matrix)                |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/es/channels/msteams)      |
| Nostr           | `@openclaw/nostr`     | [Nostr](/es/channels/nostr)                  |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/es/plugins/voice-call)         |
| Zalo            | `@openclaw/zalo`      | [Zalo](/es/channels/zalo)                    |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/es/plugins/zalouser)        |

### Core (incluidos con OpenClaw)

<AccordionGroup>
  <Accordion title="Proveedores de modelos (habilitados por defecto)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memoria">
    - `memory-core` — búsqueda de memoria empaquetada (predeterminado mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo con instalación bajo demanda y recuperación/captura automática (establece `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — Plugin empaquetado del navegador para la herramienta de navegador, CLI `openclaw browser`, método `browser.request` de gateway, runtime del navegador y servicio predeterminado de control del navegador (habilitado por defecto; desactívalo antes de reemplazarlo)
    - `copilot-proxy` — puente de proxy de VS Code Copilot (deshabilitado por defecto)
  </Accordion>
</AccordionGroup>

¿Buscas plugins de terceros? Consulta [Plugins de la comunidad](/es/plugins/community).

## Configuración

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descripción                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruptor maestro (predeterminado: `true`)              |
| `allow`          | Allowlist de plugins (opcional)                           |
| `deny`           | Denylist de plugins (opcional; deny tiene prioridad)      |
| `load.paths`     | Archivos/directorios adicionales de plugins               |
| `slots`          | Selectores de ranuras exclusivas (por ejemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Interruptores + configuración por Plugin                  |

Los cambios de configuración **requieren reiniciar el gateway**. Si el Gateway se está ejecutando con observación de configuración + reinicio en proceso habilitado (la ruta predeterminada `openclaw gateway`), ese reinicio normalmente se realiza automáticamente poco después de que se escriba la configuración.
No existe una ruta admitida de hot-reload para el código de runtime nativo del Plugin ni para hooks de ciclo de vida; reinicia el proceso Gateway que atiende el canal en vivo antes de esperar que se ejecuten `register(api)`, hooks `api.on(...)`, herramientas, servicios o hooks de proveedor/runtime actualizados.

`openclaw plugins list` es una instantánea local de CLI/configuración. Un Plugin `loaded` allí significa que es descubrible y cargable a partir de la configuración/archivos vistos por esa invocación de CLI. No demuestra que un proceso hijo remoto de Gateway ya en ejecución se haya reiniciado con ese mismo código del Plugin. En configuraciones de VPS/contenedor con procesos envoltorio, envía los reinicios al proceso real `openclaw gateway run`, o usa `openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados del Plugin: deshabilitado vs ausente vs no válido">
  - **Deshabilitado**: el Plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Ausente**: la configuración hace referencia a un ID de Plugin que el descubrimiento no encontró.
  - **No válido**: el Plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Descubrimiento y precedencia

OpenClaw explora plugins en este orden (la primera coincidencia gana):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivos o directorios.
  </Step>

  <Step title="Plugins del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empaquetados">
    Incluidos con OpenClaw. Muchos están habilitados por defecto (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre tiene prioridad sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese Plugin
- Los plugins de origen workspace están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los plugins empaquetados siguen el conjunto integrado habilitado por defecto salvo que se sobrescriba
- Las ranuras exclusivas pueden forzar la habilitación del Plugin seleccionado para esa ranura
- Algunos plugins empaquetados opcionales se habilitan automáticamente cuando la configuración nombra una superficie propiedad del Plugin, como una referencia de modelo de proveedor, configuración de canal o runtime de harness
- Las rutas Codex de la familia OpenAI mantienen límites de Plugin separados:
  `openai-codex/*` pertenece al Plugin OpenAI, mientras que el Plugin empaquetado del app-server de Codex se selecciona mediante `embeddedHarness.runtime: "codex"` o referencias heredadas de modelos `codex/*`

## Solución de problemas de hooks de runtime

Si un Plugin aparece en `plugins list` pero los efectos secundarios o hooks de `register(api)` no se ejecutan en tráfico real del chat, comprueba primero lo siguiente:

- Ejecuta `openclaw gateway status --deep --require-rpc` y confirma que la URL, perfil, ruta de configuración y proceso activos de Gateway son los que estás editando.
- Reinicia el Gateway en vivo después de cambios de instalación/configuración/código del Plugin. En contenedores envoltorio, PID 1 puede ser solo un supervisor; reinicia o envía señal al proceso hijo `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` para confirmar registros de hooks y diagnósticos. Los hooks de conversación no empaquetados, como `llm_input`, `llm_output` y `agent_end`, necesitan `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para cambio de modelo, prefiere `before_model_resolve`. Se ejecuta antes de la resolución del modelo para turnos del agente; `llm_output` solo se ejecuta después de que un intento de modelo produzca salida del asistente.
- Para prueba del modelo efectivo de la sesión, usa `openclaw sessions` o las superficies de sesión/estado de Gateway y, al depurar cargas útiles del proveedor, inicia Gateway con `--raw-stream --raw-stream-path <path>`.

## Ranuras de Plugin (categorías exclusivas)

Algunas categorías son exclusivas (solo una activa a la vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" para deshabilitar
      contextEngine: "legacy", // o un ID de Plugin
    },
  },
}
```

| Ranura         | Qué controla               | Predeterminado       |
| -------------- | -------------------------- | -------------------- |
| `memory`       | Plugin de Active Memory activo | `memory-core`    |
| `contextEngine` | Motor de contexto activo  | `legacy` (integrado) |

## Referencia de CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas de detalle por Plugin
openclaw plugins list --json               # inventario legible por máquina
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquina
openclaw plugins inspect --all             # tabla de toda la flota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (ClawHub primero, luego npm)
openclaw plugins install clawhub:<pkg>     # instalar solo desde ClawHub
openclaw plugins install <spec> --force    # sobrescribir instalación existente
openclaw plugins install <path>            # instalar desde ruta local
openclaw plugins install -l <path>         # enlazar (sin copiar) para desarrollo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar la especificación npm exacta resuelta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # actualizar un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins empaquetados se entregan con OpenClaw. Muchos están habilitados por defecto (por ejemplo, proveedores de modelos empaquetados, proveedores de voz empaquetados y el Plugin empaquetado del navegador). Otros plugins empaquetados siguen necesitando `openclaw plugins enable <id>`.

`--force` sobrescribe un Plugin instalado o paquete de hooks existente en su lugar. Usa `openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está establecido, `openclaw plugins install` añade el ID del Plugin instalado a esa allowlist antes de habilitarlo, de modo que las instalaciones se pueden cargar inmediatamente después del reinicio.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar una especificación de paquete npm con un dist-tag o versión exacta resuelve el nombre del paquete de nuevo al registro de Plugin rastreado y registra la nueva especificación para futuras actualizaciones. Pasar el nombre del paquete sin versión mueve una instalación fijada de forma exacta de vuelta a la línea de versión predeterminada del registro. Si el Plugin npm instalado ya coincide con la versión resuelta y la identidad de artefacto registrada, OpenClaw omite la actualización sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque las instalaciones desde marketplace persisten metadatos de la fuente del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos positivos del escáner integrado de código peligroso. Permite que las instalaciones y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aun así no omite bloqueos de política `before_install` del Plugin ni bloqueos por fallo de escaneo.

Esta flag de CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación correspondiente de solicitud `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills desde ClawHub.

Los paquetes compatibles participan en el mismo flujo de lista/inspección/habilitación/deshabilitación de plugins. El soporte actual de runtime incluye Skills de paquetes, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto, command-skills de Cursor y directorios de hooks compatibles de Codex.

`openclaw plugins inspect <id>` también informa de las capacidades detectadas del paquete, además de entradas soportadas o no soportadas de MCP y LSP server para plugins respaldados por paquetes.

Las fuentes de marketplace pueden ser un nombre de marketplace conocido de Claude desde `~/.claude/plugins/known_marketplaces.json`, una raíz local de marketplace o una ruta `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git. Para marketplaces remotos, las entradas de plugins deben permanecer dentro del repositorio clonado del marketplace y usar solo fuentes de rutas relativas.

Consulta la [referencia de CLI de `openclaw plugins`](/es/cli/plugins) para ver todos los detalles.

## Resumen de la API de plugins

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins más antiguos pueden seguir usando `activate(api)` como alias heredado, pero los plugins nuevos deben usar `register`.

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

OpenClaw carga el objeto de entrada y llama a `register(api)` durante la activación del Plugin. El cargador sigue recurriendo a `activate(api)` para plugins antiguos, pero los plugins empaquetados y los nuevos plugins externos deben tratar `register` como el contrato público.

`api.registrationMode` le indica a un Plugin por qué se está cargando su entrada:

| Modo            | Significado                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activación de runtime. Registra herramientas, hooks, servicios, comandos, rutas y otros efectos secundarios activos.             |
| `discovery`     | Descubrimiento de capacidades de solo lectura. Registra proveedores y metadatos; el código confiable de entrada del Plugin puede cargarse, pero omite efectos secundarios activos. |
| `setup-only`    | Carga de metadatos de setup del canal mediante una entrada ligera de setup.                                                       |
| `setup-runtime` | Carga de setup del canal que también necesita la entrada de runtime.                                                               |
| `cli-metadata`  | Solo recopilación de metadatos de comandos de CLI.                                                                                 |

Las entradas de Plugin que abren sockets, bases de datos, workers en segundo plano o clientes de larga duración deben proteger esos efectos secundarios con `api.registrationMode === "full"`. Las cargas de descubrimiento se almacenan en caché por separado de las cargas de activación y no reemplazan el registro del Gateway en ejecución. El descubrimiento no activa, pero tampoco está libre de imports: OpenClaw puede evaluar la entrada confiable del Plugin o el módulo del Plugin de canal para construir la instantánea. Mantén los niveles superiores del módulo ligeros y sin efectos secundarios, y mueve clientes de red, subprocesos, listeners, lecturas de credenciales e inicio de servicios detrás de rutas de runtime completo.

Métodos comunes de registro:

| Método                                  | Qué registra                  |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Proveedor de modelo (LLM)     |
| `registerChannel`                       | Canal de chat                 |
| `registerTool`                          | Herramienta del agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida        |
| `registerSpeechProvider`                | Texto a voz / STT             |
| `registerRealtimeTranscriptionProvider` | STT en streaming              |
| `registerRealtimeVoiceProvider`         | Voz dúplex en tiempo real     |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio      |
| `registerImageGenerationProvider`       | Generación de imágenes        |
| `registerMusicGenerationProvider`       | Generación de música          |
| `registerVideoGenerationProvider`       | Generación de video           |
| `registerWebFetchProvider`              | Proveedor de obtención / scraping web |
| `registerWebSearchProvider`             | Búsqueda web                  |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Comandos de CLI               |
| `registerContextEngine`                 | Motor de contexto             |
| `registerService`                       | Servicio en segundo plano     |

Comportamiento de protección de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; los manejadores de menor prioridad se omiten.
- `before_tool_call`: `{ block: false }` no hace nada y no borra un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; los manejadores de menor prioridad se omiten.
- `before_install`: `{ block: false }` no hace nada y no borra un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; los manejadores de menor prioridad se omiten.
- `message_sending`: `{ cancel: false }` no hace nada y no borra una cancelación anterior.

Las ejecuciones nativas del app-server de Codex devuelven eventos de herramientas nativas de Codex a esta superficie de hooks. Los plugins pueden bloquear herramientas nativas de Codex mediante `before_tool_call`, observar resultados mediante `after_tool_call` y participar en aprobaciones `PermissionRequest` de Codex. El puente todavía no reescribe los argumentos de herramientas nativas de Codex. El límite exacto de compatibilidad del runtime de Codex se encuentra en el [contrato de compatibilidad v1 del harness de Codex](/es/plugins/codex-harness#v1-support-contract).

Para ver el comportamiento tipado completo de hooks, consulta [resumen del SDK](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — crea tu propio Plugin
- [Paquetes de Plugin](/es/plugins/bundles) — compatibilidad de paquetes con Codex/Claude/Cursor
- [Manifiesto del Plugin](/es/plugins/manifest) — esquema del manifiesto
- [Registrar herramientas](/es/plugins/building-plugins#registering-agent-tools) — añade herramientas de agente en un Plugin
- [Internals del Plugin](/es/plugins/architecture) — modelo de capacidades y pipeline de carga
- [Plugins de la comunidad](/es/plugins/community) — listados de terceros
