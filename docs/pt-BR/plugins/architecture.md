---
read_when:
    - Compilando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de plugins ou os limites de propriedade
    - Trabalhando no pipeline de carregamento ou no registro de plugins
    - Implementando hooks de runtime de provider ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de plugins: modelo de capacidades, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Internos de plugins
x-i18n:
    generated_at: "2026-04-05T12:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de plugins

<Info>
  Esta é a **referência de arquitetura aprofundada**. Para guias práticos, consulte:
  - [Install and use plugins](/tools/plugin) — guia do usuário
  - [Getting Started](/plugins/building-plugins) — primeiro tutorial de plugin
  - [Channel Plugins](/plugins/sdk-channel-plugins) — compile um canal de mensagens
  - [Provider Plugins](/plugins/sdk-provider-plugins) — compile um provider de modelo
  - [SDK Overview](/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw registra uma ou mais capacidades:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`              | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagens     | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Um plugin que registra zero capacidades, mas fornece hooks, tools ou
services, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.

### Postura de compatibilidade externa

O modelo de capacidades já está incorporado ao core e é usado hoje por
plugins nativos/integrados, mas a compatibilidade para plugins externos ainda
precisa de um critério mais rígido do que “foi exportado, portanto está
congelado”.

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins nativos/integrados:** prefira registro explícito de capacidades em vez de
  integrações específicas de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate as
  superfícies helper específicas de capacidade como em evolução, a menos que a
  documentação marque explicitamente um contrato como estável

Regra prática:

- as APIs de registro de capacidades são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro para evitar quebras em plugins externos durante
  a transição
- nem todos os subcaminhos helper exportados são equivalentes; prefira o
  contrato documentado e estreito, não exports helper incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base no seu
comportamento real de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  plugin somente de provider como `mistral`)
- **hybrid-capability** -- registra múltiplos tipos de capacidade (por exemplo,
  `openai` é dono de inferência de texto, fala, entendimento de mídia e geração
  de imagens)
- **hook-only** -- registra apenas hooks (tipados ou customizados), sem capacidades,
  tools, comandos ou services
- **non-capability** -- registra tools, comandos, services ou rotas, mas sem
  capacidades

Use `openclaw plugins inspect <id>` para ver o formato e a divisão de
capacidades de um plugin. Consulte [CLI reference](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha-o funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de override de modelo/provider
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova apenas depois que o uso real cair e a cobertura de fixtures provar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você poderá ver
um destes rótulos:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, porém mais antigo (ex.: `hook-only`) |
| **legacy warning**         | O plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | A configuração é inválida ou o plugin falhou ao carregar    |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` gera apenas um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes do
   workspace, raízes globais de extensões e extensões integradas. A descoberta lê primeiro
   manifests nativos `openclaw.plugin.json`, além de manifests compatíveis de bundle compatíveis.
2. **Habilitação + validação**
   O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memory.
3. **Carregamento de runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfícies**
   O restante do OpenClaw lê o registro para expor tools, canais, configuração de provider,
   hooks, rotas HTTP, comandos CLI e services.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- os metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode continuar lazy e registrar na primeira invocação

Isso mantém o código de CLI do plugin dentro do plugin, ao mesmo tempo que permite ao OpenClaw
reservar nomes de comando raiz antes do parsing.

O limite importante do design:

- a descoberta + validação de configuração deve funcionar a partir de **metadados de manifest/schema**
  sem executar código do plugin
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite ao OpenClaw validar configuração, explicar plugins ausentes/desabilitados e
compilar dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a tool compartilhada de mensagem

Plugins de canal não precisam registrar uma tool separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única tool compartilhada `message` no core, e
plugins de canal são donos da descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core é dono do host da tool compartilhada `message`, da integração com prompts, do
  controle de sessão/thread e do despacho de execução
- plugins de canal são donos da descoberta de ações com escopo, da descoberta de capacidades e de quaisquer
  fragmentos de schema específicos do canal
- plugins de canal são donos da gramática de conversa específica do provider da sessão, como
  ids de conversa codificam ids de thread ou são herdados de conversas pai
- plugins de canal executam a ação final por meio do seu action adapter

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capacidades e contribuições
de schema juntas, para que essas partes não saiam de sincronia.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis a contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, no room/thread/message atual ou
na identidade confiável do solicitante, sem hardcode de branches específicos do canal na tool
`message` do core.

É por isso que mudanças de roteamento do embedded-runner ainda são trabalho de plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin,
para que a tool compartilhada `message` exponha a superfície correta, pertencente ao canal,
para o turno atual.

Para helpers de execução pertencentes ao canal, plugins integrados devem manter o runtime
de execução dentro dos próprios módulos de extensão. O core não é mais dono dos runtimes
de ação de mensagem de Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins integrados
devem importar seu próprio código de runtime local diretamente de seus
módulos pertencentes à extensão.

O mesmo limite se aplica a seams de SDK nomeadas por provider em geral: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, ele deve consumir o
próprio barrel `api.ts` / `runtime-api.ts` do plugin integrado ou promover a necessidade
para uma capacidade genérica e estreita no SDK compartilhado.

Especificamente para polls, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo
  comum de poll
- `actions.handleAction("poll")` é o caminho preferido para semântica de poll específica do canal
  ou parâmetros extras de poll

Agora o core adia o parsing compartilhado de poll até que o despacho de poll do plugin
recuse a ação, para que handlers de poll pertencentes ao plugin possam aceitar
campos de poll específicos do canal sem serem bloqueados antes pelo parser genérico de poll.

Consulte [Load pipeline](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um
**recurso**, não como um amontoado de integrações não relacionadas.

Isso significa:

- um plugin de empresa geralmente deve ser dono de todas as superfícies voltadas ao OpenClaw dessa empresa
- um plugin de recurso geralmente deve ser dono da superfície completa do recurso que introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar
  comportamento de provider de forma ad hoc

Exemplos:

- o plugin integrado `openai` é dono do comportamento de provider de modelo OpenAI e do comportamento OpenAI
  de fala + voz em tempo real + entendimento de mídia + geração de imagens
- o plugin integrado `elevenlabs` é dono do comportamento de fala do ElevenLabs
- o plugin integrado `microsoft` é dono do comportamento de fala da Microsoft
- o plugin integrado `google` é dono do comportamento de provider de modelo do Google mais Google
  entendimento de mídia + geração de imagens + pesquisa na web
- o plugin integrado `firecrawl` é dono do comportamento de busca web do Firecrawl
- os plugins integrados `minimax`, `mistral`, `moonshot` e `zai` são donos de seus
  backends de entendimento de mídia
- o plugin `voice-call` é um plugin de recurso: ele é dono de transporte de chamadas, tools,
  CLI, rotas e bridging de stream de mídia da Twilio, mas consome capacidades compartilhadas de fala
  mais transcrição em tempo real e voz em tempo real, em vez de importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI fica em um único plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor é dono do provider; eles consomem o
  contrato de capacidade compartilhada exposto pelo core

Essa é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do core que múltiplos plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
“qual provider deve hardcode o tratamento de vídeo?”. A primeira pergunta é “qual é
o contrato central de capacidade de vídeo?”. Uma vez que esse contrato exista, plugins de fornecedor
podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, a ação correta geralmente é:

1. definir a capacidade ausente no core
2. expô-la pela API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. deixar plugins de fornecedor registrarem implementações

Isso mantém a propriedade explícita, ao mesmo tempo que evita comportamento do core que dependa de um
único fornecedor ou de um caminho de código pontual e específico de plugin.

### Camadas de capacidades

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras de merge
  de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas de fornecedor, autenticação, catálogos de modelos, síntese de fala,
  geração de imagens, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração Slack/Discord/voice-call/etc.
  que consome capacidades do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core é dono da política de TTS no momento da resposta, da ordem de fallback, das prefs e da entrega em canal
- `openai`, `elevenlabs` e `microsoft` são donos das implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com múltiplas capacidades

Um plugin de empresa deve parecer coeso do lado de fora. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia,
geração de imagens, geração de vídeo, busca web e pesquisa na web,
um fornecedor pode ser dono de todas as suas superfícies em um único lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

O que importa não é o nome exato dos helpers. O formato importa:

- um plugin é dono da superfície do fornecedor
- o core continua sendo dono dos contratos de capacidade
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código de fornecedor
- testes de contrato podem afirmar que o plugin registrou as capacidades das quais
  afirma ser dono

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica ali:

1. o core define o contrato de entendimento de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectarem diretamente ao código do fornecedor

Isso evita incorporar ao core premissas de vídeo de um único provider. O plugin é dono
da superfície do fornecedor; o core é dono do contrato de capacidade e do comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core é dono do contrato tipado
de capacidade e do helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/tools/capability-cookbook).

## Contratos e imposição

A superfície da API de plugins é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime dos quais um plugin pode depender.

Por que isso importa:

- autores de plugins obtêm um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  id de provider
- a inicialização pode mostrar diagnósticos acionáveis para registros malformados
- testes de contrato podem impor propriedade de plugins integrados e evitar drift silencioso

Há duas camadas de imposição:

1. **imposição de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   ids de provider duplicados, ids de provider de fala duplicados e registros malformados
   produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins integrados são capturados em registros de contrato durante execuções de teste para que o
   OpenClaw possa afirmar a propriedade explicitamente. Hoje isso é usado para model
   providers, speech providers, web search providers e propriedade de registro integrada.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin é dono de qual
superfície. Isso permite que o core e os canais componham sem atrito porque a propriedade é
declarada, tipada e testável em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capacidade
- de propriedade do core
- reutilizáveis por múltiplos plugins
- consumíveis por canais/recursos sem conhecimento de fornecedor

Maus contratos de plugin são:

- política específica de fornecedor escondida no core
- escapatórias pontuais de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e,
depois, deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **in-process** com o Gateway. Eles não
ficam em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível de processo que o código do core.

Implicações:

- um plugin nativo pode registrar tools, handlers de rede, hooks e services
- um bug em plugin nativo pode derrubar ou desestabilizar o gateway
- um plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa, na maior parte,
skills integradas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não integrados. Trate
plugins de workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacote de workspace integrado, mantenha o id do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote expõe intencionalmente uma função de plugin mais estreita.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de plugin**, não na proveniência da origem.
- Um plugin de workspace com o mesmo id de um plugin integrado, intencionalmente, sobrepõe
  a cópia integrada quando esse plugin de workspace está habilitado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniência de implementação.

Mantenha o registro de capacidades público. Reduza exports helper que não são contrato:

- subcaminhos helper específicos de plugin integrado
- subcaminhos de plumbing de runtime que não se destinam a ser API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos helper de plugins integrados ainda permanecem no mapa gerado de exportação do SDK
por compatibilidade e manutenção de plugins integrados. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado do SDK para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifests nativos ou de bundles compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro a comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o loader resolve aquele que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins integrados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução do runtime. Candidatos são bloqueados
quando o entry escapa da raiz do plugin, o caminho é gravável por qualquer usuário ou a propriedade
do caminho parece suspeita para plugins não integrados.

### Comportamento manifest-first

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- complementar labels/placeholders da UI de controle
- mostrar metadados de instalação/catálogo

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, tools, comandos ou fluxos de provider.

### O que o loader armazena em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifest
- registros de plugins carregados

Esses caches reduzem inicializações em rajada e overhead de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não mutam diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de plugin (identidade, origem, status, diagnósticos)
- tools
- hooks legados e hooks tipados
- canais
- providers
- handlers de RPC do gateway
- rotas HTTP
- registradores de CLI
- services em segundo plano
- comandos pertencentes ao plugin

Recursos do core então leem desse registro em vez de conversar diretamente com módulos de plugin.
Isso mantém o carregamento unidirecional:

- módulo de plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Significa que a maior parte das superfícies do core
precisa de apenas um ponto de integração: “ler o registro”, não “tratar cada módulo
de plugin de forma especial”.

## Callbacks de binding de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de bind
for aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: o binding resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de detach, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para busca barata de autenticação por env antes
  do carregamento do runtime, além de `providerAuthChoices` para labels baratas de onboarding/escolha de autenticação
  e metadados de flag da CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / legado `discovery` mais `applyConfigDefaults`
- hooks de runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

O OpenClaw continua sendo dono do loop genérico de agente, failover, tratamento de transcript e
política de tools. Esses hooks são a superfície de extensão para comportamento específico de provider, sem
precisar de um transporte de inferência totalmente customizado.

Use o manifesto `providerAuthEnvVars` quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do plugin.
Use o manifesto `providerAuthChoices` quando superfícies de CLI de onboarding/escolha de autenticação
devam conhecer o id de escolha do provider, labels de grupo e integração simples de autenticação
com uma única flag sem carregar o runtime do provider. Mantenha `envVars` no runtime do provider
para dicas voltadas ao operador, como labels de onboarding ou variáveis de configuração de
client-id/client-secret para OAuth.

### Ordem e uso dos hooks

Para plugins de modelo/provider, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna “When to use” é o guia rápido de decisão.

| #   | Hook                              | What it does                                                                             | When to use                                                                                                                                 |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provider em `models.providers` durante a geração de `models.json` | O provider é dono de um catálogo ou de padrões de base URL                                                                                |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provider durante a materialização da configuração | Os padrões dependem do modo de autenticação, env ou da semântica da família de modelos do provider                                   |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                           | _(não é um hook de plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou preview de model-id antes da busca                           | O provider é dono da limpeza de aliases antes da resolução canônica do modelo                                                             |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo  | O provider é dono da limpeza de transporte para ids de provider customizados na mesma família de transporte                              |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provider                 | O provider precisa de limpeza de configuração que deve ficar com o plugin; helpers integrados da família Google também dão suporte a entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a providers de configuração | O provider precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                          |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para providers de configuração antes do carregamento da autenticação de runtime | O provider tem resolução de API key por marcador de env pertencente ao provider; `amazon-bedrock` também tem aqui um resolvedor integrado para marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou apoiada em configuração sem persistir plaintext   | O provider pode operar com um marcador de credencial sintético/local                                                                      |
| 9   | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos armazenados em perfil atrás de autenticação apoiada em env/configuração | O provider armazena perfis placeholder sintéticos que não devem ganhar precedência                                                       |
| 10  | `resolveDynamicModel`             | Fallback síncrono para model ids pertencentes ao provider que ainda não estão no registro local | O provider aceita model ids arbitrários do upstream                                                                                  |
| 11  | `prepareDynamicModel`             | Warm-up assíncrono; depois `resolveDynamicModel` roda novamente                           | O provider precisa de metadados de rede antes de resolver ids desconhecidos                                                               |
| 12  | `normalizeResolvedModel`          | Reescrita final antes que o embedded runner use o modelo resolvido                        | O provider precisa de reescritas de transporte, mas ainda usa um transporte do core                                                      |
| 13  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível | O provider reconhece seus próprios modelos em transportes proxy sem assumir o provider                                                |
| 14  | `capabilities`                    | Metadados de transcript/tooling pertencentes ao provider usados pela lógica compartilhada do core | O provider precisa de particularidades de transcript/família de provider                                                             |
| 15  | `normalizeToolSchemas`            | Normaliza schemas de tools antes que o embedded runner os veja                            | O provider precisa de limpeza de schema da família de transporte                                                                          |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provider após a normalização                 | O provider quer avisos de keyword sem ensinar ao core regras específicas de provider                                                     |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo versus marcado                           | O provider precisa de saída final/de raciocínio marcada em vez de campos nativos                                                         |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opção de stream   | O provider precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provider                                              |
| 19  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte customizado         | O provider precisa de um protocolo de wire customizado, não apenas de um wrapper                                                         |
| 20  | `wrapStreamFn`                    | Wrapper de stream após a aplicação de wrappers genéricos                                  | O provider precisa de wrappers de compatibilidade de header/body/model sem um transporte customizado                                     |
| 21  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno do transporte                                | O provider quer que transportes genéricos enviem identidade de turno nativa do provider                                                  |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de resfriamento de sessão                  | O provider quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                           |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado vira a string `apiKey` de runtime | O provider armazena metadados extras de autenticação e precisa de um formato customizado de token de runtime                          |
| 24  | `refreshOAuth`                    | Override de refresh OAuth para endpoints customizados de refresh ou política de falha de refresh | O provider não se encaixa nos refreshers compartilhados de `pi-ai`                                                                  |
| 25  | `buildAuthDoctorHint`             | Dica de reparo acrescentada quando o refresh OAuth falha                                  | O provider precisa de orientação de reparo de autenticação pertencente ao provider após falha de refresh                                 |
| 26  | `matchesContextOverflowError`     | Matcher de overflow da janela de contexto pertencente ao provider                         | O provider tem erros brutos de overflow que heurísticas genéricas não detectariam                                                        |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provider                               | O provider pode mapear erros brutos de API/transporte para rate-limit/sobrecarga/etc.                                                   |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para providers proxy/backhaul                                 | O provider precisa de controle de TTL de cache específico de proxy                                                                       |
| 29  | `buildMissingAuthMessage`         | Substitui a mensagem genérica de recuperação por autenticação ausente                     | O provider precisa de uma dica de recuperação específica para autenticação ausente                                                        |
| 30  | `suppressBuiltInModel`            | Supressão de modelo upstream desatualizado mais dica opcional de erro voltada ao usuário  | O provider precisa ocultar linhas upstream desatualizadas ou substituí-las por uma dica do fornecedor                                    |
| 31  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo acrescentadas após a descoberta                      | O provider precisa de linhas sintéticas de forward-compat em `models list` e seletores                                                  |
| 32  | `isBinaryThinking`                | Alternância on/off de raciocínio para providers de pensamento binário                     | O provider expõe apenas pensamento binário ligado/desligado                                                                               |
| 33  | `supportsXHighThinking`           | Suporte a raciocínio `xhigh` para modelos selecionados                                    | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                               |
| 34  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                           | O provider é dono da política padrão de `/think` para uma família de modelos                                                              |
| 35  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil live e seleção de smoke                  | O provider é dono da correspondência preferencial de modelos live/smoke                                                                   |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência | O provider precisa de troca de token ou credencial de requisição de curta duração                                                         |
| 37  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas | O provider precisa de parsing customizado de token de uso/cota ou de uma credencial de uso diferente                                     |
| 38  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provider após a resolução da autenticação | O provider precisa de um endpoint específico de uso ou de um parser específico de payload                                            |
| 39  | `createEmbeddingProvider`         | Cria um adapter de embedding pertencente ao provider para memory/search                   | O comportamento de embedding de memory pertence ao plugin do provider                                                                     |
| 40  | `buildReplayPolicy`               | Retorna uma política de replay controlando o tratamento de transcript para o provider     | O provider precisa de uma política customizada de transcript (por exemplo, remoção de blocos de raciocínio)                              |
| 41  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica de transcript                     | O provider precisa de reescritas específicas de provider no replay além dos helpers compartilhados de compactação                        |
| 42  | `validateReplayTurns`             | Validação ou remodelagem final dos turnos de replay antes do embedded runner              | O transporte do provider precisa de validação mais rígida de turnos após a sanitização genérica                                          |
| 43  | `onModelSelected`                 | Executa efeitos colaterais pertencentes ao provider após a seleção                        | O provider precisa de telemetria ou estado pertencente ao provider quando um modelo se torna ativo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provider correspondente e, em seguida, passam por outros plugins de provider capazes de hook
até que um deles realmente altere o model id ou o transporte/configuração. Isso mantém
funcionando os shims de alias/compatibilidade de provider sem exigir que o chamador saiba qual
plugin integrado é dono da reescrita. Se nenhum hook de provider reescrever uma
entrada compatível da família Google, o normalizador integrado de configuração do Google ainda aplicará
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo de wire totalmente customizado ou de um executor de requisição customizado,
essa é uma classe diferente de extensão. Esses hooks são para comportamento de provider
que ainda roda no loop normal de inferência do OpenClaw.

### Exemplo de provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemplos integrados

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque é dona de forward-compat do Claude 4.6,
  dicas da família de provider, orientação de reparo de autenticação, integração com endpoint de uso,
  elegibilidade de cache de prompt, padrões de configuração com reconhecimento de autenticação, política padrão/adaptativa
  de thinking do Claude e modelagem de stream específica do Anthropic para
  headers beta, `/fast` / `serviceTier` e `context1m`.
- Os helpers de stream específicos do Claude da Anthropic permanecem, por enquanto, no
  seam público `api.ts` / `contract-api.ts` do próprio plugin integrado. Essa superfície
  de pacote exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders
  de wrapper Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das
  regras de header beta de um único provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`,
  porque é dona de forward-compat do GPT-5.4, da normalização direta
  `openai-completions` -> `openai-responses` da OpenAI, de dicas de autenticação com reconhecimento de Codex,
  da supressão de Spark, de linhas sintéticas de lista da OpenAI e da política de thinking /
  modelo live do GPT-5; a família de stream `openai-responses-defaults` é dona dos
  wrappers nativos compartilhados do OpenAI Responses para headers de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex,
  modelagem de payload compatível com reasoning e gerenciamento de contexto de Responses.
- OpenRouter usa `catalog`, além de `resolveDynamicModel` e
  `prepareDynamicModel`, porque o provider é pass-through e pode expor novos
  model ids antes que o catálogo estático do OpenClaw seja atualizado; também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  headers de requisição específicos do provider, metadados de roteamento, patches de reasoning e
  política de cache de prompt fora do core. Sua política de replay vem da
  família `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  é dona da injeção de reasoning do proxy e dos ignores para modelo não suportado / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login de dispositivo pertencente ao provider, comportamento de fallback de modelo, particularidades de transcript do Claude,
  uma troca de token GitHub -> token Copilot e um endpoint de uso pertencente ao provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque ainda
  roda sobre transportes OpenAI do core, mas é dono de sua normalização de
  transporte/base URL, da política de fallback de refresh OAuth, da escolha de transporte padrão,
  de linhas sintéticas de catálogo do Codex e da integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- Google AI Studio e Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef`, porque a
  família de replay `google-gemini` é dona do fallback de forward-compat do Gemini 3.1,
  da validação nativa de replay do Gemini, da sanitização inicial de replay,
  do modo marcado de saída de reasoning e da correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` é dona da normalização de payload de thinking do Gemini;
  o Gemini CLI OAuth também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e integração com endpoint de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica do Claude fique
  limitada a ids de Claude em vez de todos os transportes `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel`, porque é dono da classificação
  específica do Bedrock para erros de throttle/não pronto/overflow de contexto
  no tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção `anthropic-by-model` apenas para Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini`, porque fazem proxy de modelos Gemini
  por transportes compatíveis com OpenAI e precisam de sanitização de signature de pensamento do Gemini
  sem validação nativa de replay do Gemini nem reescritas iniciais.
- MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai`, porque um único provider é dono tanto de semântica
  `anthropic-message` quanto de semântica compatível com OpenAI; ele mantém a remoção de bloco de thinking apenas do Claude
  no lado Anthropic, enquanto sobrescreve o modo de saída de reasoning de volta para nativo, e a
  família de stream `minimax-fast-mode` é dona das reescritas de modelo de modo rápido no caminho de stream compartilhado.
- Moonshot usa `catalog`, além de `wrapStreamFn`, porque ainda usa o transporte
  compartilhado da OpenAI, mas precisa de normalização de payload de thinking pertencente ao provider; a
  família de stream `moonshot-thinking` mapeia configuração mais estado de `/think` para sua
  carga nativa binária de thinking.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible`, porque precisa de headers de requisição pertencentes ao provider,
  normalização de payload de reasoning, dicas de transcript Gemini e controle de TTL de cache Anthropic;
  a família de stream `kilocode-thinking` mantém a injeção de thinking do Kilo
  no caminho de stream proxy compartilhado, ao mesmo tempo que ignora `kilo/auto` e
  outros model ids de proxy que não suportam payload explícito de reasoning.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot`, porque é dona do fallback do GLM-5,
  dos padrões de `tool_stream`, da UX de thinking binário, da correspondência de modelo moderno
  e tanto da autenticação de uso quanto da obtenção de cota; a família de stream `tool-stream-default-on`
  mantém o wrapper padrão-ativado de `tool_stream` fora de glue manuscrita por provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`,
  porque é dona da normalização nativa do transporte xAI Responses, das reescritas de alias de modo rápido do Grok,
  do padrão `tool_stream`, da limpeza estrita de tool / payload de reasoning,
  da reutilização de autenticação de fallback para tools pertencentes ao plugin, da resolução forward-compat de
  modelos Grok e de patches de compatibilidade pertencentes ao provider, como perfil de schema de tool da xAI,
  keywords de schema não compatíveis, `web_search` nativo e decodificação de argumentos de chamada de tool com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  particularidades de transcript/tooling fora do core.
- Providers integrados somente de catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provider de texto, além de registros compartilhados
  de entendimento de mídia e geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog`, além de hooks de uso, porque seu comportamento de `/usage`
  pertence ao plugin, embora a inferência ainda rode pelos transportes compartilhados.

## Helpers de runtime

Plugins podem acessar helpers selecionados do core por meio de `api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Observações:

- `textToSpeech` retorna o payload normal de saída de TTS do core para superfícies de arquivo/mensagem de voz.
- Usa a configuração `messages.tts` do core e a seleção de provider.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer resample/encode para providers.
- `listVoices` é opcional por provider. Use para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores cientes de provider.
- OpenAI e ElevenLabs têm suporte a telefonia hoje. Microsoft não.

Plugins também podem registrar speech providers por meio de `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Observações:

- Mantenha a política de TTS, fallback e entrega de resposta no core.
- Use speech providers para comportamento de síntese pertencente ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o id de provider `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um único plugin de fornecedor pode ser dono de
  providers de texto, fala, imagem e mídia futura à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um único
provider tipado de entendimento de mídia em vez de um pacote genérico de chave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Observações:

- Mantenha orquestração, fallback, configuração e integração de canais no core.
- Mantenha comportamento de fornecedor no plugin do provider.
- A expansão aditiva deve continuar tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é dono do contrato de capacidade e do helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de entendimento de mídia, plugins podem chamar:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Para transcrição de áudio, plugins podem usar o runtime de entendimento de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  entendimento de imagem/áudio/vídeo.
- Usa a configuração de áudio de entendimento de mídia do core (`tools.media.audio`) e a ordem de fallback de provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Plugins também podem iniciar execuções de subagente em segundo plano por meio de `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Observações:

- `provider` e `model` são overrides opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de override para chamadores confiáveis.
- Para execuções de fallback pertencentes ao plugin, operadores devem optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis continuam funcionando, mas solicitações de override são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, plugins podem consumir o helper compartilhado de runtime em vez de
acessar a integração da tool do agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins também podem registrar web-search providers por meio de
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provider, resolução de credenciais e semântica de requisição compartilhada no core.
- Use web-search providers para transportes de pesquisa específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper da tool do agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: gera uma imagem usando a cadeia configurada de providers de geração de imagem.
- `listProviders(...)`: lista providers de geração de imagem disponíveis e suas capacidades.

## Rotas HTTP do Gateway

Plugins podem expor endpoints HTTP com `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos da rota:

- `path`: caminho da rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir a autenticação normal do gateway, ou `"plugin"` para autenticação/validação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas servem para webhooks/validação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de helper do Gateway.
- Rotas `auth: "gateway"` executam dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime das rotas de plugin fixados em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` somente quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições com identidade para rotas de plugin, o escopo de runtime cai para `operator.write`
- Regra prática: não assuma que uma rota de plugin autenticada pelo gateway seja implicitamente uma superfície de admin. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do SDK de plugin

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugin.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado a plugins.
- `openclaw/plugin-sdk/config-schema` para o export do schema Zod raiz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estáveis de canal como `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` e
  `openclaw/plugin-sdk/webhook-ingress` para integração compartilhada de
  configuração/auth/resposta/webhook. `channel-inbound` é o local compartilhado para debounce,
  correspondência de menção, formatação de envelope e helpers de contexto de envelope de entrada.
  `channel-setup` é o seam estreito de configuração opcional de instalação.
  `setup-runtime` é a superfície de configuração segura para runtime usada por `setupEntry` /
  inicialização adiada, incluindo os adapters de patch de configuração seguros para importação.
  `setup-adapter-runtime` é o seam de adapter de configuração de conta sensível a env.
  `setup-tools` é o pequeno seam helper de CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subcaminhos de domínio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` e
  `openclaw/plugin-sdk/directory-runtime` para helpers compartilhados de runtime/configuração.
  `telegram-command-config` é o seam público estreito para normalização/validação de comandos customizados do Telegram e continua disponível mesmo que a superfície de contrato integrada do Telegram esteja temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/markdown/logging, incluindo
  remoção de texto visível ao assistant, helpers de render/chunking de markdown, helpers de redação,
  helpers de directive-tag e utilitários de texto seguro.
- Seams de canal específicas de aprovação devem preferir um único contrato
  `approvalCapability` no plugin. O core então lê auth de aprovação, entrega, render e
  comportamento de roteamento nativo por meio dessa única capacidade em vez de misturar
  comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como
  shim de compatibilidade para plugins antigos. Código novo deve importar as primitivas genéricas mais estreitas, e o código do repositório não deve adicionar novos imports do shim.
- Internos de extensão integrada continuam privados. Plugins externos devem usar apenas subcaminhos `openclaw/plugin-sdk/*`. O código do core/teste do OpenClaw pode usar os entry points públicos do repositório sob a raiz de um pacote de plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo estreito, como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core ou de
  outra extensão.
- Divisão de entry points do repositório:
  `<plugin-package-root>/api.js` é o barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel apenas de runtime,
  `<plugin-package-root>/index.js` é o entry do plugin integrado,
  e `<plugin-package-root>/setup-entry.js` é o entry do plugin de configuração.
- Exemplos atuais de providers integrados:
  - Anthropic usa `api.js` / `contract-api.js` para helpers de stream do Claude, como
    `wrapAnthropicProviderStream`, helpers de beta-header e parsing de `service_tier`.
  - OpenAI usa `api.js` para builders de provider, helpers de modelo padrão e
    builders de provider em tempo real.
  - OpenRouter usa `api.js` para seu builder de provider, além de helpers
    de onboarding/configuração, enquanto `register.runtime.js` ainda pode reexportar helpers genéricos
    `plugin-sdk/provider-stream` para uso local no repositório.
- Entry points públicos carregados por facade preferem o snapshot ativo de configuração de runtime
  quando ele existe e, em seguida, usam como fallback o arquivo de configuração resolvido em disco quando o
  OpenClaw ainda não está servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Um pequeno
  conjunto reservado de compatibilidade de seams helper com marca de canais integrados ainda
  existe. Trate-os como seams de manutenção/compatibilidade integrada, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem ir para subcaminhos genéricos `plugin-sdk/*` ou para os barrels locais `api.js` /
  `runtime-api.js` do plugin.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis mais estreitas. Os subcaminhos mais novos de
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novos trabalhos
  com plugins integrados e externos.
  Parsing/correspondência de alvo pertence a `openclaw/plugin-sdk/channel-targets`.
  Gates de action de mensagem e helpers de message-id de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels helper específicos de extensão integrada não são estáveis por padrão. Se um
  helper for necessário apenas para uma extensão integrada, mantenha-o por trás do
  seam local `api.js` ou `runtime-api.js` da extensão em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novos seams helper compartilhados devem ser genéricos, não com marca de canal. Parsing compartilhado de alvos pertence a `openclaw/plugin-sdk/channel-targets`; internos específicos de canal
  ficam por trás do seam local `api.js` ou `runtime-api.js` do plugin proprietário.
- Subcaminhos específicos de capacidade, como `image-generation`,
  `media-understanding` e `speech`, existem porque plugins nativos/integrados os usam
  hoje. Sua presença não significa, por si só, que todo helper exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da tool de mensagem

Plugins devem ser donos das contribuições de schema específicas de canal em
`describeMessageTool(...)`. Mantenha campos específicos de provider no plugin, não no core compartilhado.

Para fragmentos de schema compartilhados e portáteis, reutilize os helpers genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads de card estruturado

Se um formato de schema fizer sentido apenas para um provider, defina-o no
próprio código-fonte desse plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de target de canal

Plugins de canal devem ser donos da semântica de target específica do canal. Mantenha o host compartilhado
de outbound genérico e use a superfície do messaging adapter para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um target normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular diretamente para resolução do tipo id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final pertencente ao provider após normalização ou
  após falha de busca no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão específica do provider quando um target já foi resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem ocorrer antes
  de buscar peers/grupos.
- Use `looksLikeId` para verificações do tipo “trate isto como um id de target explícito/nativo”.
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  busca ampla no diretório.
- Mantenha ids nativos do provider, como chat ids, thread ids, JIDs, handles e room
  ids, dentro de valores `target` ou parâmetros específicos do provider, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos baseados em configuração, como:

- peers de DM controlados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` tratam apenas operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica de canal e normalização de id devem continuar
na implementação do plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para múltiplas entradas de provider

Use `catalog` quando o plugin for dono de model ids específicos de provider, padrões de base URL ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
providers implícitos integrados do OpenClaw:

- `simple`: providers simples baseados em API key ou env
- `profile`: providers que aparecem quando há perfis de autenticação
- `paired`: providers que sintetizam múltiplas entradas de provider relacionadas
- `late`: última passagem, depois de outros providers implícitos

Providers posteriores vencem em colisão de chave, então plugins podem intencionalmente sobrescrever
uma entrada de provider integrada com o mesmo id de provider.

Compatibilidade:

- `discovery` continua funcionando como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e falhar rapidamente quando segredos necessários estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de
  doctor/reparo de configuração, não devem precisar materializar credenciais de runtime só
  para descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status da credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Não é necessário retornar valores brutos de token apenas para relatar
  disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo
  correspondente de origem) já é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem “configurado, mas indisponível neste caminho
de comando” em vez de falhar ou relatar incorretamente a conta como não configurada.

## Package packs

Um diretório de plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entry se torna um plugin. Se o pack listar múltiplas extensões, o id do plugin
passa a ser `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências do plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependências do plugin “pure JS/TS” e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez do entry completo do plugin. Isso mantém a inicialização e a configuração mais leves
quando o entry principal do plugin também integra tools, hooks ou outro código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode optar por um plugin de canal no mesmo caminho `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir completamente a superfície de inicialização que precisa existir
antes que o gateway comece a escutar. Na prática, isso significa que o setup entry
deve registrar toda capacidade pertencente ao canal da qual a inicialização dependa, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, tools ou services do gateway que precisem existir durante essa mesma janela

Se seu entry completo ainda for dono de alguma capacidade de inicialização necessária, não habilite
essa flag. Mantenha o comportamento padrão do plugin e deixe o OpenClaw carregar o
entry completo durante a inicialização.

Canais integrados também podem publicar helpers de superfície de contrato apenas de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar o entry completo do plugin.
Matrix é o exemplo integrado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar
uma chave de conta padrão configurada e não canônica em vez de sempre criar
`accounts.default`.

Esses adapters de patch de configuração mantêm lazy a descoberta da superfície de contrato integrada. O tempo de importação continua leve; a superfície de promoção é carregada apenas no primeiro uso em vez de reentrar na inicialização do canal integrado no import do módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do gateway, mantenha-as em um
prefixo específico do plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais estreito.

Exemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadados de catálogo de canal

Plugins de canal podem anunciar metadados de configuração/descoberta via `openclaw.channel` e
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo fora do core.

Exemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos úteis de `openclaw.channel` além do exemplo mínimo:

- `detailLabel`: label secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: substitui o texto do link para a documentação
- `preferOver`: ids de plugin/canal de prioridade inferior que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de outbound
- `showConfigured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `quickstartAllowFrom`: habilita o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige binding explícito de conta mesmo quando só existe uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver targets de announce

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, um export de registro MPM).
Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de engine de contexto

Plugins de engine de contexto são donos da orquestração do contexto da sessão para ingestão,
montagem e compactação. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e, em seguida, selecione o engine ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto,
em vez de apenas adicionar busca em memory ou hooks.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se seu engine **não** for dono do algoritmo de compactação, mantenha `compact()`
implementado e delegue explicitamente:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adicionando uma nova capacidade

Quando um plugin precisar de um comportamento que não se encaixa na API atual, não
contorne o sistema de plugins com um alcance privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida de qual comportamento compartilhado o core deve ser dono: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada útil
   de capacidade.
3. conecte consumidores de core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends na capacidade.
5. adicione cobertura de contrato
   Adicione testes para que propriedade e formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw continua opinativo sem ficar hardcoded à visão de mundo
de um único provider. Consulte o [Capability Cookbook](/tools/capability-cookbook)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Ao adicionar uma nova capacidade, a implementação geralmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/helper de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- integração do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

Padrão mínimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Padrão de teste de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Isso mantém a regra simples:

- o core é dono do contrato de capacidade + orquestração
- plugins de fornecedor são donos das implementações do fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita
