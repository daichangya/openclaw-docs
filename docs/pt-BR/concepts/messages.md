---
read_when:
    - Explicando como as mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-23T05:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Mensagens

Esta página reúne como o OpenClaw lida com mensagens recebidas, sessões, enfileiramento,
streaming e visibilidade do raciocínio.

## Fluxo de mensagens (visão geral)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Os principais controles ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento em grupos.
- `agents.defaults.*` para padrões de streaming em blocos e fragmentação.
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para limites e alternâncias de streaming.

Consulte [Configuration](/pt-BR/gateway/configuration) para o esquema completo.

## Deduplicação de entrada

Os canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem, para que entregas
duplicadas não disparem outra execução do agente.

## Debounce de entrada

Mensagens rápidas e consecutivas do **mesmo remetente** podem ser agrupadas em um único
turno do agente por meio de `messages.inbound`. O debounce é aplicado por canal + conversa
e usa a mensagem mais recente para encadeamento de resposta/IDs.

Configuração (padrão global + substituições por canal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Observações:

- O debounce se aplica a mensagens **somente de texto**; mídia/anexos são liberados imediatamente.
- Comandos de controle ignoram o debounce para permanecerem independentes — **exceto** quando um canal opta explicitamente pela coalescência de DMs do mesmo remetente (por exemplo, [`coalesceSameSenderDms` do BlueBubbles](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos de DM aguardam dentro da janela de debounce para que uma carga split-send possa entrar no mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Chats diretos convergem para a chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas longas
para evitar contexto divergente. A Control UI e a TUI sempre mostram a transcrição da sessão mantida
pelo Gateway, portanto são a fonte da verdade.

Detalhes: [Session management](/pt-BR/concepts/session).

## Corpos de entrada e contexto de histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Pode incluir envelopes do canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo do
rótulo do remetente (o mesmo estilo usado nas entradas de histórico). Isso mantém consistência entre
mensagens em tempo real e mensagens enfileiradas/de histórico no prompt do agente.

Os buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
dispararam uma execução (por exemplo, mensagens condicionadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Os buffers de histórico são configuráveis por meio de `messages.groupChat.historyLimit` (padrão
global) e substituições por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e followups

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de followup.

- Configure por meio de `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Queueing](/pt-BR/concepts/queue).

## Streaming, fragmentação e batching

O streaming em blocos envia respostas parciais à medida que o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir blocos de código delimitados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching com base em ociosidade)
- `agents.defaults.humanDelay` (pausa com aparência humana entre respostas em bloco)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + chunking](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- O Telegram oferece suporte a streaming do raciocínio na bolha de rascunho.

Detalhes: [Thinking + reasoning directives](/pt-BR/tools/thinking) e [Token use](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação das mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas por meio de `replyToMode` e padrões por canal

Detalhes: [Configuration](/pt-BR/gateway/configuration-reference#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta silenciosa isolada
  para um fallback curto e visível.
- Grupos/canais permitem silêncio por padrão.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem substituí-los por superfície.

Quando a sessão pai tem uma ou mais execuções pendentes de subagentes geradas, respostas
silenciosas isoladas são descartadas em todas as superfícies em vez de serem reescritas, para que a
sessão pai permaneça silenciosa até que o evento de conclusão do filho entregue a resposta real.

## Relacionado

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Queue](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Channels](/pt-BR/channels) — integrações com plataformas de mensagens
