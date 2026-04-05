---
read_when:
    - Você quer trabalho em segundo plano/paralelo por meio do agente
    - Você está alterando `sessions_spawn` ou a política de ferramentas de subagente
    - Você está implementando ou solucionando problemas em sessões de subagente vinculadas a thread
summary: 'Subagentes: execução de agentes isolados em segundo plano que anunciam os resultados de volta ao chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-05T12:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Subagentes

Subagentes são execuções de agentes em segundo plano iniciadas a partir de uma execução de agente existente. Eles são executados em sua própria sessão (`agent:<agentId>:subagent:<uuid>`) e, quando terminam, **anunciam** seu resultado de volta ao canal de chat solicitante. Cada execução de subagente é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

## Comando de barra

Use `/subagents` para inspecionar ou controlar execuções de subagentes para a **sessão atual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vínculo com thread:

Esses comandos funcionam em canais que oferecem suporte a vínculos persistentes com thread. Consulte **Canais com suporte a thread** abaixo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` mostra os metadados da execução (status, registros de data e hora, id da sessão, caminho da transcrição, limpeza).
Use `sessions_history` para uma visualização de recordação limitada e filtrada por segurança; inspecione o caminho da transcrição no disco quando precisar da transcrição completa bruta.

### Comportamento de spawn

`/subagents spawn` inicia um subagente em segundo plano como um comando do usuário, não um encaminhamento interno, e envia uma única atualização final de conclusão de volta ao chat solicitante quando a execução termina.

- O comando de spawn não bloqueia; ele retorna um id de execução imediatamente.
- Ao concluir, o subagente anuncia uma mensagem de resumo/resultado de volta ao canal de chat solicitante.
- A entrega da conclusão é baseada em push. Depois de iniciado, não faça polling de `/subagents list`, `sessions_list` ou `sessions_history` em loop apenas para esperar a conclusão; inspecione o status somente sob demanda para depuração ou intervenção.
- Ao concluir, o OpenClaw fecha, em regime de melhor esforço, abas/processos de navegador rastreados abertos por essa sessão de subagente antes que o fluxo de limpeza do anúncio continue.
- Para spawns manuais, a entrega é resiliente:
  - O OpenClaw tenta primeiro a entrega direta por `agent` com uma chave de idempotência estável.
  - Se a entrega direta falhar, ele recorre ao roteamento por fila.
  - Se o roteamento por fila ainda não estiver disponível, o anúncio será tentado novamente com um curto recuo exponencial antes da desistência final.
- A entrega da conclusão mantém a rota solicitante resolvida:
  - rotas de conclusão vinculadas à thread ou à conversa têm prioridade quando disponíveis
  - se a origem da conclusão fornecer apenas um canal, o OpenClaw preenche o alvo/conta ausente a partir da rota resolvida da sessão solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda funcione
- O repasse da conclusão para a sessão solicitante é um contexto interno gerado em tempo de execução (não texto escrito pelo usuário) e inclui:
  - `Result` (texto da resposta `assistant` visível mais recente; caso contrário, texto mais recente de tool/toolResult sanitizado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estatísticas compactas de runtime/tokens
  - uma instrução de entrega dizendo ao agente solicitante para reescrever em voz normal de assistente (não encaminhar metadados internos brutos)
- `--model` e `--thinking` substituem os padrões para essa execução específica.
- Use `info`/`log` para inspecionar detalhes e saída após a conclusão.
- `/subagents spawn` é no modo de execução única (`mode: "run"`). Para sessões persistentes vinculadas a thread, use `sessions_spawn` com `thread: true` e `mode: "session"`.
- Para sessões de harness ACP (Codex, Claude Code, Gemini CLI), use `sessions_spawn` com `runtime: "acp"` e consulte [Agentes ACP](/pt-BR/tools/acp-agents).

Objetivos principais:

- Paralelizar trabalhos de "pesquisa / tarefa longa / ferramenta lenta" sem bloquear a execução principal.
- Manter os subagentes isolados por padrão (separação de sessão + sandbox opcional).
- Manter a superfície de ferramentas difícil de usar incorretamente: subagentes **não** recebem ferramentas de sessão por padrão.
- Oferecer suporte a profundidade de aninhamento configurável para padrões de orquestração.

Observação sobre custo: cada subagente tem seu **próprio** contexto e uso de tokens. Para tarefas pesadas ou repetitivas, defina um modelo mais barato para subagentes e mantenha seu agente principal em um modelo de maior qualidade.
Você pode configurar isso por meio de `agents.defaults.subagents.model` ou substituições por agente.

## Ferramenta

Use `sessions_spawn`:

- Inicia uma execução de subagente (`deliver: false`, faixa global: `subagent`)
- Depois executa uma etapa de anúncio e publica a resposta de anúncio no canal de chat solicitante
- Modelo padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.model` (ou `agents.list[].subagents.model` por agente); um `sessions_spawn.model` explícito ainda tem prioridade.
- Pensamento padrão: herda do chamador, a menos que você defina `agents.defaults.subagents.thinking` (ou `agents.list[].subagents.thinking` por agente); um `sessions_spawn.thinking` explícito ainda tem prioridade.
- Tempo limite padrão de execução: se `sessions_spawn.runTimeoutSeconds` for omitido, o OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` quando definido; caso contrário, recorre a `0` (sem tempo limite).

Parâmetros da ferramenta:

- `task` (obrigatório)
- `label?` (opcional)
- `agentId?` (opcional; inicia sob outro id de agente se permitido)
- `model?` (opcional; substitui o modelo do subagente; valores inválidos são ignorados e o subagente é executado no modelo padrão com um aviso no resultado da ferramenta)
- `thinking?` (opcional; substitui o nível de pensamento para a execução do subagente)
- `runTimeoutSeconds?` (o padrão é `agents.defaults.subagents.runTimeoutSeconds` quando definido, caso contrário `0`; quando definido, a execução do subagente é abortada após N segundos)
- `thread?` (padrão `false`; quando `true`, solicita vínculo do canal com thread para esta sessão de subagente)
- `mode?` (`run|session`)
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o padrão passa a ser `session`
  - `mode: "session"` exige `thread: true`
- `cleanup?` (`delete|keep`, padrão `keep`)
- `sandbox?` (`inherit|require`, padrão `inherit`; `require` rejeita o spawn a menos que o runtime filho de destino esteja em sandbox)
- `sessions_spawn` **não** aceita parâmetros de entrega por canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para entrega, use `message`/`sessions_send` a partir da execução iniciada.

## Sessões vinculadas a thread

Quando vínculos com thread estão ativados para um canal, um subagente pode permanecer vinculado a uma thread para que mensagens subsequentes do usuário nessa thread continuem sendo roteadas para a mesma sessão de subagente.

### Canais com suporte a thread

- Discord (atualmente o único canal com suporte): oferece suporte a sessões persistentes de subagente vinculadas a thread (`sessions_spawn` com `thread: true`), controles manuais de thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) e chaves do adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` e `channels.discord.threadBindings.spawnSubagentSessions`.

