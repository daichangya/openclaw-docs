---
read_when:
    - Executando harnesses de coding por meio do ACP
    - Configurando sessões ACP vinculadas à conversa em canais de mensagens
    - Vinculando uma conversa de canal de mensagens a uma sessão ACP persistente
    - Solução de problemas de backend ACP e integração de plugins
    - Depurando entrega de conclusão do ACP ou loops entre agentes
    - Operando comandos `/acp` no chat
summary: Use sessões de runtime ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e outros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-23T05:44:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: df4c4c38e7a93c240f6bf30a4cc093e8717ef6459425d56a9287245adc625e51
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Sessões de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permitem que o OpenClaw execute harnesses externos de coding (por exemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e outros harnesses ACPX compatíveis) por meio de um plugin de backend ACP.

Se você pedir ao OpenClaw em linguagem natural para “executar isso no Codex” ou “iniciar o Claude Code em uma thread”, o OpenClaw deve rotear essa solicitação para o runtime ACP (não para o runtime nativo de subagente). Cada spawn de sessão ACP é rastreado como uma [tarefa em segundo plano](/pt-BR/automation/tasks).

Se você quiser que Codex ou Claude Code se conectem diretamente como um cliente MCP externo
a conversas de canal existentes do OpenClaw, use
[`openclaw mcp serve`](/cli/mcp) em vez de ACP.

## Qual página eu quero?

Há três superfícies próximas que são fáceis de confundir:

| Você quer... | Use isto | Observações |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Executar Codex, Claude Code, Gemini CLI ou outro harness externo _por meio_ do OpenClaw | Esta página: agentes ACP | Sessões vinculadas ao chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tarefas em segundo plano, controles de runtime |
| Expor uma sessão do Gateway OpenClaw _como_ um servidor ACP para um editor ou cliente | [`openclaw acp`](/cli/acp) | Modo bridge. O IDE/cliente fala ACP com o OpenClaw por stdio/WebSocket |
| Reutilizar uma AI CLI local como modelo de fallback apenas de texto | [Backends CLI](/pt-BR/gateway/cli-backends) | Não é ACP. Sem ferramentas do OpenClaw, sem controles ACP, sem runtime de harness |

## Isso funciona imediatamente?

Normalmente, sim.

- Instalações novas agora vêm com o plugin de runtime empacotado `acpx` habilitado por padrão.
- O plugin empacotado `acpx` prefere seu binário `acpx` fixado localmente no plugin.
- Na inicialização, o OpenClaw sonda esse binário e o autorrepara se necessário.
- Comece com `/acp doctor` se quiser uma verificação rápida de prontidão.

O que ainda pode acontecer no primeiro uso:

- Um adaptador de harness de destino pode ser obtido sob demanda com `npx` na primeira vez que você usar esse harness.
- A auth do fornecedor ainda precisa existir no host para esse harness.
- Se o host não tiver acesso a npm/rede, buscas de adaptador na primeira execução podem falhar até que os caches sejam pré-aquecidos ou o adaptador seja instalado de outra forma.

Exemplos:

- `/acp spawn codex`: o OpenClaw deve estar pronto para inicializar `acpx`, mas o adaptador ACP do Codex ainda pode precisar de uma busca na primeira execução.
- `/acp spawn claude`: mesma situação para o adaptador ACP do Claude, além da auth do lado do Claude nesse host.

## Fluxo rápido para operadores

Use isto quando quiser um runbook prático de `/acp`:

1. Gere uma sessão:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabalhe na conversa ou thread vinculada (ou direcione explicitamente para essa chave de sessão).
3. Verifique o estado do runtime:
   - `/acp status`
4. Ajuste opções do runtime conforme necessário:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dê um empurrão em uma sessão ativa sem substituir o contexto:
   - `/acp steer aperte o logging e continue`
6. Pare o trabalho:
   - `/acp cancel` (interrompe o turno atual), ou
   - `/acp close` (fecha a sessão + remove vínculos)

## Início rápido para pessoas

Exemplos de solicitações naturais:

- “Vincule este canal do Discord ao Codex.”
- “Inicie uma sessão persistente do Codex em uma thread aqui e mantenha o foco.”
- “Execute isto como uma sessão ACP avulsa do Claude Code e resuma o resultado.”
- “Vincule este chat do iMessage ao Codex e mantenha os acompanhamentos no mesmo workspace.”
- “Use Gemini CLI para esta tarefa em uma thread e depois mantenha os acompanhamentos nessa mesma thread.”

