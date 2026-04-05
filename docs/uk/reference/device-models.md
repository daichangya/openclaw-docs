---
read_when:
    - Оновлення зіставлень ідентифікаторів моделей пристроїв або файлів NOTICE/license
    - Зміна способу відображення назв пристроїв в інтерфейсі Instances
summary: Як OpenClaw вендорить ідентифікатори моделей пристроїв Apple для дружніх назв у macOS app.
title: База даних моделей пристроїв
x-i18n:
    generated_at: "2026-04-05T18:15:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# База даних моделей пристроїв (дружні назви)

Супутня macOS app показує дружні назви моделей пристроїв Apple в інтерфейсі **Instances**, зіставляючи ідентифікатори моделей Apple (наприклад, `iPad16,6`, `Mac16,6`) зі зрозумілими для людини назвами.

Це зіставлення вендориться як JSON у:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Джерело даних

Наразі ми вендоримо це зіставлення з репозиторію під ліцензією MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Щоб збірки були детермінованими, JSON-файли прив’язуються до конкретних комітів upstream (записаних у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Оновлення бази даних

1. Виберіть коміти upstream, до яких хочете прив’язатися (один для iOS, один для macOS).
2. Оновіть хеші комітів у `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Повторно завантажте JSON-файли, прив’язавши їх до цих комітів:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Переконайтеся, що `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` і далі відповідає upstream (замініть його, якщо ліцензія upstream зміниться).
5. Перевірте, що macOS app збирається без попереджень:

```bash
swift build --package-path apps/macos
```
