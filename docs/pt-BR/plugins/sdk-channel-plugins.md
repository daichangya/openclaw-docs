---
read_when:
    - Você está criando um novo Plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um Plugin de canal de mensagens para o OpenClaw
title: Criando Plugins de canal
x-i18n:
    generated_at: "2026-04-21T05:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Criando Plugins de canal

Este guia orienta a criação de um Plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança de DM,
pareamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum Plugin do OpenClaw, leia primeiro
  [Primeiros passos](/pt-BR/plugins/building-plugins) para entender a estrutura básica
  do pacote e a configuração do manifesto.
</Info>

## Como funcionam os Plugins de canal

Plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma
única ferramenta `message` compartilhada no core. Seu Plugin é responsável por:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e listas de permissões
- **Pareamento** — fluxo de aprovação de DM
- **Gramática de sessão** — como ids de conversa específicos do provider são mapeados para chats-base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como as respostas são encadeadas

O core é responsável pela ferramenta `message` compartilhada, integração com prompt, formato externo da chave de sessão,
bookkeeping genérico de `:thread:` e dispatch.

Se o seu canal adicionar params da ferramenta de mensagem que carregam fontes de mídia, exponha esses
nomes de param por meio de `describeMessageTool(...).mediaSourceParams`. O core usa
essa lista explícita para normalização de caminho de sandbox e política de acesso
à mídia de saída, para que os Plugins não precisem de casos especiais no core compartilhado para params
específicos de provider, como avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem args de mídia de outra ação. Um array simples ainda funciona para params que
são intencionalmente compartilhados por todas as ações expostas.

Se a sua plataforma armazenar escopo extra dentro de ids de conversa, mantenha esse parsing
no Plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook canônico
para mapear `rawId` para o id da conversa-base, id opcional de thread,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Quando você retornar `parentConversationCandidates`, mantenha a ordem deles do
pai mais restrito para a conversa-pai mais ampla/base.

Plugins empacotados que precisam do mesmo parsing antes de o registro de canais iniciar
também podem expor um arquivo de nível superior `session-key-api.ts` com um export
`resolveSessionConversation(...)` correspondente. O core usa essa superfície segura para bootstrap
somente quando o registro de Plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback legado de compatibilidade quando um Plugin só precisa de fallbacks de pai
além do id genérico/raw. Se ambos os hooks existirem, o core usa primeiro
`resolveSessionConversation(...).parentConversationCandidates` e só recorre a
`resolveParentConversationCandidates(...)` quando o hook canônico os omite.

## Aprovações e capacidades de canal

A maioria dos Plugins de canal não precisa de código específico de aprovação.

- O core é responsável por `/approve` no mesmo chat, payloads compartilhados de botão de aprovação e entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no Plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/aprovação nativa/renderização/autenticação em `approvalCapability`.
- `plugin.auth` é apenas para login/logout; o core não lê mais hooks de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a superfície canônica para autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se o seu canal expõe aprovações nativas de exec, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O core usa esse hook específico de exec para distinguir `enabled` vs `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal na orientação de fallback de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento específico de ciclo de vida de payload do canal, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento nativo de aprovação ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha-o lazy em entrypoints quentes de canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar o módulo de runtime sob demanda enquanto ainda permite que o core monte o ciclo de vida da aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads personalizados de aprovação em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desativado explique os knobs exatos de configuração necessários para ativar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com conta nomeada devem renderizar caminhos com escopo de conta como `channels.<channel>.accounts.<id>.execApprovals.*` em vez de padrões de nível superior.
- Se um canal puder inferir identidades estáveis semelhantes a proprietário em DM a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação no core.
- Se um canal precisar de entrega nativa de aprovação, mantenha o código do canal focado em normalização de alvo e fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o core possa montar o handler e ser responsável por filtragem de requisições, roteamento, deduplicação, expiração, assinatura do gateway e avisos de roteado-para-outro-lugar. `nativeRuntime` é dividido em algumas superfícies menores:
- `availability` — se a conta está configurada e se uma solicitação deve ser tratada
- `presentation` — mapear o view model compartilhado de aprovação em payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` — preparar alvos e enviar/atualizar/excluir mensagens nativas de aprovação
- `interactions` — hooks opcionais de bind/unbind/clear-action para botões ou reações nativas
- `observe` — hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos pertencentes ao runtime, como um cliente, token, app Bolt ou receptor de Webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o core inicialize handlers orientados por capacidade a partir do estado de inicialização do canal sem adicionar glue wrapper específico de aprovação.
- Recorra ao nível mais baixo `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` apenas quando a superfície orientada por capacidade ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear tanto `accountId` quanto `approvalKind` por esses helpers. `accountId` mantém a política de aprovação multi-conta no escopo da conta de bot correta, e `approvalKind` mantém o comportamento de aprovação de exec vs Plugin disponível para o canal sem branches codificados no core.
- O core agora também é responsável por avisos de redirecionamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento como "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha roteamento preciso de origem + DM do aprovador por meio dos helpers compartilhados de capacidade de aprovação e deixe o core agregar as entregas reais antes de publicar qualquer aviso de volta ao chat iniciador.
- Preserve a classe do id de aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar ou reescrever o roteamento de aprovação de exec vs Plugin a partir de estado local do canal.
- Diferentes classes de aprovação podem intencionalmente expor superfícies nativas diferentes.
  Exemplos atuais empacotados:
  - O Slack mantém o roteamento nativo de aprovação disponível para ids de exec e de Plugin.
  - O Matrix mantém o mesmo roteamento nativo de DM/canal e UX de reação para aprovações de exec
    e de Plugin, enquanto ainda permite que a autenticação difira por classe de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o construtor de capacidade e expor `approvalCapability` no Plugin.

Para entrypoints quentes de canal, prefira os subcaminhos de runtime mais restritos quando você precisar apenas
de uma parte dessa família:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Da mesma forma, prefira `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando você não precisar da superfície
guarda-chuva mais ampla.

Especificamente para setup:

- `openclaw/plugin-sdk/setup-runtime` cobre os helpers de setup seguros para runtime:
  adaptadores de patch de setup seguros para importação (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), saída de nota de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e os builders
  delegados de setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` é a superfície estreita de adaptador
  sensível a env para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de setup de instalação opcional
  mais alguns primitivos seguros para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferecer suporte a setup ou autenticação orientados por env e fluxos genéricos
de inicialização/configuração precisarem conhecer esses nomes de env antes de o runtime carregar,
declare-os no manifesto do Plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou
constantes locais apenas para cópia voltada ao operador.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a superfície mais ampla `openclaw/plugin-sdk/setup` apenas quando você também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal quiser apenas anunciar "instale este Plugin primeiro" nas
superfícies de setup, prefira `createOptionalChannelSetupSurface(...)`. O
adaptador/assistente gerado falha em modo fechado em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalize e cópia
de link de documentação.

Para outros caminhos quentes de canal, prefira os helpers estreitos em vez das
superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração multi-conta e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para integração de rota/envelope
  de entrada e record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` para parsing/correspondência de alvos
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegates de identidade/envio de saída e planejamento de payload
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de thread-binding
  e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` apenas quando um layout legado de campo
  de payload de agente/mídia ainda for necessário
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comando personalizado do Telegram, validação de duplicidade/conflito e um contrato estável de fallback para configuração de comandos

Canais somente de autenticação normalmente podem parar no caminho padrão: o core trata aprovações e o Plugin apenas expõe capacidades de saída/autenticação. Canais com aprovação nativa, como Matrix, Slack, Telegram e transportes de chat personalizados, devem usar os helpers nativos compartilhados em vez de criar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menção de entrada dividido em duas camadas:

- coleta de evidências pertencente ao Plugin
- avaliação compartilhada da política

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` apenas quando precisar do barrel mais amplo
de helpers de entrada.

Bom encaixe para lógica local do Plugin:

- detecção de resposta ao bot
- detecção de citação do bot
- verificações de participação na thread
- exclusões de mensagem de serviço/sistema
- caches nativos da plataforma necessários para comprovar participação do bot

Bom encaixe para o helper compartilhado:

- `requireMention`
- resultado explícito de menção
- lista de permissões de menção implícita
- bypass de comando
- decisão final de ignorar

Fluxo preferido:

1. Calcule fatos locais de menção.
2. Passe esses fatos para `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` no seu gate de entrada.

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

`api.runtime.channel.mentions` expõe os mesmos helpers compartilhados de menção para
Plugins de canal empacotados que já dependem de injeção de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você só precisar de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers de runtime
de entrada não relacionados.

Os helpers antigos `resolveMentionGating*` permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exports de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do Plugin. O campo `channel` em `package.json` é
    o que faz deste um Plugin de canal. Para a superfície completa de metadados do pacote,
    veja [Setup e Configuração do Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Conecte o OpenClaw ao Acme Chat."
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
      "description": "Plugin de canal Acme Chat",
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

  <Step title="Crie o objeto do Plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies opcionais de adaptador. Comece com
    o mínimo — `id` e `setup` — e adicione adaptadores conforme precisar.

    Crie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // seu cliente de API da plataforma

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

      // Segurança de DM: quem pode enviar mensagem ao bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pareamento: fluxo de aprovação para novos contatos por DM
      pairing: {
        text: {
          idLabel: "Nome de usuário do Acme Chat",
          message: "Envie este código para verificar sua identidade:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Encadeamento: como as respostas são entregues
      threading: { topLevelReplyToMode: "reply" },

      // Saída: envia mensagens para a plataforma
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

    <Accordion title="O que createChatChannelPlugin faz para você">
      Em vez de implementar manualmente interfaces de adaptador de baixo nível, você passa
      opções declarativas e o builder compõe tudo:

      | Option | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir dos campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo reply-to (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (IDs de mensagem) |

      Você também pode passar objetos brutos de adaptador em vez das opções declarativas
      se precisar de controle total.
    </Accordion>

  </Step>

  <Step title="Conecte o ponto de entrada">
    Crie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin de canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gerenciamento do Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gerenciamento do Acme Chat",
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
    enquanto carregamentos completos normais ainda capturam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho somente de runtime.
    Se `registerFull(...)` registrar métodos RPC do gateway, use um
    prefixo específico do Plugin. Namespaces de administração do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` trata automaticamente a divisão de modos de registro. Veja
    [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas as
    opções.

  </Step>

  <Step title="Adicione uma entrada de setup">
    Crie `setup-entry.ts` para carregamento leve durante o onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desativado
    ou não configurado. Isso evita puxar código pesado de runtime durante fluxos de setup.
    Veja [Setup e Configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais empacotados do workspace que dividem exports seguros para setup em módulos auxiliares
    podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime em tempo de setup.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu Plugin precisa receber mensagens da plataforma e encaminhá-las para o
    OpenClaw. O padrão típico é um Webhook que verifica a solicitação e
    a despacha por meio do handler de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticação gerenciada pelo Plugin (verifique as assinaturas você mesmo)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Seu handler de entrada despacha a mensagem para o OpenClaw.
          // A integração exata depende do SDK da sua plataforma —
          // veja um exemplo real no pacote de Plugin empacotado do Microsoft Teams ou Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens de entrada é específico de cada canal. Cada Plugin de canal
      é responsável pelo seu próprio pipeline de entrada. Veja os Plugins de canal empacotados
      (por exemplo, o pacote de Plugin do Microsoft Teams ou Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocalizados em `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("resolve conta a partir da configuração", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspeciona a conta sem materializar segredos", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("informa configuração ausente", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de teste compartilhados, veja [Testes](/pt-BR/plugins/sdk-testing).

  </Step>
</Steps>

## Estrutura de arquivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadados openclaw.channel
├── openclaw.plugin.json      # Manifesto com schema de configuração
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports públicos (opcional)
├── runtime-api.ts            # Exports internos de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Testes
    ├── client.ts             # Cliente de API da plataforma
    └── runtime.ts            # Armazenamento de runtime (se necessário)
```

## Tópicos avançados

<CardGroup cols={2}>
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo de conta ou personalizados
  </Card>
  <Card title="Integração da ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de alvo" icon="crosshair" href="/pt-BR/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
</CardGroup>

<Note>
Algumas superfícies auxiliares empacotadas ainda existem para manutenção de Plugins empacotados e
compatibilidade. Elas não são o padrão recomendado para novos Plugins de canal;
prefira os subcaminhos genéricos de channel/setup/reply/runtime da superfície
comum do SDK, a menos que você esteja mantendo diretamente essa família de Plugins empacotados.
</Note>

## Próximos passos

- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — se o seu Plugin também fornece modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de imports por subcaminho
- [Testes do SDK](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — schema completo do manifesto
