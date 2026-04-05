---
read_when:
    - Atualizar mapeamentos de identificadores de modelo de dispositivos ou arquivos NOTICE/licença
    - Alterar como a UI de Instances exibe nomes de dispositivos
summary: Como o OpenClaw incorpora identificadores de modelo de dispositivos Apple para nomes amigáveis no app macOS.
title: Banco de dados de modelos de dispositivos
x-i18n:
    generated_at: "2026-04-05T12:52:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Banco de dados de modelos de dispositivos (nomes amigáveis)

O app complementar do macOS mostra nomes amigáveis de modelos de dispositivos Apple na UI de **Instances** ao mapear identificadores de modelo da Apple (por exemplo, `iPad16,6`, `Mac16,6`) para nomes legíveis por humanos.

O mapeamento é incorporado como JSON em:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Fonte de dados

Atualmente, incorporamos o mapeamento do repositório sob licença MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para manter builds determinísticos, os arquivos JSON são fixados em commits upstream específicos (registrados em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Atualizando o banco de dados

1. Escolha os commits upstream que você deseja fixar (um para iOS e um para macOS).
2. Atualize os hashes de commit em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Baixe novamente os arquivos JSON, fixados nesses commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Garanta que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ainda corresponda ao upstream (substitua-o se a licença upstream mudar).
5. Verifique se o app macOS compila corretamente (sem avisos):

```bash
swift build --package-path apps/macos
```
