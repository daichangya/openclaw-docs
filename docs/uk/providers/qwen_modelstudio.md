---
read_when:
    - Вам потрібні деталі на рівні кінцевих точок для Qwen Cloud / Alibaba DashScope
    - Вам потрібна інформація про сумісність змінних середовища для провайдера qwen
    - Ви хочете використовувати кінцеву точку Standard (pay-as-you-go) або Coding Plan
summary: Деталі кінцевих точок для вбудованого провайдера qwen і його застарілої поверхні сумісності modelstudio
title: Qwen / Model Studio
x-i18n:
    generated_at: "2026-04-05T22:23:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21bf55e7acf51131027a1c1faf5fa85a00757ee40995ea4e1d24935cd310e24
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

# Qwen / Model Studio (Alibaba Cloud)

На цій сторінці описано зіставлення кінцевих точок, яке використовується у вбудованому провайдері `qwen` в OpenClaw. Провайдер зберігає ідентифікатори провайдера `modelstudio`, ідентифікатори вибору автентифікації та посилання на моделі в робочому стані як псевдоніми сумісності, тоді як `qwen` стає канонічною поверхнею.

<Info>

Якщо вам потрібна **`qwen3.6-plus`**, віддавайте перевагу **Standard (pay-as-you-go)**. Доступність у Coding Plan може відставати від публічного каталогу Model Studio, а API Coding Plan може відхиляти модель, доки вона не з’явиться в списку підтримуваних моделей вашого плану.

</Info>

- Провайдер: `qwen` (застарілий псевдонім: `modelstudio`)
- Автентифікація: `QWEN_API_KEY`
- Також приймаються: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: сумісний з OpenAI

## Швидкий початок

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

Застарілі ідентифікатори вибору автентифікації `modelstudio-*` усе ще працюють як псевдоніми сумісності, але канонічними ідентифікаторами для онбордингу є варіанти `qwen-*`, показані вище.

Після онбордингу встановіть типову модель:

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

| План                       | Регіон | Вибір автентифікації      | Кінцева точка                                    |
| -------------------------- | ------ | ------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`   | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`         | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`            | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає кінцеву точку на основі вашого вибору автентифікації. Канонічні варіанти використовують сімейство `qwen-*`; `modelstudio-*` залишається лише для сумісності. Ви можете перевизначити це за допомогою власного `baseUrl` у конфігурації.

Нативні кінцеві точки Model Studio повідомляють про сумісність використання потокового режиму на спільному транспорті `openai-completions`. Тепер OpenClaw визначає це за можливостями кінцевої точки, тому сумісні з DashScope власні ідентифікатори провайдерів, націлені на ті самі нативні хости, успадковують ту саму поведінку потокового використання, замість того щоб вимагати саме вбудований ідентифікатор провайдера `qwen`.

## Отримайте свій API-ключ

- **Керування ключами**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Документація**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Вбудований каталог

Зараз OpenClaw постачається з таким вбудованим каталогом Qwen:

| Посилання на модель         | Вхідні дані | Контекст  | Примітки                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Типова модель                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Віддавайте перевагу кінцевим точкам Standard, якщо вам потрібна ця модель |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Програмування                                      |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Програмування                                      |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Логічне міркування увімкнено                       |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI через Alibaba                          |

Доступність усе ще може відрізнятися залежно від кінцевої точки та тарифного плану, навіть якщо модель присутня у вбудованому каталозі.

Сумісність використання нативного потокового режиму застосовується як до хостів Coding Plan, так і до сумісних зі Standard DashScope хостів:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Доступність Qwen 3.6 Plus

`qwen3.6-plus` доступна на кінцевих точках Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Якщо кінцеві точки Coding Plan повертають помилку "unsupported model" для `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари кінцева точка/ключ Coding Plan.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY` доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

## Генерація відео Wan

Поверхня Standard DashScope також лежить в основі вбудованих провайдерів генерації відео Wan.

Ви можете звертатися до тієї самої сім’ї Wan через будь-який із префіксів:

- канонічні посилання Qwen:
  - `qwen/wan2.6-t2v`
  - `qwen/wan2.6-i2v`
  - `qwen/wan2.6-r2v`
  - `qwen/wan2.6-r2v-flash`
  - `qwen/wan2.7-r2v`
- прямі посилання Alibaba:
  - `alibaba/wan2.6-t2v`
  - `alibaba/wan2.6-i2v`
  - `alibaba/wan2.6-r2v`
  - `alibaba/wan2.6-r2v-flash`
  - `alibaba/wan2.7-r2v`

Усі режими посилань Wan наразі вимагають **віддалені URL-адреси http(s)** для посилань на зображення або відео. Локальні шляхи до файлів відхиляються до завантаження, оскільки кінцева точка відео DashScope не приймає еталонні ресурси з локальних буферів для цих режимів.

## Пов’язане

- [Qwen](/uk/providers/qwen)
- [Alibaba Model Studio](/providers/alibaba)
- [Генерація відео](/uk/tools/video-generation)
