---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia de todos los métodos de registro en OpenClawPluginApi
    - Estás consultando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importaciones, referencia de la API de registro y arquitectura del SDK
title: Resumen del Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d801641f26f39dc21490d2a69a337ff1affb147141360916b8b58a267e9f822a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Resumen del Plugin SDK

El plugin SDK es el contrato tipado entre los plugins y el núcleo. Esta página es la
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
evita problemas de dependencias circulares. Para helpers de entrada/construcción específicos
de canal, prefiere `openclaw/plugin-sdk/channel-core`; deja `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y helpers compartidos como
`buildChannelConfigSchema`.

No añadas ni dependas de accesos convenientes con nombre de proveedor como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni
accesos helper con marca de canal. Los plugins empaquetados deben componer subrutas
genéricas del SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el núcleo
debe usar esos barrels locales del plugin o añadir un contrato genérico y estrecho del SDK
cuando la necesidad sea realmente entre canales.

El mapa de exportaciones generado todavía contiene un pequeño conjunto de accesos helper
de plugins empaquetados como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para mantenimiento y compatibilidad de plugins empaquetados; se
omiten intencionalmente de la tabla común siguiente y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas más usadas, agrupadas por propósito. La lista completa generada de
más de 200 subrutas está en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas helper reservadas para plugins empaquetados siguen apareciendo en esa lista generada.
Trátalas como una superficie de implementación/compatibilidad a menos que una página de documentación
promocione explícitamente una como pública.

### Entrada de plugin

| Subruta                    | Exportaciones clave                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers compartidos de asistente de configuración, prompts de lista de permitidos, generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuración/controles de acciones multi-cuenta y helpers de fallback de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuenta y fallback predeterminado |
    | `plugin-sdk/account-helpers` | Helpers concretos de lista de cuentas/acciones de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalización/validación de comandos personalizados de Telegram con fallback de contrato empaquetado |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers compartidos de ruta entrante y construcción de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers compartidos para registrar y despachar entradas |
    | `plugin-sdk/messaging-targets` | Helpers de análisis/coincidencia de destino |
    | `plugin-sdk/outbound-media` | Helpers compartidos de carga de multimedia saliente |
    | `plugin-sdk/outbound-runtime` | Helpers de identidad saliente y delegado de envío |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de ciclo de vida y adaptador de vinculaciones de hilo |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga multimedia del agente |
    | `plugin-sdk/conversation-runtime` | Helpers de conversación/vinculación de hilo, vinculación y binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Helper de snapshot de configuración de runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de resolución de política de grupo en runtime |
    | `plugin-sdk/channel-status` | Helpers compartidos de snapshot/resumen de estado de canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas concretas de esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Helpers de autorización para escrituras de configuración de canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartidas para plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de edición/lectura de configuración de lista de permitidos |
    | `plugin-sdk/group-access` | Helpers compartidos de decisión de acceso a grupos |
    | `plugin-sdk/direct-dm` | Helpers compartidos de autenticación/protección para DM directo |
    | `plugin-sdk/interactive-runtime` | Helpers de normalización/reducción de carga de respuesta interactiva |
    | `plugin-sdk/channel-inbound` | Helpers de debounce, coincidencia de mención y sobre |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers de análisis/coincidencia de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacciones |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers enfocados para configuración de proveedores autohospedados compatibles con OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Helpers de resolución de claves API en runtime para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Helpers de onboarding/escritura de perfil de clave API |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de replay, helpers de endpoint de proveedor y helpers de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers genéricos de capacidades HTTP/endpoint de proveedor |
    | `plugin-sdk/provider-web-fetch` | Helpers de registro/caché de proveedores web-fetch |
    | `plugin-sdk/provider-web-search` | Helpers de registro/caché/configuración de proveedores web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquemas Gemini + diagnósticos, y helpers de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltura de stream y helpers compartidos de envoltura para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de parche de configuración de onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registro de comandos, helpers de autorización de remitente |
    | `plugin-sdk/approval-auth-runtime` | Helpers de resolución de aprobadores y autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de perfil/filtro de aprobaciones nativas de ejecución |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores de capacidad/entrega de aprobación nativa |
    | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación nativa y vinculación de cuenta |
    | `plugin-sdk/approval-reply-runtime` | Helpers de carga de respuesta para aprobación exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers de autenticación de comandos nativos y destino de sesión nativa |
    | `plugin-sdk/command-detection` | Helpers compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Helpers de normalización del cuerpo de comando y superficie de comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helpers compartidos de confianza, control de DM, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Helpers de allowlist de hosts y política SSRF de red privada |
    | `plugin-sdk/ssrf-runtime` | Helpers de pinned-dispatcher, fetch protegido por SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Helpers de análisis de entrada secreta |
    | `plugin-sdk/webhook-ingress` | Helpers de solicitud/destino de webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de tamaño de cuerpo/tiempo de espera de solicitud |
  </Accordion>

  <Accordion title="Subrutas de runtime y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers amplios de runtime/logging/copia de seguridad/instalación de plugins |
    | `plugin-sdk/runtime-env` | Helpers concretos de entorno de runtime, logger, timeout, retry y backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers compartidos de plugin para comandos/hooks/http/interactivo |
    | `plugin-sdk/hook-runtime` | Helpers compartidos del pipeline de hooks webhook/internos |
    | `plugin-sdk/lazy-runtime` | Helpers de importación/vinculación perezosa de runtime como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Helpers de formato CLI, espera y versión |
    | `plugin-sdk/gateway-runtime` | Helpers de cliente gateway y parche de estado de canal |
    | `plugin-sdk/config-runtime` | Helpers de carga/escritura de configuración |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comando de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato de Telegram empaquetada no está disponible |
    | `plugin-sdk/approval-runtime` | Helpers de aprobación exec/plugin, constructores de capacidad de aprobación, helpers de auth/perfil, helpers nativos de routing/runtime |
    | `plugin-sdk/reply-runtime` | Helpers compartidos de runtime para entrada/respuesta, fragmentación, despacho, heartbeat, planificador de respuesta |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers concretos de despacho/finalización de respuesta |
    | `plugin-sdk/reply-history` | Helpers compartidos de historial de respuesta de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers concretos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de ruta del almacén de sesiones y updated-at |
    | `plugin-sdk/state-paths` | Helpers de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Helpers de ruta/clave de sesión/vinculación de cuenta como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de runtime y helpers de metadatos de incidencias |
    | `plugin-sdk/target-resolver-runtime` | Helpers compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extraer URLs de cadena de entradas tipo fetch/request |
    | `plugin-sdk/run-command` | Ejecutor de comandos con tiempo medido y resultados stdout/stderr normalizados |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramienta/CLI |
    | `plugin-sdk/tool-send` | Extraer campos de destino de envío canónicos de argumentos de herramienta |
    | `plugin-sdk/temp-path` | Helpers compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Logger de subsistema y helpers de redacción |
    | `plugin-sdk/markdown-table-runtime` | Helpers de modo de tabla Markdown |
    | `plugin-sdk/json-store` | Helpers pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Helpers de bloqueo de archivo reentrante |
    | `plugin-sdk/persistent-dedupe` | Helpers de caché de deduplicación persistente en disco |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/sesión ACP y despacho de respuesta |
    | `plugin-sdk/agent-config-primitives` | Primitivas concretas de esquema de configuración de runtime del agente |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de resolución de coincidencia de nombre peligrosa |
    | `plugin-sdk/device-bootstrap` | Helpers de arranque de dispositivo y token de vinculación |
    | `plugin-sdk/extension-shared` | Primitivas helper compartidas para canales pasivos y estado |
    | `plugin-sdk/models-provider-runtime` | Helpers de respuesta para comando `/models`/proveedor |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listado de comandos de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de detección de endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers de evento del sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Helpers pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Helpers de marca y evento de diagnóstico |
    | `plugin-sdk/error-runtime` | Grafo de errores, formato, helpers compartidos de clasificación de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/host-runtime` | Helpers de normalización de hostname y host SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuración de retry y ejecutor de retry |
    | `plugin-sdk/agent-runtime` | Helpers de directorio/identidad/workspace de agente |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios basada en configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers compartidos de obtención/transformación/almacenamiento de multimedia más constructores de carga multimedia |
    | `plugin-sdk/media-understanding` | Tipos de proveedor de comprensión multimedia más exportaciones de helpers de imagen/audio para proveedores |
    | `plugin-sdk/text-runtime` | Helpers compartidos de texto/Markdown/logging como eliminación de texto visible para el asistente, renderizado/fragmentación/tablas Markdown, redacción, etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Helper de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedor de voz más helpers orientados al proveedor para directivas, registro y validación |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedor de voz, registro, directiva y helpers de normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedor de transcripción en tiempo real y helpers de registro |
    | `plugin-sdk/realtime-voice` | Tipos de proveedor de voz en tiempo real y helpers de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedor de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, failover, autenticación y helpers de registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación musical |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación musical, helpers de failover, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, helpers de failover, búsqueda de proveedor y análisis de model-ref |
    | `plugin-sdk/webhook-targets` | Registro de destinos webhook y helpers de instalación de rutas |
    | `plugin-sdk/webhook-path` | Helpers de normalización de ruta de webhook |
    | `plugin-sdk/web-media` | Helpers compartidos de carga multimedia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper empaquetada memory-core para helpers de gestor/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exportaciones del motor de embeddings del host de memoria |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers de runtime CLI del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers de runtime central del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/runtime del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper empaquetada memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas helper empaquetadas reservadas">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de soporte del plugin Browser empaquetado (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime empaquetada de Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime empaquetada de LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper empaquetada de IRC |
    | Helpers específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Accesos de compatibilidad/helper para canales empaquetados |
    | Helpers específicos de auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Accesos helper para funciones/plugins empaquetados; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                     |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)        |
