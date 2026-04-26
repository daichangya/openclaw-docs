---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem pluginu
    - Tworzysz plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, Compaction i cykl życia subagenta'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-04-26T11:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

**Silnik kontekstu** kontroluje, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak podsumowywać starszą historię i jak zarządzać kontekstem na granicach subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie — większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik pluginu tylko wtedy, gdy chcesz innego składania, Compaction lub zachowania przypominania między sesjami.

## Szybki start

<Steps>
  <Step title="Sprawdź, który silnik jest aktywny">
    ```bash
    openclaw doctor
    # lub sprawdź konfigurację bezpośrednio:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Zainstaluj silnik pluginu">
    Pluginy silnika kontekstu są instalowane tak jak każdy inny plugin OpenClaw.

    <Tabs>
      <Tab title="Z npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Ze ścieżki lokalnej">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Włącz i wybierz silnik">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // musi odpowiadać zarejestrowanemu identyfikatorowi silnika pluginu
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Konfiguracja specyficzna dla pluginu trafia tutaj (zobacz dokumentację pluginu)
          },
        },
      },
    }
    ```

    Uruchom ponownie gateway po instalacji i konfiguracji.

  </Step>
  <Step title="Przełącz z powrotem na legacy (opcjonalnie)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń ten klucz — `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wywoływany, gdy nowa wiadomość zostaje dodana do sesji. Silnik może przechowywać lub indeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Assemble">
    Wywoływany przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalny `systemPromptAddition`), które mieszczą się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compact">
    Wywoływany, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. Po turze">
    Wywoływany po zakończeniu uruchomienia. Silnik może utrwalać stan, wyzwalać Compaction w tle albo aktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex bez ACP OpenClaw stosuje ten sam cykl życia, rzutując złożony kontekst do instrukcji deweloperskich Codex i promptu bieżącej tury. Codex nadal zarządza własną natywną historią wątku i natywnym kompaktorem.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne hooki cyklu życia subagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia podrzędnego. Hook otrzymuje klucze sesji rodzica/potomka, `contextMode` (`isolated` lub `fork`), dostępne identyfikatory/pliki transkryptu oraz opcjonalny TTL. Jeśli zwróci uchwyt rollbacku, OpenClaw wywoła go, gdy uruchomienie nie powiedzie się po udanym przygotowaniu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Czyści zasoby po zakończeniu lub usunięciu sesji subagenta.
</ParamField>

### Dodatek do system promptu

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw dodaje go na początek system promptu dla uruchomienia. Dzięki temu silniki mogą wstrzykiwać dynamiczne wskazówki dotyczące przypominania, instrukcje retrieval albo podpowiedzi zależne od kontekstu bez wymagania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne zachowanie OpenClaw:

