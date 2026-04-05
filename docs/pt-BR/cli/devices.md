---
read_when:
    - Você está aprovando solicitações de pairing de dispositivos
    - Você precisa rotacionar ou revogar tokens de dispositivos
summary: Referência da CLI para `openclaw devices` (pairing de dispositivos + rotação/revogação de tokens)
title: devices
x-i18n:
    generated_at: "2026-04-05T12:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gerencie solicitações de pairing de dispositivos e tokens com escopo de dispositivo.

## Comandos

### `openclaw devices list`

Liste solicitações de pairing pendentes e dispositivos pareados.

```
openclaw devices list
openclaw devices list --json
```

A saída de solicitações pendentes inclui a função e os escopos solicitados para que as aprovações possam
ser revisadas antes de você aprovar.

### `openclaw devices remove <deviceId>`

Remova uma entrada de dispositivo pareado.

Quando você está autenticado com um token de dispositivo pareado, chamadores não administradores podem
remover apenas a entrada do dispositivo **deles próprios**. Remover algum outro dispositivo requer
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Limpe dispositivos pareados em massa.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprove uma solicitação pendente de pairing de dispositivo. Se `requestId` for omitido, o OpenClaw
aprova automaticamente a solicitação pendente mais recente.

Observação: se um dispositivo tentar novamente o pairing com detalhes de autenticação alterados (função/escopos/chave pública),
o OpenClaw substitui a entrada pendente anterior e emite um novo
`requestId`. Execute `openclaw devices list` imediatamente antes da aprovação para usar o
ID atual.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rejeite uma solicitação pendente de pairing de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotacione um token de dispositivo para uma função específica (opcionalmente atualizando os escopos).
A função de destino já deve existir no contrato de pairing aprovado desse dispositivo;
a rotação não pode emitir uma nova função não aprovada.
Se você omitir `--scope`, reconexões futuras com o token rotacionado armazenado reutilizarão os
escopos aprovados em cache desse token. Se você passar valores explícitos de `--scope`, eles
se tornarão o conjunto de escopos armazenado para futuras reconexões com token em cache.
Chamadores não administradores com dispositivo pareado podem rotacionar apenas o token do dispositivo **deles próprios**.
Além disso, quaisquer valores explícitos de `--scope` devem permanecer dentro dos próprios
escopos de operador da sessão do chamador; a rotação não pode emitir um token de operador mais amplo do que o chamador
já possui.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Retorna a nova carga útil do token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revogue um token de dispositivo para uma função específica.

Chamadores não administradores com dispositivo pareado podem revogar apenas o token do dispositivo **deles próprios**.
Revogar o token de algum outro dispositivo requer `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Retorna o resultado da revogação como JSON.

## Opções comuns

- `--url <url>`: URL WebSocket do gateway (usa `gateway.remote.url` por padrão quando configurado).
- `--token <token>`: token do gateway (se necessário).
- `--password <password>`: senha do gateway (autenticação por senha).
- `--timeout <ms>`: tempo limite de RPC.
- `--json`: saída JSON (recomendado para scripts).

Observação: quando você define `--url`, a CLI não usa fallback para credenciais da configuração ou do ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

## Observações

- A rotação de token retorna um novo token (sensível). Trate-o como um segredo.
- Esses comandos exigem escopo `operator.pairing` (ou `operator.admin`).
- A rotação de token permanece dentro do conjunto de funções de pairing aprovadas e da linha de base de escopo aprovada
  para esse dispositivo. Uma entrada de token em cache fora do esperado não concede um novo
  destino de rotação.
- Para sessões de token de dispositivo pareado, o gerenciamento entre dispositivos é somente para administradores:
  `remove`, `rotate` e `revoke` são apenas para o próprio dispositivo, a menos que o chamador tenha
  `operator.admin`.
- `devices clear` é intencionalmente protegido por `--yes`.
- Se o escopo de pairing não estiver disponível no local loopback (e nenhum `--url` explícito for passado), `list`/`approve` podem usar um fallback de pairing local.
- `devices approve` escolhe automaticamente a solicitação pendente mais recente quando você omite `requestId` ou passa `--latest`.

## Checklist de recuperação de divergência de token

Use isto quando a Control UI ou outros clientes continuarem falhando com `AUTH_TOKEN_MISMATCH` ou `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirme a origem atual do token do gateway:

```bash
openclaw config get gateway.auth.token
```

2. Liste os dispositivos pareados e identifique o id do dispositivo afetado:

```bash
openclaw devices list
```

3. Rotacione o token de operador do dispositivo afetado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se a rotação não for suficiente, remova o pairing desatualizado e aprove novamente:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Tente novamente a conexão do cliente com o token/senha compartilhado atual.

Observações:

- A precedência normal de autenticação em reconexões é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
- A recuperação confiável de `AUTH_TOKEN_MISMATCH` pode enviar temporariamente tanto o token compartilhado quanto o token de dispositivo armazenado juntos para a única nova tentativa delimitada.

Relacionado:

- [Solução de problemas de autenticação do painel](/web/dashboard#if-you-see-unauthorized-1008)
- [Solução de problemas do gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
