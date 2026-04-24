---
read_when:
    - Você precisa saber de qual subcaminho do SDK importar
    - Você quer uma referência de todos os métodos de registro em OpenClawPluginApi
    - Você está procurando uma exportação específica do SDK
sidebarTitle: SDK overview
summary: Mapa de importação, referência da API de registro e arquitetura do SDK
title: Visão geral do SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

O SDK de Plugin é o contrato tipado entre Plugins e o núcleo. Esta página é a
referência de **o que importar** e **o que você pode registrar**.

<Tip>
  Procurando um guia prático em vez disso?

- Primeiro Plugin? Comece com [Criando Plugins](/pt-BR/plugins/building-plugins).
- Plugin de canal? Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
- Plugin de provedor? Consulte [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins).
  </Tip>

## Convenção de importação

Sempre importe de um subcaminho específico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Cada subcaminho é um módulo pequeno e autocontido. Isso mantém a inicialização rápida e
evita problemas de dependência circular. Para helpers de entrada/build específicos de canal,
prefira `openclaw/plugin-sdk/channel-core`; mantenha `openclaw/plugin-sdk/core` para
a superfície mais ampla e helpers compartilhados, como
`buildChannelConfigSchema`.

<Warning>
  Não importe pontos de conveniência marcados por provedor ou canal (por exemplo
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugins incluídos no pacote compõem subcaminhos genéricos do SDK dentro de seus próprios barrels
  `api.ts` / `runtime-api.ts`; consumidores do núcleo devem usar esses
  barrels locais do Plugin ou adicionar um contrato genérico e restrito do SDK quando a necessidade for realmente
  entre canais.

Um pequeno conjunto de seams auxiliares de Plugins incluídos no pacote (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` e similares) ainda aparece no
mapa de exportação gerado. Eles existem apenas para manutenção de Plugins incluídos no pacote e
não são caminhos de importação recomendados para novos Plugins de terceiros.
</Warning>

## Referência de subcaminhos

O SDK de Plugin é exposto como um conjunto de subcaminhos restritos agrupados por área (entrada de Plugin,
canal, provedor, auth, runtime, capability, memória e helpers reservados para
Plugins incluídos no pacote). Para o catálogo completo — agrupado e com links — consulte
[Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).

A lista gerada de mais de 200 subcaminhos fica em `scripts/lib/plugin-sdk-entrypoints.json`.

## API de registro

O callback `register(api)` recebe um objeto `OpenClawPluginApi` com estes
métodos:

### Registro de capability

| Método                                           | O que ele registra                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferência de texto (LLM)             |
| `api.registerAgentHarness(...)`                  | Executor experimental de agente de baixo nível |
| `api.registerCliBackend(...)`                    | Backend local de inferência da CLI    |
| `api.registerChannel(...)`                       | Canal de mensagens                    |
| `api.registerSpeechProvider(...)`                | Síntese de texto para fala / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcrição em tempo real por streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessões duplex de voz em tempo real   |
| `api.registerMediaUnderstandingProvider(...)`    | Análise de imagem/áudio/vídeo         |
| `api.registerImageGenerationProvider(...)`       | Geração de imagem                     |
| `api.registerMusicGenerationProvider(...)`       | Geração de música                     |
| `api.registerVideoGenerationProvider(...)`       | Geração de vídeo                      |
| `api.registerWebFetchProvider(...)`              | Provedor de busca/scrape web          |
| `api.registerWebSearchProvider(...)`             | Busca web                             |

### Ferramentas e comandos

| Método                          | O que ele registra                            |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Ferramenta do agente (obrigatória ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizado (ignora o LLM)         |

### Infraestrutura

| Método                                          | O que ele registra                      |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook de evento                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP do Gateway                |
| `api.registerGatewayMethod(name, handler)`      | Método RPC do Gateway                   |
| `api.registerGatewayDiscoveryService(service)`  | Anunciante de descoberta local do Gateway |
| `api.registerCli(registrar, opts?)`             | Subcomando da CLI                       |
| `api.registerService(service)`                  | Serviço em segundo plano                |
| `api.registerInteractiveHandler(registration)`  | Handler interativo                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Fábrica de extensão de executor embutido do Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Seção adicional de prompt adjacente à memória |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus adicional de busca/leitura de memória |

<Note>
  Namespaces administrativos reservados do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) sempre permanecem `operator.admin`, mesmo que um Plugin tente atribuir um
  escopo mais restrito a um método do gateway. Prefira prefixos específicos do Plugin para
  métodos pertencentes ao Plugin.
</Note>

<Accordion title="Quando usar registerEmbeddedExtensionFactory">
  Use `api.registerEmbeddedExtensionFactory(...)` quando um Plugin precisar de
  timing de evento nativo do Pi durante execuções embutidas do OpenClaw — por exemplo
  regravações assíncronas de `tool_result` que precisam acontecer antes da emissão
  da mensagem final de resultado de ferramenta.

Hoje esse é um seam de Plugin incluído no pacote: apenas Plugins incluídos no pacote podem registrar um,
e eles devem declarar `contracts.embeddedExtensionFactories: ["pi"]` em
`openclaw.plugin.json`. Mantenha hooks normais de Plugin do OpenClaw para tudo o que
não exigir esse seam mais baixo nível.
</Accordion>

### Registro de descoberta do Gateway

`api.registerGatewayDiscoveryService(...)` permite que um Plugin anuncie o
Gateway ativo em um transporte de descoberta local como mDNS/Bonjour. O OpenClaw chama o
serviço durante a inicialização do Gateway quando a descoberta local está ativada, passa as
portas atuais do Gateway e dados de dica TXT não secretos, e chama o
handler `stop` retornado durante o desligamento do Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugins de descoberta do Gateway não devem tratar valores TXT anunciados como segredos nem
auth. Descoberta é uma dica de roteamento; auth do Gateway e pinagem de TLS continuam
responsáveis pela confiança.

### Metadados de registro da CLI

`api.registerCli(registrar, opts?)` aceita dois tipos de metadados de nível superior:

- `commands`: raízes explícitas de comando pertencentes ao registrador
- `descriptors`: descritores de comando em tempo de parsing usados para ajuda da CLI raiz,
  roteamento e registro lazy da CLI do Plugin

Se você quiser que um comando de Plugin permaneça com lazy-load no caminho normal da CLI raiz,
forneça `descriptors` que cubram toda raiz de comando de nível superior exposta por esse
registrador.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gerencie contas, verificação, dispositivos e estado de perfil do Matrix",
        hasSubcommands: true,
      },
    ],
  },
);
```

Use `commands` sozinho apenas quando você não precisar de registro lazy na CLI raiz.
Esse caminho de compatibilidade eager continua com suporte, mas ele não instala
placeholders baseados em descritores para lazy loading em tempo de parsing.

### Registro de backend da CLI

`api.registerCliBackend(...)` permite que um Plugin controle a configuração padrão de um
backend local de CLI de IA, como `codex-cli`.

- O `id` do backend se torna o prefixo do provedor em referências de modelo como `codex-cli/gpt-5`.
- A `config` do backend usa o mesmo formato de `agents.defaults.cliBackends.<id>`.
- A configuração do usuário continua tendo prioridade. O OpenClaw mescla `agents.defaults.cliBackends.<id>` sobre o
  padrão do Plugin antes de executar a CLI.
- Use `normalizeConfig` quando um backend precisar de regravações de compatibilidade após a mesclagem
  (por exemplo, normalizar formatos antigos de flags).

### Slots exclusivos

| Método                                     | O que ele registra                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mecanismo de contexto (um ativo por vez). O callback `assemble()` recebe `availableTools` e `citationsMode` para que o mecanismo possa adaptar adições ao prompt. |
| `api.registerMemoryCapability(capability)` | Capability unificada de memória                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder de seção de prompt de memória                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver de plano de flush de memória                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptador de runtime de memória                                                                                                                           |

### Adaptadores de embedding de memória

| Método                                         | O que ele registra                             |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptador de embedding de memória para o Plugin ativo |

- `registerMemoryCapability` é a API exclusiva preferida para Plugins de memória.
- `registerMemoryCapability` também pode expor `publicArtifacts.listArtifacts(...)`
  para que Plugins complementares possam consumir artefatos de memória exportados por meio de
  `openclaw/plugin-sdk/memory-host-core` em vez de acessar o layout privado de um
  Plugin de memória específico.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` são APIs exclusivas compatíveis com legados para Plugins de memória.
- `registerMemoryEmbeddingProvider` permite que o Plugin de memória ativo registre um
  ou mais ids de adaptador de embedding (por exemplo `openai`, `gemini` ou um id personalizado
  definido pelo Plugin).
- Configurações do usuário, como `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback`, são resolvidas em relação a esses ids de
  adaptador registrados.

### Eventos e ciclo de vida

| Método                                       | O que ele faz                 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook tipado de ciclo de vida  |
| `api.onConversationBindingResolved(handler)` | Callback de vínculo de conversa |

### Semântica de decisão de hook

- `before_tool_call`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `before_install`: retornar `{ block: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa são ignorados.
- `before_install`: retornar `{ block: false }` é tratado como nenhuma decisão (igual a omitir `block`), não como substituição.
- `reply_dispatch`: retornar `{ handled: true, ... }` é terminal. Assim que qualquer handler assumir o dispatch, handlers de prioridade mais baixa e o caminho padrão de dispatch do modelo são ignorados.
- `message_sending`: retornar `{ cancel: true }` é terminal. Assim que qualquer handler definir isso, handlers de prioridade mais baixa são ignorados.
- `message_sending`: retornar `{ cancel: false }` é tratado como nenhuma decisão (igual a omitir `cancel`), não como substituição.
- `message_received`: use o campo tipado `threadId` quando precisar de roteamento de thread/tópico de entrada. Mantenha `metadata` para extras específicos do canal.
- `message_sending`: use os campos tipados de roteamento `replyToId` / `threadId` antes de recorrer a `metadata` específica do canal.
- `gateway_start`: use `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` para estado de inicialização pertencente ao gateway, em vez de depender de hooks internos `gateway:startup`.

### Campos do objeto da API

| Campo                    | Tipo                      | Descrição                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id do Plugin                                                                               |
| `api.name`               | `string`                  | Nome de exibição                                                                           |
| `api.version`            | `string?`                 | Versão do Plugin (opcional)                                                                |
| `api.description`        | `string?`                 | Descrição do Plugin (opcional)                                                             |
| `api.source`             | `string`                  | Caminho de origem do Plugin                                                                |
| `api.rootDir`            | `string?`                 | Diretório raiz do Plugin (opcional)                                                        |
| `api.config`             | `OpenClawConfig`          | Snapshot atual da configuração (snapshot ativo do runtime em memória quando disponível)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuração específica do Plugin em `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/pt-BR/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Logger com escopo (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carregamento atual; `"setup-runtime"` é a janela leve de inicialização/configuração antes da entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resolve caminho relativo à raiz do Plugin                                                  |

## Convenção de módulo interno

Dentro do seu Plugin, use arquivos barrel locais para importações internas:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nunca importe seu próprio Plugin por `openclaw/plugin-sdk/<your-plugin>`
  em código de produção. Encaminhe importações internas por `./api.ts` ou
  `./runtime-api.ts`. O caminho do SDK é apenas o contrato externo.
</Warning>

Superfícies públicas de Plugins incluídos no pacote carregadas por facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e arquivos públicos de entrada semelhantes) preferem o
snapshot ativo de configuração do runtime quando o OpenClaw já está em execução. Se ainda não existir
snapshot de runtime, elas usam como fallback o arquivo de configuração resolvido em disco.

Plugins de provedor podem expor um barrel de contrato local e restrito do Plugin quando um
helper for intencionalmente específico do provedor e ainda não pertencer a um subcaminho genérico do SDK.
Exemplos incluídos no pacote:

- **Anthropic**: seam público `api.ts` / `contract-api.ts` para helpers de
  cabeçalho beta do Claude e stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exporta builders de provedor,
  helpers de modelo padrão e builders de provedor realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` exporta o builder do provedor
  mais helpers de onboarding/configuração.

<Warning>
  Código de produção de extensões também deve evitar importações `openclaw/plugin-sdk/<other-plugin>`.
  Se um helper for realmente compartilhado, promova-o para um subcaminho neutro do SDK,
  como `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou outra
  superfície orientada a capability, em vez de acoplar dois Plugins.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Pontos de entrada" icon="door-open" href="/pt-BR/plugins/sdk-entrypoints">
    Opções de `definePluginEntry` e `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers de runtime" icon="gears" href="/pt-BR/plugins/sdk-runtime">
    Referência completa do namespace `api.runtime`.
  </Card>
  <Card title="Configuração e setup" icon="sliders" href="/pt-BR/plugins/sdk-setup">
    Empacotamento, manifestos e schemas de configuração.
  </Card>
  <Card title="Testes" icon="vial" href="/pt-BR/plugins/sdk-testing">
    Utilitários de teste e regras de lint.
  </Card>
  <Card title="Migração do SDK" icon="arrows-turn-right" href="/pt-BR/plugins/sdk-migration">
    Migração a partir de superfícies obsoletas.
  </Card>
  <Card title="Internals de Plugin" icon="diagram-project" href="/pt-BR/plugins/architecture">
    Arquitetura detalhada e modelo de capability.
  </Card>
</CardGroup>
