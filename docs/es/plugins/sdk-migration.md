---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un plugin a la arquitectura moderna de plugins de OpenClaw
    - Mantienes un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra desde la capa heredada de compatibilidad hacia atrás al Plugin SDK moderno
title: Migración del Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b71ce69b30c3bb02da1b263b1d11dc3214deae5f6fc708515e23b5a1c7bb7c8f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del Plugin SDK

OpenClaw ha pasado de una amplia capa de compatibilidad hacia atrás a una arquitectura moderna de plugins
con importaciones específicas y documentadas. Si tu plugin se creó antes
de la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema antiguo de plugins proporcionaba dos superficies muy abiertas que permitían a los plugins importar
todo lo que necesitaban desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una sola importación que reexportaba decenas de
  helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se
  construía la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a
  helpers del lado del host, como el ejecutor de agentes integrados.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en runtime, pero los nuevos
plugins no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima
versión principal las elimine.

<Warning>
  La capa de compatibilidad hacia atrás se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar un helper cargaba docenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables y cuáles eran internas

El Plugin SDK moderno corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`)
es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

Las interfaces heredadas de conveniencia de proveedores para canales empaquetados también han desaparecido. Las importaciones
como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
las interfaces helper con marca de canal y
`openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no
contratos estables para plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del
workspace de plugins empaquetados, mantén los helpers propiedad del proveedor en el propio
`api.ts` o `runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene los helpers de stream específicos de Claude en su propia interfaz `api.ts` /
  `contract-api.ts`
- OpenAI mantiene constructores de proveedores, helpers de modelo predeterminado y constructores de proveedores
  en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y los helpers de onboarding/configuración en su propio
  `api.ts`

## Cómo migrar

<Steps>
  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers de Windows
    `.cmd`/`.bat` no resueltos ahora fallan de forma cerrada a menos que pases explícitamente
    `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadas de compatibilidad de confianza que
      // aceptan intencionalmente el fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamada no depende intencionalmente del fallback de shell, no establezcas
    `allowShellFallback` y gestiona en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu plugin importaciones de cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar con importaciones específicas">
    Cada exportación de la superficie antigua se asigna a una ruta de importación moderna específica:

    ```typescript
    // Antes (capa obsoleta de compatibilidad hacia atrás)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Después (importaciones modernas y específicas)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para los helpers del lado del host, usa el runtime de plugin inyectado en lugar de importar
    directamente:

    ```typescript
    // Antes (puente obsoleto extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (runtime inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otros helpers heredados del puente:

    | Importación antigua | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers del almacén de sesiones | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compilar y probar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencia de rutas de importación

