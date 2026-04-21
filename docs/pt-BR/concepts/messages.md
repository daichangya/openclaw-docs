---
read_when:
    - Explicando como as mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-21T13:35:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Mensagens

Esta página reúne como o OpenClaw lida com mensagens recebidas, sessões, enfileiramento,
streaming e visibilidade do raciocínio.

## Fluxo de mensagens (visão geral)

```
Mensagem recebida
  -> roteamento/vinculações -> chave da sessão
  -> fila (se uma execução estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas enviadas (limites do canal + fragmentação)
```

Os principais controles ficam na configuração:

- `messages.*` para prefixos, enfileiramento e comportamento em grupos.
- `agents.defaults.*` para padrões de streaming em blocos e fragmentação.
- Sobrescritas de canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Consulte [Configuration](/pt-BR/gateway/configuration) para o schema completo.

## Desduplicação de entrada

Os canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração indexado por canal/conta/par/sessão/id da mensagem, para que entregas
duplicadas não acionem outra execução do agente.

## Debounce de entrada

Mensagens rápidas e consecutivas do **mesmo remetente** podem ser agrupadas em um único
turno do agente via `messages.inbound`. O debounce é aplicado por canal + conversa
e usa a mensagem mais recente para encadeamento/IDs de resposta.

Configuração (padrão global + sobrescritas por canal):

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
- Comandos de controle ignoram o debounce para permanecerem isolados — **exceto** quando um canal opta explicitamente pela coalescência de DMs do mesmo remetente (por exemplo, [`coalesceSameSenderDms` do BlueBubbles](/pt-BR/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), em que comandos em DM aguardam dentro da janela de debounce para que uma carga útil enviada em partes possa entrar no mesmo turno do agente.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Chats diretos convergem para a chave da sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e as transcrições ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas longas
para evitar contexto divergente. A Control UI e a TUI sempre mostram a transcrição da sessão
mantida pelo Gateway, portanto são a fonte de verdade.

Detalhes: [Session management](/pt-BR/concepts/session).

## Corpos de entrada e contexto do histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes do canal e
  wrappers de histórico opcionais.
- `CommandBody`: texto bruto do usuário para análise de diretivas/comandos.
- `RawBody`: alias legado de `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Mensagens do chat desde a sua última resposta - para contexto]`
- `[Mensagem atual - responda a esta]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo do
rótulo do remetente (o mesmo estilo usado nas entradas do histórico). Isso mantém consistentes no prompt do agente
as mensagens em tempo real e as mensagens enfileiradas/do histórico.

Os buffers de histórico são **somente pendentes**: incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens condicionadas por menção) e **excluem** mensagens
já presentes na transcrição da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Os buffers de histórico são configuráveis via `messages.groupChat.historyLimit` (padrão
global) e sobrescritas por canal como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desabilitar).

## Enfileiramento e followups

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de followup.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Queueing](/pt-BR/concepts/queue).

## Streaming, fragmentação e agrupamento

O streaming em blocos envia respostas parciais à medida que o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir blocos de código delimitados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desligado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento com base em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas em bloco)
- Sobrescritas de canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + chunking](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo do raciocínio ainda conta para o uso de tokens quando é produzido pelo modelo.
- O Telegram oferece suporte ao streaming do raciocínio na bolha de rascunho.

Detalhes: [Thinking + reasoning directives](/pt-BR/tools/thinking) e [Token use](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixos de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas via `replyToMode` e padrões por canal

Detalhes: [Configuration](/pt-BR/gateway/configuration-reference#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta silenciosa
  isolada para uma alternativa curta e visível.
- Grupos/canais permitem silêncio por padrão.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem sobrescrevê-los por superfície.

## Relacionado

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Queue](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Channels](/pt-BR/channels) — integrações com plataformas de mensagens