O que o OpenClaw deve fazer:

1. Escolher `runtime: "acp"`.
2. Resolver o alvo de harness solicitado (`agentId`, por exemplo `codex`).
3. Se for solicitado vínculo com a conversa atual e o canal ativo oferecer suporte, vincular a sessão ACP a essa conversa.
4. Caso contrário, se for solicitado vínculo com thread e o canal atual oferecer suporte, vincular a sessão ACP à thread.
5. Rotear mensagens de acompanhamento vinculadas para essa mesma sessão ACP até perder foco/fechar/expirar.

## ACP versus subagentes

Use ACP quando quiser um runtime de harness externo. Use subagentes quando quiser execuções delegadas nativas do OpenClaw.

| Área | Sessão ACP | Execução de subagente |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime | Plugin de backend ACP (por exemplo acpx) | Runtime nativo de subagente do OpenClaw |
| Chave de sessão | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Comandos principais | `/acp ...` | `/subagents ...` |
| Ferramenta de spawn | `sessions_spawn` com `runtime:"acp"` | `sessions_spawn` (runtime padrão) |

Veja também [Subagentes](/pt-BR/tools/subagents).

## Como o ACP executa o Claude Code

Para Claude Code por meio de ACP, a pilha é:

1. Plano de controle de sessão ACP do OpenClaw
2. Plugin de runtime empacotado `acpx`
3. Adaptador ACP do Claude
4. Runtime/mecanismo de sessão do lado do Claude

Distinção importante:

- ACP Claude é uma sessão de harness com controles ACP, retomada de sessão, rastreamento de tarefa em segundo plano e vínculo opcional com conversa/thread.
- Backends CLI são runtimes locais de fallback apenas de texto e separados. Veja [Backends CLI](/pt-BR/gateway/cli-backends).

Para operadores, a regra prática é:

- quer `/acp spawn`, sessões vinculáveis, controles de runtime ou trabalho persistente de harness: use ACP
- quer fallback local simples de texto por meio da CLI bruta: use backends CLI

## Sessões vinculadas

### Vínculos com a conversa atual

Use `/acp spawn <harness> --bind here` quando quiser que a conversa atual se torne um workspace ACP durável sem criar uma thread filha.

Comportamento:

- O OpenClaw continua sendo o proprietário do transporte do canal, auth, segurança e entrega.
- A conversa atual é fixada à chave de sessão ACP gerada.
- Mensagens de acompanhamento nessa conversa são roteadas para a mesma sessão ACP.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão e remove o vínculo com a conversa atual.

O que isso significa na prática:

- `--bind here` mantém a mesma superfície de chat. No Discord, o canal atual continua sendo o canal atual.
- `--bind here` ainda pode criar uma nova sessão ACP se você estiver gerando trabalho novo. O vínculo anexa essa sessão à conversa atual.
- `--bind here` não cria por si só uma thread filha no Discord nem um tópico no Telegram.
- O runtime ACP ainda pode ter seu próprio diretório de trabalho (`cwd`) ou workspace em disco gerenciado pelo backend. Esse workspace do runtime é separado da superfície de chat e não implica uma nova thread de mensagens.
- Se você gerar para um agente ACP diferente e não passar `--cwd`, o OpenClaw herda por padrão o workspace do **agente de destino**, não o de quem solicitou.
- Se esse caminho de workspace herdado estiver ausente (`ENOENT`/`ENOTDIR`), o OpenClaw usa fallback para o cwd padrão do backend em vez de reutilizar silenciosamente a árvore errada.
- Se o workspace herdado existir, mas não puder ser acessado (por exemplo `EACCES`), o spawn retorna o erro real de acesso em vez de descartar `cwd`.

Modelo mental:

- superfície de chat: onde as pessoas continuam conversando (`canal do Discord`, `tópico do Telegram`, `chat do iMessage`)
- sessão ACP: o estado durável de runtime do Codex/Claude/Gemini para o qual o OpenClaw roteia
- thread/tópico filho: uma superfície extra opcional de mensagens criada apenas por `--thread ...`
- workspace de runtime: o local do sistema de arquivos onde o harness é executado (`cwd`, checkout do repositório, workspace do backend)

Exemplos:

