---
read_when:
    - Ви хочете використовувати Qwen з OpenClaw
    - Раніше ви використовували Qwen OAuth
summary: Використовуйте Qwen Cloud через вбудований провайдер qwen в OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T06:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth видалено.** Інтеграція OAuth безкоштовного рівня
(`qwen-portal`), яка використовувала endpoint-и `portal.qwen.ai`, більше недоступна.
Докладніше див. [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

Тепер OpenClaw розглядає Qwen як вбудованого провайдера першого класу з канонічним id
`qwen`. Вбудований провайдер націлений на endpoint-и Qwen Cloud / Alibaba DashScope і
Coding Plan та зберігає роботу застарілих id `modelstudio` як
псевдоніма сумісності.

- Провайдер: `qwen`
- Бажана змінна env: `QWEN_API_KEY`
- Також приймаються для сумісності: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Стиль API: сумісний з OpenAI

<Tip>
Якщо вам потрібен `qwen3.6-plus`, надавайте перевагу endpoint-у **Standard (pay-as-you-go)**.
Підтримка Coding Plan може відставати від публічного каталогу.
</Tip>

## Початок роботи

Виберіть тип плану та виконайте кроки налаштування.

<Tabs>
  <Tab title="Coding Plan (підписка)">
    **Найкраще для:** доступу на основі підписки через Qwen Coding Plan.

    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть або скопіюйте API-ключ з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        Для endpoint-у **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Для endpoint-у **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` як і раніше
    працюють як псевдоніми сумісності, але в нових потоках налаштування слід надавати перевагу канонічним
    id `qwen-*` для auth-choice і посиланням на моделі `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Найкраще для:** доступу з оплатою за використання через endpoint Standard Model Studio, зокрема до моделей на кшталт `qwen3.6-plus`, які можуть бути недоступні в Coding Plan.

    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть або скопіюйте API-ключ з [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        Для endpoint-у **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Для endpoint-у **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Застарілі id `modelstudio-*` для auth-choice і посилання на моделі `modelstudio/...` як і раніше
    працюють як псевдоніми сумісності, але в нових потоках налаштування слід надавати перевагу канонічним
    id `qwen-*` для auth-choice і посиланням на моделі `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Типи планів і endpoint-и

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Провайдер автоматично вибирає endpoint на основі вашого auth choice. Канонічні
варіанти використовують сімейство `qwen-*`; `modelstudio-*` лишається лише для сумісності.
Ви можете перевизначити це через користувацький `baseUrl` у конфігурації.

<Tip>
**Керування ключами:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Документація:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Вбудований каталог

Наразі OpenClaw постачається з таким вбудованим каталогом Qwen. Налаштований каталог
враховує endpoint: конфігурації Coding Plan не включають моделі, які, як відомо, працюють
лише на endpoint-і Standard.

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Модель за замовчуванням                            |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Віддавайте перевагу endpoint-ам Standard для цієї моделі |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Лінійка Qwen Max                                   |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning увімкнено                                |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI через Alibaba                          |

<Note>
Доступність усе одно може відрізнятися залежно від endpoint-у та тарифного плану, навіть якщо модель
присутня у вбудованому каталозі.
</Note>

## Мультимодальні доповнення

Plugin `qwen` також надає мультимодальні можливості на endpoint-ах **Standard**
DashScope (не на endpoint-ах Coding Plan):

- **Розуміння відео** через `qwen-vl-max-latest`
- **Генерація відео Wan** через `wan2.6-t2v` (за замовчуванням), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Щоб використовувати Qwen як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Додатково

<AccordionGroup>
  <Accordion title="Розуміння зображень і відео">
    Вбудований plugin Qwen реєструє розуміння медіа для зображень і відео
    на endpoint-ах **Standard** DashScope (не на endpoint-ах Coding Plan).

    | Property      | Value                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Supported input | Зображення, відео   |

    Розуміння медіа автоматично визначається з налаштованої автентифікації Qwen — додаткова
    конфігурація не потрібна. Переконайтеся, що ви використовуєте endpoint Standard (pay-as-you-go)
    для підтримки розуміння медіа.

  </Accordion>

  <Accordion title="Доступність Qwen 3.6 Plus">
    `qwen3.6-plus` доступний на endpoint-ах Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Якщо endpoint-и Coding Plan повертають помилку "unsupported model" для
    `qwen3.6-plus`, перейдіть на Standard (pay-as-you-go) замість пари
    endpoint/ключ Coding Plan.

  </Accordion>

  <Accordion title="План можливостей">
    Plugin `qwen` позиціонується як основний вендорний дім для всієї поверхні Qwen
    Cloud, а не лише для моделей coding/text.

    - **Text/chat моделі:** уже вбудовано
    - **Виклик інструментів, структурований вивід, thinking:** успадковуються від транспорту, сумісного з OpenAI
    - **Генерація зображень:** планується на рівні provider-plugin
    - **Розуміння зображень/відео:** уже вбудовано на endpoint-і Standard
    - **Мовлення/аудіо:** планується на рівні provider-plugin
    - **Memory embeddings/reranking:** планується через поверхню адаптера embedding
    - **Генерація відео:** уже вбудовано через спільну можливість генерації відео

  </Accordion>

  <Accordion title="Деталі генерації відео">
    Для генерації відео OpenClaw зіставляє налаштований регіон Qwen із відповідним
    хостом DashScope AIGC перед відправленням завдання:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Це означає, що звичайний `models.providers.qwen.baseUrl`, який указує на будь-який із
    хостів Coding Plan або Standard Qwen, усе одно залишає генерацію відео на правильному
    регіональному відео-endpoint-і DashScope.

    Поточні обмеження вбудованої генерації відео Qwen:

    - До **1** вихідного відео на запит
    - До **1** вхідного зображення
    - До **4** вхідних відео
    - Тривалість до **10 секунд**
    - Підтримує `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
    - Режим еталонного зображення/відео наразі потребує **віддалених URL http(s)**. Локальні
      шляхи до файлів відхиляються одразу, оскільки відео-endpoint DashScope не
      приймає завантажені локальні буфери для таких еталонів.

  </Accordion>

  <Accordion title="Сумісність потокового використання">
    Нативні endpoint-и Model Studio оголошують сумісність потокового використання на
    спільному транспорті `openai-completions`. Тепер OpenClaw визначає це за можливостями
    endpoint-у, тому користувацькі id провайдерів, сумісні з DashScope, які вказують на ті самі
    нативні хости, успадковують таку саму поведінку потокового використання, а не
    вимагають саме вбудованого id провайдера `qwen`.

    Сумісність використання для нативного потокового режиму застосовується і до хостів Coding Plan, і
    до хостів Standard DashScope-compatible:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Регіони мультимодальних endpoint-ів">
    Мультимодальні поверхні (розуміння відео та генерація відео Wan) використовують
    endpoint-и **Standard** DashScope, а не endpoint-и Coding Plan:

    - Базовий URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Базовий URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `QWEN_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/uk/providers/alibaba" icon="cloud">
    Застарілий провайдер ModelStudio та примітки з міграції.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення проблем і FAQ.
  </Card>
</CardGroup>
