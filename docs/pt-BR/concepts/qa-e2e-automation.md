---
read_when:
    - Ao estender qa-lab ou qa-channel
    - Ao adicionar cenários de QA com suporte do repositório
    - Ao criar uma automação de QA mais realista em torno do Dashboard do Gateway
summary: Estrutura privada de automação de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-09T01:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c922607d67e0f3a2489ac82bc9f510f7294ced039c1014c15b676d826441d833
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A stack privada de QA foi projetada para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste de unidade consegue.

Componentes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos seed com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA em dois painéis:

- Esquerda: Dashboard do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do gateway com suporte do Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para uma iteração mais rápida na UI do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind-mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando há alterações, e o navegador recarrega automaticamente quando o hash
dos recursos do QA Lab muda.

## Seeds com suporte do repositório

Os recursos seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Eles ficam intencionalmente no git para que o plano de QA fique visível tanto para humanos quanto para o
agente. A lista básica deve permanecer ampla o suficiente para cobrir:

- conversa por DM e em canal
- comportamento de thread
- ciclo de vida das ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura do repositório e da documentação
- uma pequena tarefa de compilação, como Lobster Invaders

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo do barramento observado.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias refs de modelo reais
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

O comando executa processos filho locais do gateway de QA, não Docker. Os cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e depois executar turnos normais de usuário,
como conversa, ajuda no workspace e pequenas tarefas com arquivos. Não se deve dizer ao modelo
candidato que ele está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e então pede aos modelos juízes em modo fast com
raciocínio `xhigh` que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar providers: o prompt do juiz ainda recebe
cada transcrição e status da execução, mas as refs candidatas são substituídas por rótulos neutros
como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após o
parse.
As execuções dos candidatos usam `high` thinking por padrão, com `xhigh` para modelos OpenAI que
oferecem suporte a isso. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e o formato antigo `--model-thinking <provider/model=level>` é
mantido por compatibilidade.
As refs candidatas da OpenAI usam modo fast por padrão para que o processamento prioritário seja usado quando
o provider oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma substituição. Passe `--fast` apenas quando quiser
forçar o modo fast para todos os modelos candidatos. As durações dos candidatos e dos juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente para
não classificar por velocidade.
As execuções dos modelos candidatos e juízes usam simultaneidade 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provider ou pressão no gateway local
tornarem uma execução barulhenta demais.
Quando nenhum `--model` candidato é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
