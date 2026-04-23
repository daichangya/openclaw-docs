---
read_when:
    - Ви хочете використовувати підписку Claude Max з інструментами, сумісними з OpenAI
    - Вам потрібен локальний API-сервер, який обгортає Claude Code CLI
    - Ви хочете оцінити доступ до Anthropic на основі підписки порівняно з доступом на основі API-ключа
summary: Спільнотний proxy для відкриття облікових даних підписки Claude як endpoint-а, сумісного з OpenAI
title: Claude Max API proxy
x-i18n:
    generated_at: "2026-04-23T23:04:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** — це спільнотний інструмент, який відкриває вашу підписку Claude Max/Pro як endpoint API, сумісний з OpenAI. Це дає змогу використовувати вашу підписку з будь-яким інструментом, що підтримує формат API OpenAI.

<Warning>
Цей шлях призначено лише для технічної сумісності. У минулому Anthropic блокував деякі
випадки використання підписки поза Claude Code. Ви самі маєте вирішити, чи
використовувати це, і перевірити поточні умови Anthropic, перш ніж покладатися на нього.
</Warning>

## Навіщо це використовувати?

| Підхід                  | Вартість                                             | Найкраще підходить для                    |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Anthropic API           | Оплата за токени (~$15/М вхідних, $75/М вихідних для Opus) | Production-застосунків, великих обсягів   |
| Підписка Claude Max     | $200/місяць фіксовано                                | Особистого використання, розробки, необмеженого використання |

Якщо у вас є підписка Claude Max і ви хочете використовувати її з інструментами, сумісними з OpenAI, цей proxy може зменшити витрати для деяких робочих процесів. API-ключі все ще залишаються зрозумілішим шляхом з точки зору політики для production-використання.

## Як це працює

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

Proxy:

1. Приймає запити у форматі OpenAI за адресою `http://localhost:3456/v1/chat/completions`
2. Перетворює їх на команди Claude Code CLI
3. Повертає відповіді у форматі OpenAI (підтримується потокова передача)

## Початок роботи

<Steps>
  <Step title="Установіть proxy">
    Потрібні Node.js 20+ і Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Запустіть сервер">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Перевірте proxy">
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

  </Step>
  <Step title="Налаштуйте OpenClaw">
    Спрямуйте OpenClaw на proxy як на користувацький endpoint, сумісний з OpenAI:

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

  </Step>
</Steps>

## Вбудований каталог

| ID моделі         | Відповідає       |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Примітки щодо proxy-стилю, сумісного з OpenAI">
    Цей шлях використовує той самий proxy-стиль маршруту, сумісного з OpenAI, що й інші користувацькі
    бекенди `/v1`:

    - Native-формування запитів лише для OpenAI не застосовується
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      формування payload reasoning-compat для OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не інжектуються в URL proxy

  </Accordion>

  <Accordion title="Автозапуск на macOS через LaunchAgent">
    Створіть LaunchAgent, щоб запускати proxy автоматично:

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

  </Accordion>
</AccordionGroup>

## Посилання

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Примітки

- Це **спільнотний інструмент**, який офіційно не підтримується ні Anthropic, ні OpenClaw
- Потрібна активна підписка Claude Max/Pro з автентифікованим Claude Code CLI
- Proxy працює локально й не надсилає дані на жодні сторонні сервери
- Потокові відповіді повністю підтримуються

<Note>
Для native-інтеграції Anthropic з Claude CLI або API-ключами див. [провайдер Anthropic](/uk/providers/anthropic). Для підписок OpenAI/Codex див. [провайдер OpenAI](/uk/providers/openai).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Anthropic" href="/uk/providers/anthropic" icon="bolt">
    Native-інтеграція OpenClaw з Claude CLI або API-ключами.
  </Card>
  <Card title="Провайдер OpenAI" href="/uk/providers/openai" icon="robot">
    Для підписок OpenAI/Codex.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
