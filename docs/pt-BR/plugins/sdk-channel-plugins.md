---
read_when:
    - Você está criando um novo plugin de canal de mensagens
    - Você quer conectar o OpenClaw a uma plataforma de mensagens
    - Você precisa entender a superfície do adaptador `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guia passo a passo para criar um plugin de canal de mensagens para OpenClaw
title: Criando Plugins de Canal
x-i18n:
    generated_at: "2026-04-22T05:34:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Criando Plugins de Canal

Este guia mostra como criar um plugin de canal que conecta o OpenClaw a uma
plataforma de mensagens. Ao final, você terá um canal funcional com segurança
de DM, pareamento, encadeamento de respostas e mensagens de saída.

<Info>
  Se você ainda não criou nenhum plugin do OpenClaw, leia
  [Primeiros passos](/pt-BR/plugins/building-plugins) primeiro para entender a
  estrutura básica do pacote e a configuração do manifesto.
</Info>

## Como os plugins de canal funcionam

Os plugins de canal não precisam de suas próprias ferramentas de enviar/editar/reagir. O OpenClaw mantém uma ferramenta `message` compartilhada no core. Seu plugin é responsável por:

- **Configuração** — resolução de conta e assistente de configuração
- **Segurança** — política de DM e listas de permissão
- **Pareamento** — fluxo de aprovação de DM
- **Gramática de sessão** — como os ids de conversa específicos do provedor são mapeados para chats base, ids de thread e fallbacks de pai
- **Saída** — envio de texto, mídia e enquetes para a plataforma
- **Encadeamento** — como as respostas são encadeadas
- **Digitação de Heartbeat** — sinais opcionais de digitando/ocupado para destinos de entrega do Heartbeat

O core é responsável pela ferramenta de mensagem compartilhada, pela ligação de prompts, pelo formato externo da chave de sessão, pelo controle genérico de `:thread:` e pelo despacho.

Se o seu canal oferecer suporte a indicadores de digitação fora de respostas recebidas, exponha
`heartbeat.sendTyping(...)` no plugin de canal. O core o chama com o
destino de entrega do Heartbeat resolvido antes do início da execução do modelo de Heartbeat e
usa o ciclo de vida compartilhado de keepalive/limpeza de digitação. Adicione `heartbeat.clearTyping(...)`
quando a plataforma exigir um sinal explícito de parada.

Se o seu canal adicionar parâmetros da ferramenta de mensagem que carreguem fontes de mídia, exponha esses
nomes de parâmetro por meio de `describeMessageTool(...).mediaSourceParams`. O core usa
essa lista explícita para normalização de caminho no sandbox e para a política
de acesso a mídia de saída, então os plugins não precisam de casos especiais no core compartilhado para parâmetros
específicos do provedor, como avatar, anexo ou imagem de capa.
Prefira retornar um mapa indexado por ação, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que ações não relacionadas não
herdem os argumentos de mídia de outra ação. Um array simples ainda funciona para parâmetros que
são intencionalmente compartilhados entre todas as ações expostas.

Se sua plataforma armazenar escopo extra dentro de ids de conversa, mantenha essa análise
no plugin com `messaging.resolveSessionConversation(...)`. Esse é o hook canônico para mapear
`rawId` para o id base da conversa, id opcional da thread,
`baseConversationId` explícito e quaisquer `parentConversationCandidates`.
Ao retornar `parentConversationCandidates`, mantenha-os ordenados do
pai mais específico para a conversa base/mais ampla.

Plugins empacotados que precisem da mesma análise antes de o registro de canais iniciar
também podem expor um arquivo `session-key-api.ts` de nível superior com uma
exportação `resolveSessionConversation(...)` correspondente. O core usa essa superfície segura para bootstrap
somente quando o registro de plugins em runtime ainda não está disponível.

`messaging.resolveParentConversationCandidates(...)` continua disponível como
fallback legado de compatibilidade quando um plugin precisa apenas de fallbacks de pai
sobre o id genérico/bruto. Se ambos os hooks existirem, o core usará
`resolveSessionConversation(...).parentConversationCandidates` primeiro e só
recorrerá a `resolveParentConversationCandidates(...)` quando o hook canônico
os omitir.

## Aprovações e capacidades do canal

A maioria dos plugins de canal não precisa de código específico para aprovações.

- O core é responsável por `/approve` no mesmo chat, por payloads compartilhados de botão de aprovação e pela entrega genérica de fallback.
- Prefira um único objeto `approvalCapability` no plugin de canal quando o canal precisar de comportamento específico de aprovação.
- `ChannelPlugin.approvals` foi removido. Coloque fatos de entrega/renderização/autenticação/aprovação nativa em `approvalCapability`.
- `plugin.auth` é apenas para login/logout; o core não lê mais hooks de autenticação de aprovação desse objeto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` são a interface canônica de autenticação de aprovação.
- Use `approvalCapability.getActionAvailabilityState` para disponibilidade de autenticação de aprovação no mesmo chat.
- Se seu canal expuser aprovações nativas de execução, use `approvalCapability.getExecInitiatingSurfaceState` para o estado da superfície iniciadora/cliente nativo quando ele diferir da autenticação de aprovação no mesmo chat. O core usa esse hook específico de exec para distinguir `enabled` de `disabled`, decidir se o canal iniciador oferece suporte a aprovações nativas de exec e incluir o canal na orientação de fallback do cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` preenche isso para o caso comum.
- Use `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` para comportamento específico do canal no ciclo de vida do payload, como ocultar prompts locais de aprovação duplicados ou enviar indicadores de digitação antes da entrega.
- Use `approvalCapability.delivery` apenas para roteamento de aprovação nativa ou supressão de fallback.
- Use `approvalCapability.nativeRuntime` para fatos de aprovação nativa pertencentes ao canal. Mantenha isso lazy em entrypoints quentes do canal com `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que pode importar seu módulo de runtime sob demanda enquanto ainda permite que o core monte o ciclo de vida da aprovação.
- Use `approvalCapability.render` apenas quando um canal realmente precisar de payloads de aprovação personalizados em vez do renderizador compartilhado.
- Use `approvalCapability.describeExecApprovalSetup` quando o canal quiser que a resposta do caminho desabilitado explique os controles exatos de configuração necessários para habilitar aprovações nativas de exec. O hook recebe `{ channel, channelLabel, accountId }`; canais com conta nomeada devem renderizar caminhos com escopo de conta, como `channels.<channel>.accounts.<id>.execApprovals.*`, em vez de padrões de nível superior.
- Se um canal puder inferir identidades de DM estáveis semelhantes a proprietários a partir da configuração existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` no mesmo chat sem adicionar lógica específica de aprovação ao core.
- Se um canal precisar de entrega de aprovação nativa, mantenha o código do canal focado em normalização de destino mais fatos de transporte/apresentação. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque os fatos específicos do canal atrás de `approvalCapability.nativeRuntime`, idealmente por meio de `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que o core possa montar o handler e ser responsável por filtragem de requisições, roteamento, deduplicação, expiração, assinatura do gateway e avisos de roteamento alternativo. `nativeRuntime` é dividido em algumas interfaces menores:
- `availability` — se a conta está configurada e se uma requisição deve ser tratada
- `presentation` — mapeia o modelo de view de aprovação compartilhado para payloads nativos pendentes/resolvidos/expirados ou ações finais
- `transport` — prepara destinos mais envia/atualiza/exclui mensagens nativas de aprovação
- `interactions` — hooks opcionais de bind/unbind/clear-action para botões nativos ou reações
- `observe` — hooks opcionais de diagnóstico de entrega
- Se o canal precisar de objetos controlados pelo runtime, como um cliente, token, app Bolt ou receptor de Webhook, registre-os por meio de `openclaw/plugin-sdk/channel-runtime-context`. O registro genérico de contexto de runtime permite que o core inicialize handlers orientados por capacidade a partir do estado de inicialização do canal sem adicionar cola de wrapper específica de aprovação.
- Recorra a `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de nível mais baixo apenas quando a interface orientada por capacidade ainda não for expressiva o suficiente.
- Canais de aprovação nativa devem rotear `accountId` e `approvalKind` por esses helpers. `accountId` mantém a política de aprovação multi-conta com escopo para a conta de bot correta, e `approvalKind` mantém o comportamento de aprovação de exec vs plugin disponível ao canal sem ramificações codificadas no core.
- O core agora também é responsável por avisos de reroteamento de aprovação. Plugins de canal não devem enviar suas próprias mensagens de acompanhamento do tipo "a aprovação foi para DMs / outro canal" a partir de `createChannelNativeApprovalRuntime`; em vez disso, exponha o roteamento correto de origem + DM do aprovador por meio dos helpers compartilhados de capacidade de aprovação e deixe o core agregar as entregas reais antes de publicar qualquer aviso de volta no chat iniciador.
- Preserve o tipo de id de aprovação entregue de ponta a ponta. Clientes nativos não devem
  adivinhar nem reescrever o roteamento de aprovação de exec vs plugin a partir do estado local do canal.
- Diferentes tipos de aprovação podem expor intencionalmente diferentes superfícies nativas.
  Exemplos empacotados atuais:
  - O Slack mantém o roteamento de aprovação nativa disponível para ids de exec e de plugin.
  - O Matrix mantém o mesmo roteamento nativo de DM/canal e UX baseada em reação para aprovações de exec
    e de plugin, enquanto ainda permite que a autenticação difira por tipo de aprovação.
- `createApproverRestrictedNativeApprovalAdapter` ainda existe como wrapper de compatibilidade, mas código novo deve preferir o construtor de capacidade e expor `approvalCapability` no plugin.

Para entrypoints quentes do canal, prefira os subcaminhos de runtime mais específicos quando você
precisar apenas de uma parte dessa família:

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
  delegados de proxy de setup
- `openclaw/plugin-sdk/setup-adapter-runtime` é a interface estreita com suporte a env
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cobre os builders de setup de instalação opcional
  mais alguns primitivos seguros para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se o seu canal oferecer suporte a setup ou autenticação orientados por env e os fluxos genéricos de inicialização/configuração
precisarem conhecer esses nomes de env antes do carregamento do runtime, declare-os no
manifesto do plugin com `channelEnvVars`. Mantenha `envVars` do runtime do canal ou constantes locais
apenas para cópia voltada ao operador.

Se o seu canal puder aparecer em `status`, `channels list`, `channels status` ou
varreduras de SecretRef antes do início do runtime do plugin, adicione `openclaw.setupEntry` em
`package.json`. Esse entrypoint deve ser seguro para importação em caminhos de comando somente leitura
e deve retornar os metadados do canal, o adaptador de configuração seguro para setup, o
adaptador de status e os metadados de destino de segredo do canal necessários para esses resumos. Não
inicie clientes, listeners ou runtimes de transporte a partir da entrada de setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- use a interface mais ampla `openclaw/plugin-sdk/setup` apenas quando você também precisar dos
  helpers compartilhados mais pesados de setup/configuração, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se o seu canal quiser apenas anunciar "instale este plugin primeiro" em
superfícies de setup, prefira `createOptionalChannelSetupSurface(...)`. O
adaptador/assistente gerado falha de forma fechada em gravações de configuração e finalização, e reutiliza
a mesma mensagem de instalação obrigatória em validação, finalização e cópia
de link para docs.

Para outros caminhos quentes do canal, prefira os helpers mais específicos em vez das
superfícies legadas mais amplas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` para configuração multi-conta e
  fallback de conta padrão
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` para rota/envelope de entrada e
  ligação de registrar e despachar
- `openclaw/plugin-sdk/messaging-targets` para análise/correspondência de destinos
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` para carregamento de mídia mais
  delegados de identidade/envio de saída e planejamento de payload
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` quando uma rota de saída deve preservar um
  `replyToId`/`threadId` explícito ou recuperar a sessão `:thread:` atual
  depois que a chave base da sessão ainda corresponder. Plugins de provedor podem substituir
  precedência, comportamento de sufixo e normalização de id de thread quando sua plataforma
  tiver semântica nativa de entrega em thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` para o ciclo de vida de binding
  de thread e registro de adaptador
