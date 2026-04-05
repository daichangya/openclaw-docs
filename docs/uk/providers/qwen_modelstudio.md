---
x-i18n:
    generated_at: "2026-04-05T18:14:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Подробиці про кінцеві точки для вбудованого провайдера qwen і його застарілу сумісну поверхню modelstudio"
read_when:

- Вам потрібні подробиці про кінцеві точки для Qwen Cloud / Alibaba DashScope
- Вам потрібна інформація про сумісність змінних середовища для провайдера qwen
- Ви хочете використовувати кінцеву точку Standard (pay-as-you-go) або Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Ця сторінка документує відповідність кінцевих точок, що лежить в основі вбудованого провайдера OpenClaw `qwen`.
Провайдер зберігає працездатність ідентифікаторів провайдера `modelstudio`, ідентифікаторів auth-choice та
посилань на моделі як сумісних псевдонімів, тоді як `qwen` стає канонічною
поверхнею.

<Info>

Якщо вам потрібна **`qwen3.6-plus`**, надавайте перевагу **Standard (pay-as-you-go)**. Доступність у
Coding Plan може відставати від публічного каталогу Model Studio, а API
Coding Plan може відхиляти модель, доки вона не з’явиться у списку моделей,
які підтримує ваш план.

</Info>

- Провайдер: `qwen` (застарілий псевдонім: `modelstudio`)
- Автентифікація: `QWEN_API_KEY`
- Також приймаються: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: OpenAI-compatible

## Швидкий старт

### Standard (pay-as-you-go)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (subscription)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-api-key
```

Застарілі ідентифікатори auth-choice `modelstudio-*` і далі працюють як сумісні псевдоніми, але
канонічні ідентифікатори onboarding — це варіанти `qwen-*`, наведені вище.

Після onboarding установіть типову модель:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Типи планів і кінцеві точки

| План                       | Регіон | Auth choice                | Кінцева точка                                   |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає кінцеву точку на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності.
Ви можете
перевизначити це через власний `baseUrl` у конфігурації.

Нативні кінцеві точки Model Studio оголошують сумісність зі streaming usage на
спільному транспорті `openai-completions`. Тепер OpenClaw прив’язує це до можливостей
кінцевих точок, тому сумісні власні ідентифікатори провайдерів DashScope, націлені на
ті самі нативні хости, успадковують ту саму поведінку streaming-usage замість
необхідності використовувати саме вбудований ідентифікатор провайдера `qwen`.

## Отримайте свій API key

- **Керування ключами**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Документація**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Вбудований каталог

Наразі OpenClaw постачається з таким вбудованим каталогом Qwen:

| Посилання на модель         | Вхід        | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Типова модель                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Віддавайте перевагу кінцевим точкам Standard, якщо вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning увімкнено                                |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI через Alibaba                          |

Доступність усе ще може відрізнятися залежно від кінцевої точки та тарифного плану, навіть якщо модель
присутня у вбудованому каталозі.

Сумісність native-streaming usage застосовується і до хостів Coding Plan, і до
DashScope-compatible хостів Standard:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Доступність Qwen 3.6 Plus

`qwen3.6-plus` доступна на кінцевих точках Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для
`qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари
кінцева точка/ключ Coding Plan.

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що
`QWEN_API_KEY` доступна для цього процесу (наприклад, у
`~/.openclaw/.env` або через `env.shellEnv`).
