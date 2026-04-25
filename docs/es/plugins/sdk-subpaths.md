---
read_when:
    - Elegir la subruta correcta de plugin-sdk para una importación de plugin
    - Auditar las subrutas de plugins integrados y las superficies auxiliares
summary: 'Catálogo de subrutas del Plugin SDK: qué importaciones están en cada lugar, agrupadas por área'
title: Subrutas del Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  El Plugin SDK se expone como un conjunto de subrutas específicas bajo `openclaw/plugin-sdk/`.
  Esta página cataloga las subrutas de uso más común agrupadas por propósito. La lista completa
  generada de más de 200 subrutas vive en `scripts/lib/plugin-sdk-entrypoints.json`;
  las subrutas auxiliares reservadas para plugins integrados aparecen allí, pero son un
  detalle de implementación a menos que una página de documentación las promueva explícitamente.

  Para la guía de creación de plugins, consulta [Descripción general del Plugin SDK](/es/plugins/sdk-overview).

  ## Entrada del plugin

  | Subruta                    | Exportaciones clave                                                                                                                    |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Subrutas de canales">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Auxiliares compartidos del asistente de configuración, prompts de lista de permitidos y constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Auxiliares de configuración multicuenta/puerta de acciones y auxiliares de respaldo de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, auxiliares de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Búsqueda de cuentas y auxiliares de respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Auxiliares específicos para lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Auxiliares de normalización/validación de comandos personalizados de Telegram con respaldo de contrato integrado |
    | `plugin-sdk/command-gating` | Auxiliares específicos de compuerta de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, auxiliares de ciclo de vida/finalización de flujo de borradores |
    | `plugin-sdk/inbound-envelope` | Auxiliares compartidos de ruta entrante y construcción de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Auxiliares compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/outbound-media` | Auxiliares compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Auxiliares de entrega saliente, identidad, delegado de envío, sesión, formato y planificación de cargas útiles |
    | `plugin-sdk/poll-runtime` | Auxiliares específicos de normalización de encuestas |
    | `plugin-sdk/thread-bindings-runtime` | Auxiliares de ciclo de vida y adaptador para vinculaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga útil de medios del agente |
    | `plugin-sdk/conversation-runtime` | Auxiliares de vinculaciones de conversación/hilo, emparejamiento y vinculaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Auxiliar de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Auxiliares de resolución de políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Auxiliares compartidos de instantánea/resumen de estado del canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas específicas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Auxiliares de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Auxiliares de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Auxiliares compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Auxiliares compartidos de autenticación/protección de mensajes directos |
    | `plugin-sdk/interactive-runtime` | Presentación semántica de mensajes, entrega y auxiliares heredados de respuesta interactiva. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para debounce entrante, coincidencia de menciones, auxiliares de política de menciones y auxiliares de sobres |
    | `plugin-sdk/channel-inbound-debounce` | Auxiliares específicos de debounce entrante |
    | `plugin-sdk/channel-mention-gating` | Auxiliares específicos de política de menciones y texto de mención sin la superficie más amplia del runtime entrante |
    | `plugin-sdk/channel-envelope` | Auxiliares específicos de formato de sobres entrantes |
    | `plugin-sdk/channel-location` | Auxiliares de contexto y formato de ubicación del canal |
    | `plugin-sdk/channel-logging` | Auxiliares de registro de canal para descartes entrantes y fallos de escritura/confirmación |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Auxiliares de acciones de mensajes de canal, además de auxiliares de esquema nativo obsoletos que se conservan por compatibilidad con plugins |
    | `plugin-sdk/channel-targets` | Auxiliares de análisis/coincidencia de destinos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integración de comentarios/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares específicos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedores">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Auxiliares curados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Auxiliares enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI y constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Auxiliares de resolución de claves API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Auxiliares de incorporación/escritura de perfiles de claves API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Auxiliares compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Auxiliares de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, auxiliares de endpoints de proveedor y auxiliares de normalización de ID de modelos como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Auxiliares genéricos de capacidad HTTP/endpoints de proveedor, errores HTTP de proveedor y auxiliares de formularios multipart para transcripción de audio |
    | `plugin-sdk/provider-web-fetch-contract` | Auxiliares específicos de contrato de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Auxiliares de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Auxiliares específicos de configuración/credenciales de web-search para proveedores que no necesitan integración de habilitación de plugins |
    | `plugin-sdk/provider-web-search-contract` | Auxiliares específicos de contrato de configuración/credenciales de web-search como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Auxiliares de registro/caché/runtime de proveedores de web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas de Gemini + diagnósticos y auxiliares de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltorios de flujo y auxiliares compartidos de envoltorios para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte nativo de proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos de eventos de transporte escribibles |
    | `plugin-sdk/provider-onboard` | Auxiliares de parcheo de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Auxiliares de singleton/mapa/caché locales al proceso |
    | `plugin-sdk/group-activation` | Auxiliares específicos de modo de activación de grupos y análisis de comandos |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, auxiliares de registro de comandos, incluido el formato dinámico del menú de argumentos, auxiliares de autorización del remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Auxiliares de resolución de aprobadores y de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Auxiliares de perfil/filtro de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Auxiliar compartido de resolución del Gateway de aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares ligeros de carga de adaptadores nativos de aprobación para puntos de entrada de canal críticos |
    | `plugin-sdk/approval-handler-runtime` | Auxiliares más amplios del runtime de controladores de aprobación; prefiere las superficies más específicas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Auxiliares nativos de destino de aprobación y vinculación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Auxiliares de carga útil de respuesta de aprobación de ejecución/plugin |
    | `plugin-sdk/approval-runtime` | Auxiliares de carga útil de aprobación de ejecución/plugin, auxiliares nativos de enrutamiento/runtime de aprobaciones y auxiliares estructurados de visualización de aprobaciones como `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Auxiliares específicos para restablecer la deduplicación de respuestas entrantes |
    | `plugin-sdk/channel-contract-testing` | Auxiliares específicos de pruebas de contrato de canal sin el barrel amplio de pruebas |
    | `plugin-sdk/command-auth-native` | Autenticación nativa de comandos, formato dinámico del menú de argumentos y auxiliares nativos de destino de sesión |
    | `plugin-sdk/command-detection` | Auxiliares compartidos de detección de comandos |
    | `plugin-sdk/command-primitives-runtime` | Predicados ligeros de texto de comandos para rutas críticas de canal |
    | `plugin-sdk/command-surface` | Normalización del cuerpo de comandos y auxiliares de superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Auxiliares específicos de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Auxiliares específicos de tipado `coerceSecretRef` y SecretRef para análisis de contratos/configuración de secretos |
    | `plugin-sdk/security-runtime` | Auxiliares compartidos de confianza, compuerta de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Auxiliares de política SSRF para lista de permitidos de hosts y red privada |
    | `plugin-sdk/ssrf-dispatcher` | Auxiliares específicos de dispatcher fijado sin la amplia superficie del runtime de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Auxiliares de dispatcher fijado, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Auxiliares de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Auxiliares de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Auxiliares de tamaño del cuerpo/tiempo de espera de solicitudes |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Auxiliares amplios de runtime/registro/copias de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Auxiliares específicos de entorno de runtime, logger, tiempo de espera, reintento y backoff |
    | `plugin-sdk/channel-runtime-context` | Auxiliares genéricos de registro y búsqueda de contexto de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Auxiliares compartidos de comandos/hooks/http/interactivos de plugins |
    | `plugin-sdk/hook-runtime` | Auxiliares compartidos del flujo de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Auxiliares de importación/vinculación diferida del runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Auxiliares de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Auxiliares de formato de CLI, espera, versión, invocación de argumentos y grupos de comandos diferidos |
    | `plugin-sdk/gateway-runtime` | Auxiliares del cliente Gateway y de parcheo de estado de canal |
    | `plugin-sdk/config-runtime` | Auxiliares de carga/escritura de configuración y auxiliares de búsqueda de configuración de plugins |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato integrada de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autolinks de referencias de archivos sin el barrel amplio de text-runtime |
    | `plugin-sdk/approval-runtime` | Auxiliares de aprobación de ejecución/plugin, constructores de capacidad de aprobación, auxiliares de autenticación/perfil, auxiliares nativos de enrutamiento/runtime y formato estructurado de rutas de visualización de aprobaciones |
    | `plugin-sdk/reply-runtime` | Auxiliares compartidos de runtime de entrada/respuesta, fragmentación, despacho, Heartbeat y planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Auxiliares específicos de despacho/finalización de respuestas y auxiliares de etiquetas de conversación |
    | `plugin-sdk/reply-history` | Auxiliares compartidos de historial de respuestas en ventanas cortas como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Auxiliares específicos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Auxiliares de ruta del almacén de sesiones y `updated-at` |
    | `plugin-sdk/state-paths` | Auxiliares de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Auxiliares de enrutamiento/clave de sesión/vinculación de cuentas como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Auxiliares compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y auxiliares de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Auxiliares compartidos de resolución de destinos |
    | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extraer URLs de cadena de entradas similares a fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extraer cargas útiles normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Auxiliares compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Logger de subsistemas y auxiliares de redacción |
    | `plugin-sdk/markdown-table-runtime` | Auxiliares de modo y conversión de tablas Markdown |
    | `plugin-sdk/json-store` | Auxiliares pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Auxiliares de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Auxiliares de caché de deduplicación respaldada por disco |
    | `plugin-sdk/acp-runtime` | Auxiliares de runtime/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de vinculaciones ACP de solo lectura sin importaciones de arranque del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas específicas del esquema de configuración de runtime de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Auxiliares de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Auxiliares de arranque del dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas para canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Auxiliares de respuesta del proveedor/comando `/models` |
    | `plugin-sdk/skill-commands-runtime` | Auxiliares de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Auxiliares nativos de registro/construcción/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin de confianza para harnesses de agentes de bajo nivel: tipos de harness, auxiliares de dirección/cancelación de ejecuciones activas, auxiliares de puente de herramientas de OpenClaw, auxiliares de formato/detalle de progreso de herramientas y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Auxiliares de detección de endpoints de Z.A.I |
    | `plugin-sdk/infra-runtime` | Auxiliares de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Auxiliares pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Auxiliares de indicadores y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, auxiliares compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Auxiliares de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime con reconocimiento de dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado de cuerpos de respuesta sin la amplia superficie del runtime de medios |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversación sin enrutamiento de vinculaciones configuradas ni almacenes de emparejamiento |
    | `plugin-sdk/session-store-runtime` | Auxiliares de lectura del almacén de sesiones sin importaciones amplias de escritura/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad de contexto y filtrado de contexto suplementario sin importaciones amplias de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Auxiliares específicos de coerción y normalización de registros/cadenas primitivas sin importaciones de markdown/registro |
    | `plugin-sdk/host-runtime` | Auxiliares de normalización de nombres de host y hosts SCP |
    | `plugin-sdk/retry-runtime` | Auxiliares de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Auxiliares de directorio/identidad/espacio de trabajo de agentes |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Auxiliares compartidos de obtención/transformación/almacenamiento de medios, además de constructores de cargas útiles de medios |
    | `plugin-sdk/media-store` | Auxiliares específicos de almacén de medios como `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Auxiliares compartidos de failover para generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor para comprensión de medios, además de exportaciones auxiliares de imagen/audio orientadas a proveedores |
    | `plugin-sdk/text-runtime` | Auxiliares compartidos de texto/Markdown/registro como eliminación de texto visible para el asistente, auxiliares de renderizado/fragmentación/tablas de Markdown, auxiliares de redacción, auxiliares de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Auxiliar de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz, además de exportaciones orientadas a proveedores de directivas, registro, validación y auxiliares de voz |
    | `plugin-sdk/speech-core` | Exportaciones compartidas de tipos de proveedores de voz, registro, directivas, normalización y auxiliares de voz |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real, auxiliares de registro y auxiliar compartido de sesión WebSocket |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real y auxiliares de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, failover, autenticación y auxiliares de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación de música |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación de música, auxiliares de failover, búsqueda de proveedores y análisis de model-ref |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, auxiliares de failover, búsqueda de proveedores y análisis de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y auxiliares de instalación de rutas |
    | `plugin-sdk/webhook-path` | Auxiliares de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Auxiliares compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar integrada de memory-core para auxiliares de administrador/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada del runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y auxiliares genéricos de lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Auxiliares de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Auxiliares de diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Auxiliares del runtime de CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Auxiliares del runtime principal del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para los auxiliares del runtime principal del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para los auxiliares del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para los auxiliares de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Auxiliares compartidos de Markdown administrado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada del runtime de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para los auxiliares de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar integrada de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas auxiliares integradas reservadas">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Auxiliares de soporte para plugins de navegador integrados. `browser-profiles` exporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` y `ResolvedBrowserTabCleanupConfig` para la forma normalizada de `browser.tabCleanup`. `browser-support` sigue siendo el barrel de compatibilidad. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie integrada de auxiliares/runtime de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie integrada de auxiliares/runtime de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie integrada de auxiliares de IRC |
    | Auxiliares específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Superficies integradas de compatibilidad/auxiliares de canal |
    | Auxiliares específicos de autenticación/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Superficies integradas de auxiliares de funciones/plugins; `plugin-sdk/github-copilot-token` actualmente exporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Relacionado

- [Descripción general del Plugin SDK](/es/plugins/sdk-overview)
- [Configuración del Plugin SDK](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
