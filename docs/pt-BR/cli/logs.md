---
read_when:
    - Você precisa acompanhar logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log em JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhar logs do gateway via RPC)
title: logs
x-i18n:
    generated_at: "2026-04-05T12:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Acompanhe logs de arquivo do Gateway por RPC (funciona no modo remoto).

Relacionado:

- Visão geral de logs: [Logging](/logging)
- CLI do Gateway: [gateway](/cli/gateway)

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão `200`)
- `--max-bytes <n>`: número máximo de bytes a ler do arquivo de log (padrão `250000`)
- `--follow`: acompanha o stream de logs
- `--interval <ms>`: intervalo de polling durante o acompanhamento (padrão `1000`)
- `--json`: emite eventos JSON delimitados por linha
- `--plain`: saída em texto simples sem formatação estilizada
- `--no-color`: desativa cores ANSI
- `--local-time`: renderiza timestamps no seu fuso horário local

## Opções RPC compartilhadas do Gateway

`openclaw logs` também aceita as flags padrão do cliente Gateway:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: timeout em ms (padrão `30000`)
- `--expect-final`: aguarda uma resposta final quando a chamada ao Gateway é respaldada por agente

Quando você passa `--url`, a CLI não aplica automaticamente credenciais de configuração ou de ambiente. Inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

## Exemplos

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Observações

- Use `--local-time` para renderizar timestamps no seu fuso horário local.
- Se o Gateway local loopback pedir pairing, `openclaw logs` usa automaticamente o arquivo de log local configurado como fallback. Destinos `--url` explícitos não usam esse fallback.