| `api.registerChannel(...)`                       | Canal de mensajería              |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video   |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes           |
| `api.registerMusicGenerationProvider(...)`       | Generación musical               |
| `api.registerVideoGenerationProvider(...)`       | Generación de video              |
| `api.registerWebFetchProvider(...)`              | Proveedor de web fetch / scraping |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                     |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta del agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                         | Qué registra         |
| ---------------------------------------------- | -------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento       |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del gateway |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del gateway |
| `api.registerCli(registrar, opts?)`            | Subcomando de CLI    |
| `api.registerService(service)`                 | Servicio en segundo plano |
| `api.registerInteractiveHandler(registration)` | Controlador interactivo |

Los espacios de nombres de administración reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen como `operator.admin`, incluso si un plugin intenta asignar un
ámbito más estrecho a un método del gateway. Prefiere prefijos específicos del plugin para
métodos propiedad del plugin.

### Metadatos de registro CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comando explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda de la CLI raíz,
  el enrutamiento y el registro perezoso de CLI de plugins

Si quieres que un comando de plugin siga cargándose de forma perezosa en la ruta normal de la CLI raíz,
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
        description: "Administrar cuentas de Matrix, verificación, dispositivos y estado del perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo únicamente cuando no necesites registro perezoso en la CLI raíz.
