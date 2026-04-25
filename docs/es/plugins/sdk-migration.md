---
read_when:
    - Ves la advertencia `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ves la advertencia `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Usaste `api.registerEmbeddedExtensionFactory` antes de OpenClaw 2026.4.25
    - Estás actualizando un plugin a la arquitectura moderna de plugins
    - Mantienes un plugin externo de OpenClaw
sidebarTitle: Migrate to SDK
summary: Migra de la capa heredada de compatibilidad con versiones anteriores al SDK moderno de Plugin
title: Migración del SDK de Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ha pasado de una amplia capa de compatibilidad con versiones anteriores a una arquitectura moderna de plugins con importaciones específicas y documentadas. Si tu plugin se creó antes de la nueva arquitectura, esta guía te ayuda a migrarlo.

## Qué está cambiando

El sistema de plugins anterior proporcionaba dos superficies muy amplias que permitían a los plugins importar cualquier cosa que necesitaran desde un único punto de entrada:

- **`openclaw/plugin-sdk/compat`** — una única importación que reexportaba decenas de helpers. Se introdujo para mantener funcionando los plugins antiguos basados en hooks mientras se desarrollaba la nueva arquitectura de plugins.
- **`openclaw/extension-api`** — un puente que daba a los plugins acceso directo a helpers del lado del host, como el ejecutor del agente integrado.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook eliminado de extensiones empaquetadas exclusivo de Pi que podía observar eventos del ejecutor integrado como `tool_result`.

Las superficies de importación amplias ahora están **obsoletas**. Siguen funcionando en tiempo de ejecución, pero los plugins nuevos no deben usarlas, y los plugins existentes deberían migrar antes de que la próxima versión principal las elimine. La API de registro de fábrica de extensiones integradas exclusiva de Pi ha sido eliminada; usa middleware de resultado de herramientas en su lugar.

OpenClaw no elimina ni reinterpreta el comportamiento documentado de plugins en el mismo cambio en el que introduce un reemplazo. Los cambios incompatibles de contrato primero deben pasar por un adaptador de compatibilidad, diagnósticos, documentación y una ventana de obsolescencia. Esto se aplica a las importaciones del SDK, los campos del manifiesto, las API de configuración, los hooks y el comportamiento de registro en tiempo de ejecución.

<Warning>
  La capa de compatibilidad con versiones anteriores se eliminará en una futura versión principal.
  Los plugins que todavía importen desde estas superficies dejarán de funcionar cuando eso ocurra.
  Los registros de fábricas de extensiones integradas exclusivos de Pi ya no se cargan.
</Warning>

## Por qué cambió esto

El enfoque anterior causaba problemas:

- **Inicio lento** — importar un helper cargaba decenas de módulos no relacionados
- **Dependencias circulares** — las reexportaciones amplias facilitaban la creación de ciclos de importación
- **Superficie de API poco clara** — no había forma de saber qué exportaciones eran estables y cuáles eran internas

El SDK moderno de Plugin corrige esto: cada ruta de importación (`openclaw/plugin-sdk/\<subpath\>`) es un módulo pequeño y autosuficiente con un propósito claro y un contrato documentado.

