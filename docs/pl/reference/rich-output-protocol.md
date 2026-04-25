---
read_when:
    - Zmiana renderowania odpowiedzi asystenta w interfejsie Control UI
    - Debugowanie dyrektyw prezentacji `[embed ...]`, `MEDIA:`, reply lub audio
summary: Protokół shortcode bogatego wyjścia dla osadzeń, multimediów, podpowiedzi audio i odpowiedzi
title: Protokół bogatego wyjścia
x-i18n:
    generated_at: "2026-04-25T13:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Odpowiedź asystenta może zawierać niewielki zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` do dostarczania załączników
- `[[audio_as_voice]]` dla podpowiedzi prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi
- `[embed ...]` dla bogatego renderowania w interfejsie Control UI

Te dyrektywy są od siebie niezależne. `MEDIA:` oraz tagi reply/voice pozostają metadanymi dostarczania; `[embed ...]` jest ścieżką bogatego renderowania wyłącznie dla interfejsu webowego.

Gdy włączone jest blokowe strumieniowanie, `MEDIA:` pozostaje metadanymi pojedynczego dostarczenia dla
tury. Jeśli ten sam adres URL multimediów zostanie wysłany w strumieniowanym bloku i powtórzony w końcowym
ładunku asystenta, OpenClaw dostarczy załącznik raz i usunie duplikat
z końcowego ładunku.

## `[embed ...]`

`[embed ...]` to jedyna składnia bogatego renderowania skierowana do agenta dla interfejsu Control UI.

Przykład samozamykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłowe dla nowych odpowiedzi.
- Shortcode osadzeń renderują się tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` lub `url="..."`.
- Shortcode osadzeń inline HTML w formie blokowej nie są renderowane.
- Interfejs webowy usuwa shortcode z widocznego tekstu i renderuje osadzenie inline.
- `MEDIA:` nie jest aliasem osadzenia i nie powinno być używane do bogatego renderowania osadzeń.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta jest strukturalnym elementem `canvas`:

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

Przechowywane/renderowane bogate bloki używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
