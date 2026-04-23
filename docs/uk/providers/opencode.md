---
read_when:
    - Вам потрібен доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використання каталогів OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T19:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d958a8b32277cf4e40f086e6f8281826c70a7583823216403bca09108778f3b3
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode надає два розміщені каталоги в OpenClaw:

| Каталог | Префікс           | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Обидва каталоги використовують той самий API-ключ OpenCode. OpenClaw зберігає ідентифікатори runtime provider
розділеними, щоб маршрутизація для окремих моделей в upstream лишалася коректною, але початкове налаштування й документація розглядають їх
як єдине налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Каталог Zen">
    **Найкраще для:** курованого багатомодельного проксі OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель Zen як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Найкраще для:** лінійки Kimi, GLM і MiniMax, розміщеної в OpenCode.

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Каталоги

### Zen

| Властивість      | Значення                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| Приклади моделей | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Властивість      | Значення                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| Приклади моделей | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Псевдоніми API-ключа">
    `OPENCODE_ZEN_API_KEY` також підтримується як псевдонім для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох runtime provider.
    Вам не потрібно проходити початкове налаштування для кожного каталогу окремо.
  </Accordion>

  <Accordion title="Білінг і панель керування">
    Ви входите в OpenCode, додаєте платіжні дані та копіюєте свій API-ключ. Білінг
    і доступність каталогів керуються з панелі керування OpenCode.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення Gemini">
    refs OpenCode на базі Gemini лишаються на шляху proxy-Gemini, тому OpenClaw зберігає
    там очищення thought-signature Gemini без увімкнення нативної
    валідації повторного відтворення Gemini чи переписування bootstrap.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення не-Gemini">
    refs OpenCode, не пов’язані з Gemini, зберігають мінімальну політику повторного відтворення, сумісну з OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох runtime provider Zen і
Go, тож вам потрібно пройти початкове налаштування лише один раз.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, refs моделей і поведінки failover.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник з конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
