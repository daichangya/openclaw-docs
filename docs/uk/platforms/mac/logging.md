---
read_when:
    - Збирання журналів macOS або дослідження журналювання приватних даних
    - Налагодження проблем із голосовою активацією або життєвим циклом сесії
summary: 'Журналювання OpenClaw: циклічний файл діагностики + прапорці приватності unified log'
title: Журналювання macOS
x-i18n:
    generated_at: "2026-04-05T18:10:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Журналювання (macOS)

## Циклічний файл журналу діагностики (панель Debug)

OpenClaw спрямовує журнали застосунку macOS через swift-log (за замовчуванням використовується unified logging) і може записувати локальний циклічний файл журналу на диск, коли вам потрібно зберегти журнал надовго.

- Рівень деталізації: **панель Debug → Logs → App logging → Verbosity**
- Увімкнення: **панель Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Розташування: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (автоматично виконується ротація; старі файли отримують суфікси `.1`, `.2`, …)
- Очищення: **панель Debug → Logs → App logging → “Clear”**

Примітки:

- Це **вимкнено за замовчуванням**. Увімкнюйте лише під час активного налагодження.
- Вважайте цей файл чутливим; не діліться ним без перевірки.

## Приватні дані в unified logging на macOS

Unified logging приховує більшість корисного навантаження, якщо підсистема не ввімкнула `privacy -off`. Згідно з описом Пітера про [витівки з приватністю журналювання](https://steipete.me/posts/2025/logging-privacy-shenanigans) у macOS (2025), цим керує plist у `/Library/Preferences/Logging/Subsystems/`, де використовується ключ із назвою підсистеми. Прапорець застосовується лише до нових записів журналу, тож увімкніть його перед відтворенням проблеми.

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

- Перезавантаження не потрібне; logd швидко помічає файл, але приватне корисне навантаження включатиметься лише в нові рядки журналу.
- Перегляньте розширений вивід за допомогою наявного допоміжного скрипта, наприклад: `./scripts/clawlog.sh --category WebChat --last 5m`.

## Вимкнення після налагодження

- Видаліть перевизначення: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- За потреби виконайте `sudo log config --reload`, щоб змусити logd негайно скинути перевизначення.
- Пам’ятайте, що ця поверхня може містити номери телефонів і тексти повідомлень; залишайте plist на місці лише тоді, коли вам справді потрібні додаткові подробиці.
