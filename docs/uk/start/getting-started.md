---
read_when:
    - Перше налаштування з нуля
    - Потрібен найшвидший шлях до працездатного чату
summary: Установіть OpenClaw і запустіть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-04-05T18:17:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# Початок роботи

Установіть OpenClaw, пройдіть онбординг і почніть спілкуватися зі своїм AI-помічником — усе це
приблизно за 5 хвилин. У підсумку ви матимете запущений Gateway, налаштовану автентифікацію
та працездатний чат-сеанс.

## Що вам знадобиться

- **Node.js** — рекомендовано Node 24 (також підтримується Node 22.14+)
- **API key** від провайдера моделей (Anthropic, OpenAI, Google тощо) — онбординг попросить його ввести

<Tip>
Перевірте свою версію Node командою `node --version`.
**Користувачі Windows:** підтримуються як нативний Windows, так і WSL2. WSL2 є
стабільнішим і рекомендований для повноцінного використання. Див. [Windows](/uk/platforms/windows).
Потрібно встановити Node? Див. [Node setup](/uk/install/node).
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

    Майстер проведе вас через вибір провайдера моделей, налаштування API key
    та конфігурацію Gateway. Це займає приблизно 2 хвилини.

    Повний довідник див. у [Onboarding (CLI)](/start/wizard).

  </Step>
  <Step title="Перевірте, що Gateway запущено">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway прослуховує порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Це відкриє Control UI у вашому браузері. Якщо вона завантажується, усе працює.

  </Step>
  <Step title="Надішліть своє перше повідомлення">
    Введіть повідомлення в чаті Control UI, і ви маєте отримати відповідь від AI.

    Хочете спілкуватися зі свого телефону? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти див. у [Channels](/uk/channels).

  </Step>
</Steps>

<Accordion title="Додатково: підключення власної збірки Control UI">
  Якщо ви підтримуєте локалізовану або налаштовану збірку панелі керування, вкажіть
  `gateway.controlUi.root` на каталог, який містить ваші зібрані статичні
  ресурси та `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Скопіюйте свої зібрані статичні файли до цього каталогу.
```

Потім задайте:

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
  <Card title="Pairing і безпека" href="/uk/channels/pairing" icon="shield">
    Керуйте тим, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, sandbox і розширені налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/tools" icon="wrench">
    Браузер, exec, вебпошук, Skills і plugins.
  </Card>
</Columns>

<Accordion title="Додатково: змінні середовища">
  Якщо ви запускаєте OpenClaw як службовий обліковий запис або хочете власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього розв’язання шляхів
- `OPENCLAW_STATE_DIR` — перевизначає каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначає шлях до файлу конфігурації

Повний довідник: [Environment variables](/uk/help/environment).
</Accordion>
