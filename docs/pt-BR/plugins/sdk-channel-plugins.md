---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para o OpenClaw
title: Criando plugins de canal
x-i18n:
    generated_at: "2026-04-05T12:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Criando plugins de canal

Este guia mostra como criar um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
emparelhamento, encadeamento de respostas e envio de mensagens.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia
  [Primeiros passos](/plugins/building-plugins) primeiro para entender a estrutura
  básica do pacote e a configuração do manifesto.
</Info>

## Como os plugins de canal funcionam

Os plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
ferramenta compartilhada `message` no core. Seu plugin é responsável por:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e allowlists
- **Emparelhamento** — fluxo de aprovação de DM
- **Gramática de sessão** — como ids de conversa específicos do provedor se mapeiam para chats base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como as respostas são encadeadas

O core é responsável pela ferramenta de mensagem compartilhada, pela integração com prompts, pelo formato externo da chave de sessão,
pela contabilidade genérica de `:thread:` e pelo despacho.

Se a sua plataforma armazenar escopo extra dentro dos ids de conversa, mantenha essa análise
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook
canônico para mapear `rawId` para o id base da conversa, um id de thread
opcional, `baseConversationId` explícito e quaisquer
`parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do pai
mais específico para a conversa pai/base mais ampla.

Plugins integrados que precisem da mesma análise antes de o registro de canais ser inicializado
também podem expor um arquivo `session-key-api.ts` de nível superior com uma exportação
`resolveSessionConversation(...)` correspondente. O core usa essa superfície segura para bootstrap
somente quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como fallback legado
de compatibilidade quando um plugin só precisa de fallbacks de pai além do
id bruto/genérico. Se ambos os hooks existirem, o core usará primeiro
`resolveSessionConversation(...).parentConversationCandidates` e só fará fallback para
`resolveParentConversationCandidates(...)` quando o hook canônico
não os incluir.

## Aprovações e capacidades de canal

A maioria dos plugins de canal não precisa de código específico de aprovação.

- O core é responsável por `/approve` no mesmo chat, payloads compartilhados de botão de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no plugin do canal quando o canal precisar de comportamento específico de aprovação.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a superfície canônica de autenticação de aprovação.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento específico do canal no ciclo de vida do payload, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento nativo de aprovação ou supressão de fallback.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Se um canal puder inferir identidades de DM estáveis semelhantes a proprietário a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação no core.
- Se um canal precisar de entrega nativa de aprovação, mantenha o código do canal focado em normalização de destino e hooks de transporte. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` e `createChannelNativeApprovalRuntime` de `openclaw/plugin-sdk/approval-runtime` para que o core seja responsável por filtragem de solicitações, roteamento, deduplicação, expiração e assinatura no gateway.
- Canais com aprovação nativa devem encaminhar tanto `accountId` quanto `approvalKind` por esses helpers. `accountId` mantém a política de aprovação multi-conta limitada à conta correta do bot, e `approvalKind` mantém o comportamento de aprovação de exec vs plugin disponível para o canal sem branches codificados no core.
- Preserve o tipo do id de aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar nem reescrever o roteamento de aprovação exec vs plugin com base em estado local do canal.
- Diferentes tipos de aprovação podem intencionalmente expor diferentes superfícies nativas.
  Exemplos integrados atuais:
  - O Slack mantém o roteamento nativo de aprovação disponível tanto para ids de exec quanto de plugin.
  - O Matrix mantém o roteamento nativo de DM/canal apenas para aprovações de exec e deixa
    aprovações de plugin no caminho compartilhado `/approve` no mesmo chat.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas o código novo deve preferir o construtor de capability e expor `approvalCapability` no plugin.

Para entrypoints de canal sensíveis a desempenho, prefira os subpaths de runtime mais específicos quando você precisar
de apenas uma parte dessa família:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Da mesma forma, prefira `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da
superfície guarda-chuva mais ampla.

Especificamente para setup:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de setup seguros para runtime:
  adaptadores de patch de setup seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os construtores de
  proxy de setup delegado
- `openclaw/plugin-sdk/setup-adapter-runtime` é a superfície estreita de adaptador
  compatível com env para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os construtores de setup de instalação
  opcional, além de alguns primitivos seguros para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
  `splitSetupEntries`
- use a superfície mais ampla `openclaw/plugin-sdk/setup` somente quando também precisar
  dos helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal quiser apenas anunciar “instale este plugin primeiro” em superfícies de setup,
prefira `createOptionalChannelSetupSurface(...)`. O adaptador/assistente gerado falha de forma fechada em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e texto de link para a documentação.

Para outros caminhos de canal sensíveis a desempenho, prefira os helpers estreitos em vez de
superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração multi-conta e
  fallback da conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para rota/envelope de entrada e
  integração de registrar e despachar
- `openclaw/plugin-sdk/messaging-targets` para análise/correspondência de destino
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegados de identidade/envio de saída
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida do vínculo de thread
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` somente quando um layout de campo de payload
  legado de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos personalizados do Telegram, validação de duplicatas/conflitos e contrato de configuração de comando estável para fallback

