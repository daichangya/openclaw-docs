---
read_when:
    - Estendendo o qa-lab ou o qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando uma automação de QA com maior realismo em torno do painel do Gateway
summary: Formato da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-20T05:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A stack privada de QA foi projetada para exercitar o OpenClaw de uma forma mais
realista e com formato de canal do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos com seed versionados no repositório para a tarefa inicial e
  cenários de QA de linha de base.

O fluxo atual do operador de QA é um site de QA em duas telas:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do Gateway com Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind-mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle em caso de mudança, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

Para uma lane de smoke do Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável em Docker, registra
usuários temporários driver, SUT e observer, cria uma sala privada, e então executa
o Plugin real do Matrix dentro de um processo filho QA do Gateway. A lane de transporte ao vivo mantém
a configuração filha restrita ao transporte em teste, então o Matrix é executado sem
`qa-channel` na configuração filha. Ela grava os artefatos de relatório estruturado e
um log combinado de stdout/stderr no diretório de saída de QA do Matrix selecionado. Para
capturar também a saída externa de build/launcher de `scripts/run-node.mjs`, defina
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local ao repositório.

Para uma lane de smoke do Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um
servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT deve ter um nome de usuário do Telegram, e a observação
bot-para-bot funciona melhor quando ambos os bots têm o modo Bot-to-Bot Communication
ativado no `@BotFather`.
O comando encerra com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma inventar
seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Bloqueio por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                        | x                    | x                    |              |
| Telegram | x      |                     |                        |                            |                        |                          |                      |                      | x            |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma lane descartável de VM Linux sem colocar Docker no caminho do QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA
de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários de `qa suite` no host.
Execuções da suíte no host e no Multipass executam múltiplos cenários selecionados em paralelo
com workers isolados do Gateway por padrão. `qa-channel` usa por padrão concorrência
4, limitada pela quantidade de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando encerra com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta por meio do workspace montado.

## Seeds com suporte do repositório

Os recursos com seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente.

`qa-lab` deve permanecer um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de documentação e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode permanecer genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do transporte
com helpers do lado do navegador que dirigem a Control UI incorporada pela
superfície `browser.request` do Gateway sem adicionar um executor com caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não pela pasta da árvore
de código-fonte. Mantenha os IDs de cenário estáveis quando os arquivos forem movidos; use `docsRefs` e
`codeRefs` para rastreabilidade da implementação.

A lista de linha de base deve permanecer ampla o suficiente para cobrir:

- chat em DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura de repositório e de documentação
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw orientado a cenários. Ele continua sendo a lane de mock
  determinística padrão para QA com suporte do repositório e gates de paridade.
- `aimock` inicia um servidor de provedor com AIMock para cobertura experimental de protocolo,
  fixture, record/replay e caos. Ele é complementar e não substitui o dispatcher
  de cenários `mock-openai`.

A implementação da lane de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização do servidor local, configuração do modelo do Gateway,
necessidades de preparação de perfil de autenticação e flags de capacidade live/mock. O código
compartilhado da suíte e do Gateway deve passar pelo registro de provedores em vez de ramificar
com base em nomes de provedores.

## Adaptadores de transporte

`qa-lab` é responsável por uma superfície de transporte genérica para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa superfície, mas o objetivo do design é mais amplo:
futuros canais reais ou sintéticos devem se conectar ao mesmo executor da suíte
em vez de adicionar um executor de QA específico por transporte.

No nível da arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é responsável pela configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- os arquivos de cenário em Markdown em `qa/scenarios/` definem a execução do teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada para mantenedores para novos adaptadores de canal fica em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias refs de modelo ao vivo
e escreva um relatório em Markdown avaliado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do Gateway de QA, não Docker. Cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e então executar turnos normais de usuário,
como chat, ajuda de workspace e pequenas tarefas com arquivos. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada
transcrição completa, registra estatísticas básicas da execução e então solicita aos modelos julgadores, no modo fast com
raciocínio `xhigh`, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do julgador ainda recebe
cada transcrição e status da execução, mas as refs candidatas são substituídas por rótulos neutros
como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
o parsing.
As execuções candidatas usam por padrão pensamento `high`, com `xhigh` para modelos OpenAI que
o suportam. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e o formato antigo `--model-thinking <provider/model=level>` é
mantido por compatibilidade.
As refs candidatas da OpenAI usam por padrão o modo fast para que o processamento prioritário seja usado
onde o provedor der suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou julgador precisar de uma substituição. Passe `--fast` apenas quando quiser
forçar o modo fast para todos os modelos candidatos. As durações de candidatos e julgadores são
registradas no relatório para análise de benchmark, mas os prompts dos julgadores dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e julgadores usam por padrão concorrência 16. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway local
deixarem a execução muito ruidosa.
Quando nenhum `--model` candidato é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os julgadores usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