- **Ingest**: no-op (manager sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Assemble**: pass-through (istniejący potok sanitize → validate → limit w runtime obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego podsumowującego Compaction, który tworzy jedno podsumowanie starszych wiadomości i pozostawia ostatnie wiadomości nienaruszone.
- **Po turze**: no-op.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo ma wartość `"legacy"`), ten silnik jest używany automatycznie.

## Silniki pluginów

Plugin może zarejestrować silnik kontekstu za pomocą API pluginów:

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
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
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
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Następnie włącz go w konfiguracji:

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

| Element            | Rodzaj    | Cel                                                      |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i informacja, czy zarządza Compaction |
| `ingest(params)`   | Metoda    | Przechowuje pojedynczą wiadomość                         |
| `assemble(params)` | Metoda    | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda    | Podsumowuje/redukuje kontekst                            |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowanymi wiadomościami do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Szacunkiem silnika dotyczącym łącznej liczby tokenów w złożonym kontekście. OpenClaw używa tego przy decyzjach o progu Compaction i raportowaniu diagnostycznym.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawanym na początek system promptu.
</ParamField>

Elementy opcjonalne:

| Element                        | Rodzaj | Cel                                                                                                           |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływana raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`         | Metoda | Wczytuje ukończoną turę jako partię. Wywoływana po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`           | Metoda | Praca po uruchomieniu w cyklu życia (utrwalanie stanu, wyzwalanie Compaction w tle).                         |
| `prepareSubagentSpawn(params)`| Metoda | Przygotowuje współdzielony stan dla sesji potomnej przed jej rozpoczęciem.                                    |
| `onSubagentEnded(params)`     | Metoda | Czyści zasoby po zakończeniu subagenta.                                                                       |
| `dispose()`                   | Metoda | Zwalnia zasoby. Wywoływana podczas zamykania gateway lub przeładowania pluginu — nie per sesja.              |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowany auto-Compaction Pi w trakcie próby pozostaje włączony dla uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik zarządza zachowaniem Compaction. OpenClaw wyłącza wbudowany auto-Compaction Pi dla tego uruchomienia, a implementacja `compact()` silnika odpowiada za `/compact`, odzyskiwanie po przepełnieniu przez Compaction oraz każdy proaktywny Compaction, który chce wykonywać w `afterTurn()`. OpenClaw może nadal uruchamiać zabezpieczenie przepełnienia przed promptem; gdy przewidzi, że pełny transkrypt spowoduje przepełnienie, ścieżka odzyskiwania wywoła `compact()` aktywnego silnika przed wysłaniem kolejnego promptu.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Wbudowany auto-Compaction Pi może nadal działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie przełącza się na ścieżkę Compaction silnika legacy.
</Warning>

To oznacza, że istnieją dwa prawidłowe wzorce pluginów:

<Tabs>
  <Tab title="Tryb zarządzający">
    Zaimplementuj własny algorytm Compaction i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Tryb delegujący">
    Ustaw `ownsCompaction: false` i niech `compact()` wywołuje `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby używać wbudowanego zachowania Compaction OpenClaw.
  </Tab>
</Tabs>

No-op `compact()` jest niebezpieczny dla aktywnego silnika niezarządzającego, ponieważ wyłącza normalną ścieżkę `/compact` i odzyskiwania po przepełnieniu dla tego slotu silnika.

## Dokumentacja konfiguracji

```json5
{
  plugins: {
    slots: {
      // Wybiera aktywny silnik kontekstu. Domyślnie: "legacy".
      // Ustaw na identyfikator pluginu, aby używać silnika pluginu.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Slot jest wyłączny w czasie działania — dla danego uruchomienia lub operacji Compaction rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko to, który zarejestrowany identyfikator silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie pluginu:** gdy odinstalujesz plugin obecnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetu dotyczy `plugins.slots.memory`. Nie jest wymagana ręczna edycja konfiguracji.
</Note>

## Relacja z Compaction i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction jest jedną z odpowiedzialności silnika kontekstu. Silnik legacy deleguje do wbudowanego podsumowywania OpenClaw. Silniki pluginów mogą implementować dowolną strategię Compaction (podsumowania DAG, vector retrieval itp.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielne od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/retrieval; silniki kontekstu kontrolują to, co widzi model. Mogą współpracować — silnik kontekstu może używać danych pluginu pamięci podczas składania. Silniki pluginów, które chcą używać ścieżki promptu aktywnej pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, które przekształca sekcje promptu aktywnej pamięci w gotowy do dodania na początek `systemPromptAddition`. Jeśli silnik potrzebuje kontroli na niższym poziomie, może nadal pobierać surowe linie z `openclaw/plugin-sdk/memory-host-core` przez `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy Twój silnik ładuje się poprawnie.
- Przy przełączaniu silników istniejące sesje zachowują bieżącą historię. Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są logowane i widoczne w diagnostyce. Jeśli silnik pluginu nie zarejestruje się albo nie można rozwiązać wybranego identyfikatora silnika, OpenClaw nie używa automatycznego fallback; uruchomienia będą kończyć się błędem, dopóki nie naprawisz pluginu albo nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Do developmentu użyj `openclaw plugins install -l ./my-engine`, aby podlinkować lokalny katalog pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Kontekst](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Architektura pluginów](/pl/plugins/architecture) — rejestrowanie pluginów silnika kontekstu
- [Manifest pluginu](/pl/plugins/manifest) — pola manifestu pluginu
- [Pluginy](/pl/tools/plugin) — przegląd pluginów
