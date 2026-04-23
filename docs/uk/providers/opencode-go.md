---
read_when:
    - Ви хочете каталог OpenCode Go
    - Вам потрібні runtime-посилання на моделі для моделей, розміщених у Go
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-23T23:05:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go — це каталог Go у [OpenCode](/uk/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає runtime-ідентифікатор
provider `opencode-go`, щоб маршрутизація за моделями в upstream працювала правильно.

| Властивість      | Значення                      |
| ---------------- | ----------------------------- |
| Runtime provider | `opencode-go`                 |
| Автентифікація   | `OPENCODE_API_KEY`            |
| Батьківське налаштування | [OpenCode](/uk/providers/opencode) |

## Вбудований каталог

OpenClaw отримує каталог Go з комплектного реєстру моделей pi. Виконайте
`openclaw models list --provider opencode-go`, щоб побачити поточний список моделей.

Згідно з комплектним каталогом pi, provider містить:

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
  <Tab title="Interactive">
    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Установіть модель Go як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Передайте ключ напряму">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично обробляє маршрутизацію для кожної моделі, коли посилання на модель використовує
    `opencode-go/...`. Додаткова конфігурація provider не потрібна.
  </Accordion>

  <Accordion title="Умовність runtime-посилань">
    Runtime-посилання залишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
    Це зберігає коректну маршрутизацію за моделями в upstream для обох каталогів.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Один і той самий `OPENCODE_API_KEY` використовується як каталогами Zen, так і Go. Введення
    ключа під час налаштування зберігає облікові дані для обох runtime-provider.
  </Accordion>
</AccordionGroup>

<Tip>
Див. [OpenCode](/uk/providers/opencode), щоб переглянути спільний огляд початкового налаштування та повну
довідку по каталогах Zen + Go.
</Tip>

## Пов’язано

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільне початкове налаштування, огляд каталогу та розширені примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>
