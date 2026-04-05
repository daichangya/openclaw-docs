---
read_when:
    - Executando harnesses de coding por meio de ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solucionando problemas de backend ACP e integração de plugin
    - Operando comandos `/acp` pelo chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-05T12:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Sessões de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de coding (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar Claude Code em uma thread", o OpenClaw deve encaminhar essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada spawn de sessão ACP é rastreado como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que Codex ou Claude Code se conectem diretamente como um cliente MCP externo
a conversas de canal existentes do OpenClaw, use
[`openclaw mcp serve`](/cli/mcp) em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer...                                                                     | Use isto                              | Observações                                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio_ do OpenClaw | Esta página: agentes ACP              | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente      | [`openclaw acp`](/cli/acp)            | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                          |
| Reutilizar uma CLI local de IA como modelo de fallback somente de texto                     | [CLI Backends](/pt-BR/gateway/cli-backends) | Não é ACP. Sem tools do OpenClaw, sem controles ACP, sem runtime de harness                                     |

## Isso funciona pronto para uso?

Normalmente, sim.

- Instalações novas agora já vêm com o plugin de runtime integrado `acpx` habilitado por padrão.
- O plugin integrado `acpx` prefere seu binário `acpx` fixado localmente no plugin.
- Na inicialização, o OpenClaw sonda esse binário e faz autorreparo se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adapter do harness de destino pode ser buscado sob demanda com `npx` na primeira vez em que você usar esse harness.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adapter na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adapter seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw deve estar pronto para inicializar `acpx`, mas o adapter ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: a mesma situação para o adapter ACP do Claude, além da autenticação do lado do Claude nesse host.

## Fluxo rápido para operadores

Use isto quando você quiser um runbook prático de `/acp`:

1. Gere uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa session key).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste opções do runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dê uma orientação a uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Pare o trabalho:
   - `/acp cancel` (interrompe o turno atual), ou
   - `/acp close` (fecha a sessão + remove bindings)

## Início rápido para pessoas

Exemplos de solicitações naturais:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão Codex persistente em uma thread aqui e mantenha o foco."
- "Execute isso como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o destino de harness solicitado (`agentId`, por exemplo `codex`).
3. Se for solicitado binding na conversa atual e o canal ativo oferecer suporte, vincular a sessão ACP a essa conversa.
4. Caso contrário, se for solicitado binding em thread e o canal atual oferecer suporte, vincular a sessão ACP à thread.
5. Encaminhar mensagens vinculadas de acompanhamento para essa mesma sessão ACP até perder foco/ser fechada/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente                |
| ------------- | ------------------------------------- | ------------------------------------ |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| Comandos principais | `/acp ...`                       | `/subagents ...`                     |
| Tool de spawn | `sessions_spawn` com `runtime:"acp"`  | `sessions_spawn` (runtime padrão)    |

Consulte também [Sub-agents](/tools/subagents).

## Como o ACP executa Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle da sessão ACP do OpenClaw
2. plugin de runtime integrado `acpx`
3. adapter ACP do Claude
4. maquinário de runtime/sessão do lado do Claude

Distinção importante:

