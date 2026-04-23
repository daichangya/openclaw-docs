---
read_when:
    - Você quer entender quais ferramentas de sessão o agente tem
    - Você quer configurar acesso entre sessões ou geração de subagentes
    - Você quer inspecionar o status ou controlar subagentes gerados
summary: Ferramentas do agente para status entre sessões, recuperação de contexto, mensagens e orquestração de subagentes
title: Ferramentas de sessão
x-i18n:
    generated_at: "2026-04-23T05:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d99408f3052f4fa461bc26bf79456e7f852069ec101b9d593442cef6dd20a3ac
    source_path: concepts/session-tool.md
    workflow: 15
---

# Ferramentas de sessão

O OpenClaw oferece aos agentes ferramentas para trabalhar entre sessões, inspecionar status e
orquestrar subagentes.

## Ferramentas disponíveis

| Ferramenta         | O que faz                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `sessions_list`    | Lista sessões com filtros opcionais (kind, label, agent, recency, preview) |
| `sessions_history` | Lê a transcrição de uma sessão específica                                  |
| `sessions_send`    | Envia uma mensagem para outra sessão e, opcionalmente, aguarda             |
| `sessions_spawn`   | Gera uma sessão isolada de subagente para trabalho em segundo plano        |
| `sessions_yield`   | Encerra o turno atual e aguarda resultados de follow-up de subagentes      |
| `subagents`        | Lista, direciona ou encerra subagentes gerados para esta sessão            |
| `session_status`   | Mostra um cartão no estilo de `/status` e, opcionalmente, define uma substituição de modelo por sessão |

## Listando e lendo sessões

`sessions_list` retorna sessões com sua chave, agentId, kind, channel, model,
contagens de tokens e timestamps. Filtre por kind (`main`, `group`, `cron`, `hook`,
`node`), `label` exato, `agentId` exato, texto de busca ou recência
(`activeMinutes`). Quando você precisa de uma triagem no estilo caixa de entrada, ele também pode solicitar
títulos derivados, prévias da última mensagem ou mensagens recentes limitadas. Leituras de prévia da
transcrição são limitadas às sessões visíveis sob a política de visibilidade configurada das
ferramentas de sessão.

`sessions_history` busca a transcrição da conversa para uma sessão específica.
Por padrão, resultados de ferramentas são excluídos — passe `includeTools: true` para vê-los.
A visualização retornada é intencionalmente limitada e filtrada por segurança:

- o texto do assistente é normalizado antes da recuperação:
  - tags de thinking são removidas
  - blocos de scaffold `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo payloads
    truncados que nunca fecham corretamente
  - scaffolds degradados de chamada/resultado de ferramenta, como `[Tool Call: ...]`,
    `[Tool Result ...]` e `[Historical context ...]`, são removidos
  - tokens vazados de controle do modelo, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes em largura total `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta do MiniMax, como `<invoke ...>` /
    `</minimax:tool_call>`, é removido
- texto semelhante a credenciais/tokens é redigido antes de ser retornado
- blocos longos de texto são truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha excessivamente grande por
  `[sessions_history omitted: message too large]`
- a ferramenta informa flags de resumo como `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` e `bytes`

Ambas as ferramentas aceitam uma **chave de sessão** (como `"main"`) ou um **ID de sessão**
de uma chamada anterior de listagem.

Se você precisar da transcrição exata, byte por byte, inspecione o arquivo de transcrição no
disco em vez de tratar `sessions_history` como um dump bruto.

## Envio de mensagens entre sessões

`sessions_send` entrega uma mensagem a outra sessão e, opcionalmente, aguarda
a resposta:

- **Fire-and-forget:** defina `timeoutSeconds: 0` para enfileirar e retornar
  imediatamente.
- **Aguardar resposta:** defina um timeout e receba a resposta inline.

Depois que o destino responder, o OpenClaw pode executar um **reply-back loop** em que os
agentes alternam mensagens (até 5 turnos). O agente de destino pode responder
`REPLY_SKIP` para parar antes.

## Auxiliares de status e orquestração

`session_status` é a ferramenta leve equivalente a `/status` para a sessão atual
ou outra sessão visível. Ela informa uso, tempo, estado do modelo/runtime e
contexto vinculado de tarefa em segundo plano quando presente. Como `/status`, ela pode preencher contadores
esparsos de tokens/cache a partir da entrada de uso mais recente da transcrição, e
`model=default` limpa uma substituição por sessão.

`sessions_yield` encerra intencionalmente o turno atual para que a próxima mensagem possa ser
o evento de follow-up que você está aguardando. Use-a depois de gerar subagentes quando
quiser que os resultados de conclusão cheguem como a próxima mensagem em vez de criar
loops de polling.

`subagents` é o auxiliar do plano de controle para subagentes do OpenClaw já
gerados. Ele oferece suporte a:

- `action: "list"` para inspecionar execuções ativas/recentes
- `action: "steer"` para enviar orientação de follow-up a um filho em execução
- `action: "kill"` para interromper um filho ou `all`

## Gerando subagentes

`sessions_spawn` cria uma sessão isolada para uma tarefa em segundo plano. Ela é sempre
não bloqueante — retorna imediatamente com um `runId` e `childSessionKey`.

Principais opções:

- `runtime: "subagent"` (padrão) ou `"acp"` para agentes de harness externos.
- Substituições de `model` e `thinking` para a sessão filha.
- `thread: true` para vincular a geração a uma thread de chat (Discord, Slack etc.).
- `sandbox: "require"` para exigir sandboxing no filho.

Subagentes folha padrão não recebem ferramentas de sessão. Quando
`maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente
`sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam
gerenciar seus próprios filhos. Execuções folha ainda não recebem ferramentas
recursivas de orquestração.

Após a conclusão, uma etapa de anúncio publica o resultado no canal do solicitante.
A entrega da conclusão preserva o roteamento vinculado de thread/tópico quando disponível, e, se
a origem da conclusão identificar apenas um canal, o OpenClaw ainda pode reutilizar a rota armazenada
da sessão solicitante (`lastChannel` / `lastTo`) para entrega
direta.

Para comportamento específico de ACP, consulte [ACP Agents](/pt-BR/tools/acp-agents).

## Visibilidade

As ferramentas de sessão têm escopo limitado para restringir o que o agente pode ver:

| Nível   | Escopo                                   |
| ------- | ---------------------------------------- |
| `self`  | Apenas a sessão atual                    |
| `tree`  | Sessão atual + subagentes gerados        |
| `agent` | Todas as sessões deste agente            |
| `all`   | Todas as sessões (entre agentes, se configurado) |

O padrão é `tree`. Sessões em sandbox são limitadas a `tree`, independentemente da
configuração.

## Leitura adicional

- [Session Management](/pt-BR/concepts/session) -- roteamento, ciclo de vida, manutenção
- [ACP Agents](/pt-BR/tools/acp-agents) -- geração com harness externo
- [Multi-agent](/pt-BR/concepts/multi-agent) -- arquitetura multiagente
- [Gateway Configuration](/pt-BR/gateway/configuration) -- controles de configuração das ferramentas de sessão