Esa ruta de compatibilidad ansiosa sigue siendo compatible, pero no instala
marcadores respaldados por descriptores para carga perezosa en tiempo de análisis.

### Ranuras exclusivas

| Método                                     | Qué registra                         |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (solo uno activo a la vez) |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memoria      |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el plugin activo |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son exclusivos de los plugins de memoria.
- `registerMemoryEmbeddingProvider` permite al plugin de memoria activo registrar
  uno o más IDs de adaptador de embeddings (por ejemplo `openai`, `gemini` o un ID personalizado
  definido por el plugin).
- La configuración de usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve contra esos IDs de adaptador
  registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                      |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Callback de resolución de vinculación de conversación |

### Semántica de decisiones de hook

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de prioridad inferior.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de prioridad inferior.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que cualquier controlador reclama el despacho, se omiten los controladores de prioridad inferior y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que cualquier controlador lo establece, se omiten los controladores de prioridad inferior.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                   |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                 |
| `api.name`               | `string`                  | Nombre visible                                                                                |
| `api.version`            | `string?`                 | Versión del plugin (opcional)                                                                 |
| `api.description`        | `string?`                 | Descripción del plugin (opcional)                                                             |
| `api.source`             | `string`                  | Ruta de origen del plugin                                                                     |
| `api.rootDir`            | `string?`                 | Directorio raíz del plugin (opcional)                                                         |
| `api.config`             | `OpenClawConfig`          | Snapshot actual de configuración (snapshot activo en memoria del runtime cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del plugin desde `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/es/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger con ámbito (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver ruta relativa a la raíz del plugin                                                   |

## Convención de módulos internos

Dentro de tu plugin, usa archivos barrel locales para las importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas de runtime
  index.ts          # Punto de entrada del plugin
  setup-entry.ts    # Entrada ligera solo para configuración (opcional)
```

<Warning>
  Nunca importes tu propio plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas a través de `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins empaquetados cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada pública similares) ahora prefieren el
snapshot activo de configuración del runtime cuando OpenClaw ya está en ejecución. Si todavía no existe
un snapshot de runtime, usan como fallback el archivo de configuración resuelto en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local y concreto cuando un
helper es intencionalmente específico del proveedor y todavía no pertenece a una subruta genérica
del SDK. Ejemplo empaquetado actual: el proveedor Anthropic mantiene sus helpers de stream Claude
en su propio acceso público `api.ts` / `contract-api.ts` en lugar de promocionar la lógica de
encabezados beta de Anthropic y `service_tier` a un contrato genérico
`plugin-sdk/*`.

Otros ejemplos empaquetados actuales:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedores,
  helpers de modelo predeterminado y constructores de proveedores en tiempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor más
  helpers de onboarding/configuración

<Warning>
  El código de producción de extensiones también debe evitar importaciones `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Puntos de entrada](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Helpers de runtime](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Configuración y config](/es/plugins/sdk-setup) — empaquetado, manifiestos, esquemas de configuración
- [Pruebas](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [Migración del SDK](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Internos del plugin](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
