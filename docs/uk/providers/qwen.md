---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Ви раніше використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудований провайдер qwen в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-05T22:23:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1e1022a368513fd09474a2c2b8394911787a6bc5e325868da590a3d32446a34
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth було видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала ендпоінти `portal.qwen.ai`, більше недоступна.
Див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) для
додаткового контексту.

</Warning>

## Рекомендовано: Qwen Cloud

Тепер OpenClaw розглядає Qwen як вбудований провайдер першого класу з канонічним id
`qwen`. Вбудований провайдер націлено на ендпоінти Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає роботу застарілих id `modelstudio` як
аліаса сумісності.

- Провайдер: `qwen`
- Бажана змінна середовища: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

Якщо ви хочете використовувати `qwen3.6-plus`, надавайте перевагу ендпоінту **Standard (оплата за використання)**.
Підтримка Coding Plan може відставати від публічного каталогу.

```bash
# Глобальний ендпоінт Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Китайський ендпоінт Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Глобальний ендпоінт Standard (оплата за використання)
openclaw onboard --auth-choice qwen-standard-api-key

# Китайський ендпоінт Standard (оплата за використання)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Застарілі id `auth-choice` у форматі `modelstudio-*` і посилання на моделі `modelstudio/...` досі
працюють як аліаси сумісності, але в нових сценаріях налаштування слід надавати перевагу канонічним
id `auth-choice` у форматі `qwen-*` і посиланням на моделі `qwen/...`.

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

## План можливостей

Розширення `qwen` позиціонується як основне середовище постачальника для всієї поверхні Qwen
Cloud, а не лише для моделей кодування/тексту.

- Текстові/чат-моделі: уже вбудовано
- Виклик інструментів, структурований вивід, thinking: успадковуються від сумісного з OpenAI транспорту
- Генерація зображень: заплановано на рівні плагіна провайдера
- Розуміння зображень/відео: уже вбудовано в ендпоінті Standard
- Мовлення/аудіо: заплановано на рівні плагіна провайдера
- Ембеддинги пам’яті/переранжування: заплановано через поверхню адаптера ембеддингів
- Генерація відео: уже вбудовано через спільну можливість генерації відео

## Мультимодальні доповнення

Розширення `qwen` тепер також надає:

- Розуміння відео через `qwen-vl-max-latest`
- Генерацію відео Wan через:
  - `wan2.6-t2v` (типово)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ці мультимодальні поверхні використовують ендпоінти DashScope **Standard**, а не
ендпоінти Coding Plan.

- Базовий URL Global/Intl Standard: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Базовий URL China Standard: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Для генерації відео OpenClaw зіставляє налаштований регіон Qwen з відповідним
хостом DashScope AIGC перед надсиланням завдання:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує або на
хости Qwen Coding Plan, або на Standard, усе одно забезпечує генерацію відео через правильний
регіональний відеоендпоінт DashScope.

Для генерації відео явно встановіть типову модель:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Поточні обмеження вбудованої генерації відео Qwen:

- До **1** вихідного відео на запит
- До **1** вхідного зображення
- До **4** вхідних відео
- Тривалість до **10 секунд**
- Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
- Режим еталонного зображення/відео наразі вимагає **віддалених URL http(s)**. Локальні
  шляхи до файлів відхиляються одразу, оскільки відеоендпоінт DashScope не
  приймає завантажені локальні буфери для таких еталонів.

Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів
інструмента, вибору провайдера та поведінки перемикання при збоях.

Див. [Qwen / Model Studio](/uk/providers/qwen_modelstudio) щодо деталей на рівні ендпоінтів
і приміток щодо сумісності.
