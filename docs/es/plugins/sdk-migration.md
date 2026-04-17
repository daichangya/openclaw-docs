---
read_when:
    - Ves la advertencia `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ves la advertencia `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Estás actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al Plugin SDK moderno
title: Migración del Plugin SDK
x-i18n:
    generated_at: "2026-04-17T05:13:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del Plugin SDK

OpenClaw ha pasado de una capa amplia de compatibilidad con versiones anteriores a una arquitectura moderna de plugins con importaciones específicas y documentadas. Si tu Plugin se creó antes de la nueva arquitectura, esta guía te ayudará a migrarlo.

## Qué está cambiando

El sistema de plugins anterior ofrecía dos superficies muy amplias que permitían a los plugins importar cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de utilidades. Se introdujo para mantener en funcionamiento los plugins antiguos basados en hooks mientras se desarrollaba la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a utilidades del host, como el ejecutor integrado de agentes.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los plugins nuevos no deben usarlas, y los plugins existentes deben migrar antes de que la próxima versión principal las elimine.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies fallarán cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar una utilidad cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de distinguir qué exportaciones eran estables y cuáles internas

El Plugin SDK moderno corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

Las interfaces heredadas de conveniencia para proveedores de canales integrados también han desaparecido. Importaciones como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, interfaces auxiliares con marca de canal y `openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no contratos estables para plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del espacio de trabajo de plugins integrados, mantén las utilidades propias del proveedor en el `api.ts` o `runtime-api.ts` del propio Plugin.

Ejemplos actuales de proveedores integrados:

- Anthropic mantiene las utilidades de streaming específicas de Claude en su propia interfaz `api.ts` / `contract-api.ts`
- OpenAI mantiene los constructores de proveedores, las utilidades de modelo predeterminado y los constructores de proveedores en tiempo real en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedores y las utilidades de incorporación/configuración en su propio `api.ts`

## Cómo migrar

<Steps>
  <Step title="Migrar los controladores nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante `approvalCapability.nativeRuntime` junto con el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` / `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público de plugins de canal; mueve los campos `delivery`/`native`/`render` a `approvalCapability`
    - `plugin.auth` sigue existiendo solo para los flujos de inicio/cierre de sesión del canal; los hooks de autenticación de aprobación allí ya no son leídos por el núcleo
    - Registra los objetos de tiempo de ejecución propiedad del canal, como clientes, tokens o aplicaciones Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde controladores nativos de aprobación; el núcleo ahora se encarga de los avisos de entrega en otro destino a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una superficie real `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de la capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del contenedor de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los contenedores `.cmd`/`.bat` no resueltos en Windows ahora fallan de forma cerrada a menos que pases explícitamente `allowShellFallback: true`.

    ```typescript
    // Antes
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Después
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Establece esto solo para llamadores de compatibilidad confiables que
      // aceptan intencionadamente el fallback mediado por shell.
      allowShellFallback: true,
    });
    ```

    Si tu llamador no depende intencionadamente del fallback de shell, no establezcas `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Buscar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie anterior se corresponde con una ruta de importación moderna concreta:

    ```typescript
    // Antes (capa obsoleta de compatibilidad con versiones anteriores)
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

    Para las utilidades del host, usa el tiempo de ejecución del Plugin inyectado en lugar de importar directamente:

    ```typescript
    // Antes (puente obsoleto de extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Después (tiempo de ejecución inyectado)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otras utilidades heredadas del puente:

    | Importación anterior | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | utilidades del almacén de sesiones | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Utilidad canónica de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilidad de entrada para un solo proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilidades compartidas del asistente de configuración | Solicitudes de allowlist, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Utilidades de tiempo de ejecución para la configuración | Adaptadores de parches de configuración seguros para importación, utilidades de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Utilidades de adaptadores de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Utilidades de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilidades para múltiples cuentas | Utilidades de lista/configuración/puerta de acciones de cuentas |
  | `plugin-sdk/account-id` | Utilidades de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Utilidades de búsqueda de cuentas | Utilidades de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Utilidades específicas de cuentas | Utilidades de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de MD | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + indicador de escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquema de configuración | Tipos de esquema de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Utilidades de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/MD | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Seguimiento del estado de cuentas | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Utilidades de sobre de entrada | Utilidades compartidas de ruta + constructor de sobres |
  | `plugin-sdk/inbound-reply-dispatch` | Utilidades de respuestas entrantes | Utilidades compartidas de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de objetivos de mensajería | Utilidades de análisis/coincidencia de objetivos |
  | `plugin-sdk/outbound-media` | Utilidades de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Utilidades de tiempo de ejecución saliente | Utilidades de identidad saliente/delegado de envío |
  | `plugin-sdk/thread-bindings-runtime` | Utilidades de vinculación de hilos | Utilidades de ciclo de vida y adaptadores de vinculación de hilos |
  | `plugin-sdk/agent-media-payload` | Utilidades heredadas de payload de medios | Constructor de payload de medios de agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilidades generales de tiempo de ejecución | Utilidades de tiempo de ejecución/logging/copias de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Utilidades específicas de entorno de ejecución | Utilidades de logger/entorno de ejecución, timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Utilidades compartidas de tiempo de ejecución de plugins | Utilidades de comandos/hooks/http/interactividad de plugins |
  | `plugin-sdk/hook-runtime` | Utilidades del pipeline de hooks | Utilidades compartidas del pipeline de Webhook/hooks internos |
  | `plugin-sdk/lazy-runtime` | Utilidades de tiempo de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilidades de proceso | Utilidades compartidas de ejecución |
  | `plugin-sdk/cli-runtime` | Utilidades de tiempo de ejecución de CLI | Formateo de comandos, esperas, utilidades de versión |
  | `plugin-sdk/gateway-runtime` | Utilidades de Gateway | Cliente de Gateway y utilidades de parches de estado de canal |
  | `plugin-sdk/config-runtime` | Utilidades de configuración | Utilidades de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Utilidades de comandos de Telegram | Utilidades de validación de comandos de Telegram con fallback estable cuando la superficie contractual integrada de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Utilidades de prompts de aprobación | Payload de aprobación de ejecución/Plugin, utilidades de capacidad/perfil de aprobación, utilidades nativas de enrutamiento/tiempo de ejecución de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Utilidades de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Utilidades de cliente de aprobación | Utilidades de perfil/filtro de aprobación nativa de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Utilidades de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Utilidades de Gateway de aprobación | Utilidad compartida de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilidades de adaptadores de aprobación | Utilidades ligeras de carga de adaptadores nativos de aprobación para puntos de entrada de canales críticos |
  | `plugin-sdk/approval-handler-runtime` | Utilidades de controladores de aprobación | Utilidades más amplias de tiempo de ejecución de controladores de aprobación; prefiere las interfaces más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Utilidades de objetivos de aprobación | Utilidades nativas de vinculación de objetivo/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Utilidades de respuesta de aprobación | Utilidades de payload de respuesta de aprobación de ejecución/Plugin |
  | `plugin-sdk/channel-runtime-context` | Utilidades de contexto de tiempo de ejecución de canal | Utilidades genéricas de registro/obtención/observación de contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Utilidades de seguridad | Utilidades compartidas de confianza, control de MD, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Utilidades de política SSRF | Utilidades de allowlist de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Utilidades de tiempo de ejecución SSRF | Dispatcher fijado, fetch protegido, utilidades de política SSRF |
  | `plugin-sdk/collection-runtime` | Utilidades de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilidades de control de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilidades de formateo de errores | `formatUncaughtError`, `isApprovalNotFoundError`, utilidades de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Utilidades de fetch/proxy envueltos | `resolveFetch`, utilidades de proxy |
  | `plugin-sdk/host-runtime` | Utilidades de normalización del host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilidades de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formateo de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Control de comandos y utilidades de superficie de comandos | `resolveControlCommandGate`, utilidades de autorización del remitente, utilidades de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Utilidades de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Utilidades de solicitudes de Webhook | Utilidades de objetivos de Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilidades de guardas de cuerpo de solicitud de Webhook | Utilidades de lectura/límite del cuerpo de la solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuestas | Despacho de entrada, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Utilidades específicas de despacho de respuestas | Utilidades de finalización + despacho del proveedor |
  | `plugin-sdk/reply-history` | Utilidades de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilidades de fragmentación de respuestas | Utilidades de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Utilidades de almacenamiento de sesión | Utilidades de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Utilidades de rutas de estado | Utilidades de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Utilidades de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilidades de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Utilidades de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución, utilidades de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Utilidades de resolución de objetivos | Utilidades compartidas de resolución de objetivos |
  | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de cadenas | Utilidades de normalización de slugs/cadenas |
  | `plugin-sdk/request-url` | Utilidades de URL de solicitud | Extrae URL de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Utilidades de comandos temporizados | Ejecutor de comandos temporizados con `stdout`/`stderr` normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramientas | Extrae payloads normalizados de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extrae campos canónicos de objetivo de envío desde argumentos de herramientas |
  | `plugin-sdk/temp-path` | Utilidades de rutas temporales | Utilidades compartidas de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Utilidades de logging | Logger de subsistema y utilidades de redacción |
  | `plugin-sdk/markdown-table-runtime` | Utilidades de tablas Markdown | Utilidades de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Utilidades seleccionadas de configuración de proveedores locales/autohospedados | Utilidades de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Utilidades específicas de configuración de proveedores autohospedados compatibles con OpenAI | Las mismas utilidades de detección/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Utilidades de autenticación de tiempo de ejecución del proveedor | Utilidades de resolución de API key en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Utilidades de configuración de API key del proveedor | Utilidades de incorporación/escritura de perfil de API key |
  | `plugin-sdk/provider-auth-result` | Utilidades de resultado de autenticación del proveedor | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Utilidades de inicio de sesión interactivo del proveedor | Utilidades compartidas de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Utilidades de variables de entorno del proveedor | Utilidades de búsqueda de variables de entorno para autenticación del proveedor |
  | `plugin-sdk/provider-model-shared` | Utilidades compartidas de modelo/repetición del proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, utilidades de endpoints del proveedor y utilidades de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Utilidades compartidas del catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación del proveedor | Utilidades de configuración de incorporación |
  | `plugin-sdk/provider-http` | Utilidades HTTP del proveedor | Utilidades genéricas de capacidad HTTP/endpoint del proveedor |
  | `plugin-sdk/provider-web-fetch` | Utilidades de web-fetch del proveedor | Utilidades de registro/caché del proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilidades de configuración de búsqueda web del proveedor | Utilidades específicas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Utilidades de contrato de búsqueda web del proveedor | Utilidades específicas de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance definido |
  | `plugin-sdk/provider-web-search` | Utilidades de búsqueda web del proveedor | Utilidades de registro/caché/tiempo de ejecución del proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Utilidades de compatibilidad de herramientas/esquemas del proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos, y utilidades de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Utilidades de uso del proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otras utilidades de uso del proveedor |
  | `plugin-sdk/provider-stream` | Utilidades de envoltorio de streams del proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de stream y utilidades compartidas de envoltorios para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilidades compartidas de medios | Utilidades de obtención/transformación/almacenamiento de medios más constructores de payload de medios |
  | `plugin-sdk/media-generation-runtime` | Utilidades compartidas de generación de medios | Utilidades compartidas de failover, selección de candidatos y mensajería de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Utilidades de comprensión de medios | Tipos de proveedor de comprensión de medios más exportaciones de utilidades de imagen/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Utilidades compartidas de texto | Eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación/tablas Markdown, utilidades de redacción, utilidades de etiquetas de directivas, utilidades de texto seguro y utilidades relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Utilidades de fragmentación de texto | Utilidad de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Utilidades de voz | Tipos de proveedor de voz más utilidades de directivas, registro y validación orientadas a proveedores |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Utilidades de transcripción en tiempo real | Tipos de proveedor y utilidades de registro |
  | `plugin-sdk/realtime-voice` | Utilidades de voz en tiempo real | Tipos de proveedor y utilidades de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y utilidades de registro para generación de imágenes |
  | `plugin-sdk/music-generation` | Utilidades de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, utilidades de failover, búsqueda de proveedores y análisis de model-ref |
  | `plugin-sdk/video-generation` | Utilidades de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, utilidades de failover, búsqueda de proveedores y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Utilidades de respuestas interactivas | Normalización/reducción de payload de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Utilidades de escritura de configuración de canal | Utilidades de autorización para escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas del preludio de Plugin de canal |
  | `plugin-sdk/channel-status` | Utilidades de estado de canal | Utilidades compartidas de snapshot/resumen del estado del canal |
  | `plugin-sdk/allowlist-config-edit` | Utilidades de configuración de allowlist | Utilidades de edición/lectura de configuración de allowlist |
  | `plugin-sdk/group-access` | Utilidades de acceso a grupos | Utilidades compartidas de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Utilidades de MD directo | Utilidades compartidas de autenticación/guardas de MD directo |
  | `plugin-sdk/extension-shared` | Utilidades compartidas de extensiones | Primitivas de canales/estado pasivos y utilidades de proxy ambiental |
  | `plugin-sdk/webhook-targets` | Utilidades de objetivos de Webhook | Registro de objetivos de Webhook y utilidades de instalación de rutas |
  | `plugin-sdk/webhook-path` | Utilidades de rutas de Webhook | Utilidades de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Utilidades compartidas de medios web | Utilidades de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del Plugin SDK |
  | `plugin-sdk/memory-core` | Utilidades integradas de memory-core | Superficie de utilidades de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso al registro, proveedor local y utilidades genéricas de lotes/remotas; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Utilidades multimodales del host de memoria | Utilidades multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Utilidades de consulta del host de memoria | Utilidades de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Utilidades de secretos del host de memoria | Utilidades de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Utilidades del diario de eventos del host de memoria | Utilidades del diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Utilidades de estado del host de memoria | Utilidades de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Utilidades de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Utilidades centrales de tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilidades de archivos/tiempo de ejecución del host de memoria | Utilidades de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias de tiempo de ejecución central del host de memoria | Alias neutral respecto al proveedor para utilidades centrales de tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para utilidades del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para utilidades de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Utilidades de markdown administrado | Utilidades compartidas de markdown administrado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para utilidades de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Utilidades integradas de memory-lancedb | Superficie de utilidades de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Utilidades de prueba y mocks |
</Accordion>

Esta tabla es intencionadamente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada se encuentra en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista sigue incluyendo algunas interfaces auxiliares de plugins integrados como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Estas siguen exportándose para
mantenimiento y compatibilidad de plugins integrados, pero se omiten
intencionadamente de la tabla común de migración y no son el destino recomendado para
código nuevo de plugins.

La misma regla se aplica a otras familias de utilidades integradas como:

- utilidades de compatibilidad con navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de utilidades/plugins integrados como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie específica de utilidades de token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica posible que se ajuste a la tarea. Si no encuentras una exportación,
consulta el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                 | Qué ocurre                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución    |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los plugins que sigan usándolas fallarán |

Todos los plugins del núcleo ya se han migrado. Los plugins externos deben migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Establece estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Este es un mecanismo de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer Plugin
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Aspectos internos de plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto del Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
