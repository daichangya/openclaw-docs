---
read_when:
    - Você precisa depurar ids de sessão, JSONL de transcrição ou campos de sessions.json
    - Você está alterando o comportamento de compactação automática ou adicionando manutenção “pré-compactação”
    - Você quer implementar flushes de memória ou turnos silenciosos do sistema
summary: 'Análise detalhada: armazenamento de sessão + transcrições, ciclo de vida e internos da compactação (automática)'
title: Análise detalhada do gerenciamento de sessão
x-i18n:
    generated_at: "2026-04-05T12:52:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gerenciamento de sessão e compactação (análise detalhada)

Este documento explica como o OpenClaw gerencia sessões de ponta a ponta:

- **Roteamento de sessão** (como mensagens de entrada são mapeadas para uma `sessionKey`)
- **Armazenamento de sessão** (`sessions.json`) e o que ele rastreia
- **Persistência de transcrição** (`*.jsonl`) e sua estrutura
- **Higiene de transcrição** (ajustes específicos do provedor antes das execuções)
- **Limites de contexto** (janela de contexto vs tokens rastreados)
- **Compactação** (compactação manual + automática) e onde conectar trabalho de pré-compactação
- **Manutenção silenciosa** (por exemplo, gravações de memória que não devem produzir saída visível ao usuário)

Se você quiser primeiro uma visão geral de nível mais alto, comece com:

- [/concepts/session](/pt-BR/concepts/session)
- [/concepts/compaction](/pt-BR/concepts/compaction)
- [/concepts/memory](/pt-BR/concepts/memory)
- [/concepts/memory-search](/pt-BR/concepts/memory-search)
- [/concepts/session-pruning](/pt-BR/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Fonte da verdade: o Gateway

O OpenClaw foi projetado em torno de um único **processo Gateway** que detém o estado da sessão.

- UIs (app macOS, UI web Control, TUI) devem consultar o Gateway para listas de sessões e contagens de tokens.
- No modo remoto, os arquivos de sessão estão no host remoto; “verificar os arquivos no seu Mac local” não refletirá o que o Gateway está usando.

---

## Duas camadas de persistência

O OpenClaw persiste sessões em duas camadas:

1. **Armazenamento de sessão (`sessions.json`)**
   - Mapa chave/valor: `sessionKey -> SessionEntry`
   - Pequeno, mutável, seguro para editar (ou excluir entradas)
   - Rastreia metadados da sessão (id da sessão atual, última atividade, alternâncias, contadores de tokens etc.)

2. **Transcrição (`<sessionId>.jsonl`)**
   - Transcrição append-only com estrutura em árvore (as entradas têm `id` + `parentId`)
   - Armazena a conversa real + chamadas de ferramenta + resumos de compactação
   - Usada para reconstruir o contexto do modelo para turnos futuros

---

## Locais em disco

Por agente, no host do Gateway:

- Armazenamento: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessões de tópico do Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

O OpenClaw resolve isso via `src/config/sessions.ts`.

---

## Manutenção do armazenamento e controles de disco

A persistência de sessão tem controles automáticos de manutenção (`session.maintenance`) para `sessions.json` e artefatos de transcrição:

- `mode`: `warn` (padrão) ou `enforce`
- `pruneAfter`: limite de idade para entradas obsoletas (padrão `30d`)
- `maxEntries`: limite de entradas em `sessions.json` (padrão `500`)
- `rotateBytes`: faz rotação de `sessions.json` quando fica grande demais (padrão `10mb`)
- `resetArchiveRetention`: retenção para arquivos de arquivamento de transcrição `*.reset.<timestamp>` (padrão: igual a `pruneAfter`; `false` desabilita a limpeza)
- `maxDiskBytes`: orçamento opcional para o diretório de sessões
- `highWaterBytes`: alvo opcional após a limpeza (padrão `80%` de `maxDiskBytes`)

Ordem de aplicação para limpeza por orçamento de disco (`mode: "enforce"`):

1. Remova primeiro os artefatos de transcrição arquivados ou órfãos mais antigos.
2. Se ainda estiver acima da meta, remova as entradas de sessão mais antigas e seus arquivos de transcrição.
3. Continue até que o uso esteja em ou abaixo de `highWaterBytes`.

No `mode: "warn"`, o OpenClaw informa possíveis remoções, mas não altera o armazenamento/arquivos.

Execute a manutenção sob demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessões de cron e logs de execução

Execuções isoladas de cron também criam entradas/transcrições de sessão e têm controles de retenção dedicados:

- `cron.sessionRetention` (padrão `24h`) remove sessões antigas de execução isolada de cron do armazenamento de sessões (`false` desabilita).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podam arquivos `~/.openclaw/cron/runs/<jobId>.jsonl` (padrões: `2_000_000` bytes e `2000` linhas).

---

## Chaves de sessão (`sessionKey`)

Uma `sessionKey` identifica _em qual compartimento de conversa_ você está (roteamento + isolamento).

Padrões comuns:

- Chat principal/direto (por agente): `agent:<agentId>:<mainKey>` (padrão `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que seja substituído)

As regras canônicas estão documentadas em [/concepts/session](/pt-BR/concepts/session).

---

## IDs de sessão (`sessionId`)

Cada `sessionKey` aponta para um `sessionId` atual (o arquivo de transcrição que continua a conversa).

Regras gerais:

- **Reset** (`/new`, `/reset`) cria um novo `sessionId` para essa `sessionKey`.
- **Reset diário** (padrão 4:00 da manhã no horário local do host do gateway) cria um novo `sessionId` na próxima mensagem após o limite de reset.
- **Expiração por inatividade** (`session.reset.idleMinutes` ou legado `session.idleMinutes`) cria um novo `sessionId` quando uma mensagem chega após a janela de inatividade. Quando diário + inatividade estão ambos configurados, vale o que expirar primeiro.
- **Proteção de bifurcação de pai de thread** (`session.parentForkMaxTokens`, padrão `100000`) pula a bifurcação da transcrição pai quando a sessão pai já está grande demais; a nova thread começa do zero. Defina `0` para desabilitar.

Detalhe de implementação: a decisão acontece em `initSessionState()` em `src/auto-reply/reply/session.ts`.

---

## Schema do armazenamento de sessão (`sessions.json`)

O tipo de valor do armazenamento é `SessionEntry` em `src/config/sessions.ts`.

Campos principais (não exaustivo):

- `sessionId`: id da transcrição atual (o nome do arquivo é derivado disso, a menos que `sessionFile` esteja definido)
- `updatedAt`: timestamp da última atividade
- `sessionFile`: substituição opcional explícita do caminho da transcrição
- `chatType`: `direct | group | room` (ajuda UIs e política de envio)
- `provider`, `subject`, `room`, `space`, `displayName`: metadados para rotulagem de grupo/canal
- Alternâncias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (substituição por sessão)
- Seleção de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependentes do provedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: quantas vezes a compactação automática foi concluída para esta chave de sessão
- `memoryFlushAt`: timestamp do último flush de memória pré-compactação
- `memoryFlushCompactionCount`: contagem de compactação quando o último flush foi executado

O armazenamento é seguro para editar, mas o Gateway é a autoridade: ele pode regravar ou reidratar entradas à medida que as sessões são executadas.

---

## Estrutura da transcrição (`*.jsonl`)

As transcrições são gerenciadas pelo `SessionManager` de `@mariozechner/pi-coding-agent`.

O arquivo é JSONL:

- Primeira linha: cabeçalho da sessão (`type: "session"`, inclui `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Depois: entradas da sessão com `id` + `parentId` (árvore)

Tipos de entrada notáveis:

- `message`: mensagens de usuário/assistente/toolResult
- `custom_message`: mensagens injetadas por extensão que _entram_ no contexto do modelo (podem ser ocultadas da UI)
- `custom`: estado da extensão que _não entra_ no contexto do modelo
- `compaction`: resumo persistido da compactação com `firstKeptEntryId` e `tokensBefore`
- `branch_summary`: resumo persistido ao navegar por um ramo da árvore

O OpenClaw intencionalmente **não** “corrige” transcrições; o Gateway usa `SessionManager` para lê-las/escrevê-las.

---

## Janelas de contexto vs tokens rastreados

Dois conceitos diferentes importam:

1. **Janela de contexto do modelo**: limite rígido por modelo (tokens visíveis para o modelo)
2. **Contadores do armazenamento de sessão**: estatísticas acumuladas gravadas em `sessions.json` (usadas em /status e dashboards)

Se você estiver ajustando limites:

- A janela de contexto vem do catálogo de modelos (e pode ser substituída via configuração).
- `contextTokens` no armazenamento é um valor de estimativa/relato em runtime; não o trate como garantia estrita.

Para mais detalhes, veja [/token-use](/reference/token-use).

---

## Compactação: o que é

A compactação resume a conversa mais antiga em uma entrada `compaction` persistida na transcrição e mantém as mensagens recentes intactas.

Após a compactação, turnos futuros veem:

- O resumo de compactação
- Mensagens após `firstKeptEntryId`

A compactação é **persistente** (diferentemente da poda de sessão). Veja [/concepts/session-pruning](/pt-BR/concepts/session-pruning).

## Limites de chunk da compactação e pareamento de ferramentas

Quando o OpenClaw divide uma transcrição longa em chunks de compactação, ele mantém
as chamadas de ferramenta do assistente pareadas com suas entradas `toolResult` correspondentes.

- Se a divisão por participação de tokens cair entre uma chamada de ferramenta e seu resultado, o OpenClaw
  desloca o limite para a mensagem da chamada de ferramenta do assistente em vez de separar
  o par.
- Se um bloco final de resultado de ferramenta de outra forma ultrapassaria a meta do chunk,
  o OpenClaw preserva esse bloco de ferramenta pendente e mantém intacta a cauda não resumida.
- Blocos de chamada de ferramenta abortados/com erro não mantêm uma divisão pendente aberta.

---

## Quando a compactação automática acontece (runtime Pi)

No agente Pi incorporado, a compactação automática é acionada em dois casos:

1. **Recuperação de overflow**: o modelo retorna um erro de estouro de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` e variantes semelhantes moldadas pelo provedor) → compactar → tentar novamente.
2. **Manutenção por limite**: após um turno bem-sucedido, quando:

`contextTokens > contextWindow - reserveTokens`

Onde:

- `contextWindow` é a janela de contexto do modelo
- `reserveTokens` é a folga reservada para prompts + a próxima saída do modelo

Essas são semânticas do runtime Pi (o OpenClaw consome os eventos, mas o Pi decide quando compactar).

---

## Configurações de compactação (`reserveTokens`, `keepRecentTokens`)

As configurações de compactação do Pi ficam nas configurações do Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

O OpenClaw também aplica um piso de segurança para execuções incorporadas:

- Se `compaction.reserveTokens < reserveTokensFloor`, o OpenClaw o aumenta.
- O piso padrão é `20000` tokens.
- Defina `agents.defaults.compaction.reserveTokensFloor: 0` para desabilitar o piso.
- Se já estiver mais alto, o OpenClaw o deixa como está.

Por quê: deixar folga suficiente para “manutenção” de múltiplos turnos (como gravações de memória) antes que a compactação se torne inevitável.

Implementação: `ensurePiCompactionReserveTokens()` em `src/agents/pi-settings.ts`
(chamado por `src/agents/pi-embedded-runner.ts`).

---

## Superfícies visíveis ao usuário

Você pode observar a compactação e o estado da sessão por meio de:

- `/status` (em qualquer sessão de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo verboso: `🧹 Auto-compaction complete` + contagem de compactação

---

## Manutenção silenciosa (`NO_REPLY`)

O OpenClaw oferece suporte a turnos “silenciosos” para tarefas em segundo plano em que o usuário não deve ver saída intermediária.

Convenção:

- O assistente começa sua saída com o token silencioso exato `NO_REPLY` /
  `no_reply` para indicar “não entregue uma resposta ao usuário”.
- O OpenClaw remove/suprime isso na camada de entrega.
- A supressão exata do token silencioso não diferencia maiúsculas de minúsculas, então `NO_REPLY` e
  `no_reply` contam quando a carga inteira é apenas o token silencioso.
- Isso serve apenas para turnos realmente em segundo plano/sem entrega; não é um atalho para
  solicitações normais acionáveis do usuário.

A partir de `2026.1.10`, o OpenClaw também suprime **streaming de rascunho/digitação** quando um
chunk parcial começa com `NO_REPLY`, para que operações silenciosas não vazem saída parcial no meio do turno.

---

## "Memory flush" pré-compactação (implementado)

Objetivo: antes que a compactação automática aconteça, executar um turno agêntico silencioso que grave
estado durável em disco (por exemplo, `memory/YYYY-MM-DD.md` no workspace do agente) para que a compactação não possa
apagar contexto crítico.

O OpenClaw usa a abordagem de **flush antes do limite**:

1. Monitorar o uso de contexto da sessão.
2. Quando ele cruza um “limite suave” (abaixo do limite de compactação do Pi), executar uma diretiva silenciosa
   “gravar memória agora” para o agente.
3. Usar o token silencioso exato `NO_REPLY` / `no_reply` para que o usuário não veja
   nada.

Configuração (`agents.defaults.compaction.memoryFlush`):

- `enabled` (padrão: `true`)
- `softThresholdTokens` (padrão: `4000`)
- `prompt` (mensagem do usuário para o turno de flush)
- `systemPrompt` (prompt extra de sistema acrescentado ao turno de flush)

Observações:

- O prompt/system prompt padrão inclui uma dica `NO_REPLY` para suprimir
  a entrega.
- O flush é executado uma vez por ciclo de compactação (rastreado em `sessions.json`).
- O flush é executado apenas para sessões Pi incorporadas (backends de CLI o ignoram).
- O flush é ignorado quando o workspace da sessão é somente leitura (`workspaceAccess: "ro"` ou `"none"`).
- Veja [Memória](/pt-BR/concepts/memory) para o layout de arquivos do workspace e padrões de gravação.

O Pi também expõe um hook `session_before_compact` na API de extensão, mas a lógica de
flush do OpenClaw vive hoje no lado do Gateway.

---

## Checklist de solução de problemas

- Chave de sessão errada? Comece com [/concepts/session](/pt-BR/concepts/session) e confirme a `sessionKey` em `/status`.
- Incompatibilidade entre armazenamento e transcrição? Confirme o host do Gateway e o caminho do armazenamento em `openclaw status`.
- Spam de compactação? Verifique:
  - janela de contexto do modelo (pequena demais)
  - configurações de compactação (`reserveTokens` alto demais para a janela do modelo pode causar compactação mais cedo)
  - inchaço de tool-result: habilite/ajuste a poda de sessão
- Turnos silenciosos vazando? Confirme que a resposta começa com `NO_REPLY` (token exato sem diferenciação de maiúsculas/minúsculas) e que você está em uma build que inclui a correção de supressão de streaming.
