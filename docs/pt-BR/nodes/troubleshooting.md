---
read_when:
    - O nó está conectado, mas ferramentas de camera/canvas/screen/exec falham
    - Você precisa do modelo mental de emparelhamento de nó versus aprovações
summary: Solucionar problemas de emparelhamento de nós, requisitos de primeiro plano, permissões e falhas de ferramentas
title: Solução de problemas de nós
x-i18n:
    generated_at: "2026-04-05T12:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Solução de problemas de nós

Use esta página quando um nó estiver visível no status, mas as ferramentas do nó falharem.

## Sequência de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois execute verificações específicas de nó:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sinais saudáveis:

- O nó está conectado e emparelhado para o papel `node`.
- `nodes describe` inclui a capacidade que você está chamando.
- As aprovações de exec mostram o modo/lista de permissões esperados.

## Requisitos de primeiro plano

`canvas.*`, `camera.*` e `screen.*` funcionam apenas em primeiro plano em nós iOS/Android.

Verificação e correção rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se você vir `NODE_BACKGROUND_UNAVAILABLE`, traga o app do nó para primeiro plano e tente novamente.

## Matriz de permissões

| Capacidade                   | iOS                                     | Android                                      | app de nó no macOS            | Código de falha típico         |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Câmera (+ microfone para áudio do clipe) | Câmera (+ microfone para áudio do clipe)     | Câmera (+ microfone para áudio do clipe) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Gravação de tela (+ microfone opcional) | Prompt de captura de tela (+ microfone opcional) | Gravação de tela             | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Enquanto em uso ou sempre (depende do modo) | Localização em primeiro/segundo plano, conforme o modo | Permissão de localização     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (caminho de host do nó)             | n/a (caminho de host do nó)                  | Aprovações de exec exigidas   | `SYSTEM_RUN_DENIED`            |

## Emparelhamento versus aprovações

Essas são barreiras diferentes:

1. **Emparelhamento do dispositivo**: este nó pode se conectar ao gateway?
2. **Política de comando de nó do gateway**: o ID do comando RPC é permitido por `gateway.nodes.allowCommands` / `denyCommands` e pelos padrões da plataforma?
3. **Aprovações de exec**: este nó pode executar localmente um comando shell específico?

Verificações rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se o emparelhamento estiver ausente, aprove primeiro o dispositivo do nó.
Se `nodes describe` não mostrar um comando, verifique a política de comando de nó do gateway e se o nó realmente declarou esse comando ao se conectar.
Se o emparelhamento estiver correto, mas `system.run` falhar, corrija as aprovações/lista de permissões de exec nesse nó.

O emparelhamento de nó é uma barreira de identidade/confiança, não uma superfície de aprovação por comando. Para `system.run`, a política por nó fica no arquivo de aprovações de exec desse nó (`openclaw approvals get --node ...`), não no registro de emparelhamento do gateway.

Para execuções com `host=node` baseadas em aprovação, o gateway também vincula a execução ao `systemRunPlan` canônico preparado. Se um chamador posterior modificar command/cwd ou metadados de sessão antes que a execução aprovada seja encaminhada, o gateway rejeita a execução como incompatibilidade de aprovação, em vez de confiar no payload editado.

## Códigos comuns de erro de nó

- `NODE_BACKGROUND_UNAVAILABLE` → o app está em segundo plano; traga-o para primeiro plano.
- `CAMERA_DISABLED` → o toggle de câmera está desabilitado nas configurações do nó.
- `*_PERMISSION_REQUIRED` → permissão do sistema operacional ausente/negada.
- `LOCATION_DISABLED` → o modo de localização está desativado.
- `LOCATION_PERMISSION_REQUIRED` → o modo de localização solicitado não foi concedido.
- `LOCATION_BACKGROUND_UNAVAILABLE` → o app está em segundo plano, mas existe apenas permissão Enquanto em uso.
- `SYSTEM_RUN_DENIED: approval required` → a solicitação de exec precisa de aprovação explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → o comando foi bloqueado pelo modo de lista de permissões.
  Em hosts de nó Windows, formas com wrapper de shell como `cmd.exe /c ...` são tratadas como falhas de lista de permissões no
  modo allowlist, a menos que sejam aprovadas pelo fluxo ask.

## Loop rápido de recuperação

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se ainda estiver travado:

- Aprove novamente o emparelhamento do dispositivo.
- Reabra o app do nó (primeiro plano).
- Conceda novamente as permissões do sistema operacional.
- Recrie/ajuste a política de aprovação de exec.

Relacionados:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
