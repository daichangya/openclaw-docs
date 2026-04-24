---
read_when:
    - Instalación o configuración de plugins
    - Comprender las reglas de detección y carga de plugins
    - Trabajar con paquetes de plugins compatibles con Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar y administrar plugins de OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:21:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Los plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
arneses de agentes, herramientas, Skills, voz, transcripción en tiempo real, voz en tiempo real,
comprensión de medios, generación de imágenes, generación de video, obtención web, búsqueda web
y más. Algunos plugins son **core** (incluidos con OpenClaw), otros
son **external** (publicados en npm por la comunidad).

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

    # Desde un directorio local o archivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    Luego configure en `plugins.entries.\<id\>.config` en su archivo de configuración.

  </Step>
</Steps>

Si prefiere un control nativo del chat, habilite `commands.plugins: true` y use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

La ruta de instalación usa el mismo resolvedor que la CLI: ruta/archivo local, `clawhub:<pkg>`
explícito o especificación de paquete simple (primero ClawHub, luego npm como respaldo).

Si la configuración no es válida, la instalación normalmente falla de forma segura y le indica
que use `openclaw doctor --fix`. La única excepción de recuperación es una ruta limitada de
reinstalación de plugins incluidos para plugins que optan por
`openclaw.install.allowInvalidConfigRecovery`.

Las instalaciones empaquetadas de OpenClaw no instalan de forma anticipada todo el
árbol de dependencias de tiempo de ejecución de cada plugin incluido.
Cuando un plugin incluido y propiedad de OpenClaw está activo desde la
configuración de plugins, la configuración heredada del canal o un manifiesto habilitado
por defecto, el inicio repara solo las dependencias de tiempo de ejecución declaradas de ese plugin antes de importarlo.
Los plugins externos y las rutas de carga personalizadas aún deben instalarse mediante
`openclaw plugins install`.

## Tipos de plugins

OpenClaw reconoce dos formatos de plugin:

| Formato    | Cómo funciona                                                    | Ejemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de tiempo de ejecución; se ejecuta en proceso | Plugins oficiales, paquetes npm de la comunidad        |
| **Bundle** | Diseño compatible con Codex/Claude/Cursor; asignado a funciones de OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecen en `openclaw plugins list`. Consulte [Plugin Bundles](/es/plugins/bundles) para obtener detalles sobre los bundles.

Si está escribiendo un plugin nativo, comience con [Building Plugins](/es/plugins/building-plugins)
y [Plugin SDK Overview](/es/plugins/sdk-overview).

## Plugins oficiales

### Instalables (npm)

| Plugin          | Paquete                | Documentación                       |
| --------------- | ---------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/es/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/es/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/es/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/es/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`       | [Zalo](/es/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/es/plugins/zalouser)  |

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
    - `memory-core` — búsqueda de memoria incluida (predeterminada mediante `plugins.slots.memory`)
    - `memory-lancedb` — memoria a largo plazo de instalación bajo demanda con recuperación/captura automática (establezca `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Proveedores de voz (habilitados por defecto)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Otros">
    - `browser` — plugin de navegador incluido para la herramienta del navegador, la CLI `openclaw browser`, el método Gateway `browser.request`, el tiempo de ejecución del navegador y el servicio de control del navegador predeterminado (habilitado por defecto; desactívelo antes de reemplazarlo)
    - `copilot-proxy` — puente de VS Code Copilot Proxy (deshabilitado por defecto)
  </Accordion>
</AccordionGroup>

