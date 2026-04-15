---
read_when:
    - Está creando un nuevo Plugin de canal de mensajería.
    - Quiere conectar OpenClaw a una plataforma de mensajería.
    - Necesita comprender la superficie del adaptador `ChannelPlugin`.
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear Plugins de canal
x-i18n:
    generated_at: "2026-04-15T19:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Crear Plugins de canal

Esta guía recorre la creación de un Plugin de canal que conecta OpenClaw a una
plataforma de mensajería. Al final tendrá un canal funcional con seguridad en MD,
emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si todavía no ha creado ningún Plugin de OpenClaw, lea primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Su Plugin es responsable de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de MD y listas de permitidos
- **Emparejamiento** — flujo de aprobación de MD
- **Gramática de sesión** — cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas del elemento superior
- **Salida** — envío de texto, medios y encuestas a la plataforma
- **Encadenamiento** — cómo se encadenan las respuestas

El núcleo es responsable de la herramienta de mensajes compartida, el cableado del prompt, la forma externa de la clave de sesión,
la contabilidad genérica `:thread:` y el despacho.

Si su canal agrega parámetros a la herramienta de mensajes que transportan fuentes de medios, exponga esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a medios salientes,
por lo que los Plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
como avatar, adjunto o imagen de portada.
Prefiera devolver un mapa indexado por acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano también funciona para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si su plataforma almacena alcance adicional dentro de los identificadores de conversación, mantenga ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el gancho canónico para asignar
`rawId` al identificador de conversación base, identificador de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelva `parentConversationCandidates`, manténgalos ordenados desde el
elemento superior más específico hasta la conversación base o más amplia.

Los Plugins incluidos que necesitan el mismo análisis antes de que se inicie el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` coincidente. El núcleo usa esa superficie segura para el arranque
solo cuando el registro de Plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como una
alternativa heredada de compatibilidad cuando un Plugin solo necesita alternativas del elemento superior
además del identificador genérico o sin procesar. Si existen ambos ganchos, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el gancho canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El núcleo es responsable de `/approve` en el mismo chat, de las cargas útiles compartidas de botones de aprobación y de la entrega genérica de respaldo.
- Prefiera un solo objeto `approvalCapability` en el Plugin del canal cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloque los datos de entrega/aprobación nativa/renderizado/autenticación en `approvalCapability`.
- `plugin.auth` es solo para login/logout; el núcleo ya no lee ganchos de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la unión canónica para autenticación de aprobación.
- Use `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobación en el mismo chat.
- Si su canal expone aprobaciones nativas de ejecución, use `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. El núcleo usa ese gancho específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía de respaldo del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Use `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para el comportamiento específico del canal en el ciclo de vida de la carga útil, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Use `approvalCapability.delivery` solo para el enrutamiento de aprobaciones nativas o la supresión de respaldo.
- Use `approvalCapability.nativeRuntime` para datos de aprobación nativa que pertenezcan al canal. Manténgalo diferido en puntos de entrada críticos del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar su módulo de tiempo de ejecución bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de aprobación.
- Use `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Use `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de ruta deshabilitada explique los ajustes exactos de configuración necesarios para habilitar aprobaciones nativas de ejecución. El gancho recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance por cuenta, como `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables tipo propietario en MD a partir de la configuración existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica específica de aprobación en el núcleo.
- Si un canal necesita entrega de aprobación nativa, mantenga el código del canal enfocado en la normalización del destino más los datos de transporte/presentación. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el controlador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, expiración, suscripción al Gateway y avisos de redirección. `nativeRuntime` se divide en algunas uniones más pequeñas:
- `availability` — si la cuenta está configurada y si se debe manejar una solicitud
- `presentation` — asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/expiradas o acciones finales
- `transport` — prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions` — ganchos opcionales de asociar/desasociar/borrar acción para botones o reacciones nativos
- `observe` — ganchos opcionales de diagnóstico de entrega
- Si el canal necesita objetos que pertenecen al tiempo de ejecución, como un cliente, token, app Bolt o receptor de Webhook, regístrelos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de tiempo de ejecución permite que el núcleo inicialice controladores impulsados por capacidades a partir del estado de inicio del canal sin agregar lógica de envoltura específica de aprobación.
- Recurra a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la unión guiada por capacidades todavía no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos helpers. `accountId` mantiene la política de aprobación multicuenta dentro del alcance de la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente al de Plugin sin ramas codificadas en el núcleo.
- El núcleo ahora también es responsable de los avisos de redirección de aprobación. Los Plugins de canal no deben enviar sus propios mensajes de seguimiento de “la aprobación fue a los MD / a otro canal” desde `createChannelNativeApprovalRuntime`; en su lugar, exponga un enrutamiento preciso del origen y del MD del aprobador mediante los helpers de capacidad de aprobación compartida y deje que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta en el chat iniciador.
- Preserve de extremo a extremo el tipo de identificador de aprobación entregado. Los clientes nativos no deben
  inferir ni reescribir el enrutamiento de aprobación de ejecución frente al de Plugin a partir del estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente superficies nativas diferentes.
  Ejemplos actuales incluidos:
  - Slack mantiene disponible el enrutamiento de aprobación nativa tanto para identificadores de ejecución como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo de MD/canal y la misma UX de reacciones para aprobaciones de ejecución
    y de Plugin, a la vez que permite que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debe preferir el generador de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada críticos del canal, prefiera las subrutas de tiempo de ejecución más específicas cuando solo
