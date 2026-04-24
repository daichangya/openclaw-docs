---
read_when:
    - Зміна рендерингу виводу асистента в Control UI
    - Налагодження директив представлення `[embed ...]`, `MEDIA:`, reply або audio
summary: Протокол shortcode для rich output для embed, медіа, підказок аудіо та відповідей
title: Протокол rich output
x-i18n:
    generated_at: "2026-04-24T03:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ec8b9a263a60be921ed873777b64e4c122966ec9a4f47203b637c316a79b5b9
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Вивід асистента може містити невеликий набір директив доставки/рендерингу:

- `MEDIA:` для доставки вкладень
- `[[audio_as_voice]]` для підказок представлення аудіо
- `[[reply_to_current]]` / `[[reply_to:<id>]]` для метаданих відповіді
- `[embed ...]` для rich-рендерингу в Control UI

Ці директиви є окремими. `MEDIA:` і теги reply/voice залишаються метаданими доставки; `[embed ...]` — це веб-тільки шлях rich-рендерингу.

## `[embed ...]`

`[embed ...]` — це єдиний агент-орієнтований синтаксис rich-рендерингу для Control UI.

Приклад самозакривного запису:

```text
[embed ref="cv_123" title="Status" /]
```

Правила:

- `[view ...]` більше не є валідним для нового виводу.
- Shortcode embed рендеряться лише на поверхні повідомлень асистента.
- Рендеряться лише embed на основі URL. Використовуйте `ref="..."` або `url="..."`.
- Inline HTML embed shortcode у block-формі не рендеряться.
- Веб-UI прибирає shortcode з видимого тексту й рендерить embed inline.
- `MEDIA:` не є псевдонімом embed і не має використовуватися для rich-рендерингу embed.

## Збережена форма рендерингу

Нормалізований/збережений блок вмісту асистента — це структурований елемент `canvas`:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Збережені/відрендерені rich-блоки безпосередньо використовують цю форму `canvas`. `present_view` не розпізнається.

## Пов’язане

- [Адаптери RPC](/reference/rpc-adapters)
- [Typebox](/uk/concepts/typebox)
