---
read_when:
    - Ви хочете використовувати підписку Claude Max з OpenAI-сумісними інструментами
    - Ви хочете локальний API-сервер, який обгортає Claude Code CLI
    - Ви хочете оцінити доступ до Anthropic на основі підписки порівняно з доступом через API-ключ
summary: Спільнотний проксі для відкриття облікових даних підписки Claude як OpenAI-сумісного endpoint
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T18:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** — це інструмент спільноти, який відкриває вашу підписку Claude Max/Pro як OpenAI-сумісний API endpoint. Це дозволяє використовувати вашу підписку з будь-яким інструментом, що підтримує формат OpenAI API.

<Warning>
Цей шлях — лише технічна сумісність. У минулому Anthropic блокувала певне використання
підписки поза Claude Code. Ви маєте самостійно вирішити, чи використовувати
це, і перевірити поточні умови Anthropic, перш ніж покладатися на нього.
</Warning>

## Навіщо це використовувати?

| Підхід                  | Вартість                                            | Найкраще підходить для                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | Оплата за токен (~$15/млн вхідних, $75/млн вихідних для Opus) | Продукційні застосунки, великі обсяги       |
| Claude Max subscription | $200/місяць фіксовано                               | Особистого використання, розробки, необмеженого використання |

Якщо у вас є підписка Claude Max і ви хочете використовувати її з OpenAI-сумісними інструментами, цей проксі може знизити витрати для деяких сценаріїв. API-ключі залишаються більш зрозумілим з погляду політик шляхом для використання у production.

## Як це працює

```
Ваш застосунок → claude-max-api-proxy → Claude Code CLI → Anthropic (через підписку)
     (формат OpenAI)                  (перетворює формат)      (використовує ваш вхід)
```

Проксі:

1. Приймає запити у форматі OpenAI за адресою `http://localhost:3456/v1/chat/completions`
2. Перетворює їх на команди Claude Code CLI
3. Повертає відповіді у форматі OpenAI (підтримується streaming)

## Встановлення

```bash
# Requires Node.js 20+ and Claude Code CLI
npm install -g claude-max-api-proxy

# Verify Claude CLI is authenticated
claude --version
```

## Використання

### Запуск сервера

```bash
claude-max-api
# Server runs at http://localhost:3456
```

### Перевірка

```bash
# Health check
curl http://localhost:3456/health

# List models
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### З OpenClaw

Ви можете вказати для OpenClaw цей проксі як користувацький OpenAI-сумісний endpoint:

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

Цей шлях використовує той самий проксі-подібний OpenAI-сумісний маршрут, що й інші користувацькі
бекенди `/v1`:

- власне формування запитів лише для OpenAI не застосовується
- немає `service_tier`, немає `store` для Responses, немає підказок prompt-cache і немає
  формування payload сумісності з reasoning OpenAI
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до URL проксі

## Доступні моделі

| ID моделі         | Відповідає       |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Автозапуск на macOS

Створіть LaunchAgent, щоб автоматично запускати проксі:

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Посилання

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Примітки

- Це **інструмент спільноти**, який офіційно не підтримується ні Anthropic, ні OpenClaw
- Потрібна активна підписка Claude Max/Pro з автентифікованим Claude Code CLI
- Проксі працює локально і не надсилає дані на жодні сторонні сервери
- Streaming-відповіді повністю підтримуються

## Дивіться також

- [Провайдер Anthropic](/providers/anthropic) - Власна інтеграція OpenClaw із Claude CLI або API-ключами
- [Провайдер OpenAI](/providers/openai) - Для підписок OpenAI/Codex
