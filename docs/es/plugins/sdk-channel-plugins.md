---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas entender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Creación de Plugins de canal
x-i18n:
    generated_at: "2026-04-22T04:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creación de Plugins de canal

Esta guía explica paso a paso cómo crear un Plugin de canal que conecte OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad para mensajes directos,
emparejamiento, hilos de respuesta y mensajería saliente.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
única herramienta `message` compartida en el core. Tu Plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de mensajes directos y listas de permitidos
- **Emparejamiento** — flujo de aprobación de mensajes directos
- **Gramática de sesión** — cómo los ids de conversación específicos del proveedor se asignan a chats base, ids de hilo y reservas de padre
- **Salida** — envío de texto, medios y encuestas a la plataforma
- **Hilos** — cómo se organizan las respuestas en hilos

El core controla la herramienta `message` compartida, el cableado del prompt, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Si tu canal añade parámetros a la herramienta de mensajes que transportan fuentes de medios, expón esos
nombres de parámetro mediante `describeMessageTool(...).mediaSourceParams`. El core usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a medios salientes,
de modo que los Plugins no necesitan casos especiales en el core compartido para parámetros específicos del proveedor
como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa por clave de acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionadamente entre todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook canónico
para asignar `rawId` al id de conversación base, id opcional de hilo,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el
padre más específico hasta la conversación base/más amplia.

Los Plugins incluidos que necesiten el mismo análisis antes de que arranque
el registro de canales también pueden exponer un archivo de nivel superior `session-key-api.ts` con una
exportación `resolveSessionConversation(...)` coincidente. El core usa esa superficie segura para el bootstrap
solo cuando el registro de Plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como reserva de compatibilidad heredada cuando un Plugin solo necesita reservas de padre además del id genérico/sin procesar. Si existen ambos hooks, el core usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El core controla `/approve` en el mismo chat, las cargas útiles compartidas de botones de aprobación y la entrega genérica de reserva.
- Prefiere un único objeto `approvalCapability` en el Plugin de canal cuando el canal necesite comportamiento específico de aprobaciones.
- `ChannelPlugin.approvals` se ha eliminado. Coloca los hechos de entrega/renderizado/autenticación nativos de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo para login/logout; el core ya no lee hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son el seam canónico de autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat.
- Si tu canal expone aprobaciones nativas de exec, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. El core usa ese hook específico de exec para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de exec e incluir el canal en la orientación de reserva del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo completa para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento específico del canal en el ciclo de vida de la carga útil, como ocultar prompts locales duplicados de aprobación o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento nativo de aprobaciones o supresión de reserva.
- Usa `approvalCapability.nativeRuntime` para hechos nativos de aprobación controlados por el canal. Mantenlo diferido en puntos de entrada calientes del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de tiempo de ejecución bajo demanda y aun así permitir que el core arme el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles personalizadas de aprobación en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de ruta deshabilitada explique los ajustes exactos de configuración necesarios para habilitar aprobaciones nativas de exec. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuenta nombrada deberían renderizar rutas con ámbito de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades de DM estables similares a propietario a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` desde `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica de aprobaciones específica al core.
- Si un canal necesita entrega nativa de aprobaciones, mantén el código del canal centrado en la normalización del destino más los hechos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` desde `openclaw/plugin-sdk/approval-runtime`. Coloca los hechos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el core pueda ensamblar el controlador y controlar el filtrado de solicitudes, el enrutamiento, la deduplicación, la caducidad, la suscripción al gateway y los avisos de redirigido a otra parte. `nativeRuntime` se divide en varios seams más pequeños:
- `availability` — si la cuenta está configurada y si una solicitud debe gestionarse
- `presentation` — asignar el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/caducadas o acciones finales
- `transport` — preparar destinos más enviar/actualizar/eliminar mensajes nativos de aprobación
- `interactions` — hooks opcionales de vincular/desvincular/limpiar acciones para botones o reacciones nativas
- `observe` — hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos controlados por el tiempo de ejecución como un cliente, token, aplicación Bolt o receptor de Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de tiempo de ejecución permite que el core inicialice controladores impulsados por capacidades a partir del estado de inicio del canal sin añadir pegamento envoltorio específico de aprobaciones.
- Recurre a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando el seam impulsado por capacidades aún no sea lo bastante expresivo.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos helpers. `accountId` mantiene la política de aprobación multicuenta dentro del ámbito de la cuenta correcta del bot, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobaciones de exec frente a Plugin sin ramificaciones codificadas en el core.
- El core ahora también controla los avisos de redirección de aprobaciones. Los Plugins de canal no deben enviar sus propios mensajes de seguimiento como "la aprobación fue a DMs / a otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón el enrutamiento correcto de origen + DM del aprobador mediante los helpers compartidos de capacidades de aprobación y deja que el core agregue las entregas reales antes de publicar cualquier aviso de vuelta en el chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregado. Los clientes nativos no deben adivinar ni reescribir el enrutamiento de aprobaciones de exec frente a Plugin a partir del estado local del canal.
- Diferentes tipos de aprobación pueden exponer intencionadamente distintas superficies nativas.
  Ejemplos actuales incluidos:
  - Slack mantiene el enrutamiento nativo de aprobaciones disponible tanto para ids de exec como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo DM/canal y UX de reacciones para aprobaciones de exec y de Plugin, al tiempo que permite que la autenticación difiera por tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debería preferir el generador de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada calientes del canal, prefiere las subrutas más estrechas de tiempo de ejecución cuando solo
necesites una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiere `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie paraguas
más amplia.

