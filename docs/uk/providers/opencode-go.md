---
read_when:
    - Ви хочете каталог OpenCode Go
    - Вам потрібні посилання на моделі середовища виконання для моделей, розміщених на Go
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T04:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go — це каталог Go у межах [OpenCode](/uk/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає ідентифікатор
провайдера середовища виконання `opencode-go`, щоб маршрутизація окремих моделей
на стороні постачальника залишалася коректною.

| Властивість       | Значення                        |
| ----------------- | ------------------------------- |
| Провайдер середовища виконання | `opencode-go`                   |
| Автентифікація    | `OPENCODE_API_KEY`              |
| Батьківське налаштування | [OpenCode](/uk/providers/opencode) |

## Вбудований каталог

OpenClaw отримує каталог Go із вбудованого реєстру моделей pi. Виконайте
`openclaw models list --provider opencode-go`, щоб переглянути поточний список моделей.

Станом на вбудований каталог pi, провайдер містить:

| Посилання на модель         | Назва                 |
| --------------------------- | --------------------- |
| `opencode-go/glm-5`         | GLM-5                 |
| `opencode-go/glm-5.1`       | GLM-5.1               |
| `opencode-go/kimi-k2.5`     | Kimi K2.5             |
| `opencode-go/kimi-k2.6`     | Kimi K2.6 (ліміти 3x) |
| `opencode-go/mimo-v2-omni`  | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`   | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`  | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`  | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`  | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`  | Qwen3.6 Plus          |

## Початок роботи

<Tabs>
  <Tab title="Інтерактивно">
    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Установіть модель Go як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Неінтерактивно">
    <Steps>
      <Step title="Передайте ключ безпосередньо">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично обробляє маршрутизацію окремих моделей, коли посилання на модель використовує
    `opencode-go/...`. Додаткова конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Угода про посилання середовища виконання">
    Посилання середовища виконання залишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
    Це зберігає коректну маршрутизацію окремих моделей на стороні постачальника в обох каталогах.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Той самий `OPENCODE_API_KEY` використовується як каталогом Zen, так і каталогом Go. Введення
    ключа під час налаштування зберігає облікові дані для обох провайдерів середовища виконання.
  </Accordion>
</AccordionGroup>

<Tip>
Див. [OpenCode](/uk/providers/opencode), щоб переглянути спільний огляд онбордингу та повний
довідник каталогів Zen + Go.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільний онбординг, огляд каталогу та додаткові примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>