necesite una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

De igual manera, prefiera `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesite la superficie
paraguas más amplia.

Para la configuración específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para tiempo de ejecución:
  adaptadores de parcheo de configuración seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la unión de adaptador
  específica y acotada para entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si su canal admite configuración o autenticación impulsadas por variables de entorno y los
flujos genéricos de inicio/configuración deben conocer esos nombres de variables de entorno antes de que se cargue el tiempo de ejecución,
declárelos en el manifiesto del Plugin con `channelEnvVars`. Mantenga `envVars` del tiempo de ejecución del canal o constantes locales solo para el texto dirigido a operadores.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- use la unión más amplia `openclaw/plugin-sdk/setup` solo cuando también necesite los
  helpers compartidos más pesados de configuración/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si su canal solo quiere anunciar “instale primero este Plugin” en las
superficies de configuración, prefiera `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, finalización y el texto
del enlace a la documentación.

Para otras rutas críticas del canal, prefiera los helpers específicos en lugar de las
superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  respaldo de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para cableado de ruta/sobre entrante y
  registrar-y-despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis y coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de identidad/envío
  salientes
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de asociaciones de hilo
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando siga siendo necesario un diseño heredado de campos
  de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos
  estable como respaldo

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: el núcleo se encarga de las aprobaciones y el Plugin solo expone capacidades de salida/autenticación. Los canales de aprobación nativa, como Matrix, Slack, Telegram y transportes de chat personalizados, deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantenga el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia que pertenece al Plugin
- evaluación de políticas compartidas

Use `openclaw/plugin-sdk/channel-inbound` para la capa compartida.

Buen ajuste para lógica local del Plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en el hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativos de la plataforma necesarios para demostrar participación del bot

Buen ajuste para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de mención implícita
- omisión de comandos
- decisión final de omitir

Flujo recomendado:

1. Calcule los datos locales de mención.
2. Pase esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en su compuerta de entrada.

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

`api.runtime.channel.mentions` expone los mismos helpers de mención compartidos para
los Plugins de canal incluidos que ya dependen de la inyección en tiempo de ejecución:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Los helpers antiguos `resolveMentionGating*` siguen estando en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Cree los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que hace que este sea un Plugin de canal. Para conocer toda la superficie de metadatos del paquete,
    consulte [Configuración y Setup del Plugin](/es/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Construir el objeto del Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empiece con
    lo mínimo — `id` y `setup` — y agregue adaptadores según los necesite.

    Cree `src/channel.ts`:

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

    <Accordion title="Qué hace `createChatChannelPlugin` por usted">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, usted pasa
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolutor de seguridad de MD con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento por texto en MD con intercambio de código |
      | `threading` | Resolutor de modo de respuesta (fijo, con alcance por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (IDs de mensaje) |

      También puede pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesita control total.
    </Accordion>

  </Step>

  <Step title="Conectar el punto de entrada">
    Cree `index.ts`:

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

    Coloque los descriptores de CLI que pertenecen al canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el tiempo de ejecución completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real
    de comandos. Mantenga `registerFull(...)` para trabajo exclusivo de tiempo de ejecución.
    Si `registerFull(...)` registra métodos RPC del Gateway, use un
    prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven en `operator.admin`.
    `defineChannelPluginEntry` maneja automáticamente la división del modo de registro. Consulte
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Agregar una entrada de configuración">
    Cree `setup-entry.ts` para carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no está configurado. Evita cargar código pesado de tiempo de ejecución durante los flujos de configuración.
    Consulte [Setup y Configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales de workspace incluidos que dividen exportaciones seguras para configuración en módulos
    auxiliares pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter explícito de tiempo de ejecución para configuración.

  </Step>

  <Step title="Manejar mensajes entrantes">
    Su Plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador entrante de su canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal es responsable de
      su propia canalización de entrada. Revise los Plugins de canal incluidos
      (por ejemplo, el paquete de Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
Escriba pruebas colocadas junto al código en `src/channel.test.ts`:

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

    Para los helpers de prueba compartidos, consulte [Pruebas](/es/plugins/sdk-testing).

  </Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de encadenamiento" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance por cuenta o personalizados
  </Card>
  <Card title="Integración con la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas uniones auxiliares incluidas siguen existiendo para el mantenimiento y la
compatibilidad de Plugins incluidos. No son el patrón recomendado para nuevos Plugins de canal;
prefiera las subrutas genéricas de canal/configuración/respuesta/tiempo de ejecución de la superficie común del SDK
a menos que esté manteniendo directamente esa familia de Plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si su Plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto del Plugin](/es/plugins/manifest) — esquema completo del manifiesto
