---
read_when:
    - Você quer entender quais ferramentas de sessão o agente tem
    - Você quer configurar acesso entre sessões ou criação de subagentes
    - Você quer inspecionar status ou controlar subagentes criados
summary: Ferramentas do agente para status entre sessões, recordação, mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-04-05T12:40:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Ferramentas de sessão

O OpenClaw fornece aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta         | O que faz                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Lista sessões com filtros opcionais (tipo, recência)                      |
| `sessions_history` | Lê a transcrição de uma sessão específica                                  |
| `sessions_send`    | Envia uma mensagem para outra sessão e opcionalmente aguarda               |
| `sessions_spawn`   | Cria uma sessão isolada de subagente para trabalho em segundo plano        |
| `sessions_yield`   | Encerra o turno atual e aguarda resultados posteriores de subagentes       |
| `subagents`        | Lista, orienta ou encerra subagentes criados para esta sessão              |
| `session_status`   | Mostra um cartão no estilo de `/status` e opcionalmente define uma substituição de modelo por sessão |

## Listando e lendo sessões

`sessions_list` retorna sessões com sua chave, tipo, canal, modelo, contagens de
tokens e timestamps. Filtre por tipo (`main`, `group`, `cron`, `hook`,
`node`) ou recência (`activeMinutes`).

`sessions_history` busca a transcrição da conversa de uma sessão específica.
Por padrão, resultados de ferramenta são excluídos -- passe `includeTools: true` para vê-los.
A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recordação:
  - tags de pensamento são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo payloads
    truncados que nunca se fecham corretamente
  - estruturas degradadas de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidas
  - tokens de controle de modelo vazados, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes full-width `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta do MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos longos de texto são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a ferramenta informa flags de resumo como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão**
de uma chamada anterior de listagem.

Se você precisar da transcrição exata, byte por byte, inspecione o arquivo de transcrição em
disco em vez de tratar `sessions_history` como um dump bruto.

## Enviando mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e opcionalmente aguarda
a resposta:

- **Fire-and-forget:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Aguardar resposta:** defina um timeout e receba a resposta inline.

Depois que o alvo responde, o OpenClaw pode executar um **loop de resposta**
em que os agentes alternam mensagens (até 5 turnos). O agente alvo pode responder
`REPLY_SKIP` para parar antes.

## Helpers de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual
ou outra sessão visível. Ela informa uso, tempo, estado do modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Assim como `/status`, ela pode preencher
contadores esparsos de token/cache a partir da entrada de uso mais recente da transcrição, e
`model=default` limpa uma substituição por sessão.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser
o evento de acompanhamento que você está aguardando. Use-a após criar subagentes quando
quiser que os resultados de conclusão cheguem como a próxima mensagem em vez de construir
loops de polling.

`subagents` é o helper do plano de controle para subagentes do OpenClaw já
criados. Ele oferece suporte a:

- `action: "list"` para inspecionar execuções ativas/recentes
- `action: "steer"` para enviar orientação de acompanhamento a um filho em execução
- `action: "kill"` para parar um filho ou `all`

## Criando subagentes

`sessions_spawn` cria uma sessão isolada para uma tarefa em segundo plano. Ele é sempre
não bloqueante -- retorna imediatamente com `runId` e `childSessionKey`.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes externos de harness.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a criação a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para impor sandbox ao filho.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que
possam gerenciar seus próprios filhos. Execuções folha ainda não recebem ferramentas de
orquestração recursiva.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante.
A entrega da conclusão preserva o roteamento vinculado de thread/tópico quando disponível, e se
a origem da conclusão identificar apenas um canal, o OpenClaw ainda pode reutilizar a rota
armazenada da sessão do solicitante (`lastChannel` / `lastTo`) para entrega
direta.

Para comportamento específico de ACP, consulte [ACP Agents](/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm escopo limitado para restringir o que o agente pode ver:

| Nível   | Escopo                                      |
| ------- | ------------------------------------------- |
| `self`  | Apenas a sessão atual                       |
| `tree`  | Sessão atual + subagentes criados           |
| `agent` | Todas as sessões deste agente               |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree` independentemente da
configuração.

## Leitura adicional

- [Session Management](/concepts/session) -- roteamento, ciclo de vida, manutenção
- [ACP Agents](/tools/acp-agents) -- criação com harness externo
- [Multi-agent](/concepts/multi-agent) -- arquitetura multiagente
- [Gateway Configuration](/gateway/configuration) -- opções de configuração das ferramentas de sessão