<Accordion title="Tabla común de rutas de importación">
  | Ruta de importación | Propósito | Exportaciones clave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canónico del punto de entrada del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/constructores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de punto de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Prompts de lista permitida, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de runtime para configuración | Adaptadores de parche de configuración seguros para importación, helpers de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegados |
  | `plugin-sdk/setup-adapter-runtime` | Helpers del adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiples cuentas | Helpers de lista/configuración/puerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Helpers de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuenta + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Helpers específicos de cuenta | Helpers de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquema de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Seguimiento del estado de cuentas | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers de sobre entrante | Helpers compartidos de ruta + constructor de sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de respuesta entrante | Helpers compartidos de registrar y despachar |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Helpers de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Helpers de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime saliente | Helpers delegados de identidad/envío salientes |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de enlaces de hilo | Ciclo de vida de enlaces de hilo y helpers de adaptador |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de payload de medios | Constructor de payload de medios de agente para estructuras heredadas de campos |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de runtime | Helpers de runtime/logging/copias de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Helpers específicos del entorno de runtime | Logger/entorno de runtime, helpers de timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de runtime de plugin | Helpers de plugin para comandos/hooks/http/interactivo |
  | `plugin-sdk/hook-runtime` | Helpers del pipeline de hooks | Helpers compartidos del pipeline de hooks webhook/internos |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de procesos | Helpers compartidos de exec |
  | `plugin-sdk/cli-runtime` | Helpers de runtime de CLI | Formato de comandos, esperas, helpers de versión |
  | `plugin-sdk/gateway-runtime` | Helpers de gateway | Cliente del gateway y helpers de parche de estado de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuración | Helpers de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers de validación de comandos de Telegram estables ante fallback cuando la superficie de contrato empaquetada de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts de aprobación | Payload de aprobación de exec/plugin, helpers de capacidad/perfil de aprobación, helpers de enrutamiento/runtime de aprobación nativa |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones del mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers de perfil/filtro de aprobación nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación | Helpers de destino/vinculación de cuenta de aprobación nativa |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de payload de respuesta de aprobación de exec/plugin |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, bloqueo de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista permitida de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de dispatcher fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de bloqueo de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envueltos | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, ejecutores de política |
  | `plugin-sdk/allow-from` | Formato de lista permitida | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Asignación de entradas de lista permitida | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bloqueo de comandos y helpers de superficie de comandos | `resolveControlCommandGate`, helpers de autorización del remitente, helpers del registro de comandos |
  | `plugin-sdk/secret-input` | Análisis de entradas secretas | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitudes webhook | Utilidades de destino de webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protección del cuerpo de webhook | Helpers de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, heartbeat, planificador de respuesta, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho de respuesta | Helpers de finalización + despacho del proveedor |
  | `plugin-sdk/reply-history` | Helpers del historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentación de respuestas | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers del almacén de sesiones | Helpers de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de directorio de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados del estado de runtime, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de destinos | Helpers compartidos de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extrae URLs de cadena de entradas tipo request |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramienta/CLI |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extrae campos canónicos de destino de envío de argumentos de herramienta |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas temporales para descargas |
  | `plugin-sdk/logging-core` | Helpers de logging | Logger del subsistema y helpers de redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers específicos de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de proveedores en runtime | Helpers de resolución de claves de API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de claves de API de proveedores | Helpers de onboarding/escritura de perfiles para claves de API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultados de autenticación de proveedores | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de inicio de sesión interactivo de proveedores | Helpers compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedores | Helpers de búsqueda de variables de entorno de autenticación de proveedores |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelos/replay de proveedores | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, helpers de endpoint del proveedor y helpers de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de onboarding de proveedores | Helpers de configuración de onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedores | Helpers genéricos de HTTP/capacidades de endpoint de proveedores |
  | `plugin-sdk/provider-web-fetch` | Helpers de proveedores de obtención web | Helpers de registro/caché de proveedores de obtención web |
  | `plugin-sdk/provider-web-search` | Helpers de proveedores de búsqueda web | Helpers de registro/caché/configuración de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquema de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquemas Gemini y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedores |
  | `plugin-sdk/provider-stream` | Helpers de envoltorios de stream de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorio de stream y helpers compartidos de envoltorio para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de fetch/transformación/almacenamiento de medios más constructores de payload de medios |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedores de comprensión de medios más exportaciones helper orientadas al proveedor para imagen/audio |
  | `plugin-sdk/text-runtime` | Helpers compartidos de texto | Eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tabla Markdown, helpers de redacción, helpers de etiquetas de directiva, utilidades de texto seguro y helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedores de voz más helpers orientados al proveedor para directivas, registro y validación |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedores y helpers de registro |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedores y helpers de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y helpers de registro de generación de imágenes |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de failover, búsqueda de proveedor y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Helpers de respuestas interactivas | Normalización/reducción de payload de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de esquema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización para escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista permitida | Helpers de edición/lectura de configuración de lista permitida |
  | `plugin-sdk/group-access` | Helpers de acceso a grupos | Helpers compartidos de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Helpers de DM directo | Helpers compartidos de autenticación/protección de DM directo |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensión | Primitivas helper de canal/estado pasivo |
  | `plugin-sdk/webhook-targets` | Helpers de destinos webhook | Registro de destinos webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Helpers de rutas webhook | Helpers de normalización de rutas webhook |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers empaquetados de memory-core | Superficie helper de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime del motor de memoria | Fachada de runtime de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Exportaciones del motor de embeddings del host de memoria |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria | Helpers de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI del host de memoria | Helpers de runtime CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central del host de memoria | Helpers de runtime central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de memoria | Helpers de archivos/runtime del host de memoria |
  | `plugin-sdk/memory-lancedb` | Helpers empaquetados de memory-lancedb | Superficie helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Helpers y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista aún incluye algunas interfaces helper de plugins empaquetados como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de plugins empaquetados, pero se omiten intencionadamente
de la tabla común de migración y no son el objetivo recomendado para
código nuevo de plugins.

La misma regla se aplica a otras familias de helpers empaquetados como:

- helpers de soporte de navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de helpers/plugins empaquetados como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` actualmente expone la superficie específica de helpers de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con la tarea. Si no encuentras una exportación,
consulta el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                   | Qué sucede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ahora**                | Las superficies obsoletas emiten advertencias en runtime                               |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deberían migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esto es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Internals de plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto del plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