Fluxo rápido:

1. Inicie com `sessions_spawn` usando `thread: true` (e opcionalmente `mode: "session"`).
2. O OpenClaw cria uma thread ou a vincula a esse destino de sessão no canal ativo.
3. Respostas e mensagens de acompanhamento nessa thread são roteadas para a sessão vinculada.
4. Use `/session idle` para inspecionar/atualizar o desfoco automático por inatividade e `/session max-age` para controlar o limite rígido.
5. Use `/unfocus` para desvincular manualmente.

Controles manuais:

- `/focus <target>` vincula a thread atual (ou cria uma) a um destino de subagente/sessão.
- `/unfocus` remove o vínculo da thread atualmente vinculada.
- `/agents` lista execuções ativas e o estado do vínculo (`thread:<id>` ou `unbound`).
- `/session idle` e `/session max-age` funcionam apenas para threads vinculadas em foco.

Alternâncias de configuração:

- Padrão global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- As chaves de substituição por canal e de vínculo automático no spawn são específicas do adaptador. Consulte **Canais com suporte a thread** acima.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference) e [Comandos de barra](/tools/slash-commands) para os detalhes atuais do adaptador.

Lista de permissões:

- `agents.list[].subagents.allowAgents`: lista de ids de agentes que podem ser direcionados via `agentId` (`["*"]` para permitir qualquer um). Padrão: apenas o agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permissões padrão de agentes de destino usada quando o agente solicitante não define seu próprio `subagents.allowAgents`.
- Proteção de herança de sandbox: se a sessão solicitante estiver em sandbox, `sessions_spawn` rejeita destinos que seriam executados sem sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: quando `true`, bloqueia chamadas `sessions_spawn` que omitirem `agentId` (força a seleção explícita de perfil). Padrão: false.