- `/acp spawn codex --bind here`: mantém este chat, gera ou anexa uma sessão ACP do Codex e roteia mensagens futuras daqui para ela
- `/acp spawn codex --thread auto`: o OpenClaw pode criar uma thread/tópico filho e vincular a sessão ACP ali
- `/acp spawn codex --bind here --cwd /workspace/repo`: mesmo vínculo de chat acima, mas o Codex é executado em `/workspace/repo`

Suporte a vínculo com a conversa atual:

- Canais de chat/mensagem que anunciam suporte a vínculo com a conversa atual podem usar `--bind here` pelo caminho compartilhado de vínculo de conversa.
- Canais com semântica personalizada de thread/tópico ainda podem fornecer canonização específica do canal por trás da mesma interface compartilhada.
- `--bind here` sempre significa “vincule a conversa atual no local”.
- Vínculos genéricos com a conversa atual usam o armazenamento compartilhado de vínculos do OpenClaw e sobrevivem a reinicializações normais do gateway.

Observações:

- `--bind here` e `--thread ...` são mutuamente exclusivos em `/acp spawn`.
- No Discord, `--bind here` vincula o canal ou thread atual no local. `spawnAcpSessions` só é necessário quando o OpenClaw precisa criar uma thread filha para `--thread auto|here`.
- Se o canal ativo não expuser vínculos ACP com a conversa atual, o OpenClaw retorna uma mensagem clara de não compatibilidade.
- `resume` e questões de “nova sessão” são questões de sessão ACP, não de canal. Você pode reutilizar ou substituir o estado do runtime sem mudar a superfície atual do chat.

### Sessões vinculadas a thread

Quando vínculos com thread estão habilitados para um adaptador de canal, sessões ACP podem ser vinculadas a threads:

- O OpenClaw vincula uma thread a uma sessão ACP de destino.
- Mensagens de acompanhamento nessa thread são roteadas para a sessão ACP vinculada.
- A saída ACP é entregue de volta para a mesma thread.
- Perda de foco/fechamento/arquivamento/timeout por inatividade ou expiração por idade máxima remove o vínculo.

O suporte a vínculo com thread é específico do adaptador. Se o adaptador do canal ativo não oferecer suporte a vínculos com thread, o OpenClaw retorna uma mensagem clara de não compatibilidade/indisponibilidade.

Flags de recurso obrigatórias para ACP vinculado a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` fica ativado por padrão (defina `false` para pausar o despacho ACP)
- Flag de adaptador de canal para spawn ACP em thread habilitada (específica do adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canais com suporte a thread

- Qualquer adaptador de canal que exponha capacidade de vínculo de sessão/thread.
- Suporte interno atual:
  - Threads/canais do Discord
  - Tópicos do Telegram (tópicos de fórum em grupos/supergrupos e tópicos de DM)
- Canais de Plugin podem adicionar suporte pela mesma interface de vínculo.

## Configurações específicas de canal

Para fluxos de trabalho não efêmeros, configure vínculos ACP persistentes em entradas de nível superior `bindings[]`.

### Modelo de vínculo

- `bindings[].type="acp"` marca um vínculo persistente de conversa ACP.
- `bindings[].match` identifica a conversa de destino:
  - Canal ou thread do Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tópico de fórum do Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/em grupo do BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` ou `chat_identifier:*` para vínculos estáveis de grupo.
  - Chat DM/em grupo do iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefira `chat_id:*` para vínculos estáveis de grupo.
