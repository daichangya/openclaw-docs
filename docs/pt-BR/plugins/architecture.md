---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entender o modelo de capacidade do Plugin ou os limites de propriedade
    - Trabalhar no pipeline de carregamento ou no registro de plugins
    - Implementar hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidade, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-24T08:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Esta é a **referência profunda de arquitetura** para o sistema de plugins do OpenClaw. Para
guias práticos, comece por uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, ativar e solucionar problemas de plugins.
  </Card>
  <Card title="Criando plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provedor" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelo.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidade

Capabilities são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw registra uma ou mais types de capability:

| Capability             | Método de registro                             | Plugins de exemplo                    |
| ---------------------- | ---------------------------------------------- | ------------------------------------- |
| Inferência de texto    | `api.registerProvider(...)`                    | `openai`, `anthropic`                 |
| Backend de inferência da CLI | `api.registerCliBackend(...)`            | `openai`, `anthropic`                 |
| Fala                   | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`             |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`       | `openai`                              |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                    |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax`  |
| Geração de música      | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                   |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`     | `qwen`                                |
| Busca na web           | `api.registerWebFetchProvider(...)`            | `firecrawl`                           |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`           | `google`                              |
| Canal / mensagens      | `api.registerChannel(...)`                     | `msteams`, `matrix`                   |
| Descoberta de Gateway  | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                             |

Um plugin que registra zero capabilities, mas fornece hooks, ferramentas, serviços de descoberta
ou serviços em segundo plano é um plugin **legado somente com hooks**. Esse padrão
continua totalmente compatível.

### Posição sobre compatibilidade externa

O modelo de capability já está incorporado ao core e é usado por plugins
incluídos/nativos hoje, mas a compatibilidade com plugins externos ainda precisa de um critério mais rígido do que "está exportado, portanto está congelado".

| Situação do plugin                             | Orientação                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                    | Mantenha integrações baseadas em hooks funcionando; essa é a linha de base de compatibilidade.  |
| Novos plugins incluídos/nativos                | Prefira registro explícito de capability em vez de acessos específicos a fornecedor ou novos designs somente com hooks. |
| Plugins externos adotando registro de capability | Permitido, mas trate superfícies auxiliares específicas de capability como algo em evolução, a menos que a documentação as marque como estáveis. |

O registro de capability é a direção pretendida. Hooks legados continuam sendo o
caminho mais seguro para evitar quebras em plugins externos durante a transição. Nem todos os
subcaminhos auxiliares exportados são equivalentes — prefira contratos documentados e
restritos em vez de exportações auxiliares incidentais.

### Formatos de plugin

O OpenClaw classifica todo plugin carregado em um formato com base no seu comportamento
real de registro (não apenas em metadados estáticos):

- **plain-capability**: registra exatamente um tipo de capability (por exemplo, um
  plugin somente de provedor como `mistral`).
- **hybrid-capability**: registra múltiplos tipos de capability (por exemplo,
  `openai` controla inferência de texto, fala, entendimento de mídia e geração
  de imagem).
- **hook-only**: registra apenas hooks (tipados ou personalizados), sem capabilities,
  ferramentas, comandos ou serviços.
- **non-capability**: registra ferramentas, comandos, serviços ou rotas, mas nenhuma
  capability.

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento de
capability de um plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- removê-lo apenas quando o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você pode ver
um destes rótulos:

| Sinal                     | Significado                                               |
| ------------------------- | --------------------------------------------------------- |
| **config valid**          | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**        | O plugin usa `before_agent_start`, que está obsoleto      |
| **hard error**            | A configuração é inválida ou o plugin falhou ao carregar  |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje:
`hook-only` é apenas informativo, e `before_agent_start` gera apenas um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de plugins e plugins incluídos. A descoberta lê primeiro manifestos nativos
   `openclaw.plugin.json`, além de manifestos de bundle compatíveis.
2. **Ativação + validação**
   O core decide se um plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados no processo via jiti e registram
   capabilities em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de
   provedores, hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- os metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar na primeira invocação

Isso mantém o código de CLI controlado pelo plugin dentro do plugin, ao mesmo tempo em que permite que o OpenClaw
reserve nomes de comandos raiz antes do parsing.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite que o OpenClaw valide configuração, explique plugins ausentes/desativados e
crie dicas de UI/schema antes de o runtime completo estar ativo.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins
são relevantes para um comando, provedor, canal, rota, harness de agente ou
capability concretos antes de carregar registros de runtime mais amplos.

O planejador mantém o comportamento atual do manifesto compatível:

- campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` e hooks continuam sendo o fallback de propriedade do manifesto
- a API do planejador somente com ids continua disponível para chamadores existentes
- a API de plano informa rótulos de motivo para que diagnósticos possam distinguir dicas explícitas de fallback de propriedade

