---
read_when:
    - Chcesz analizować pliki PDF z poziomu agentów
    - Potrzebujesz dokładnych parametrów i limitów narzędzia PDF
    - Debugujesz natywny tryb PDF w porównaniu z zapasowym wyodrębnianiem tekstu
summary: Analizuj jeden lub więcej dokumentów PDF z natywną obsługą dostawcy i zapasowym wyodrębnianiem tekstu
title: Narzędzie PDF
x-i18n:
    generated_at: "2026-04-25T14:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analizuje jeden lub więcej dokumentów PDF i zwraca tekst.

Szybkie działanie:

- Natywny tryb dostawcy dla dostawców modeli Anthropic i Google.
- Zapasowy tryb wyodrębniania dla innych dostawców (najpierw wyodrębnienie tekstu, a potem obrazy stron, gdy są potrzebne).
- Obsługuje pojedyncze (`pdf`) lub wielokrotne (`pdfs`) wejście, maksymalnie 10 plików PDF na wywołanie.

## Dostępność

Narzędzie jest rejestrowane tylko wtedy, gdy OpenClaw może rozwiązać konfigurację modelu obsługującego PDF dla agenta:

1. `agents.defaults.pdfModel`
2. fallback do `agents.defaults.imageModel`
3. fallback do rozwiązanego modelu sesji/domniemanej wartości agenta
4. jeśli natywni dostawcy PDF są wspierani przez auth, mają pierwszeństwo przed ogólnymi kandydatami zapasowymi dla obrazów

Jeśli nie da się rozwiązać żadnego używalnego modelu, narzędzie `pdf` nie jest udostępniane.

Uwagi dotyczące dostępności:

- Łańcuch fallback jest świadomy auth. Skonfigurowane `provider/model` liczy się tylko wtedy, gdy
  OpenClaw rzeczywiście może uwierzytelnić tego dostawcę dla agenta.
- Natywni dostawcy PDF to obecnie **Anthropic** i **Google**.
- Jeśli rozwiązany dostawca sesji/domniemany ma już skonfigurowany model vision/PDF,
  narzędzie PDF używa go ponownie, zanim przejdzie do innych dostawców wspieranych przez auth.

## Dokumentacja wejścia

<ParamField path="pdf" type="string">
Jedna ścieżka lub URL PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Wiele ścieżek lub URL-i PDF, maksymalnie 10 łącznie.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analizy.
</ParamField>

<ParamField path="pages" type="string">
Filtr stron, taki jak `1-5` lub `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Opcjonalne nadpisanie modelu w formie `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limit rozmiaru na pojedynczy PDF w MB. Domyślnie `agents.defaults.pdfMaxBytesMb` albo `10`.
</ParamField>

Uwagi dotyczące wejścia:

- `pdf` i `pdfs` są scalane i deduplikowane przed wczytaniem.
- Jeśli nie podano wejścia PDF, narzędzie zwraca błąd.
- `pages` jest parsowane jako numery stron liczone od 1, deduplikowane, sortowane i ograniczane do skonfigurowanej maksymalnej liczby stron.
- `maxBytesMb` domyślnie używa `agents.defaults.pdfMaxBytesMb` albo `10`.

## Obsługiwane odwołania PDF

- lokalna ścieżka pliku (w tym rozwinięcie `~`)
- URL `file://`
- URL `http://` i `https://`
- odwołania przychodzące zarządzane przez OpenClaw, takie jak `media://inbound/<id>`

Uwagi dotyczące odwołań:

- Inne schematy URI (na przykład `ftp://`) są odrzucane z `unsupported_pdf_reference`.
- W trybie sandbox zdalne URL-e `http(s)` są odrzucane.
- Gdy włączona jest polityka plików tylko z workspace, lokalne ścieżki plików poza dozwolonymi katalogami głównymi są odrzucane.
- Zarządzane odwołania przychodzące i odtwarzane ścieżki pod magazynem mediów przychodzących OpenClaw są dozwolone przy polityce plików tylko z workspace.

## Tryby wykonania

### Natywny tryb dostawcy

Tryb natywny jest używany dla dostawców `anthropic` i `google`.
Narzędzie wysyła surowe bajty PDF bezpośrednio do API dostawców.

Limity trybu natywnego:

- `pages` nie jest obsługiwane. Jeśli zostanie ustawione, narzędzie zwraca błąd.
- Obsługiwane jest wejście wielu PDF; każdy PDF jest wysyłany jako natywny blok dokumentu /
  inline PDF part przed promptem.

### Zapasowy tryb wyodrębniania

Tryb zapasowy jest używany dla dostawców nienatywnych.

Przepływ:

1. Wyodrębnij tekst z wybranych stron (do `agents.defaults.pdfMaxPages`, domyślnie `20`).
2. Jeśli długość wyodrębnionego tekstu jest mniejsza niż `200` znaków, wyrenderuj wybrane strony do obrazów PNG i dołącz je.
3. Wyślij wyodrębnioną treść wraz z promptem do wybranego modelu.

Szczegóły trybu zapasowego:

- Wyodrębnianie obrazów stron używa budżetu pikseli `4,000,000`.
- Jeśli model docelowy nie obsługuje wejścia obrazów i nie ma tekstu możliwego do wyodrębnienia, narzędzie zwraca błąd.
- Jeśli wyodrębnianie tekstu się powiedzie, ale wyodrębnianie obrazów wymagałoby vision w
  modelu tylko tekstowym, OpenClaw odrzuca wyrenderowane obrazy i kontynuuje pracę z
  wyodrębnionym tekstem.
- Zapasowe wyodrębnianie używa wbudowanego pluginu `document-extract`. Plugin zarządza
  `pdfjs-dist`; `@napi-rs/canvas` jest używane tylko wtedy, gdy dostępny jest zapasowy rendering obrazów.

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Pełne szczegóły pól znajdziesz w [Configuration Reference](/pl/gateway/configuration-reference).

## Szczegóły wyjścia

Narzędzie zwraca tekst w `content[0].text` i ustrukturyzowane metadane w `details`.

Typowe pola `details`:

- `model`: rozwiązane odwołanie do modelu (`provider/model`)
- `native`: `true` dla natywnego trybu dostawcy, `false` dla trybu zapasowego
- `attempts`: nieudane próby fallback przed sukcesem

Pola ścieżek:

- pojedyncze wejście PDF: `details.pdf`
- wiele wejść PDF: `details.pdfs[]` z wpisami `pdf`
- metadane przepisania ścieżki sandbox (gdy dotyczy): `rewrittenFrom`

## Zachowanie błędów

- Brak wejścia PDF: zgłasza `pdf required: provide a path or URL to a PDF document`
- Zbyt wiele PDF: zwraca ustrukturyzowany błąd w `details.error = "too_many_pdfs"`
- Nieobsługiwany schemat odwołania: zwraca `details.error = "unsupported_pdf_reference"`
- Tryb natywny z `pages`: zgłasza czytelny błąd `pages is not supported with native PDF providers`

## Przykłady

Pojedynczy PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Podsumuj ten raport w 5 punktach"
}
```

Wiele PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Porównaj ryzyka i zmiany harmonogramu w obu dokumentach"
}
```

Model zapasowy z filtrem stron:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Wyodrębnij tylko incydenty wpływające na klientów"
}
```

## Powiązane

- [Tools Overview](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Configuration Reference](/pl/gateway/config-agents#agent-defaults) — konfiguracja `pdfMaxBytesMb` i `pdfMaxPages`