¿Busca plugins de terceros? Consulte [Community Plugins](/es/plugins/community).

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
| `allow`          | Lista de permitidos de plugins (opcional)                 |
| `deny`           | Lista de bloqueados de plugins (opcional; deny prevalece) |
| `load.paths`     | Archivos/directorios de plugins adicionales               |
| `slots`          | Selectores de ranura exclusivos (p. ej., `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternadores + configuración por plugin                   |

Los cambios de configuración **requieren un reinicio del Gateway**. Si el Gateway se está ejecutando con observación de configuración
+ reinicio en proceso habilitado (la ruta predeterminada de `openclaw gateway`), ese
reinicio normalmente se realiza automáticamente un momento después de que se escribe la configuración.
No hay una ruta de recarga en caliente compatible para el código de tiempo de ejecución de plugins nativos ni para los hooks
del ciclo de vida; reinicie el proceso Gateway que atiende el canal activo antes de
esperar que se ejecute el código actualizado de `register(api)`, los hooks `api.on(...)`, herramientas, servicios o
hooks de proveedor/tiempo de ejecución.

`openclaw plugins list` es una instantánea local de la CLI/configuración. Un plugin `loaded` allí
significa que el plugin es detectable y cargable desde la configuración/archivos que ve esa
invocación de la CLI. No demuestra que un proceso hijo remoto del Gateway que ya está en ejecución
se haya reiniciado con el mismo código del plugin. En configuraciones VPS/contenedor con procesos envoltorio,
envíe reinicios al proceso real `openclaw gateway run`, o use
`openclaw gateway restart` contra el Gateway en ejecución.

<Accordion title="Estados del plugin: deshabilitado vs faltante vs no válido">
  - **Disabled**: el plugin existe, pero las reglas de habilitación lo desactivaron. La configuración se conserva.
  - **Missing**: la configuración hace referencia a un id de plugin que la detección no encontró.
  - **Invalid**: el plugin existe, pero su configuración no coincide con el esquema declarado.
</Accordion>

## Detección y precedencia

OpenClaw busca plugins en este orden (la primera coincidencia prevalece):

<Steps>
  <Step title="Rutas de configuración">
    `plugins.load.paths` — rutas explícitas de archivo o directorio.
  </Step>

  <Step title="Plugins del espacio de trabajo">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` y `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globales">
    `~/.openclaw/<plugin-root>/*.ts` y `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluidos">
    Incluidos con OpenClaw. Muchos están habilitados por defecto (proveedores de modelos, voz).
    Otros requieren habilitación explícita.
  </Step>
</Steps>

### Reglas de habilitación

- `plugins.enabled: false` deshabilita todos los plugins
- `plugins.deny` siempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` deshabilita ese plugin
- Los plugins originados en el espacio de trabajo están **deshabilitados por defecto** (deben habilitarse explícitamente)
- Los plugins incluidos siguen el conjunto incorporado habilitado por defecto, salvo que se sobrescriba
- Las ranuras exclusivas pueden forzar la habilitación del plugin seleccionado para esa ranura
- Algunos plugins incluidos de activación opcional se habilitan automáticamente cuando la configuración nombra una
  superficie propiedad del plugin, como una referencia de modelo de proveedor, configuración de canal o tiempo de ejecución
  del arnés
- Las rutas Codex de la familia OpenAI mantienen límites de plugin separados:
  `openai-codex/*` pertenece al plugin OpenAI, mientras que el plugin incluido del servidor de aplicaciones Codex
  se selecciona mediante `embeddedHarness.runtime: "codex"` o referencias heredadas de modelo `codex/*`

## Solución de problemas de Runtime Hooks

Si un plugin aparece en `plugins list` pero los efectos secundarios de `register(api)` o los hooks
no se ejecutan en el tráfico del chat activo, compruebe primero lo siguiente:

- Ejecute `openclaw gateway status --deep --require-rpc` y confirme que la URL,
  el perfil, la ruta de configuración y el proceso del Gateway activos son los que está editando.
- Reinicie el Gateway activo después de cambios en instalación/configuración/código del plugin. En contenedores
  envoltorio, PID 1 puede ser solo un supervisor; reinicie o envíe una señal al proceso hijo
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar los registros de hooks y
  los diagnósticos. Los hooks de conversación no incluidos, como `llm_input`,
  `llm_output` y `agent_end`, necesitan
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para el cambio de modelo, prefiera `before_model_resolve`. Se ejecuta antes de la resolución
  del modelo para los turnos del agente; `llm_output` solo se ejecuta después de que un intento de modelo
  produce salida del asistente.
- Para obtener prueba del modelo de sesión efectivo, use `openclaw sessions` o las
  superficies de sesión/estado del Gateway y, al depurar cargas útiles del proveedor, inicie
  el Gateway con `--raw-stream --raw-stream-path <path>`.

## Ranuras de plugins (categorías exclusivas)

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

| Ranura          | Qué controla               | Predeterminado      |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin de Active Memory    | `memory-core`       |
| `contextEngine` | Motor de contexto activo   | `legacy` (integrado) |

## Referencia de la CLI

```bash
openclaw plugins list                       # inventario compacto
openclaw plugins list --enabled            # solo plugins cargados
openclaw plugins list --verbose            # líneas de detalle por plugin
openclaw plugins list --json               # inventario legible por máquinas
openclaw plugins inspect <id>              # detalle profundo
openclaw plugins inspect <id> --json       # legible por máquinas
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
openclaw plugins install <spec> --pin      # registrar la especificación exacta de npm resuelta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # actualizar un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # actualizar todos
openclaw plugins uninstall <id>          # eliminar registros de configuración/instalación
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Los plugins incluidos vienen con OpenClaw. Muchos están habilitados por defecto (por ejemplo,
los proveedores de modelos incluidos, los proveedores de voz incluidos y el
plugin de navegador incluido). Otros plugins incluidos aún necesitan `openclaw plugins enable <id>`.

`--force` sobrescribe un plugin instalado existente o un paquete de hooks en su lugar. Use
`openclaw plugins update <id-or-npm-spec>` para actualizaciones rutinarias de plugins npm
rastreados. No es compatible con `--link`, que reutiliza la ruta de origen en lugar
de copiar sobre un destino de instalación administrado.

Cuando `plugins.allow` ya está establecido, `openclaw plugins install` agrega el
id del plugin instalado a esa lista de permitidos antes de habilitarlo, de modo que las instalaciones
se puedan cargar inmediatamente después del reinicio.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalaciones rastreadas. Pasar
una especificación de paquete npm con una dist-tag o una versión exacta resuelve el nombre del paquete
de vuelta al registro del plugin rastreado y registra la nueva especificación para futuras actualizaciones.
Pasar el nombre del paquete sin una versión mueve una instalación exacta fijada de vuelta a
la línea de publicación predeterminada del registro. Si el plugin npm instalado ya coincide
con la versión resuelta y la identidad del artefacto registrada, OpenClaw omite la actualización
sin descargar, reinstalar ni reescribir la configuración.

`--pin` es solo para npm. No es compatible con `--marketplace`, porque
las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una especificación npm.

`--dangerously-force-unsafe-install` es una anulación de emergencia para falsos
positivos del escáner integrado de código peligroso. Permite que las instalaciones
y actualizaciones de plugins continúen más allá de hallazgos integrados `critical`, pero aun así
no omite los bloqueos de política `before_install` del plugin ni el bloqueo por fallos de escaneo.

Esta opción de la CLI se aplica solo a los flujos de instalación/actualización de plugins. Las instalaciones
de dependencias de Skills respaldadas por Gateway usan en su lugar la anulación de solicitud correspondiente
`dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo el flujo separado de descarga/instalación de Skills desde ClawHub.

Los bundles compatibles participan en el mismo flujo de listar/inspeccionar/habilitar/deshabilitar plugins.
La compatibilidad actual en tiempo de ejecución incluye Skills de bundle, command-skills de Claude,
valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` y `lspServers` declarados en el manifiesto,
command-skills de Cursor y directorios de hooks de Codex compatibles.

`openclaw plugins inspect <id>` también informa las capacidades de bundle detectadas, además de
las entradas de servidor MCP y LSP compatibles o no compatibles para plugins respaldados por bundles.

Los orígenes de marketplace pueden ser un nombre de marketplace conocido de Claude de
`~/.claude/plugins/known_marketplaces.json`, una raíz de marketplace local o una ruta
`marketplace.json`, una abreviatura de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL git.
Para marketplaces remotos, las entradas de plugin deben permanecer dentro del
repositorio clonado del marketplace y usar solo orígenes de ruta relativa.

Consulte la [referencia de la CLI `openclaw plugins`](/es/cli/plugins) para obtener todos los detalles.

## Descripción general de la API de plugins

Los plugins nativos exportan un objeto de entrada que expone `register(api)`. Los plugins
más antiguos aún pueden usar `activate(api)` como alias heredado, pero los plugins nuevos deben
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
activación del plugin. El cargador todavía recurre a `activate(api)` para plugins más antiguos,
pero los plugins incluidos y los nuevos plugins externos deben tratar `register` como el
contrato público.

Métodos de registro comunes:

| Método                                  | Qué registra                 |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Proveedor de modelos (LLM)   |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Herramienta del agente       |
| `registerHook` / `on(...)`              | Hooks del ciclo de vida      |
| `registerSpeechProvider`                | Texto a voz / STT            |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voz bidireccional en tiempo real |
| `registerMediaUnderstandingProvider`    | Análisis de imagen/audio     |
| `registerImageGenerationProvider`       | Generación de imágenes       |
| `registerMusicGenerationProvider`       | Generación de música         |
| `registerVideoGenerationProvider`       | Generación de video          |
| `registerWebFetchProvider`              | Proveedor de obtención / raspado web |
| `registerWebSearchProvider`             | Búsqueda web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Comandos de CLI              |
| `registerContextEngine`                 | Motor de contexto            |
| `registerService`                       | Servicio en segundo plano    |

Comportamiento de las protecciones de hooks para hooks tipados del ciclo de vida:

- `before_tool_call`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `before_install`: `{ block: true }` es terminal; se omiten los controladores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no elimina un bloqueo anterior.
- `message_sending`: `{ cancel: true }` es terminal; se omiten los controladores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no elimina una cancelación anterior.

Para ver el comportamiento completo de hooks tipados, consulte [SDK Overview](/es/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building Plugins](/es/plugins/building-plugins) — cree su propio plugin
- [Plugin Bundles](/es/plugins/bundles) — compatibilidad de bundles de Codex/Claude/Cursor
- [Plugin Manifest](/es/plugins/manifest) — esquema del manifiesto
- [Registering Tools](/es/plugins/building-plugins#registering-agent-tools) — agregue herramientas de agente en un plugin
- [Plugin Internals](/es/plugins/architecture) — modelo de capacidades y canalización de carga
- [Community Plugins](/es/plugins/community) — listados de terceros
