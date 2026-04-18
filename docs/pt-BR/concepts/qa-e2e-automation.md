---
read_when:
    - Estendendo o qa-lab ou o qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA com maior realismo em torno do painel do Gateway
summary: Formato privado de automação de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-18T05:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf8c5f74e8fabdc8e9fd7ecd41afce8b60354c7dd24d92ac926d3c527927cd4
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A pilha privada de QA foi projetada para exercitar o OpenClaw de uma forma mais realista e com formato de canal do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread, reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição, injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos com seed mantidos no repositório para a tarefa inicial e cenários básicos de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do Gateway com Docker e expõe a página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem recompilar a imagem Docker a cada vez, inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind `extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch` recompila esse bundle a cada alteração, e o navegador recarrega automaticamente quando o hash de recursos do QA Lab muda.

Para uma lane de smoke real de transporte com Matrix, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários de driver, SUT e observador, cria uma sala privada e então executa o Plugin real do Matrix dentro de um processo filho de Gateway de QA. A lane de transporte ao vivo mantém a configuração filha restrita ao transporte em teste, para que o Matrix seja executado sem `qa-channel` na configuração filha. Ela grava os artefatos estruturados do relatório e um log combinado de stdout/stderr no diretório de saída de Matrix QA selecionado. Para capturar também a saída externa de compilação/inicialização de `scripts/run-node.mjs`, defina `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local ao repositório.

Para uma lane de smoke real de transporte com Telegram, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane mira em um grupo privado real do Telegram em vez de provisionar um servidor descartável. Ela requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo grupo privado. O bot SUT precisa ter um nome de usuário no Telegram, e a observação entre bots funciona melhor quando ambos os bots têm o Bot-to-Bot Communication Mode habilitado em `@BotFather`.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma inventar seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Bloqueio por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Continuação em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | -------------------- | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                    | x                    | x                    |                  |
| Telegram | x      |                     |                        |                            |                        |                      |                      |                      | x                |

Isso mantém o `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix, Telegram e futuros transportes ao vivo compartilham uma lista explícita de verificação do contrato de transporte.

Para uma lane com VM Linux descartável sem trazer Docker para o fluxo de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários de `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo com workers isolados de Gateway por padrão, até 64 workers ou a contagem de cenários selecionada. Use `--concurrency <count>` para ajustar a quantidade de workers, ou `--concurrency 1` para execução serial.
Execuções ao vivo encaminham as entradas compatíveis de autenticação de QA que são práticas para o guest: chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e `CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest possa gravar de volta por meio do workspace montado.

## Seeds mantidos no repositório

Os recursos com seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o agente.

O `qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de documentação e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que dá suporte ao `qa-flow` pode continuar genérica e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do transporte com helpers do lado do navegador que dirigem a Control UI incorporada por meio da interface `browser.request` do Gateway sem adicionar um executor com caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não pela pasta da árvore de código-fonte. Mantenha os IDs de cenário estáveis quando os arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade de implementação.

A lista básica deve permanecer ampla o suficiente para cobrir:

- chat em DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura do repositório e da documentação
- uma pequena tarefa de compilação, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw sensível ao cenário. Ele continua sendo a lane de mock determinística padrão para QA com suporte do repositório e gates de paridade.
- `aimock` inicia um servidor de provedor baseado em AIMock para cobertura experimental de protocolo, fixture, gravação/reprodução e caos. Ele é aditivo e não substitui o despachante de cenários de `mock-openai`.

A implementação da lane de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização de servidor local, configuração de modelo do Gateway, necessidades de preparação de perfil de autenticação e flags de capacidade de live/mock. O código compartilhado de suíte e Gateway deve rotear pelo registro de provedores em vez de ramificar pelos nomes dos provedores.

## Adaptadores de transporte

O `qa-lab` é responsável por uma interface genérica de transporte para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa interface, mas o objetivo do design é mais amplo:
canais futuros, reais ou sintéticos, devem se conectar ao mesmo executor de suíte em vez de adicionar um executor de QA específico de transporte.

No nível da arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é responsável pela configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- os arquivos de cenário em Markdown sob `qa/scenarios/` definem a execução de teste; o `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada a mantenedores para novos adaptadores de canal está em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

O `qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de personalidade e estilo, execute o mesmo cenário em várias refs de modelo ao vivo e grave um relatório em Markdown avaliado:

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

O comando executa processos filhos locais de Gateway de QA, não Docker. Os cenários de avaliação de personalidade devem definir a persona por meio de `SOUL.md` e então executar turnos normais de usuário, como chat, ajuda com workspace e pequenas tarefas em arquivos. O modelo candidato não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição completa, registra estatísticas básicas da execução e depois solicita aos modelos juízes, em modo fast, com raciocínio `xhigh`, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe cada transcrição e status de execução, mas as refs dos candidatos são substituídas por rótulos neutros como `candidate-01`; o relatório remapeia as classificações para as refs reais após o parsing.
As execuções candidatas usam `high` thinking por padrão, com `xhigh` para modelos OpenAI que oferecem suporte. Substitua um candidato específico inline com `--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um fallback global, e o formato mais antigo `--model-thinking <provider/model=level>` é mantido por compatibilidade.
As refs candidatas de OpenAI usam modo fast por padrão para que o processamento prioritário seja usado quando o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um único candidato ou juiz precisar de substituição. Passe `--fast` apenas quando quiser forçar o modo fast para todos os modelos candidatos. As durações de candidatos e juízes são registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente para não classificar por velocidade.
As execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza `--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway local tornarem uma execução muito ruidosa.
Quando nenhum `--model` candidato é informado, a avaliação de personalidade usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é informado.
Quando nenhum `--judge-model` é informado, os juízes usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
