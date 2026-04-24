---
read_when:
    - Збирання логів macOS або розслідування логування приватних даних
    - Налагодження проблем життєвого циклу голосового пробудження/сесії
summary: 'Логування OpenClaw: циклічний файловий лог діагностики + прапорці конфіденційності unified log'
title: Логування macOS
x-i18n:
    generated_at: "2026-04-24T04:16:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Логування (macOS)

## Циклічний файловий лог діагностики (панель Debug)

OpenClaw маршрутизує логи застосунку macOS через swift-log (типово до unified logging) і може записувати локальний циклічний файловий лог на диск, коли вам потрібне надійне збереження.

- Рівень деталізації: **панель Debug → Logs → App logging → Verbosity**
- Увімкнення: **панель Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Розташування: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (автоматично обертається; старі файли отримують суфікси `.1`, `.2`, …)
- Очищення: **панель Debug → Logs → App logging → “Clear”**

Примітки:

- Це **типово вимкнено**. Вмикайте лише під час активного налагодження.
- Вважайте цей файл чутливим; не діліться ним без перевірки.

## Приватні дані в unified logging на macOS

Unified logging приховує більшість корисних навантажень, якщо підсистема явно не вмикає `privacy -off`. Згідно з матеріалом Пітера про macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025), це керується plist-файлом у `/Library/Preferences/Logging/Subsystems/`, ключем якого є назва підсистеми. Прапорець застосовується лише до нових записів логу, тому ввімкніть його перед відтворенням проблеми.

## Увімкнення для OpenClaw (`ai.openclaw`)

- Спочатку запишіть plist у тимчасовий файл, а потім атомарно встановіть його від імені root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Перезавантаження не потрібне; `logd` швидко помічає файл, але лише нові рядки логу міститимуть приватні корисні навантаження.
- Переглядайте розширений вивід наявним допоміжним засобом, наприклад `./scripts/clawlog.sh --category WebChat --last 5m`.

## Вимкнення після налагодження

- Видаліть перевизначення: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- За потреби виконайте `sudo log config --reload`, щоб змусити `logd` негайно скинути перевизначення.
- Пам’ятайте, що ця поверхня може містити телефонні номери й тіла повідомлень; тримайте plist на місці лише поки вам справді потрібна додаткова деталізація.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Логування Gateway](/uk/gateway/logging)
