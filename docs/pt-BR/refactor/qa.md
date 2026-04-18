---
x-i18n:
    generated_at: "2026-04-18T05:25:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# Refatoração de QA

Status: migração fundamental concluída.

## Objetivo

Mover o QA do OpenClaw de um modelo de definição dividido para uma única fonte da verdade:

- metadados do cenário
- prompts enviados ao modelo
- setup e teardown
- lógica do harness
- asserções e critérios de sucesso
- artifacts e dicas de relatório

O estado final desejado é um harness de QA genérico que carregue arquivos poderosos de definição de cenário em vez de codificar a maior parte do comportamento em TypeScript.

## Estado atual

A principal fonte da verdade agora vive em `qa/scenarios/index.md` mais um arquivo por
cenário em `qa/scenarios/<theme>/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadados canônicos do pacote de QA
  - identidade do operador
  - missão inicial
- `qa/scenarios/<theme>/*.md`
  - um arquivo Markdown por cenário
  - metadados do cenário
  - associações de handlers
  - configuração de execução específica do cenário
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser de pacote Markdown + validação com zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderização do plano a partir do pacote Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - semeia arquivos de compatibilidade gerados mais `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleciona cenários executáveis por meio de associações de handlers definidas em Markdown
- Protocolo do barramento de QA + UI
  - anexos inline genéricos para renderização de imagem/vídeo/áudio/arquivo

Superfícies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - ainda controla a maior parte da lógica executável de handlers personalizados
- `extensions/qa-lab/src/report.ts`
  - ainda deriva a estrutura do relatório a partir das saídas de runtime

Então a divisão da fonte da verdade foi corrigida, mas a execução ainda é em grande parte baseada em handlers, e não totalmente declarativa.

## Como é a superfície real de cenários

Ler a suíte atual mostra algumas classes distintas de cenários.

### Interação simples

- baseline de canal
- baseline de DM
- acompanhamento em thread
- troca de modelo
- continuidade de aprovação
- reação/edição/exclusão

### Configuração e mutação de runtime

- patch de configuração para desabilitar skill
- config apply restart wake-up
- config restart capability flip
- verificação de desvio do inventário de runtime

### Asserções de sistema de arquivos e repositório

- relatório de descoberta de source/docs
- build do Lobster Invaders
- busca de artifact de imagem gerada

### Orquestração de memória

- recuperação de memória
- ferramentas de memória em contexto de canal
- fallback de falha de memória
- classificação de memória de sessão
- isolamento de memória por thread
- varredura de Dreaming da memória

### Integração de ferramentas e plugins

- chamada de plugin-tools MCP
- visibilidade de skill
- hot install de skill
- geração nativa de imagem
- roundtrip de imagem
- entendimento de imagem a partir de anexo

### Multiturno e multiautor

- handoff de subagente
- síntese de fanout de subagente
- fluxos no estilo de recuperação após reinício

Essas categorias importam porque orientam os requisitos da DSL. Uma lista plana de prompt + texto esperado não é suficiente.

## Direção

### Fonte única da verdade

Usar `qa/scenarios/index.md` mais `qa/scenarios/<theme>/*.md` como a
fonte da verdade criada manualmente.

O pacote deve continuar sendo:

- legível por humanos em revisão
- parseável por máquina
- rico o suficiente para orientar:
  - execução da suíte
  - bootstrap do workspace de QA
  - metadados da UI do QA Lab
  - prompts de docs/discovery
  - geração de relatórios

### Formato de autoria preferido

Usar Markdown como formato de nível superior, com YAML estruturado dentro dele.

Formato recomendado:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - refs de docs
  - refs de código
  - sobrescritas de modelo/provider
  - pré-requisitos
- seções em prosa
  - objetivo
  - notas
  - dicas de depuração
- blocos YAML delimitados
  - setup
  - steps
  - assertions
  - cleanup

Isso oferece:

- melhor legibilidade em PR do que JSON gigante
- contexto mais rico do que YAML puro
- parsing estrito e validação com zod

JSON bruto é aceitável apenas como uma forma intermediária gerada.

## Formato proposto para arquivo de cenário

Exemplo:

````md
---
id: image-generation-roundtrip
title: Roundtrip de geração de imagem
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objetivo

Verificar se a mídia gerada é reanexada no turno de acompanhamento.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Verificação de geração de imagem: gere uma imagem de um farol de QA e resuma-a em uma frase curta.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Verificação de geração de imagem
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Verificação de inspeção de roundtrip de imagem: descreva o anexo da imagem do farol gerado em uma frase curta.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: farol
- assert: requestLog.matches
  where:
    promptIncludes: Verificação de inspeção de roundtrip de imagem
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Recursos de runner que a DSL precisa cobrir

Com base na suíte atual, o runner genérico precisa de mais do que execução de prompts.

### Ações de ambiente e setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Ações de turno do agente

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Ações de configuração e runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Ações de arquivo e artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Ações de memória e Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Ações de MCP

- `mcp.callTool`

### Asserções

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variáveis e referências de artifact

A DSL precisa oferecer suporte a saídas salvas e referências posteriores.

Exemplos da suíte atual:

- criar uma thread e depois reutilizar `threadId`
- criar uma sessão e depois reutilizar `sessionKey`
- gerar uma imagem e depois anexar o arquivo no próximo turno
- gerar uma string de marcador de wake e depois verificar que ela aparece mais tarde

Recursos necessários:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referências tipadas para caminhos, chaves de sessão, ids de thread, marcadores, saídas de ferramentas

Sem suporte a variáveis, o harness continuará vazando lógica de cenário de volta para o TypeScript.

## O que deve permanecer como escape hatch

Um runner totalmente declarativo puro não é realista na fase 1.

Alguns cenários são inerentemente pesados em orquestração:

- varredura de Dreaming da memória
- config apply restart wake-up
- config restart capability flip
- resolução de artifact de imagem gerada por timestamp/caminho
- avaliação de relatório de descoberta

Por enquanto, estes devem usar handlers personalizados explícitos.

Regra recomendada:

- 85-90% declarativo
- steps com `customHandler` explícito para o restante mais difícil
- apenas handlers personalizados nomeados e documentados
- nenhum código inline anônimo no arquivo de cenário

Isso mantém o mecanismo genérico limpo e ainda permite avançar.

## Mudança de arquitetura

### Atual

O Markdown de cenários já é a fonte da verdade para:

- execução da suíte
- arquivos de bootstrap do workspace
- catálogo de cenários da UI do QA Lab
- metadados de relatório
- prompts de discovery

Compatibilidade gerada:

- o workspace semeado ainda inclui `QA_KICKOFF_TASK.md`
- o workspace semeado ainda inclui `QA_SCENARIO_PLAN.md`
- o workspace semeado agora também inclui `QA_SCENARIOS.md`

## Plano de refatoração

### Fase 1: loader e schema

Concluído.

- adicionado `qa/scenarios/index.md`
- cenários divididos em `qa/scenarios/<theme>/*.md`
- adicionado parser para conteúdo nomeado de pacote Markdown YAML
- validado com zod
- consumidores alterados para usar o pacote parseado
- removidos `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` no nível do repositório

### Fase 2: mecanismo genérico

- dividir `extensions/qa-lab/src/suite.ts` em:
  - loader
  - mechanism
  - registro de ações
  - registro de asserções
  - handlers personalizados
- manter as funções auxiliares existentes como operações do mecanismo

Entregável:

- o mecanismo executa cenários declarativos simples

Começar com cenários que são principalmente prompt + espera + asserção:

- acompanhamento em thread
- entendimento de imagem a partir de anexo
- visibilidade e invocação de skill
- baseline de canal

Entregável:

- primeiros cenários reais definidos em Markdown sendo entregues pelo mecanismo genérico

### Fase 4: migrar cenários intermediários

- roundtrip de geração de imagem
- ferramentas de memória em contexto de canal
- classificação de memória de sessão
- handoff de subagente
- síntese de fanout de subagente

Entregável:

- variáveis, artifacts, asserções de ferramenta e asserções de log de requisição comprovados

### Fase 5: manter cenários difíceis em handlers personalizados

- varredura de Dreaming da memória
- config apply restart wake-up
- config restart capability flip
- desvio de inventário de runtime

Entregável:

- mesmo formato de autoria, mas com blocos explícitos de steps personalizados quando necessário

### Fase 6: excluir mapa de cenários codificado

Quando a cobertura do pacote for boa o suficiente:

- remover a maior parte do branching específico por cenário em TypeScript de `extensions/qa-lab/src/suite.ts`

## Suporte a Fake Slack / mídia rica

O barramento de QA atual é orientado a texto.

Arquivos relevantes:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Hoje o barramento de QA oferece suporte a:

- texto
- reações
- threads

Ele ainda não modela anexos de mídia inline.

### Contrato de transporte necessário

Adicionar um modelo genérico de anexo do barramento de QA:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Depois adicionar `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Por que genérico primeiro

Não criar um modelo de mídia exclusivo para Slack.

Em vez disso:

- um modelo genérico de transporte de QA
- múltiplos renderizadores sobre ele
  - chat atual do QA Lab
  - futuro fake Slack web
  - quaisquer outras visualizações de transporte fake

Isso evita lógica duplicada e permite que cenários de mídia permaneçam independentes do transporte.

### Trabalho de UI necessário

Atualizar a UI de QA para renderizar:

- pré-visualização inline de imagem
- player de áudio inline
- player de vídeo inline
- chip de anexo de arquivo

A UI atual já consegue renderizar threads e reações, então a renderização de anexos deve se sobrepor ao mesmo modelo de cartão de mensagem.

### Trabalho de cenário habilitado pelo transporte de mídia

Assim que os anexos passarem pelo barramento de QA, poderemos adicionar cenários mais ricos de chat fake:

- resposta inline com imagem em fake Slack
- entendimento de anexo de áudio
- entendimento de anexo de vídeo
- ordenação mista de anexos
- resposta em thread com mídia preservada

## Recomendação

O próximo bloco de implementação deve ser:

1. adicionar loader de cenário em Markdown + schema zod
2. gerar o catálogo atual a partir de Markdown
3. migrar primeiro alguns cenários simples
4. adicionar suporte genérico a anexos no barramento de QA
5. renderizar imagem inline na UI de QA
6. depois expandir para áudio e vídeo

Este é o menor caminho que comprova ambos os objetivos:

- QA genérico definido em Markdown
- superfícies mais ricas de mensagens fake

## Perguntas em aberto

- se os arquivos de cenário devem permitir templates de prompt em Markdown incorporados com interpolação de variáveis
- se setup/cleanup devem ser seções nomeadas ou apenas listas ordenadas de ações
- se as referências de artifacts devem ser fortemente tipadas no schema ou baseadas em string
- se handlers personalizados devem ficar em um único registro ou em registros por surface
- se o arquivo de compatibilidade JSON gerado deve continuar versionado durante a migração
