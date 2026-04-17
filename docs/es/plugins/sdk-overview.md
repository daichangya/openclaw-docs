---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en `OpenClawPluginApi`
    - Estás buscando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Descripción general del SDK de Plugin
x-i18n:
    generated_at: "2026-04-17T05:13:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Descripción general del SDK de Plugin

El SDK de plugin es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia para **qué importar** y **qué puedes registrar**.

<Tip>
  **¿Buscas una guía práctica?**
  - ¿Primer plugin? Empieza con [Primeros pasos](/es/plugins/building-plugins)
  - ¿Plugin de canal? Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  - ¿Plugin de proveedor? Consulta [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autocontenido. Esto mantiene un inicio rápido y
evita problemas de dependencias circulares. Para los helpers de entrada/compilación específicos
de canal, prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y los helpers compartidos como
`buildChannelConfigSchema`.

No agregues ni dependas de interfaces de conveniencia nombradas por proveedor como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
interfaces helper con marca de canal. Los plugins incluidos deberían componer subrutas
genéricas del SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el núcleo
debería usar esos barrels locales del plugin o agregar un contrato genérico y estrecho del SDK
cuando la necesidad sea realmente entre canales.

El mapa de exportación generado todavía contiene un pequeño conjunto de interfaces helper
de plugins incluidos, como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para el mantenimiento y la compatibilidad de plugins incluidos; se
omiten intencionalmente de la tabla común de abajo y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas más usadas habitualmente, agrupadas por propósito. La lista completa generada de
más de 200 subrutas se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas helper reservadas para plugins incluidos siguen apareciendo en esa lista generada.
Trátalas como superficies de detalle de implementación/compatibilidad a menos que una página de documentación
promocione explícitamente una como pública.

### Entrada de plugin

| Subruta                    | Exportaciones clave                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración, prompts de allowlist, constructores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/puerta de acciones para múltiples cuentas, helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas y fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers acotados de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato incluido |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de enrutamiento entrante y construcción de sobres |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos para registrar y despachar entradas |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de objetivos |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de medios salientes |
    | `plugin-sdk/outbound-runtime` | Helpers de identidad saliente y delegado de envío |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de adaptador y ciclo de vida de vinculaciones de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de payload de medios del agente |
    | `plugin-sdk/conversation-runtime` | Helpers de conversación/vinculación de hilos, emparejamiento y vinculaciones configuradas |
    | `plugin-sdk/runtime-config-snapshot` | Helper de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de políticas de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Helpers compartidos de instantánea/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas acotadas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización de escritura de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas de plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lectura/edición de configuración de allowlist |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/protección para mensajes directos |
    | `plugin-sdk/interactive-runtime` | Helpers de normalización/reducción de payloads de respuesta interactiva |
    | `plugin-sdk/channel-inbound` | Helpers de debounce de entrada, coincidencia de menciones, política de menciones y sobres |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de objetivos |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Integración de feedback/reacciones |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers curados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados de configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend de CLI y constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/escritura de perfiles de clave API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultados de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers interactivos compartidos de inicio de sesión para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación del proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de repetición, helpers de endpoint de proveedor y helpers de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidad HTTP/endpoint de proveedor |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers acotados de contrato de configuración/selección de web-fetch como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedor web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers acotados de configuración/credenciales de búsqueda web para proveedores que no necesitan integración de habilitación de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers acotados de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini y diagnósticos, y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de streams y helpers compartidos de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de parcheo de configuración de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorización del remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comandos/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprobación de ejecución nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobación |
    | `plugin-sdk/approval-gateway-runtime` | Helper compartido de resolución de Gateway de aprobación |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal críticos |
    | `plugin-sdk/approval-handler-runtime` | Helpers más amplios de tiempo de ejecución del manejador de aprobación; prefiere las interfaces más acotadas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Helpers nativos de objetivo de aprobación y vinculación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de respuesta para aprobaciones de ejecución/plugin |
    | `plugin-sdk/command-auth-native` | Helpers de autenticación de comandos nativos y de objetivos de sesión nativa |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo del comando y de superficie de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers acotados de recopilación de contratos de secretos para superficies de secretos de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers acotados de `coerceSecretRef` y tipado de SecretRef para el análisis de contrato/configuración de secretos |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, restricción de mensajes directos, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de política SSRF para allowlist de hosts y red privada |
    | `plugin-sdk/ssrf-runtime` | Helpers de despachador fijado, `fetch` protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/objetivo de Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño de cuerpo/timeout de solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución, logging, respaldo e instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers acotados de entorno de ejecución, logger, timeout, reintento y backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers genéricos de registro y búsqueda de contexto de tiempo de ejecución de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de comandos, hooks, HTTP e interacción del plugin |
    | `plugin-sdk/hook-runtime` | Helpers compartidos del pipeline de Webhook y hooks internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación lazy en tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato, espera y versión de CLI |
    | `plugin-sdk/gateway-runtime` | Helpers del cliente de Gateway y de parcheo de estado del canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración |
    | `plugin-sdk/telegram-command-config` | Normalización de nombres/descripciones de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación de ejecución/plugin, constructores de capacidad de aprobación, helpers de autenticación/perfil, helpers nativos de enrutamiento/tiempo de ejecución |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de tiempo de ejecución para entrada/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers acotados de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuestas de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers acotados de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta de almacenamiento de sesiones y `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de ruta para directorios de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de ruta/clave de sesión/vinculación de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados del estado de ejecución y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de objetivos |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extrae URL de cadena de entradas tipo fetch/solicitud |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extrae payloads normalizados de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extrae campos canónicos de objetivo de envío desde argumentos de herramientas |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Helpers de logger de subsistema y redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tablas Markdown |
    | `plugin-sdk/json-store` | Helpers pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de desduplicación respaldada en disco |
    | `plugin-sdk/acp-runtime` | Helpers de tiempo de ejecución/sesión de ACP y de despacho de respuestas |
    | `plugin-sdk/agent-config-primitives` | Primitivas acotadas del esquema de configuración de tiempo de ejecución del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencias de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap de dispositivo y token de emparejamiento |
    | `plugin-sdk/extension-shared` | Primitivas helper compartidas para canal pasivo, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Helpers del comando `/models` y de respuesta de proveedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers nativos de registro/creación/serialización de comandos |
    | `plugin-sdk/agent-harness` | Superficie experimental de plugin confiable para harnesses de agente de bajo nivel: tipos de harness, helpers de dirección/abortado de ejecución activa, helpers del puente de herramientas de OpenClaw y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoint de Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Helpers pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de marcas y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Helpers de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración y ejecución de reintentos |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/workspace del agente |
    | `plugin-sdk/directory-runtime` | Consulta/desduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos para obtener/transformar/almacenar medios, además de constructores de payload de medios |
    | `plugin-sdk/media-generation-runtime` | Helpers compartidos de failover de generación de medios, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedor para comprensión de medios, además de exportaciones helper orientadas al proveedor para imagen/audio |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/Markdown/logging como eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tablas Markdown, helpers de redacción, helpers de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz, además de helpers orientados al proveedor para directivas, registro y validación |
    | `plugin-sdk/speech-core` | Helpers compartidos de tipos de proveedor de voz, registro, directivas y normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real y helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Helpers compartidos de tipos de generación de imágenes, failover, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado para generación musical |
    | `plugin-sdk/music-generation-core` | Helpers compartidos de tipos de generación musical, failover, búsqueda de proveedores y análisis de model-ref |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado para generación de video |
    | `plugin-sdk/video-generation-core` | Helpers compartidos de tipos de generación de video, failover, búsqueda de proveedores y análisis de model-ref |
    | `plugin-sdk/webhook-targets` | Helpers de registro de objetivos de Webhook e instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga de medios remotos/locales |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper incluida de memory-core para helpers de administrador/configuración/archivos/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y helpers genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consultas del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de tiempo de ejecución de CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de tiempo de ejecución central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto del proveedor para helpers de tiempo de ejecución central del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto del proveedor para helpers de diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto del proveedor para helpers de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Helpers compartidos de Markdown administrado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al administrador de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto del proveedor para helpers de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper incluida de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas helper reservadas para plugins incluidos">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de soporte del plugin Browser incluido (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/de tiempo de ejecución de Matrix incluida |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/de tiempo de ejecución de LINE incluida |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper de IRC incluida |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces de compatibilidad/helper de canales incluidos |
    | Helpers específicos de autenticación/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces helper de funciones/plugins incluidos; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La callback `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                          |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agente de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend de inferencia de CLI local    |
| `api.registerChannel(...)`                       | Canal de mensajería                   |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz en tiempo real dúplex |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                |
| `api.registerMusicGenerationProvider(...)`       | Generación musical                    |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                   |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                          |

### Herramientas y comandos

| Método                          | Qué registra                                 |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)         |