Descoberta:

- Use `agents_list` para ver quais ids de agentes estão atualmente permitidos para `sessions_spawn`.

Arquivamento automático:

- Sessões de subagente são arquivadas automaticamente após `agents.defaults.subagents.archiveAfterMinutes` (padrão: 60).
- O arquivamento usa `sessions.delete` e renomeia a transcrição para `*.deleted.<timestamp>` (na mesma pasta).
- `cleanup: "delete"` arquiva imediatamente após o anúncio (ainda mantém a transcrição por meio de renomeação).
- O arquivamento automático é em regime de melhor esforço; temporizadores pendentes são perdidos se o gateway reiniciar.
- `runTimeoutSeconds` **não** arquiva automaticamente; ele apenas interrompe a execução. A sessão permanece até o arquivamento automático.
- O arquivamento automático se aplica igualmente a sessões de profundidade 1 e profundidade 2.
- A limpeza do navegador é separada da limpeza de arquivamento: abas/processos de navegador rastreados são fechados em regime de melhor esforço quando a execução termina, mesmo que o registro da sessão/transcrição seja mantido.

## Subagentes aninhados

Por padrão, subagentes não podem iniciar seus próprios subagentes (`maxSpawnDepth: 1`). Você pode habilitar um nível de aninhamento definindo `maxSpawnDepth: 2`, o que permite o **padrão de orquestração**: principal → subagente orquestrador → sub-subagentes trabalhadores.

### Como habilitar

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que subagentes iniciem filhos (padrão: 1)
        maxChildrenPerAgent: 5, // máximo de filhos ativos por sessão de agente (padrão: 5)
        maxConcurrent: 8, // limite global de concorrência da faixa (padrão: 8)
        runTimeoutSeconds: 900, // tempo limite padrão para sessions_spawn quando omitido (0 = sem tempo limite)
      },
    },
  },
}
```

### Níveis de profundidade

| Profundidade | Formato da chave da sessão                  | Papel                                         | Pode iniciar?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Sempre                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestrador quando a profundidade 2 é permitida) | Somente se `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabalhador folha)             | Nunca                        |

### Cadeia de anúncio

Os resultados fluem de volta pela cadeia:

1. O trabalhador de profundidade 2 termina → anuncia ao seu pai (orquestrador de profundidade 1)
2. O orquestrador de profundidade 1 recebe o anúncio, sintetiza os resultados, termina → anuncia ao principal
3. O agente principal recebe o anúncio e entrega ao usuário

Cada nível vê apenas anúncios de seus filhos diretos.

Orientação operacional:

- Inicie o trabalho filho uma vez e espere pelos eventos de conclusão em vez de criar loops de polling em torno de `sessions_list`, `sessions_history`, `/subagents list` ou comandos `exec` com `sleep`.
- Se um evento de conclusão de filho chegar depois que você já enviou a resposta final, a ação correta de acompanhamento é o token silencioso exato `NO_REPLY` / `no_reply`.

### Política de ferramentas por profundidade

