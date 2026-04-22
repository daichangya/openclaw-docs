---
read_when:
    - Necesitas saber desde qué subruta del SDK importar
    - Quieres una referencia para todos los métodos de registro de `OpenClawPluginApi`
    - Estás consultando una exportación específica del SDK
sidebarTitle: SDK Overview
summary: Mapa de importación, referencia de la API de registro y arquitectura del SDK
title: Resumen del SDK de plugins
x-i18n:
    generated_at: "2026-04-22T04:25:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Resumen del SDK de plugins

El SDK de plugins es el contrato tipado entre los plugins y el núcleo. Esta página es la
referencia de **qué importar** y **qué puedes registrar**.

<Tip>
  **¿Buscas una guía práctica?**
  - ¿Primer Plugin? Empieza con [Primeros pasos](/es/plugins/building-plugins)
  - ¿Plugin de canal? Consulta [plugins de canal](/es/plugins/sdk-channel-plugins)
  - ¿Plugin de proveedor? Consulta [plugins de proveedor](/es/plugins/sdk-provider-plugins)
</Tip>

## Convención de importación

Importa siempre desde una subruta específica:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subruta es un módulo pequeño y autónomo. Esto mantiene un inicio rápido y
evita problemas de dependencias circulares. Para asistentes de entrada/compilación específicos de canal,
prefiere `openclaw/plugin-sdk/channel-core`; reserva `openclaw/plugin-sdk/core` para
la superficie paraguas más amplia y asistentes compartidos como
`buildChannelConfigSchema`.

No añadas ni dependas de costuras de conveniencia con nombre de proveedor como
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
costuras auxiliares con marca de canal. Los plugins incluidos deben componer subrutas genéricas del
SDK dentro de sus propios barrels `api.ts` o `runtime-api.ts`, y el núcleo
debe usar esos barrels locales del Plugin o añadir un contrato genérico y estrecho del SDK
cuando la necesidad sea realmente transversal entre canales.

El mapa de exportaciones generado todavía contiene un pequeño conjunto de costuras auxiliares de plugins incluidos
como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Esas
subrutas existen solo para mantenimiento y compatibilidad de plugins incluidos; se
omiten intencionadamente de la tabla común siguiente y no son la ruta de importación
recomendada para nuevos plugins de terceros.

## Referencia de subrutas

Las subrutas usadas con más frecuencia, agrupadas por propósito. La lista completa generada de
más de 200 subrutas está en `scripts/lib/plugin-sdk-entrypoints.json`.

Las subrutas auxiliares reservadas para plugins incluidos siguen apareciendo en esa lista generada.
Trátalas como superficies de detalle de implementación/compatibilidad a menos que una página de documentación
promueva explícitamente alguna como pública.

### Entrada de Plugin

| Subruta                    | Exportaciones clave                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subrutas de canal">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportación del esquema Zod raíz de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Asistentes compartidos del asistente de configuración, solicitudes de listas de permitidos, generadores de estado de configuración |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Asistentes de configuración/multicuenta y de restricción de acciones, asistentes de respaldo de cuenta predeterminada |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, asistentes de normalización de ID de cuenta |
    | `plugin-sdk/account-resolution` | Búsqueda de cuentas + asistentes de respaldo predeterminado |
    | `plugin-sdk/account-helpers` | Asistentes estrechos de lista de cuentas/acción de cuenta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipos de esquema de configuración de canal |
    | `plugin-sdk/telegram-command-config` | Asistentes de normalización/validación de comandos personalizados de Telegram con respaldo de contrato incluido |
    | `plugin-sdk/command-gating` | Asistentes estrechos de restricción de autorización de comandos |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, asistentes de ciclo de vida/finalización de flujo de borrador |
    | `plugin-sdk/inbound-envelope` | Asistentes compartidos de ruta entrante + constructor de sobre |
    | `plugin-sdk/inbound-reply-dispatch` | Asistentes compartidos de registro y despacho entrante |
    | `plugin-sdk/messaging-targets` | Asistentes de análisis/coincidencia de destino |
    | `plugin-sdk/outbound-media` | Asistentes compartidos de carga de contenido multimedia saliente |
    | `plugin-sdk/outbound-runtime` | Asistentes de identidad saliente, delegado de envío y planificación de carga |
    | `plugin-sdk/poll-runtime` | Asistentes estrechos de normalización de sondeos |
    | `plugin-sdk/thread-bindings-runtime` | Asistentes de ciclo de vida y adaptador de vinculación de hilos |
    | `plugin-sdk/agent-media-payload` | Constructor heredado de carga multimedia de agente |
    | `plugin-sdk/conversation-runtime` | Asistentes de vinculación de conversación/hilo, pairing y binding configurado |
    | `plugin-sdk/runtime-config-snapshot` | Asistente de instantánea de configuración en tiempo de ejecución |
    | `plugin-sdk/runtime-group-policy` | Asistentes de resolución de política de grupo en tiempo de ejecución |
    | `plugin-sdk/channel-status` | Asistentes compartidos de instantánea/resumen de estado del canal |
    | `plugin-sdk/channel-config-primitives` | Primitivas estrechas del esquema de configuración de canal |
    | `plugin-sdk/channel-config-writes` | Asistentes de autorización de escritura de configuración del canal |
    | `plugin-sdk/channel-plugin-common` | Exportaciones de preludio compartido del Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Asistentes de lectura/edición de configuración de listas de permitidos |
    | `plugin-sdk/group-access` | Asistentes compartidos de decisión de acceso a grupo |
    | `plugin-sdk/direct-dm` | Asistentes compartidos de autenticación/protección de mensajes directos |
    | `plugin-sdk/interactive-runtime` | Asistentes de presentación semántica de mensajes, entrega y respuesta interactiva heredada. Consulta [Presentación de mensajes](/es/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilidad para antirrebote entrante, coincidencia de menciones, asistentes de política de mención y asistentes de sobre |
    | `plugin-sdk/channel-mention-gating` | Asistentes estrechos de política de mención sin la superficie más amplia del tiempo de ejecución entrante |
    | `plugin-sdk/channel-location` | Asistentes de contexto y formato de ubicación de canal |
    | `plugin-sdk/channel-logging` | Asistentes de registro de canal para descartes entrantes y fallos de escritura/confirmación |
    | `plugin-sdk/channel-send-result` | Tipos de resultado de respuesta |
    | `plugin-sdk/channel-actions` | Asistentes de acciones de mensajes de canal, además de asistentes de esquema nativo obsoletos mantenidos para compatibilidad de plugins |
    | `plugin-sdk/channel-targets` | Asistentes de análisis/coincidencia de destino |
    | `plugin-sdk/channel-contract` | Tipos de contrato de canal |
    | `plugin-sdk/channel-feedback` | Cableado de feedback/reacción |
    | `plugin-sdk/channel-secret-runtime` | Asistentes estrechos de contrato de secretos como `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` y tipos de destino de secretos |
  </Accordion>

  <Accordion title="Subrutas de proveedor">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Asistentes de configuración de proveedor local/autohospedado seleccionados |
    | `plugin-sdk/self-hosted-provider-setup` | Asistentes centrados de configuración de proveedor autohospedado compatible con OpenAI |
    | `plugin-sdk/cli-backend` | Valores predeterminados del backend CLI + constantes del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Asistentes de resolución de claves API en tiempo de ejecución para plugins de proveedor |
    | `plugin-sdk/provider-auth-api-key` | Asistentes de incorporación/escritura de perfiles de claves API como `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructor estándar de resultado de autenticación OAuth |
    | `plugin-sdk/provider-auth-login` | Asistentes compartidos de inicio de sesión interactivo para plugins de proveedor |
    | `plugin-sdk/provider-env-vars` | Asistentes de búsqueda de variables de entorno de autenticación del proveedor |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de política de repetición, asistentes de endpoint de proveedor y asistentes de normalización de ID de modelo como `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Asistentes genéricos de HTTP/capacidad de endpoint del proveedor |
    | `plugin-sdk/provider-web-fetch-contract` | Asistentes estrechos de contrato de configuración/selección de obtención web como `enablePluginInConfig` y `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Asistentes de registro/caché de proveedor de obtención web |
    | `plugin-sdk/provider-web-search-config-contract` | Asistentes estrechos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Asistentes estrechos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con ámbito |
    | `plugin-sdk/provider-web-search` | Asistentes de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza + diagnósticos de esquema Gemini y asistentes de compatibilidad xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` y similares |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de envoltura de flujo y asistentes compartidos de envoltura para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Asistentes nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y flujos escribibles de eventos de transporte |
    | `plugin-sdk/provider-onboard` | Asistentes de parche de configuración de incorporación |
    | `plugin-sdk/global-singleton` | Asistentes de singleton/mapa/caché locales al proceso |
  </Accordion>

  <Accordion title="Subrutas de autenticación y seguridad">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, asistentes del registro de comandos, asistentes de autorización de remitente |
    | `plugin-sdk/command-status` | Constructores de mensajes de comando/ayuda como `buildCommandsMessagePaginated` y `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Resolución de aprobadores y asistentes de autenticación de acciones en el mismo chat |
    | `plugin-sdk/approval-client-runtime` | Asistentes nativos de perfil/filtro de aprobación de exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptadores nativos de capacidad/entrega de aprobaciones |
    | `plugin-sdk/approval-gateway-runtime` | Asistente compartido de resolución del Gateway de aprobaciones |
    | `plugin-sdk/approval-handler-adapter-runtime` | Asistentes ligeros de carga de adaptadores nativos de aprobación para puntos de entrada calientes de canales |
    | `plugin-sdk/approval-handler-runtime` | Asistentes más amplios de tiempo de ejecución para controladores de aprobación; prefiere las costuras más estrechas de adaptador/Gateway cuando sean suficientes |
    | `plugin-sdk/approval-native-runtime` | Asistentes nativos de destino de aprobación + vinculación de cuentas |
    | `plugin-sdk/approval-reply-runtime` | Asistentes de carga de respuesta para aprobaciones de exec/Plugin |
    | `plugin-sdk/command-auth-native` | Asistentes de autenticación de comandos nativos + destino de sesión nativa |
    | `plugin-sdk/command-detection` | Asistentes compartidos de detección de comandos |
    | `plugin-sdk/command-surface` | Asistentes de normalización del cuerpo de comandos y de la superficie de comandos |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Asistentes estrechos de recopilación de contratos de secretos para superficies de secretos de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Asistentes estrechos de tipado `coerceSecretRef` y SecretRef para análisis de contratos de secretos/configuración |
    | `plugin-sdk/security-runtime` | Asistentes compartidos de confianza, restricción de mensajes directos, contenido externo y recopilación de secretos |
    | `plugin-sdk/ssrf-policy` | Asistentes de política SSRF para lista de permitidos de hosts y redes privadas |
    | `plugin-sdk/ssrf-dispatcher` | Asistentes estrechos de dispatcher fijado sin la amplia superficie de tiempo de ejecución de infraestructura |
    | `plugin-sdk/ssrf-runtime` | Asistentes de dispatcher fijado, fetch protegido contra SSRF y política SSRF |
    | `plugin-sdk/secret-input` | Asistentes de análisis de entrada de secretos |
    | `plugin-sdk/webhook-ingress` | Asistentes de solicitud/destino de Webhook |
    | `plugin-sdk/webhook-request-guards` | Asistentes de tamaño/tiempo de espera del cuerpo de la solicitud |
  </Accordion>

  <Accordion title="Subrutas de tiempo de ejecución y almacenamiento">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/runtime` | Asistentes amplios de tiempo de ejecución/registro/respaldo/instalación de plugins |
    | `plugin-sdk/runtime-env` | Asistentes estrechos de entorno de tiempo de ejecución, registrador, tiempo de espera, reintento y backoff |
    | `plugin-sdk/channel-runtime-context` | Asistentes genéricos de registro y búsqueda de contexto de tiempo de ejecución de canales |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Asistentes compartidos de comandos/hooks/http/interacciones de plugins |
    | `plugin-sdk/hook-runtime` | Asistentes compartidos de canalización de hooks internos/Webhook |
    | `plugin-sdk/lazy-runtime` | Asistentes de importación/vinculación diferida de tiempo de ejecución como `createLazyRuntimeModule`, `createLazyRuntimeMethod` y `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Asistentes de ejecución de procesos |
    | `plugin-sdk/cli-runtime` | Asistentes de formato CLI, espera y versión |
    | `plugin-sdk/gateway-runtime` | Asistentes del cliente Gateway y de parche de estado de canal |
    | `plugin-sdk/config-runtime` | Asistentes de carga/escritura de configuración |
    | `plugin-sdk/telegram-command-config` | Normalización de nombre/descripción de comandos de Telegram y comprobaciones de duplicados/conflictos, incluso cuando la superficie de contrato incluida de Telegram no está disponible |
    | `plugin-sdk/text-autolink-runtime` | Detección de autovínculos de referencias de archivo sin el amplio barrel de text-runtime |
    | `plugin-sdk/approval-runtime` | Asistentes de aprobación de exec/Plugin, constructores de capacidad de aprobación, asistentes de autenticación/perfil, asistentes nativos de enrutamiento/tiempo de ejecución |
    | `plugin-sdk/reply-runtime` | Asistentes compartidos de tiempo de ejecución entrante/respuesta, fragmentación, despacho, Heartbeat, planificador de respuestas |
    | `plugin-sdk/reply-dispatch-runtime` | Asistentes estrechos de despacho/finalización de respuestas |
    | `plugin-sdk/reply-history` | Asistentes compartidos de historial de respuestas de ventana corta como `buildHistoryContext`, `recordPendingHistoryEntry` y `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Asistentes estrechos de fragmentación de texto/Markdown |
    | `plugin-sdk/session-store-runtime` | Asistentes de ruta del almacén de sesiones + `updated-at` |
    | `plugin-sdk/state-paths` | Asistentes de rutas de directorios de estado/OAuth |
    | `plugin-sdk/routing` | Asistentes de enrutamiento/clave de sesión/vinculación de cuentas como `resolveAgentRoute`, `buildAgentSessionKey` y `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Asistentes compartidos de resumen de estado de canal/cuenta, valores predeterminados de estado de tiempo de ejecución y asistentes de metadatos de problemas |
    | `plugin-sdk/target-resolver-runtime` | Asistentes compartidos de resolución de destino |
    | `plugin-sdk/string-normalization-runtime` | Asistentes de normalización de slug/cadenas |
    | `plugin-sdk/request-url` | Extraer URL de cadena de entradas tipo fetch/solicitud |
    | `plugin-sdk/run-command` | Ejecutor de comandos temporizado con resultados normalizados de stdout/stderr |
    | `plugin-sdk/param-readers` | Lectores comunes de parámetros de herramientas/CLI |
    | `plugin-sdk/tool-payload` | Extraer cargas normalizadas de objetos de resultado de herramientas |
    | `plugin-sdk/tool-send` | Extraer campos canónicos de destino de envío de argumentos de herramientas |
    | `plugin-sdk/temp-path` | Asistentes compartidos de rutas temporales de descarga |
    | `plugin-sdk/logging-core` | Asistentes de registrador de subsistemas y redacción |
    | `plugin-sdk/markdown-table-runtime` | Asistentes de modo de tabla Markdown |
    | `plugin-sdk/json-store` | Asistentes pequeños de lectura/escritura de estado JSON |
    | `plugin-sdk/file-lock` | Asistentes de bloqueo de archivos reentrantes |
    | `plugin-sdk/persistent-dedupe` | Asistentes de caché de deduplicación con respaldo en disco |
    | `plugin-sdk/acp-runtime` | Asistentes de tiempo de ejecución/sesión ACP y despacho de respuestas |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolución de bindings ACP de solo lectura sin importaciones de inicio del ciclo de vida |
    | `plugin-sdk/agent-config-primitives` | Primitivas estrechas del esquema de configuración de tiempo de ejecución de agentes |
    | `plugin-sdk/boolean-param` | Lector flexible de parámetros booleanos |
    | `plugin-sdk/dangerous-name-runtime` | Asistentes de resolución de coincidencia de nombres peligrosos |
    | `plugin-sdk/device-bootstrap` | Asistentes de bootstrap de dispositivos y tokens de pairing |
    | `plugin-sdk/extension-shared` | Primitivas auxiliares compartidas para canales pasivos, estado y proxy ambiental |
    | `plugin-sdk/models-provider-runtime` | Asistentes de respuesta del comando `/models`/proveedor |
    | `plugin-sdk/skill-commands-runtime` | Asistentes para listar comandos de Skills |
    | `plugin-sdk/native-command-registry` | Asistentes de registro/construcción/serialización de comandos nativos |
    | `plugin-sdk/agent-harness` | Superficie experimental de Plugin de confianza para arneses de agentes de bajo nivel: tipos de arnés, asistentes de dirigir/abortar ejecuciones activas, asistentes del puente de herramientas de OpenClaw y utilidades de resultados de intentos |
    | `plugin-sdk/provider-zai-endpoint` | Asistentes de detección de endpoints de Z.AI |
    | `plugin-sdk/infra-runtime` | Asistentes de eventos del sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Asistentes pequeños de caché acotada |
    | `plugin-sdk/diagnostic-runtime` | Asistentes de banderas y eventos de diagnóstico |
    | `plugin-sdk/error-runtime` | Asistentes de grafo de errores, formato, clasificación compartida de errores, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Asistentes de fetch envuelto, proxy y búsqueda fijada |
    | `plugin-sdk/runtime-fetch` | Fetch de tiempo de ejecución consciente del dispatcher sin importaciones de proxy/fetch protegido |
    | `plugin-sdk/response-limit-runtime` | Lector acotado del cuerpo de respuesta sin la amplia superficie de tiempo de ejecución multimedia |
    | `plugin-sdk/session-binding-runtime` | Estado actual de vinculación de conversaciones sin enrutamiento de bindings configurados ni almacenes de pairing |
    | `plugin-sdk/session-store-runtime` | Asistentes de lectura del almacén de sesiones sin amplias importaciones de escrituras/mantenimiento de configuración |
    | `plugin-sdk/context-visibility-runtime` | Resolución de visibilidad del contexto y filtrado de contexto suplementario sin amplias importaciones de configuración/seguridad |
    | `plugin-sdk/string-coerce-runtime` | Asistentes estrechos de coerción y normalización de registros/cadenas primitivas sin importaciones de Markdown/registro |
    | `plugin-sdk/host-runtime` | Asistentes de normalización de nombres de host y de hosts SCP |
    | `plugin-sdk/retry-runtime` | Asistentes de configuración de reintentos y ejecutor de reintentos |
    | `plugin-sdk/agent-runtime` | Asistentes de directorio/identidad/espacio de trabajo de agentes |
    | `plugin-sdk/directory-runtime` | Consulta/deduplicación de directorios respaldada por configuración |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subrutas de capacidades y pruebas">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Asistentes compartidos de obtención/transformación/almacenamiento multimedia además de constructores de cargas multimedia |
    | `plugin-sdk/media-generation-runtime` | Asistentes compartidos de respaldo para generación multimedia, selección de candidatos y mensajes de modelo faltante |
    | `plugin-sdk/media-understanding` | Tipos de proveedores de comprensión multimedia además de exportaciones auxiliares orientadas a proveedores para imagen/audio |
    | `plugin-sdk/text-runtime` | Asistentes compartidos de texto/Markdown/registro como eliminación de texto visible para el asistente, asistentes de renderizado/fragmentación/tablas Markdown, asistentes de redacción, asistentes de etiquetas de directivas y utilidades de texto seguro |
    | `plugin-sdk/text-chunking` | Asistente de fragmentación de texto saliente |
    | `plugin-sdk/speech` | Tipos de proveedores de voz además de asistentes orientados a proveedores para directivas, registro y validación |
    | `plugin-sdk/speech-core` | Tipos compartidos de proveedores de voz, registro, directivas y asistentes de normalización |
    | `plugin-sdk/realtime-transcription` | Tipos de proveedores de transcripción en tiempo real y asistentes de registro |
    | `plugin-sdk/realtime-voice` | Tipos de proveedores de voz en tiempo real y asistentes de registro |
    | `plugin-sdk/image-generation` | Tipos de proveedores de generación de imágenes |
    | `plugin-sdk/image-generation-core` | Tipos compartidos de generación de imágenes, asistentes de respaldo, autenticación y registro |
    | `plugin-sdk/music-generation` | Tipos de proveedor/solicitud/resultado de generación musical |
    | `plugin-sdk/music-generation-core` | Tipos compartidos de generación musical, asistentes de respaldo, búsqueda de proveedores y análisis de refs de modelos |
    | `plugin-sdk/video-generation` | Tipos de proveedor/solicitud/resultado de generación de video |
    | `plugin-sdk/video-generation-core` | Tipos compartidos de generación de video, asistentes de respaldo, búsqueda de proveedores y análisis de refs de modelos |
    | `plugin-sdk/webhook-targets` | Registro de destinos de Webhook y asistentes de instalación de rutas |
    | `plugin-sdk/webhook-path` | Asistentes de normalización de rutas de Webhook |
    | `plugin-sdk/web-media` | Asistentes compartidos de carga multimedia remota/local |
    | `plugin-sdk/zod` | `zod` reexportado para consumidores del SDK de plugins |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subrutas de memoria">
    | Subruta | Exportaciones clave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie auxiliar incluida de memory-core para asistentes de manager/configuración/archivo/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución para índice/búsqueda de memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportaciones del motor base del host de memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratos de embeddings del host de memoria, acceso al registro, proveedor local y asistentes genéricos por lotes/remotos |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportaciones del motor QMD del host de memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportaciones del motor de almacenamiento del host de memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Asistentes multimodales del host de memoria |
    | `plugin-sdk/memory-core-host-query` | Asistentes de consulta del host de memoria |
    | `plugin-sdk/memory-core-host-secret` | Asistentes de secretos del host de memoria |
    | `plugin-sdk/memory-core-host-events` | Asistentes del diario de eventos del host de memoria |
    | `plugin-sdk/memory-core-host-status` | Asistentes de estado del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Asistentes CLI de tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Asistentes principales de tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Asistentes de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-core` | Alias neutral respecto al proveedor para asistentes principales de tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-events` | Alias neutral respecto al proveedor para asistentes del diario de eventos del host de memoria |
    | `plugin-sdk/memory-host-files` | Alias neutral respecto al proveedor para asistentes de archivos/tiempo de ejecución del host de memoria |
    | `plugin-sdk/memory-host-markdown` | Asistentes compartidos de Markdown administrado para plugins adyacentes a memoria |
    | `plugin-sdk/memory-host-search` | Fachada de tiempo de ejecución de Active Memory para acceso al gestor de búsqueda |
    | `plugin-sdk/memory-host-status` | Alias neutral respecto al proveedor para asistentes de estado del host de memoria |
    | `plugin-sdk/memory-lancedb` | Superficie auxiliar incluida de memory-lancedb |
  </Accordion>

  <Accordion title="Subrutas auxiliares reservadas para componentes incluidos">
    | Familia | Subrutas actuales | Uso previsto |
    | --- | --- | --- |
    | Navegador | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Asistentes de soporte del Plugin de navegador incluido (`browser-support` sigue siendo el barrel de compatibilidad) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie auxiliar/de tiempo de ejecución de Matrix incluida |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie auxiliar/de tiempo de ejecución de LINE incluida |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie auxiliar incluida de IRC |
    | Asistentes específicos de canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Costuras de compatibilidad/asistentes de canales incluidos |
    | Asistentes específicos de autenticación/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Costuras auxiliares de funciones/plugins incluidos; `plugin-sdk/github-copilot-token` exporta actualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API de registro

La devolución de llamada `register(api)` recibe un objeto `OpenClawPluginApi` con estos
métodos:

### Registro de capacidades

| Método                                           | Qué registra                           |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferencia de texto (LLM)              |
| `api.registerAgentHarness(...)`                  | Ejecutor experimental de agentes de bajo nivel |
| `api.registerCliBackend(...)`                    | Backend local de inferencia por CLI    |
| `api.registerChannel(...)`                       | Canal de mensajería                    |
| `api.registerSpeechProvider(...)`                | Síntesis de texto a voz / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcripción en tiempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sesiones de voz bidireccionales en tiempo real |
| `api.registerMediaUnderstandingProvider(...)`    | Análisis de imagen/audio/video         |
| `api.registerImageGenerationProvider(...)`       | Generación de imágenes                 |
| `api.registerMusicGenerationProvider(...)`       | Generación de música                   |
| `api.registerVideoGenerationProvider(...)`       | Generación de video                    |
| `api.registerWebFetchProvider(...)`              | Proveedor de obtención / scraping web  |
| `api.registerWebSearchProvider(...)`             | Búsqueda web                           |

### Herramientas y comandos

| Método                          | Qué registra                                  |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Herramienta de agente (obligatoria o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (omite el LLM)          |

### Infraestructura

| Método                                         | Qué registra                            |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook de evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Método RPC del Gateway                  |
| `api.registerCli(registrar, opts?)`            | Subcomando CLI                          |
| `api.registerService(service)`                 | Servicio en segundo plano               |
| `api.registerInteractiveHandler(registration)` | Controlador interactivo                 |
| `api.registerMemoryPromptSupplement(builder)`  | Sección adicional de prompt adyacente a memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus adicional de búsqueda/lectura de memoria |

Los espacios de nombres administrativos reservados del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre permanecen como `operator.admin`, incluso si un Plugin intenta asignar
un ámbito más estrecho a un método Gateway. Prefiere prefijos específicos del Plugin para
métodos propiedad del Plugin.

### Metadatos de registro CLI

`api.registerCli(registrar, opts?)` acepta dos tipos de metadatos de nivel superior:

- `commands`: raíces de comando explícitas propiedad del registrador
- `descriptors`: descriptores de comandos en tiempo de análisis usados para la ayuda CLI raíz,
  el enrutamiento y el registro CLI diferido de plugins

Si quieres que un comando de Plugin siga cargándose de forma diferida en la ruta CLI raíz normal,
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
        description: "Gestionar cuentas de Matrix, verificación, dispositivos y estado del perfil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` por sí solo solo cuando no necesites el registro CLI raíz con carga diferida.
Esa ruta de compatibilidad de carga anticipada sigue siendo compatible, pero no instala
marcadores de posición respaldados por descriptores para carga diferida en tiempo de análisis.

### Registro de backend CLI

`api.registerCliBackend(...)` permite que un Plugin sea propietario de la configuración predeterminada para un backend
CLI local de IA como `codex-cli`.

- El `id` del backend se convierte en el prefijo del proveedor en referencias de modelo como `codex-cli/gpt-5`.
- La `config` del backend usa la misma forma que `agents.defaults.cliBackends.<id>`.
- La configuración del usuario sigue teniendo prioridad. OpenClaw fusiona `agents.defaults.cliBackends.<id>` sobre la
  configuración predeterminada del Plugin antes de ejecutar la CLI.
- Usa `normalizeConfig` cuando un backend necesite reescrituras de compatibilidad después de la fusión
  (por ejemplo, normalizar formas antiguas de flags).

### Espacios exclusivos

| Método                                     | Qué registra                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motor de contexto (uno activo a la vez). La devolución de llamada `assemble()` recibe `availableTools` y `citationsMode` para que el motor pueda adaptar adiciones al prompt. |
| `api.registerMemoryCapability(capability)` | Capacidad unificada de memoria                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Constructor de sección de prompt de memoria                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolutor del plan de vaciado de memoria                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de tiempo de ejecución de memoria                                                                                                          |

### Adaptadores de embeddings de memoria

| Método                                         | Qué registra                                  |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embeddings de memoria para el Plugin activo |

- `registerMemoryCapability` es la API exclusiva preferida para plugins de memoria.
- `registerMemoryCapability` también puede exponer `publicArtifacts.listArtifacts(...)`
  para que los plugins complementarios puedan consumir artefactos de memoria exportados mediante
  `openclaw/plugin-sdk/memory-host-core` en lugar de acceder al diseño privado
  de un Plugin de memoria específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` y
  `registerMemoryRuntime` son API exclusivas de plugins de memoria compatibles con sistemas heredados.
- `registerMemoryEmbeddingProvider` permite que el Plugin de memoria activo registre uno
  o más ID de adaptadores de embeddings (por ejemplo `openai`, `gemini` o un ID personalizado
  definido por el Plugin).
- La configuración del usuario, como `agents.defaults.memorySearch.provider` y
  `agents.defaults.memorySearch.fallback`, se resuelve con respecto a esos ID de adaptador registrados.

### Eventos y ciclo de vida

| Método                                       | Qué hace                     |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de ciclo de vida tipado |
| `api.onConversationBindingResolved(handler)` | Devolución de llamada de vinculación de conversación |

### Semántica de decisión de hooks

- `before_tool_call`: devolver `{ block: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `before_tool_call`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `before_install`: devolver `{ block: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `before_install`: devolver `{ block: false }` se trata como ausencia de decisión (igual que omitir `block`), no como una anulación.
- `reply_dispatch`: devolver `{ handled: true, ... }` es terminal. Una vez que algún controlador reclama el despacho, se omiten los controladores de menor prioridad y la ruta predeterminada de despacho del modelo.
- `message_sending`: devolver `{ cancel: true }` es terminal. Una vez que algún controlador lo establece, se omiten los controladores de menor prioridad.
- `message_sending`: devolver `{ cancel: false }` se trata como ausencia de decisión (igual que omitir `cancel`), no como una anulación.

### Campos del objeto API

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                               |
| `api.name`               | `string`                  | Nombre para mostrar                                                                         |
| `api.version`            | `string?`                 | Versión del Plugin (opcional)                                                               |
| `api.description`        | `string?`                 | Descripción del Plugin (opcional)                                                           |
| `api.source`             | `string`                  | Ruta de origen del Plugin                                                                   |
| `api.rootDir`            | `string?`                 | Directorio raíz del Plugin (opcional)                                                       |
| `api.config`             | `OpenClawConfig`          | Instantánea actual de configuración (instantánea activa en memoria del tiempo de ejecución cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Asistentes de tiempo de ejecución](/es/plugins/sdk-runtime)                                   |
| `api.logger`             | `PluginLogger`            | Registrador con ámbito (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/configuración previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolver ruta relativa a la raíz del Plugin                                                 |

## Convención de módulos internos

Dentro de tu Plugin, usa archivos barrel locales para importaciones internas:

```
my-plugin/
  api.ts            # Exportaciones públicas para consumidores externos
  runtime-api.ts    # Exportaciones internas solo para tiempo de ejecución
  index.ts          # Punto de entrada del Plugin
  setup-entry.ts    # Entrada ligera solo de configuración (opcional)
```

<Warning>
  Nunca importes tu propio Plugin mediante `openclaw/plugin-sdk/<your-plugin>`
  desde código de producción. Enruta las importaciones internas mediante `./api.ts` o
  `./runtime-api.ts`. La ruta del SDK es solo el contrato externo.
</Warning>

Las superficies públicas de plugins incluidos cargadas mediante fachada (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` y archivos de entrada públicos similares) ahora prefieren la
instantánea activa de configuración en tiempo de ejecución cuando OpenClaw ya está en ejecución. Si aún no existe una instantánea
de tiempo de ejecución, usan como respaldo el archivo de configuración resuelto en disco.

Los plugins de proveedor también pueden exponer un barrel de contrato local y estrecho del Plugin cuando un
asistente es intencionadamente específico del proveedor y todavía no pertenece a una subruta genérica del SDK.
Ejemplo actual incluido: el proveedor Anthropic mantiene sus asistentes de flujo Claude
en su propia costura pública `api.ts` / `contract-api.ts` en lugar de
promover la lógica de encabezados beta de Anthropic y `service_tier` a un contrato
genérico `plugin-sdk/*`.

Otros ejemplos actuales incluidos:

- `@openclaw/openai-provider`: `api.ts` exporta constructores de proveedor,
  asistentes de modelos predeterminados y constructores de proveedor en tiempo real
- `@openclaw/openrouter-provider`: `api.ts` exporta el constructor del proveedor además de
  asistentes de incorporación/configuración

<Warning>
  El código de producción de extensiones también debe evitar importaciones desde `openclaw/plugin-sdk/<other-plugin>`.
  Si un asistente es realmente compartido, promuévelo a una subruta neutral del SDK
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` u otra
  superficie orientada a capacidades en lugar de acoplar dos plugins entre sí.
</Warning>

## Relacionado

- [Puntos de entrada](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry` y `defineChannelPluginEntry`
- [Asistentes de tiempo de ejecución](/es/plugins/sdk-runtime) — referencia completa del espacio de nombres `api.runtime`
- [Configuración e instalación](/es/plugins/sdk-setup) — empaquetado, manifiestos, esquemas de configuración
- [Pruebas](/es/plugins/sdk-testing) — utilidades de prueba y reglas de lint
- [Migración del SDK](/es/plugins/sdk-migration) — migración desde superficies obsoletas
- [Componentes internos de plugins](/es/plugins/architecture) — arquitectura profunda y modelo de capacidades