### Infraestructura

| Método                                         | Qué registra                            |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP de Gateway                |
| `api.registerGatewayMethod(name, handler)`     | Método RPC de Gateway                   |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI                       |
| `api.registerService(service)`                 | Servicio en segundo plano               |
| `api.registerInteractiveHandler(registration)` | Manejador interactivo                   |
| `api.registerMemoryPromptSupplement(builder)`  | Sección adicional del prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de búsqueda/lectura de memoria |

Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
alcance más limitado a un método de Gateway. Prefiere prefijos específicos del plugin para
métodos propiedad del plugin.

### Metadatos de registro de CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comandos explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro lazy de CLI del plugin

Si quieres que un comando de plugin permanezca con carga lazy en la ruta normal de la CLI raíz,
proporciona `descriptors` que cubran cada raíz de comando de nivel superior expuesta por ese
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Administra cuentas, verificación, dispositivos y estado del perfil de Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo solo cuando no necesites registro lazy de la CLI raíz.
Esa ruta de compatibilidad eager sigue siendo compatible, pero no instala
placeholders respaldados por descriptores para la carga lazy en tiempo de análisis.

### Registro de backend de CLI

`api.registerCliBackend(...)` permite que un plugin sea propietario de la configuración predeterminada de un
backend de CLI de IA local como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre el
  valor predeterminado del plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, para normalizar formas antiguas de flags).