- O papel e o escopo de controle são gravados nos metadados da sessão no momento do spawn. Isso impede que chaves de sessão planas ou restauradas recuperem acidentalmente privilégios de orquestrador.
- **Profundidade 1 (orquestrador, quando `maxSpawnDepth >= 2`)**: recebe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para que possa gerenciar seus filhos. Outras ferramentas de sessão/sistema continuam negadas.
- **Profundidade 1 (folha, quando `maxSpawnDepth == 1`)**: sem ferramentas de sessão (comportamento padrão atual).
- **Profundidade 2 (trabalhador folha)**: sem ferramentas de sessão — `sessions_spawn` é sempre negado na profundidade 2. Não pode iniciar mais filhos.

### Limite de spawn por agente

Cada sessão de agente (em qualquer profundidade) pode ter no máximo `maxChildrenPerAgent` (padrão: 5) filhos ativos ao mesmo tempo. Isso evita expansão descontrolada a partir de um único orquestrador.

### Parada em cascata

Parar um orquestrador de profundidade 1 interrompe automaticamente todos os seus filhos de profundidade 2:

- `/stop` no chat principal interrompe todos os agentes de profundidade 1 e aplica a cascata a seus filhos de profundidade 2.
- `/subagents kill <id>` interrompe um subagente específico e aplica a cascata a seus filhos.
- `/subagents kill all` interrompe todos os subagentes do solicitante e aplica a cascata.

## Autenticação

A autenticação do subagente é resolvida por **id do agente**, não por tipo de sessão:

- A chave da sessão de subagente é `agent:<agentId>:subagent:<uuid>`.
- O armazenamento de autenticação é carregado do `agentDir` desse agente.
- Os perfis de autenticação do agente principal são mesclados como um **fallback**; perfis do agente substituem perfis do principal em caso de conflito.

Observação: a mesclagem é aditiva, portanto os perfis do principal estão sempre disponíveis como fallback. Autenticação totalmente isolada por agente ainda não é compatível.

## Anúncio

Subagentes reportam de volta por meio de uma etapa de anúncio:

- A etapa de anúncio é executada dentro da sessão do subagente (não na sessão solicitante).
- Se o subagente responder exatamente `ANNOUNCE_SKIP`, nada será publicado.
- Se o texto mais recente do assistente for o token silencioso exato `NO_REPLY` / `no_reply`, a saída do anúncio será suprimida mesmo que tenha havido progresso visível anterior.
- Caso contrário, a entrega depende da profundidade do solicitante:
  - sessões solicitantes de nível superior usam uma chamada `agent` de acompanhamento com entrega externa (`deliver=true`)
  - sessões solicitantes de subagente aninhado recebem uma injeção interna de acompanhamento (`deliver=false`) para que o orquestrador possa sintetizar os resultados do filho na sessão
  - se uma sessão solicitante de subagente aninhado não existir mais, o OpenClaw recorre ao solicitante dessa sessão quando disponível
- Para sessões solicitantes de nível superior, a entrega direta em modo de conclusão primeiro resolve qualquer rota vinculada de conversa/thread e substituição de hook e depois preenche campos ausentes de destino de canal a partir da rota armazenada da sessão solicitante. Isso mantém as conclusões no chat/tópico correto mesmo quando a origem da conclusão identifica apenas o canal.
- A agregação de conclusões de filhos é limitada à execução solicitante atual ao criar achados de conclusão aninhados, impedindo que saídas antigas de filhos de execuções anteriores vazem para o anúncio atual.
- As respostas de anúncio preservam o roteamento de thread/tópico quando disponível nos adaptadores de canal.
- O contexto de anúncio é normalizado em um bloco estável de evento interno:
  - origem (`subagent` ou `cron`)
  - chave/id da sessão filha
  - tipo de anúncio + rótulo da tarefa
  - linha de status derivada de sinais do resultado em runtime (`success`, `error`, `timeout` ou `unknown`)
  - conteúdo do resultado selecionado a partir do texto visível mais recente do assistente, caso contrário texto mais recente de tool/toolResult sanitizado
  - uma instrução de acompanhamento descrevendo quando responder vs. permanecer em silêncio