Não trate `activation` como hook de ciclo de vida nem como substituto de
`register(...)`. São metadados usados para restringir carregamento. Prefira campos de
propriedade quando eles já descreverem o relacionamento; use `activation` apenas para dicas extras ao planejador.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma ferramenta `message` compartilhada no core, e
plugins de canal controlam a descoberta e a execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host compartilhado da ferramenta `message`, a integração com prompt,
  o gerenciamento de sessão/thread e o despacho de execução
- plugins de canal controlam a descoberta de ações com escopo, a descoberta de capability e quaisquer fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversação de sessão específica do provedor, como
  ids de conversa codificam ids de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio do seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capabilities e contribuições de schema
juntas, para que essas partes não se desencontrem.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma fonte de mídia, como um
caminho local ou URL remota de mídia, o plugin também deve retornar
`mediaSourceParams` em `describeMessageTool(...)`. O core usa essa lista explícita
para aplicar normalização de caminho no sandbox e dicas de acesso de mídia de saída
sem codificar nomes de parâmetros controlados pelo plugin.
Prefira mapas com escopo de ação ali, não uma lista plana para o canal inteiro, para que um
parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas, como
`send`.

O core passa escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso é importante para plugins sensíveis a contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, no ambiente/sala/thread/mensagem atual ou
na identidade confiável do solicitante, sem codificar branches específicos do canal no
tool `message` do core.

É por isso que mudanças no roteamento do embedded-runner continuam sendo trabalho de plugin: o runner é
responsável por encaminhar a identidade atual do chat/sessão para o limite de
descoberta do plugin, para que a ferramenta compartilhada `message` exponha a superfície correta
controlada pelo canal para o turno atual.

Para auxiliares de execução controlados pelo canal, plugins incluídos devem manter o runtime de execução
dentro dos seus próprios módulos de extensão. O core não controla mais os runtimes de ação de mensagem de Discord,
Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins incluídos
devem importar seu próprio código local de runtime diretamente de seus
módulos controlados pela extensão.

O mesmo limite se aplica em geral a seams do SDK nomeadas por provedor: o core não deve
importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, deve consumir o
próprio barrel `api.ts` / `runtime-api.ts` do plugin incluído ou promover a necessidade
para uma capability genérica e restrita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semânticas de
  enquete específicas de canal ou parâmetros extras de enquete

Agora o core adia o parsing compartilhado de enquete até que o despacho de enquete do plugin recuse
a ação, para que manipuladores de enquete controlados pelo plugin possam aceitar campos
de enquete específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquete.

Consulte [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capability

O OpenClaw trata um plugin nativo como o limite de propriedade para uma **empresa** ou um
**recurso**, não como um conjunto solto de integrações sem relação.

Isso significa:

- um plugin de empresa normalmente deve controlar todas as superfícies do OpenClaw
  voltadas para essa empresa
- um plugin de recurso normalmente deve controlar toda a superfície do recurso
  que ele introduz
- canais devem consumir capabilities compartilhadas do core em vez de reimplementar
  comportamento de provedor de forma ad hoc

<Accordion title="Exemplos de padrões de propriedade entre plugins incluídos">
  - **Fornecedor com múltiplas capabilities**: `openai` controla inferência de texto, fala, voz em tempo real, entendimento de mídia e geração de imagem. `google` controla inferência de texto, mais entendimento de mídia, geração de imagem e pesquisa na web. `qwen` controla inferência de texto, mais entendimento de mídia e geração de vídeo.
  - **Fornecedor com capability única**: `elevenlabs` e `microsoft` controlam fala;
    `firecrawl` controla busca na web; `minimax` / `mistral` / `moonshot` / `zai` controlam
    backends de entendimento de mídia.
  - **Plugin de recurso**: `voice-call` controla transporte de chamadas, ferramentas, CLI, rotas
    e integração de fluxo de mídia do Twilio, mas consome capabilities compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar diretamente plugins de fornecedores.
</Accordion>

O estado final pretendido é:

- a OpenAI vive em um único plugin, mesmo que cubra modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles consomem o
  contrato de capability compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capability** = contrato do core que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
"qual provedor deve codificar o tratamento de vídeo diretamente?" A primeira pergunta é "qual é
o contrato de capability de vídeo do core?" Quando esse contrato existir, plugins de fornecedores
podem registrar implementações nele, e plugins de canal/recurso podem consumi-lo.

Se a capability ainda não existir, a ação correta normalmente é:

1. definir a capability ausente no core
2. expô-la pela API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capability
4. permitir que plugins de fornecedores registrem implementações

Isso mantém a propriedade explícita, evitando ao mesmo tempo comportamentos no core que dependam de um
único fornecedor ou de um caminho de código específico de plugin e pontual.

### Camadas de capability

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capability do core**: orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagem, backends futuros de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome capabilities do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla a política de TTS no momento da resposta, ordem de fallback, preferências e entrega no canal
- `openai`, `elevenlabs` e `microsoft` controlam as implementações de síntese
- `voice-call` consome o helper de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capabilities futuras.

### Exemplo de plugin de empresa com múltiplas capabilities

Um plugin de empresa deve parecer coeso do lado de fora. Se o OpenClaw tiver
contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor pode controlar todas as suas superfícies em um só lugar:

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
        // lógica de credenciais + busca
      }),
    );
  },
};