- `openclaw/plugin-sdk/agent-media-payload` apenas quando ainda for necessário
  um layout legado de campo de payload de agente/mídia
- `openclaw/plugin-sdk/telegram-command-config` para normalização de comandos
  personalizados do Telegram, validação de duplicatas/conflitos e um contrato
  de configuração de comando estável para fallback

Canais somente de autenticação normalmente podem parar no caminho padrão: o core cuida das aprovações e o plugin apenas expõe capacidades de saída/autenticação. Canais com aprovação nativa, como Matrix, Slack, Telegram e transportes de chat personalizados, devem usar os helpers nativos compartilhados em vez de implementar seu próprio ciclo de vida de aprovação.

## Política de menção de entrada

Mantenha o tratamento de menções de entrada dividido em duas camadas:

- coleta de evidências pertencente ao plugin
- avaliação de política compartilhada

Use `openclaw/plugin-sdk/channel-mention-gating` para decisões de política de menção.
Use `openclaw/plugin-sdk/channel-inbound` apenas quando você precisar do barrel
mais amplo de helpers de entrada.

Bom encaixe para lógica local do plugin:

- detecção de resposta ao bot
- detecção de citação do bot
- verificações de participação em thread
- exclusões de mensagens de serviço/sistema
- caches nativos da plataforma necessários para comprovar participação do bot

