---
read_when:
    - Вам потрібна генерація медіа Vydra в OpenClaw
    - Вам потрібні вказівки з налаштування API key Vydra
summary: Використовуйте Vydra для зображень, відео та мовлення в OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T03:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Вбудований Plugin Vydra додає:

- Генерацію зображень через `vydra/grok-imagine`
- Генерацію відео через `vydra/veo3` і `vydra/kling`
- Синтез мовлення через маршрут TTS Vydra на базі ElevenLabs

OpenClaw використовує той самий `VYDRA_API_KEY` для всіх трьох можливостей.

<Warning>
Використовуйте `https://www.vydra.ai/api/v1` як base URL.

Apex-хост Vydra (`https://vydra.ai/api/v1`) наразі перенаправляє на `www`. Деякі HTTP-клієнти скидають `Authorization` під час такого міжхостового перенаправлення, через що валідний API key перетворюється на оманливу помилку автентифікації. Вбудований Plugin використовує base URL `www` напряму, щоб уникнути цього.
</Warning>

## Налаштування

<Steps>
  <Step title="Запустіть інтерактивний онбординг">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Або задайте env var безпосередньо:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Виберіть типову можливість">
    Оберіть одну чи кілька можливостей нижче (зображення, відео або мовлення) і застосуйте відповідну конфігурацію.
  </Step>
</Steps>

## Можливості

<AccordionGroup>
  <Accordion title="Генерація зображень">
    Типова модель зображень:

    - `vydra/grok-imagine`

    Задайте її як типового provider зображень:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    Поточна вбудована підтримка охоплює лише text-to-image. Хостовані маршрути редагування Vydra очікують віддалені URL зображень, а OpenClaw поки що не додає у вбудованому Plugin місток завантаження, специфічний для Vydra.

    <Note>
    Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерація відео">
    Зареєстровані моделі відео:

    - `vydra/veo3` для text-to-video
    - `vydra/kling` для image-to-video

    Задайте Vydra як типового provider відео:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Примітки:

    - `vydra/veo3` у вбудованому варіанті доступна лише як text-to-video.
    - `vydra/kling` наразі вимагає посилання на віддалений URL зображення. Завантаження локальних файлів одразу відхиляється.
    - Поточний HTTP-маршрут `kling` у Vydra поводився нестабільно щодо того, чи потрібен йому `image_url` чи `video_url`; вбудований provider відображає той самий віддалений URL зображення в обидва поля.
    - Вбудований Plugin дотримується консервативного підходу і не передає недокументовані параметри стилю, такі як співвідношення сторін, роздільна здатність, watermark або згенероване аудіо.

    <Note>
    Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Live-тести відео">
    Live-покриття, специфічне для provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Вбудований live-файл Vydra тепер охоплює:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video з використанням віддаленого URL зображення

    За потреби перевизначте фікстуру віддаленого зображення:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Синтез мовлення">
    Задайте Vydra як provider мовлення:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Типові значення:

    - Модель: `elevenlabs/tts`
    - Voice id: `21m00Tcm4TlvDq8ikWAM`

    Вбудований Plugin наразі надає один перевірений типовий голос і повертає аудіофайли MP3.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Каталог provider" href="/uk/providers/index" icon="list">
    Переглянути всі доступні providers.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір provider.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір provider.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/config-agents#agent-defaults" icon="gear">
    Типові значення агента й конфігурація моделі.
  </Card>
</CardGroup>
