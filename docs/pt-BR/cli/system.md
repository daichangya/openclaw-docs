---
read_when:
    - Você quer enfileirar um evento do sistema sem criar um job cron
    - Você precisa ativar ou desativar heartbeats
    - Você quer inspecionar entradas de presença do sistema
summary: Referência da CLI para `openclaw system` (eventos do sistema, heartbeat, presença)
title: system
x-i18n:
    generated_at: "2026-04-05T12:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Auxiliares em nível de sistema para o Gateway: enfileirar eventos do sistema, controlar heartbeats
e visualizar presença.

Todos os subcomandos `system` usam RPC do Gateway e aceitam as flags compartilhadas do cliente:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Comandos comuns

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Enfileira um evento do sistema na sessão **principal**. O próximo heartbeat irá injetá-lo
como uma linha `System:` no prompt. Use `--mode now` para disparar o heartbeat
imediatamente; `next-heartbeat` aguarda o próximo tick agendado.

Flags:

- `--text <text>`: texto obrigatório do evento do sistema.
- `--mode <mode>`: `now` ou `next-heartbeat` (padrão).
- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system heartbeat last|enable|disable`

Controles de heartbeat:

- `last`: mostra o último evento de heartbeat.
- `enable`: ativa novamente os heartbeats (use isso se eles tiverem sido desativados).
- `disable`: pausa os heartbeats.

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## `system presence`

Lista as entradas atuais de presença do sistema que o Gateway conhece (nós,
instâncias e linhas de status semelhantes).

Flags:

- `--json`: saída legível por máquina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flags compartilhadas de RPC do Gateway.

## Observações

- Requer um Gateway em execução acessível pela sua configuração atual (local ou remota).
- Eventos do sistema são efêmeros e não persistem após reinicializações.
