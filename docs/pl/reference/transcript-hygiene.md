---
read_when:
    - Debugujesz odrzucenia żądań providera związane z kształtem transkrypcji
    - Zmieniasz logikę sanityzacji transkrypcji lub naprawy wywołań narzędzi
    - Badasz niedopasowania identyfikatorów wywołań narzędzi między providerami
summary: 'Dokumentacja: reguły sanityzacji i naprawy transkrypcji specyficzne dla providera'
title: Higiena transkrypcji
x-i18n:
    generated_at: "2026-04-23T10:08:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiena transkrypcji (poprawki providerów)

Ten dokument opisuje **poprawki specyficzne dla providera** stosowane do transkrypcji przed uruchomieniem
(budowaniem kontekstu modelu). Są to dostosowania **w pamięci** używane do spełnienia rygorystycznych
wymagań providerów. Te kroki higieny **nie** przepisują zapisanego na dysku JSONL transkrypcji;
jednak oddzielny przebieg naprawy pliku sesji może przepisać nieprawidłowe pliki JSONL,
usuwając błędne linie przed wczytaniem sesji. Gdy następuje naprawa, oryginalny
plik jest kopiowany zapasowo obok pliku sesji.

Zakres obejmuje:

- sanityzację identyfikatorów wywołań narzędzi
- walidację wejść wywołań narzędzi
- naprawę parowania wyników narzędzi
- walidację / porządkowanie tur
- czyszczenie sygnatur myśli
- sanityzację ładunków obrazów
- tagowanie pochodzenia danych wejściowych użytkownika (dla promptów routowanych między sesjami)

Jeśli potrzebujesz szczegółów przechowywania transkrypcji, zobacz:

- [/reference/session-management-compaction](/pl/reference/session-management-compaction)

---

## Gdzie to działa

Cała higiena transkrypcji jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji / naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId` do decydowania, co zastosować.

Oddzielnie od higieny transkrypcji pliki sesji są naprawiane (w razie potrzeby) przed wczytaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie providera z powodu limitów
rozmiaru (skalowanie w dół / ponowna kompresja zbyt dużych obrazów base64).

Pomaga to również kontrolować presję tokenów powodowaną przez obrazy dla modeli obsługujących vision.
Niższe maksymalne wymiary zwykle zmniejszają zużycie tokenów; wyższe wymiary zachowują więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu jest konfigurowalny przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom providerów spowodowanym częściowo
zapisanymi wywołaniami narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi / ogłoszeń agent-do-agenta), OpenClaw zapisuje utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

Te metadane są zapisywane w momencie dopisywania do transkrypcji i nie zmieniają roli
(`role: "user"` pozostaje dla zgodności z providerami). Czytniki transkrypcji mogą używać
tego, aby nie traktować routowanych wewnętrznych promptów jako instrukcji napisanych przez użytkownika końcowego.

Podczas odbudowy kontekstu OpenClaw dodaje też w pamięci krótki znacznik `[Wiadomość między sesjami]`
do tych tur użytkownika, aby model mógł odróżniać je od zewnętrznych instrukcji użytkownika końcowego.

---

## Macierz providerów (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielne elementy rozumowania bez następującego po nich bloku treści) dla transkrypcji OpenAI Responses / Codex.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Brak naprawy parowania wyników narzędzi.
- Brak walidacji ani porządkowania tur.
- Brak syntetycznych wyników narzędzi.
- Brak usuwania sygnatur myśli.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Poprawka kolejności tur Google (dodanie małego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur thinking; usuwanie bloków thinking bez sygnatury.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika w celu spełnienia rygorystycznej naprzemienności).

**Mistral (w tym wykrywanie oparte na model-id)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature` niebędących base64 (zachowuje base64).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkrypcji:

- Rozszerzenie **transcript-sanitize** działało przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia / wyników narzędzi.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły zachowujący `_` / `-`).
- Runner wykonywał też sanityzację specyficzną dla providera, co dublowało pracę.
- Dodatkowe mutacje zachodziły poza polityką providera, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed zapisaniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między providerami (szczególnie parowanie
`call_id|fc_id` w `openai-responses`). Porządki w 2026.1.22 usunęły rozszerzenie, scentralizowały
logikę w runnerze i uczyniły OpenAI **nietykalnym** poza sanityzacją obrazów.