- `Status` não é inferido a partir da saída do modelo; ele vem de sinais do resultado em runtime.
- Em caso de tempo limite, se o filho só avançou até chamadas de ferramenta, o anúncio pode condensar esse histórico em um breve resumo de progresso parcial em vez de reproduzir a saída bruta da ferramenta.

As cargas úteis de anúncio incluem uma linha de estatísticas ao final (mesmo quando encapsuladas):

- Runtime (por exemplo, `runtime 5m12s`)
- Uso de tokens (entrada/saída/total)
- Custo estimado quando o preço do modelo estiver configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` e caminho da transcrição (para que o agente principal possa buscar o histórico via `sessions_history` ou inspecionar o arquivo no disco)
- Metadados internos destinam-se apenas à orquestração; respostas voltadas ao usuário devem ser reescritas em voz normal de assistente.

`sessions_history` é o caminho de orquestração mais seguro:

- a recordação do assistente é normalizada primeiro:
  - tags de pensamento são removidas
  - blocos de estrutura `<relevant-memories>` / `<relevant_memories>` são removidos
  - blocos de carga útil XML de chamada de ferramenta em texto simples, como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` e `<function_calls>...</function_calls>`, são removidos, incluindo cargas úteis truncadas que nunca se fecham corretamente
  - estruturas rebaixadas de chamada/resultado de ferramenta e marcadores de contexto histórico são removidos
  - tokens de controle do modelo vazados, como `<|assistant|>`, outros tokens ASCII `<|...|>` e variantes de largura total `<｜...｜>`, são removidos
  - XML malformado de chamada de ferramenta MiniMax é removido
- texto semelhante a credenciais/tokens é redigido
- blocos longos podem ser truncados
- históricos muito grandes podem descartar linhas mais antigas ou substituir uma linha superdimensionada por `[sessions_history omitted: message too large]`
- a inspeção bruta da transcrição no disco é o fallback quando você precisa da transcrição completa byte a byte

## Política de ferramentas (ferramentas de subagente)

Por padrão, subagentes recebem **todas as ferramentas, exceto ferramentas de sessão** e ferramentas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` continua sendo aqui também uma visualização de recordação limitada e sanitizada; não é um despejo bruto da transcrição.

Quando `maxSpawnDepth >= 2`, subagentes orquestradores de profundidade 1 recebem adicionalmente `sessions_spawn`, `subagents`, `sessions_list` e `sessions_history` para que possam gerenciar seus filhos.

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

Subagentes usam uma faixa dedicada de fila no processo:

- Nome da faixa: `subagent`
- Concorrência: `agents.defaults.subagents.maxConcurrent` (padrão `8`)

## Interrupção

- Enviar `/stop` no chat solicitante aborta a sessão solicitante e interrompe quaisquer execuções ativas de subagente iniciadas a partir dela, com cascata para filhos aninhados.
- `/subagents kill <id>` interrompe um subagente específico e aplica a cascata a seus filhos.

## Limitações

- O anúncio de subagente é em **regime de melhor esforço**. Se o gateway reiniciar, o trabalho pendente de "anunciar de volta" será perdido.
- Subagentes ainda compartilham os mesmos recursos do processo do gateway; trate `maxConcurrent` como uma válvula de segurança.
- `sessions_spawn` é sempre não bloqueante: ele retorna `{ status: "accepted", runId, childSessionKey }` imediatamente.
- O contexto do subagente injeta apenas `AGENTS.md` + `TOOLS.md` (sem `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` nem `BOOTSTRAP.md`).
- A profundidade máxima de aninhamento é 5 (intervalo de `maxSpawnDepth`: 1–5). A profundidade 2 é recomendada para a maioria dos casos de uso.
- `maxChildrenPerAgent` limita os filhos ativos por sessão (padrão: 5, intervalo: 1–20).
