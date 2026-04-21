---
read_when:
    - Explicando como mensagens recebidas se tornam respostas
    - Esclarecendo sessões, modos de enfileiramento ou comportamento de streaming
    - Documentando a visibilidade do raciocínio e as implicações de uso
summary: Fluxo de mensagens, sessões, enfileiramento e visibilidade do raciocínio
title: Mensagens
x-i18n:
    generated_at: "2026-04-21T05:36:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# Mensagens

Esta página reúne como o OpenClaw lida com mensagens recebidas, sessões, enfileiramento,
streaming e visibilidade do raciocínio.

## Fluxo de mensagens (visão geral)

```
Mensagem recebida
  -> roteamento/bindings -> chave de sessão
  -> fila (se uma execução estiver ativa)
  -> execução do agente (streaming + ferramentas)
  -> respostas de saída (limites do canal + fragmentação)
```

As principais opções de configuração ficam em:

- `messages.*` para prefixos, enfileiramento e comportamento em grupo.
- `agents.defaults.*` para padrões de block streaming e fragmentação.
- Substituições por canal (`channels.whatsapp.*`, `channels.telegram.*` etc.) para limites e alternâncias de streaming.

Veja [Configuração](/pt-BR/gateway/configuration) para o schema completo.

## Deduplicação de entrada

Os canais podem reenviar a mesma mensagem após reconexões. O OpenClaw mantém um
cache de curta duração com chave por canal/conta/par/sessão/id da mensagem, para que entregas
duplicadas não acionem outra execução do agente.

## Debouncing de entrada

Mensagens rápidas consecutivas do **mesmo remetente** podem ser agrupadas em um único
turno do agente por meio de `messages.inbound`. O debouncing é escopado por canal + conversa
e usa a mensagem mais recente para encadeamento/IDs de resposta.

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

- Debounce se aplica a mensagens **somente de texto**; mídia/anexos são descarregados imediatamente.
- Comandos de controle ignoram o debouncing para continuarem independentes.

## Sessões e dispositivos

As sessões pertencem ao Gateway, não aos clientes.

- Chats diretos colapsam na chave de sessão principal do agente.
- Grupos/canais recebem suas próprias chaves de sessão.
- O armazenamento de sessões e os transcripts ficam no host do Gateway.

Vários dispositivos/canais podem mapear para a mesma sessão, mas o histórico não é totalmente
sincronizado de volta para todos os clientes. Recomendação: use um dispositivo principal para conversas longas
para evitar contexto divergente. A UI de Controle e a TUI sempre mostram o transcript
mantido pelo Gateway, então elas são a fonte da verdade.

Detalhes: [Gerenciamento de sessões](/pt-BR/concepts/session).

## Corpos de entrada e contexto de histórico

O OpenClaw separa o **corpo do prompt** do **corpo do comando**:

- `Body`: texto do prompt enviado ao agente. Isso pode incluir envelopes do canal e
  wrappers opcionais de histórico.
- `CommandBody`: texto bruto do usuário para parsing de diretivas/comandos.
- `RawBody`: alias legado para `CommandBody` (mantido por compatibilidade).

Quando um canal fornece histórico, ele usa um wrapper compartilhado:

- `[Mensagens do chat desde sua última resposta - para contexto]`
- `[Mensagem atual - responda a esta]`

Para **chats não diretos** (grupos/canais/salas), o **corpo da mensagem atual** recebe o prefixo do
rótulo do remetente (o mesmo estilo usado para entradas de histórico). Isso mantém consistentes
as mensagens em tempo real e as enfileiradas/de histórico no prompt do agente.

Buffers de histórico são **somente pendentes**: incluem mensagens de grupo que _não_
acionaram uma execução (por exemplo, mensagens bloqueadas por menção) e **excluem** mensagens
já presentes no transcript da sessão.

A remoção de diretivas se aplica apenas à seção da **mensagem atual**, para que o histórico
permaneça intacto. Canais que encapsulam histórico devem definir `CommandBody` (ou
`RawBody`) como o texto original da mensagem e manter `Body` como o prompt combinado.
Buffers de histórico são configuráveis por `messages.groupChat.historyLimit` (padrão
global) e substituições por canal, como `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (defina `0` para desativar).

## Enfileiramento e acompanhamentos

Se uma execução já estiver ativa, mensagens recebidas podem ser enfileiradas, direcionadas para a
execução atual ou coletadas para um turno de acompanhamento.

- Configure via `messages.queue` (e `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, além de variantes de backlog.

Detalhes: [Enfileiramento](/pt-BR/concepts/queue).

## Streaming, fragmentação e agrupamento

Block streaming envia respostas parciais à medida que o modelo produz blocos de texto.
A fragmentação respeita os limites de texto do canal e evita dividir blocos de código delimitados.

Principais configurações:

- `agents.defaults.blockStreamingDefault` (`on|off`, padrão desativado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamento baseado em inatividade)
- `agents.defaults.humanDelay` (pausa semelhante à humana entre respostas por bloco)
- Substituições por canal: `*.blockStreaming` e `*.blockStreamingCoalesce` (canais não Telegram exigem `*.blockStreaming: true` explícito)

Detalhes: [Streaming + fragmentação](/pt-BR/concepts/streaming).

## Visibilidade do raciocínio e tokens

O OpenClaw pode expor ou ocultar o raciocínio do modelo:

- `/reasoning on|off|stream` controla a visibilidade.
- O conteúdo de raciocínio ainda conta para o uso de tokens quando produzido pelo modelo.
- O Telegram oferece suporte a streaming de raciocínio no balão de rascunho.

Detalhes: [Diretivas de thinking + reasoning](/pt-BR/tools/thinking) e [Uso de tokens](/pt-BR/reference/token-use).

## Prefixos, encadeamento e respostas

A formatação de mensagens de saída é centralizada em `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` e `channels.<channel>.accounts.<id>.responsePrefix` (cascata de prefixo de saída), além de `channels.whatsapp.messagePrefix` (prefixo de entrada do WhatsApp)
- Encadeamento de respostas por `replyToMode` e padrões por canal

Detalhes: [Configuração](/pt-BR/gateway/configuration-reference#messages) e documentação dos canais.

## Respostas silenciosas

O token silencioso exato `NO_REPLY` / `no_reply` significa “não entregar uma resposta visível ao usuário”.
O OpenClaw resolve esse comportamento por tipo de conversa:

- Conversas diretas não permitem silêncio por padrão e reescrevem uma resposta
  silenciosa isolada para um fallback curto visível.
- Grupos/canais permitem silêncio por padrão.
- A orquestração interna permite silêncio por padrão.

Os padrões ficam em `agents.defaults.silentReply` e
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` e
`surfaces.<id>.silentReplyRewrite` podem substituí-los por superfície.

## Relacionado

- [Streaming](/pt-BR/concepts/streaming) — entrega de mensagens em tempo real
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa de entrega de mensagens
- [Queue](/pt-BR/concepts/queue) — fila de processamento de mensagens
- [Channels](/pt-BR/channels) — integrações com plataformas de mensagens
