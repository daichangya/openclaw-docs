---
read_when:
    - Você está gerenciando nodes pareados (câmeras, tela, canvas)
    - Você precisa aprovar solicitações ou invocar comandos de node
summary: Referência da CLI para `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: nodes
x-i18n:
    generated_at: "2026-04-05T12:38:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gerencie nodes pareados (dispositivos) e invoque recursos de node.

Relacionado:

- Visão geral de nodes: [Nodes](/nodes)
- Câmera: [Nodes de câmera](/nodes/camera)
- Imagens: [Nodes de imagem](/nodes/images)

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

## Comandos comuns

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tabelas de pendentes/pareados. Linhas pareadas incluem a idade da conexão mais recente (Last Connect).
Use `--connected` para mostrar apenas nodes conectados no momento. Use `--last-connected <duration>` para
filtrar nodes que se conectaram dentro de uma duração (por exemplo `24h`, `7d`).

Observação sobre aprovação:

- `openclaw nodes pending` precisa apenas do escopo de pareamento.
- `openclaw nodes approve <requestId>` herda requisitos extras de escopo da
  solicitação pendente:
  - solicitação sem comando: apenas pareamento
  - comandos de node que não sejam exec: pareamento + gravação
  - `system.run` / `system.run.prepare` / `system.which`: pareamento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags de invocação:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: tempo limite de invocação do node (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.
- `system.run` e `system.run.prepare` são bloqueados aqui; use a ferramenta `exec` com `host=node` para execução de shell.

Para execução de shell em um node, use a ferramenta `exec` com `host=node` em vez de `openclaw nodes run`.
A CLI `nodes` agora é focada em recursos: RPC direto via `nodes invoke`, além de pareamento, câmera,
tela, localização, canvas e notificações.
