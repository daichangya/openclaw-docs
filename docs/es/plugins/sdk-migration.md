---
read_when:
    - Ves la advertencia OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ves la advertencia OPENCLAW_EXTENSION_API_DEPRECATED
    - Estás actualizando un Plugin a la arquitectura moderna de plugins
    - Mantienes un Plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migración del SDK de Plugin

OpenClaw ha pasado de una amplia capa de compatibilidad con versiones anteriores a una arquitectura moderna de plugins con importaciones enfocadas y documentadas. Si tu Plugin se creó antes de la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema anterior de plugins proporcionaba dos superficies muy abiertas que permitían a los plugins importar cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de utilidades. Se introdujo para mantener en funcionamiento los plugins antiguos basados en hooks mientras se construía la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a utilidades del lado del host, como el ejecutor integrado del agente.

Ambas superficies ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los plugins nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima versión principal las elimine.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Los plugins que sigan importando desde estas superficies dejarán de funcionar cuando eso ocurra.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar una utilidad cargaba docenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban crear ciclos de importación
- **Superficie de API poco clara** — no había forma de distinguir qué exportaciones eran estables y cuáles internas

El SDK moderno de Plugin corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño y autocontenido con un propósito claro y un contrato documentado.

También desaparecieron los puntos de conveniencia heredados para proveedores en canales incluidos. Importaciones como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, puntos auxiliares con marca de canal y `openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no contratos estables de plugins. Usa en su lugar subrutas genéricas y acotadas del SDK. Dentro del espacio de trabajo de plugins incluidos, mantén las utilidades propiedad del proveedor en el propio `api.ts` o `runtime-api.ts` de ese Plugin.

Ejemplos actuales de proveedores incluidos:

- Anthropic mantiene utilidades de streaming específicas de Claude en su propio punto `api.ts` / `contract-api.ts`
- OpenAI mantiene constructores de proveedores, utilidades de modelo predeterminado y constructores de proveedores realtime en su propio `api.ts`
- OpenRouter mantiene el constructor de proveedor y las utilidades de onboarding/configuración en su propio `api.ts`

## Cómo migrar

<Steps>
  <Step title="Migrar manejadores nativos de aprobación a facts de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento nativo de aprobación mediante `approvalCapability.nativeRuntime` más el registro compartido de contexto de runtime.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` / `plugin.approvals` y hacia `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público de plugins de canal; mueve los campos de entrega/nativo/render a `approvalCapability`
    - `plugin.auth` se mantiene solo para los flujos de inicio/cierre de sesión del canal; los hooks de autenticación de aprobación ahí ya no son leídos por el núcleo
    - Registra objetos de runtime propiedad del canal, como clientes, tokens o apps Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propiedad del Plugin desde manejadores nativos de aprobación; el núcleo ahora se encarga de los avisos de redirección a otro lugar a partir de los resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una superficie real `createPluginRuntime().channel`. Se rechazan los stubs parciales.

    Consulta `/plugins/sdk-channel-plugins` para ver el diseño actual de capacidad de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de fallback del wrapper de Windows">
    Si tu Plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat` de Windows no resueltos ahora fallan en modo cerrado salvo que pases explícitamente `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Si quien llama no depende intencionalmente del fallback de shell, no configures `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu Plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones enfocadas">
    Cada exportación de la superficie antigua se asigna a una ruta de importación moderna específica:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para utilidades del lado del host, usa el runtime inyectado del Plugin en lugar de importar directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    El mismo patrón se aplica a otras utilidades heredadas del puente:

    | Importación antigua | Equivalente moderno |
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
  | `plugin-sdk/core` | Reexportación paraguas heredada para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Utilidad de entrada para un solo proveedor | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores de entradas de canal enfocados | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Utilidades compartidas del asistente de configuración | Solicitudes de allowlist, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Utilidades de runtime durante la configuración | Adaptadores de parche de configuración seguros para importación, utilidades de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Utilidades de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Utilidades de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Utilidades multicuenta | Utilidades de lista/configuración/compuerta de acciones de cuenta |
  | `plugin-sdk/account-id` | Utilidades de id de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de id de cuenta |
  | `plugin-sdk/account-resolution` | Utilidades de búsqueda de cuentas | Utilidades de búsqueda de cuenta + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Utilidades de cuenta acotadas | Utilidades de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Tipos de esquemas de configuración de canal |
  | `plugin-sdk/telegram-command-config` | Utilidades de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Utilidades de ciclo de vida de estado de cuenta y flujo de borradores | `createAccountStatusSink`, utilidades de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Utilidades de sobres entrantes | Utilidades compartidas de ruta + constructor de sobre |
  | `plugin-sdk/inbound-reply-dispatch` | Utilidades de respuesta entrante | Utilidades compartidas de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Utilidades de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Utilidades de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Utilidades de runtime saliente | Utilidades de identidad/delegado de envío saliente y planificación de cargas útiles |
  | `plugin-sdk/thread-bindings-runtime` | Utilidades de vinculaciones de hilos | Utilidades de ciclo de vida de vinculaciones de hilos y adaptadores |
  | `plugin-sdk/agent-media-payload` | Utilidades heredadas de carga útil de medios | Constructor de carga útil de medios del agente para diseños de campos heredados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidad obsoleto | Solo utilidades heredadas de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Utilidades amplias de runtime | Utilidades de runtime/logging/respaldo/instalación de plugins |
  | `plugin-sdk/runtime-env` | Utilidades acotadas del entorno de runtime | Utilidades de logger/entorno de runtime, timeout, reintento y backoff |
  | `plugin-sdk/plugin-runtime` | Utilidades compartidas de runtime de Plugin | Utilidades de comandos/hooks/http/interactivas de Plugin |
  | `plugin-sdk/hook-runtime` | Utilidades de canalización de hooks | Utilidades compartidas de canalización de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Utilidades de runtime diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Utilidades de proceso | Utilidades compartidas de exec |
  | `plugin-sdk/cli-runtime` | Utilidades de runtime de CLI | Formato de comandos, esperas, utilidades de versión |
  | `plugin-sdk/gateway-runtime` | Utilidades de Gateway | Cliente de Gateway y utilidades de parche de estado de canal |
  | `plugin-sdk/config-runtime` | Utilidades de configuración | Utilidades de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Utilidades de comandos de Telegram | Utilidades de validación de comandos de Telegram estables por fallback cuando la superficie de contrato incluida de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Utilidades de prompts de aprobación | Carga útil de aprobación de exec/Plugin, utilidades de capacidad/perfil de aprobación, utilidades de enrutamiento/runtime de aprobación nativa |
  | `plugin-sdk/approval-auth-runtime` | Utilidades de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Utilidades de cliente de aprobación | Utilidades nativas de perfil/filtro de aprobación de exec |
  | `plugin-sdk/approval-delivery-runtime` | Utilidades de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Utilidades de Gateway de aprobación | Utilidad compartida de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Utilidades de adaptador de aprobación | Utilidades ligeras de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canal |
  | `plugin-sdk/approval-handler-runtime` | Utilidades de manejador de aprobación | Utilidades más amplias de runtime del manejador de aprobación; prefiere los puntos acotados de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Utilidades de destino de aprobación | Utilidades nativas de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Utilidades de respuesta de aprobación | Utilidades de carga útil de respuesta de aprobación de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Utilidades de contexto de runtime de canal | Utilidades genéricas de registro/obtención/observación de contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Utilidades de seguridad | Utilidades compartidas de confianza, restricción de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Utilidades de política SSRF | Utilidades de allowlist de hosts y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Utilidades de runtime SSRF | Utilidades de dispatcher fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Utilidades de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Utilidades de compuerta de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Utilidades de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, utilidades de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Utilidades de fetch/proxy envueltas | `resolveFetch`, utilidades de proxy |
  | `plugin-sdk/host-runtime` | Utilidades de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Utilidades de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Utilidades de compuerta de comandos y superficie de comandos | `resolveControlCommandGate`, utilidades de autorización de remitente, utilidades de registro de comandos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entrada de secretos | Utilidades de entrada de secretos |
  | `plugin-sdk/webhook-ingress` | Utilidades de solicitud de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Utilidades de guardas del cuerpo de Webhook | Utilidades de lectura/límite del cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Runtime compartido de respuesta | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Utilidades acotadas de despacho de respuestas | Utilidades de finalización + despacho de proveedor |
  | `plugin-sdk/reply-history` | Utilidades de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencia de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Utilidades de fragmentación de respuestas | Utilidades de fragmentación de texto/Markdown |
  | `plugin-sdk/session-store-runtime` | Utilidades del almacén de sesiones | Utilidades de ruta del almacén + updated-at |
  | `plugin-sdk/state-paths` | Utilidades de rutas de estado | Utilidades de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Utilidades de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, utilidades de normalización de claves de sesión |
  | `plugin-sdk/status-helpers` | Utilidades de estado de canal | Constructores de resúmenes de estado de canal/cuenta, valores predeterminados de estado de runtime, utilidades de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Utilidades de resolución de destinos | Utilidades compartidas de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Utilidades de normalización de cadenas | Utilidades de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Utilidades de URL de solicitud | Extraer URL de cadena de entradas tipo solicitud |
  | `plugin-sdk/run-command` | Utilidades de comando temporizado | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de carga útil de herramientas | Extraer cargas útiles normalizadas de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Utilidades de rutas temporales | Utilidades compartidas de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Utilidades de logging | Logger de subsistema y utilidades de redacción |
  | `plugin-sdk/markdown-table-runtime` | Utilidades de tablas Markdown | Utilidades de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de carga útil de respuesta |
  | `plugin-sdk/provider-setup` | Utilidades seleccionadas de configuración de proveedores locales/autoalojados | Utilidades de descubrimiento/configuración de proveedores autoalojados |
  | `plugin-sdk/self-hosted-provider-setup` | Utilidades enfocadas de configuración de proveedores autoalojados compatibles con OpenAI | Las mismas utilidades de descubrimiento/configuración de proveedores autoalojados |
  | `plugin-sdk/provider-auth-runtime` | Utilidades de autenticación de runtime de proveedor | Utilidades de resolución de claves API en runtime |
  | `plugin-sdk/provider-auth-api-key` | Utilidades de configuración de claves API de proveedor | Utilidades de onboarding/escritura de perfiles de claves API |
  | `plugin-sdk/provider-auth-result` | Utilidades de resultado de autenticación de proveedor | Constructor estándar de resultados de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Utilidades de inicio de sesión interactivo de proveedor | Utilidades compartidas de inicio de sesión interactivo |
  | `plugin-sdk/provider-env-vars` | Utilidades de variables de entorno de proveedor | Utilidades de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Utilidades compartidas de modelo/replay de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, utilidades de endpoints de proveedor y utilidades de normalización de ids de modelo |
  | `plugin-sdk/provider-catalog-shared` | Utilidades compartidas de catálogo de proveedores | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de onboarding de proveedores | Utilidades de configuración de onboarding |
  | `plugin-sdk/provider-http` | Utilidades HTTP de proveedores | Utilidades genéricas HTTP/de capacidades de endpoints de proveedores |
  | `plugin-sdk/provider-web-fetch` | Utilidades de web-fetch de proveedores | Utilidades de registro/caché de proveedores de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Utilidades de configuración de búsqueda web de proveedores | Utilidades acotadas de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de activación de plugins |
  | `plugin-sdk/provider-web-search-contract` | Utilidades de contrato de búsqueda web de proveedores | Utilidades acotadas de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters acotados de credenciales |
  | `plugin-sdk/provider-web-search` | Utilidades de búsqueda web de proveedores | Utilidades de registro/caché/runtime de proveedores de búsqueda web |
  | `plugin-sdk/provider-tools` | Utilidades de compatibilidad de herramientas/esquemas de proveedores | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos y utilidades de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Utilidades de uso de proveedores | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otras utilidades de uso de proveedores |
  | `plugin-sdk/provider-stream` | Utilidades de envoltorio de streams de proveedores | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de streams y utilidades compartidas de envoltorios para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Utilidades de transporte de proveedores | Utilidades nativas de transporte de proveedores como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte con escritura |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Utilidades compartidas de medios | Utilidades de obtención/transformación/almacenamiento de medios más constructores de cargas útiles de medios |
  | `plugin-sdk/media-generation-runtime` | Utilidades compartidas de generación de medios | Utilidades compartidas de failover, selección de candidatos y mensajes de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Utilidades de comprensión de medios | Tipos de proveedores de comprensión de medios más exportaciones de utilidades de imágenes/audio orientadas a proveedores |
  | `plugin-sdk/text-runtime` | Utilidades compartidas de texto | Eliminación de texto visible para el asistente, utilidades de renderizado/fragmentación/tablas Markdown, utilidades de redacción, utilidades de etiquetas de directivas, utilidades de texto seguro y otras utilidades relacionadas de texto/logging |
  | `plugin-sdk/text-chunking` | Utilidades de fragmentación de texto | Utilidad de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Utilidades de voz | Tipos de proveedores de voz más utilidades de directivas, registro y validación orientadas a proveedores |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedores de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Utilidades de transcripción realtime | Tipos de proveedores y utilidades de registro |
  | `plugin-sdk/realtime-voice` | Utilidades de voz realtime | Tipos de proveedores y utilidades de registro |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos, failover, autenticación y utilidades de registro de generación de imágenes |
  | `plugin-sdk/music-generation` | Utilidades de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, utilidades de failover, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/video-generation` | Utilidades de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, utilidades de failover, búsqueda de proveedores y análisis de referencias de modelo |
  | `plugin-sdk/interactive-runtime` | Utilidades de respuestas interactivas | Normalización/reducción de cargas útiles de respuestas interactivas |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas acotadas de schema de configuración de canal |
  | `plugin-sdk/channel-config-writes` | Utilidades de escritura de configuración de canal | Utilidades de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de plugins de canal |
  | `plugin-sdk/channel-status` | Utilidades de estado de canal | Utilidades compartidas de instantáneas/resúmenes de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Utilidades de configuración de allowlist | Utilidades de edición/lectura de configuración de allowlist |
  | `plugin-sdk/group-access` | Utilidades de acceso a grupos | Utilidades compartidas de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Utilidades de DM directo | Utilidades compartidas de autenticación/guardas de DM directo |
  | `plugin-sdk/extension-shared` | Utilidades compartidas de extensiones | Primitivas auxiliares de proxy ambiental y de canal pasivo/estado |
  | `plugin-sdk/webhook-targets` | Utilidades de destinos de Webhook | Registro de destinos de Webhook y utilidades de instalación de rutas |
  | `plugin-sdk/webhook-path` | Utilidades de rutas de Webhook | Utilidades de normalización de rutas de Webhook |
  | `plugin-sdk/web-media` | Utilidades compartidas de medios web | Utilidades de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Utilidades incluidas de memory-core | Superficie auxiliar de gestor/configuración/archivo/CLI de Memory |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime del motor de Memory | Fachada de runtime de indexación/búsqueda de Memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base host de Memory | Exportaciones del motor base host de Memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings host de Memory | Contratos de embeddings de Memory, acceso al registro, proveedor local y utilidades genéricas por lotes/remotas; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD host de Memory | Exportaciones del motor QMD host de Memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento host de Memory | Exportaciones del motor de almacenamiento host de Memory |
  | `plugin-sdk/memory-core-host-multimodal` | Utilidades multimodales host de Memory | Utilidades multimodales host de Memory |
  | `plugin-sdk/memory-core-host-query` | Utilidades de consultas host de Memory | Utilidades de consultas host de Memory |
  | `plugin-sdk/memory-core-host-secret` | Utilidades de secretos host de Memory | Utilidades de secretos host de Memory |
  | `plugin-sdk/memory-core-host-events` | Utilidades de diario de eventos host de Memory | Utilidades de diario de eventos host de Memory |
  | `plugin-sdk/memory-core-host-status` | Utilidades de estado host de Memory | Utilidades de estado host de Memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI host de Memory | Utilidades de runtime de CLI host de Memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime principal host de Memory | Utilidades de runtime principal host de Memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Utilidades de archivos/runtime host de Memory | Utilidades de archivos/runtime host de Memory |
  | `plugin-sdk/memory-host-core` | Alias de runtime principal host de Memory | Alias neutral respecto al proveedor para utilidades de runtime principal host de Memory |
  | `plugin-sdk/memory-host-events` | Alias de diario de eventos host de Memory | Alias neutral respecto al proveedor para utilidades de diario de eventos host de Memory |
  | `plugin-sdk/memory-host-files` | Alias de archivos/runtime host de Memory | Alias neutral respecto al proveedor para utilidades de archivos/runtime host de Memory |
  | `plugin-sdk/memory-host-markdown` | Utilidades de markdown gestionado | Utilidades compartidas de markdown gestionado para plugins adyacentes a Memory |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de runtime del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado host de Memory | Alias neutral respecto al proveedor para utilidades de estado host de Memory |
  | `plugin-sdk/memory-lancedb` | Utilidades incluidas de memory-lancedb | Superficie auxiliar de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de pruebas | Utilidades de prueba y mocks |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la
superficie del SDK. La lista completa de más de 200 puntos de entrada vive en
`scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunos puntos auxiliares de plugins incluidos como
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para
mantenimiento y compatibilidad de plugins incluidos, pero se omiten
intencionalmente de la tabla común de migración y no son el objetivo
recomendado para código nuevo de plugins.

La misma regla se aplica a otras familias de utilidades incluidas como:

- utilidades de soporte del navegador: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de utilidades/plugins incluidos como `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expone actualmente la superficie acotada
auxiliar de tokens `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más acotada que coincida con la tarea. Si no encuentras una exportación,
revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución  |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los plugins que todavía las usen fallarán |

Todos los plugins principales ya se han migrado. Los plugins externos deberían migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta es una vía de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer Plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — crear plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crear plugins de proveedor
- [Internals de Plugin](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de Plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
