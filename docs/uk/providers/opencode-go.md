---
read_when:
    - Ви хочете каталог OpenCode Go
    - Вам потрібні посилання на моделі середовища виконання для моделей, розміщених на Go
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T10:38:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go — це каталог Go у [OpenCode](/uk/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає ідентифікатор провайдера середовища виконання `opencode-go`, щоб висхідна маршрутизація для кожної моделі залишалася коректною.

| Властивість      | Значення                        |
| ---------------- | ------------------------------- |
| Провайдер середовища виконання | `opencode-go`                   |
| Автентифікація   | `OPENCODE_API_KEY`              |
| Батьківське налаштування | [OpenCode](/uk/providers/opencode) |

## Підтримувані моделі

| Посилання на модель        | Назва        |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

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
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
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
      <Step title="Перевірте, що моделі доступні">
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

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Поведінка маршрутизації">
    OpenClaw автоматично обробляє маршрутизацію для кожної моделі, коли посилання на модель використовує
    `opencode-go/...`. Додаткова конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Угода щодо посилань середовища виконання">
    Посилання середовища виконання залишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
    Це зберігає коректну висхідну маршрутизацію для кожної моделі в обох каталогах.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Той самий `OPENCODE_API_KEY` використовується і каталогами Zen, і Go. Введення
    ключа під час налаштування зберігає облікові дані для обох провайдерів середовища виконання.
  </Accordion>
</AccordionGroup>

<Tip>
Див. [OpenCode](/uk/providers/opencode), щоб ознайомитися зі спільним оглядом онбордингу та повним
довідником каталогів Zen + Go.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenCode (батьківський)" href="/uk/providers/opencode" icon="server">
    Спільний онбординг, огляд каталогу та додаткові примітки.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
</CardGroup>