- `bindings[].agentId` é o ID do agente OpenClaw proprietário.
- Substituições ACP opcionais ficam em `bindings[].acp`:
  - `mode` (`persistent` ou `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Padrões de runtime por agente

Use `agents.list[].runtime` para definir padrões ACP uma vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID do harness, por exemplo `codex` ou `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedência de substituição para sessões ACP vinculadas:

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
- Mensagens nesse canal ou tópico são roteadas para a sessão ACP configurada.
- Em conversas vinculadas, `/new` e `/reset` redefinem a mesma chave de sessão ACP no local.
- Vínculos temporários de runtime (por exemplo, criados por fluxos de foco em thread) ainda se aplicam quando presentes.
- Para spawns ACP entre agentes sem `cwd` explícito, o OpenClaw herda o workspace do agente de destino a partir da configuração do agente.
- Caminhos ausentes de workspace herdado usam fallback para o cwd padrão do backend; falhas reais de acesso em caminhos existentes aparecem como erros de spawn.

## Iniciar sessões ACP (interfaces)

### A partir de `sessions_spawn`

Use `runtime: "acp"` para iniciar uma sessão ACP a partir de um turno de agente ou chamada de ferramenta.

```json
{
  "task": "Abra o repositório e resuma os testes com falha",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Observações:

- `runtime` tem como padrão `subagent`, então defina `runtime: "acp"` explicitamente para sessões ACP.
- Se `agentId` for omitido, o OpenClaw usa `acp.defaultAgent` quando configurado.
- `mode: "session"` exige `thread: true` para manter uma conversa persistente vinculada.

Detalhes da interface:

- `task` (obrigatório): prompt inicial enviado para a sessão ACP.
- `runtime` (obrigatório para ACP): deve ser `"acp"`.
- `agentId` (opcional): ID do harness ACP de destino. Usa fallback para `acp.defaultAgent` se definido.
- `thread` (opcional, padrão `false`): solicita fluxo de vínculo com thread onde houver suporte.
- `mode` (opcional): `run` (avulso) ou `session` (persistente).
  - o padrão é `run`
  - se `thread: true` e o modo for omitido, o OpenClaw pode usar como padrão comportamento persistente conforme o caminho do runtime
  - `mode: "session"` exige `thread: true`
- `cwd` (opcional): diretório de trabalho solicitado para o runtime (validado pela política do backend/runtime). Se omitido, o spawn ACP herda o workspace do agente de destino quando configurado; caminhos herdados ausentes usam fallback para os padrões do backend, enquanto erros reais de acesso são retornados.
- `label` (opcional): rótulo voltado ao operador usado no texto de sessão/banner.
- `resumeSessionId` (opcional): retoma uma sessão ACP existente em vez de criar uma nova. O agente reproduz o histórico da conversa via `session/load`. Exige `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resumos de progresso da execução inicial ACP de volta para a sessão solicitante como eventos de sistema.
  - Quando disponível, respostas aceitas incluem `streamLogPath` apontando para um log JSONL com escopo de sessão (`<sessionId>.acp-stream.jsonl`) que você pode acompanhar para ver o histórico completo de relay.

## Modelo de entrega

Sessões ACP podem ser workspaces interativos ou trabalho em segundo plano pertencente ao pai. O caminho de entrega depende desse formato.

### Sessões ACP interativas

Sessões interativas foram feitas para continuar conversando em uma superfície visível de chat:

- `/acp spawn ... --bind here` vincula a conversa atual à sessão ACP.
- `/acp spawn ... --thread ...` vincula uma thread/tópico de canal à sessão ACP.
- `bindings[].type="acp"` persistentes e configurados roteiam conversas correspondentes para a mesma sessão ACP.

Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para a sessão ACP, e a saída ACP é entregue de volta para o mesmo canal/thread/tópico.

### Sessões ACP avulsas pertencentes ao pai

Sessões ACP avulsas geradas por outra execução de agente são filhas em segundo plano, semelhantes a subagentes:

- O pai solicita trabalho com `sessions_spawn({ runtime: "acp", mode: "run" })`.
- A filha executa em sua própria sessão de harness ACP.
- A conclusão retorna pelo caminho interno de anúncio de conclusão de tarefa.
- O pai reescreve o resultado da filha com voz normal de assistente quando uma resposta voltada ao usuário é útil.

Não trate esse caminho como um chat ponto a ponto entre pai e filha. A filha já tem um canal de conclusão de volta para o pai.

### `sessions_send` e entrega A2A

`sessions_send` pode ter como alvo outra sessão após o spawn. Para sessões pares normais, o OpenClaw usa um caminho de acompanhamento agent-to-agent (A2A) depois de injetar a mensagem:

- espera a resposta da sessão de destino
- opcionalmente permite que solicitante e destino troquem um número limitado de turnos de acompanhamento
- pede ao destino para produzir uma mensagem de anúncio
- entrega esse anúncio ao canal ou thread visível

Esse caminho A2A é um fallback para envios entre sessões pares quando a pessoa remetente precisa de um acompanhamento visível. Ele continua habilitado quando uma sessão não relacionada consegue ver e enviar mensagem para um alvo ACP, por exemplo sob configurações amplas de `tools.sessions.visibility`.

O OpenClaw ignora o acompanhamento A2A apenas quando o solicitante é o pai de sua própria filha ACP avulsa pertencente ao pai. Nesse caso, executar A2A sobre a conclusão da tarefa pode despertar o pai com o resultado da filha, encaminhar a resposta do pai de volta para a filha e criar um loop de eco entre pai e filha. O resultado de `sessions_send` informa `delivery.status="skipped"` para esse caso de filha pertencente porque o caminho de conclusão já é responsável pelo resultado.

### Retomar uma sessão existente

Use `resumeSessionId` para continuar uma sessão ACP anterior em vez de iniciar do zero. O agente reproduz o histórico da conversa via `session/load`, então retoma com o contexto completo do que aconteceu antes.

```json
{
  "task": "Continue de onde paramos — corrija as falhas de teste restantes",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comuns:

- Transferir uma sessão do Codex do seu laptop para seu celular — peça ao seu agente para retomar de onde você parou
- Continuar uma sessão de coding iniciada interativamente na CLI, agora em modo headless por meio do seu agente
- Retomar trabalho interrompido por reinicialização do gateway ou timeout por inatividade

Observações:

- `resumeSessionId` exige `runtime: "acp"` — retorna erro se usado com o runtime de subagente.
- `resumeSessionId` restaura o histórico da conversa ACP upstream; `thread` e `mode` ainda se aplicam normalmente à nova sessão OpenClaw que você está criando, então `mode: "session"` ainda exige `thread: true`.
- O agente de destino deve oferecer suporte a `session/load` (Codex e Claude Code oferecem).
- Se o ID da sessão não for encontrado, o spawn falha com um erro claro — sem fallback silencioso para uma nova sessão.

### Teste rápido de operador

Use isto após um deploy do gateway quando quiser uma verificação rápida ao vivo de que o spawn ACP
está realmente funcionando de ponta a ponta, não apenas passando em testes unitários.

Barreira recomendada:

1. Verifique a versão/commit do gateway implantado no host de destino.
2. Confirme que o código-fonte implantado inclui a aceitação de linhagem ACP em
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abra uma sessão bridge ACPX temporária para um agente ativo (por exemplo
   `razor(main)` em `jpclawhq`).
4. Peça a esse agente para chamar `sessions_spawn` com:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarefa: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifique se o agente informa:
   - `accepted=yes`
   - um `childSessionKey` real
   - nenhum erro de validação
6. Limpe a sessão bridge ACPX temporária.

Prompt de exemplo para o agente ao vivo:

```text
Use a ferramenta sessions_spawn agora com runtime: "acp", agentId: "codex" e mode: "run".
Defina a tarefa como: "Reply with exactly LIVE-ACP-SPAWN-OK".
Depois informe apenas: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Observações:

- Mantenha este teste rápido em `mode: "run"` a menos que você esteja testando
  intencionalmente sessões ACP persistentes vinculadas a thread.
- Não exija `streamTo: "parent"` para a barreira básica. Esse caminho depende de
  capacidades de solicitante/sessão e é uma verificação de integração separada.
- Trate o teste de `mode: "session"` vinculado a thread como uma segunda
  verificação de integração, mais rica, a partir de uma thread real do Discord ou tópico do Telegram.

## Compatibilidade com sandbox

Atualmente, sessões ACP executam no runtime do host, não dentro da sandbox do OpenClaw.

Limitações atuais:

- Se a sessão solicitante estiver em sandbox, spawns ACP são bloqueados tanto para `sessions_spawn({ runtime: "acp" })` quanto para `/acp spawn`.
  - Erro: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` com `runtime: "acp"` não oferece suporte a `sandbox: "require"`.
  - Erro: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Use `runtime: "subagent"` quando precisar de execução com sandbox imposta.

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

Veja [Comandos slash](/pt-BR/tools/slash-commands).

## Resolução de alvo de sessão

A maioria das ações `/acp` aceita um alvo opcional de sessão (`session-key`, `session-id` ou `session-label`).

Ordem de resolução:

1. Argumento explícito de alvo (ou `--session` para `/acp steer`)
   - tenta chave
   - depois ID de sessão em formato UUID
   - depois rótulo
2. Vínculo da thread atual (se esta conversa/thread estiver vinculada a uma sessão ACP)
3. Fallback para a sessão atual da pessoa solicitante

Vínculos com a conversa atual e vínculos com thread participam ambos da etapa 2.

Se nenhum alvo for resolvido, o OpenClaw retorna um erro claro (`Unable to resolve session target: ...`).

## Modos de vínculo no spawn

`/acp spawn` oferece suporte a `--bind here|off`.

| Modo | Comportamento |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula a conversa ativa atual no local; falha se nenhuma estiver ativa. |
| `off` | Não cria um vínculo com a conversa atual. |

Observações:

- `--bind here` é o caminho mais simples para operadores em “torne este canal ou chat alimentado por Codex”.
- `--bind here` não cria uma thread filha.
- `--bind here` só está disponível em canais que expõem suporte a vínculo com a conversa atual.
- `--bind` e `--thread` não podem ser combinados na mesma chamada de `/acp spawn`.

## Modos de thread no spawn

`/acp spawn` oferece suporte a `--thread auto|here|off`.

| Modo | Comportamento |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | Em uma thread ativa: vincula essa thread. Fora de uma thread: cria/vincula uma thread filha quando houver suporte. |
| `here` | Exige uma thread ativa atual; falha se não estiver em uma. |
| `off` | Sem vínculo. A sessão inicia desvinculada. |

Observações:

- Em superfícies sem vínculo com thread, o comportamento padrão é, na prática, `off`.
- O spawn vinculado a thread exige suporte da política do canal:
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

`/acp status` mostra as opções efetivas de runtime e, quando disponível, tanto os identificadores de sessão em nível de runtime quanto os de backend.

Alguns controles dependem de capacidades do backend. Se um backend não oferecer suporte a um controle, o OpenClaw retorna um erro claro de controle não compatível.

## Livro de receitas de comandos ACP

| Comando | O que faz | Exemplo |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | Cria sessão ACP; vínculo opcional com conversa atual ou thread. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Cancela turno em andamento da sessão de destino. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Envia instrução de direcionamento para a sessão em execução. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Fecha a sessão e desvincula alvos de thread. | `/acp close` |
| `/acp status` | Mostra backend, modo, estado, opções de runtime e capacidades. | `/acp status` |
| `/acp set-mode` | Define o modo de runtime para a sessão de destino. | `/acp set-mode plan` |
| `/acp set` | Gravação genérica de opção de configuração de runtime. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Define a substituição do diretório de trabalho do runtime. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Define o perfil da política de aprovação. | `/acp permissions strict` |
| `/acp timeout` | Define o timeout do runtime (segundos). | `/acp timeout 120` |
| `/acp model` | Define a substituição de modelo do runtime. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Remove substituições de opção de runtime da sessão. | `/acp reset-options` |
| `/acp sessions` | Lista sessões ACP recentes do armazenamento. | `/acp sessions` |
| `/acp doctor` | Integridade do backend, capacidades e correções acionáveis. | `/acp doctor` |
| `/acp install` | Exibe etapas determinísticas de instalação e habilitação. | `/acp install` |

`/acp sessions` lê o armazenamento da sessão vinculada atual ou da sessão solicitante. Comandos que aceitam tokens `session-key`, `session-id` ou `session-label` resolvem alvos por meio da descoberta de sessão do gateway, incluindo raízes personalizadas `session.store` por agente.

## Mapeamento de opções de runtime

`/acp` tem comandos de conveniência e um setter genérico.

Operações equivalentes:

- `/acp model <id>` mapeia para a chave de configuração de runtime `model`.
- `/acp permissions <profile>` mapeia para a chave de configuração de runtime `approval_policy`.
- `/acp timeout <seconds>` mapeia para a chave de configuração de runtime `timeout`.
- `/acp cwd <path>` atualiza diretamente a substituição de cwd do runtime.
- `/acp set <key> <value>` é o caminho genérico.
  - Caso especial: `key=cwd` usa o caminho de substituição de cwd.
- `/acp reset-options` limpa todas as substituições de runtime da sessão de destino.

## Suporte a harness acpx (atual)

Aliases internos atuais de harness do acpx:

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
Se sua instalação local do Cursor ainda expuser ACP como `agent acp`, substitua o comando do agente `cursor` na sua configuração do acpx em vez de alterar o padrão interno.

O uso direto da CLI do acpx também pode direcionar adaptadores arbitrários via `--agent <command>`, mas essa rota bruta de escape é um recurso da CLI do acpx (não o caminho normal `agentId` do OpenClaw).

## Configuração obrigatória

Base ACP do core:

```json5
{
  acp: {
    enabled: true,
    // Opcional. O padrão é true; defina false para pausar o despacho ACP enquanto mantém controles /acp.
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

Se o spawn ACP vinculado a thread não funcionar, verifique primeiro a flag de recurso do adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Vínculos com a conversa atual não exigem criação de thread filha. Eles exigem um contexto ativo de conversa e um adaptador de canal que exponha vínculos de conversa ACP.

Veja [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Configuração do Plugin para backend acpx

Instalações novas já vêm com o plugin de runtime empacotado `acpx` habilitado por padrão, então o ACP
normalmente funciona sem uma etapa manual de instalação do plugin.

Comece com:

```text
/acp doctor
```

Se você desabilitou `acpx`, negou-o via `plugins.allow` / `plugins.deny`, ou quiser
trocar para um checkout local de desenvolvimento, use o caminho explícito do plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalação em workspace local durante o desenvolvimento:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Depois verifique a integridade do backend:

```text
/acp doctor
```

### Configuração de comando e versão do acpx

Por padrão, o plugin de backend acpx empacotado (`acpx`) usa o binário fixado localmente no plugin:

1. O comando usa por padrão o `node_modules/.bin/acpx` local ao plugin dentro do pacote do plugin ACPX.
2. A versão esperada usa por padrão a versão fixada da extensão.
3. A inicialização registra imediatamente o backend ACP como não pronto.
4. Um job de garantia em segundo plano verifica `acpx --version`.
5. Se o binário local ao plugin estiver ausente ou incompatível, ele executa:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica novamente.

Você pode substituir comando/versão na configuração do plugin:

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
- Quando `command` aponta para um binário/caminho personalizado, a instalação automática local ao plugin é desabilitada.
- A inicialização do OpenClaw continua sem bloqueio enquanto a verificação de integridade do backend é executada.

Veja [Plugins](/pt-BR/tools/plugin).

### Instalação automática de dependências

Quando você instala o OpenClaw globalmente com `npm install -g openclaw`, as
dependências de runtime do acpx (binários específicos da plataforma) são instaladas automaticamente
por meio de um hook de postinstall. Se a instalação automática falhar, o gateway ainda inicia
normalmente e informa a dependência ausente por meio de `openclaw acp doctor`.

### Bridge MCP de ferramentas do Plugin

Por padrão, sessões ACPX **não** expõem ferramentas registradas por Plugin do OpenClaw para
o harness ACP.

Se você quiser que agentes ACP, como Codex ou Claude Code, chamem ferramentas de Plugin do
OpenClaw instaladas, como recuperação/armazenamento de memória, habilite a bridge dedicada:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP interno chamado `openclaw-plugin-tools` no bootstrap de sessão ACPX.
- Expõe ferramentas de Plugin já registradas por Plugins OpenClaw instalados e habilitados.
- Mantém o recurso explícito e desabilitado por padrão.

Observações de segurança e confiança:

- Isso amplia a superfície de ferramentas do harness ACP.
- Agentes ACP têm acesso apenas a ferramentas de Plugin já ativas no gateway.
- Trate isso como o mesmo limite de confiança de permitir que esses Plugins sejam executados
  no próprio OpenClaw.
- Revise os Plugins instalados antes de habilitar isso.

`mcpServers` personalizados continuam funcionando como antes. A bridge interna de ferramentas de Plugin é uma
conveniência adicional e opcional, não uma substituição para a configuração genérica de servidor MCP.

### Bridge MCP de ferramentas do OpenClaw

Por padrão, sessões ACPX também **não** expõem ferramentas internas do OpenClaw por
MCP. Habilite a bridge separada de ferramentas do core quando um agente ACP precisar de
ferramentas internas selecionadas, como `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

O que isso faz:

- Injeta um servidor MCP interno chamado `openclaw-tools` no bootstrap de sessão ACPX.
- Expõe ferramentas internas selecionadas do OpenClaw. O servidor inicial expõe `cron`.
- Mantém a exposição de ferramentas do core explícita e desabilitada por padrão.

### Configuração de timeout de runtime

O plugin empacotado `acpx` usa por padrão um
timeout de 120 segundos para turnos de runtime embutido. Isso dá a harnesses mais lentos, como Gemini CLI, tempo suficiente para concluir a inicialização e configuração do ACP. Substitua esse valor se seu host precisar de um
limite de runtime diferente:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicie o gateway após alterar esse valor.

### Configuração do agente de sonda de integridade

O plugin empacotado `acpx` sonda um agente de harness ao decidir se o
backend de runtime embutido está pronto. O padrão é `codex`. Se sua implantação
usar um agente ACP padrão diferente, defina o agente de sonda com o mesmo ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicie o gateway após alterar esse valor.

## Configuração de permissões

Sessões ACP executam de forma não interativa — não há TTY para aprovar ou negar prompts de permissão de gravação de arquivo e execução de shell. O plugin acpx fornece duas chaves de configuração que controlam como as permissões são tratadas:

Essas permissões de harness do ACPX são separadas das aprovações de exec do OpenClaw e separadas de flags de bypass do fornecedor em backends CLI, como Claude CLI `--permission-mode bypassPermissions`. `approve-all` do ACPX é o interruptor break-glass no nível do harness para sessões ACP.

### `permissionMode`

Controla quais operações o agente de harness pode executar sem solicitar confirmação.

| Valor | Comportamento |
| --------------- | --------------------------------------------------------- |
| `approve-all` | Aprova automaticamente todas as gravações de arquivo e comandos de shell. |
| `approve-reads` | Aprova automaticamente apenas leituras; gravações e exec exigem prompts. |
| `deny-all` | Nega todos os prompts de permissão. |

### `nonInteractivePermissions`

Controla o que acontece quando um prompt de permissão seria exibido, mas não há TTY interativo disponível (o que sempre ocorre em sessões ACP).

| Valor | Comportamento |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe a sessão com `AcpRuntimeError`. **(padrão)** |
| `deny` | Nega silenciosamente a permissão e continua (degradação elegante). |

### Configuração

Defina via configuração do plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicie o gateway após alterar esses valores.

> **Importante:** Atualmente, o OpenClaw usa por padrão `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Em sessões ACP não interativas, qualquer gravação ou exec que acione um prompt de permissão pode falhar com `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se você precisar restringir permissões, defina `nonInteractivePermissions` como `deny` para que as sessões degradem de forma elegante em vez de falharem.

## Solução de problemas

| Sintoma | Causa provável | Correção |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | Plugin de backend ausente ou desabilitado. | Instale e habilite o plugin de backend, depois execute `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP desabilitado globalmente. | Defina `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Despacho a partir de mensagens normais de thread desabilitado. | Defina `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy` | Agente não está na allowlist. | Use um `agentId` permitido ou atualize `acp.allowedAgents`. |
| `Unable to resolve session target: ...` | Token de chave/id/rótulo inválido. | Execute `/acp sessions`, copie a chave/rótulo exato e tente novamente. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` foi usado sem uma conversa vinculável ativa. | Vá para o chat/canal de destino e tente novamente, ou use spawn sem vínculo. |
| `Conversation bindings are unavailable for <channel>.` | O adaptador não tem capacidade de vínculo ACP com a conversa atual. | Use `/acp spawn ... --thread ...` onde houver suporte, configure `bindings[]` de nível superior ou vá para um canal compatível. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` foi usado fora de um contexto de thread. | Vá para a thread de destino ou use `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Outro usuário é dono do alvo de vínculo ativo. | Refaça o vínculo como proprietário ou use outra conversa ou thread. |
| `Thread bindings are unavailable for <channel>.` | O adaptador não tem capacidade de vínculo com thread. | Use `--thread off` ou vá para um adaptador/canal compatível. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | O runtime ACP é do lado do host; a sessão solicitante está em sandbox. | Use `runtime="subagent"` a partir de sessões em sandbox, ou execute o spawn ACP a partir de uma sessão sem sandbox. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` foi solicitado para o runtime ACP. | Use `runtime="subagent"` para sandbox obrigatório, ou use ACP com `sandbox="inherit"` a partir de uma sessão sem sandbox. |
| Metadados ACP ausentes para a sessão vinculada | Metadados de sessão ACP obsoletos/excluídos. | Recrie com `/acp spawn`, depois refaça o vínculo/foco da thread. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` bloqueia gravações/exec em sessão ACP não interativa. | Defina `plugins.entries.acpx.config.permissionMode` como `approve-all` e reinicie o gateway. Veja [Configuração de permissões](#permission-configuration). |
| A sessão ACP falha cedo com pouca saída | Prompts de permissão estão bloqueados por `permissionMode`/`nonInteractivePermissions`. | Verifique os logs do gateway em busca de `AcpRuntimeError`. Para permissões completas, defina `permissionMode=approve-all`; para degradação elegante, defina `nonInteractivePermissions=deny`. |
| A sessão ACP fica travada indefinidamente após concluir o trabalho | O processo do harness terminou, mas a sessão ACP não informou a conclusão. | Monitore com `ps aux \| grep acpx`; encerre processos obsoletos manualmente. |
