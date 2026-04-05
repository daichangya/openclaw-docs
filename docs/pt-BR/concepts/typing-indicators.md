---
read_when:
    - Alterando o comportamento ou os padrões do indicador de digitação
summary: Quando o OpenClaw mostra indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-04-05T12:40:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicadores de digitação

Indicadores de digitação são enviados ao canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** ela é atualizada.

## Padrões

Quando `agents.defaults.typingMode` está **não definido**, o OpenClaw mantém o comportamento legado:

- **Chats diretos**: a digitação começa imediatamente assim que o loop do modelo é iniciado.
- **Chats em grupo com uma menção**: a digitação começa imediatamente.
- **Chats em grupo sem uma menção**: a digitação começa somente quando o texto da mensagem começa a ser transmitido.
- **Execuções de heartbeat**: a digitação é desativada.

## Modos

Defina `agents.defaults.typingMode` como um dos seguintes:

- `never` — nenhum indicador de digitação, nunca.
- `instant` — começa a digitar **assim que o loop do modelo é iniciado**, mesmo que a execução
  depois retorne apenas o token de resposta silenciosa.
- `thinking` — começa a digitar no **primeiro delta de reasoning** (exige
  `reasoningLevel: "stream"` para a execução).
- `message` — começa a digitar no **primeiro delta de texto não silencioso** (ignora
  o token silencioso `NO_REPLY`).

Ordem de “quão cedo ele dispara”:
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

- O modo `message` não mostrará digitação para respostas apenas silenciosas quando todo o
  payload for exatamente o token silencioso (por exemplo `NO_REPLY` / `no_reply`,
  com correspondência sem diferenciar maiúsculas de minúsculas).
- `thinking` só dispara se a execução transmitir reasoning (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de reasoning, a digitação não começará.
- Heartbeats nunca mostram digitação, independentemente do modo.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o momento de início.
  O padrão é 6 segundos.
