---
read_when:
    - Zmiana renderowania wyjścia asystenta w Control UI
    - Debugowanie dyrektyw prezentacji `[embed ...]`, `MEDIA:`, odpowiedzi lub audio
summary: Protokół shortcode dla rozbudowanego wyjścia dla osadzeń, mediów, wskazówek audio i odpowiedzi
title: Protokół rozbudowanego wyjścia
x-i18n:
    generated_at: "2026-04-26T11:40:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

Wyjście asystenta może zawierać niewielki zestaw dyrektyw dostarczania/renderowania:

- `MEDIA:` dla dostarczania załączników
- `[[audio_as_voice]]` dla wskazówek prezentacji audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` dla metadanych odpowiedzi
- `[embed ...]` dla rozbudowanego renderowania w Control UI

Zdalne załączniki `MEDIA:` muszą być publicznymi adresami URL `https:`. Zwykłe `http:`,
local loopback, adresy link-local, prywatne i wewnętrzne nazwy hostów są ignorowane jako dyrektywy
załączników; mechanizmy pobierania mediów po stronie serwera nadal wymuszają własne zabezpieczenia sieciowe.

Te dyrektywy są rozdzielne. `MEDIA:` oraz tagi odpowiedzi/głosu pozostają metadanymi dostarczania; `[embed ...]` to ścieżka rozbudowanego renderowania tylko dla sieci.
Zaufane media z wyników narzędzi używają tego samego parsera `MEDIA:` / `[[audio_as_voice]]` przed dostarczeniem, więc tekstowe wyjścia narzędzi nadal mogą oznaczać załącznik audio jako notatkę głosową.

Gdy włączone jest strumieniowanie blokowe, `MEDIA:` pozostaje metadanymi pojedynczego dostarczenia dla
tury. Jeśli ten sam URL medium zostanie wysłany w strumieniowanym bloku i powtórzony w końcowym
ładunku asystenta, OpenClaw dostarczy załącznik raz i usunie duplikat
z końcowego ładunku.

## `[embed ...]`

`[embed ...]` to jedyna skierowana do agentów składnia rozbudowanego renderowania dla Control UI.

Przykład samodomykający:

```text
[embed ref="cv_123" title="Status" /]
```

Zasady:

- `[view ...]` nie jest już prawidłowe dla nowych danych wyjściowych.
- Shortcode osadzeń renderują się tylko na powierzchni wiadomości asystenta.
- Renderowane są tylko osadzenia oparte na URL. Użyj `ref="..."` lub `url="..."`.
- Shortcode osadzeń w postaci blokowej inline HTML nie są renderowane.
- Interfejs web usuwa shortcode z widocznego tekstu i renderuje osadzenie inline.
- `MEDIA:` nie jest aliasem osadzenia i nie powinno być używane do rozbudowanego renderowania osadzeń.

## Przechowywany kształt renderowania

Znormalizowany/przechowywany blok treści asystenta to uporządkowany element `canvas`:

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

Przechowywane/renderowane rozbudowane bloki używają bezpośrednio tego kształtu `canvas`. `present_view` nie jest rozpoznawane.

## Powiązane

- [Adaptery RPC](/pl/reference/rpc)
- [Typebox](/pl/concepts/typebox)
