---
read_when:
    - Você está usando DMs em modo de pareamento e precisa aprovar remetentes
summary: Referência da CLI para `openclaw pairing` (aprovar/listar solicitações de pareamento)
title: pairing
x-i18n:
    generated_at: "2026-04-05T12:38:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Aprove ou inspecione solicitações de pareamento por DM (para canais que oferecem suporte a pareamento).

Relacionado:

- Fluxo de pareamento: [Pareamento](/channels/pairing)

## Comandos

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Lista solicitações de pareamento pendentes para um canal.

Opções:

- `[channel]`: ID posicional do canal
- `--channel <channel>`: ID explícito do canal
- `--account <accountId>`: ID da conta para canais com múltiplas contas
- `--json`: saída legível por máquina

Observações:

- Se vários canais com suporte a pareamento estiverem configurados, você deverá informar um canal posicionalmente ou com `--channel`.
- Canais de plugin são permitidos, desde que o ID do canal seja válido.

## `pairing approve`

Aprova um código de pareamento pendente e permite esse remetente.

Uso:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` quando exatamente um canal com suporte a pareamento estiver configurado

Opções:

- `--channel <channel>`: ID explícito do canal
- `--account <accountId>`: ID da conta para canais com múltiplas contas
- `--notify`: envia uma confirmação de volta ao solicitante no mesmo canal

## Observações

- Entrada de canal: informe-a posicionalmente (`pairing list telegram`) ou com `--channel <channel>`.
- `pairing list` oferece suporte a `--account <accountId>` para canais com múltiplas contas.
- `pairing approve` oferece suporte a `--account <accountId>` e `--notify`.
- Se apenas um canal com suporte a pareamento estiver configurado, `pairing approve <code>` é permitido.
