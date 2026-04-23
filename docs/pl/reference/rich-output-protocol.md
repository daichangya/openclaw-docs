---
read_when:
    - Zmiana renderowania danych wyjściowych asystenta w Control UI
    - Debugowanie dyrektyw prezentacji `[embed ...]`, `MEDIA:`, odpowiedzi lub audio
summary: Protokół shortcode dla danych wyjściowych rich output dla osadzeń, multimediów, wskazówek audio i odpowiedzi
title: Protokół Rich Output
x-i18n:
    generated_at: "2026-04-23T10:08:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protokół Rich Output

Dane wyjściowe asystenta mogą przenosić mały zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` do dostarczania załączników
- `[[audio_as_voice]]` do wskazówek prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` do metadanych odpowiedzi
- `[embed ...]` do rich renderingu w Control UI

Te dyrektywy są odrębne. `MEDIA:` oraz tagi odpowiedzi/głosu pozostają metadanymi dostarczania; `[embed ...]` to ścieżka rich renderingu tylko dla WWW.

## `[embed ...]`

`[embed ...]` to jedyna skierowana do agenta składnia rich renderingu dla Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłowe dla nowych danych wyjściowych.
- Shortcode `embed` renderują się tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` lub `url="..."`.
- Shortcode osadzeń HTML inline w formie blokowej nie są renderowane.
- Interfejs WWW usuwa shortcode z widocznego tekstu i renderuje osadzenie inline.
- `MEDIA:` nie jest aliasem `embed` i nie należy go używać do rich renderingu osadzeń.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta to ustrukturyzowany element `canvas`:

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

Przechowywane/renderowane rich bloki używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.