export default plugin;
```

O que importa não são os nomes exatos dos helpers. O que importa é o formato:

- um único plugin controla a superfície do fornecedor
- o core continua controlando os contratos de capability
- plugins de canal e de recurso consomem helpers de `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar que o plugin registrou as capabilities que ele
  afirma controlar

### Exemplo de capability: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única
capability compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de entendimento de mídia
2. plugins de fornecedores registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. plugins de canal e de recurso consomem o comportamento compartilhado do core em vez de
   se conectarem diretamente ao código do fornecedor

Isso evita embutir no core as suposições de vídeo de um único provedor. O plugin controla
a superfície do fornecedor; o core controla o contrato de capability e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado
de capability e o helper de runtime, e plugins de fornecedores registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de um checklist concreto de rollout? Consulte
[Cookbook de Capability](/pt-BR/plugins/architecture).

## Contratos e enforcement

A superfície da API de plugins é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugins recebem um único padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  id de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins incluídos e evitar desvios silenciosos

Há duas camadas de enforcement:

1. **enforcement de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   ids de provedor duplicados, ids duplicados de provedor de fala e registros malformados geram diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins incluídos são capturados em registros de contrato durante execuções de teste para que
   o OpenClaw possa verificar explicitamente a propriedade. Hoje isso é usado para
   provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade
   de registro de plugins incluídos.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin controla qual
superfície. Isso permite que o core e os canais componham sem atrito, porque a propriedade é
declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos por capability
- controlados pelo core
- reutilizáveis por vários plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Contratos ruins de plugin são:

- política específica de fornecedor escondida no core
- escapes pontuais de plugin que ignoram o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capability e depois
permita que os plugins se conectem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **no processo** com o Gateway. Eles não
são isolados. Um plugin nativo carregado tem o mesmo limite de confiança no nível do processo que o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um plugin nativo pode derrubar ou desestabilizar o gateway
- um plugin nativo malicioso equivale a execução arbitrária de código dentro do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills incluídas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins que não sejam incluídos.
Trate plugins de workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacote de workspace incluídos, mantenha o id do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote expuser intencionalmente um papel de plugin mais restrito.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo id de um plugin incluído intencionalmente sobrepõe
  a cópia incluída quando esse plugin de workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.
- A confiança em plugin incluído é resolvida a partir do snapshot de origem — o manifesto e o
  código em disco no momento do carregamento — e não a partir de metadados de instalação. Um registro de instalação corrompido
  ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin incluído
  além do que a origem real declara.

## Limite de exportação

O OpenClaw exporta capabilities, não conveniências de implementação.

Mantenha o registro de capability público. Reduza exportações de helpers que não sejam contratos:

- subcaminhos auxiliares específicos de plugins incluídos
- subcaminhos de plumbing de runtime não destinados a API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que sejam detalhes de implementação

Alguns subcaminhos auxiliares de plugins incluídos ainda permanecem no mapa de exportação
gerado do SDK por compatibilidade e manutenção de plugins incluídos. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exportações reservadas de detalhe de implementação, não como o padrão recomendado de SDK para
novos plugins de terceiros.

## Internos e referência

Para pipeline de carregamento, modelo de registro, hooks de runtime de provedor, rotas HTTP do Gateway,
schemas de ferramenta de mensagem, resolução de alvo de canal, catálogos de provedores,
plugins do mecanismo de contexto e o guia para adicionar uma nova capability, consulte
[Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Manifesto de plugin](/pt-BR/plugins/manifest)
