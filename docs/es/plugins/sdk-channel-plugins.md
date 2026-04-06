---
read_when:
    - Estás creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-04-06T03:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66b52c10945a8243d803af3bf7e1ea0051869ee92eda2af5718d9bb24fbb8552
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creación de plugins de canal

Esta guía te acompaña en la creación de un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad de DM,
emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún plugin de OpenClaw, lee primero
  [Getting Started](/es/plugins/building-plugins) para conocer la estructura
  básica del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas para enviar/editar/reaccionar. OpenClaw mantiene una
herramienta compartida `message` en el núcleo. Tu plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de DM y listas permitidas
- **Emparejamiento** — flujo de aprobación para nuevos contactos por DM
- **Gramática de sesión** — cómo los IDs de conversación específicos del proveedor se asignan a chats base, IDs de hilo y fallbacks de padre
- **Salida** — envío de texto, medios y encuestas a la plataforma
- **Encadenamiento** — cómo se encadenan las respuestas

El núcleo se encarga de la herramienta de mensajes compartida, la conexión de prompts, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Si tu plataforma almacena alcance adicional dentro de los IDs de conversación, mantén ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook canónico para asignar `rawId` al ID de conversación base, al ID de hilo opcional, al `baseConversationId` explícito y a cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados del padre
más específico al más amplio/conversación base.

Los plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
coincidente `resolveSessionConversation(...)`. El núcleo usa esa superficie segura para bootstrap
solo cuando el registro de plugins en tiempo de ejecución aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como fallback heredado de compatibilidad cuando un plugin solo necesita fallbacks de padre además del ID genérico/sin procesar.
Si ambos hooks existen, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico para aprobaciones.

- El núcleo se encarga de `/approve` en el mismo chat, de los payloads compartidos de botones de aprobación y de la entrega genérica de fallback.
- Prefiere un único objeto `approvalCapability` en el plugin de canal cuando el canal necesita comportamiento específico de aprobación.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la separación canónica para la autenticación de aprobaciones.
- Si tu canal expone aprobaciones nativas de ejecución, implementa `approvalCapability.getActionAvailabilityState` incluso cuando el transporte nativo viva por completo bajo `approvalCapability.native`. El núcleo usa ese hook de disponibilidad para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas e incluir el canal en la orientación de fallback del cliente nativo.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida del payload específico del canal, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para el enrutamiento de aprobaciones nativas o la supresión de fallback.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite payloads de aprobación personalizados en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los ajustes exactos de configuración necesarios para habilitar aprobaciones nativas de ejecución. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuenta nombrada deben renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables tipo propietario en DM a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` desde `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica del núcleo específica para aprobaciones.
- Si un canal necesita entrega nativa de aprobaciones, mantén el código del canal centrado en la normalización del destino y en hooks de transporte. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` y `createChannelNativeApprovalRuntime` desde `openclaw/plugin-sdk/approval-runtime` para que el núcleo se encargue del filtrado de solicitudes, el enrutamiento, la deduplicación, la caducidad y la suscripción al gateway.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos ayudantes. `accountId` mantiene la política de aprobación multicuenta dentro del alcance correcto de la cuenta del bot, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente a plugin sin ramas rígidas en el núcleo.
- Conserva el tipo de ID de aprobación entregado de extremo a extremo. Los clientes nativos no deben adivinar
  ni reescribir el enrutamiento de aprobaciones de ejecución frente a plugin a partir del estado local del canal.
- Los distintos tipos de aprobación pueden exponer intencionalmente superficies nativas diferentes.
  Ejemplos incluidos actualmente:
  - Slack mantiene disponible el enrutamiento nativo de aprobaciones tanto para IDs de ejecución como de plugin.
  - Matrix mantiene el enrutamiento nativo de DM/canal solo para aprobaciones de ejecución y deja
    las aprobaciones de plugin en la ruta compartida `/approve` del mismo chat.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltura de compatibilidad, pero el código nuevo debería preferir el constructor de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada de canal críticos, prefiere las subrutas de tiempo de ejecución más específicas cuando solo
necesites una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Del mismo modo, prefiere `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la
superficie paraguas más amplia.

En configuración específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los ayudantes de configuración seguros para tiempo de ejecución:
  adaptadores de parches de configuración seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la separación estrecha del adaptador
  consciente del entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional más algunos primitivos seguros para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
  `splitSetupEntries`
- usa la separación más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  ayudantes más pesados compartidos de configuración/config como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala este plugin primero" en superficies de configuración,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado falla
de forma cerrada en escrituras de configuración y finalización, y reutiliza el mismo mensaje de instalación requerida en validación, finalización y texto de enlace a documentación.

Para otras rutas críticas de canal, prefiere los ayudantes estrechos frente a superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  fallback a cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para cableado de ruta/sobre entrante y
  registro y despacho
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de identidad/envío saliente
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida
  de enlaces de hilos y registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiera un diseño heredado de campos de payload de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram, validación de duplicados/conflictos y un contrato de configuración de comandos estable como fallback

Los canales solo de autenticación normalmente pueden detenerse en la ruta predeterminada: el núcleo gestiona las aprobaciones y el plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los ayudantes nativos compartidos en lugar de crear su propio ciclo de vida de aprobaciones.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un plugin de canal. Para la superficie completa de metadatos del paquete,
    consulta [Plugin Setup and Config](/es/plugins/sdk-setup#openclawchannel):

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

  <Step title="Construye el objeto del plugin de canal">
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

    <Accordion title="Qué hace `createChatChannelPlugin` por ti">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad de DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento por DM basado en texto con intercambio de códigos |
      | `threading` | Resolver de modo reply-to (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (IDs de mensajes) |

      También puedes pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesitas control total.
    </Accordion>

  </Step>

  <Step title="Conecta el punto de entrada">
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
    mientras que las cargas completas normales seguirán recogiendo los mismos descriptores para el registro real de comandos.
    Mantén `registerFull(...)` para trabajo exclusivo de tiempo de ejecución.
    Si `registerFull(...)` registra métodos RPC del gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división por modo de registro. Consulta
    [Entry Points](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Añade una entrada de configuración">
    Crea `setup-entry.ts` para carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita cargar código pesado de tiempo de ejecución durante los flujos de configuración.
    Consulta [Setup and Config](/es/plugins/sdk-setup#setup-entry) para ver detalles.

  </Step>

  <Step title="Gestiona los mensajes entrantes">
    Tu plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un webhook que verifica la solicitud y
    la despacha a través del controlador entrante de tu canal:

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
      La gestión de mensajes entrantes es específica de cada canal. Cada plugin de canal se encarga
      de su propia canalización entrante. Mira los plugins de canal incluidos
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
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

    Para ver ayudantes de prueba compartidos, consulta [Testing](/es/plugins/sdk-testing).

  </Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos openclaw.channel
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
  <Card title="Opciones de encadenamiento" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance de cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destinos" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Ayudantes de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas separaciones de ayudantes incluidos siguen existiendo para mantenimiento y
compatibilidad de plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/tiempo de ejecución de la superficie común del SDK
a menos que estés manteniendo directamente esa familia de plugins incluidos.
</Note>

## Próximos pasos

- [Provider Plugins](/es/plugins/sdk-provider-plugins) — si tu plugin también proporciona modelos
- [SDK Overview](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [SDK Testing](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Plugin Manifest](/es/plugins/manifest) — esquema completo del manifiesto
