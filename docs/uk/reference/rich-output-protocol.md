---
read_when:
    - Зміна рендерингу виводу асистента в Control UI
    - Налагодження директив представлення `[embed ...]`, `MEDIA:`, reply або аудіо
summary: Протокол shortcode для розширеного виводу для embed, медіа, підказок аудіо та відповідей
title: Протокол розширеного виводу
x-i18n:
    generated_at: "2026-04-24T03:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Вивід асистента може містити невеликий набір директив доставки/рендерингу:

- `MEDIA:` для доставки вкладень
- `[[audio_as_voice]]` для підказок представлення аудіо
- `[[reply_to_current]]` / `[[reply_to:<id>]]` для метаданих відповіді
- `[embed ...]` для розширеного рендерингу в Control UI

Ці директиви є окремими. `MEDIA:` і теги reply/voice залишаються метаданими доставки; `[embed ...]` — це шлях розширеного рендерингу лише для вебінтерфейсу.

## `[embed ...]`

`[embed ...]` — це єдиний агент-орієнтований синтаксис розширеного рендерингу для Control UI.

Самозакривний приклад:

```text
[embed ref="cv_123" title="Status" /]
```

Правила:

- `[view ...]` більше не є коректним для нового виводу.
- Shortcode embed рендеряться лише на поверхні повідомлення асистента.
- Рендеряться лише embed з URL-джерелом. Використовуйте `ref="..."` або `url="..."`.
- Shortcode embed у формі блоку з inline HTML не рендеряться.
- Вебінтерфейс прибирає shortcode з видимого тексту й рендерить embed вбудовано.
- `MEDIA:` не є псевдонімом embed і не має використовуватися для розширеного рендерингу embed.

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

Збережені/відрендерені розширені блоки безпосередньо використовують цю форму `canvas`. `present_view` не розпізнається.

## Пов’язане

- [Адаптери RPC](/uk/reference/rpc)
- [Typebox](/uk/concepts/typebox)
