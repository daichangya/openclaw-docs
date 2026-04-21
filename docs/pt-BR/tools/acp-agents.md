---
read_when:
    - Executando harnesses de codificação por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solucionando problemas do backend do ACP e da integração do Plugin
    - Operando comandos `/acp` pelo chat
summary: Use sessões de tempo de execução do ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-21T13:37:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

As sessões do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de codificação (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um Plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para "executar isso no Codex" ou "iniciar o Claude Code em uma thread", o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada criação de sessão ACP é rastreada como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que o Codex ou o Claude Code se conectem como um cliente MCP externo diretamente
a conversas de canal existentes do OpenClaw, use [`openclaw mcp serve`](/cli/mcp)
em vez de ACP.

## Que página eu quero?

Há três superfícies próximas que é fácil confundir:

| Você quer...                                                                     | Use isto                              | Observações                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio_ do OpenClaw | Esta página: Agentes ACP              | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do OpenClaw Gateway _como_ um servidor ACP para um editor ou cliente      | [`openclaw acp`](/cli/acp)            | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket                                         |
| Reutilizar uma CLI de IA local como modelo de fallback somente texto             | [Backends de CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness                              |

## Isso funciona imediatamente?

Normalmente, sim.

- Instalações novas agora vêm com o Plugin de runtime `acpx` integrado habilitado por padrão.
- O Plugin `acpx` integrado prefere seu binário `acpx` fixado local ao Plugin.
- Na inicialização, o OpenClaw verifica esse binário e faz autorreparo nele, se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adaptador de harness de destino pode ser buscado sob demanda com `npx` na primeira vez que você usar esse harness.
- A autenticação do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adaptador na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw já deve estar pronto para inicializar o `acpx`, mas o adaptador ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: mesma situação para o adaptador ACP do Claude, além da autenticação do lado do Claude nesse host.

## Fluxo rápido para operadores

Use isto quando quiser um runbook prático de `/acp`:

1. Crie uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa chave de sessão).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste as opções do runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dê um direcionamento a uma sessão ativa sem substituir o contexto:
   - `/acp steer tighten logging and continue`
6. Pare o trabalho:
   - `/acp cancel` (para a rodada atual), ou
   - `/acp close` (fecha a sessão + remove vínculos)

## Início rápido para humanos

Exemplos de solicitações naturais:

- "Vincule este canal do Discord ao Codex."
- "Inicie uma sessão persistente do Codex em uma thread aqui e mantenha o foco."
- "Execute isto como uma sessão ACP one-shot do Claude Code e resuma o resultado."
- "Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace."
- "Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread."

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o destino de harness solicitado (`agentId`, por exemplo `codex`).
3. Se o vínculo com a conversa atual for solicitado e o canal ativo oferecer suporte, vincular a sessão ACP a essa conversa.
4. Caso contrário, se o vínculo com thread for solicitado e o canal atual oferecer suporte, vincular a sessão ACP à thread.
5. Rotear mensagens de acompanhamento vinculadas para essa mesma sessão ACP até perder o foco/ser fechada/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área          | Sessão ACP                            | Execução de subagente               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Comandos principais | `/acp ...`                            | `/subagents ...`                    |
| Ferramenta de criação    | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão)   |

Consulte também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code via ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. Plugin de runtime `acpx` integrado
3. Adaptador ACP do Claude
4. Maquinário de runtime/sessão do lado do Claude

Distinção importante:

