---
x-i18n:
    generated_at: "2026-04-05T18:14:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 813c4401d02b0a8a2708d30d6c31e4d375036244141d9e55458479f24723e0a5
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Використання Qwen Cloud через вбудований провайдер qwen в OpenClaw"
read_when:

- Ви хочете використовувати Qwen з OpenClaw
- Ви раніше використовували Qwen OAuth
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала endpoint'и `portal.qwen.ai`, більше недоступна.
Див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) для
додаткового контексту.

</Warning>

## Рекомендовано: Qwen Cloud

OpenClaw тепер розглядає Qwen як першокласного вбудованого провайдера з канонічним id
`qwen`. Вбудований провайдер націлений на endpoint'и Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає застарілі id `modelstudio` як
compatibility alias.

- Провайдер: `qwen`
- Бажана env-змінна: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: OpenAI-сумісний

Якщо вам потрібна `qwen3.6-plus`, віддавайте перевагу endpoint'у **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.

```bash
# Global Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key

# China Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key

# China Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Застарілі id auth-choice `modelstudio-*` і посилання на моделі `modelstudio/...` усе ще
працюють як compatibility aliases, але в нових потоках налаштування слід віддавати перевагу канонічним
id auth-choice `qwen-*` і посиланням на моделі `qwen/...`.

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

Розширення `qwen` позиціонується як вендорський дім для всієї поверхні Qwen
Cloud, а не лише для моделей кодування/тексту.

- Текстові/chat-моделі: уже вбудовано
- Виклик інструментів, структурований вивід, thinking: успадковуються від OpenAI-сумісного транспорту
- Генерація зображень: заплановано на рівні provider-plugin
- Розуміння зображень/відео: уже вбудовано на endpoint'і Standard
- Speech/audio: заплановано на рівні provider-plugin
- Memory embeddings/reranking: заплановано через поверхню embedding adapter
- Генерація відео: уже вбудовано через спільну можливість video-generation

## Мультимодальні доповнення

Розширення `qwen` тепер також надає:

- Розуміння відео через `qwen-vl-max-latest`
- Генерацію відео Wan через:
  - `wan2.6-t2v` (типово)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ці мультимодальні поверхні використовують endpoint'и DashScope **Standard**, а не
endpoint'и Coding Plan.

- Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Для генерації відео OpenClaw зіставляє налаштований регіон Qwen з відповідним
хостом DashScope AIGC перед надсиланням завдання:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Це означає, що звичайний `models.providers.qwen.baseUrl`, який вказує або на
хости Qwen для Coding Plan, або на хости Standard, усе одно зберігає генерацію відео на правильному
регіональному DashScope video endpoint.

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
- До **10 секунд** тривалості
- Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
- Режим еталонного зображення/відео наразі вимагає **віддалених URL http(s)**. Локальні
  шляхи до файлів відхиляються одразу, оскільки video endpoint DashScope не
  приймає завантажені локальні буфери для цих еталонів.

Див. [Qwen / Model Studio](/providers/qwen_modelstudio) для деталей на рівні endpoint'ів
і приміток щодо сумісності.
