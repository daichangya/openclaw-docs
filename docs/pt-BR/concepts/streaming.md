---
read_when:
    - Explicar como streaming ou chunking funcionam nos canais
    - Alterar o comportamento de block streaming ou channel chunking
    - Depurar respostas em bloco duplicadas/antecipadas ou streaming de prévia por canal
summary: Comportamento de streaming + chunking (respostas em blocos, streaming de prévia por canal, mapeamento de modos)
title: Streaming e Chunking
x-i18n:
    generated_at: "2026-04-05T12:40:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

O OpenClaw tem duas camadas separadas de streaming:

- **Streaming em blocos (canais):** emite **blocos** concluídos à medida que o assistente escreve. Essas são mensagens normais do canal (não deltas de token).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje, **não existe streaming real de delta de token** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/anexos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em partes mais amplas à medida que ela fica disponível.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `channel send`: mensagens reais de saída (respostas em blocos).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão: desativado).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de chunking do canal: `*.chunkMode` (`length` é o padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão: 17) divide respostas altas para evitar corte na UI.

**Semântica de limites:**

- `text_end`: transmite blocos assim que o chunker os emite; faz flush em cada `text_end`.
- `message_end`: espera a mensagem do assistente terminar e então faz flush da saída armazenada.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então ele pode emitir vários chunks no final.

## Algoritmo de chunking (limites baixo/alto)

O chunking em blocos é implementado por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até que o buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Code fences:** nunca divide dentro de fences; quando forçado em `maxChars`, fecha + reabre a fence para manter o Markdown válido.

`maxChars` é limitado por `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming em blocos está habilitado, o OpenClaw pode **mesclar chunks de bloco consecutivos**
antes de enviá-los. Isso reduz o “spam de linha única” e ainda fornece
saída progressiva.

- A coalescência espera por **intervalos de inatividade** (`idleMs`) antes de fazer flush.
- Buffers são limitados por `maxChars` e fazem flush se o excederem.
- `minChars` impede o envio de fragmentos minúsculos até que texto suficiente se acumule
  (o flush final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Há substituições por canal disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é elevado para 1500 em Signal/Slack/Discord, a menos que seja substituído.

## Ritmo mais humano entre blocos

Quando o streaming em blocos está habilitado, você pode adicionar uma **pausa aleatória**
entre respostas em bloco (depois do primeiro bloco). Isso faz respostas em várias bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substituível por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais nem resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite durante a geração). Canais não Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (faz flush uma vez, possivelmente em vários chunks se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação sobre canais:** o streaming em blocos fica **desativado, a menos que**
`*.blockStreaming` seja explicitamente definido como `true`. Os canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: uma única prévia que é substituída pelo texto mais recente.
- `block`: atualizações da prévia em etapas com chunking/anexos.
- `progress`: prévia de progresso/status durante a geração, resposta final ao concluir.

### Mapeamento por canal

| Canal    | `off` | `partial` | `block` | `progress`         |
| -------- | ----- | --------- | ------- | ------------------ |
| Telegram | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord  | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                 |

Apenas para Slack:

- `channels.slack.nativeStreaming` alterna chamadas da API nativa de streaming do Slack quando `streaming=partial` (padrão: `true`).

Migração de chave legada:

- Telegram: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Discord: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para o enum `streaming`; o booleano `streaming` migra automaticamente para `nativeStreaming`.

### Comportamento em runtime

Telegram:

- Usa atualizações de prévia com `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- O streaming de prévia é ignorado quando o streaming em blocos do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode gravar raciocínio na prévia.

Discord:

- Usa envio + edição de mensagens de prévia.
- O modo `block` usa chunking de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em blocos do Discord está explicitamente habilitado.

Slack:

- `partial` pode usar o streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho no estilo append.
- `progress` usa texto de prévia de status e depois a resposta final.

## Relacionados

- [Mensagens](/concepts/messages) — ciclo de vida e entrega de mensagens
- [Retry](/concepts/retry) — comportamento de nova tentativa em falha de entrega
- [Canais](/channels) — suporte a streaming por canal
