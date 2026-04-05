---
read_when:
    - Você quer criar um novo plugin do OpenClaw
    - Você precisa de um início rápido para desenvolvimento de plugins
    - Você está adicionando um novo canal, provedor, ferramenta ou outra capacidade ao OpenClaw
sidebarTitle: Getting Started
summary: Crie seu primeiro plugin do OpenClaw em minutos
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T12:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Plugins estendem o OpenClaw com novas capacidades: canais, provedores de modelo,
fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração
de imagens, geração de vídeo, busca na web, pesquisa na web, ferramentas de agente, ou qualquer
combinação.

Você não precisa adicionar seu plugin ao repositório do OpenClaw. Publique no
[ClawHub](/tools/clawhub) ou no npm, e os usuários instalam com
`openclaw plugins install <package-name>`. O OpenClaw tenta primeiro o ClawHub e
recorre automaticamente ao npm.

## Pré-requisitos

- Node >= 22 e um gerenciador de pacotes (npm ou pnpm)
- Familiaridade com TypeScript (ESM)
- Para plugins no repositório: repositório clonado e `pnpm install` executado

## Que tipo de plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens (Discord, IRC etc.)
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/plugins/sdk-provider-plugins">
    Adicione um provedor de modelo (LLM, proxy ou endpoint personalizado)
  </Card>
  <Card title="Plugin de ferramenta / hook" icon="wrench">
    Registre ferramentas de agente, hooks de evento ou serviços — continue abaixo
  </Card>
</CardGroup>

Se um plugin de canal for opcional e talvez não esteja instalado quando a
integração/configuração for executada, use `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Ele produz um par de adaptador + assistente
de configuração que anuncia o requisito de instalação e falha de forma segura em gravações reais de configuração
até que o plugin esteja instalado.

## Início rápido: plugin de ferramenta

Este passo a passo cria um plugin mínimo que registra uma ferramenta de agente. Plugins de canal
e de provedor têm guias dedicados com links acima.

<Steps>
  <Step title="Crie o pacote e o manifesto">
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

    Todo plugin precisa de um manifesto, mesmo sem configuração. Consulte
    [Manifest](/plugins/manifest) para o esquema completo. Os snippets canônicos de
    publicação no ClawHub ficam em `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` é para plugins que não são de canal. Para canais, use
    `defineChannelPluginEntry` — consulte [Channel Plugins](/plugins/sdk-channel-plugins).
    Para todas as opções de ponto de entrada, consulte [Entry Points](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Teste e publique">

    **Plugins externos:** valide e publique com ClawHub, depois instale:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    O OpenClaw também verifica o ClawHub antes do npm para especificações de pacote simples como
    `@myorg/openclaw-my-plugin`.

    **Plugins no repositório:** coloque-os na árvore de workspace de plugins empacotados — descobertos automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades de plugin

Um único plugin pode registrar qualquer número de capacidades por meio do objeto `api`:

| Capacidade             | Método de registro                              | Guia detalhado                                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferência de texto (LLM) | `api.registerProvider(...)`                  | [Provider Plugins](/plugins/sdk-provider-plugins)                               |
| Backend de inferência de CLI | `api.registerCliBackend(...)`            | [CLI Backends](/pt-BR/gateway/cli-backends)                                           |
| Canal / mensagens      | `api.registerChannel(...)`                      | [Channel Plugins](/plugins/sdk-channel-plugins)                                 |
| Fala (TTS/STT)         | `api.registerSpeechProvider(...)`               | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de imagens     | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Busca na web           | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ferramentas de agente  | `api.registerTool(...)`                         | Abaixo                                                                          |
| Comandos personalizados | `api.registerCommand(...)`                     | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Hooks de evento        | `api.registerHook(...)`                         | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Rotas HTTP             | `api.registerHttpRoute(...)`                    | [Internals](/plugins/architecture#gateway-http-routes)                          |
| Subcomandos de CLI     | `api.registerCli(...)`                          | [Entry Points](/plugins/sdk-entrypoints)                                        |

Para a API de registro completa, consulte [SDK Overview](/plugins/sdk-overview#registration-api).

Se seu plugin registrar métodos RPC personalizados do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos centrais (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para
`operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

Semânticas de guarda de hook para ter em mente:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_tool_call`: `{ block: false }` é tratado como nenhuma decisão.
- `before_tool_call`: `{ requireApproval: true }` pausa a execução do agente e solicita aprovação do usuário por meio da sobreposição de aprovação de execução, botões do Telegram, interações do Discord ou o comando `/approve` em qualquer canal.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `before_install`: `{ block: false }` é tratado como nenhuma decisão.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade mais baixa.
- `message_sending`: `{ cancel: false }` é tratado como nenhuma decisão.

O comando `/approve` lida tanto com aprovações de execução quanto de plugin com fallback limitado: quando um id de aprovação de execução não é encontrado, o OpenClaw tenta novamente o mesmo id por meio das aprovações de plugin. O encaminhamento de aprovações de plugin pode ser configurado de forma independente via `approvals.plugin` na configuração.

Se uma infraestrutura de aprovação personalizada precisar detectar esse mesmo caso de fallback limitado,
prefira `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
em vez de corresponder manualmente a strings de expiração de aprovação.

