---
read_when:
    - Debugujesz odrzucenia żądań dostawcy powiązane z kształtem transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niedopasowania identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja: reguły sanityzacji i naprawy transkryptów specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-04-25T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Ten dokument opisuje **poprawki specyficzne dla dostawcy** stosowane do transkryptów przed uruchomieniem
(budowaniem kontekstu modelu). Są to korekty **w pamięci** używane do spełnienia rygorystycznych
wymagań dostawców. Te kroki higieny **nie** przepisują zapisanego na dysku transkryptu JSONL;
jednak oddzielny etap naprawy pliku sesji może przepisać nieprawidłowe pliki JSONL
przez odrzucenie błędnych wierszy przed załadowaniem sesji. Gdy dochodzi do naprawy, oryginalny
plik jest zapisywany jako kopia zapasowa obok pliku sesji.

Zakres obejmuje:

- Kontekst promptu tylko w runtime, pozostający poza widocznymi dla użytkownika turami transkryptu
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację wejść wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / kolejność tur
- Czyszczenie sygnatur thinking
- Sanityzację payloadów obrazów
- Tagowanie pochodzenia wejścia użytkownika (dla promptów kierowanych między sesjami)

Jeśli potrzebujesz szczegółów dotyczących przechowywania transkryptów, zobacz:

- [Session management deep dive](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst runtime nie jest transkryptem użytkownika

Kontekst runtime/system może zostać dodany do promptu modelu dla danej tury, ale nie jest
treścią napisaną przez użytkownika końcowego. OpenClaw utrzymuje osobną treść promptu
przeznaczoną dla transkryptu dla odpowiedzi Gateway, kolejkowanych działań następczych, ACP, CLI oraz osadzonych
uruchomień Pi. Zapisane widoczne tury użytkownika używają tej treści transkryptu zamiast
promptu wzbogaconego o runtime.

W przypadku starszych sesji, które zapisały już wrappery runtime, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana we wbudowanym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Stosowanie sanityzacji/napraw: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Oddzielnie od higieny transkryptu pliki sesji są naprawiane (jeśli trzeba) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (wbudowany runner)

---

## Reguła globalna: sanityzacja obrazów

Payloady obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów rozmiaru
(skalowanie w dół/ponowna kompresja zbyt dużych obrazów base64).

Pomaga to również kontrolować nacisk obrazów na liczbę tokenów dla modeli obsługujących vision.
Mniejsze maksymalne wymiary zwykle zmniejszają zużycie tokenów; większe wymiary zachowują więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu jest konfigurowalny przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są odrzucane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom po stronie dostawcy z powodu częściowo
zapisanych wywołań narzędzi (na przykład po awarii z powodu limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie wejścia między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszenia agent-do-agenta), OpenClaw zapisuje utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

Te metadane są zapisywane podczas dopisywania do transkryptu i nie zmieniają roli
(`role: "user"` pozostaje dla zgodności z dostawcami). Czytniki transkryptu mogą używać
tego, aby nie traktować kierowanych promptów wewnętrznych jako instrukcji napisanych przez użytkownika końcowego.

Podczas odbudowy kontekstu OpenClaw poprzedza też te tury użytkownika w pamięci krótkim markerem
`[Inter-session message]`, aby model mógł odróżnić je od
zewnętrznych instrukcji użytkownika końcowego.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Odrzucanie osieroconych sygnatur reasoning (samodzielnych elementów reasoning bez następującego po nich bloku content) dla transkryptów OpenAI Responses/Codex oraz odrzucanie odtwarzalnego OpenAI reasoning po przełączeniu trasy modelu.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyniki i syntetyzować wyjścia w stylu Codex `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji tur lub zmiany ich kolejności.
- Brakujące wyniki narzędzi rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby dopasować normalizację odtwarzania Codex.
- Brak usuwania sygnatur thinking.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Poprawka kolejności tur Google (dodaje krótki bootstrap użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur thinking; odrzucanie niepodpisanych bloków thinking.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (łączenie kolejnych tur użytkownika, aby spełnić wymóg ścisłej naprzemienności).

**Mistral (w tym wykrywanie oparte na identyfikatorze modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur thinking: usuwanie wartości `thought_signature`, które nie są base64 (zachowanie base64).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- Rozszerzenie **transcript-sanitize** było uruchamiane przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użyć/wyników narzędzi.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał też sanityzację specyficzną dla dostawców, co dublowało pracę.
- Dodatkowe mutacje występowały poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed zapisaniem.
  - Odrzucanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `openai-responses`
`call_id|fc_id`). Porządki w wersji 2026.1.22 usunęły rozszerzenie, scentralizowały
logikę w runnerze i sprawiły, że OpenAI pozostał **nietknięty** poza sanityzacją obrazów.

## Powiązane

- [Session management](/pl/concepts/session)
- [Session pruning](/pl/concepts/session-pruning)
