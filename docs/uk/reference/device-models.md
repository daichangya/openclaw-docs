---
read_when:
    - Оновлення зіставлень ідентифікаторів моделей пристроїв або файлів NOTICE/license
    - Зміна того, як UI Instances відображає назви пристроїв
summary: Як OpenClaw вендорить ідентифікатори моделей пристроїв Apple для дружніх назв у застосунку macOS.
title: База даних моделей пристроїв
x-i18n:
    generated_at: "2026-04-24T03:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# База даних моделей пристроїв (дружні назви)

Супутній застосунок macOS показує дружні назви моделей пристроїв Apple в UI **Instances**, зіставляючи ідентифікатори моделей Apple (наприклад, `iPad16,6`, `Mac16,6`) з читабельними для людини назвами.

Зіставлення вендориться як JSON у:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Джерело даних

Наразі ми вендоримо зіставлення з репозиторію під ліцензією MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Щоб зберігати детермінованість збірок, JSON-файли прив’язуються до конкретних upstream commit (записаних у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Оновлення бази даних

1. Виберіть upstream commit, до яких хочете прив’язатися (один для iOS, один для macOS).
2. Оновіть хеші commit у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Повторно завантажте JSON-файли, прив’язані до цих commit:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Переконайтеся, що `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` і далі збігається з upstream (замініть його, якщо upstream license зміниться).
5. Переконайтеся, що застосунок macOS збирається без попереджень:

```bash
swift build --package-path apps/macos
```

## Пов’язане

- [Nodes](/uk/nodes)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
