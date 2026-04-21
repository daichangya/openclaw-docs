---
read_when:
    - Estás creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas comprender la superficie del adaptador `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-04-21T19:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creación de plugins de canal

Esta guía explica paso a paso cómo crear un plugin de canal que conecte OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad en MD,
emparejamiento, hilos de respuesta y mensajería saliente.

<Info>
  Si todavía no has creado ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas para enviar/editar/reaccionar. OpenClaw mantiene una única
herramienta `message` compartida en el núcleo. Tu plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de MD y listas de permitidos
- **Emparejamiento** — flujo de aprobación de MD
- **Gramática de sesión** — cómo los ids de conversación específicos del proveedor se asignan a chats base, ids de hilo y alternativas de respaldo del padre
- **Salida** — envío de texto, contenido multimedia y encuestas a la plataforma
- **Hilos** — cómo se estructuran las respuestas en hilos

El núcleo se encarga de la herramienta `message` compartida, la conexión del prompt, la forma externa de la clave de sesión,
el control genérico de `:thread:` y el despacho.

Si tu canal agrega parámetros a la herramienta de mensajes que contienen fuentes multimedia, expón esos
nombres de parámetro mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a medios salientes,
por lo que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa indexado por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que las acciones no relacionadas no
hereden los argumentos multimedia de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el gancho canónico
para asignar `rawId` al id de conversación base, el id de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el
padre más específico hasta la conversación base o más amplia.

Los plugins incluidos que necesiten el mismo análisis antes de que se inicie el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` correspondiente. El núcleo usa esa superficie segura para el arranque
solo cuando el registro de plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como alternativa heredada de compatibilidad cuando un plugin solo necesita
alternativas de respaldo del padre además del id genérico o sin procesar. Si existen ambos ganchos, el núcleo usa
primero `resolveSessionConversation(...).parentConversationCandidates` y solo recurre a `resolveParentConversationCandidates(...)` cuando el gancho canónico
las omite.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico de aprobaciones.

- El núcleo se encarga de `/approve` en el mismo chat, de las cargas compartidas de botones de aprobación y de la entrega genérica de respaldo.
- Prefiere un único objeto `approvalCapability` en el plugin del canal cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloca los datos de entrega/aprobación nativa/renderizado/autenticación en `approvalCapability`.
- `plugin.auth` es solo para inicio y cierre de sesión; el núcleo ya no lee ganchos de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la superficie canónica para la autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobación en el mismo chat.
- Si tu canal expone aprobaciones nativas de ejecución, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de superficie de inicio/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. El núcleo usa ese gancho específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía de respaldo para clientes nativos. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento específico del canal en el ciclo de vida de la carga, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobación nativa o supresión de respaldo.
- Usa `approvalCapability.nativeRuntime` para los datos de aprobación nativa propios del canal. Mantenlo perezoso en puntos de entrada activos del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de tiempo de ejecución bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de la aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique exactamente qué opciones de configuración se necesitan para habilitar aprobaciones nativas de ejecución. El gancho recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance por cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables tipo propietario en MD a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica específica de aprobación al núcleo.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal centrado en la normalización del destino más los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el controlador y ocuparse del filtrado de solicitudes, enrutamiento, eliminación de duplicados, vencimiento, suscripción al gateway y avisos de redirección. `nativeRuntime` se divide en unas pocas superficies más pequeñas:
- `availability` — si la cuenta está configurada y si debe atenderse una solicitud
- `presentation` — asigna el modelo de vista de aprobación compartido a cargas nativas pendientes/resueltas/vencidas o acciones finales
- `transport` — prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions` — ganchos opcionales para asociar/desasociar/borrar acciones de botones o reacciones nativos
- `observe` — ganchos opcionales de diagnóstico de entrega
- Si el canal necesita objetos administrados en tiempo de ejecución, como un cliente, token, aplicación Bolt o receptor de Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de tiempo de ejecución permite que el núcleo inicie controladores basados en capacidades desde el estado de inicio del canal sin agregar código de integración específico de aprobación.
- Recurre a los niveles inferiores `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo cuando la superficie guiada por capacidades todavía no sea lo bastante expresiva.
- Los canales con aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos ayudantes. `accountId` mantiene la política de aprobación multicuenta delimitada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente a plugin sin ramas codificadas en el núcleo.
- El núcleo ahora también se encarga de los avisos de redirección de aprobaciones. Los plugins de canal no deben enviar sus propios mensajes de seguimiento de tipo "la aprobación fue a MD / a otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón un enrutamiento preciso del origen + MD del aprobador mediante los ayudantes compartidos de capacidad de aprobación y deja que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta en el chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregado. Los clientes nativos no deben
  deducir ni reescribir el enrutamiento de aprobaciones de ejecución frente a plugin a partir del estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos actuales incluidos:
  - Slack mantiene disponible el enrutamiento nativo de aprobaciones tanto para ids de ejecución como de plugin.
  - Matrix mantiene el mismo enrutamiento nativo de MD/canal y la misma UX de reacciones para aprobaciones de ejecución
    y de plugin, y aun así permite que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debe preferir el generador de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada activos del canal, prefiere las subrutas de tiempo de ejecución más específicas cuando solo
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
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie general
más amplia.

