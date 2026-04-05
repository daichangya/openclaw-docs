---
read_when:
    - Explicando como mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando visibilidade do raciocínio e implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-05T12:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
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

- `messages.*` para prefixos, enfileiramento e comportamento de grupos.
- `agents.defaults.*` para padrões de block streaming e chunking.
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuration](/gateway/configuration) para o esquema completo.

## Dedupe de entrada

Os canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração com chave por canal/conta/par/sessão/id da mensagem para que entregas duplicadas
não disparem outra execução do agente.

## Debouncing de entrada

Mensagens consecutivas rápidas do **mesmo remetente** podem ser agrupadas em um único
turno do agente via `messages.inbound`. O debouncing é limitado por canal + conversa
e usa a mensagem mais recente para threading/IDs de resposta.

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

- O debounce se aplica a mensagens **somente de texto**; mídia/anexos são descarregados imediatamente.
- Comandos de controle ignoram o debounce para que permaneçam independentes.

## Sessões e dispositivos

As sessões pertencem ao gateway, não aos clientes.

- Chats diretos são recolhidos na chave da sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas
longas para evitar divergência de contexto. A Control UI e a TUI sempre mostram a
transcrição da sessão mantida pelo gateway, então elas são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/concepts/session).

## Corpos de entrada e contexto do histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes do canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo do
rótulo do remetente (o mesmo estilo usado para entradas do histórico). Isso mantém mensagens em tempo real e enfileiradas/de histórico
consistentes no prompt do agente.

Os buffers de histórico são **somente pendentes**: eles incluem mensagens de grupo que _não_
dispararam uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que envolvem histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Os buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e substituições por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Enfileiramento](/concepts/queue).

## Streaming, chunking e batching

O block streaming envia respostas parciais à medida que o modelo produz blocos de texto.
O chunking respeita os limites de texto do canal e evita dividir blocos de código delimitados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching com base em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em bloco)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + chunking](/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- O Telegram oferece suporte a streaming do raciocínio para a bolha de rascunho.

Detalhes: [Diretivas de thinking + reasoning](/tools/thinking) e [Uso de tokens](/reference/token-use).

## Prefixos, threading e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Threading de resposta via `replyToMode` e padrões por canal

Detalhes: [Configuration](/gateway/configuration-reference#messages) e documentação dos canais.

## Relacionado

- [Streaming](/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/concepts/retry) — comportamento de nova tentativa de entrega de mensagem
- [Queue](/concepts/queue) — fila de processamento de mensagens
- [Channels](/channels) — integrações com plataformas de mensagens
