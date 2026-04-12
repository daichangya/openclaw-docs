---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Вам потрібно налаштувати `NVIDIA_API_KEY`
summary: Використовуйте OpenAI-сумісний API від NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-12T10:38:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA надає OpenAI-сумісний API за адресою `https://integrate.api.nvidia.com/v1` для
безкоштовного використання відкритих моделей. Автентифікація виконується за допомогою API-ключа з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Експортуйте ключ і запустіть онбординг">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Встановіть модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Якщо ви передасте `--token` замість змінної середовища, значення потрапить до історії оболонки та
виводу `ps`. За можливості надавайте перевагу змінній середовища `NVIDIA_API_KEY`.
</Warning>

## Приклад конфігурації

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Вбудований каталог

| Посилання на модель                         | Назва                        | Контекст | Макс. вивід |
| ------------------------------------------ | ---------------------------- | -------- | ----------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192       |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192       |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192       |

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Поведінка автоматичного ввімкнення">
    Провайдера автоматично ввімкнено, коли встановлено змінну середовища `NVIDIA_API_KEY`.
    Жодна явна конфігурація провайдера, окрім ключа, не потрібна.
  </Accordion>

  <Accordion title="Каталог і ціни">
    Вбудований каталог є статичним. У вихідному коді для вартості за замовчуванням встановлено `0`, оскільки NVIDIA
    наразі пропонує безкоштовний доступ до API для перелічених моделей.
  </Accordion>

  <Accordion title="OpenAI-сумісна кінцева точка">
    NVIDIA використовує стандартну кінцеву точку completions `/v1`. Будь-які OpenAI-сумісні
    інструменти мають працювати одразу з базовою URL-адресою NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Наразі моделі NVIDIA можна використовувати безкоштовно. Перевіряйте
[build.nvidia.com](https://build.nvidia.com/) на предмет актуальної доступності та
відомостей про обмеження швидкості.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
