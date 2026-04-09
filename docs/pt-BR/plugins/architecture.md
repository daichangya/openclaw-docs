---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de plugins ou os limites de propriedade
    - Trabalhando no pipeline de carregamento de plugins ou no registro
    - Implementando hooks de runtime de provedores ou plugins de canal
sidebarTitle: Internals
summary: 'Detalhes internos de plugins: modelo de capacidades, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Detalhes internos de plugins
x-i18n:
    generated_at: "2026-04-09T01:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2575791f835990589219bb06d8ca92e16a8c38b317f0bfe50b421682f253ef18
    source_path: plugins/architecture.md
    workflow: 15
---

# Detalhes internos de plugins

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, veja:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelos
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade             | Método de registro                             | Plugins de exemplo                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`             | `openai`, `anthropic`                |
| Voz                    | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Busca web              | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`           | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Um plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão ainda tem
suporte completo.

### Posição de compatibilidade externa

O modelo de capacidades já está integrado ao núcleo e é usado por plugins
nativos/integrados hoje, mas a compatibilidade com plugins externos ainda
precisa de um critério mais rigoroso do que "foi exportado, portanto está
congelado".

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks
  funcionando; trate isso como a linha de base de compatibilidade
- **novos plugins nativos/integrados:** prefira registro explícito de
  capacidades em vez de acessos específicos a fornecedores ou novos designs
  somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate
  superfícies helper específicas de capacidade como evolutivas, a menos que a
  documentação marque explicitamente um contrato como estável

Regra prática:

- APIs de registro de capacidades são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro para evitar quebras em
  plugins externos durante a transição
- nem todos os subcaminhos helper exportados são equivalentes; prefira o
  contrato estreito documentado, não exports helper incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base no seu
comportamento real de registro (não apenas metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por
  exemplo, um plugin somente de provedor como `mistral`)