Las capas de conveniencia heredadas para proveedores de canales empaquetados también han desaparecido. Importaciones como `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, capas de helpers con marca de canal y `openclaw/plugin-sdk/telegram-core` eran atajos privados del monorepo, no contratos estables de plugins. Usa en su lugar subrutas genéricas y específicas del SDK. Dentro del espacio de trabajo del plugin empaquetado, mantén los helpers propios del proveedor en el `api.ts` o `runtime-api.ts` de ese plugin.

Ejemplos actuales de proveedores empaquetados:

- Anthropic mantiene helpers de streaming específicos de Claude en su propia capa `api.ts` / `contract-api.ts`
- OpenAI mantiene constructores de proveedores, helpers de modelos predeterminados y constructores de proveedores en tiempo real en su propio `api.ts`
- OpenRouter mantiene helpers de constructor de proveedor y de incorporación/configuración en su propio `api.ts`

## Política de compatibilidad

Para plugins externos, el trabajo de compatibilidad sigue este orden:

1. añadir el nuevo contrato
2. mantener el comportamiento antiguo conectado mediante un adaptador de compatibilidad
3. emitir un diagnóstico o advertencia que nombre la ruta antigua y el reemplazo
4. cubrir ambas rutas en pruebas
5. documentar la obsolescencia y la ruta de migración
6. eliminar solo después de la ventana de migración anunciada, normalmente en una versión principal

Si un campo del manifiesto todavía se acepta, los autores de plugins pueden seguir usándolo hasta que la documentación y los diagnósticos indiquen lo contrario. El código nuevo debería preferir el reemplazo documentado, pero los plugins existentes no deberían romperse durante versiones menores normales.

## Cómo migrar

<Steps>
  <Step title="Migrar extensiones de resultado de herramientas de Pi a middleware">
    Los plugins empaquetados deben reemplazar los manejadores de resultados de herramientas de `api.registerEmbeddedExtensionFactory(...)` exclusivos de Pi por middleware neutral respecto al tiempo de ejecución.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Actualiza el manifiesto del plugin al mismo tiempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Los plugins externos no pueden registrar middleware de resultado de herramientas porque puede reescribir salidas de herramientas de alta confianza antes de que el modelo las vea.

  </Step>

  <Step title="Migrar manejadores nativos de aprobación a hechos de capacidad">
    Los plugins de canal con capacidad de aprobación ahora exponen el comportamiento de aprobación nativo mediante `approvalCapability.nativeRuntime` más el registro compartido de contexto de tiempo de ejecución.

    Cambios clave:

    - Reemplaza `approvalCapability.handler.loadRuntime(...)` por `approvalCapability.nativeRuntime`
    - Mueve la autenticación/entrega específica de aprobación fuera del cableado heredado `plugin.auth` / `plugin.approvals` y llévala a `approvalCapability`
    - `ChannelPlugin.approvals` se ha eliminado del contrato público de plugin de canal; mueve los campos delivery/native/render a `approvalCapability`
    - `plugin.auth` permanece solo para los flujos de inicio/cierre de sesión del canal; los hooks de autenticación de aprobación allí ya no son leídos por el core
    - Registra objetos de tiempo de ejecución propios del canal, como clientes, tokens o apps de Bolt, mediante `openclaw/plugin-sdk/channel-runtime-context`
    - No envíes avisos de redirección propios del plugin desde manejadores nativos de aprobación; el core ahora gestiona los avisos de enviado a otro lugar a partir de resultados reales de entrega
    - Al pasar `channelRuntime` a `createChannelManager(...)`, proporciona una superficie real de `createPluginRuntime().channel`. Los stubs parciales se rechazan.

    Consulta `/plugins/sdk-channel-plugins` para ver la estructura actual de capacidades de aprobación.

  </Step>

  <Step title="Auditar el comportamiento de reserva del wrapper de Windows">
    Si tu plugin usa `openclaw/plugin-sdk/windows-spawn`, los wrappers `.cmd`/`.bat` de Windows no resueltos ahora fallan de forma cerrada a menos que pases explícitamente `allowShellFallback: true`.

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

    Si tu llamador no depende intencionalmente de la reserva mediante shell, no establezcas `allowShellFallback` y maneja en su lugar el error lanzado.

  </Step>

  <Step title="Encontrar importaciones obsoletas">
    Busca en tu plugin importaciones desde cualquiera de las dos superficies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Reemplazar por importaciones específicas">
    Cada exportación de la superficie antigua corresponde a una ruta de importación moderna específica:

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

    Para los helpers del lado del host, usa el tiempo de ejecución del plugin inyectado en lugar de importarlo directamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
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
  | `plugin-sdk/plugin-entry` | Helper canónico de entrada de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportación heredada general para definiciones/constructores de entradas de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportación del esquema de configuración raíz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de entrada de proveedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definiciones y constructores específicos de entradas de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers compartidos del asistente de configuración | Prompts de lista de permitidos, constructores de estado de configuración |
  | `plugin-sdk/setup-runtime` | Helpers de tiempo de ejecución para configuración | Adaptadores de parche de configuración seguros para importación, helpers de notas de búsqueda, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuración delegada |
  | `plugin-sdk/setup-adapter-runtime` | Helpers de adaptador de configuración | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers de herramientas de configuración | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers de múltiples cuentas | Helpers de lista/configuración de cuentas/control de acciones |
  | `plugin-sdk/account-id` | Helpers de ID de cuenta | `DEFAULT_ACCOUNT_ID`, normalización de ID de cuenta |
  | `plugin-sdk/account-resolution` | Helpers de búsqueda de cuentas | Helpers de búsqueda de cuentas + fallback predeterminado |
  | `plugin-sdk/account-helpers` | Helpers específicos de cuenta | Helpers de lista de cuentas/acciones de cuenta |
  | `plugin-sdk/channel-setup` | Adaptadores del asistente de configuración | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, además de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de emparejamiento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cableado de prefijo de respuesta + escritura | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuración | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructores de esquemas de configuración | Primitivas compartidas de esquema de configuración de canal; las exportaciones de esquemas con nombre de canales empaquetados son solo compatibilidad heredada |
  | `plugin-sdk/telegram-command-config` | Helpers de configuración de comandos de Telegram | Normalización de nombres de comandos, recorte de descripciones, validación de duplicados/conflictos |
  | `plugin-sdk/channel-policy` | Resolución de políticas de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de ciclo de vida de estado de cuenta y flujo de borradores | `createAccountStatusSink`, helpers de finalización de vista previa de borrador |
  | `plugin-sdk/inbound-envelope` | Helpers de sobre entrante | Helpers compartidos de enrutamiento + construcción de sobres |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de respuesta entrante | Helpers compartidos de registro y despacho |
  | `plugin-sdk/messaging-targets` | Análisis de destinos de mensajería | Helpers de análisis/coincidencia de destinos |
  | `plugin-sdk/outbound-media` | Helpers de medios salientes | Carga compartida de medios salientes |
  | `plugin-sdk/outbound-runtime` | Helpers de tiempo de ejecución saliente | Helpers de entrega saliente, delegado de identidad/envío, sesión, formato y planificación de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de enlaces de hilos | Helpers de ciclo de vida y adaptadores de enlaces de hilos |
  | `plugin-sdk/agent-media-payload` | Helpers heredados de payload de medios | Constructor de payload de medios de agente para diseños heredados de campos |
  | `plugin-sdk/channel-runtime` | Capa de compatibilidad obsoleta | Solo utilidades heredadas de tiempo de ejecución de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envío | Tipos de resultado de respuesta |
  | `plugin-sdk/runtime-store` | Almacenamiento persistente de plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers amplios de tiempo de ejecución | Helpers de tiempo de ejecución/logging/copias de seguridad/instalación de plugins |
  | `plugin-sdk/runtime-env` | Helpers específicos de entorno de tiempo de ejecución | Logger/entorno de tiempo de ejecución, timeout, reintento y helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers compartidos de tiempo de ejecución de plugin | Helpers de comandos/hooks/http/interactivo de plugins |
  | `plugin-sdk/hook-runtime` | Helpers de canalización de hooks | Helpers compartidos de canalización de hooks internos/Webhook |
  | `plugin-sdk/lazy-runtime` | Helpers de tiempo de ejecución diferido | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de procesos | Helpers compartidos de ejecución |
  | `plugin-sdk/cli-runtime` | Helpers de tiempo de ejecución de CLI | Formato de comandos, esperas, helpers de versión |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Cliente de Gateway y helpers de parche de estado de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuración | Helpers de carga/escritura de configuración |
  | `plugin-sdk/telegram-command-config` | Helpers de comandos de Telegram | Helpers de validación de comandos de Telegram estables ante fallback cuando la superficie de contrato empaquetada de Telegram no está disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts de aprobación | Payload de aprobación de ejecución/plugin, helpers de capacidad/perfil de aprobación, helpers de enrutamiento/tiempo de ejecución de aprobación nativa y formato estructurado de rutas de visualización de aprobación |
  | `plugin-sdk/approval-auth-runtime` | Helpers de autenticación de aprobación | Resolución de aprobadores, autenticación de acciones en el mismo chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de cliente de aprobación | Helpers de perfil/filtro de aprobación nativa de ejecución |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de entrega de aprobación | Adaptadores de capacidad/entrega de aprobación nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de Gateway de aprobación | Helper compartido de resolución de Gateway de aprobación |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers de adaptador de aprobación | Helpers ligeros de carga de adaptadores de aprobación nativa para puntos de entrada de canal activos |
  | `plugin-sdk/approval-handler-runtime` | Helpers de manejador de aprobación | Helpers más amplios de tiempo de ejecución de manejadores de aprobación; prefiere las capas más específicas de adaptador/Gateway cuando sean suficientes |
  | `plugin-sdk/approval-native-runtime` | Helpers de destino de aprobación | Helpers nativos de vinculación de destino/cuenta de aprobación |
  | `plugin-sdk/approval-reply-runtime` | Helpers de respuesta de aprobación | Helpers de payload de respuesta de aprobación de ejecución/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexto de tiempo de ejecución de canal | Helpers genéricos de registro/obtención/observación de contexto de tiempo de ejecución de canal |
  | `plugin-sdk/security-runtime` | Helpers de seguridad | Helpers compartidos de confianza, control de DM, contenido externo y recopilación de secretos |
  | `plugin-sdk/ssrf-policy` | Helpers de política SSRF | Helpers de lista de permitidos de host y política de red privada |
  | `plugin-sdk/ssrf-runtime` | Helpers de tiempo de ejecución SSRF | Helpers de dispatcher fijado, fetch protegido y política SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de caché acotada | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de control diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formato de errores | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de grafo de errores |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy envueltos | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalización de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de reintento | `RetryConfig`, `retryAsync`, ejecutores de políticas |
  | `plugin-sdk/allow-from` | Formato de lista de permitidos | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeo de entradas de lista de permitidos | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Control de comandos y helpers de superficie de comandos | `resolveControlCommandGate`, helpers de autorización de remitente, helpers de registro de comandos, incluido el formato dinámico del menú de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de estado/ayuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análisis de entradas secretas | Helpers de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Helpers de solicitudes de Webhook | Utilidades de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protección de solicitudes de Webhook | Helpers de lectura/límite de cuerpo de solicitud |
  | `plugin-sdk/reply-runtime` | Tiempo de ejecución compartido de respuestas | Despacho entrante, Heartbeat, planificador de respuestas, fragmentación |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers específicos de despacho de respuestas | Finalización, despacho de proveedor y helpers de etiquetas de conversación |
  | `plugin-sdk/reply-history` | Helpers de historial de respuestas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planificación de referencias de respuesta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentación de respuestas | Helpers de fragmentación de texto/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de almacén de sesiones | Ruta del almacén + helpers de updated-at |
  | `plugin-sdk/state-paths` | Helpers de rutas de estado | Helpers de directorios de estado y OAuth |
  | `plugin-sdk/routing` | Helpers de enrutamiento/clave de sesión | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalización de clave de sesión |
  | `plugin-sdk/status-helpers` | Helpers de estado de canal | Constructores de resumen de estado de canal/cuenta, valores predeterminados de estado en tiempo de ejecución, helpers de metadatos de incidencias |
  | `plugin-sdk/target-resolver-runtime` | Helpers de resolución de destinos | Helpers compartidos de resolución de destinos |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalización de cadenas | Helpers de normalización de slug/cadenas |
  | `plugin-sdk/request-url` | Helpers de URL de solicitud | Extraer URL de cadena de entradas similares a solicitudes |
  | `plugin-sdk/run-command` | Helpers de comandos temporizados | Ejecutor de comandos temporizados con stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Lectores de parámetros | Lectores comunes de parámetros de herramientas/CLI |
  | `plugin-sdk/tool-payload` | Extracción de payload de herramientas | Extraer payload normalizados de objetos de resultado de herramientas |
  | `plugin-sdk/tool-send` | Extracción de envío de herramientas | Extraer campos canónicos de destino de envío de argumentos de herramientas |
  | `plugin-sdk/temp-path` | Helpers de rutas temporales | Helpers compartidos de rutas temporales de descarga |
  | `plugin-sdk/logging-core` | Helpers de logging | Helpers de logger de subsistema y redacción |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tablas Markdown | Helpers de modo de tabla Markdown |
  | `plugin-sdk/reply-payload` | Tipos de respuesta de mensajes | Tipos de payload de respuesta |
  | `plugin-sdk/provider-setup` | Helpers seleccionados de configuración de proveedores locales/autohospedados | Helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers específicos de configuración de proveedores autohospedados compatibles con OpenAI | Los mismos helpers de descubrimiento/configuración de proveedores autohospedados |
  | `plugin-sdk/provider-auth-runtime` | Helpers de autenticación de proveedores en tiempo de ejecución | Helpers de resolución de clave API en tiempo de ejecución |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuración de clave API de proveedor | Helpers de incorporación/escritura de perfil de clave API |
  | `plugin-sdk/provider-auth-result` | Helpers de resultado de autenticación de proveedor | Constructor estándar de resultado de autenticación OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de inicio de sesión interactivo de proveedor | Helpers compartidos de inicio de sesión interactivo |
  | `plugin-sdk/provider-selection-runtime` | Helpers de selección de proveedor | Selección de proveedor configurado o automático y fusión de configuración de proveedor sin procesar |
  | `plugin-sdk/provider-env-vars` | Helpers de variables de entorno de proveedor | Helpers de búsqueda de variables de entorno de autenticación de proveedor |
  | `plugin-sdk/provider-model-shared` | Helpers compartidos de modelo/replay de proveedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructores compartidos de políticas de replay, helpers de endpoint de proveedor y helpers de normalización de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Helpers compartidos de catálogo de proveedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Parches de incorporación de proveedores | Helpers de configuración de incorporación |
  | `plugin-sdk/provider-http` | Helpers HTTP de proveedor | Helpers genéricos HTTP/de capacidad de endpoint de proveedor, incluidos helpers de formularios multipart para transcripción de audio |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch de proveedor | Helpers de registro/caché de proveedor web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuración de búsqueda web de proveedor | Helpers específicos de configuración/credenciales de búsqueda web para proveedores que no necesitan cableado de habilitación de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrato de búsqueda web de proveedor | Helpers específicos de contrato de configuración/credenciales de búsqueda web como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` y setters/getters de credenciales con alcance |
  | `plugin-sdk/provider-web-search` | Helpers de búsqueda web de proveedor | Helpers de registro/caché/tiempo de ejecución de proveedor de búsqueda web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilidad de herramientas/esquema de proveedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpieza de esquema de Gemini + diagnósticos y helpers de compatibilidad de xAI como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers de uso de proveedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` y otros helpers de uso de proveedor |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de streams de proveedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream y helpers compartidos de wrapper para Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transporte de proveedor | Helpers nativos de transporte de proveedor como fetch protegido, transformaciones de mensajes de transporte y streams de eventos de transporte escribibles |
  | `plugin-sdk/keyed-async-queue` | Cola asíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers compartidos de medios | Helpers de obtención/transformación/almacenamiento de medios más constructores de payload de medios |
  | `plugin-sdk/media-generation-runtime` | Helpers compartidos de generación de medios | Helpers compartidos de conmutación por error, selección de candidatos y mensajería de modelo faltante para generación de imágenes/video/música |
  | `plugin-sdk/media-understanding` | Helpers de comprensión de medios | Tipos de proveedor de comprensión de medios más exportaciones de helpers de imagen/audio orientados a proveedor |
  | `plugin-sdk/text-runtime` | Helpers compartidos de texto | Eliminación de texto visible para el asistente, helpers de renderizado/fragmentación/tabla de markdown, helpers de redacción, helpers de etiquetas de directivas, utilidades de texto seguro y helpers relacionados de texto/logging |
  | `plugin-sdk/text-chunking` | Helpers de fragmentación de texto | Helper de fragmentación de texto saliente |
  | `plugin-sdk/speech` | Helpers de voz | Tipos de proveedor de voz más helpers de directivas, registro y validación orientados a proveedor |
  | `plugin-sdk/speech-core` | Núcleo compartido de voz | Tipos de proveedor de voz, registro, directivas, normalización |
  | `plugin-sdk/realtime-transcription` | Helpers de transcripción en tiempo real | Tipos de proveedor, helpers de registro y helper compartido de sesión WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voz en tiempo real | Tipos de proveedor, helpers de registro/resolución y helpers de sesión de puente |
  | `plugin-sdk/image-generation-core` | Núcleo compartido de generación de imágenes | Tipos de generación de imágenes, helpers de conmutación por error, autenticación y registro |
  | `plugin-sdk/music-generation` | Helpers de generación de música | Tipos de proveedor/solicitud/resultado de generación de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartido de generación de música | Tipos de generación de música, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/video-generation` | Helpers de generación de video | Tipos de proveedor/solicitud/resultado de generación de video |
  | `plugin-sdk/video-generation-core` | Núcleo compartido de generación de video | Tipos de generación de video, helpers de conmutación por error, búsqueda de proveedor y análisis de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de respuesta interactiva | Normalización/reducción de payload de respuesta interactiva |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuración de canal | Primitivas específicas de channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpers de escritura de configuración de canal | Helpers de autorización de escritura de configuración de canal |
  | `plugin-sdk/channel-plugin-common` | Preludio compartido de canal | Exportaciones compartidas de preludio de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de estado de canal | Helpers compartidos de instantánea/resumen de estado de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuración de lista de permitidos | Helpers de edición/lectura de configuración de lista de permitidos |
  | `plugin-sdk/group-access` | Helpers de acceso a grupos | Helpers compartidos de decisión de acceso a grupos |
  | `plugin-sdk/direct-dm` | Helpers de DM directa | Helpers compartidos de autenticación/protección de DM directa |
  | `plugin-sdk/extension-shared` | Helpers compartidos de extensiones | Primitivas de canal/estado pasivo y helpers de proxy ambiental |
  | `plugin-sdk/webhook-targets` | Helpers de destino de Webhook | Registro de destinos de Webhook y helpers de instalación de rutas |
  | `plugin-sdk/webhook-path` | Helpers de ruta de Webhook | Helpers de normalización de ruta de Webhook |
  | `plugin-sdk/web-media` | Helpers compartidos de medios web | Helpers de carga de medios remotos/locales |
  | `plugin-sdk/zod` | Reexportación de Zod | `zod` reexportado para consumidores del SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers empaquetados de memory-core | Superficie de helpers de gestor/configuración/archivo/CLI de memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de tiempo de ejecución del motor de memoria | Fachada de tiempo de ejecución de índice/búsqueda de memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motor base del host de memoria | Exportaciones del motor base del host de memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motor de embeddings del host de memoria | Contratos de embeddings de memoria, acceso a registro, proveedor local y helpers genéricos por lotes/remotos; los proveedores remotos concretos viven en sus plugins propietarios |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motor QMD del host de memoria | Exportaciones del motor QMD del host de memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motor de almacenamiento del host de memoria | Exportaciones del motor de almacenamiento del host de memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodales del host de memoria | Helpers multimodales del host de memoria |
  | `plugin-sdk/memory-core-host-query` | Helpers de consulta del host de memoria | Helpers de consulta del host de memoria |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secretos del host de memoria | Helpers de secretos del host de memoria |
  | `plugin-sdk/memory-core-host-events` | Helpers de diario de eventos del host de memoria | Helpers de diario de eventos del host de memoria |
  | `plugin-sdk/memory-core-host-status` | Helpers de estado del host de memoria | Helpers de estado del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Tiempo de ejecución CLI del host de memoria | Helpers de tiempo de ejecución CLI del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Tiempo de ejecución central del host de memoria | Helpers de tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de archivos/tiempo de ejecución del host de memoria | Helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-core` | Alias del tiempo de ejecución central del host de memoria | Alias neutral respecto al proveedor para helpers del tiempo de ejecución central del host de memoria |
  | `plugin-sdk/memory-host-events` | Alias del diario de eventos del host de memoria | Alias neutral respecto al proveedor para helpers del diario de eventos del host de memoria |
  | `plugin-sdk/memory-host-files` | Alias de archivos/tiempo de ejecución del host de memoria | Alias neutral respecto al proveedor para helpers de archivos/tiempo de ejecución del host de memoria |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown gestionado | Helpers compartidos de markdown gestionado para plugins adyacentes a memoria |
  | `plugin-sdk/memory-host-search` | Fachada de búsqueda de Active Memory | Fachada diferida de tiempo de ejecución del gestor de búsqueda de Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de estado del host de memoria | Alias neutral respecto al proveedor para helpers de estado del host de memoria |
  | `plugin-sdk/memory-lancedb` | Helpers empaquetados de memory-lancedb | Superficie de helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilidades de prueba | Helpers y mocks de prueba |
</Accordion>

Esta tabla es intencionalmente el subconjunto común de migración, no toda la superficie del SDK. La lista completa de más de 200 puntos de entrada se encuentra en `scripts/lib/plugin-sdk-entrypoints.json`.

Esa lista todavía incluye algunas capas de helpers de plugins empaquetados como `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` y `plugin-sdk/matrix*`. Siguen exportándose para mantenimiento y compatibilidad de plugins empaquetados, pero se omiten intencionalmente de la tabla común de migración y no son el destino recomendado para código nuevo de plugins.

La misma regla se aplica a otras familias de helpers empaquetados como:

- helpers de compatibilidad con navegadores: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superficies de helpers/plugins empaquetados como `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership` y `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` actualmente expone la superficie específica de helpers de token `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` y `resolveCopilotApiToken`.

Usa la importación más específica que coincida con la tarea. Si no puedes encontrar una exportación, revisa el código fuente en `src/plugin-sdk/` o pregunta en Discord.

## Obsolescencias activas

Obsolescencias más específicas que se aplican en todo el SDK de Plugin, el contrato del proveedor, la superficie de tiempo de ejecución y el manifiesto. Todas siguen funcionando hoy, pero se eliminarán en una futura versión principal. La entrada debajo de cada elemento asigna la API antigua a su reemplazo canónico.

<AccordionGroup>
  <Accordion title="Constructores de ayuda de command-auth → command-status">
    **Antiguo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuevo (`openclaw/plugin-sdk/command-status`)**: mismas firmas, mismas
    exportaciones — solo se importan desde la subruta más específica. `command-auth`
    las reexporta como stubs de compatibilidad.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers de control de menciones → resolveInboundMentionDecision">
    **Antiguo**: `resolveInboundMentionRequirement({ facts, policy })` y
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuevo**: `resolveInboundMentionDecision({ facts, policy })` — devuelve un
    único objeto de decisión en lugar de dos llamadas separadas.

    Los plugins de canal downstream (Slack, Discord, Matrix, Microsoft Teams) ya
    han cambiado.

  </Accordion>

  <Accordion title="Capa de compatibilidad de tiempo de ejecución de canal y helpers de acciones de canal">
    `openclaw/plugin-sdk/channel-runtime` es una capa de compatibilidad para plugins
    de canal más antiguos. No la importes desde código nuevo; usa
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    tiempo de ejecución.

    Los helpers `channelActions*` en `openclaw/plugin-sdk/channel-actions` están
    obsoletos junto con las exportaciones sin procesar de canal de tipo "actions".
    Expón capacidades mediante la superficie semántica `presentation` en su lugar:
    los plugins de canal declaran qué renderizan (cards, buttons, selects) en vez
    de qué nombres de acciones sin procesar aceptan.

  </Accordion>

  <Accordion title="Helper tool() de proveedor de búsqueda web → createTool() en el plugin">
    **Antiguo**: factoría `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nuevo**: implementar `createTool(...)` directamente en el plugin del proveedor.
    OpenClaw ya no necesita el helper del SDK para registrar el wrapper de la herramienta.

  </Accordion>

  <Accordion title="Sobres de canal en texto plano → BodyForAgent">
    **Antiguo**: `formatInboundEnvelope(...)` (y
    `ChannelMessageForAgent.channelEnvelope`) para construir un sobre de prompt
    plano a partir de mensajes entrantes del canal.

    **Nuevo**: `BodyForAgent` más bloques estructurados de contexto del usuario.
    Los plugins de canal adjuntan metadatos de enrutamiento (thread, topic, reply-to, reactions) como
    campos tipados en lugar de concatenarlos en una cadena de prompt. El
    helper `formatAgentEnvelope(...)` sigue siendo compatible para sobres
    sintetizados orientados al asistente, pero los sobres entrantes en texto
    plano están en retirada.

    Áreas afectadas: `inbound_claim`, `message_received` y cualquier plugin
    de canal personalizado que posprocese texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descubrimiento de proveedor → tipos de catálogo de proveedor">
    Cuatro alias de tipos de descubrimiento ahora son envoltorios ligeros sobre
    los tipos de la era de catálogo:

    | Alias antiguo              | Tipo nuevo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Además, la bolsa estática heredada `ProviderCapabilities`: los plugins de
    proveedor deberían adjuntar datos de capacidades mediante el contrato de tiempo
    de ejecución del proveedor en lugar de un objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de Thinking → resolveThinkingProfile">
    **Antiguo** (tres hooks separados en `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` y
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuevo**: un único `resolveThinkingProfile(ctx)` que devuelve un
    `ProviderThinkingProfile` con el `id` canónico, `label` opcional y
    una lista de niveles ordenada por prioridad. OpenClaw degrada automáticamente
    los valores almacenados obsoletos según el rango del perfil.

    Implementa un hook en lugar de tres. Los hooks heredados siguen funcionando durante
    la ventana de obsolescencia, pero no se combinan con el resultado del perfil.

  </Accordion>

  <Accordion title="Fallback de proveedor OAuth externo → contracts.externalAuthProviders">
    **Antiguo**: implementar `resolveExternalOAuthProfiles(...)` sin
    declarar el proveedor en el manifiesto del plugin.

    **Nuevo**: declara `contracts.externalAuthProviders` en el manifiesto del plugin
    **y** implementa `resolveExternalAuthProfiles(...)`. La ruta antigua de
    "fallback de autenticación" emite una advertencia en tiempo de ejecución y se eliminará.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Búsqueda de variables de entorno de proveedor → setup.providers[].envVars">
    **Campo antiguo del manifiesto**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuevo**: refleja la misma búsqueda de variables de entorno en `setup.providers[].envVars`
    del manifiesto. Esto consolida los metadatos de entorno de configuración/estado en un
    único lugar y evita arrancar el tiempo de ejecución del plugin solo para responder
    búsquedas de variables de entorno.

    `providerAuthEnvVars` sigue siendo compatible mediante un adaptador de compatibilidad
    hasta que se cierre la ventana de obsolescencia.

  </Accordion>

  <Accordion title="Registro de plugins de memoria → registerMemoryCapability">
    **Antiguo**: tres llamadas separadas —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuevo**: una llamada en la API de estado de memoria —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mismos espacios, una sola llamada de registro. Los helpers de memoria aditivos
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) no se ven afectados.

  </Accordion>

  <Accordion title="Tipos de mensajes de sesión de subagente renombrados">
    Dos alias de tipos heredados siguen exportándose desde `src/plugins/runtime/types.ts`:

    | Antiguo                    | Nuevo                          |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    El método de tiempo de ejecución `readSession` está obsoleto a favor de
    `getSessionMessages`. Misma firma; el método antiguo delega en el nuevo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Antiguo**: `runtime.tasks.flow` (singular) devolvía un accesor en vivo de TaskFlow.

    **Nuevo**: `runtime.tasks.flows` (plural) devuelve acceso a TaskFlow basado en DTO,
    que es seguro para importación y no requiere cargar el tiempo de ejecución completo
    de tareas.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factorías de extensiones integradas → middleware de resultado de herramientas del agente">
    Cubierto arriba en "Cómo migrar → Migrar extensiones de resultado de herramientas de Pi a
    middleware". Se incluye aquí para completar: la ruta eliminada exclusiva de Pi
    `api.registerEmbeddedExtensionFactory(...)` se reemplaza por
    `api.registerAgentToolResultMiddleware(...)` con una lista explícita de
    tiempos de ejecución en `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reexportado desde `openclaw/plugin-sdk` ahora es un
    alias de una línea para `OpenClawConfig`. Prefiere el nombre canónico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Las obsolescencias a nivel de extensión (dentro de plugins empaquetados de canal/proveedor en
`extensions/`) se rastrean dentro de sus propios barrels `api.ts` y `runtime-api.ts`.
No afectan a los contratos de plugins de terceros y no se enumeran aquí. Si consumes
directamente el barrel local de un plugin empaquetado, lee los comentarios de
obsolescencia en ese barrel antes de actualizar.
</Note>

## Cronograma de eliminación

| Cuándo                 | Qué sucede                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ahora**              | Las superficies obsoletas emiten advertencias en tiempo de ejecución    |
| **Próxima versión principal** | Las superficies obsoletas se eliminarán; los plugins que aún las usen fallarán |

Todos los plugins principales ya han sido migrados. Los plugins externos deberían migrar
antes de la próxima versión principal.

## Suprimir temporalmente las advertencias

Configura estas variables de entorno mientras trabajas en la migración:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Este es un mecanismo de escape temporal, no una solución permanente.

## Relacionado

- [Primeros pasos](/es/plugins/building-plugins) — crea tu primer plugin
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación de plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — creación de plugins de proveedor
- [Componentes internos de plugins](/es/plugins/architecture) — análisis profundo de la arquitectura
- [Manifiesto de plugin](/es/plugins/manifest) — referencia del esquema del manifiesto
