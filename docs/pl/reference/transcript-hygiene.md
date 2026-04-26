---
read_when:
    - Debugujesz odrzucenia żądań dostawcy powiązane z kształtem transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niedopasowania identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja: reguły sanityzacji i naprawy transkryptu specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-04-26T11:41:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Ten dokument opisuje **poprawki specyficzne dla dostawcy** stosowane do transkryptów przed uruchomieniem
(budowaniem kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia
ścisłych wymagań dostawców. Oddzielny przebieg naprawy pliku sesji może również przepisywać
przechowywany JSONL przed załadowaniem sesji, albo przez usuwanie błędnych linii JSONL, albo
przez naprawę utrwalonych tur, które są składniowo poprawne, ale wiadomo, że są odrzucane przez
dostawcę podczas odtwarzania. Gdy nastąpi naprawa, oryginalny plik jest archiwizowany obok
pliku sesji.

Zakres obejmuje:

- Kontekst promptu tylko dla środowiska uruchomieniowego, pozostający poza widocznymi dla użytkownika turami transkryptu
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur Thinking
- Sanityzację ładunków obrazów
- Tagowanie pochodzenia danych wejściowych użytkownika (dla promptów kierowanych między sesjami)
- Naprawę pustych tur błędów asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów przechowywania transkryptów, zobacz:

- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst środowiska uruchomieniowego nie jest transkryptem użytkownika

Kontekst runtime/system może zostać dodany do promptu modelu dla danej tury, ale nie
jest treścią stworzoną przez użytkownika końcowego. OpenClaw utrzymuje osobne ciało
promptu widoczne dla transkryptu dla odpowiedzi Gateway, follow-upów w kolejce, ACP, CLI i osadzonych
uruchomień Pi. Przechowywane widoczne tury użytkownika używają tego ciała transkryptu zamiast
promptu wzbogaconego przez środowisko uruchomieniowe.

W przypadku starszych sesji, które już utrwaliły opakowania środowiska uruchomieniowego, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId` do określenia, co zastosować.

Niezależnie od higieny transkryptu pliki sesji są naprawiane (jeśli to potrzebne) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (skalowanie w dół/ponowna kompresja zbyt dużych obrazów base64).

Pomaga to również kontrolować presję tokenów powodowaną przez obrazy dla modeli obsługujących vision.
Mniejsze maksymalne wymiary zwykle zmniejszają użycie tokenów; większe wymiary zachowują więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można konfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).

---

## Reguła globalna: błędne wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom po stronie dostawcy wynikającym z częściowo
utrwalonych wywołań narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłaszania agent-do-agenta), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

Te metadane są zapisywane podczas dopisywania do transkryptu i nie zmieniają roli
(`role: "user"` pozostaje dla zgodności z dostawcą). Odczytujący transkrypt mogą ich używać,
aby nie traktować kierowanych promptów wewnętrznych jako instrukcji tworzonych przez użytkownika końcowego.

Podczas odbudowy kontekstu OpenClaw również dodaje na początku w pamięci krótki znacznik `[Inter-session message]`
do tych tur użytkownika, aby model mógł odróżnić je od
zewnętrznych instrukcji użytkownika końcowego.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur reasoning (samodzielnych elementów reasoning bez następującego po nich bloku treści) dla transkryptów OpenAI Responses/Codex oraz usuwanie odtwarzalnego OpenAI reasoning po zmianie trasy modelu.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyniki i syntetyzować wyjścia `aborted` w stylu Codex dla brakujących wywołań narzędzi.
- Brak walidacji tur ani zmiany ich kolejności.
- Brakujące wyniki narzędzi z rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby odpowiadać normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisły alfanumeryczny.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Poprawka kolejności tur Google (dodanie na początku małego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur Thinking; usuwanie niepodpisanych bloków Thinking.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (łączenie kolejnych tur użytkownika, aby spełnić ścisłą naprzemienność).
- Bloki Thinking z brakującymi, pustymi lub zawierającymi wyłącznie białe znaki sygnaturami odtwarzania są usuwane
  przed konwersją dostawcy. Jeśli to opróżnia turę asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego reasoning.
- Starsze tury asystenta zawierające wyłącznie Thinking, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego reasoning, aby adaptery dostawcy nie usuwały
  odtwarzanej tury.

**Amazon Bedrock (Converse API)**

- Puste tury błędów strumienia asystenta są naprawiane do niepustego zastępczego bloku tekstowego
  przed odtwarzaniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są także
  naprawiane na dysku przed załadowaniem.
- Bloki Claude Thinking z brakującymi, pustymi lub zawierającymi wyłącznie białe znaki sygnaturami odtwarzania są
  usuwane przed odtwarzaniem Converse. Jeśli to opróżnia turę asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego reasoning.
- Starsze tury asystenta zawierające wyłącznie Thinking, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego reasoning, aby odtwarzanie Converse zachowało ścisły kształt tury.
- Odtwarzanie filtruje tury asystenta z lustrzanego odbicia dostarczania OpenClaw i wstrzyknięte przez Gateway.
- Sanityzacja obrazów jest stosowana przez regułę globalną.

**Mistral (w tym wykrywanie oparte na model-id)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature`, które nie są base64 (zachowuje base64).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (sprzed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- Rozszerzenie **transcript-sanitize** działało przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia/wyniku narzędzia.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał również sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje występowały poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (szczególnie w parowaniu
`call_id|fc_id` dla `openai-responses`). Porządki w 2026.1.22 usunęły rozszerzenie, scentralizowały
logikę w runnerze i uczyniły OpenAI **nietykalnym** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