En concreto para setup:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers seguros para el tiempo de ejecución del setup:
  adaptadores seguros de importación para parches de setup (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de setup
- `openclaw/plugin-sdk/setup-adapter-runtime` es el seam estrecho del adaptador consciente del entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores opcionales de setup con instalación más algunas primitivas seguras para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite setup o autenticación controlados por entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de variables de entorno antes de que cargue el tiempo de ejecución, decláralos en el
manifiesto del Plugin con `channelEnvVars`. Mantén `envVars` del tiempo de ejecución del canal o
constantes locales solo para texto orientado al operador.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o escaneos de SecretRef antes de que se inicie el tiempo de ejecución del Plugin, añade `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe poder importarse de forma segura en rutas de comando de solo lectura
y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador de estado y los metadatos del destino secreto del canal necesarios para esos resúmenes. No inicies clientes, listeners ni tiempos de ejecución de transporte desde la entrada de setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa el seam más amplio `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos más pesados de setup/configuración como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala este Plugin primero" en superficies de setup, prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza el mismo mensaje de instalación requerida en la validación, finalización y texto de enlace a documentación.

Para otras rutas calientes del canal, prefiere los helpers estrechos sobre las superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  reserva de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para la ruta/sobre de entrada y
  el cableado de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de
  identidad/envío saliente y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` desde
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe conservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base siga coincidiendo. Los Plugins de proveedor pueden sobrescribir
  la precedencia, el comportamiento de sufijos y la normalización de id de hilo cuando su plataforma
  tiene semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de enlace de hilos
  y registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiera una
  disposición heredada de campos de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram, validación de duplicados/conflictos y un contrato de configuración de comandos estable ante reservas

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: el core gestiona las aprobaciones y el Plugin solo expone capacidades de salida/autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y los transportes de chat personalizados deberían usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobaciones.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia controlada por el Plugin
- evaluación compartida de políticas

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio de
helpers de entrada.

Buena opción para lógica local del Plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar participación del bot

Buena opción para el helper compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de mención implícita
- bypass de comandos
- decisión final de omitir

Flujo preferido:

1. Calcular hechos locales de mención.
2. Pasar esos hechos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usar `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu puerta de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` expone los mismos helpers compartidos de menciones para
Plugins de canal incluidos que ya dependen de inyección en tiempo de ejecución:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de
tiempo de ejecución de entrada no relacionados.

Los helpers más antiguos `resolveMentionGating*` siguen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debería usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido guiado

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un Plugin de canal. Para ver toda la superficie de metadatos del paquete,
    consulta [Configuración y setup de Plugin](/es/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Crear el objeto del Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Comienza con
    lo mínimo — `id` y `setup` — y añade adaptadores según los necesites.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="Qué hace por ti createChatChannelPlugin">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor acotado de seguridad de DM a partir de campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de DM basado en texto con intercambio de código |
      | `threading` | Resolutor de modo de respuesta (fijo, acotado por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (IDs de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesitas control total.
    </Accordion>

  </Step>

  <Step title="Conectar el punto de entrada">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Coloca los descriptores de CLI controlados por el canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el tiempo de ejecución completo del canal,
    mientras que las cargas completas normales siguen recogiendo esos mismos descriptores para el registro real de comandos.
    Mantén `registerFull(...)` para trabajo solo de tiempo de ejecución.
    Si `registerFull(...)` registra métodos RPC del gateway, usa un
    prefijo específico del Plugin. Los espacios de nombres de administración del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la separación por modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Añadir una entrada de setup">
    Crea `setup-entry.ts` para carga ligera durante el onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita cargar código pesado de tiempo de ejecución durante los flujos de setup.
    Consulta [Setup y configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales incluidos del workspace que dividen exportaciones seguras para setup en módulos auxiliares
    pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter explícito de tiempo de ejecución en tiempo de setup.

  </Step>

  <Step title="Gestionar mensajes entrantes">
    Tu Plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador de entrada de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación gestionada por el Plugin (verifica tú mismo las firmas)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Tu controlador de entrada despacha el mensaje a OpenClaw.
          // El cableado exacto depende del SDK de tu plataforma —
          // consulta un ejemplo real en el paquete del Plugin incluido de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal controla
      su propia canalización de entrada. Mira Plugins de canal incluidos
      (por ejemplo, el paquete del Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
Escribe pruebas colocadas junto al código en `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

  </Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos openclaw.channel
├── openclaw.plugin.json      # manifiesto con esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # exportaciones públicas (opcional)
├── runtime-api.ts            # exportaciones internas de tiempo de ejecución (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin mediante createChatChannelPlugin
    ├── channel.test.ts       # pruebas
    ├── client.ts             # cliente API de la plataforma
    └── runtime.ts            # almacén de tiempo de ejecución (si hace falta)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance de cuenta o personalizados
  </Card>
  <Card title="Integración con la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destinos" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunos seams auxiliares incluidos todavía existen para mantenimiento y
compatibilidad de Plugins incluidos. No son el patrón recomendado para Plugins de canal nuevos;
prefiere las subrutas genéricas de channel/setup/reply/runtime de la superficie común del SDK
a menos que estés manteniendo directamente esa familia de Plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu Plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importación por subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema completo del manifiesto
