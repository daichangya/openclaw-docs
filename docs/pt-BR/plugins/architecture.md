---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entender o modelo de capacidade do plugin ou os limites de propriedade
    - Trabalhar no pipeline de carregamento ou no registro de plugins
    - Implementar hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Internos do Plugin: modelo de capacidade, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos do Plugin
x-i18n:
    generated_at: "2026-04-21T13:36:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos do Plugin

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, veja:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelo
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de Plugin do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade              | Método de registro                             | Plugins de exemplo                   |
| ----------------------- | ---------------------------------------------- | ------------------------------------ |
| Inferência de texto     | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Backend de inferência de CLI | `api.registerCliBackend(...)`             | `openai`, `anthropic`                |
| Fala                    | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real       | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Compreensão de mídia    | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Geração de imagem       | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Geração de música       | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Geração de vídeo        | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Busca na web            | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Pesquisa na web         | `api.registerWebSearchProvider(...)`           | `google`                             |
| Canal / mensagens       | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Um plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.

### Postura de compatibilidade externa

O modelo de capacidades já chegou ao core e é usado hoje por plugins
nativos/incluídos em pacote, mas a compatibilidade com plugins externos ainda precisa de um critério mais rígido do que "está
exportado, portanto está congelado".

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins nativos/incluídos em pacote:** prefira registro explícito de capacidades em vez de
  acessos específicos de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate as
  superfícies auxiliares específicas de capacidade como evolutivas, a menos que a documentação marque explicitamente um contrato como estável

Regra prática:

- APIs de registro de capacidades são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro sem quebra para plugins externos durante
  a transição
- subcaminhos auxiliares exportados não são todos iguais; prefira o contrato
  documentado e restrito, não exportações auxiliares incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base no seu
