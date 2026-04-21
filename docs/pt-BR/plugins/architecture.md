---
read_when:
    - Criando ou depurando Plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de Plugin ou limites de propriedade
    - Trabalhando no pipeline de carregamento ou no registro de Plugin
    - Implementando hooks de runtime de provedor ou Plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-21T05:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38b763841ae27137c2f2d080a3cb17ca11ee20e60dd2a95b4d6bed7dcb75e2ae
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de Plugin

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, veja:
  - [Install and use plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Getting Started](/pt-BR/plugins/building-plugins) — primeiro tutorial de Plugin
  - [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelos
  - [SDK Overview](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de Plugins do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **Plugin nativo** dentro do OpenClaw. Todo
Plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade             | Método de registro                              | Plugins de exemplo                   |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`              | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca na web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Um Plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um Plugin **legado apenas com hooks**. Esse padrão ainda é totalmente suportado.

### Posição de compatibilidade externa

O modelo de capacidades já está incorporado no núcleo e é usado hoje por
Plugins empacotados/nativos, mas a compatibilidade com Plugins externos ainda
precisa de um critério mais rígido do que “está exportado, portanto está congelado”.

Orientação atual:

- **Plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a base de compatibilidade
- **novos Plugins empacotados/nativos:** prefira registro explícito de capacidades em vez de
  acessos específicos por fornecedor ou novos designs apenas com hooks
- **Plugins externos adotando registro de capacidades:** permitido, mas trate as
  superfícies auxiliares específicas de capacidade como evolutivas, a menos que a documentação marque explicitamente um
  contrato como estável

Regra prática:

- APIs de registro de capacidade são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro para evitar quebra de compatibilidade para Plugins externos durante
  a transição
- nem todos os subcaminhos auxiliares exportados são iguais; prefira o contrato
  documentado e estreito, não exports auxiliares incidentais

### Formas de Plugin

O OpenClaw classifica todo Plugin carregado em uma forma com base no seu comportamento real
de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  Plugin apenas de provedor como `mistral`)
- **hybrid-capability** -- registra vários tipos de capacidade (por exemplo,
  `openai` é dono de inferência de texto, fala, entendimento de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem
  capacidades, ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas sem
  capacidades

Use `openclaw plugins inspect <id>` para ver a forma de um Plugin e o detalhamento
de capacidades. Veja [CLI reference](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua suportado como caminho de compatibilidade para
Plugins apenas com hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de sobrescrita de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- removê-lo apenas depois que o uso real cair e a cobertura de fixtures comprovar segurança de migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os Plugins são resolvidos |
| **compatibility advisory** | O Plugin usa um padrão suportado, porém mais antigo (ex.: `hook-only`) |
| **legacy warning**         | O Plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**             | A configuração é inválida ou o Plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` quebrarão seu Plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` só dispara um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugins do OpenClaw tem quatro camadas:

1. **Manifest + descoberta**
   O OpenClaw encontra Plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de extensões e extensões empacotadas. A descoberta lê primeiro
   manifests nativos `openclaw.plugin.json`, além de manifests de bundles suportados.
2. **Habilitação + validação**
   O núcleo decide se um Plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de provedor, hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de Plugin, a descoberta de comandos raiz é dividida em duas fases:

- metadados de tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do Plugin pode continuar lazy e se registrar na primeira invocação

Isso mantém o código de CLI do Plugin dentro do Plugin, ao mesmo tempo em que ainda permite ao OpenClaw
reservar nomes de comando raiz antes do parsing.

O limite importante de design:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifest/schema**
  sem executar código do Plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do Plugin

Essa divisão permite ao OpenClaw validar configuração, explicar Plugins ausentes/desabilitados e
construir dicas de UI/schema antes de o runtime completo estar ativo.

### Plugins de canal e a ferramenta `message` compartilhada

Plugins de canal não precisam registrar uma ferramenta separada de envio/edição/reação para
ações normais de chat. O OpenClaw mantém uma única ferramenta `message` compartilhada no núcleo, e
Plugins de canal são donos da descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o núcleo é dono do host da ferramenta `message` compartilhada, integração no prompt, registro de
  sessão/thread e despacho de execução
- Plugins de canal são donos da descoberta de ações por escopo, descoberta de capacidades
  e quaisquer fragmentos de schema específicos do canal
- Plugins de canal são donos da gramática de conversa de sessão específica do provedor, como
  ids de conversa codificam ids de thread ou herdam de conversas pai
- Plugins de canal executam a ação final por meio de seu adaptador de ação

Para Plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um Plugin retorne suas ações visíveis, capacidades e contribuições de schema
juntas, para que essas partes não se desalinhem.

Quando um parâmetro da ferramenta `message` específico do canal carrega uma fonte de mídia, como um
caminho local ou URL remota de mídia, o Plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O núcleo usa essa lista explícita
para aplicar normalização de caminhos no sandbox e dicas de acesso a mídia de saída
sem codificar de forma fixa nomes de parâmetros que pertencem ao Plugin.
Prefira mapas por escopo de ação ali, não uma lista plana para o canal inteiro, para que um
parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas como
`send`.

O núcleo passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável de entrada

Isso importa para Plugins sensíveis a contexto. Um canal pode ocultar ou expor
ações de `message` com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante, sem codificar ramificações específicas de canal na
ferramenta central `message`.

É por isso que mudanças de roteamento de executor incorporado ainda são trabalho do Plugin: o executor
é responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do Plugin, para que a ferramenta `message` compartilhada exponha a superfície certa de propriedade do canal
para o turno atual.

Para auxiliares de execução pertencentes ao canal, Plugins empacotados devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O núcleo não é mais dono dos runtimes de ação de mensagem de Discord,
Slack, Telegram ou WhatsApp em `src/agents/tools`.
Nós não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e Plugins empacotados
devem importar seu próprio código local de runtime diretamente de seus módulos de extensão.

O mesmo limite se aplica a interfaces do SDK nomeadas por provedor em geral: o núcleo não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o núcleo precisar de um comportamento, ou consome o próprio
barrel `api.ts` / `runtime-api.ts` do Plugin empacotado, ou promove a necessidade a uma capacidade
genérica e estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica de canal
  ou parâmetros extras de enquete

O núcleo agora adia o parsing compartilhado de enquete até depois que o despacho de enquete do Plugin recusa
a ação, para que handlers de enquete de propriedade do Plugin possam aceitar campos de
enquete específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquete.

Veja [Load pipeline](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidade

O OpenClaw trata um Plugin nativo como o limite de propriedade de uma **empresa** ou de um
**recurso**, não como um saco de integrações não relacionadas.

Isso significa:

- um Plugin de empresa normalmente deve ser dono de todas as superfícies do OpenClaw
  voltadas para aquela empresa
- um Plugin de recurso normalmente deve ser dono da superfície completa do recurso que introduz
- canais devem consumir capacidades centrais compartilhadas em vez de reimplementar comportamento
  de provedor de forma ad hoc

Exemplos:

- o Plugin empacotado `openai` é dono do comportamento de provedor de modelos OpenAI e do comportamento OpenAI de
  fala + voz em tempo real + entendimento de mídia + geração de imagem
- o Plugin empacotado `elevenlabs` é dono do comportamento de fala do ElevenLabs
- o Plugin empacotado `microsoft` é dono do comportamento de fala da Microsoft
- o Plugin empacotado `google` é dono do comportamento de provedor de modelos Google, além do comportamento Google de
  entendimento de mídia + geração de imagem + pesquisa na web
- o Plugin empacotado `firecrawl` é dono do comportamento de busca na web do Firecrawl
- os Plugins empacotados `minimax`, `mistral`, `moonshot` e `zai` são donos de seus
  backends de entendimento de mídia
- o Plugin empacotado `qwen` é dono do comportamento de provedor de texto Qwen, além do comportamento de
  entendimento de mídia e geração de vídeo
- o Plugin `voice-call` é um Plugin de recurso: ele é dono do transporte de chamada, ferramentas,
  CLI, rotas e bridge de stream de mídia do Twilio, mas consome capacidades compartilhadas de fala
  e também de transcrição em tempo real e voz em tempo real, em vez de importar diretamente Plugins de fornecedor

O estado final pretendido é:

- OpenAI vive em um único Plugin, mesmo que cubra modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual Plugin de fornecedor é dono do provedor; eles consomem o
  contrato de capacidade compartilhada exposto pelo núcleo

Esta é a distinção-chave:

- **Plugin** = limite de propriedade
- **capacidade** = contrato central que múltiplos Plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
“qual provedor deve codificar rigidamente o tratamento de vídeo?” A primeira pergunta é “qual é
o contrato central de capacidade de vídeo?” Quando esse contrato existir, Plugins de fornecedor
podem se registrar nele e Plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, o movimento correto normalmente é:

1. definir a capacidade ausente no núcleo
2. expô-la pela API/runtime de Plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. deixar Plugins de fornecedor registrarem implementações

Isso mantém a propriedade explícita e evita comportamento do núcleo que dependa de um
único fornecedor ou de um caminho de código específico de um Plugin pontual.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

- **camada central de capacidade**: orquestração compartilhada, política, fallback, regras de mesclagem
  de configuração, semântica de entrega e contratos tipados
- **camada de Plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala,
  geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de Plugin de canal/recurso**: integração Slack/Discord/voice-call/etc.
  que consome capacidades centrais e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o núcleo é dono da política de TTS no momento da resposta, ordem de fallback, preferências e entrega no canal
- `openai`, `elevenlabs` e `microsoft` são donos das implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de Plugin de empresa com múltiplas capacidades

Um Plugin de empresa deve parecer coeso de fora para dentro. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo, busca na web e pesquisa na web,
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
      // hooks de autenticação/catálogo de modelos/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuração de fala do fornecedor — implemente diretamente a interface SpeechProviderPlugin
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
        // lógica de credencial + busca
      }),
    );
  },
};

export default plugin;
```

O importante não são os nomes exatos dos auxiliares. O formato importa:

- um único Plugin é dono da superfície do fornecedor
- o núcleo continua sendo dono dos contratos de capacidade
- canais e Plugins de recurso consomem auxiliares `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o Plugin registrou as capacidades que
  afirma possuir

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica ali:

1. o núcleo define o contrato de entendimento de mídia
2. Plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e Plugins de recurso consomem o comportamento central compartilhado em vez de
   se conectarem diretamente ao código do fornecedor

Isso evita incorporar no núcleo as suposições de vídeo de um único provedor. O Plugin é dono
da superfície do fornecedor; o núcleo é dono do contrato de capacidade e do comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o núcleo é dono do contrato tipado
de capacidade e do auxiliar de runtime, e Plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nela.

Precisa de um checklist concreto de rollout? Veja
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e enforcement

A superfície da API de Plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro suportados e
os auxiliares de runtime nos quais um Plugin pode confiar.

Por que isso importa:

- autores de Plugins recebem um único padrão interno estável
- o núcleo pode rejeitar propriedade duplicada, como dois Plugins registrando o mesmo
  id de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de Plugins empacotados e evitar deriva silenciosa

Há duas camadas de enforcement:

1. **enforcement de registro em runtime**
   O registro de Plugins valida registros à medida que os Plugins são carregados. Exemplos:
   ids duplicados de provedor, ids duplicados de provedor de fala e registros
   malformados produzem diagnósticos de Plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins empacotados são capturados em registros de contrato durante execuções de teste, para que o
   OpenClaw possa afirmar a propriedade explicitamente. Hoje isso é usado para provedores de modelo,
   provedores de fala, provedores de pesquisa na web e propriedade de registro empacotado.

O efeito prático é que o OpenClaw sabe, antecipadamente, qual Plugin é dono de qual
superfície. Isso permite que o núcleo e os canais componham sem atrito porque a
propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de Plugin são:

- tipados
- pequenos
- específicos de capacidade
- de propriedade do núcleo
- reutilizáveis por múltiplos Plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Maus contratos de Plugin são:

- política específica do fornecedor escondida no núcleo
- rotas de escape pontuais de Plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos ad hoc de runtime que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois
deixe os Plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw rodam **in-process** com o Gateway. Eles não são
isolados por sandbox. Um Plugin nativo carregado tem o mesmo limite de confiança em nível de processo que o código central.

Implicações:

- um Plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um Plugin nativo pode derrubar ou desestabilizar o Gateway
- um Plugin nativo malicioso equivale a execução arbitrária de código dentro do
  processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills empacotadas.

Use allowlists e caminhos explícitos de instalação/carregamento para Plugins não empacotados. Trate
Plugins de workspace como código de desenvolvimento, não como padrão de produção.

Para nomes de pacote de workspace empacotado, mantenha o id do Plugin ancorado no nome do npm:
`@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente um papel mais estreito de Plugin.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de Plugin**, não na proveniência da origem.
- Um Plugin de workspace com o mesmo id de um Plugin empacotado intencionalmente sombreia
  a cópia empacotada quando esse Plugin de workspace está habilitado/na allowlist.
- Isso é normal e útil para desenvolvimento local, teste de patches e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Reduza exports auxiliares fora de contrato:

- subcaminhos auxiliares específicos de Plugin empacotado
- subcaminhos de plumbing de runtime não destinados a API pública
- auxiliares de conveniência específicos de fornecedor
- auxiliares de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de Plugin empacotado ainda permanecem no mapa de exportação gerado do SDK por compatibilidade e manutenção de Plugin empacotado. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e várias interfaces `plugin-sdk/matrix*`. Trate isso como
exports reservados de detalhe de implementação, não como o padrão recomendado do SDK para
novos Plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de Plugins candidatos
2. lê manifests nativos ou de bundles compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de Plugins
8. expõe o registro para superfícies de comando/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os Plugins empacotados usam `register`; prefira `register` para novos Plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho tem permissão de escrita global ou a propriedade do caminho parece suspeita para Plugins não empacotados.

### Comportamento manifest-first

O manifest é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da UI de controle
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do Plugin

Para Plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` do manifest permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
não substituem registro em runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provedor do manifest
para restringir o carregamento de Plugins antes de materialização mais ampla do registro:

- o carregamento da CLI restringe aos Plugins que são donos do comando primário solicitado
- a configuração de canal/resolução de Plugin restringe aos Plugins que são donos do
  id de canal solicitado
- a configuração/resolução explícita de provedor em runtime restringe aos Plugins que são donos do
  id de provedor solicitado

A descoberta de setup agora prefere ids pertencentes a descritores, como `setup.providers` e
`setup.cliBackends`, para restringir Plugins candidatos antes de recorrer a
`setup-api` para Plugins que ainda precisam de hooks de runtime no momento do setup. Se mais de
um Plugin descoberto reivindicar o mesmo id normalizado de provedor de setup ou backend de CLI,
a busca de setup recusa o proprietário ambíguo em vez de depender da ordem de descoberta.

### O que o loader mantém em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifest
- registros de Plugins carregados

Esses caches reduzem sobrecarga de inicialização em rajadas e repetição de comandos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não modificam diretamente globais aleatórias do núcleo. Eles se registram em um
registro central de Plugins.

O registro rastreia:

- registros de Plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos de propriedade do Plugin

Recursos centrais então leem desse registro em vez de falar diretamente com módulos de Plugin.
Isso mantém o carregamento unidirecional:

- módulo de Plugin -> registro no registro
- runtime central -> consumo do registro

Essa separação importa para a manutenção. Significa que a maioria das superfícies centrais só
precisa de um ponto de integração: “ler o registro”, não “tratar especialmente cada módulo
de Plugin”.

## Callbacks de vínculo de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vínculo
for aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Agora existe um vínculo para este plugin + conversa.
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
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desanexação, id do remetente e
  metadados da conversa

Este callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e roda depois que o tratamento central de aprovação termina.

## Hooks de runtime de provedor

Plugins de provedor agora têm duas camadas:

- metadados de manifest: `providerAuthEnvVars` para busca barata de autenticação de provedor por variável de ambiente
  antes do carregamento do runtime, `providerAuthAliases` para variantes de provedor que compartilham
  autenticação, `channelEnvVars` para busca barata de setup/ambiente de canal antes do carregamento
  do runtime, além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação e
  metadados de flags da CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / `discovery` legado e `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

O OpenClaw continua sendo dono do loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico do provedor sem
precisar de um transporte de inferência totalmente personalizado.

Use `providerAuthEnvVars` do manifest quando o provedor tiver credenciais baseadas em variáveis de ambiente
que caminhos genéricos de autenticação/status/seletor de modelo precisem enxergar sem carregar o runtime do Plugin. Use `providerAuthAliases` do manifest quando um id de provedor deve reutilizar
as variáveis de ambiente, perfis de autenticação, autenticação baseada em configuração e escolha de onboarding de chave de API de outro id de provedor. Use `providerAuthChoices` do manifest quando superfícies de CLI de onboarding/escolha de autenticação
precisarem conhecer o id de escolha do provedor, rótulos de grupo e ligação simples de autenticação com uma única flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor para dicas voltadas ao operador, como rótulos de onboarding ou variáveis
de configuração de client-id/client-secret para OAuth.

Use `channelEnvVars` do manifest quando um canal tiver autenticação ou setup orientado por variável de ambiente que fallback genérico de shell-env, verificações de configuração/status ou prompts de setup devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para Plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna “Quando usar” é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                   | O provedor é dono de um catálogo ou de padrões de base URL                                                                                |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração de propriedade do provedor durante a materialização da configuração     | Os padrões dependem do modo de autenticação, ambiente ou semântica da família de modelos do provedor                                    |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de Plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de id de modelo antes da busca                                         | O provedor é dono da limpeza de aliases antes da resolução canônica do modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família de provedor antes da montagem genérica do modelo                       | O provedor é dono da limpeza de transporte para ids de provedor personalizados na mesma família de transporte                            |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve viver com o Plugin; auxiliares empacotados da família Google também sustentam entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a provedores de configuração                  | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                          |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento de autenticação em runtime | O provedor tem resolução de chave de API por marcador de ambiente de sua propriedade; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de ambiente AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto simples                    | O provedor pode operar com um marcador sintético/local de credencial                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação de propriedade do provedor; o `persistence` padrão é `runtime-only` para credenciais de propriedade da CLI/app | O provedor reutiliza credenciais externas de autenticação sem persistir refresh tokens copiados                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders armazenados de perfil sintético atrás de autenticação baseada em env/config              | O provedor armazena perfis placeholder sintéticos que não devem vencer a precedência                                                     |
| 11  | `resolveDynamicModel`             | Sincroniza fallback para ids de modelo de propriedade do provedor ainda não presentes no registro local        | O provedor aceita ids arbitrários de modelo upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` roda novamente                                            | O provedor precisa de metadados de rede antes de resolver ids desconhecidos                                                              |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor incorporado usar o modelo resolvido                                        | O provedor precisa de reescritas de transporte, mas ainda usa um transporte central                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível             | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o provedor                                                   |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas de propriedade do provedor usados pela lógica central compartilhada       | O provedor precisa de particularidades de transcrição/família de provedor                                                                |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes de o executor incorporado vê-los                                        | O provedor precisa de limpeza de schema da família de transporte                                                                          |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema de propriedade do provedor após a normalização                                    | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao núcleo                                            |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs. com tags                                                  | O provedor precisa de raciocínio/saída final com tags em vez de campos nativos                                                           |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                       | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                              |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                             | O provedor precisa de um protocolo de comunicação personalizado, não apenas de um wrapper                                                |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                  | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo sem um transporte personalizado                            |
| 22  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos por turno de transporte                                                  | O provedor quer que transportes genéricos enviem identidade nativa de turno do provedor                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de resfriamento de sessão                                    | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                       |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado torna-se a string `apiKey` de runtime               | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                          |
| 25  | `refreshOAuth`                    | Sobrescrita de refresh de OAuth para endpoints de refresh personalizados ou política de falha no refresh      | O provedor não se encaixa nos refreshers compartilhados `pi-ai`                                                                          |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh de OAuth falha                                                         | O provedor precisa de orientação de reparo de autenticação de sua propriedade após falha no refresh                                     |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow de janela de contexto de propriedade do provedor                                   | O provedor tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                       |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover de propriedade do provedor                                                 | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                               |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de barreira de TTL de cache específica de proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação por autenticação ausente                                      | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                             |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário                            | O provedor precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                        |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                          |
| 33  | `isBinaryThinking`                | Alternância on/off de raciocínio para provedores de raciocínio binário                                         | O provedor expõe apenas raciocínio binário ligado/desligado                                                                              |
| 34  | `supportsXHighThinking`           | Suporte de raciocínio `xhigh` para modelos selecionados                                                        | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                              |
| 35  | `supportsAdaptiveThinking`        | Suporte de raciocínio `adaptive` para modelos selecionados                                                     | O provedor quer que `adaptive` apareça apenas para modelos com raciocínio adaptativo gerenciado pelo provedor                           |
| 36  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                                                | O provedor é dono da política padrão de `/think` para uma família de modelos                                                             |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                            | O provedor é dono da correspondência de modelo preferido para ao vivo/smoke                                                              |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência            | O provedor precisa de uma troca de token ou de uma credencial de requisição de curta duração                                              |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies relacionadas de status                      | O provedor precisa de parsing personalizado de token de uso/cota ou de uma credencial diferente de uso                                   |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor depois que a autenticação é resolvida          | O provedor precisa de um endpoint específico de uso ou de um parser de payload específico do provedor                                     |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embeddings de propriedade do provedor para memória/pesquisa                           | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                    |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento de transcrição para o provedor                        | O provedor precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de raciocínio)                           |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                         | O provedor precisa de reescritas específicas de replay além dos auxiliares compartilhados de Compaction                                  |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem de turnos de replay antes do executor incorporado                               | O transporte do provedor precisa de validação mais rígida de turnos após a sanitização genérica                                           |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção de propriedade do provedor                                              | O provedor precisa de telemetria ou estado de propriedade do provedor quando um modelo se torna ativo                                    |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provedor correspondente, depois percorrem outros Plugins de provedor com capacidade de hook
até que um realmente altere o id do modelo ou o transporte/configuração. Isso mantém
funcionando shims de alias/provedor compatível sem exigir que o chamador saiba qual
Plugin empacotado é dono da reescrita. Se nenhum hook de provedor reescrever uma entrada
suportada de configuração da família Google, o normalizador de configuração do Google empacotado ainda aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de comunicação totalmente personalizado ou de um executor de requisição personalizado,
isso é uma classe diferente de extensão. Estes hooks são para comportamento de provedor
que ainda roda no loop normal de inferência do OpenClaw.

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

- O Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `supportsAdaptiveThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque é dono da compatibilidade futura do Claude 4.6,
  dicas de família de provedor, orientação de reparo de autenticação, integração
  com endpoint de uso, elegibilidade de cache de prompt, padrões de configuração conscientes de autenticação, política padrão/adaptativa de thinking do Claude e modelagem de stream específica do Anthropic para
  cabeçalhos beta, `/fast` / `serviceTier` e `context1m`.
- Os auxiliares de stream específicos do Claude no Anthropic permanecem por enquanto na sua própria
  interface pública `api.ts` / `contract-api.ts` do Plugin empacotado. Essa superfície de pacote
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e builders de wrapper de Anthropic em nível mais baixo, em vez de ampliar o SDK genérico em torno das regras de cabeçalho beta de um único
  provedor.
- A OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque é dona da compatibilidade futura do GPT-5.4, da normalização direta OpenAI
  `openai-completions` -> `openai-responses`, de dicas de autenticação com reconhecimento de Codex,
  da supressão de Spark, de linhas sintéticas da lista OpenAI e da política de thinking /
  modelo ao vivo do GPT-5; a família de stream `openai-responses-defaults` é dona dos
  wrappers compartilhados nativos do OpenAI Responses para cabeçalhos de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa nativa na web do Codex,
  modelagem de payload de compatibilidade de raciocínio e gerenciamento de contexto de Responses.
- O OpenRouter usa `catalog`, além de `resolveDynamicModel` e
  `prepareDynamicModel`, porque o provedor é pass-through e pode expor novos
  ids de modelo antes das atualizações do catálogo estático do OpenClaw; ele também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  fora do núcleo cabeçalhos de requisição específicos do provedor, metadados de roteamento, patches de raciocínio e política de cache de prompt. Sua política de replay vem da
  família `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  é dona da injeção de raciocínio do proxy e dos pulos de modelo não suportado / `auto`.
- O GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login por dispositivo de propriedade do provedor, comportamento de fallback de modelo, particularidades de transcrição do Claude, troca de token GitHub -> token Copilot e um endpoint de uso de propriedade do provedor.
- O OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque
  ainda roda nos transportes centrais da OpenAI, mas é dono de sua normalização
  de transporte/base URL, política de fallback de refresh de OAuth, escolha
  padrão de transporte, linhas sintéticas de catálogo do Codex e integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- O Google AI Studio e o Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef`, porque a
  família de replay `google-gemini` é dona do fallback de compatibilidade futura do Gemini 3.1,
  da validação nativa de replay do Gemini, da sanitização de replay no bootstrap, do
  modo de saída de raciocínio com tags e da correspondência de modelos modernos, enquanto a
  família de stream `google-thinking` é dona da normalização do payload de thinking do Gemini;
  o Gemini CLI OAuth também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e ligação
  do endpoint de cota.
- O Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica do Claude permaneça
  delimitada a ids de Claude em vez de todo transporte `anthropic-messages`.
- O Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque é dono
  da classificação específica do Bedrock para erros de throttle/not-ready/context-overflow
  no tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção `anthropic-by-model` apenas para Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini` porque fazem proxy de modelos Gemini
  por transportes compatíveis com OpenAI e precisam da sanitização
  de assinatura de pensamento do Gemini sem validação nativa de replay do Gemini nem reescritas
  de bootstrap.
- O MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai`, porque um único provedor é dono tanto
  da semântica de mensagem Anthropic quanto da compatível com OpenAI; ele mantém a remoção
  de blocos de thinking apenas do Claude no lado Anthropic ao mesmo tempo em que sobrescreve o
  modo de saída de raciocínio de volta para nativo, e a família de stream `minimax-fast-mode` é dona
  de reescritas de modelo em modo rápido no caminho de stream compartilhado.
- O Moonshot usa `catalog`, além de `wrapStreamFn`, porque ainda usa o transporte
  compartilhado da OpenAI, mas precisa de normalização de payload de thinking de propriedade do provedor; a
  família de stream `moonshot-thinking` mapeia configuração e estado de `/think` para seu
  payload nativo binário de thinking.
- O Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de cabeçalhos de requisição de propriedade do provedor,
  normalização de payload de raciocínio, dicas de transcrição do Gemini e
  barreira de TTL de cache do Anthropic; a família de stream `kilocode-thinking` mantém a injeção
  de thinking do Kilo no caminho compartilhado de stream do proxy ao mesmo tempo em que ignora `kilo/auto` e
  outros ids de modelo de proxy que não suportam payloads explícitos de raciocínio.
- O Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque é dono do fallback do GLM-5,
  dos padrões `tool_stream`, da UX de thinking binário, da correspondência de modelos modernos e tanto
  da autenticação de uso quanto da busca de cota; a família de stream `tool-stream-default-on` mantém
  o wrapper padrão-ativo de `tool_stream` fora de cola manual por provedor.
- A xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque é dona da normalização do transporte nativo xAI Responses, de reescritas de alias
  do modo rápido do Grok, do `tool_stream` padrão, da limpeza rigorosa de ferramentas / payload de raciocínio,
  da reutilização de autenticação de fallback para ferramentas de propriedade do Plugin, da resolução
  de modelo Grok com compatibilidade futura e de patches de compatibilidade de propriedade do provedor, como perfil de schema de ferramenta xAI, palavras-chave de schema não suportadas, `web_search` nativo e
  decodificação de argumentos de chamada de ferramenta com entidade HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  particularidades de transcrição/ferramentas fora do núcleo.
- Provedores empacotados apenas com catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- O Qwen usa `catalog` para seu provedor de texto, além de registros compartilhados de entendimento de mídia e
  geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog`, além de hooks de uso, porque seu comportamento de `/usage`
  pertence ao Plugin, mesmo que a inferência ainda rode pelos transportes compartilhados.

## Auxiliares de runtime

Plugins podem acessar auxiliares centrais selecionados via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna o payload normal de saída de TTS do núcleo para superfícies de arquivo/nota de voz.
- Usa a configuração central `messages.tts` e seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de setup de propriedade do fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores com reconhecimento de provedor.
- OpenAI e ElevenLabs suportam telefonia hoje. Microsoft não.

Plugins também podem registrar provedores de fala via `api.registerSpeechProvider(...)`.

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

- Mantenha política, fallback e entrega de resposta de TTS no núcleo.
- Use provedores de fala para comportamento de síntese de propriedade do fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o id de provedor `microsoft`.
- O modelo preferido de propriedade é orientado por empresa: um único Plugin de fornecedor pode ser dono de
  texto, fala, imagem e futuros provedores de mídia à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, Plugins registram um único provedor tipado
de entendimento de mídia em vez de um saco genérico chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração com canais no núcleo.
- Mantenha o comportamento do fornecedor no Plugin do provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos
  opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo é dono do contrato de capacidade e do auxiliar de runtime
  - Plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - Plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de entendimento de mídia, Plugins podem chamar:

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

Para transcrição de áudio, Plugins podem usar tanto o runtime de entendimento de mídia
quanto o alias legado de STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não pode ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  entendimento de imagem/áudio/vídeo.
- Usa a configuração central de áudio de entendimento de mídia (`tools.media.audio`) e a ordem de fallback de provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não suportada).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Plugins também podem iniciar execuções em segundo plano de subagentes via `api.runtime.subagent`:

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
- Para execuções de fallback pertencentes ao Plugin, operadores precisam optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de Plugin não confiável ainda funcionam, mas solicitações de sobrescrita são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, Plugins podem consumir o auxiliar compartilhado de runtime em vez de
acessar a integração de ferramenta do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no núcleo.
- Use provedores de pesquisa na web para transportes de pesquisa específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para Plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper de ferramenta do agente.

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

- `path`: caminho da rota sob o servidor HTTP do Gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do Gateway, ou `"plugin"` para autenticação gerenciada pelo Plugin/verificação de Webhook.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tratar a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do Plugin. Use `api.registerHttpRoute(...)` no lugar.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas são para Webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas a auxiliares do Gateway.
- Rotas `auth: "gateway"` rodam dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de Plugin fixados em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de Plugin com identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de Plugin com autenticação do Gateway seja uma superfície implícita de administração. Se sua rota precisar de comportamento exclusivo de administrador, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar Plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de Plugin.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado a Plugins.
- `openclaw/plugin-sdk/config-schema` para o export do schema Zod raiz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estáveis de canal, como `openclaw/plugin-sdk/channel-setup`,
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
  setup/autenticação/resposta/Webhook.
  `channel-inbound` é a superfície compartilhada para debounce, correspondência de menções,
  auxiliares de política de menção de entrada, formatação de envelope e auxiliares
  de contexto de envelope de entrada.
  `channel-setup` é a interface estreita de setup opcional na instalação.
  `setup-runtime` é a superfície segura em runtime para setup usada por `setupEntry` /
  inicialização adiada, incluindo adaptadores de patch de setup seguros para importação.
  `setup-adapter-runtime` é a interface de adaptador de setup de conta sensível a ambiente.
  `setup-tools` é a pequena interface de auxiliares de CLI/arquivo/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` para auxiliares compartilhados de runtime/configuração.
  `telegram-command-config` é a interface pública estreita para normalização/validação de comandos personalizados do Telegram e permanece disponível mesmo se a
  superfície de contrato do Telegram empacotado estiver temporariamente indisponível.
  `text-runtime` é a interface compartilhada de texto/Markdown/logging, incluindo
  remoção de texto visível para o assistente, auxiliares de renderização/fragmentação de Markdown, auxiliares de redação,
  auxiliares de tag de diretiva e utilitários de texto seguro.
- Interfaces específicas de canal para aprovação devem preferir um único contrato `approvalCapability`
  no Plugin. O núcleo então lê autenticação, entrega, renderização,
  roteamento nativo e comportamento lazy de handler nativo de aprovação por essa única capacidade
  em vez de misturar comportamento de aprovação em campos não relacionados do Plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como shim de
  compatibilidade para Plugins mais antigos. Código novo deve importar as primitivas genéricas mais estreitas,
  e o código do repositório não deve adicionar novos imports do shim.
- Internos de extensões empacotadas permanecem privados. Plugins externos devem usar apenas subcaminhos `openclaw/plugin-sdk/*`. Código central/de teste do OpenClaw pode usar os
  pontos de entrada públicos do repositório sob a raiz de pacote de um Plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo estreito como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de Plugin a partir do núcleo ou de outra extensão.
- Divisão de pontos de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de auxiliares/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel apenas de runtime,
  `<plugin-package-root>/index.js` é o ponto de entrada do Plugin empacotado
  e `<plugin-package-root>/setup-entry.js` é o ponto de entrada do Plugin de setup.
- Exemplos atuais de provedores empacotados:
  - Anthropic usa `api.js` / `contract-api.js` para auxiliares de stream do Claude, como
    `wrapAnthropicProviderStream`, auxiliares de cabeçalho beta e parsing de `service_tier`.
  - OpenAI usa `api.js` para builders de provedor, auxiliares de modelo padrão e
    builders de provedor em tempo real.
  - OpenRouter usa `api.js` para seu builder de provedor, além de auxiliares de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar auxiliares genéricos
    `plugin-sdk/provider-stream` para uso local no repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo de configuração de runtime
  quando ele existe, e depois recorrem ao arquivo de configuração resolvido em disco quando o
  OpenClaw ainda não está servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Um pequeno
  conjunto reservado de compatibilidade de interfaces auxiliares com marca de canal empacotado ainda
  existe. Trate isso como interfaces de manutenção/compatibilidade de empacotados, não como novos alvos de importação para terceiros; novos contratos entre canais ainda devem cair em
  subcaminhos genéricos `plugin-sdk/*` ou nos barrels locais do Plugin `api.js` /
  `runtime-api.js`.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis e estreitas. Os subcaminhos mais novos de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho com
  Plugins empacotados e externos.
  Parsing/matching de alvo pertence a `openclaw/plugin-sdk/channel-targets`.
  Barreiras de ação de mensagem e auxiliares de message-id de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels auxiliares específicos de extensão empacotada não são estáveis por padrão. Se um
  auxiliar só for necessário por uma extensão empacotada, mantenha-o atrás da
  interface local `api.js` ou `runtime-api.js` da extensão, em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novas interfaces auxiliares compartilhadas devem ser genéricas, não com marca de canal. Parsing compartilhado de alvo
  pertence a `openclaw/plugin-sdk/channel-targets`; internos específicos de canal
  ficam atrás da interface local `api.js` ou `runtime-api.js` do Plugin proprietário.
- Subcaminhos específicos de capacidade como `image-generation`,
  `media-understanding` e `speech` existem porque Plugins empacotados/nativos os usam
  hoje. Sua presença não significa por si só que todo auxiliar exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta `message`

Plugins devem ser donos das contribuições de schema específicas de canal de
`describeMessageTool(...)`. Mantenha campos específicos de provedor no Plugin, não no núcleo compartilhado.

Para fragmentos de schema portáveis compartilhados, reutilize os auxiliares genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de cartão

Se um formato de schema só fizer sentido para um provedor, defina-o no
próprio código-fonte daquele Plugin em vez de promovê-lo para o SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem ser donos da semântica específica de alvo do canal. Mantenha o
host compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca em diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se uma
  entrada deve pular diretamente para resolução por id em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando o
  núcleo precisa de uma resolução final de propriedade do provedor após normalização ou após um
  erro de busca em diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dona da construção de rota de sessão específica do provedor
  depois que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de buscar pares/grupos.
- Use `looksLikeId` para verificações do tipo “trate isto como um id de alvo explícito/nativo”.
- Use `resolveTarget` para fallback de normalização específica do provedor, não para
  busca ampla em diretório.
- Mantenha ids nativos do provedor como ids de chat, ids de thread, JIDs, handles e ids de sala
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo por conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- auxiliares de remoção de duplicidade/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica de canal e normalização de id devem permanecer na
implementação do Plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para múltiplas entradas de provedor

Use `catalog` quando o Plugin for dono de ids de modelo específicos do provedor, padrões de base URL ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples com chave de API ou orientados por variável de ambiente
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam múltiplas entradas relacionadas de provedor
- `late`: última passada, depois de outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então Plugins podem sobrescrever intencionalmente uma entrada de provedor integrada com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem ambos registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se o seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de
  repair doctor/configuração não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente) é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem “configurado, mas indisponível neste caminho de comando”
em vez de falhar ou relatar incorretamente a conta como não configurada.

## Pacotes pack

Um diretório de Plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada vira um Plugin. Se o pack listar múltiplas extensões, o id do Plugin
torna-se `name/<fileBase>`.

Se seu Plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após resolução de symlink. Entradas que escapem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de Plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do Plugin em “JS/TS puro” e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um Plugin de canal desabilitado, ou
quando um Plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez do ponto de entrada completo do Plugin. Isso mantém a inicialização e o setup mais leves
quando o ponto de entrada principal do seu Plugin também conecta ferramentas, hooks ou outro código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um Plugin de canal no mesmo caminho de `setupEntry` durante a fase de
inicialização pré-listen do Gateway, mesmo quando o canal já estiver configurado.

Use isto apenas quando `setupEntry` cobrir completamente a superfície de inicialização que deve existir
antes que o Gateway comece a ouvir. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade de propriedade do canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o Gateway comece a ouvir
- quaisquer métodos, ferramentas ou serviços do Gateway que precisem existir durante essa mesma janela

Se seu ponto de entrada completo ainda for dono de qualquer capacidade exigida na inicialização, não habilite
essa flag. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar o
ponto de entrada completo durante a inicialização.

Canais empacotados também podem publicar auxiliares de superfície de contrato somente de setup que o núcleo
pode consultar antes de o runtime completo do canal ser carregado. A superfície atual de promoção
de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única para
`channels.<id>.accounts.*` sem carregar o ponto de entrada completo do Plugin.
O Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta nomeada promovida quando contas nomeadas já existem, e pode preservar uma chave configurada
de conta padrão não canônica em vez de sempre criar `accounts.default`.

Esses adaptadores de patch de setup mantêm lazy a descoberta da superfície de contrato empacotada. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização do canal empacotado no import do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do Gateway, mantenha-as em um
prefixo específico do Plugin. Namespaces centrais de administração (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem
para `operator.admin`, mesmo que um Plugin solicite um escopo mais estreito.

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
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo central livres de dados específicos.

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
      "blurb": "Chat self-hosted via bots de Webhook do Nextcloud Talk.",
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
- `docsLabel`: sobrescreve o texto do link para a documentação
- `preferOver`: ids de Plugin/canal de prioridade menor que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de cópia da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação de documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão de início rápido de `allowFrom`
- `forceAccountBinding`: exige vínculo explícito de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca por sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação
de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são donos da orquestração do contexto de sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu Plugin com
`api.registerContextEngine(id, factory)`, depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isto quando seu Plugin precisar substituir ou estender o pipeline padrão de contexto
em vez de apenas adicionar pesquisa de memória ou hooks.

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

Se seu mecanismo **não** for dono do algoritmo de Compaction, mantenha `compact()`
implementado e delegue-o explicitamente:

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

Quando um Plugin precisar de um comportamento que não se encaixe na API atual, não contorne
o sistema de Plugins com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o núcleo deve possuir: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada a canais e formato do auxiliar de runtime.
2. adicione superfícies tipadas de registro/runtime de Plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor
   superfície tipada útil de capacidade.
3. conecte consumidores centrais + de canal/recurso
   Canais e Plugins de recurso devem consumir a nova capacidade por meio do núcleo,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw continua opinativo sem ficar rigidamente codificado à visão de mundo de um
único provedor. Veja o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos centrais de contrato em `src/<capability>/types.ts`
- executor/auxiliar central de runtime em `src/<capability>/runtime.ts`
- superfície de registro da API de Plugin em `src/plugins/types.ts`
- integração com o registro de Plugins em `src/plugins/registry.ts`
- exposição de runtime de Plugin em `src/plugins/runtime/*` quando Plugins de recurso/canal
  precisarem consumi-la
- auxiliares de captura/teste em `src/test-utils/plugin-registration.ts`
- assertions de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/Plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso normalmente é um sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

Padrão mínimo:

```ts
// contrato central
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// auxiliar compartilhado de runtime para Plugins de recurso/canal
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

- o núcleo é dono do contrato de capacidade + orquestração
- Plugins de fornecedor são donos das implementações do fornecedor
- Plugins de recurso/canal consomem auxiliares de runtime
- testes de contrato mantêm a propriedade explícita