Bom encaixe para o helper compartilhado:

- `requireMention`
- resultado explícito de menção
- allowlist implícita de menção
- bypass de comando
- decisão final de ignorar

Fluxo preferido:

1. Calcule os fatos locais de menção.
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
plugins de canal empacotados que já dependem de injeção em runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se você precisar apenas de `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importe de
`openclaw/plugin-sdk/channel-mention-gating` para evitar carregar helpers de runtime
de entrada não relacionados.

Os helpers mais antigos `resolveMentionGating*` permanecem em
`openclaw/plugin-sdk/channel-inbound` apenas como exportações de compatibilidade. Código novo
deve usar `resolveInboundMentionDecision({ facts, policy })`.

## Passo a passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacote e manifesto">
    Crie os arquivos padrão do plugin. O campo `channel` em `package.json` é
    o que torna este um plugin de canal. Para toda a superfície de metadados do pacote,
    veja [Setup e Configuração de Plugin](/pt-BR/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Monte o objeto do plugin de canal">
    A interface `ChannelPlugin` tem muitas superfícies de adaptador opcionais. Comece com
    o mínimo — `id` e `setup` — e adicione adaptadores conforme precisar deles.

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
      Em vez de implementar manualmente interfaces de adaptador de baixo nível, você passa
      opções declarativas e o builder as compõe:

      | Opção | O que ela conecta |
      | --- | --- |
      | `security.dm` | Resolvedor de segurança de DM com escopo a partir de campos de configuração |
      | `pairing.text` | Fluxo de pareamento de DM baseado em texto com troca de código |
      | `threading` | Resolvedor de modo reply-to (fixo, com escopo de conta ou personalizado) |
      | `outbound.attachedResults` | Funções de envio que retornam metadados de resultado (ids de mensagem) |

      Você também pode passar objetos de adaptador brutos em vez das opções declarativas
      se precisar de controle total.
    </Accordion>

  </Step>

  <Step title="Conecte o entrypoint">
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
    enquanto carregamentos completos normais ainda capturam os mesmos descritores para o registro real de comandos.
    Mantenha `registerFull(...)` para trabalho somente de runtime.
    Se `registerFull(...)` registrar métodos RPC do gateway, use um
    prefixo específico do plugin. Namespaces de administração do core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre
    resolvem para `operator.admin`.
    `defineChannelPluginEntry` trata automaticamente a divisão do modo de registro. Veja
    [Entrypoints](/pt-BR/plugins/sdk-entrypoints#definechannelpluginentry) para todas as
    opções.

  </Step>

  <Step title="Adicione uma entrada de setup">
    Crie `setup-entry.ts` para carregamento leve durante o onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    O OpenClaw carrega isso em vez da entrada completa quando o canal está desabilitado
    ou não configurado. Isso evita puxar código pesado de runtime durante fluxos de setup.
    Veja [Setup e Configuração](/pt-BR/plugins/sdk-setup#setup-entry) para detalhes.

    Canais empacotados do workspace que dividem exportações seguras para setup em módulos
    auxiliares podem usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` quando também precisarem de um
    setter explícito de runtime em tempo de setup.

  </Step>

  <Step title="Trate mensagens de entrada">
    Seu plugin precisa receber mensagens da plataforma e encaminhá-las para
    o OpenClaw. O padrão típico é um Webhook que verifica a requisição e
    a despacha por meio do handler de entrada do seu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticação gerenciada pelo plugin (verifique as assinaturas você mesmo)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Seu handler de entrada despacha a mensagem para o OpenClaw.
          // A conexão exata depende do SDK da sua plataforma —
          // veja um exemplo real no pacote de plugin empacotado do Microsoft Teams ou do Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      O tratamento de mensagens de entrada é específico do canal. Cada plugin de canal é responsável
      pelo seu próprio pipeline de entrada. Veja plugins de canal empacotados
      (por exemplo, o pacote de plugin do Microsoft Teams ou do Google Chat) para padrões reais.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Teste">
Escreva testes colocalizados em `src/channel.test.ts`:

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
  <Card title="Opções de encadeamento" icon="git-branch" href="/pt-BR/plugins/sdk-entrypoints#registration-mode">
    Modos de resposta fixos, com escopo de conta ou personalizados
  </Card>
  <Card title="Integração com a ferramenta de mensagem" icon="puzzle" href="/pt-BR/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e descoberta de ações
  </Card>
  <Card title="Resolução de destino" icon="crosshair" href="/pt-BR/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, STT, mídia, subagente via api.runtime
  </Card>
</CardGroup>

<Note>
Algumas interfaces auxiliares empacotadas ainda existem para manutenção de plugins
empacotados e compatibilidade. Elas não são o padrão recomendado para novos plugins de canal;
prefira os subcaminhos genéricos de channel/setup/reply/runtime da superfície comum do SDK,
a menos que você esteja mantendo diretamente essa família de plugins empacotados.
</Note>

## Próximos passos

- [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins) — se o seu plugin também fornecer modelos
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência completa de importação de subcaminhos
- [Testes do SDK](/pt-BR/plugins/sdk-testing) — utilitários de teste e testes de contrato
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema completo do manifesto