Específicamente para la configuración:

- `openclaw/plugin-sdk/setup-runtime` cubre los ayudantes de configuración seguros para tiempo de ejecución:
  adaptadores de parcheo de configuración seguros para importar (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los generadores
  delegados del proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la superficie de adaptador
  estrecha y consciente del entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los generadores de configuración de instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación controladas por entorno y los
flujos genéricos de inicio/configuración deben conocer esos nombres de variables de entorno antes de que se cargue el tiempo de ejecución, decláralos en el
manifiesto del plugin con `channelEnvVars`. Mantén `envVars` del tiempo de ejecución del canal o las constantes locales solo para el texto orientado a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o en exploraciones de SecretRef antes de que se inicie el tiempo de ejecución del plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro, el adaptador de estado y los metadatos de destino de secretos del canal necesarios para esos resúmenes. No inicies clientes, listeners ni transportes de tiempo de ejecución desde el punto de entrada de configuración.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la superficie más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  ayudantes compartidos más pesados de configuración/configuración como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala primero este plugin" en las
superficies de configuración, prefiere `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, finalización y texto de enlace a la documentación.

Para otras rutas activas del canal, prefiere los ayudantes más específicos frente a las superficies
heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para la configuración multicuenta y
  el respaldo a la cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para el cableado de rutas/sobres entrantes y
  de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para la carga de medios más los
  delegados de identidad/envío saliente y la planificación de cargas
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de la asociación de hilos
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera un diseño heredado
  de campos de carga de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para la normalización de comandos personalizados de Telegram,
  la validación de duplicados/conflictos y un contrato de configuración de comandos
  estable para respaldo

Los canales solo de autenticación normalmente pueden detenerse en la ruta predeterminada: el núcleo maneja las aprobaciones y el plugin solo expone capacidades de salida/autenticación. Los canales con aprobación nativa, como Matrix, Slack, Telegram y transportes de chat personalizados, deben usar los ayudantes nativos compartidos en lugar de crear su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propia del plugin
- evaluación de políticas compartidas

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio
de ayudantes de entrada.

Buena opción para lógica local del plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativos de la plataforma necesarios para demostrar la participación del bot

Buena opción para el ayudante compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de menciones implícitas
- omisión para comandos
- decisión final de omitir

Flujo recomendado:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu compuerta de entrada.

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

`api.runtime.channel.mentions` expone los mismos ayudantes compartidos de menciones para
plugins de canal incluidos que ya dependen de la inyección en tiempo de ejecución:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar ayudantes
de tiempo de ejecución entrante no relacionados.

Los ayudantes antiguos `resolveMentionGating*` siguen estando en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Tutorial paso a paso

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un plugin de canal. Para la superficie completa de metadatos del paquete,
    consulta [Configuración y ajuste del plugin](/es/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Crear el objeto del plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo — `id` y `setup` — y agrega adaptadores según los necesites.

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

    <Accordion title="Qué hace por ti `createChatChannelPlugin`">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el generador las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor de seguridad de MD con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento por texto en MD con intercambio de código |
      | `threading` | Resolutor de modo de respuesta (fijo, con alcance por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (IDs de mensaje) |

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

    Coloca los descriptores de CLI propios del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el tiempo de ejecución completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real
    de comandos. Mantén `registerFull(...)` para trabajo exclusivo de tiempo de ejecución.
    Si `registerFull(...)` registra métodos RPC del Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` maneja automáticamente la separación por modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Agregar una entrada de configuración">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita incorporar código pesado de tiempo de ejecución durante los flujos de configuración.
    Consulta [Configuración y ajuste](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales incluidos del workspace que dividen exportaciones seguras para configuración en módulos
    complementarios pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter explícito del tiempo de ejecución en configuración.

  </Step>

  <Step title="Manejar mensajes entrantes">
    Tu plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador de entrada de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación administrada por el plugin (verifica tú mismo las firmas)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Tu controlador de entrada despacha el mensaje a OpenClaw.
          // El cableado exacto depende del SDK de tu plataforma —
          // consulta un ejemplo real en el paquete de plugin incluido de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada plugin de canal se encarga de
      su propia canalización de entrada. Consulta los plugins de canal incluidos
      (por ejemplo, el paquete de plugin de Microsoft Teams o Google Chat) para ver patrones reales.
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

    Para ayudantes de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

  </Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos de openclaw.channel
├── openclaw.plugin.json      # Manifiesto con esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportaciones públicas (opcional)
├── runtime-api.ts            # Exportaciones internas de tiempo de ejecución (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin mediante createChatChannelPlugin
    ├── channel.test.ts       # Pruebas
    ├── client.ts             # Cliente de API de la plataforma
    └── runtime.ts            # Almacén de tiempo de ejecución (si es necesario)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance por cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y detección de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Ayudantes de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagent mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas superficies auxiliares incluidas siguen existiendo para mantenimiento y
compatibilidad de plugins incluidos. No son el patrón recomendado para plugins de canal nuevos;
prefiere las subrutas genéricas de channel/setup/reply/runtime de la superficie
común del SDK, a menos que estés manteniendo directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto del plugin](/es/plugins/manifest) — esquema completo del manifiesto
