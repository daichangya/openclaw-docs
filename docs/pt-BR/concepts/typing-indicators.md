---
read_when:
    - Alterando o comportamento ou os padrões do indicador de digitação
summary: Quando o OpenClaw mostra indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-04-22T05:34:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicadores de digitação

Os indicadores de digitação são enviados para o canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** ela é atualizada.

## Padrões

Quando `agents.defaults.typingMode` está **não definido**, o OpenClaw mantém o comportamento legado:

- **Chats diretos**: a digitação começa imediatamente assim que o loop do modelo começa.
- **Chats em grupo com uma menção**: a digitação começa imediatamente.
- **Chats em grupo sem uma menção**: a digitação começa somente quando o texto da mensagem começa a ser transmitido.
- **Execuções de Heartbeat**: a digitação começa quando a execução de Heartbeat começa, se o
  destino de Heartbeat resolvido for um chat com suporte a digitação e a digitação não estiver desativada.

## Modos

Defina `agents.defaults.typingMode` como um destes valores:

- `never` — nenhum indicador de digitação, nunca.
- `instant` — começa a digitar **assim que o loop do modelo começa**, mesmo que a execução
  depois retorne apenas o token de resposta silenciosa.
- `thinking` — começa a digitar no **primeiro delta de raciocínio** (requer
  `reasoningLevel: "stream"` para a execução).
- `message` — começa a digitar no **primeiro delta de texto não silencioso** (ignora
  o token silencioso `NO_REPLY`).

Ordem de “quão cedo ele é acionado”:
`never` → `message` → `thinking` → `instant`

## Configuração

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Você pode substituir o modo ou a cadência por sessão:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Observações

- O modo `message` não mostrará digitação para respostas apenas silenciosas quando toda a
  carga útil for exatamente o token silencioso (por exemplo `NO_REPLY` / `no_reply`,
  com correspondência sem diferenciar maiúsculas de minúsculas).
- `thinking` só é acionado se a execução transmitir raciocínio (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de raciocínio, a digitação não começará.
- A digitação de Heartbeat é um sinal de atividade para o destino de entrega resolvido. Ela
  começa no início da execução de Heartbeat em vez de seguir o tempo de transmissão de `message` ou `thinking`.
  Defina `typingMode: "never"` para desativá-la.
- Heartbeats não mostram digitação quando `target: "none"`, quando o destino não pode
  ser resolvido, quando a entrega de chat está desativada para o Heartbeat ou quando o
  canal não oferece suporte a digitação.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o momento de início.
  O padrão é 6 segundos.
