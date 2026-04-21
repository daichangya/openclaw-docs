---
read_when:
    - Você quer trabalho em segundo plano/paralelo por meio do agente
    - Você está alterando a política da ferramenta `sessions_spawn` ou de subagentes
    - Você está implementando ou solucionando problemas em sessões de subagentes vinculadas a threads
summary: 'Subagentes: execução de agentes isolados que anunciam os resultados de volta no chat do solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-21T19:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Subagentes

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução de agente existente. Eles são executados em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta no canal de chat do solicitante. Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

## Comando slash

Use `/subagents` para inspecionar ou controlar execuções de subagentes para a **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vinculação de thread:

Esses comandos funcionam em canais que oferecem suporte a vinculações persistentes de thread. Consulte **Canais com suporte a thread** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra metadados da execução (status, timestamps, id da sessão, caminho da transcrição, limpeza).
Use `sessions_history` para uma visualização de recuperação limitada e filtrada por segurança; inspecione o caminho da
transcrição em disco quando precisar da transcrição bruta completa.

### Comportamento de spawn

`/subagents spawn` inicia um subagente em segundo plano como um comando do usuário, não como um retransmissor interno, e envia uma atualização final de conclusão de volta para o chat do solicitante quando a execução termina.

- O comando de spawn não é bloqueante; ele retorna um id de execução imediatamente.
- Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta no canal de chat do solicitante.
- A entrega da conclusão é baseada em push. Depois de iniciar, não faça polling em `/subagents list`,
  `sessions_list` ou `sessions_history` em um loop apenas para esperar a
  conclusão; inspecione o status somente sob demanda para depuração ou intervenção.
- Ao concluir, o OpenClaw faz o melhor esforço para fechar abas/processos do navegador rastreados que foram abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.
- Para spawns manuais, a entrega é resiliente:
  - O OpenClaw tenta primeiro a entrega direta por `agent` com uma chave de idempotência estável.
  - Se a entrega direta falhar, ele recorre ao roteamento por fila.
  - Se o roteamento por fila ainda não estiver disponível, o anúncio será repetido com um backoff exponencial curto antes da desistência final.
- A entrega da conclusão mantém a rota resolvida do solicitante:
  - rotas de conclusão vinculadas a thread ou à conversa têm prioridade quando disponíveis
  - se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o destino/conta ausente a partir da rota resolvida da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione
- O repasse da conclusão para a sessão do solicitante é um contexto interno gerado em tempo de execução (não texto escrito pelo usuário) e inclui:
  - `Result` (texto da resposta `assistant` visível mais recente ou, caso contrário, texto mais recente sanitizado de tool/toolResult; execuções com falha terminal não reutilizam texto de resposta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/tokens
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem os padrões para essa execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é o modo de uso único (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões do harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e consulte [Agentes ACP](/pt-BR/tools/acp-agents).

Objetivos principais:

- Paralelizar trabalho de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter subagentes isolados por padrão (separação de sessão + sandbox opcional).
- Manter a superfície da ferramenta difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestrador.

Observação sobre custo: cada subagente tem seu **próprio** contexto e uso de tokens. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes e mantenha seu agente principal em um modelo de maior qualidade.
Você pode configurar isso por meio de `agents.defaults.subagents.model` ou com substituições por agente.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagente (`deliver: false`, faixa global: `subagent`)
- Em seguida, executa uma etapa de anúncio e publica a resposta do anúncio no canal de chat do solicitante
- Modelo padrão: herda o chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda tem prioridade.
- Thinking padrão: herda o chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda tem prioridade.
- Timeout padrão da execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, usa `0` (sem timeout).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; inicia sob outro id de agente, se permitido)
- `model?` (opcional; substitui o modelo do subagente; valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui o nível de thinking para a execução do subagente)
- `runTimeoutSeconds?` (o padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, a execução do subagente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vinculação de thread do canal para esta sessão de subagente)
- `mode?` (`run|session`)
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o padrão passa a ser `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita o spawn a menos que o runtime filho de destino esteja em sandbox)
- `sessions_spawn` **não** aceita parâmetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` a partir da execução iniciada.

## Sessões vinculadas a thread

Quando as vinculações de thread estão habilitadas para um canal, um subagente pode permanecer vinculado a uma thread para que mensagens subsequentes do usuário nessa thread continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a thread

- Discord (atualmente o único canal com suporte): oferece suporte a sessões persistentes de subagentes vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chaves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenClaw cria ou vincula uma thread a esse destino de sessão no canal ativo.
3. Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o desafoco automático por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um destino de subagente/sessão.
- `/unfocus` remove a vinculação da thread atualmente vinculada.
- `/agents` lista execuções ativas e o estado da vinculação (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` só funcionam para threads vinculadas em foco.

Opções de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- A substituição por canal e as chaves de vinculação automática no spawn são específicas do adaptador. Consulte **Canais com suporte a thread** acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e [Comandos slash](/pt-BR/tools/slash-commands) para os detalhes atuais do adaptador.

Lista de permissões:

- `agents.list[].subagents.allowAgents`: lista de ids de agentes que podem ser direcionados via `agentId` (`["*"]` para permitir qualquer um). Padrão: apenas o agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permissões padrão de agentes de destino usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
- Proteção de herança de sandbox: se a sessão do solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando verdadeiro, bloqueia chamadas `sessions_spawn` que omitem `agentId` (força seleção explícita de perfil). Padrão: false.

Descoberta:

- Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para `sessions_spawn`.

Arquivamento automático:

- Sessões de subagentes são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (na mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por meio de renomeação).
- O arquivamento automático é por melhor esforço; timers pendentes são perdidos se o Gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos do navegador rastreados são fechados por melhor esforço quando a execução termina, mesmo que o registro da sessão/transcrição seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestrador**: principal → subagente orquestrador → sub-subagentes trabalhadores.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permite que subagentes iniciem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência da faixa (padrão: 8)
        runTimeoutSeconds: 900, // timeout padrão para sessions_spawn quando omitido (0 = sem timeout)
      },
    },
  },
}
```

### Níveis de profundidade

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando depth 2 é permitido) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1)
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal
3. O agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