comportamento real de registro, e não apenas em metadados estáticos:

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  plugin somente de provedor como `mistral`)
- **hybrid-capability** -- registra vários tipos de capacidade (por exemplo,
  `openai` é dono de inferência de texto, fala, compreensão de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks, tipados ou personalizados, sem
  capacidades, ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas não
  capacidades

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e o detalhamento
de capacidades. Veja a [referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha-o funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provedor
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova-o somente depois que o uso real cair e a cobertura de fixtures provar segurança de migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                    | Significado                                                  |
| ------------------------ | ------------------------------------------------------------ |
| **config valid**         | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (ex.: `hook-only`) |
| **legacy warning**       | O plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**           | A configuração é inválida ou o plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje --
`hook-only` é apenas um aviso, e `before_agent_start` aciona apenas um alerta. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugin do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes
   de workspace, raízes globais de extensão e extensões incluídas em pacote. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json` e manifestos de bundle compatíveis.
2. **Habilitação + validação**
   O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados em processo via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfícies**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de provedor, hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de plugin, a descoberta de comandos raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar na primeira invocação

Isso mantém o código da CLI pertencente ao plugin dentro do plugin, ao mesmo tempo que ainda permite ao OpenClaw
reservar nomes de comando raiz antes da análise.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do plugin
- comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite que o OpenClaw valide configuração, explique plugins ausentes/desabilitados e
construa dicas de UI/schema antes de o runtime completo estar ativo.

### Plugins de canal e a ferramenta compartilhada de mensagens

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única ferramenta compartilhada `message` no core, e
plugins de canal controlam a descoberta e a execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host da ferramenta compartilhada `message`, o wiring de prompt, a
  contabilidade de sessão/thread e o despacho de execução
- plugins de canal controlam a descoberta de ações com escopo, a descoberta de capacidades e quaisquer
  fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa de sessão específica do provedor, como
  os ids de conversa codificam ids de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio do seu adaptador de ações

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capacidades e contribuições de schema
juntas para que essas partes não se desviem umas das outras.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma fonte de mídia como
um caminho local ou URL de mídia remota, o plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita
para aplicar normalização de caminho de sandbox e dicas de acesso de mídia de saída
sem codificar nomes de parâmetros pertencentes ao plugin.
Prefira mapas com escopo por ação ali, e não uma lista plana para todo o canal, para que um
parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas como
`send`.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, na sala/thread/mensagem atual ou na
identidade confiável do solicitante, sem codificar ramificações específicas de canal na ferramenta
`message` do core.

É por isso que mudanças de roteamento do runner incorporado continuam sendo trabalho do plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão ao limite de descoberta do plugin para que a ferramenta compartilhada
`message` exponha a superfície correta pertencente ao canal para o turno atual.

Para auxiliares de execução pertencentes ao canal, plugins incluídos em pacote devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não é mais dono dos runtimes de ação de mensagem de Discord,
Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins incluídos em pacote
devem importar diretamente seu próprio código de runtime local de seus módulos pertencentes à
extensão.

O mesmo limite se aplica a seams do SDK nomeados por provedor em geral: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, deve
consumir o próprio barrel `api.ts` / `runtime-api.ts` do plugin incluído em pacote ou promover a necessidade
a uma capacidade genérica e restrita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo
  comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal
  ou parâmetros extras de enquete

O core agora adia a análise compartilhada de enquete até depois que o despacho de enquete do plugin recusar
a ação, para que manipuladores de enquete pertencentes ao plugin possam aceitar campos de enquete
específicos do canal sem serem bloqueados primeiro pelo analisador genérico de enquete.

Veja [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidade

O OpenClaw trata um plugin nativo como o limite de propriedade para uma **empresa** ou um
**recurso**, não como um conjunto desorganizado de integrações sem relação.

Isso significa:

- um plugin de empresa normalmente deve ser dono de todas as superfícies do OpenClaw
  voltadas para essa empresa
- um plugin de recurso normalmente deve ser dono da superfície completa do recurso que introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar
  comportamento de provedor de forma ad hoc

Exemplos:

- o plugin incluído em pacote `openai` controla o comportamento de provedor de modelo da OpenAI e o comportamento de
  fala + voz em tempo real + compreensão de mídia + geração de imagem da OpenAI
- o plugin incluído em pacote `elevenlabs` controla o comportamento de fala do ElevenLabs
- o plugin incluído em pacote `microsoft` controla o comportamento de fala da Microsoft
- o plugin incluído em pacote `google` controla o comportamento de provedor de modelo do Google mais o comportamento de
  compreensão de mídia + geração de imagem + pesquisa na web do Google
- o plugin incluído em pacote `firecrawl` controla o comportamento de busca na web do Firecrawl
- os plugins incluídos em pacote `minimax`, `mistral`, `moonshot` e `zai` controlam seus
  backends de compreensão de mídia
- o plugin incluído em pacote `qwen` controla o comportamento de provedor de texto do Qwen mais
  o comportamento de compreensão de mídia e geração de vídeo
- o plugin `voice-call` é um plugin de recurso: ele controla transporte de chamada, ferramentas,
  CLI, rotas e a ponte de media stream do Twilio, mas consome capacidades compartilhadas de fala
  mais transcrição em tempo real e voz em tempo real em vez de
  importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI fica em um único plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles consomem o
  contrato de capacidade compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capability** = contrato do core que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
"qual provedor deve codificar o tratamento de vídeo?" A primeira pergunta é "qual é
o contrato de capacidade de vídeo do core?" Quando esse contrato existir, plugins de fornecedor
poderão se registrar nele e plugins de canal/recurso poderão consumi-lo.

Se a capacidade ainda não existir, o movimento correto geralmente é:

1. definir a capacidade ausente no core
2. expô-la por meio da API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. permitir que plugins de fornecedor registrem implementações

Isso mantém a propriedade explícita e evita comportamento do core que dependa de um
único fornecedor ou de um caminho de código específico de plugin e pontual.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras de mesclagem
  de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelo, síntese
  de fala, geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome capacidades do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla política de TTS em tempo de resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com múltiplas capacidades

Um plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia,
geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor pode controlar todas as suas superfícies em um único lugar:

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

O que importa não são os nomes exatos dos auxiliares. O formato importa:

- um plugin controla a superfície do fornecedor
- o core ainda controla os contratos de capacidade
- canais e plugins de recurso consomem auxiliares `api.runtime.*`, não código de fornecedor
- testes de contrato podem verificar que o plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de compreensão de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita incorporar no core as suposições de vídeo de um único provedor. O plugin controla
a superfície do fornecedor; o core controla o contrato de capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado
de capacidade e o auxiliar de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Veja
[Cookbook de capacidades](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os auxiliares de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugins têm um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  id de provedor
- a inicialização pode exibir diagnósticos acionáveis para registros malformados
- testes de contrato podem aplicar a propriedade de plugins incluídos em pacote e evitar desvios silenciosos

Há duas camadas de aplicação:

1. **aplicação de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   ids de provedor duplicados, ids de provedor de fala duplicados e registros
   malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins incluídos em pacote são capturados em registros de contrato durante execuções de teste para que o
   OpenClaw possa afirmar propriedade explicitamente. Hoje isso é usado para
   provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade de registro de plugins incluídos em pacote.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin controla qual
superfície. Isso permite que o core e os canais componham sem fricção porque a propriedade é
declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos por capacidade
- controlados pelo core
- reutilizáveis por vários plugins
- consumíveis por canais/recursos sem conhecimento de fornecedor

Maus contratos de plugin são:

- política específica de fornecedor oculta no core
- escapes pontuais de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois
permita que plugins se conectem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **em processo** com o Gateway. Eles não são
isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que
o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, manipuladores de rede, hooks e serviços
- um bug em plugin nativo pode derrubar ou desestabilizar o gateway
- um plugin nativo malicioso equivale à execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills incluídas em pacote.

Use listas de permissão e caminhos explícitos de instalação/carregamento para plugins que não estejam incluídos em pacote. Trate
plugins de workspace como código de desenvolvimento, não como padrão de produção.

Para nomes de pacote de workspace incluídos em pacote, mantenha o id do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expuser intencionalmente um papel de plugin mais restrito.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo id de um plugin incluído em pacote intencionalmente sobrepõe
  a cópia incluída em pacote quando esse plugin de workspace está habilitado/em lista de permissão.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Reduza exportações auxiliares fora de contrato:

- subcaminhos auxiliares específicos de plugins incluídos em pacote
- subcaminhos de plumbing de runtime não destinados a API pública
- auxiliares de conveniência específicos de fornecedor
- auxiliares de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de plugins incluídos em pacote ainda permanecem no mapa de exportação
do SDK gerado por compatibilidade e manutenção de plugins incluídos em pacote. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exportações reservadas de detalhe de implementação, não como o padrão de SDK recomendado para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifestos nativos ou de bundle compatível e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama os hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro às superfícies de comando/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins incluídos em pacote usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho pode ser escrito por qualquer usuário ou a
propriedade do caminho parece suspeita para plugins que não estejam incluídos em pacote.

### Comportamento com manifesto em primeiro lugar

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da UI de controle
- exibir metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamentos reais, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
não substituem registro em runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores ativos de ativação agora usam dicas do manifesto sobre comando, canal e provedor
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI se restringe a plugins que controlam o comando primário solicitado
- a resolução de configuração/plugin de canal se restringe a plugins que controlam o
  id de canal solicitado
- a resolução explícita de configuração/runtime de provedor se restringe a plugins que controlam o
  id de provedor solicitado

A descoberta de configuração agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de configuração. Se mais de
um plugin descoberto declarar o mesmo id normalizado de provedor de configuração ou backend de CLI,
a busca de configuração recusa o proprietário ambíguo em vez de depender da ordem
de descoberta.

### O que o carregador armazena em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifestos
- registros de plugins carregados

Esses caches reduzem inicializações em rajada e o overhead de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórias do core. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao plugin

Recursos do core então leem desse registro em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento em uma única direção:

- módulo do plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Significa que a maioria das superfícies do core só
precisa de um ponto de integração: "ler o registro", não "tratar cada módulo de plugin como caso especial".

## Callbacks de associação de conversa

Plugins que associam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de associação é aprovada ou negada:

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

Campos da carga útil do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: a associação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desvinculação, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para associar uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedor

Plugins de provedor agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para consulta barata de autenticação do provedor por variável de ambiente
  antes do carregamento do runtime, `providerAuthAliases` para variantes de provedor que compartilham
  autenticação, `channelEnvVars` para consulta barata de ambiente/configuração de canal antes do carregamento do runtime,
  além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação e
  metadados de flags da CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / `discovery` legado mais `applyConfigDefaults`
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

O OpenClaw ainda controla o loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provedor sem
precisar de um transporte de inferência totalmente personalizado.

Use `providerAuthEnvVars` do manifesto quando o provedor tiver credenciais baseadas em variáveis de ambiente
que caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do plugin.
Use `providerAuthAliases` do manifesto quando um id de provedor precisar reutilizar
as variáveis de ambiente, perfis de autenticação, autenticação baseada em configuração e a escolha de onboarding de chave de API
de outro id de provedor. Use `providerAuthChoices` do manifesto quando superfícies de CLI
de onboarding/escolha de autenticação precisarem conhecer o id de escolha do provedor, rótulos de grupo e ligação simples
de autenticação com uma flag sem carregar o runtime do provedor. Mantenha `envVars` no runtime do provedor
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de
client-id/client-secret de OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração orientada por variáveis de ambiente que
fallback genérico de ambiente de shell, verificações de configuração/status ou prompts de configuração devam enxergar
sem carregar o runtime do canal.

### Ordem dos hooks e uso

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                   | O provedor controla um catálogo ou padrões de URL base                                                                                     |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração      | Os padrões dependem do modo de autenticação, ambiente ou semântica da família de modelos do provedor                                      |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de id de modelo antes da busca                                         | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                             |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                       | O provedor controla a limpeza de transporte para ids de provedor personalizados na mesma família de transporte                            |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve ficar com o plugin; auxiliares incluídos da família Google também sustentam entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a provedores de configuração                  | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                           |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento da autenticação de runtime | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor embutido de marcador de ambiente AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto simples                    | O provedor pode operar com um marcador de credencial sintético/local                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação pertencentes ao provedor; o padrão `persistence` é `runtime-only` para credenciais controladas por CLI/app | O provedor reutiliza credenciais externas de autenticação sem persistir tokens de refresh copiados                                        |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos de perfil armazenados abaixo da autenticação baseada em env/config            | O provedor armazena perfis de placeholder sintético que não devem ter precedência                                                         |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo pertencentes ao provedor que ainda não estão no registro local           | O provedor aceita ids arbitrários de modelos upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono, então `resolveDynamicModel` é executado novamente                                      | O provedor precisa de metadados de rede antes de resolver ids desconhecidos                                                                |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner incorporado usar o modelo resolvido                                          | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do core                                                       |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos do fornecedor atrás de outro transporte compatível             | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                        |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas pertencentes ao provedor usados pela lógica compartilhada do core        | O provedor precisa de peculiaridades de transcrição/família de provedor                                                                    |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes de o runner incorporado vê-los                                          | O provedor precisa de limpeza de schema da família de transporte                                                                           |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provedor após a normalização                                      | O provedor quer avisos de palavras-chave sem ensinar regras específicas do provedor ao core                                               |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo ou com tags                                                  | O provedor precisa de raciocínio/saída final com tags em vez de campos nativos                                                            |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes de wrappers genéricos de opção de stream                      | O provedor precisa de parâmetros padrão de solicitação ou limpeza de parâmetros por provedor                                              |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                             | O provedor precisa de um protocolo de transporte personalizado, não apenas de um wrapper                                                  |
| 21  | `wrapStreamFn`                    | Wrapper de stream após a aplicação de wrappers genéricos                                                       | O provedor precisa de wrappers de cabeçalhos/corpo/modelo da solicitação sem um transporte personalizado                                  |
| 22  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos por turno de transporte                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de resfriamento de sessão                                    | O provedor quer que transportes genéricos de WS ajustem cabeçalhos de sessão ou política de fallback                                     |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime               | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                           |
| 25  | `refreshOAuth`                    | Substituição de refresh OAuth para endpoints de refresh personalizados ou política de falha no refresh         | O provedor não se encaixa nos refreshers compartilhados `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                                            | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha no refresh                                 |
| 27  | `matchesContextOverflowError`     | Correspondência de estouro de janela de contexto pertencente ao provedor                                       | O provedor tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                        |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                    | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de controle específico de proxy sobre TTL de cache                                                                      |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação por autenticação ausente                                      | O provedor precisa de uma dica de recuperação por autenticação ausente específica do provedor                                             |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream desatualizado mais dica opcional de erro voltada ao usuário                      | O provedor precisa ocultar linhas upstream desatualizadas ou substituí-las por uma dica do fornecedor                                    |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                            |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis de `/think` específicos do modelo, rótulos de exibição e padrão                            | O provedor expõe uma escada personalizada de raciocínio ou um rótulo binário para modelos selecionados                                   |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para alternância ligada/desligada de raciocínio                                        | O provedor expõe apenas raciocínio binário ligado/desligado                                                                                |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a raciocínio `xhigh`                                                      | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                          | O provedor controla a política padrão de `/think` para uma família de modelos                                                              |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                            | O provedor controla a correspondência de modelo preferido para ao vivo/smoke                                                              |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                    | O provedor precisa de uma troca de token ou de uma credencial de solicitação de curta duração                                              |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas                     | O provedor precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                    |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor após a autenticação ser resolvida             | O provedor precisa de um endpoint de uso específico do provedor ou de um parser de payload                                                 |
| 41  | `createEmbeddingProvider`         | Cria um adaptador de embeddings pertencente ao provedor para memória/pesquisa                                 | O comportamento de embedding de memória pertence ao plugin do provedor                                                                      |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento de transcrição para o provedor                       | O provedor precisa de uma política de transcrição personalizada, por exemplo, remoção de blocos de raciocínio                             |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                        | O provedor precisa de reescritas de replay específicas do provedor além dos auxiliares compartilhados de Compaction                       |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem dos turnos de replay antes do runner incorporado                               | O transporte do provedor precisa de validação mais rigorosa dos turnos após a sanitização genérica                                        |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção pertencentes ao provedor                                               | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provedor correspondente e depois passam pelos outros plugins de provedor com capacidade de hook
até que um deles realmente altere o id do modelo ou o transporte/configuração. Isso mantém
funcionando os shims de alias/compatibilidade de provedor sem exigir que o chamador saiba qual
plugin incluído em pacote controla a reescrita. Se nenhum hook de provedor reescrever uma entrada compatível
de configuração da família Google, o normalizador incluído de configuração do Google ainda aplica
essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de transporte totalmente personalizado ou de um executor de solicitações personalizado,
isso é uma classe diferente de extensão. Esses hooks servem para comportamento de provedor
que ainda é executado no loop normal de inferência do OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque controla a compatibilidade futura do Claude 4.6,
  dicas da família de provedores, orientação de reparo de autenticação, integração
  com endpoint de uso, elegibilidade de cache de prompt, padrões de configuração sensíveis à autenticação, política
  padrão/adaptativa de raciocínio do Claude e modelagem de stream específica do Anthropic para
  cabeçalhos beta, `/fast` / `serviceTier` e `context1m`.
- Os auxiliares de stream específicos do Claude da Anthropic permanecem, por enquanto, no próprio
  seam público `api.ts` / `contract-api.ts` do plugin incluído em pacote. Essa superfície de pacote
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper
  do Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das regras de cabeçalho beta
  de um único provedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` mais `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  porque controla a compatibilidade futura do GPT-5.4, a normalização direta da OpenAI
  `openai-completions` -> `openai-responses`, dicas de autenticação
  sensíveis ao Codex, supressão do Spark, linhas sintéticas de lista da OpenAI e a política
  de raciocínio / modelo ao vivo do GPT-5; a família de stream `openai-responses-defaults` controla os
  wrappers nativos compartilhados do OpenAI Responses para cabeçalhos de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex,
  modelagem de payload de compatibilidade de raciocínio e gerenciamento de contexto do Responses.
- OpenRouter usa `catalog` mais `resolveDynamicModel` e
  `prepareDynamicModel` porque o provedor é pass-through e pode expor novos
  ids de modelo antes que o catálogo estático do OpenClaw seja atualizado; ele também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  fora do core os cabeçalhos de solicitação específicos do provedor, metadados de roteamento, patches de raciocínio e
  política de cache de prompt. Sua política de replay vem da
  família `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  controla a injeção de raciocínio em proxy e os saltos de modelo sem suporte / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` mais `prepareRuntimeAuth` e `fetchUsageSnapshot` porque
  precisa de login em dispositivo pertencente ao provedor, comportamento de fallback de modelo, peculiaridades
  de transcrição do Claude, uma troca de token GitHub -> token Copilot e um endpoint de uso pertencente ao provedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` mais
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` porque
  ainda é executado nos transportes OpenAI do core, mas controla sua normalização de
  transporte/URL base, política de fallback de refresh OAuth, escolha de transporte padrão,
  linhas sintéticas de catálogo do Codex e integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` que a OpenAI direta.
- Google AI Studio e Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` controla o fallback de compatibilidade futura do Gemini 3.1,
  validação nativa de replay do Gemini, sanitização de replay de bootstrap, modo
  de saída de raciocínio com tags e correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` controla a normalização de payload de raciocínio do Gemini;
  Gemini CLI OAuth também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e conexão com endpoint
  de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica do Claude permaneça
  limitada a ids do Claude em vez de todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveThinkingProfile` porque controla
  a classificação específica do Bedrock para erros de throttling/não pronto/estouro de contexto
  para tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção `anthropic-by-model` exclusiva do Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini` porque fazem proxy de modelos
  Gemini por transportes compatíveis com OpenAI e precisam de
  sanitização de assinatura de pensamento do Gemini sem validação nativa de replay do Gemini nem
  reescritas de bootstrap.
- MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai` porque um único provedor controla tanto
  semântica de mensagem Anthropic quanto OpenAI-compatible; ele mantém a remoção
  de blocos de raciocínio exclusivos do Claude no lado Anthropic enquanto substitui o modo
  de saída de raciocínio de volta para nativo, e a família de stream `minimax-fast-mode` controla
  reescritas de modelo em modo rápido no caminho de stream compartilhado.
- Moonshot usa `catalog`, `resolveThinkingProfile` e `wrapStreamFn` porque ainda usa o transporte
  compartilhado da OpenAI, mas precisa de normalização de payload de raciocínio pertencente ao provedor; a
  família de stream `moonshot-thinking` mapeia configuração mais estado de `/think` para seu
  payload binário nativo de raciocínio.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de cabeçalhos de solicitação pertencentes ao provedor,
  normalização de payload de raciocínio, dicas de transcrição do Gemini e
  controle Anthropic de TTL de cache; a família de stream `kilocode-thinking` mantém a injeção
  de raciocínio do Kilo no caminho de stream compartilhado em proxy, pulando `kilo/auto` e
  outros ids de modelo proxy que não oferecem suporte a payloads explícitos de raciocínio.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque controla fallback de GLM-5,
  padrões de `tool_stream`, UX de raciocínio binário, correspondência de modelo moderno e tanto
  autenticação de uso quanto busca de cota; a família de stream `tool-stream-default-on` mantém
  o wrapper `tool_stream` padrão ativado fora da cola manuscrita por provedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque controla a normalização de transporte nativo xAI Responses, reescritas
  de alias de modo rápido do Grok, `tool_stream` padrão, limpeza de
  strict-tool / payload de raciocínio, reutilização de autenticação de fallback para ferramentas pertencentes ao plugin,
  resolução de modelo Grok com compatibilidade futura e patches de compatibilidade pertencentes ao provedor, como perfil
  de schema de ferramentas xAI, palavras-chave de schema sem suporte, `web_search` nativo e
  decodificação de argumentos de chamada de ferramenta com entidade HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  peculiaridades de transcrição/ferramentas fora do core.
- Provedores incluídos em pacote somente de catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provedor de texto mais registros compartilhados de compreensão de mídia e
  geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso porque seu comportamento de `/usage`
  pertence ao plugin, embora a inferência ainda seja executada pelos transportes compartilhados.

## Auxiliares de runtime

Plugins podem acessar auxiliares selecionados do core via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna o payload normal de saída TTS do core para superfícies de arquivo/nota de voz.
- Usa configuração `messages.tts` e seleção de provedor do core.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer reamostragem/codificação para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- As listagens de voz podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores cientes do provedor.
- OpenAI e ElevenLabs hoje oferecem suporte a telefonia. Microsoft não.

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

- Mantenha política de TTS, fallback e entrega de resposta no core.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um único plugin de fornecedor pode controlar
  texto, fala, imagem e futuros provedores de mídia à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um provedor tipado único de
compreensão de mídia em vez de um saco genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e conexão com canal no core.
- Mantenha o comportamento do fornecedor no plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos
  campos opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core controla o contrato de capacidade e o auxiliar de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de compreensão de mídia, plugins podem chamar:

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

Para transcrição de áudio, plugins podem usar o runtime de compreensão de mídia
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
  compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback de provedor.
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

- `provider` e `model` são substituições opcionais por execução, não alterações persistentes de sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes ao plugin, operadores devem aderir com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugin não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, plugins podem consumir o auxiliar de runtime compartilhado em vez de
acessar o wiring de ferramentas do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de solicitação no core.
- Use provedores de pesquisa na web para transportes de pesquisa específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper de ferramenta do agente.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tratar a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operador. Elas servem para Webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de plugin com identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com autenticação de gateway é implicitamente uma superfície de admin. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugin.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado ao plugin.
- `openclaw/plugin-sdk/config-schema` para a exportação do schema Zod raiz de `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` para wiring compartilhado de
  configuração/autenticação/resposta/Webhook. `channel-inbound` é a casa compartilhada para debounce, correspondência de menções,
  auxiliares de política de menção de entrada, formatação de envelope e auxiliares de contexto
  de envelope de entrada.
  `channel-setup` é o seam restrito de configuração para instalação opcional.
  `setup-runtime` é a superfície de configuração segura em runtime usada por `setupEntry` /
  inicialização adiada, incluindo adaptadores de patch de configuração seguros para importação.
  `setup-adapter-runtime` é o seam de adaptador de configuração de conta sensível a ambiente.
  `setup-tools` é o seam pequeno de auxiliares de CLI/arquivo/docs (`formatCliCommand`,
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
  `telegram-command-config` é o seam público restrito para normalização/validação de
  comandos personalizados do Telegram e permanece disponível mesmo se a superfície de contrato incluída em pacote do
  Telegram estiver temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/Markdown/logging, incluindo
  remoção de texto visível ao assistente, auxiliares de renderização/fragmentação de Markdown, auxiliares de redação,
  auxiliares de tags de diretiva e utilitários de texto seguro.
- Seams de canal específicos para aprovação devem preferir um único contrato
  `approvalCapability` no plugin. O core então lê autenticação, entrega, renderização,
  roteamento nativo e comportamento lazy de manipulador nativo de aprovação por esse único recurso
  em vez de misturar comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um
  shim de compatibilidade para plugins antigos. Código novo deve importar as primitivas genéricas mais restritas, e o código do repositório não deve adicionar novas importações do
  shim.
- Internos de extensões incluídas em pacote permanecem privados. Plugins externos devem usar apenas
  subcaminhos `openclaw/plugin-sdk/*`. Código de core/teste do OpenClaw pode usar os
  pontos de entrada públicos do repositório sob a raiz de um pacote de plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo restrito, como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core ou de
  outra extensão.
- Divisão de ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de auxiliares/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel somente de runtime,
  `<plugin-package-root>/index.js` é o ponto de entrada do plugin incluído em pacote,
  e `<plugin-package-root>/setup-entry.js` é o ponto de entrada do plugin de configuração.
- Exemplos atuais de provedores incluídos em pacote:
  - Anthropic usa `api.js` / `contract-api.js` para auxiliares de stream do Claude como
    `wrapAnthropicProviderStream`, auxiliares de cabeçalho beta e parsing de
    `service_tier`.
  - OpenAI usa `api.js` para builders de provedor, auxiliares de modelo padrão e
    builders de provedor em tempo real.
  - OpenRouter usa `api.js` para seu builder de provedor mais auxiliares de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar auxiliares genéricos de
    `plugin-sdk/provider-stream` para uso local no repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot de configuração de runtime ativo
  quando existir, e então voltam para o arquivo de configuração resolvido em disco quando o
  OpenClaw ainda não estiver servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Ainda existe um pequeno
  conjunto de compatibilidade reservado de seams auxiliares de canal com marca de bundle. Trate-os como
  seams de manutenção/compatibilidade de bundle, não como novos alvos de importação de terceiros;
  novos contratos entre canais ainda devem chegar em subcaminhos genéricos `plugin-sdk/*` ou nos barrels locais do plugin `api.js` /
  `runtime-api.js`.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis e restritas. Os subcaminhos mais novos de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho com
  plugins incluídos em pacote e externos.
  Parsing/correspondência de alvo pertence a `openclaw/plugin-sdk/channel-targets`.
  Barreiras de ação de mensagem e auxiliares de message-id de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels auxiliares específicos de extensões incluídas em pacote não são estáveis por padrão. Se um
  auxiliar for necessário apenas para uma extensão incluída em pacote, mantenha-o atrás do
  seam local `api.js` ou `runtime-api.js` da extensão em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novos seams auxiliares compartilhados devem ser genéricos, não com marca de canal. O parsing compartilhado
  de alvo pertence a `openclaw/plugin-sdk/channel-targets`; internos específicos de canal
  ficam atrás do seam local `api.js` ou `runtime-api.js` do plugin proprietário.
- Subcaminhos específicos de capacidade como `image-generation`,
  `media-understanding` e `speech` existem porque plugins nativos/incluídos em pacote os usam
  hoje. Sua presença, por si só, não significa que todo auxiliar exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagem

Plugins devem controlar contribuições de schema específicas de canal em
`describeMessageTool(...)`. Mantenha campos específicos de provedor no plugin, não no core compartilhado.

Para fragmentos de schema portáveis compartilhados, reutilize os auxiliares genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de card

Se um formato de schema só fizer sentido para um provedor, defina-o no próprio
código-fonte desse plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem controlar a semântica de alvo específica do canal. Mantenha o
host de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca em diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular direto para resolução por id em vez de pesquisa em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando o
  core precisa de uma resolução final pertencente ao provedor após a normalização ou após
  uma falha de diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção de rota de sessão específica do provedor
  assim que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  pesquisar peers/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um id de alvo explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  pesquisa ampla em diretório.
- Mantenha ids nativos do provedor como chat ids, thread ids, JIDs, handles e room
  ids dentro de valores `target` ou de parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos baseados em configuração, como:

- peers de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo por conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica de canal e normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin controlar ids de modelo específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples baseados em chave de API ou variável de ambiente
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passada, após outros provedores implícitos

Provedores posteriores vencem em caso de colisão de chave, então plugins podem intencionalmente
substituir uma entrada integrada de provedor com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo de doctor/config
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  é suficiente para comandos do tipo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando"
em vez de falhar ou informar incorretamente que a conta não está configurada.

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

Cada entrada se torna um plugin. Se o pack listar várias extensões, o id do plugin
passa a ser `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Barreira de segurança: toda entrada em `openclaw.extensions` deve permanecer dentro do
diretório do plugin após a resolução de symlink. Entradas que escaparem do diretório do pacote serão
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências do plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de lifecycle, sem dependências de desenvolvimento em runtime). Mantenha árvores de dependência de plugin
"JS/TS puro" e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém inicialização e configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um plugin de canal no mesmo caminho de `setupEntry` durante a fase
de inicialização pre-listen do gateway, mesmo quando o canal já estiver configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir nessa mesma janela

Se sua entrada completa ainda controlar qualquer capacidade de inicialização exigida, não habilite
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos em pacote também podem publicar auxiliares de superfície de contrato apenas de configuração que o core
pode consultar antes de o runtime completo do canal ser carregado. A superfície atual
de promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal com conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo atual incluído em pacote: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma chave configurada de conta padrão
não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm preguiçosa a descoberta de superfície de contrato incluída em pacote. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso em vez de
reentrar na inicialização do canal incluído em pacote na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

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
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo do core vazios de dados fixos.

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
- `docsLabel`: substitui o texto do link da documentação
- `preferOver`: ids de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige associação explícita de conta mesmo quando só existe uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca por sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto padrão
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

Se o seu mecanismo **não** controlar o algoritmo de Compaction, mantenha `compact()`
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

## Adicionar uma nova capacidade

Quando um plugin precisar de um comportamento que não se encaixe na API atual, não contorne
o sistema de plugins com um acesso privado interno. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada a canal e formato do auxiliar de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície útil
   de capacidade tipada.
3. conecte consumidores do core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do core,
   e não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato do registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado rigidamente na visão de mundo de um
único provedor. Veja o [Cookbook de capacidades](/pt-BR/plugins/architecture)
para uma checklist concreta de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adicionar uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/auxiliar de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- wiring do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- auxiliares de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver faltando, isso geralmente é um sinal de que a capacidade
ainda não está totalmente integrada.

### Modelo de capacidade

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

- o core controla o contrato de capacidade + orquestração
- plugins de fornecedor controlam implementações de fornecedor
- plugins de recurso/canal consomem auxiliares de runtime
- testes de contrato mantêm a propriedade explícita
