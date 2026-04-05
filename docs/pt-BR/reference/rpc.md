---
read_when:
    - Adicionar ou alterar integrações com CLI externo
    - Depurar adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLIs externos (signal-cli, imsg legado) e padrões de gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-04-05T12:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# Adaptadores RPC

O OpenClaw integra CLIs externos via JSON-RPC. Hoje, dois padrões são usados.

## Padrão A: daemon HTTP (signal-cli)

- `signal-cli` é executado como um daemon com JSON-RPC sobre HTTP.
- O fluxo de eventos é SSE (`/api/v1/events`).
- Probe de integridade: `/api/v1/check`.
- O OpenClaw é responsável pelo ciclo de vida quando `channels.signal.autoStart=true`.

Veja [Signal](/pt-BR/channels/signal) para setup e endpoints.

## Padrão B: processo filho stdio (legado: imsg)

> **Observação:** para novas configurações do iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles).

- O OpenClaw inicia `imsg rpc` como um processo filho (integração legada com iMessage).
- JSON-RPC é delimitado por linha em stdin/stdout (um objeto JSON por linha).
- Não há porta TCP, nem daemon necessário.

Métodos do core usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnóstico)

Veja [iMessage](/pt-BR/channels/imessage) para setup legado e endereçamento (`chat_id` preferido).

## Diretrizes do adaptador

- O gateway é responsável pelo processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha os clientes RPC resilientes: timeouts, reinício ao encerrar.
- Prefira IDs estáveis (por exemplo, `chat_id`) em vez de strings de exibição.