Orientação operacional:

- Inicie o trabalho filho uma vez e aguarde eventos de conclusão em vez de criar loops de polling
  em torno de `sessions_list`, `sessions_history`, `/subagents list` ou
  comandos `exec` sleep.
- Se um evento de conclusão de filho chegar depois que você já enviou a resposta final,
  a continuação correta é o token silencioso exato `NO_REPLY` / `no_reply`.

### Política de ferramentas por profundidade

- A função e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão simples ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Depth 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: Recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gerenciar seus filhos. Outras ferramentas de sessão/sistema permanecem negadas.
- **Depth 1 (folha, quando `maxSpawnDepth == 1`)**: Nenhuma ferramenta de sessão (comportamento padrão atual).
- **Depth 2 (trabalhador folha)**: Nenhuma ferramenta de sessão — `sessions_spawn` é sempre negado em profundidade 2. Não pode iniciar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos ao mesmo tempo. Isso evita fan-out descontrolado de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e faz cascata para seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e faz cascata.

## Autenticação

A autenticação de subagentes é resolvida por **id do agente**, não por tipo de sessão:

- A chave de sessão do subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como **fallback**; perfis do agente substituem perfis do principal em caso de conflito.

Observação: a mesclagem é aditiva, então os perfis do principal estão sempre disponíveis como fallback. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Os subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não da sessão do solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistant for o token silencioso exato `NO_REPLY` / `no_reply`,
  a saída do anúncio será suprimida, mesmo que tenha havido progresso visível antes.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada de `agent` de acompanhamento com entrega externa (`deliver=true`)
  - sessões aninhadas de subagentes solicitantes recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar os resultados dos filhos dentro da sessão
  - se uma sessão aninhada de subagente solicitante não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível
- Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro resolve qualquer rota de conversa/thread vinculada e substituição de hook, depois preenche campos ausentes de destino de canal a partir da rota armazenada da sessão solicitante. Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão identifica apenas o canal.
- A agregação de conclusões de filhos é limitada à execução solicitante atual ao criar achados de conclusão aninhados, impedindo que saídas antigas de filhos de execuções anteriores vazem para o anúncio atual.
- Respostas de anúncio preservam o roteamento de thread/tópico quando disponível nos adaptadores de canal.
- O contexto do anúncio é normalizado em um bloco de evento interno estável:
  - origem (`subagent` ou `cron`)
  - chave/id da sessão filha
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada do resultado do runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado selecionado a partir do texto visível mais recente do assistant ou, caso contrário, do texto mais recente sanitizado de tool/toolResult; execuções com falha terminal reportam status de falha sem reproduzir texto de resposta capturado
  - uma instrução de acompanhamento descrevendo quando responder vs. permanecer em silêncio
- `Status` não é inferido a partir da saída do modelo; ele vem de sinais do resultado do runtime.
- Em caso de timeout, se o filho só chegou até chamadas de ferramenta, o anúncio pode condensar esse histórico em um breve resumo de progresso parcial em vez de reproduzir saída bruta de ferramenta.

Payloads de anúncio incluem uma linha de estatísticas no final (mesmo quando encapsulados):

- Runtime (por exemplo, `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando o preço do modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho da transcrição (para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo em disco)
- Metadados internos são destinados apenas à orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

`sessions_history` é o caminho de orquestração mais seguro:

- a recuperação do assistant é normalizada primeiro:
  - tags de thinking são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de payload XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e
    `<function_calls>...</function_calls>`, são removidos, incluindo payloads
    truncados que nunca fecham corretamente
  - estruturas degradadas de chamada/resultado de ferramenta e marcadores de contexto histórico são removidos
  - tokens de controle de modelo vazados, como `<|assistant|>`, outros tokens ASCII
    `<|...|>` e variantes de largura total `<｜...｜>` são removidos
  - XML malformado de chamada de ferramenta do MiniMax é removido
- texto semelhante a credenciais/tokens é redigido
- blocos longos podem ser truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha grande demais por
  `[sessions_history omitted: message too large]`
- a inspeção bruta da transcrição em disco é o fallback quando você precisa da transcrição completa byte a byte

## Política de ferramentas (ferramentas de subagente)

Por padrão, subagentes recebem **todas as ferramentas, exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo uma visualização de recuperação limitada e sanitizada aqui também; não é
um despejo bruto de transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 também recebem `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para poder gerenciar seus filhos.

Substitua via configuração:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny tem prioridade
        deny: ["gateway", "cron"],
        // se allow estiver definido, passa a ser somente allow (deny ainda tem prioridade)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concorrência

Subagentes usam uma faixa dedicada de fila em processo:

- Nome da faixa: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Interrupção

- Enviar `/stop` no chat do solicitante aborta a sessão do solicitante e interrompe quaisquer execuções ativas de subagentes iniciadas a partir dela, em cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e faz cascata para seus filhos.

## Limitações

- O anúncio de subagente é por **melhor esforço**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto de subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ou `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). Profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita filhos ativos por sessão (padrão: 5, intervalo: 1–20).