### Slots exclusivos

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). La callback `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar las adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad de memoria unificada                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de tiempo de ejecución de memoria                                                                                                          |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado de un
  plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son APIs exclusivas heredadas compatibles para plugins de memoria.
- `registerMemoryEmbeddingProvider` permite que el plugin de memoria activo registre uno
  o más ID de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un ID personalizado
  definido por el plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos ID de adaptadores
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Callback de vinculación de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier manejador reclama el despacho, se omiten los manejadores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier manejador lo establece, se omiten los manejadores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID del plugin                                                                              |
| `api.name`               | `string`                  | Nombre para mostrar                                                                        |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                              |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                          |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                  |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                      |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa en memoria del tiempo de ejecución cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Helpers de tiempo de ejecución](/es/plugins/sdk-runtime)                                     |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del plugin                                            |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas solo para tiempo de ejecución
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) ahora prefieren la
instantánea activa de configuración en tiempo de ejecución cuando OpenClaw ya se está ejecutando. Si aún no
existe una instantánea de tiempo de ejecución, recurren a la configuración resuelta en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local y acotado del plugin cuando un
helper es intencionalmente específico del proveedor y todavía no pertenece a una subruta genérica del SDK.
Ejemplo actual incluido: el proveedor Anthropic mantiene sus helpers de stream de Claude
en su propia interfaz pública `api.ts` / `contract-api.ts` en lugar de
promover la lógica de encabezados beta de Anthropic y `service_tier` a un contrato genérico
`plugin-sdk/*`.

Otros ejemplos actuales incluidos:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedor,
  helpers de modelos predeterminados y constructores de proveedores realtime
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor además de
  helpers de onboarding/configuración

<Warning>
  El código de producción de extensiones también debería evitar importaciones de `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades, en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Puntos de entrada](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Helpers de tiempo de ejecución](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Configuración y config](/es/plugins/sdk-setup) — empaquetado, manifests, esquemas de configuración
- [Pruebas](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [Migración del SDK](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Internos del plugin](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