- Claude em ACP não é a mesma coisa que o runtime de fallback direto `claude-cli/...`.
- Claude em ACP é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e binding opcional de conversa/thread.
- `claude-cli/...` é um backend de CLI local somente de texto. Consulte [CLI Backends](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente em harness: use ACP
- quer um fallback simples de texto local pela CLI bruta: use backends CLI

## Sessões vinculadas

### Bindings da conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo dono do transporte do canal, autenticação, segurança e entrega.
- A conversa atual é fixada na session key ACP gerada.
- Mensagens de acompanhamento nessa conversa são encaminhadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão e remove o binding da conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver gerando trabalho novo. O binding anexa essa sessão à conversa atual.
- `--bind here` não cria por si só uma thread filha do Discord nem um tópico do Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace em disco gerenciado pelo backend. Esse workspace do runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você gerar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**, não o do solicitante.
- Se esse caminho de workspace herdado estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw usa como fallback o `cwd` padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), o spawn retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime de Codex/Claude/Gemini para o qual o OpenClaw encaminha
- thread/tópico filho: uma superfície extra opcional de mensagens criada apenas por `--thread ...`
- workspace de runtime: o local no sistema de arquivos onde o harness roda (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: mantenha este chat, gere ou anexe uma sessão ACP do Codex e encaminhe mensagens futuras daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP lá
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo binding de chat acima, mas o Codex roda em `/workspace/repo`

Suporte a binding da conversa atual:

- Canais de chat/mensagem que anunciam suporte a binding da conversa atual podem usar `--bind here` pelo caminho compartilhado de binding de conversa.
- Canais com semântica customizada de thread/tópico ainda podem fornecer canonicalização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa “vincular a conversa atual no mesmo lugar”.
- Bindings genéricos da conversa atual usam o armazenamento compartilhado de bindings do OpenClaw e sobrevivem a reinicializações normais do gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no mesmo lugar. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser bindings ACP da conversa atual, o OpenClaw retorna uma mensagem clara de não compatibilidade.
- `resume` e perguntas de “nova sessão” são questões da sessão ACP, não do canal. Você pode reutilizar ou substituir o estado do runtime sem mudar a superfície de chat atual.

### Sessões vinculadas à thread

Quando bindings de thread estão habilitados para um adapter de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são encaminhadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta à mesma thread.
- Perda de foco/fechamento/arquivamento/timeout por inatividade ou expiração por idade máxima removem o binding.

O suporte a binding de thread é específico do adapter. Se o adapter do canal ativo não oferecer suporte a bindings de thread, o OpenClaw retorna uma mensagem clara de não compatibilidade/indisponibilidade.

Flags de recurso obrigatórias para ACP vinculado à thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` vem ativado por padrão (defina `false` para pausar o despacho ACP)
- Flag de spawn ACP em thread do adapter de canal habilitada (específica do adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais compatíveis com thread

- Qualquer adapter de canal que exponha capacidade de binding de sessão/thread.
- Suporte integrado atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Canais de plugin podem adicionar suporte pela mesma interface de binding.

## Configurações específicas de canal

Para fluxos não efêmeros, configure bindings ACP persistentes em entradas `bindings[]` de nível superior.

### Modelo de binding

- `bindings[].type="acp"` marca um binding persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/em grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefira `chat_id:*` ou `chat_identifier:*` para bindings estáveis de grupos.
  - Chat DM/em grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefira `chat_id:*` para bindings estáveis de grupos.
- `bindings[].agentId` é o id do agente OpenClaw proprietário.
- Overrides opcionais de ACP ficam em `bindings[].acp`:
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedência de override para sessões ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. padrões globais de ACP (por exemplo `acp.backend`)

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamento:

- O OpenClaw garante que a sessão ACP configurada exista antes do uso.
- Mensagens nesse canal ou tópico são encaminhadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma session key ACP no mesmo lugar.
- Bindings temporários de runtime (por exemplo criados por fluxos de foco em thread) continuam valendo quando presentes.
- Para spawns ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos herdados de workspace ausentes usam como fallback o `cwd` padrão do backend; falhas reais de acesso em caminhos existentes aparecem como erros de spawn.

## Iniciar sessões ACP (interfaces)

### A partir de `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou chamada de tool.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Observações:

- `runtime` assume `subagent` por padrão, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado à sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Usa `acp.defaultAgent` como fallback se estiver definido.
- `thread` (opcional, padrão `false`): solicita fluxo de binding de thread quando compatível.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e `mode` for omitido, o OpenClaw pode assumir comportamento persistente por caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado para o runtime (validado pela política do backend/runtime). Se omitido, o spawn ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes usam como fallback os padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado em texto de sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, as respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de retransmissão.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa via `session/load`, então retoma com contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão Codex do laptop para o telefone — pedir ao agente para continuar de onde parou
- Continuar uma sessão de coding iniciada interativamente na CLI, agora de forma headless por meio do agente
- Retomar um trabalho interrompido por reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico da conversa ACP no upstream; `thread` e `mode` continuam valendo normalmente para a nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino precisa oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o id da sessão não for encontrado, o spawn falha com um erro claro — não há fallback silencioso para uma nova sessão.

### Smoke test para operadores

Use isto após um deploy do gateway quando quiser uma verificação rápida em produção de que o spawn ACP
está realmente funcionando de ponta a ponta, e não apenas passando em testes unitários.

Gate recomendado:

1. Verifique a versão/commit do gateway implantado no host de destino.
2. Confirme que o código-fonte implantado inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão bridge ACPX temporária para um agente ativo (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente relata:
   - `accepted=yes`
   - um `childSessionKey` real
   - nenhum erro de validador
6. Limpe a sessão bridge ACPX temporária.

Exemplo de prompt para o agente ativo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha esse smoke test em `mode: "run"` a menos que você esteja testando intencionalmente
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  capacidades da sessão/solicitante e é uma verificação de integração separada.
- Trate o teste de `mode: "session"` vinculado a thread como uma segunda etapa mais rica
  de integração a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Atualmente, sessões ACP são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, spawns ACP serão bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução com sandbox forçado.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador via chat quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flags principais:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulte [Slash Commands](/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações `/acp` aceita um alvo de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de alvo (ou `--session` para `/acp steer`)
   - tenta key
   - depois session id em formato UUID
   - depois label
2. Binding da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão atual do solicitante

Bindings da conversa atual e bindings de thread participam da etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de bind no spawn

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                               |
| ------ | ---------------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no mesmo lugar; falha se nenhuma estiver ativa. |
| `off`  | Não cria binding da conversa atual.                                          |

Observações:

- `--bind here` é o caminho mais simples para operadores para “fazer este canal ou chat ser apoiado por Codex”.
- `--bind here` não cria uma thread filha.
- `--bind here` está disponível apenas em canais que expõem suporte a binding da conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

## Modos de thread no spawn

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando compatível. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                         |
| `off`  | Sem binding. A sessão é iniciada desvinculada.                                                                 |

Observações:

- Em superfícies sem suporte a binding de thread, o comportamento padrão é efetivamente `off`.
- Spawn vinculado a thread exige suporte da política do canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Use `--bind here` quando quiser fixar a conversa atual sem criar uma thread filha.

## Controles ACP

Família de comandos disponível:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` mostra as opções efetivas de runtime e, quando disponíveis, os identificadores de sessão tanto no nível do runtime quanto no nível do backend.

Alguns controles dependem das capacidades do backend. Se um backend não oferecer suporte a um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Cookbook de comandos ACP

| Comando              | O que faz                                                  | Exemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; binding opcional da conversa atual ou da thread. | `/acp spawn codex --bind here --cwd /repo`               |
| `/acp cancel`        | Cancela turno em andamento da sessão de destino.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula alvos de thread.               | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                              |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.         | `/acp set-mode plan`                                          |
| `/acp set`           | Escrita genérica de opção de configuração do runtime.      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define override do diretório de trabalho do runtime.       | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil de política de aprovação.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                    | `/acp timeout 120`                                            |
| `/acp model`         | Define o override de modelo do runtime.                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove overrides de opções de runtime da sessão.           | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.               | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Imprime etapas determinísticas de instalação e habilitação. | `/acp install`                                               |

`/acp sessions` lê o armazenamento para a sessão atual vinculada ou a sessão atual do solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem alvos por descoberta de sessão do gateway, incluindo raízes customizadas de `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente o override de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de override de cwd.
- `/acp reset-options` limpa todos os overrides de runtime da sessão de destino.

## Suporte a harnesses acpx (atual)

Aliases integrados atuais de harness no acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando o OpenClaw usa o backend acpx, prefira estes valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se sua instalação local do Cursor ainda expuser ACP como `agent acp`, sobrescreva o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode direcionar para adapters arbitrários por meio de `--agent <command>`, mas essa rota de escape bruta é um recurso da CLI do acpx (não do caminho normal `agentId` do OpenClaw).

## Configuração necessária

Linha de base do ACP no core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

A configuração de binding de thread é específica do adapter do canal. Exemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se o spawn ACP vinculado a thread não funcionar, verifique primeiro a flag de recurso do adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindings da conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativa e um adapter de canal que exponha bindings ACP de conversa.

Consulte [Configuration Reference](/pt-BR/gateway/configuration-reference).

## Configuração de plugin para backend acpx

Instalações novas já vêm com o plugin de runtime integrado `acpx` habilitado por padrão, então o ACP
normalmente funciona sem uma etapa manual de instalação de plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o via `plugins.allow` / `plugins.deny` ou quiser
alternar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação local de workspace durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend integrado acpx (`acpx`) usa o binário fixado localmente no plugin:

1. O comando usa por padrão `node_modules/.bin/acpx` local ao plugin dentro do pacote do plugin ACPX.
2. A versão esperada usa por padrão o pin da extensão.
3. A inicialização registra imediatamente o backend ACP como não pronto.
4. Um job de verificação em segundo plano valida `acpx --version`.
5. Se o binário local ao plugin estiver ausente ou incompatível, ele executa:
   `npm install --omit=dev --no-save acpx@<pinned>` e valida novamente.

Você pode sobrescrever comando/versão na configuração do plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Observações:

- `command` aceita caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos são resolvidos a partir do diretório de workspace do OpenClaw.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao plugin é desabilitada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Consulte [Plugins](/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e relata a dependência ausente por meio de `openclaw acp doctor`.

### Bridge MCP de tools de plugin

Por padrão, sessões ACPX **não** expõem tools registradas por plugins do OpenClaw para
o harness ACP.

Se você quiser que agentes ACP como Codex ou Claude Code chamem tools instaladas
de plugins do OpenClaw, como recuperação/armazenamento de memória, habilite a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe tools de plugin já registradas por plugins OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de tools do harness ACP.
- Agentes ACP obtêm acesso apenas a tools de plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança que permitir que esses plugins executem
  no próprio OpenClaw.
- Revise os plugins instalados antes de habilitar.

`mcpServers` personalizados continuam funcionando como antes. A bridge integrada de plugin-tools é uma conveniência adicional opcional, não uma substituição para a configuração genérica de servidor MCP.

## Configuração de permissões

Sessões ACP são executadas sem interação — não há TTY para aprovar ou negar prompts de permissão para escrita em arquivos e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de execução do OpenClaw e separadas de flags de bypass específicas de fornecedor para backends CLI, como `--permission-mode bypassPermissions` da Claude CLI. `approve-all` do ACPX é a chave de emergência no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente do harness pode executar sem solicitar aprovação.

| Valor           | Comportamento                                               |
| ---------------- | ----------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as escritas em arquivos e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; escritas e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                         |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas não há TTY interativo disponível (o que sempre acontece em sessões ACP).

| Valor  | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**                    |
| `deny` | Nega silenciosamente a permissão e continua (degradação elegante).     |

### Configuração

Defina via configuração de plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP sem interação, qualquer escrita ou exec que dispare um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem de forma elegante em vez de falhar.

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                           |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin de backend ausente ou desabilitado.                                       | Instale e habilite o plugin de backend, depois execute `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                    | Defina `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | O despacho a partir de mensagens normais em thread está desabilitado.            | Defina `acp.dispatch.enabled=true`.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente não está na allowlist.                                                    | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token de key/id/label inválido.                                                  | Execute `/acp sessions`, copie a key/label exata e tente novamente.                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa ativa vinculável.                       | Vá para o chat/canal de destino e tente novamente, ou use spawn sem binding.                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | O adapter não tem capacidade de binding ACP da conversa atual.                   | Use `/acp spawn ... --thread ...` onde houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível.                                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` foi usado fora de um contexto de thread.                         | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é dono do alvo de binding ativo.                                   | Refaça o binding como proprietário ou use uma conversa ou thread diferente.                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | O adapter não tem capacidade de binding de thread.                               | Use `--thread off` ou vá para um adapter/canal compatível.                                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP roda no host; a sessão solicitante está em sandbox.                | Use `runtime="subagent"` a partir de sessões em sandbox ou execute o spawn ACP a partir de uma sessão sem sandbox.                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` foi solicitado para runtime ACP.                             | Use `runtime="subagent"` para sandbox obrigatório ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox.                                         |
| Metadados ACP ausentes para a sessão vinculada                              | Metadados ACP obsoletos/excluídos.                                               | Recrie com `/acp spawn` e depois refaça o binding/foco da thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia escritas/exec em sessão ACP sem interação.             | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](#configuração-de-permissões). |
| A sessão ACP falha cedo com pouca saída                                     | Prompts de permissão estão bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway em busca de `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação elegante, defina `nonInteractivePermissions=deny`. |
| A sessão ACP fica travada indefinidamente após concluir o trabalho          | O processo do harness terminou, mas a sessão ACP não informou conclusão.         | Monitore com `ps aux \| grep acpx`; finalize manualmente processos obsoletos.                                                                                     |