- **hybrid-capability** -- registra múltiplos tipos de capacidade (por exemplo,
  `openai` controla inferência de texto, voz, entendimento de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem
  capacidades, ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas
  não capacidades

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e o
detalhamento de capacidades. Veja [referência da CLI](/cli/plugins#inspect)
para mais detalhes.

### Hooks legados

O hook `before_agent_start` continua com suporte como caminho de compatibilidade
para plugins somente com hooks. Plugins reais legados ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover apenas depois que o uso real cair e a cobertura de fixtures provar a
  segurança da migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão suportado, mas mais antigo (ex.: `hook-only`) |
| **legacy warning**        | O plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**            | A configuração é inválida ou o plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` só dispara um aviso.
Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados,
   raízes do workspace, raízes globais de extensões e extensões integradas. A
   descoberta lê primeiro manifestos nativos `openclaw.plugin.json` e
   manifestos de bundle compatíveis suportados.
2. **Ativação + validação**
   O núcleo decide se um plugin descoberto está ativado, desativado, bloqueado
   ou selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados no processo via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfícies**
   O restante do OpenClaw lê o registro para expor ferramentas, canais,
   configuração de provedores, hooks, rotas HTTP, comandos da CLI e serviços.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida
em duas fases:

- metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode continuar lazy e registrar na primeira invocação

Isso mantém o código da CLI pertencente ao plugin dentro do próprio plugin,
enquanto ainda permite que o OpenClaw reserve nomes de comando raiz antes do parsing.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de
  **metadados de manifesto/schema** sem executar código do plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite que o OpenClaw valide configuração, explique plugins
ausentes/desativados e construa dicas de UI/schema antes que o runtime completo
esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de
enviar/editar/reagir para ações normais de chat. O OpenClaw mantém uma única
ferramenta compartilhada `message` no núcleo, e os plugins de canal controlam a
descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o núcleo controla o host da ferramenta compartilhada `message`, o wiring de
  prompt, a contabilidade de sessão/thread e o despacho de execução
- plugins de canal controlam descoberta de ações com escopo, descoberta de
  capacidades e quaisquer fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa da sessão específica do
  provedor, como ids de conversa codificam ids de thread ou herdam de
  conversas pai
- plugins de canal executam a ação final por meio do seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada
de descoberta permite que um plugin retorne suas ações visíveis, capacidades e
contribuições de schema juntas, para que essas partes não se desviem entre si.

O núcleo passa o escopo de runtime para essa etapa de descoberta. Campos
importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável de quem solicitou, sem codificar ramificações específicas
de canal na ferramenta `message` do núcleo.

É por isso que mudanças de roteamento do embedded-runner continuam sendo
trabalho de plugin: o runner é responsável por encaminhar a identidade atual do
chat/sessão para o limite de descoberta do plugin, para que a ferramenta
compartilhada `message` exponha a superfície certa, controlada pelo canal, para
o turno atual.

Para helpers de execução controlados pelo canal, plugins integrados devem manter
o runtime de execução dentro dos seus próprios módulos de extensão. O núcleo não
controla mais os runtimes de ação de mensagem do Discord, Slack, Telegram ou
WhatsApp em `src/agents/tools`. Nós não publicamos subcaminhos separados
`plugin-sdk/*-action-runtime`, e plugins integrados devem importar seu próprio
código de runtime local diretamente de seus módulos controlados pela extensão.

O mesmo limite se aplica a seams do SDK nomeadas por provedor em geral: o
núcleo não deve importar barrels convenientes específicos de canal para Slack,
Discord, Signal, WhatsApp ou extensões semelhantes. Se o núcleo precisar de um
comportamento, ele deve consumir o barrel `api.ts` / `runtime-api.ts` do próprio
plugin integrado ou promover a necessidade para uma capacidade genérica e
estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se
  encaixam no modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de
  enquete específica de canal ou parâmetros extras de enquete

Agora o núcleo adia o parsing compartilhado de enquete até que o despacho de
enquete do plugin recuse a ação, para que handlers de enquete controlados por
plugins possam aceitar campos de enquete específicos do canal sem serem
bloqueados primeiro pelo parser genérico de enquetes.

Veja [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um plugin nativo como o limite de propriedade para uma
**empresa** ou uma **funcionalidade**, não como um conjunto de integrações sem
relação.

Isso significa:

- um plugin de empresa normalmente deve controlar todas as superfícies do
  OpenClaw voltadas para aquela empresa
- um plugin de funcionalidade normalmente deve controlar toda a superfície da
  funcionalidade que ele introduz
- canais devem consumir capacidades compartilhadas do núcleo em vez de
  reimplementar comportamento de provedor de forma ad hoc

Exemplos:

- o plugin integrado `openai` controla o comportamento de provedor de modelos da
  OpenAI e também o comportamento OpenAI de voz + voz em tempo real +
  entendimento de mídia + geração de imagem
- o plugin integrado `elevenlabs` controla o comportamento de voz da ElevenLabs
- o plugin integrado `microsoft` controla o comportamento de voz da Microsoft
- o plugin integrado `google` controla o comportamento de provedor de modelos do
  Google mais o comportamento do Google de entendimento de mídia + geração de
  imagem + pesquisa na web
- o plugin integrado `firecrawl` controla o comportamento de busca web do Firecrawl
- os plugins integrados `minimax`, `mistral`, `moonshot` e `zai` controlam seus
  backends de entendimento de mídia
- o plugin `voice-call` é um plugin de funcionalidade: ele controla transporte
  de chamada, ferramentas, CLI, rotas e a ponte de media-stream do Twilio, mas
  consome capacidades compartilhadas de voz + transcrição em tempo real + voz
  em tempo real em vez de importar plugins de fornecedores diretamente

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo se abranger modelos de texto, voz,
  imagens e vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles
  consomem o contrato de capacidade compartilhada exposto pelo núcleo

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do núcleo que múltiplos plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira
pergunta não é "qual provedor deve codificar o tratamento de vídeo?" A primeira
pergunta é "qual é o contrato de capacidade central de vídeo?" Quando esse
contrato existir, plugins de fornecedores poderão se registrar nele e plugins
de canal/funcionalidade poderão consumi-lo.

Se a capacidade ainda não existir, o movimento correto normalmente é:

1. definir a capacidade ausente no núcleo
2. expô-la pela API/runtime de plugins de forma tipada
3. conectar canais/funcionalidades a essa capacidade
4. deixar que plugins de fornecedores registrem implementações

Isso mantém a propriedade explícita ao mesmo tempo que evita comportamento do
núcleo dependente de um único fornecedor ou de um caminho de código pontual e
específico de plugin.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capacidade do núcleo**: orquestração compartilhada, política,
  fallback, regras de mesclagem de configuração, semântica de entrega e
  contratos tipados
- **camada de plugin do fornecedor**: APIs específicas do fornecedor,
  autenticação, catálogos de modelos, síntese de voz, geração de imagem,
  futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/funcionalidade**: integração com
  Slack/Discord/voice-call/etc. que consome capacidades do núcleo e as apresenta
  em uma superfície

Por exemplo, TTS segue este formato:

- o núcleo controla a política de TTS no momento da resposta, ordem de fallback,
  preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o helper de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com múltiplas capacidades

Um plugin de empresa deve parecer coeso por fora. Se o OpenClaw tiver contratos
compartilhados para modelos, voz, transcrição em tempo real, voz em tempo real,
entendimento de mídia, geração de imagem, geração de vídeo, busca web e
pesquisa na web, um fornecedor pode controlar todas as suas superfícies em um
único lugar:

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
      // hooks de auth/catálogo de modelos/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuração de voz do fornecedor — implemente diretamente a interface SpeechProviderPlugin
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
        // lógica de credencial + fetch
      }),
    );
  },
};

export default plugin;
```

O que importa não são os nomes exatos dos helpers. O formato é o que importa:

- um plugin controla a superfície do fornecedor
- o núcleo ainda controla os contratos de capacidade
- canais e plugins de funcionalidade consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar que o plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o núcleo define o contrato de media-understanding
2. plugins de fornecedores registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de funcionalidade consomem o comportamento compartilhado do
   núcleo em vez de se conectar diretamente ao código do fornecedor

Isso evita embutir no núcleo as suposições de vídeo de um provedor específico.
O plugin controla a superfície do fornecedor; o núcleo controla o contrato de
capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o núcleo controla o contrato
tipado de capacidade e o helper de runtime, e plugins de fornecedores registram
implementações `api.registerVideoGenerationProvider(...)` nela.

Precisa de uma checklist concreta de rollout? Veja
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugins é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro suportados e os
helpers de runtime nos quais um plugin pode se apoiar.

Por que isso importa:

- autores de plugins têm um padrão interno estável
- o núcleo pode rejeitar propriedade duplicada, como dois plugins registrando o
  mesmo id de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem aplicar propriedade de plugins integrados e impedir
  desvios silenciosos

Há duas camadas de aplicação:

1. **aplicação de registro em runtime**
   O registro de plugins valida registros à medida que plugins são carregados.
   Exemplos: ids duplicados de provedor, ids duplicados de provedor de voz e
   registros malformados produzem diagnósticos de plugin em vez de comportamento
   indefinido.
2. **testes de contrato**
   Plugins integrados são capturados em registros de contrato durante execuções
   de teste para que o OpenClaw possa afirmar a propriedade explicitamente.
   Hoje isso é usado para provedores de modelos, provedores de voz, provedores
   de pesquisa na web e propriedade de registro integrado.

O efeito prático é que o OpenClaw sabe, desde o início, qual plugin controla
qual superfície. Isso permite que núcleo e canais componham perfeitamente,
porque a propriedade é declarada, tipada e testável em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capacidade
- controlados pelo núcleo
- reutilizáveis por múltiplos plugins
- consumíveis por canais/funcionalidades sem conhecimento do fornecedor

Maus contratos de plugin são:

- política específica de fornecedor escondida no núcleo
- válvulas de escape pontuais de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e,
depois, deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **no processo** com o Gateway. Eles
não são isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de
confiança em nível de processo que o código do núcleo.

Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um plugin nativo pode travar ou desestabilizar o gateway
- um plugin nativo malicioso equivale à execução arbitrária de código dentro do
  processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os
trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa
principalmente Skills integradas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins
não integrados. Trate plugins do workspace como código de tempo de
desenvolvimento, não como padrões de produção.

Para nomes de pacotes de workspace integrados, mantenha o id do plugin ancorado
no nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote expuser intencionalmente um papel de plugin mais restrito.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo id de um plugin integrado intencionalmente
  sombreia a cópia integrada quando esse plugin de workspace está
  ativado/permitido na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha o registro de capacidades público. Remova exports helper fora de contrato:

- subcaminhos helper específicos de plugins integrados
- subcaminhos de plumbing de runtime não destinados a API pública
- helpers convenientes específicos de fornecedor
- helpers de setup/onboarding que são detalhes de implementação

Alguns subcaminhos helper de plugins integrados ainda permanecem no mapa
gerado de exports do SDK por compatibilidade e manutenção de plugins integrados.
Exemplos atuais incluem `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`.
Trate-os como exports reservados de detalhe de implementação, não como o padrão
recomendado de SDK para novos plugins externos.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de plugins candidatas
2. lê manifestos nativos ou de bundles compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração do plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos ativados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro para superfícies de comandos/runtime

<Note>
`activate` é um alias legado para `register` — o loader resolve o que estiver
presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os
plugins integrados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução em runtime. Candidatos são
bloqueados quando a entrada escapa da raiz do plugin, o caminho é gravável por
qualquer usuário, ou a propriedade do caminho parece suspeita para plugins não
integrados.

### Comportamento orientado a manifesto

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele
registra comportamento real, como hooks, ferramentas, comandos ou fluxos de
provedor.

### O que o loader armazena em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifestos
- registros de plugins carregados

Esses caches reduzem inicializações em rajada e a sobrecarga de comandos
repetidos. É seguro pensar neles como caches de desempenho de curta duração,
não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórias do núcleo. Eles
se registram em um registro central de plugins.

O registro acompanha:

- registros de plugins (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores da CLI
- serviços em segundo plano
- comandos controlados por plugins

Os recursos do núcleo então leem esse registro em vez de falar diretamente com
os módulos de plugin. Isso mantém o carregamento em uma única direção:

- módulo do plugin -> registro no registro
- runtime do núcleo -> consumo do registro

Essa separação importa para a manutenção. Ela significa que a maioria das
superfícies do núcleo só precisa de um ponto de integração: "ler o registro",
não "criar caso especial para cada módulo de plugin".

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que
uma solicitação de vinculação é aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Agora existe uma vinculação para este plugin + conversa.
        console.log(event.binding?.conversationId);
        return;
      }

      // A solicitação foi negada; limpe qualquer estado pendente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: a vinculação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desanexação, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para
vincular uma conversa, e é executado depois que o tratamento de aprovação do
núcleo é concluído.

## Hooks de runtime de provedores

Plugins de provedor agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para consulta barata de auth de
  provedor via env antes do carregamento do runtime, `providerAuthAliases` para
  variantes de provedor que compartilham auth, `channelEnvVars` para consulta
  barata de env/setup de canal antes do carregamento do runtime, além de
  `providerAuthChoices` para rótulos baratos de onboarding/escolha de auth e
  metadados de flags da CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / legado `discovery` mais `applyConfigDefaults`
- hooks de runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
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

O OpenClaw ainda controla o loop genérico do agente, failover, tratamento de
transcrições e política de ferramentas. Esses hooks são a superfície de
extensão para comportamento específico de provedor sem precisar de um transporte
de inferência inteiro personalizado.

Use o manifesto `providerAuthEnvVars` quando o provedor tiver credenciais
baseadas em env que caminhos genéricos de auth/status/seletor de modelo
precisem enxergar sem carregar o runtime do plugin. Use o manifesto
`providerAuthAliases` quando um id de provedor precisar reutilizar variáveis de
ambiente, perfis de auth, auth baseada em configuração e a opção de onboarding
de chave de API de outro id de provedor. Use o manifesto `providerAuthChoices`
quando superfícies de onboarding/escolha de auth da CLI precisarem conhecer o id
de escolha do provedor, rótulos de grupo e wiring simples de auth com uma única
flag sem carregar o runtime do provedor. Mantenha o `envVars` do runtime de
provedor para dicas voltadas ao operador, como rótulos de onboarding ou vars de
setup de client-id/client-secret OAuth.

Use o manifesto `channelEnvVars` quando um canal tiver auth ou setup orientado a
env que fallback genérico de shell-env, verificações de config/status ou prompts
de setup precisem enxergar sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica configuração do provedor em `models.providers` durante a geração de `models.json`                     | O provedor controla um catálogo ou padrões de base URL                                                                                    |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração controlados pelo provedor durante a materialização da configuração      | Os padrões dependem do modo de auth, env ou semântica de família de modelos do provedor                                                  |
| --  | _(pesquisa de modelo integrada)_  | O OpenClaw primeiro tenta o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases de model-id legados ou preview antes da pesquisa                                             | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de família de provedores antes da montagem genérica do modelo                     | O provedor controla a limpeza de transporte para ids de provedores personalizados na mesma família de transporte                         |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve viver com o plugin; helpers integrados da família Google também dão suporte a entradas de configuração Google suportadas |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a provedores de configuração                   | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                          |
| 7   | `resolveConfigApiKey`             | Resolve auth baseada em marcador de env para provedores de configuração antes do carregamento de auth em runtime | O provedor tem resolução de chave de API via marcador de env controlada pelo provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador AWS |
| 8   | `resolveSyntheticAuth`            | Expõe auth local/self-hosted ou baseada em configuração sem persistir texto simples                            | O provedor pode operar com um marcador de credencial sintética/local                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de auth externa controlados pelo provedor; o `persistence` padrão é `runtime-only` para credenciais controladas pela CLI/app | O provedor reutiliza credenciais externas de auth sem persistir tokens de refresh copiados                                              |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos armazenados atrás de auth baseada em env/configuração                         | O provedor armazena perfis placeholder sintéticos que não devem ter precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para model ids controlados pelo provedor que ainda não estão no registro local              | O provedor aceita model ids arbitrários do upstream                                                                                       |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono, então `resolveDynamicModel` executa novamente                                          | O provedor precisa de metadados de rede antes de resolver ids desconhecidos                                                               |
| 13  | `normalizeResolvedModel`          | Reescrita final antes que o embedded runner use o modelo resolvido                                             | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                    |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível             | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                       |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provedor e usados pela lógica compartilhada do núcleo   | O provedor precisa de peculiaridades de transcrição/família de provedor                                                                   |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes que o embedded runner os veja                                           | O provedor precisa de limpeza de schema de família de transporte                                                                          |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema controlados pelo provedor após a normalização                                     | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao núcleo                                            |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                    | O provedor precisa de raciocínio marcado/saída final em vez de campos nativos                                                            |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opções de stream                     | O provedor precisa de parâmetros de requisição padrão ou limpeza por provedor                                                             |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                             | O provedor precisa de um protocolo de wire personalizado, não apenas de um wrapper                                                       |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                  | O provedor precisa de wrappers de compatibilidade de headers/corpo/modelo de requisição sem um transporte personalizado                 |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno de transporte                                                     | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de resfriamento de sessão                                       | O provedor quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                           |
| 24  | `formatApiKey`                    | Formatador de perfil de auth: o perfil armazenado vira a string de `apiKey` em runtime                        | O provedor armazena metadados extras de auth e precisa de um formato personalizado de token em runtime                                  |
| 25  | `refreshOAuth`                    | Sobrescrita de refresh OAuth para endpoints personalizados de refresh ou política de falha no refresh          | O provedor não se encaixa nos refreshers compartilhados de `pi-ai`                                                                        |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                                            | O provedor precisa de orientação de reparo de auth controlada pelo provedor após falha de refresh                                       |
| 27  | `matchesContextOverflowError`     | Correspondência controlada pelo provedor para overflow de janela de contexto                                   | O provedor tem erros brutos de overflow que heurísticas genéricas não capturam                                                           |
| 28  | `classifyFailoverReason`          | Classificação do motivo de failover controlada pelo provedor                                                   | O provedor consegue mapear erros brutos de API/transporte para rate-limit/sobrecarga/etc.                                               |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de gating de TTL de cache específico de proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação por auth ausente                                              | O provedor precisa de uma dica de recuperação para auth ausente específica do provedor                                                   |
| 31  | `suppressBuiltInModel`            | Supressão de modelos upstream obsoletos mais dica opcional de erro voltada ao usuário                          | O provedor precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                         |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                          |
| 33  | `isBinaryThinking`                | Alternância de raciocínio ligado/desligado para provedores de binary-thinking                                  | O provedor expõe apenas raciocínio binário ligado/desligado                                                                               |
| 34  | `supportsXHighThinking`           | Suporte a raciocínio `xhigh` para modelos selecionados                                                         | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                                                | O provedor controla a política padrão de `/think` para uma família de modelos                                                            |
| 36  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil live e seleção de smoke                               | O provedor controla a correspondência de modelos preferidos em live/smoke                                                                |
| 37  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                    | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                    |
| 38  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas                      | O provedor precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                  |
| 39  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor depois que a auth é resolvida                 | O provedor precisa de um endpoint de uso específico ou de um parser de payload                                                           |
| 40  | `createEmbeddingProvider`         | Constrói um adaptador de embeddings controlado pelo provedor para memória/pesquisa                             | O comportamento de embedding de memória pertence ao plugin do provedor                                                                    |
| 41  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento da transcrição para o provedor                        | O provedor precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de raciocínio)                          |
| 42  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                         | O provedor precisa de reescritas de replay específicas além dos helpers compartilhados de compactação                                    |
| 43  | `validateReplayTurns`             | Validação final ou remodelagem de turnos de replay antes do embedded runner                                    | O transporte do provedor precisa de validação mais rígida dos turnos após a sanitização genérica                                        |
| 44  | `onModelSelected`                 | Executa efeitos colaterais controlados pelo provedor após a seleção do modelo                                  | O provedor precisa de telemetria ou estado controlado pelo provedor quando um modelo se torna ativo                                      |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam
o plugin de provedor correspondente, depois percorrem outros plugins de provedor
capazes de hooks até que um deles realmente altere o model id ou
transport/config. Isso mantém funcionando shims de alias/compatibilidade de
provedor sem exigir que o chamador saiba qual plugin integrado controla a
reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
compatível da família Google, o normalizador de configuração integrado do Google
ainda aplicará essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de wire totalmente personalizado ou de um
executor de requisição personalizado, essa é uma classe diferente de extensão.
Esses hooks servem para comportamento de provedor que ainda roda no loop normal
de inferência do OpenClaw.

### Exemplo de provedor

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
  e `wrapStreamFn` porque controla compatibilidade futura do Claude 4.6,
  dicas de família de provedor, orientação de reparo de auth, integração com
  endpoint de uso, elegibilidade de cache de prompt, padrões de configuração
  com reconhecimento de auth, política padrão/adaptativa de thinking do Claude
  e modelagem de stream específica do Anthropic para headers beta,
  `/fast` / `serviceTier` e `context1m`.
- Os helpers de stream específicos do Claude da Anthropic ficam por enquanto no
  seam público `api.ts` / `contract-api.ts` do próprio plugin integrado. Essa
  superfície de pacote exporta `wrapAnthropicProviderStream`,
  `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
  `resolveAnthropicServiceTier` e builders de wrapper Anthropic de nível mais
  baixo, em vez de ampliar o SDK genérico em torno das regras de header beta
  de um único provedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e `capabilities`
  mais `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque controla compatibilidade futura do GPT-5.4, a normalização direta
  OpenAI de `openai-completions` -> `openai-responses`, dicas de auth
  conscientes de Codex, supressão do Spark, linhas sintéticas da lista OpenAI e
  política de thinking / modelo live do GPT-5; a família de stream
  `openai-responses-defaults` controla os wrappers compartilhados nativos do
  OpenAI Responses para headers de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex,
  modelagem de payload compatível com reasoning e gerenciamento de contexto do Responses.
- OpenRouter usa `catalog` mais `resolveDynamicModel` e
  `prepareDynamicModel` porque o provedor é pass-through e pode expor novos
  model ids antes de o catálogo estático do OpenClaw ser atualizado; também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter fora do
  núcleo headers de requisição, metadados de roteamento, patches de reasoning e
  política de cache de prompt específicos do provedor. Sua política de replay
  vem da família `passthrough-gemini`, enquanto a família de stream
  `openrouter-thinking` controla a injeção de reasoning em proxy e os skips de
  modelos não suportados / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` mais `prepareRuntimeAuth` e `fetchUsageSnapshot` porque
  precisa de login por dispositivo controlado pelo provedor, comportamento de
  fallback de modelo, peculiaridades de transcrição do Claude, uma troca de
  token GitHub -> token Copilot e um endpoint de uso controlado pelo provedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` mais
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` porque ainda
  roda sobre os transportes centrais da OpenAI, mas controla sua normalização
  de transporte/base URL, política de fallback de refresh OAuth, escolha padrão
  de transporte, linhas sintéticas de catálogo do Codex e integração com o
  endpoint de uso do ChatGPT; ele compartilha a mesma família de stream
  `openai-responses-defaults` da OpenAI direta.
- Google AI Studio e Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` controla fallback de compatibilidade futura
  do Gemini 3.1, validação nativa de replay do Gemini, sanitização de replay de
  bootstrap, modo de saída de raciocínio marcado e correspondência de modelos
  modernos, enquanto a família de stream `google-thinking` controla a
  normalização de payload de thinking do Gemini; Gemini CLI OAuth também usa
  `formatApiKey`, `resolveUsageAuth` e `fetchUsageSnapshot` para formatação de
  token, parsing de token e wiring de endpoint de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da família de replay
  `anthropic-by-model`, para que a limpeza de replay específica do Claude fique
  restrita a ids Claude em vez de todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque controla a
  classificação específica do Bedrock para erros de throttle/not-ready/overflow
  de contexto em tráfego Anthropic-on-Bedrock; sua política de replay ainda
  compartilha o mesmo guard específico de Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini` porque fazem proxy de
  modelos Gemini via transportes compatíveis com OpenAI e precisam de
  sanitização de thought-signature do Gemini sem validação nativa de replay do
  Gemini nem reescritas de bootstrap.
- MiniMax usa `buildReplayPolicy` por meio da família de replay
  `hybrid-anthropic-openai` porque um provedor controla tanto semântica de
  mensagens Anthropic quanto semântica compatível com OpenAI; ele mantém a
  remoção de blocos de thinking apenas do Claude no lado Anthropic, enquanto
  substitui o modo de saída de reasoning de volta para nativo, e a família de
  stream `minimax-fast-mode` controla reescritas de modelo fast-mode no caminho
  de stream compartilhado.
- Moonshot usa `catalog` mais `wrapStreamFn` porque ainda usa o transporte
  compartilhado da OpenAI, mas precisa de normalização de payload de thinking
  controlada pelo provedor; a família de stream `moonshot-thinking` mapeia
  config mais estado `/think` para seu payload nativo binário de thinking.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de headers de requisição controlados pelo
  provedor, normalização de payload de reasoning, dicas de transcrição do
  Gemini e gating de cache-TTL do Anthropic; a família de stream
  `kilocode-thinking` mantém a injeção de thinking do Kilo no caminho de stream
  compartilhado do proxy, enquanto ignora `kilo/auto` e outros ids de modelo
  proxy que não oferecem suporte a payloads explícitos de reasoning.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque controla fallback do GLM-5,
  padrões de `tool_stream`, UX de thinking binário, correspondência de modelos
  modernos e tanto auth de uso quanto busca de cota; a família de stream
  `tool-stream-default-on` mantém o wrapper padrão de `tool_stream` ligado fora
  do glue manuscrito por provedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque controla normalização nativa de transporte xAI Responses, reescritas
  de alias fast-mode do Grok, `tool_stream` padrão, limpeza de strict-tool /
  payload de reasoning, reutilização de auth de fallback para ferramentas
  controladas por plugin, resolução de modelos Grok com compatibilidade futura e
  patches de compatibilidade controlados pelo provedor, como perfil de schema de
  ferramenta do xAI, palavras-chave de schema não suportadas, `web_search`
  nativo e decodificação de argumentos de chamada de ferramenta com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  peculiaridades de transcrição/ferramentas fora do núcleo.
- Provedores integrados somente de catálogo, como `byteplus`,
  `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provedor de texto mais registros compartilhados
  de media-understanding e video-generation para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso porque seu comportamento de
  `/usage` é controlado pelo plugin, embora a inferência ainda execute pelos
  transportes compartilhados.

## Helpers de runtime

Plugins podem acessar helpers selecionados do núcleo por meio de `api.runtime`.
Para TTS:

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

- `textToSpeech` retorna o payload normal de saída TTS do núcleo para
  superfícies de arquivo/mensagem de voz.
- Usa a configuração central `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-a para seletores de voz ou fluxos de setup controlados pelo fornecedor.
- As listagens de vozes podem incluir metadados mais ricos, como localidade,
  gênero e tags de personalidade para seletores conscientes do provedor.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. Microsoft não.

Plugins também podem registrar provedores de voz via `api.registerSpeechProvider(...)`.

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

- Mantenha política de TTS, fallback e entrega de resposta no núcleo.
- Use provedores de voz para comportamento de síntese controlado pelo fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado à empresa: um único plugin de
  fornecedor pode controlar texto, voz, imagem e futuros provedores de mídia à
  medida que o OpenClaw adiciona esses contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um provedor tipado
de media-understanding em vez de um saco genérico chave/valor:

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

- Mantenha orquestração, fallback, config e wiring de canal no núcleo.
- Mantenha o comportamento do fornecedor no plugin do provedor.
- A expansão aditiva deve continuar tipada: novos métodos opcionais, novos
  campos opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo controla o contrato de capacidade e o helper de runtime
  - plugins de fornecedores registram `api.registerVideoGenerationProvider(...)`
  - plugins de funcionalidade/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de media-understanding, plugins podem chamar:

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

Para transcrição de áudio, plugins podem usar o runtime de
media-understanding ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não puder ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  entendimento de imagem/áudio/vídeo.
- Usa a configuração central de áudio de media-understanding (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida
  (por exemplo, entrada ignorada/não suportada).
- `api.runtime.stt.transcribeAudioFile(...)` continua como alias de compatibilidade.

Plugins também podem iniciar execuções de subagentes em segundo plano via `api.runtime.subagent`:

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

- `provider` e `model` são sobrescritas opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de sobrescrita para chamadores confiáveis.
- Para execuções de fallback controladas por plugins, operadores devem aderir explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagentes de plugins não confiáveis continuam funcionando, mas solicitações de sobrescrita são rejeitadas em vez de sofrer fallback silencioso.

Para pesquisa na web, plugins podem consumir o helper de runtime compartilhado
em vez de acessar o wiring da ferramenta do agente:

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

Plugins também podem registrar provedores de pesquisa na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provedor, resolução de credenciais e semântica de
  requisição compartilhada no núcleo.
- Use provedores de pesquisa na web para transportes de busca específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins
  de funcionalidade/canal que precisam de comportamento de pesquisa sem depender
  do wrapper da ferramenta do agente.

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

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagem.
- `listProviders(...)`: lista provedores disponíveis de geração de imagem e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir auth normal do gateway, ou `"plugin"` para auth/verificação de webhook gerenciadas pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas servem para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas a helpers do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` apenas quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com auth de gateway seja implicitamente uma superfície de administrador. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de auth com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk`
ao criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugins.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado a plugins.
- `openclaw/plugin-sdk/config-schema` para o export do schema Zod da raiz
  `openclaw.json` (`OpenClawSchema`).
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
  `openclaw/plugin-sdk/webhook-ingress` para wiring compartilhado de
  setup/auth/resposta/webhook. `channel-inbound` é a casa compartilhada para
  debounce, correspondência de menções, helpers de política de menção de
  entrada, formatação de envelope de entrada e helpers de contexto de envelope
  de entrada.
  `channel-setup` é o seam estreito de setup para instalação opcional.
  `setup-runtime` é a superfície de setup segura para runtime usada por
  `setupEntry` / inicialização adiada, incluindo adaptadores de patch de setup
  seguros para importação.
  `setup-adapter-runtime` é o seam de adaptador de setup de conta sensível a env.
  `setup-tools` é o pequeno seam de helper de CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subcaminhos de domínio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
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
  `openclaw/plugin-sdk/directory-runtime` para helpers compartilhados de runtime/config.
  `telegram-command-config` é o seam público estreito para normalização/validação
  de comandos personalizados do Telegram e continua disponível mesmo se a
  superfície de contrato integrada do Telegram estiver temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/markdown/logging, incluindo
  remoção de texto visível ao assistente, helpers de render/chunking de markdown,
  helpers de redação, helpers de tags de diretiva e utilitários de texto seguro.
- Seams de canal específicas de aprovação devem preferir um único contrato
  `approvalCapability` no plugin. O núcleo então lê auth de aprovação, entrega,
  renderização, roteamento nativo e comportamento lazy de handler nativo por
  meio dessa única capacidade, em vez de misturar comportamento de aprovação em
  campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um
  shim de compatibilidade para plugins mais antigos. Código novo deve importar
  as primitivas genéricas mais estreitas, e o código do repositório não deve
  adicionar novas importações desse shim.
- Detalhes internos de extensões integradas continuam privados. Plugins externos
  devem usar apenas subcaminhos `openclaw/plugin-sdk/*`. Código/testes do núcleo
  do OpenClaw podem usar os pontos de entrada públicos do repositório sob a raiz
  de pacote de um plugin, como `index.js`, `api.js`, `runtime-api.js`,
  `setup-entry.js` e arquivos de escopo estreito, como `login-qr-api.js`.
  Nunca importe `src/*` de um pacote de plugin a partir do núcleo ou de outra extensão.
- Divisão de ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel somente de runtime,
  `<plugin-package-root>/index.js` é a entrada do plugin integrado
  e `<plugin-package-root>/setup-entry.js` é a entrada do plugin de setup.
- Exemplos atuais de provedores integrados:
  - Anthropic usa `api.js` / `contract-api.js` para helpers de stream do Claude,
    como `wrapAnthropicProviderStream`, helpers de headers beta e parsing de
    `service_tier`.
  - OpenAI usa `api.js` para builders de provedor, helpers de modelo padrão e
    builders de provedor em tempo real.
  - OpenRouter usa `api.js` para seu builder de provedor mais helpers de
    onboarding/configuração, enquanto `register.runtime.js` ainda pode reexportar
    helpers genéricos `plugin-sdk/provider-stream` para uso local do repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo de
  configuração em runtime quando ele existe, e então fazem fallback para o
  arquivo de configuração resolvido em disco quando o OpenClaw ainda não está
  servindo um snapshot de runtime.
- Primitivas compartilhadas genéricas continuam sendo o contrato público
  preferido do SDK. Ainda existe um pequeno conjunto reservado de compatibilidade
  de seams helper com marca de canal integrado. Trate-os como seams de
  manutenção/compatibilidade de plugins integrados, não como novos alvos de
  importação de terceiros; novos contratos compartilhados entre canais ainda
  devem ir para subcaminhos genéricos `plugin-sdk/*` ou para os barrels locais
  `api.js` / `runtime-api.js` do plugin.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis mais estreitas. Os subcaminhos mais
  novos de setup/pairing/reply/feedback/contract/inbound/threading/command/
  secret-input/webhook/infra/allowlist/status/message-tool são o contrato
  pretendido para novo trabalho de plugins integrados e externos.
  Parsing/correspondência de alvos pertence a
  `openclaw/plugin-sdk/channel-targets`.
  Gates de ação de mensagem e helpers de id de mensagem de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels helper específicos de extensões integradas não são estáveis por
  padrão. Se um helper só for necessário para uma extensão integrada, mantenha-o
  atrás do seam local `api.js` ou `runtime-api.js` da extensão, em vez de
  promovê-lo para `openclaw/plugin-sdk/<extension>`.
- Novos seams helper compartilhados devem ser genéricos, não com marca de canal.
  Parsing de alvos compartilhado pertence a
  `openclaw/plugin-sdk/channel-targets`; detalhes internos específicos de canal
  ficam atrás do seam local `api.js` ou `runtime-api.js` do plugin proprietário.
- Subcaminhos específicos de capacidade como `image-generation`,
  `media-understanding` e `speech` existem porque plugins nativos/integrados os
  usam hoje. Sua presença, por si só, não significa que todo helper exportado
  seja um contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagem

Plugins devem controlar contribuições de schema específicas do canal em
`describeMessageTool(...)`. Mantenha campos específicos de provedor no plugin,
não no núcleo compartilhado.

Para fragmentos de schema compartilhados e portáveis, reutilize os helpers
genéricos exportados por `openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads de cartão estruturado

Se um formato de schema só fizer sentido para um provedor, defina-o no código
do próprio plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de alvos de canal

Plugins de canal devem controlar semânticas de alvo específicas do canal.
Mantenha o host de saída compartilhado genérico e use a superfície do adaptador
de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado deve ser
  tratado como `direct`, `group` ou `channel` antes da consulta ao diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se
  uma entrada deve ir direto para resolução semelhante a id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando o
  núcleo precisa de uma resolução final controlada pelo provedor após a
  normalização ou após um erro de busca no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção da rota de
  sessão de saída específica do provedor depois que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem ocorrer antes
  da busca por pares/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um id de alvo explícito/nativo".
- Use `resolveTarget` para fallback de normalização específica do provedor, não
  para busca ampla em diretório.
- Mantenha ids nativos do provedor, como chat ids, thread ids, JIDs, handles e
  room ids dentro de valores `target` ou parâmetros específicos do provedor, não
  em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa
lógica no plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para múltiplas entradas de provedor

Use `catalog` quando o plugin controlar model ids específicos do provedor,
padrões de base URL ou metadados de modelo condicionados por auth.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação
aos provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando perfis de auth existem
- `paired`: provedores que sintetizam múltiplas entradas de provedor relacionadas
- `late`: última passagem, depois dos outros provedores implícitos

Provedores posteriores vencem em colisões de chave, então plugins podem
intencionalmente sobrescrever uma entrada de provedor integrada com o mesmo id.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se o seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as
  credenciais estão totalmente materializadas e falhar rapidamente quando
  segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`,
  `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`
  e fluxos de reparo do doctor/config, não devem precisar materializar
  credenciais de runtime apenas para descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credenciais quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar
  disponibilidade em leitura. Retornar `tokenStatus: "available"` (e o campo de
  origem correspondente) é suficiente para comandos de estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via
  SecretRef, mas indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas
indisponível neste caminho de comando" em vez de travar ou relatar
incorretamente a conta como não configurada.

## Pacotes

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

Cada entrada se torna um plugin. Se o pacote listar múltiplas extensões, o id do
plugin se torna `name/<fileBase>`.

Se o seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` fique disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro
do diretório do plugin após a resolução de symlink. Entradas que escapam do
diretório do pacote são rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as
árvores de dependências de plugin como "pure JS/TS" e evite pacotes que exijam
builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de
setup. Quando o OpenClaw precisa de superfícies de setup para um plugin de canal
desativado, ou quando um plugin de canal está ativado, mas ainda não
configurado, ele carrega `setupEntry` em vez da entrada completa do plugin. Isso
mantém inicialização e setup mais leves quando a entrada principal do plugin
também conecta ferramentas, hooks ou outro código somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode optar por um plugin de canal no mesmo caminho `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de
inicialização que precisa existir antes que o gateway comece a escutar. Na
prática, isso significa que a entrada de setup deve registrar toda capacidade
controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir durante essa mesma janela

Se sua entrada completa ainda controlar qualquer capacidade necessária de
inicialização, não ative essa flag. Mantenha o plugin no comportamento padrão e
deixe o OpenClaw carregar a entrada completa durante a inicialização.

Canais integrados também podem publicar helpers de superfície de contrato
somente de setup que o núcleo pode consultar antes que o runtime completo do
canal seja carregado. A superfície atual de promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração de canal
legada de conta única para `channels.<id>.accounts.*` sem carregar a entrada
completa do plugin. Matrix é o exemplo integrado atual: ele move apenas chaves
de auth/bootstrap para uma conta promovida nomeada quando contas nomeadas já
existem, e pode preservar uma chave configurada de conta padrão não canônica em
vez de sempre criar `accounts.default`.

Esses adaptadores de patch de setup mantêm lazy a descoberta de superfície de
contrato integrada. O tempo de importação continua leve; a superfície de
promoção é carregada apenas no primeiro uso, em vez de reentrar na
inicialização do canal integrado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway,
mantenha-os em um prefixo específico do plugin. Namespaces de admin do núcleo
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e
sempre resolvem para `operator.admin`, mesmo que um plugin solicite um escopo
mais estreito.

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

Plugins de canal podem anunciar metadados de setup/descoberta via `openclaw.channel` e
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo
livres no núcleo.

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

- `detailLabel`: rótulo secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: substitui o texto do link para a documentação
- `preferOver`: ids de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de cópia da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal de superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação de documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: habilita o canal para o fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere consulta de sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, um
export de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada
arquivo deve conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto de sessão
para ingestão, montagem e compactação. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e então selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de
contexto em vez de apenas adicionar pesquisa de memória ou hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se o seu mecanismo **não** controlar o algoritmo de compactação, mantenha
`compact()` implementado e delegue-o explicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adicionando uma nova capacidade

Quando um plugin precisar de comportamento que não se encaixe na API atual, não
contorne o sistema de plugins com um acesso privado direto. Adicione a
capacidade ausente.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o núcleo deve controlar: política,
   fallback, mesclagem de configuração, ciclo de vida, semântica voltada para
   canais e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugins
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada
   útil de capacidade.
3. conecte consumidores do núcleo + canal/funcionalidade
   Canais e plugins de funcionalidade devem consumir a nova capacidade por meio
   do núcleo, não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedores
   Plugins de fornecedores então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que propriedade e formato de registro continuem
   explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado para a visão de
mundo de um único provedor. Veja o [Capability Cookbook](/pt-BR/plugins/architecture)
para uma checklist concreta de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar
essas superfícies juntas:

- tipos de contrato central em `src/<capability>/types.ts`
- runner/helper de runtime central em `src/<capability>/runtime.ts`
- superfície de registro da API de plugins em `src/plugins/types.ts`
- wiring do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugins em `src/plugins/runtime/*` quando plugins de funcionalidade/canal precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- afirmações de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação de operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso normalmente é um sinal de que a
capacidade ainda não está totalmente integrada.

### Modelo de capacidade

Padrão mínimo:

```ts
// contrato central
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper de runtime compartilhado para plugins de funcionalidade/canal
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

- o núcleo controla o contrato de capacidade + orquestração
- plugins de fornecedores controlam implementações de fornecedor
- plugins de funcionalidade/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita
