---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Plugin
    - Tworzysz Plugin silnika kontekstu
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, Compaction i cykl życia subagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-04-25T13:45:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

**Silnik kontekstu** kontroluje sposób, w jaki OpenClaw buduje kontekst modelu dla każdego uruchomienia:
które wiadomości uwzględnić, jak podsumowywać starszą historię oraz jak zarządzać
kontekstem między granicami subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie — większość
użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik Plugin tylko wtedy,
gdy chcesz innego składania, Compaction lub zachowania odtwarzania między sesjami.

## Szybki start

Sprawdź, który silnik jest aktywny:

```bash
openclaw doctor
# lub sprawdź config bezpośrednio:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalowanie Plugin silnika kontekstu

Pluginy silnika kontekstu instaluje się jak każdy inny Plugin OpenClaw. Najpierw zainstaluj,
a potem wybierz silnik w slocie:

```bash
# Instalacja z npm
openclaw plugins install @martian-engineering/lossless-claw

# Lub instalacja ze ścieżki lokalnej (do developmentu)
openclaw plugins install -l ./my-context-engine
```

Następnie włącz Plugin i wybierz go jako aktywny silnik w config:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // musi odpowiadać zarejestrowanemu id silnika Plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Config specyficzny dla Plugin umieść tutaj (zobacz dokumentację Plugin)
      },
    },
  },
}
```

Po instalacji i konfiguracji uruchom ponownie gateway.

Aby przełączyć się z powrotem na wbudowany silnik, ustaw `contextEngine` na `"legacy"` (lub
całkowicie usuń ten klucz — `"legacy"` jest wartością domyślną).

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy
w czterech punktach cyklu życia:

1. **Ingest** — wywoływany, gdy nowa wiadomość zostaje dodana do sesji. Silnik
   może przechowywać lub indeksować wiadomość we własnym magazynie danych.
2. **Assemble** — wywoływany przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany
   zestaw wiadomości (oraz opcjonalne `systemPromptAddition`), które mieszczą się
   w budżecie tokenów.
3. **Compact** — wywoływany, gdy okno kontekstu jest pełne lub gdy użytkownik uruchamia
   `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
4. **After turn** — wywoływany po zakończeniu uruchomienia. Silnik może utrwalić stan,
   uruchomić Compaction w tle albo zaktualizować indeksy.

Dla dołączonej wiązki Codex bez ACP OpenClaw stosuje ten sam cykl życia, rzutując
złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal
zarządza natywnie własną historią wątku i natywnym kompaktorem.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne haki cyklu życia subagenta:

- **prepareSubagentSpawn** — przygotowuje współdzielony stan kontekstu, zanim rozpocznie się
  podrzędne uruchomienie. Hak otrzymuje klucze sesji rodzica/potomka, `contextMode`
  (`isolated` lub `fork`), dostępne id/pliki transkryptu oraz opcjonalny TTL.
  Jeśli zwróci uchwyt rollback, OpenClaw wywoła go, gdy uruchomienie nie powiedzie się
  po pomyślnym przygotowaniu.
- **onSubagentEnded** — czyści zasoby po zakończeniu lub usunięciu sesji subagenta.

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw
dodaje go na początku promptu systemowego dla uruchomienia. Pozwala to silnikom wstrzykiwać
dynamiczne wskazówki odtwarzania, instrukcje pobierania lub podpowiedzi zależne od kontekstu
bez wymagania statycznych plików przestrzeni roboczej.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne działanie OpenClaw:

- **Ingest**: no-op (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Assemble**: pass-through (istniejący potok sanitize → validate → limit
  w runtime obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego podsumowującego Compaction, który tworzy
  pojedyncze podsumowanie starszych wiadomości i pozostawia nienaruszone wiadomości najnowsze.
- **After turn**: no-op.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo jest ustawione na `"legacy"`), ten
silnik jest używany automatycznie.

## Silniki Plugin

Plugin może zarejestrować silnik kontekstu za pomocą API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Przechowaj wiadomość w swoim magazynie danych
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Zwróć wiadomości, które mieszczą się w budżecie
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Podsumuj starszy kontekst
      return { ok: true, compacted: true };
    },
  }));
}
```

Następnie włącz go w config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Interfejs ContextEngine

Wymagane elementy:

| Element            | Rodzaj   | Cel                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Właściwość | Id silnika, nazwa, wersja i informacja, czy zarządza Compaction |
| `ingest(params)`   | Metoda   | Zapisuje pojedynczą wiadomość                            |
| `assemble(params)` | Metoda   | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda   | Podsumowuje/redukuje kontekst                            |

`assemble` zwraca `AssembleResult` z:

- `messages` — uporządkowane wiadomości wysyłane do modelu.
- `estimatedTokens` (wymagane, `number`) — szacunek silnika dotyczący łącznej liczby
  tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progu Compaction
  i raportowania diagnostycznego.
- `systemPromptAddition` (opcjonalne, `string`) — dodawane na początku promptu systemowego.

Elementy opcjonalne:

| Element                        | Rodzaj | Cel                                                                                                            |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływana raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`         | Metoda | Przetwarza zakończoną turę jako partię. Wywoływana po zakończeniu uruchomienia, z wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`           | Metoda | Prace cyklu życia po uruchomieniu (utrwalanie stanu, wyzwalanie Compaction w tle).                             |
| `prepareSubagentSpawn(params)`| Metoda | Konfiguruje współdzielony stan dla sesji podrzędnej przed jej rozpoczęciem.                                   |
| `onSubagentEnded(params)`     | Metoda | Czyści zasoby po zakończeniu subagenta.                                                                        |
| `dispose()`                   | Metoda | Zwolnienie zasobów. Wywoływana przy zamykaniu gateway lub przeładowaniu Plugin — nie dla każdej sesji.       |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowany automatyczny Compaction Pi podczas próby
pozostaje włączony dla uruchomienia:

- `true` — silnik zarządza zachowaniem Compaction. OpenClaw wyłącza wbudowany
  automatyczny Compaction Pi dla tego uruchomienia, a implementacja `compact()` silnika
  odpowiada za `/compact`, odzyskiwanie po przepełnieniu oraz każdy proaktywny
  Compaction, jaki chce uruchamiać w `afterTurn()`. OpenClaw nadal może uruchomić
  zabezpieczenie przed przepełnieniem przed promptem; gdy przewidzi, że pełny transkrypt
  spowoduje przepełnienie, ścieżka odzyskiwania wywoła `compact()` aktywnego silnika
  przed wysłaniem kolejnego promptu.
- `false` lub brak ustawienia — wbudowany automatyczny Compaction Pi nadal może działać podczas
  wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla
  `/compact` i odzyskiwania po przepełnieniu.

`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do
ścieżki Compaction silnika legacy.

Oznacza to, że istnieją dwa prawidłowe wzorce Plugin:

- **Tryb przejmujący** — zaimplementuj własny algorytm Compaction i ustaw
  `ownsCompaction: true`.
- **Tryb delegujący** — ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało
  `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć
  wbudowanego zachowania Compaction OpenClaw.

No-op `compact()` jest niebezpieczne dla aktywnego silnika nieprzejmującego, ponieważ
wyłącza normalną ścieżkę `/compact` i odzyskiwania po przepełnieniu dla tego
slotu silnika.

## Dokumentacja referencyjna konfiguracji

```json5
{
  plugins: {
    slots: {
      // Wybiera aktywny silnik kontekstu. Domyślnie: "legacy".
      // Ustaw na id Plugin, aby użyć silnika Plugin.
      contextEngine: "legacy",
    },
  },
}
```

Slot jest wyłączny w czasie działania — dla danego uruchomienia lub operacji Compaction
rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone
Pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod
rejestracyjny; `plugins.slots.contextEngine` wybiera tylko to zarejestrowane id silnika,
które OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.

## Relacja z Compaction i pamięcią

- **Compaction** jest jedną z odpowiedzialności silnika kontekstu. Silnik legacy
  deleguje do wbudowanego podsumowywania OpenClaw. Silniki Plugin mogą implementować
  dowolną strategię Compaction (podsumowania DAG, pobieranie wektorowe itd.).
- **Pluginy pamięci** (`plugins.slots.memory`) są oddzielone od silników kontekstu.
  Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują to,
  co widzi model. Mogą działać razem — silnik kontekstu może używać danych
  Plugin pamięci podczas składania. Silniki Plugin, które chcą używać aktywnej ścieżki
  promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z
  `openclaw/plugin-sdk/core`, które przekształca aktywne sekcje promptu pamięci
  w gotowe do dodania na początku `systemPromptAddition`. Jeśli silnik potrzebuje kontroli
  niższego poziomu, nadal może pobierać surowe wiersze z
  `openclaw/plugin-sdk/memory-host-core` przez
  `buildActiveMemoryPromptSection(...)`.
- **Przycinanie sesji** (obcinanie starych wyników narzędzi w pamięci) nadal działa
  niezależnie od tego, który silnik kontekstu jest aktywny.

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy Twój silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje kontynuują pracę z bieżącą historią.
  Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są logowane i pokazywane w diagnostyce. Jeśli silnik Plugin
  nie zarejestruje się poprawnie albo wybranego id silnika nie można rozwiązać, OpenClaw
  nie wraca automatycznie; uruchomienia będą kończyć się błędem, dopóki nie naprawisz Plugin
  albo nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Do developmentu użyj `openclaw plugins install -l ./my-engine`, aby podlinkować
  lokalny katalog Plugin bez kopiowania.

Zobacz także: [Compaction](/pl/concepts/compaction), [Kontekst](/pl/concepts/context),
[Pluginy](/pl/tools/plugin), [Manifest Plugin](/pl/plugins/manifest).

## Powiązane

- [Kontekst](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Architektura Plugin](/pl/plugins/architecture) — rejestrowanie Plugin silnika kontekstu
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
