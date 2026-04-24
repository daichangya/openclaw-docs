---
read_when:
    - Перше налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Установіть OpenClaw і запустіть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-04-24T04:19:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

Установіть OpenClaw, пройдіть онбординг і почніть спілкуватися зі своїм AI-асистентом — усе
приблизно за 5 хвилин. Наприкінці у вас буде запущений Gateway, налаштована автентифікація
та робоча сесія чату.

## Що вам потрібно

- **Node.js** — рекомендовано Node 24 (також підтримується Node 22.14+)
- **API-ключ** від провайдера моделей (Anthropic, OpenAI, Google тощо) — під час онбордингу вам запропонують його ввести

<Tip>
Перевірте свою версію Node командою `node --version`.
**Користувачі Windows:** підтримуються і нативний Windows, і WSL2. WSL2 більш
стабільний і рекомендований для повного досвіду. Див. [Windows](/uk/platforms/windows).
Потрібно встановити Node? Див. [Налаштування Node](/uk/install/node).
</Tip>

## Швидке налаштування

<Steps>
  <Step title="Установіть OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Інші способи встановлення (Docker, Nix, npm): [Install](/uk/install).
    </Note>

  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через вибір провайдера моделей, налаштування API-ключа
    та конфігурацію Gateway. Це займає приблизно 2 хвилини.

    Повний довідник див. у [Onboarding (CLI)](/uk/start/wizard).

  </Step>
  <Step title="Перевірте, що Gateway запущено">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway слухає порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Це відкриє Control UI у вашому браузері. Якщо він завантажується, значить, усе працює.

  </Step>
  <Step title="Надішліть своє перше повідомлення">
    Введіть повідомлення в чаті Control UI, і ви маєте отримати відповідь від AI.

    Хочете спілкуватися натомість із телефона? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти див. в [Channels](/uk/channels).

  </Step>
</Steps>

<Accordion title="Розширено: підключення власної збірки Control UI">
  Якщо ви підтримуєте локалізовану або змінену збірку панелі керування, укажіть
  `gateway.controlUi.root` на каталог, який містить зібрані статичні
  assets та `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Потім установіть:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Перезапустіть gateway і знову відкрийте панель керування:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Що робити далі

<Columns>
  <Card title="Підключіть канал" href="/uk/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo та інші.
  </Card>
  <Card title="Зв’язування та безпека" href="/uk/channels/pairing" icon="shield">
    Керуйте тим, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, sandbox і розширені налаштування.
  </Card>
  <Card title="Перегляд інструментів" href="/uk/tools" icon="wrench">
    Browser, exec, вебпошук, skills і plugins.
  </Card>
</Columns>

<Accordion title="Розширено: змінні середовища">
  Якщо ви запускаєте OpenClaw як обліковий запис служби або хочете власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього розв’язання шляхів
- `OPENCLAW_STATE_DIR` — перевизначити каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначити шлях до файла конфігурації

Повний довідник: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Огляд Channels](/uk/channels)
- [Налаштування](/uk/start/setup)
