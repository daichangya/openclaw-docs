---
x-i18n:
    generated_at: "2026-04-11T15:15:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a8884fc2c304bf96d4675f0c1d1ff781d6dc1ae8c49d92ce08040c9c7709035
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protokół rozbudowanego wyjścia

Wynik asystenta może zawierać niewielki zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` do dostarczania załączników
- `[[audio_as_voice]]` do wskazówek dotyczących prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` do metadanych odpowiedzi
- `[embed ...]` do rozbudowanego renderowania w interfejsie użytkownika Control UI

Te dyrektywy są odrębne. `MEDIA:` oraz tagi reply/voice pozostają metadanymi dostarczania; `[embed ...]` to ścieżka rozbudowanego renderowania tylko dla sieci.

## `[embed ...]`

`[embed ...]` to jedyna składnia rozbudowanego renderowania skierowana do agentów dla interfejsu użytkownika Control UI.

Przykład samodomykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłowe dla nowych wyników.
- Krótkie kody embed są renderowane tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` lub `url="..."`.
- Krótkie kody osadzania w postaci blokowej, zapisane jako wbudowany HTML, nie są renderowane.
- Interfejs webowy usuwa shortcode z widocznego tekstu i renderuje osadzenie w linii.
- `MEDIA:` nie jest aliasem embed i nie należy go używać do renderowania rozbudowanych osadzeń.

## Zapisany kształt renderowania

Znormalizowany/zapisany blok treści asystenta ma postać uporządkowanego elementu `canvas`:

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

Zapisane/renderowane bloki rozbudowane używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.
