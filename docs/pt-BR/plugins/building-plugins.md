---
read_when:
    - Você quer criar um novo Plugin do OpenClaw
    - Você precisa de um guia de início rápido para desenvolvimento de Plugin
    - Você está adicionando um novo canal, provider, tool ou outra capacidade ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro Plugin do OpenClaw em minutos
title: Criando Plugins
x-i18n:
    generated_at: "2026-04-23T05:40:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Criando Plugins

Plugins estendem o OpenClaw com novas capacidades: canais, model providers,
fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração
de imagens, geração de vídeo, busca web, pesquisa na web, agent tools ou qualquer
combinação.

Você não precisa adicionar seu Plugin ao repositório do OpenClaw. Publique no
[ClawHub](/pt-BR/tools/clawhub) ou no npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta primeiro o ClawHub e
usa npm automaticamente como fallback.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para Plugins no repositório: repositório clonado e `pnpm install` executado

## Que tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provider" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um model provider (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de tool / hook" icon="wrench">
    Registre agent tools, hooks de eventos ou serviços — continue abaixo
  </Card>
</CardGroup>

Se um Plugin de canal for opcional e talvez não esteja instalado quando a execução de onboarding/configuração
ocorrer, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par de adaptador + assistente de configuração
que anuncia o requisito de instalação e falha de forma segura em gravações reais de configuração
até que o Plugin seja instalado.

## Início rápido: Plugin de tool

Este passo a passo cria um Plugin mínimo que registra uma agent tool. Plugins de canal
e de provider têm guias dedicados nos links acima.

<Steps>
  <Step title="Crie o pacote e o manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin precisa de um manifest, mesmo sem configuração. Veja
    [Manifest](/pt-BR/plugins/manifest) para o schema completo. Os snippets canônicos de publicação no ClawHub
    ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escreva o ponto de entrada">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` é para Plugins que não são de canal. Para canais, use
    `defineChannelPluginEntry` — veja [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
    Para opções completas de ponto de entrada, veja [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com ClawHub e depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações simples de pacote como
    `@myorg/openclaw-my-plugin`.

    **Plugins no repositório:** coloque sob a árvore de workspace de Plugins empacotados — descoberta automática.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de Plugin

Um único Plugin pode registrar qualquer quantidade de capacidades por meio do objeto `api`:

| Capacidade             | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins)                               |
| Backend de inferência CLI  | `api.registerCliBackend(...)`                    | [Backends de CLI](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens    | `api.registerChannel(...)`                       | [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compreensão de mídia    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagens       | `api.registerImageGenerationProvider(...)`       | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca web              | `api.registerWebFetchProvider(...)`              | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa na web             | `api.registerWebSearchProvider(...)`             | [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extensão embutida do Pi  | `api.registerEmbeddedExtensionFactory(...)`      | [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api)                          |
| Agent tools            | `api.registerTool(...)`                          | Abaixo                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Hooks de eventos            | `api.registerHook(...)`                          | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |
| Rotas HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/pt-BR/plugins/architecture#gateway-http-routes)                          |
| Subcomandos de CLI        | `api.registerCli(...)`                           | [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints)                                        |

Para a API de registro completa, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview#registration-api).

Use `api.registerEmbeddedExtensionFactory(...)` quando um Plugin precisar de
hooks de runner embutido nativos do Pi, como reescrita assíncrona de `tool_result` antes de a mensagem final
de resultado da tool ser emitida. Prefira hooks regulares de Plugin do OpenClaw quando o
trabalho não precisar do timing de extensão do Pi.

Se o seu Plugin registrar métodos RPC personalizados do gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces administrativos do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para
`operator.admin`, mesmo que um Plugin solicite um escopo mais restrito.

Semântica de guard de hook a ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de execução, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.
- `message_received`: prefira o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: prefira os campos tipados de roteamento `replyToId` / `threadId` em vez de chaves de metadata específicas do canal.

O comando `/approve` lida com aprovações de execução e de Plugin com fallback limitado: quando um id de aprovação de execução não é encontrado, o OpenClaw tenta novamente o mesmo id por meio das aprovações de Plugin. O encaminhamento de aprovação de Plugin pode ser configurado independentemente por meio de `approvals.plugin` na configuração.

Se uma infraestrutura personalizada de aprovação precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de corresponder manualmente strings de expiração de aprovação.

Veja [Semântica de decisão de hooks na visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics) para detalhes.

## Registrando agent tools

Tools são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (adesão do usuário):

```typescript
register(api) {
  // Tool obrigatória — sempre disponível
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Tool opcional — o usuário precisa adicionar à allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Os usuários habilitam tools opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nomes de tools não podem conflitar com as tools do core (conflitos são ignorados)
- Use `optional: true` para tools com efeitos colaterais ou requisitos binários extras
- Os usuários podem habilitar todas as tools de um Plugin adicionando o id do Plugin a `tools.allow`

## Convenções de import

Sempre importe de caminhos focados `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errado: raiz monolítica (obsoleta, será removida)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subpaths, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview).

Dentro do seu Plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
imports internos — nunca importe seu próprio Plugin por meio do caminho do SDK.

Para Plugins de provider, mantenha helpers específicos do provider nesses
barrels na raiz do pacote, a menos que a separação seja realmente genérica. Exemplos atuais empacotados:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provider, helpers de modelo padrão, providers em tempo real
- OpenRouter: builder de provider mais helpers de onboarding/configuração

Se um helper só for útil dentro de um pacote empacotado de provider, mantenha-o nessa
separação da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas separações auxiliares geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de Plugins empacotados, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas superfícies como reservadas,
não como o padrão para novos Plugins de terceiros.

## Checklist antes do envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifest **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todos os imports usam caminhos focados `plugin-sdk/<subpath>`</Check>
<Check>Imports internos usam módulos locais, não autoimports do SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugins no repositório)</Check>

## Testes de release beta

1. Acompanhe as tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e assine em `Watch` > `Releases`. Tags beta se parecem com `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu Plugin com a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique na thread do seu Plugin no canal `plugin-forum` do Discord após o teste com `all good` ou com o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread do Discord. Contribuidores não podem aplicar rótulos em PRs, então o título é o sinal do lado do PR para mantenedores e automação. Blockers com um PR são mesclados; blockers sem PR podem ser enviados mesmo assim. Os mantenedores acompanham essas threads durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provider" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de model provider
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de imports e da API de registro
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, search, subagent via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifest do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do schema do manifest
  </Card>
</CardGroup>

## Relacionado

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — análise profunda da arquitetura interna
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência do SDK de Plugin
- [Manifest](/pt-BR/plugins/manifest) — formato do manifest do Plugin
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — criação de Plugins de canal
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — criação de Plugins de provider
