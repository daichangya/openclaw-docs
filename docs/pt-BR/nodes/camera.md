---
read_when:
    - Adicionar ou modificar captura de câmera em nós iOS/Android ou no macOS
    - Estender fluxos de trabalho de arquivos temporários MEDIA acessíveis ao agente
summary: 'Captura de câmera (nós iOS/Android + app macOS) para uso por agentes: fotos (jpg) e clipes curtos de vídeo (mp4)'
title: Captura de câmera
x-i18n:
    generated_at: "2026-04-05T12:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Captura de câmera (agente)

O OpenClaw oferece suporte a **captura de câmera** para fluxos de trabalho de agentes:

- **Nó iOS** (emparelhado via Gateway): capturar uma **foto** (`jpg`) ou **clipe curto de vídeo** (`mp4`, com áudio opcional) via `node.invoke`.
- **Nó Android** (emparelhado via Gateway): capturar uma **foto** (`jpg`) ou **clipe curto de vídeo** (`mp4`, com áudio opcional) via `node.invoke`.
- **App macOS** (nó via Gateway): capturar uma **foto** (`jpg`) ou **clipe curto de vídeo** (`mp4`, com áudio opcional) via `node.invoke`.

Todo acesso à câmera é controlado por **configurações controladas pelo usuário**.

## Nó iOS

### Configuração do usuário (ativada por padrão)

- Aba Settings do iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Comandos (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

- `camera.snap`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `maxWidth`: número (opcional; padrão `1600` no nó iOS)
    - `quality`: `0..1` (opcional; padrão `0.9`)
    - `format`: atualmente `jpg`
    - `delayMs`: número (opcional; padrão `0`)
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Proteção de payload: fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

- `camera.clip`
  - Parâmetros:
    - `facing`: `front|back` (padrão: `front`)
    - `durationMs`: número (padrão `3000`, limitado a no máximo `60000`)
    - `includeAudio`: booleano (padrão `true`)
    - `format`: atualmente `mp4`
    - `deviceId`: string (opcional; de `camera.list`)
  - Payload de resposta:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Requisito de primeiro plano

Assim como `canvas.*`, o nó iOS só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Helper da CLI (arquivos temporários + MEDIA)

A forma mais fácil de obter anexos é via helper da CLI, que grava a mídia decodificada em um arquivo temporário e imprime `MEDIA:<path>`.

Exemplos:

```bash
openclaw nodes camera snap --node <id>               # padrão: front + back (2 linhas MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Observações:

- `nodes camera snap` usa por padrão **ambas** as orientações para dar ao agente as duas visões.
- Os arquivos de saída são temporários (no diretório temporário do SO), a menos que você crie seu próprio wrapper.

## Nó Android

### Configuração do usuário no Android (ativada por padrão)

- Tela Settings do Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Padrão: **ativado** (chave ausente é tratada como habilitada).
  - Quando desativado: comandos `camera.*` retornam `CAMERA_DISABLED`.

### Permissões

- O Android exige permissões em runtime:
  - `CAMERA` tanto para `camera.snap` quanto para `camera.clip`.
  - `RECORD_AUDIO` para `camera.clip` quando `includeAudio=true`.

Se as permissões estiverem ausentes, o app solicitará quando possível; se forem negadas, solicitações `camera.*` falharão com um
erro `*_PERMISSION_REQUIRED`.

### Requisito de primeiro plano no Android

Assim como `canvas.*`, o nó Android só permite comandos `camera.*` em **primeiro plano**. Invocações em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`.

### Comandos do Android (via Gateway `node.invoke`)

- `camera.list`
  - Payload de resposta:
    - `devices`: array de `{ id, name, position, deviceType }`

### Proteção de payload

Fotos são recomprimidas para manter o payload base64 abaixo de 5 MB.

## App macOS

### Configuração do usuário (desativada por padrão)

O app complementar do macOS expõe uma caixa de seleção:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Padrão: **desativado**
  - Quando desativado: solicitações de câmera retornam “Camera disabled by user”.

### Helper da CLI (node invoke)

Use a CLI principal `openclaw` para invocar comandos de câmera no nó macOS.

Exemplos:

```bash
openclaw nodes camera list --node <id>            # lista ids de câmera
openclaw nodes camera snap --node <id>            # imprime MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # imprime MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # imprime MEDIA:<path> (flag legada)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Observações:

- `openclaw nodes camera snap` usa por padrão `maxWidth=1600`, salvo substituição.
- No macOS, `camera.snap` aguarda `delayMs` (padrão 2000ms) após estabilização de aquecimento/exposição antes de capturar.
- Payloads de foto são recomprimidos para manter o base64 abaixo de 5 MB.

## Segurança + limites práticos

- O acesso à câmera e ao microfone aciona os prompts normais de permissão do sistema operacional (e exige strings de uso em Info.plist).
- Clipes de vídeo têm limite máximo (atualmente `<= 60s`) para evitar payloads excessivos do nó (sobrecarga de base64 + limites de mensagem).

## Vídeo de tela no macOS (nível do SO)

Para vídeo de _tela_ (não câmera), use o complemento do macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # imprime MEDIA:<path>
```

Observações:

- Exige permissão **Screen Recording** do macOS (TCC).