Canais somente de autenticação geralmente podem parar no caminho padrão: o core lida com aprovações e o plugin apenas expõe capacidades de saída/autenticação. Canais de aprovação nativa como Matrix, Slack, Telegram e transportes de chat personalizados devem usar os helpers nativos compartilhados em vez de implementar seu próprio ciclo de vida de aprovação.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channel` em `package.json` é
    o que torna este um plugin de canal. Para a superfície completa de metadados do pacote,
    veja [Setup e configuração do plugin](/plugins/sdk-setup#openclawchannel):

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

  <Step title="Criar o objeto do plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies de adaptador opcionais. Comece com
    o mínimo — `id` e `setup` — e adicione adaptadores conforme necessário.

    Crie `src/channel.ts`:

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

    <Accordion title="O que `createChatChannelPlugin` faz por você">
      Em vez de implementar manualmente interfaces de adaptador de baixo nível, você fornece
      opções declarativas e o construtor as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de emparelhamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo de resposta (fixo, com escopo por conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados do resultado (ids de mensagem) |

      Você também pode passar objetos de adaptador brutos em vez das opções declarativas
      se precisar de controle total.
    </Accordion>

  </Step>

  <Step title="Conectar o entry point">
    Crie `index.ts`:

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

    Coloque descritores de CLI pertencentes ao canal em `registerCliMetadata(...)` para que o OpenClaw
    possa mostrá-los na ajuda raiz sem ativar o runtime completo do canal,
    enquanto carregamentos completos normais ainda incorporam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho somente de runtime.
    Se `registerFull(...)` registrar métodos RPC do gateway, use um
    prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` lida automaticamente com a divisão por modo de registro. Veja
    [Entry points](/plugins/sdk-entrypoints#definechannelpluginentry) para todas as
    opções.

  </Step>

  <Step title="Adicionar um entry de setup">
    Crie `setup-entry.ts` para carregamento leve durante o onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez do entry completo quando o canal está desativado
    ou não configurado. Isso evita puxar código pesado de runtime durante os fluxos de setup.
    Veja [Setup e configuração](/plugins/sdk-setup#setup-entry) para detalhes.

  </Step>

  <Step title="Lidar com mensagens de entrada">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las para o
    OpenClaw. O padrão típico é um webhook que verifica a solicitação e a
    despacha por meio do handler de entrada do seu canal:

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
      O tratamento de mensagens de entrada é específico de cada canal. Cada plugin de canal
      é responsável pelo seu próprio pipeline de entrada. Veja plugins de canal integrados
      (por exemplo, o pacote de plugin Microsoft Teams ou Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testar">
Escreva testes colocados ao lado do código em `src/channel.test.ts`:

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

    Para helpers de teste compartilhados, veja [Testes](/plugins/sdk-testing).

  </Step>
</Steps>

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifesto com schema de configuração
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportações públicas (opcional)
├── runtime-api.ts            # Exportações internas de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Testes
    ├── client.ts             # Cliente da API da plataforma
    └── runtime.ts            # Armazenamento de runtime (se necessário)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Opções de encadeamento" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo por conta ou personalizados
  </Card>
  <Card title="Integração com a ferramenta de mensagem" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
</CardGroup>

<Note>
Algumas superfícies de helper integradas ainda existem para manutenção e
compatibilidade de plugins integrados. Elas não são o padrão recomendado para novos plugins de canal;
prefira os subpaths genéricos de channel/setup/reply/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de plugins integrados.
</Note>

## Próximos passos

- [Plugins de provedor](/plugins/sdk-provider-plugins) — se o seu plugin também fornecer modelos
- [Visão geral do SDK](/plugins/sdk-overview) — referência completa de importação de subpaths
- [Testes do SDK](/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifesto do plugin](/plugins/manifest) — schema completo do manifesto
