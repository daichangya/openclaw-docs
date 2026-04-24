---
read_when:
    - Ви хочете використовувати локальні робочі процеси ComfyUI з OpenClaw
    - Ви хочете використовувати Comfy Cloud із робочими процесами зображень, відео або музики
    - Вам потрібні ключі конфігурації вбудованого Plugin comfy
summary: Налаштування генерації зображень, відео та музики через робочий процес ComfyUI в OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T03:47:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw постачається з вбудованим Plugin `comfy` для запусків ComfyUI на основі workflow. Plugin повністю керується workflow, тому OpenClaw не намагається зіставляти загальні `size`, `aspectRatio`, `resolution`, `durationSeconds` або елементи керування у стилі TTS з вашим графом.

| Property        | Detail                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                          |
| Models          | `comfy/workflow`                                                                 |
| Shared surfaces | `image_generate`, `video_generate`, `music_generate`                             |
| Auth            | Немає для локального ComfyUI; `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` і Comfy Cloud `/api/*`                  |

## Що підтримується

- Генерація зображень із workflow JSON
- Редагування зображень з 1 завантаженим reference image
- Генерація відео з workflow JSON
- Генерація відео з 1 завантаженим reference image
- Генерація музики або аудіо через спільний інструмент `music_generate`
- Завантаження результату з налаштованого Node або з усіх відповідних output Node

## Швидкий старт

Виберіть між запуском ComfyUI на власній машині або використанням Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Найкраще для:** запуску власного екземпляра ComfyUI на вашій машині або в LAN.

    <Steps>
      <Step title="Запустіть ComfyUI локально">
        Переконайтеся, що ваш локальний екземпляр ComfyUI працює (типово `http://127.0.0.1:8188`).
      </Step>
      <Step title="Підготуйте ваш workflow JSON">
        Експортуйте або створіть файл workflow JSON для ComfyUI. Зверніть увагу на ID Node для Node введення prompt і output Node, з якого OpenClaw має читати результат.
      </Step>
      <Step title="Налаштуйте провайдера">
        Задайте `mode: "local"` і вкажіть файл workflow. Ось мінімальний приклад для зображень:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Задайте типову модель">
        Вкажіть OpenClaw на модель `comfy/workflow` для можливості, яку ви налаштували:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Найкраще для:** запуску workflow у Comfy Cloud без керування локальними GPU-ресурсами.

    <Steps>
      <Step title="Отримайте API key">
        Зареєструйтеся на [comfy.org](https://comfy.org) і створіть API key у панелі керування обліковим записом.
      </Step>
      <Step title="Задайте API key">
        Передайте ключ одним із цих способів:

        ```bash
        # Змінна середовища (рекомендовано)
        export COMFY_API_KEY="your-key"

        # Альтернативна змінна середовища
        export COMFY_CLOUD_API_KEY="your-key"

        # Або безпосередньо в конфігурації
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Підготуйте ваш workflow JSON">
        Експортуйте або створіть файл workflow JSON для ComfyUI. Зверніть увагу на ID Node для Node введення prompt і output Node.
      </Step>
      <Step title="Налаштуйте провайдера">
        Задайте `mode: "cloud"` і вкажіть файл workflow:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        У режимі cloud `baseUrl` типово дорівнює `https://cloud.comfy.org`. Задавати `baseUrl` потрібно лише якщо ви використовуєте власний cloud endpoint.
        </Tip>
      </Step>
      <Step title="Задайте типову модель">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфігурація

Comfy підтримує спільні налаштування з’єднання верхнього рівня плюс секції workflow для окремих можливостей (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Спільні ключі

| Key                   | Type                   | Description                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` або `"cloud"` | Режим з’єднання.                                                                      |
| `baseUrl`             | string                 | Типово `http://127.0.0.1:8188` для local або `https://cloud.comfy.org` для cloud.    |
| `apiKey`              | string                 | Необов’язковий вбудований ключ, альтернатива env vars `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Дозволити приватний/LAN `baseUrl` у режимі cloud.                                     |

### Ключі для окремих можливостей

Ці ключі застосовуються всередині секцій `image`, `video` або `music`:

| Key                          | Required | Default  | Description                                                                  |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` або `workflowPath` | Так     | --       | Шлях до файлу workflow JSON ComfyUI.                                         |
| `promptNodeId`               | Так      | --       | ID Node, який отримує текстовий prompt.                                      |
| `promptInputName`            | Ні       | `"text"` | Ім’я входу в Node prompt.                                                    |
| `outputNodeId`               | Ні       | --       | ID Node, з якого читається результат. Якщо не задано, використовуються всі відповідні output Node. |
| `pollIntervalMs`             | Ні       | --       | Інтервал опитування в мілісекундах для завершення завдання.                  |
| `timeoutMs`                  | Ні       | --       | Тайм-аут запуску workflow в мілісекундах.                                    |

Секції `image` і `video` також підтримують:

| Key                   | Required                             | Default   | Description                                         |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Так (коли передається reference image) | --      | ID Node, який отримує завантажене reference image.  |
| `inputImageInputName` | Ні                                   | `"image"` | Ім’я входу в Node зображення.                       |

## Деталі workflow

<AccordionGroup>
  <Accordion title="Workflow зображень">
    Задайте типову модель зображень як `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Приклад редагування з reference image:**

    Щоб увімкнути редагування зображень із завантаженим reference image, додайте `inputImageNodeId` до конфігурації image:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Workflow відео">
    Задайте типову модель відео як `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Workflow відео Comfy підтримують text-to-video та image-to-video через налаштований граф.

    <Note>
    OpenClaw не передає вхідні відео у workflow Comfy. Як вхідні дані підтримуються лише текстові prompt і одне reference image.
    </Note>

  </Accordion>

  <Accordion title="Workflow музики">
    Вбудований Plugin реєструє провайдера генерації музики для виходів аудіо або музики, визначених workflow, які доступні через спільний інструмент `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Використовуйте секцію конфігурації `music`, щоб вказати ваш workflow JSON для аудіо й output Node.

  </Accordion>

  <Accordion title="Зворотна сумісність">
    Наявна верхньорівнева конфігурація image (без вкладеної секції `image`) усе ще працює:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw трактує цю застарілу форму як конфігурацію workflow для image. Негайна міграція не потрібна, але для нових налаштувань рекомендуються вкладені секції `image` / `video` / `music`.

    <Tip>
    Якщо ви використовуєте лише генерацію зображень, застаріла пласка конфігурація і нова вкладена секція `image` функціонально еквівалентні.
    </Tip>

  </Accordion>

  <Accordion title="Live-тести">
    Для вбудованого Plugin є opt-in покриття live-тестами:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Live-тест пропускає окремі сценарії для image, video або music, якщо відповідна секція workflow Comfy не налаштована.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Налаштування та використання інструмента генерації зображень.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Налаштування та використання інструмента генерації відео.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Налаштування інструмента генерації музики й аудіо.
  </Card>
  <Card title="Каталог провайдерів" href="/uk/providers/index" icon="layers">
    Огляд усіх провайдерів і model ref.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Повний довідник конфігурації, включно з типовими значеннями агентів.
  </Card>
</CardGroup>