Consulte [SDK Overview hook decision semantics](/plugins/sdk-overview#hook-decision-semantics) para detalhes.

## Registrando ferramentas de agente

Ferramentas são funções tipadas que o LLM pode chamar. Elas podem ser obrigatórias (sempre
disponíveis) ou opcionais (adesão do usuário):

```typescript
register(api) {
  // Ferramenta obrigatória — sempre disponível
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Ferramenta opcional — o usuário deve adicioná-la à allowlist
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

Os usuários habilitam ferramentas opcionais na configuração:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Os nomes das ferramentas não devem conflitar com ferramentas centrais (conflitos são ignorados)
- Use `optional: true` para ferramentas com efeitos colaterais ou requisitos binários extras
- Os usuários podem habilitar todas as ferramentas de um plugin adicionando o id do plugin a `tools.allow`

## Convenções de importação

Sempre importe de caminhos específicos `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Errado: raiz monolítica (obsoleta, será removida)
import { ... } from "openclaw/plugin-sdk";
```

Para a referência completa de subcaminhos, consulte [SDK Overview](/plugins/sdk-overview).

Dentro do seu plugin, use arquivos barrel locais (`api.ts`, `runtime-api.ts`) para
importações internas — nunca importe seu próprio plugin pelo caminho do SDK.

Para plugins de provedor, mantenha helpers específicos do provedor nesses barrels
da raiz do pacote, a menos que a separação seja realmente genérica. Exemplos empacotados atuais:

- Anthropic: wrappers de stream do Claude e helpers de `service_tier` / beta
- OpenAI: builders de provedor, helpers de modelo padrão, provedores em tempo real
- OpenRouter: builder de provedor mais helpers de onboarding/configuração

Se um helper só for útil dentro de um pacote de provedor empacotado, mantenha-o nessa
separação da raiz do pacote em vez de promovê-lo para `openclaw/plugin-sdk/*`.

Algumas separações auxiliares geradas `openclaw/plugin-sdk/<bundled-id>` ainda existem para
manutenção e compatibilidade de plugins empacotados, por exemplo
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Trate essas superfícies como reservadas,
não como o padrão para novos plugins de terceiros.

## Checklist antes do envio

<Check>**package.json** tem os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos específicos `plugin-sdk/<subpath>`</Check>
<Check>Importações internas usam módulos locais, não autoimportações pelo SDK</Check>
<Check>Os testes passam (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins no repositório)</Check>

## Testes de versão beta

1. Fique de olho nas tags de release do GitHub em [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e inscreva-se via `Watch` > `Releases`. As tags beta têm aparência como `v2026.3.N-beta.1`. Você também pode ativar notificações para a conta oficial do OpenClaw no X [@openclaw](https://x.com/openclaw) para anúncios de release.
2. Teste seu plugin com a tag beta assim que ela aparecer. A janela antes da versão estável normalmente é de apenas algumas horas.
3. Publique na thread do seu plugin no canal `plugin-forum` do Discord após o teste com `all good` ou informando o que quebrou. Se você ainda não tiver uma thread, crie uma.
4. Se algo quebrar, abra ou atualize uma issue intitulada `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Coloque o link da issue na sua thread.
5. Abra um PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e vincule a issue tanto no PR quanto na sua thread no Discord. Colaboradores não podem rotular PRs, então o título é o sinal do lado do PR para mantenedores e automação. Bloqueadores com PR são mesclados; bloqueadores sem PR podem ser enviados mesmo assim. Mantenedores acompanham essas threads durante os testes beta.
6. Silêncio significa verde. Se você perder a janela, sua correção provavelmente entrará no próximo ciclo.

## Próximos passos

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelo
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/plugins/sdk-runtime">
    TTS, search, subagent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    Referência completa do esquema de manifesto
  </Card>
</CardGroup>

## Relacionado

- [Plugin Architecture](/plugins/architecture) — análise detalhada da arquitetura interna
- [SDK Overview](/plugins/sdk-overview) — referência do Plugin SDK
- [Manifest](/plugins/manifest) — formato do manifesto de plugin
- [Channel Plugins](/plugins/sdk-channel-plugins) — criação de plugins de canal
- [Provider Plugins](/plugins/sdk-provider-plugins) — criação de plugins de provedor