- ACP Claude é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefas em segundo plano e vínculo opcional com conversa/thread.
- Backends de CLI são runtimes locais de fallback somente texto separados. Consulte [Backends de CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto por meio da CLI bruta: use backends de CLI

## Sessões vinculadas

### Vínculos com a conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo o dono do transporte do canal, autenticação, segurança e entrega.
- A conversa atual fica fixada à chave da sessão ACP criada.
- Mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão e remove o vínculo com a conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver iniciando trabalho novo. O vínculo anexa essa sessão à conversa atual.
- `--bind here` não cria por si só uma thread filha do Discord ou tópico do Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace gerenciado pelo backend em disco. Esse workspace de runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você criar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda o workspace do **agente de destino** por padrão, não o do solicitante.
- Se o caminho herdado do workspace estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw volta para o cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir mas não puder ser acessado (por exemplo `EACCES`), a criação retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime de Codex/Claude/Gemini para o qual o OpenClaw roteia
- thread/tópico filho: uma superfície extra opcional de mensagens criada apenas por `--thread ...`
- workspace de runtime: o local no sistema de arquivos onde o harness executa (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: mantenha este chat, crie ou anexe uma sessão ACP do Codex e roteie mensagens futuras daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP ali
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo vínculo de chat acima, mas o Codex executa em `/workspace/repo`

Suporte a vínculo com a conversa atual:

- Canais de chat/mensagem que anunciam suporte a vínculo com a conversa atual podem usar `--bind here` pelo caminho compartilhado de vínculo de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica de canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa "vincular a conversa atual no mesmo lugar".
- Vínculos genéricos com a conversa atual usam o armazenamento de vínculo compartilhado do OpenClaw e sobrevivem a reinicializações normais do Gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no mesmo lugar. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vínculos ACP com a conversa atual, o OpenClaw retorna uma mensagem clara de não compatibilidade.
- `resume` e perguntas sobre "nova sessão" são perguntas de sessão ACP, não perguntas do canal. Você pode reutilizar ou substituir o estado de runtime sem mudar a superfície atual do chat.

### Sessões vinculadas a thread

Quando vínculos de thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída do ACP é entregue de volta à mesma thread.
- Perda de foco/fechamento/arquivamento/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo de thread é específico do adaptador. Se o adaptador de canal ativo não oferecer suporte a vínculos de thread, o OpenClaw retorna uma mensagem clara de indisponibilidade/não compatibilidade.

Sinalizadores de recurso obrigatórios para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` vem ativado por padrão (defina `false` para pausar o despacho ACP)
- Sinalizador de criação de thread ACP do adaptador de canal habilitado (específico do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais compatíveis com thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte integrado atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Canais de Plugin podem adicionar suporte pela mesma interface de vínculo.

## Configurações específicas de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas de nível superior `bindings[]`.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/chat em grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - DM/chat em grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Prefira `chat_id:*` para vínculos estáveis de grupo.
- `bindings[].agentId` é o id do agente OpenClaw proprietário.
- Substituições opcionais de ACP ficam em `bindings[].acp`:
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

Precedência de substituição para sessões ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. padrões globais do ACP (por exemplo `acp.backend`)

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
- Mensagens nesse canal ou tópico são roteadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no mesmo lugar.
- Vínculos temporários de runtime (por exemplo criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para criações ACP entre agentes sem um `cwd` explícito, o OpenClaw herda o workspace do agente de destino da configuração do agente.
- Caminhos ausentes de workspace herdado voltam para o cwd padrão do backend; falhas de acesso em caminhos existentes aparecem como erros de criação.

## Iniciar sessões ACP (interfaces)

### A partir de `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de uma rodada de agente ou chamada de ferramenta.

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

- `runtime` usa `subagent` por padrão, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado à sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): id do harness ACP de destino. Usa fallback para `acp.defaultAgent` se estiver definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo com thread quando compatível.
- `mode` (opcional): `run` (one-shot) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode usar comportamento persistente por padrão dependendo do caminho de runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho do runtime solicitado (validado pela política do backend/runtime). Se omitido, a criação ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes voltam para os padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado no texto da sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz seu histórico de conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos do progresso da execução ACP inicial de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, as respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para obter o histórico completo do relay.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de começar do zero. O agente reproduz seu histórico de conversa via `session/load`, então ele retoma com o contexto completo do que veio antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão do Codex do seu laptop para seu telefone — diga ao seu agente para continuar de onde você parou
- Continuar uma sessão de codificação que você iniciou interativamente na CLI, agora de forma headless por meio do seu agente
- Retomar um trabalho que foi interrompido por uma reinicialização do Gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna um erro se for usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico de conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o id da sessão não for encontrado, a criação falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Teste smoke do operador

Use isto após um deploy do Gateway quando quiser uma verificação rápida ao vivo de que a criação ACP
realmente está funcionando ponta a ponta, e não apenas passando em testes unitários.

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
5. Verifique se o agente informa:
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

- Mantenha este teste smoke em `mode: "run"` a menos que você esteja testando intencionalmente
  sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para o gate básico. Esse caminho depende de
  recursos da sessão/solicitante e é uma verificação de integração separada.
- Trate o teste de `mode: "session"` vinculado a thread como uma segunda
  etapa de integração, mais rica, a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Atualmente, sessões ACP são executadas no runtime do host, não dentro do sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, criações ACP são bloqueadas tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução imposta por sandbox.

### A partir do comando `/acp`

Use `/acp spawn` para controle explícito do operador pelo chat, quando necessário.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Principais flags:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Resolução do destino da sessão

A maioria das ações `/acp` aceita um destino de sessão opcional (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de destino (ou `--session` para `/acp steer`)
   - tenta a chave
   - depois id de sessão em formato UUID
   - depois rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão solicitante atual

Vínculos com a conversa atual e vínculos de thread participam ambos da etapa 2.

Se nenhum destino for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo na criação

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo   | Comportamento                                                            |
| ------ | ------------------------------------------------------------------------ |
| `here` | Vincula a conversa ativa atual no mesmo lugar; falha se nenhuma estiver ativa. |
| `off`  | Não cria um vínculo com a conversa atual.                                |

Observações:

- `--bind here` é o caminho mais simples para o operador em "fazer este canal ou chat ser respaldado pelo Codex".
- `--bind here` não cria uma thread filha.
- `--bind here` só está disponível em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada `/acp spawn`.

## Modos de thread na criação

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo   | Comportamento                                                                                             |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando compatível. |
| `here` | Exige thread ativa atual; falha se não estiver em uma.                                                    |
| `off`  | Sem vínculo. A sessão inicia desvinculada.                                                                |

Observações:

- Em superfícies sem vínculo de thread, o comportamento padrão é efetivamente `off`.
- Criação vinculada a thread exige suporte da política do canal:
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

`/acp status` mostra as opções efetivas de runtime e, quando disponível, os identificadores de sessão tanto no nível do runtime quanto no nível do backend.

Alguns controles dependem dos recursos do backend. Se um backend não oferecer suporte a um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Cookbook de comandos ACP

| Comando              | O que faz                                                | Exemplo                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Cria sessão ACP; vínculo atual opcional ou vínculo com thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela a rodada em andamento para a sessão de destino.  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envia uma instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Fecha a sessão e desvincula destinos de thread.          | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modo, estado, opções de runtime, capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Define o modo de runtime para a sessão de destino.       | `/acp set-mode plan`                                          |
| `/acp set`           | Escrita genérica de opção de configuração do runtime.    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Define o perfil da política de aprovação.                | `/acp permissions strict`                                     |
| `/acp timeout`       | Define o timeout do runtime (segundos).                  | `/acp timeout 120`                                            |
| `/acp model`         | Define a substituição do modelo de runtime.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Remove substituições de opções de runtime da sessão.     | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sessões ACP recentes do armazenamento.             | `/acp sessions`                                               |
| `/acp doctor`        | Integridade do backend, capacidades, correções acionáveis. | `/acp doctor`                                                 |
| `/acp install`       | Exibe etapas determinísticas de instalação e habilitação. | `/acp install`                                                |

`/acp sessions` lê o armazenamento para a sessão vinculada atual ou para a sessão solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem destinos por meio da descoberta de sessão do gateway, incluindo raízes `session.store` personalizadas por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime para a sessão de destino.

## Suporte a harnesses do acpx (atual)

Aliases integrados atuais de harnesses do acpx:

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

Quando o OpenClaw usa o backend acpx, prefira esses valores para `agentId`, a menos que sua configuração do acpx defina aliases personalizados de agente.
Se sua instalação local do Cursor ainda expõe ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão integrado.

O uso direto da CLI do acpx também pode apontar para adaptadores arbitrários via `--agent <command>`, mas essa escape hatch bruta é um recurso da CLI do acpx (não o caminho normal de `agentId` do OpenClaw).

## Configuração obrigatória

Linha de base principal do ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho ACP enquanto mantém os controles /acp.
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

A configuração de vínculo com thread é específica do adaptador de canal. Exemplo para Discord:

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

Se a criação de ACP vinculada a thread não funcionar, verifique primeiro o sinalizador de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos com a conversa atual não exigem criação de thread filha. Eles exigem um contexto de conversa ativo e um adaptador de canal que exponha vínculos de conversa ACP.

Consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do Plugin para backend acpx

Instalações novas vêm com o Plugin de runtime `acpx` integrado habilitado por padrão, portanto o ACP
normalmente funciona sem uma etapa manual de instalação de Plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o via `plugins.allow` / `plugins.deny`, ou quer
mudar para um checkout local de desenvolvimento, use o caminho explícito do Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação de workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o Plugin de backend acpx integrado (`acpx`) usa o binário fixado local ao Plugin:

1. O comando usa por padrão o `node_modules/.bin/acpx` local ao Plugin dentro do pacote do Plugin ACPX.
2. A versão esperada usa por padrão o pin da extensão.
3. A inicialização registra imediatamente o backend ACP como não pronto.
4. Um job de garantia em segundo plano verifica `acpx --version`.
5. Se o binário local ao Plugin estiver ausente ou incompatível, ele executa:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente.

Você pode substituir comando/versão na configuração do Plugin:

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

- `command` aceita um caminho absoluto, caminho relativo ou nome de comando (`acpx`).
- Caminhos relativos são resolvidos a partir do diretório de workspace do OpenClaw.
- `expectedVersion: "any"` desabilita a correspondência estrita de versão.
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao Plugin é desabilitada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Consulte [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as dependências de runtime do acpx
(binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de pós-instalação. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Bridge MCP de ferramentas de Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por Plugins do OpenClaw ao
harness ACP.

Se você quiser que agentes ACP, como Codex ou Claude Code, chamem ferramentas de Plugin do
OpenClaw instaladas, como recuperação/armazenamento de memória, habilite a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP integrado chamado `openclaw-plugin-tools` no bootstrap
  da sessão ACPX.
- Expõe ferramentas de Plugin já registradas por Plugins instalados e habilitados do OpenClaw.
- Mantém o recurso explícito e desativado por padrão.

Observações de segurança e confiança:

- Isso expande a superfície de ferramentas do harness ACP.
- Agentes ACP obtêm acesso apenas às ferramentas de Plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança que permitir que esses Plugins sejam executados no
  próprio OpenClaw.
- Revise os Plugins instalados antes de habilitar isso.

Servidores `mcpServers` personalizados continuam funcionando como antes. A bridge integrada de ferramentas de Plugin é uma
conveniência adicional de adesão, não uma substituição para a configuração genérica de servidor MCP.

### Configuração de timeout do runtime

O Plugin `acpx` integrado usa por padrão um timeout de 120 segundos
para rodadas de runtime incorporado. Isso dá tempo suficiente para harnesses mais lentos, como Gemini CLI, concluírem
a inicialização e configuração do ACP. Substitua isso se o seu host precisar de um
limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

### Configuração do agente de probe de integridade

O Plugin `acpx` integrado verifica um agente de harness ao decidir se o
backend de runtime incorporado está pronto. O padrão é `codex`. Se a sua implantação
usar um agente ACP padrão diferente, defina o agente de probe com o mesmo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP são executadas de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O Plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness ACPX são separadas das aprovações de exec do OpenClaw e separadas de sinalizadores de bypass de fornecedor de backends de CLI, como o Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` é o interruptor break-glass no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem solicitar confirmação.

| Valor           | Comportamento                                              |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all`      | Nega todos os prompts de permissão.                        |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria mostrado, mas nenhum TTY interativo está disponível (o que é sempre o caso para sessões ACP).

| Valor  | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Aborta a sessão com `AcpRuntimeError`. **(padrão)**                    |
| `deny` | Nega silenciosamente a permissão e continua (degradação graciosa).     |

### Configuração

Defina via configuração do Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem graciosamente em vez de falhar.

## Solução de problemas

| Sintoma                                                                     | Causa provável                                                                  | Correção                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | O Plugin de backend está ausente ou desabilitado.                               | Instale e habilite o Plugin de backend e depois execute `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP desabilitado globalmente.                                                   | Defina `acp.enabled=true`.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | O despacho a partir de mensagens normais da thread está desabilitado.           | Defina `acp.dispatch.enabled=true`.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                 | O agente não está na allowlist.                                                 | Use um `agentId` permitido ou atualize `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token de chave/id/rótulo inválido.                                              | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa ativa que permita vínculo.             | Vá para o chat/canal de destino e tente novamente, ou use criação sem vínculo.                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | O adaptador não tem capacidade de vínculo ACP com a conversa atual.             | Use `/acp spawn ... --thread ...` quando compatível, configure `bindings[]` de nível superior ou vá para um canal compatível.                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` foi usado fora de um contexto de thread.                        | Vá para a thread de destino ou use `--thread auto`/`off`.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Outro usuário é dono do destino de vínculo ativo.                               | Refaça o vínculo como proprietário ou use uma conversa ou thread diferente.                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | O adaptador não tem capacidade de vínculo com thread.                           | Use `--thread off` ou vá para um adaptador/canal compatível.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | O runtime ACP fica no host; a sessão solicitante está em sandbox.               | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute a criação ACP a partir de uma sessão fora de sandbox.                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` foi solicitado para o runtime ACP.                          | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão fora de sandbox.                                     |
| Missing ACP metadata for bound session                                      | Metadados de sessão ACP obsoletos/excluídos.                                    | Recrie com `/acp spawn` e depois refaça o vínculo/foco da thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloqueia gravações/exec em sessão ACP não interativa.          | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Consulte [Configuração de permissões](#permission-configuration).    |
| ACP session fails early with little output                                  | Prompts de permissão são bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway para `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação graciosa, defina `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | O processo do harness terminou, mas a sessão ACP não informou a conclusão.      | Monitore com `ps aux \| grep acpx`; elimine processos obsoletos manualmente.                                                                                       |
