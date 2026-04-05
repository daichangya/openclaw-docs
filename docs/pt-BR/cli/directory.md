---
read_when:
    - Você quer procurar IDs de contatos/grupos/próprio para um canal
    - Você está desenvolvendo um adaptador de diretório de canal
summary: Referência da CLI para `openclaw directory` (self, peers, groups)
title: directory
x-i18n:
    generated_at: "2026-04-05T12:37:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Consultas de diretório para canais que oferecem suporte a isso (contatos/pares, grupos e “me”).

## Flags comuns

- `--channel <name>`: id/alias do canal (obrigatório quando vários canais estão configurados; automático quando apenas um está configurado)
- `--account <id>`: id da conta (padrão: conta padrão do canal)
- `--json`: saída JSON

## Observações

- `directory` foi feito para ajudar você a encontrar IDs que pode colar em outros comandos (especialmente `openclaw message send --target ...`).
- Para muitos canais, os resultados vêm da configuração (listas de permissões / grupos configurados), e não de um diretório ativo do provider.
- A saída padrão é `id` (e às vezes `name`) separados por tabulação; use `--json` para scripts.

## Usando resultados com `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formatos de ID (por canal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupo)
- Telegram: `@username` ou id numérico do chat; grupos são IDs numéricos
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` ou `#alias:server`
- Microsoft Teams (plugin): `user:<id>` e `conversation:<id>`
- Zalo (plugin): id do usuário (Bot API)
- Zalo Personal / `zalouser` (plugin): id da thread (DM/grupo) de `zca` (`me`, `friend list`, `group list`)

## Próprio ("me")

```bash
openclaw directory self --channel zalouser
```

## Pares (contatos/usuários)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Grupos

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
