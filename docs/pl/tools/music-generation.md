---
read_when:
    - Generowanie muzyki lub audio przez agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Zrozumienie parametrów narzędzia `music_generate`
sidebarTitle: Music generation
summary: Generowanie muzyki przez `music_generate` w Google Lyria, MiniMax i przepływach pracy ComfyUI
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-04-26T11:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub audio przez
współdzieloną funkcję generowania muzyki z użyciem skonfigurowanych dostawców —
obecnie Google, MiniMax i skonfigurowanych przepływów pracy ComfyUI.

W przypadku uruchomień agenta opartych na sesji OpenClaw uruchamia generowanie
muzyki jako zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie
wybudza agenta, gdy utwór jest gotowy, aby agent mógł opublikować gotowe audio
z powrotem w oryginalnym kanale.

<Note>
Wbudowane współdzielone narzędzie pojawia się tylko wtedy, gdy dostępny jest co
najmniej jeden dostawca generowania muzyki. Jeśli nie widzisz `music_generate`
w narzędziach swojego agenta, skonfiguruj `agents.defaults.musicGenerationModel`
lub ustaw klucz API dostawcy.
</Note>

## Szybki start

<Tabs>
  <Tab title="Współdzielony dostawca oparty na zapleczu">
    <Steps>
      <Step title="Skonfiguruj uwierzytelnianie">
        Ustaw klucz API dla co najmniej jednego dostawcy — na przykład
        `GEMINI_API_KEY` lub `MINIMAX_API_KEY`.
      </Step>
      <Step title="Wybierz model domyślny (opcjonalnie)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Poproś agenta">
        _„Wygeneruj energetyczny utwór synthpop o nocnej przejażdżce przez
        neonowe miasto.”_

        Agent automatycznie wywoła `music_generate`. Nie trzeba
        dodawać narzędzia do listy dozwolonych.
      </Step>
    </Steps>

    W bezpośrednich synchronicznych kontekstach bez uruchomienia agenta
    opartego na sesji wbudowane narzędzie nadal przechodzi na generowanie
    inline i zwraca końcową ścieżkę do multimediów w wyniku narzędzia.

  </Tab>
  <Tab title="Przepływ pracy ComfyUI">
    <Steps>
      <Step title="Skonfiguruj przepływ pracy">
        Skonfiguruj `plugins.entries.comfy.config.music` za pomocą JSON
        przepływu pracy oraz węzłów promptu/wyjścia.
      </Step>
      <Step title="Uwierzytelnianie chmurowe (opcjonalnie)">
        W przypadku Comfy Cloud ustaw `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Wywołaj narzędzie">
        ```text
        /tool music_generate prompt="Ciepła ambientowa pętla syntezatorowa z miękką teksturą taśmową"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Przykładowe prompty:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Obsługiwani dostawcy

| Dostawca | Model domyślny         | Dane wejściowe referencyjne | Obsługiwane opcje sterowania                           | Uwierzytelnianie                        |
| -------- | ---------------------- | --------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ComfyUI  | `workflow`             | Do 1 obrazu                 | Muzyka lub audio zdefiniowane przez przepływ pracy     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Do 10 obrazów               | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Brak                        | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` lub MiniMax OAuth |

### Macierz funkcji

Jawny kontrakt trybu używany przez `music_generate`, testy kontraktowe i
współdzielony zestaw testów live:

| Dostawca | `generate` | `edit` | Limit edycji | Współdzielone ścieżki live                                               |
| -------- | :--------: | :----: | ------------ | ------------------------------------------------------------------------ |
| ComfyUI  |     ✓      |   ✓    | 1 obraz      | Nie wchodzi do współdzielonego zestawu; objęte przez `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 obrazów   | `generate`, `edit`                                                       |
| MiniMax  |     ✓      |   —    | Brak         | `generate`                                                               |

Użyj `action: "list"`, aby sprawdzić dostępnych współdzielonych dostawców i modele
w czasie działania:

```text
/tool music_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji:

```text
/tool music_generate action=status
```

Przykład bezpośredniego generowania:

```text
/tool music_generate prompt="Marzycielski lo-fi hip hop z teksturą winylu i delikatnym deszczem" instrumental=true
```

## Parametry narzędzia

<ParamField path="prompt" type="string" required>
  Prompt generowania muzyki. Wymagany dla `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` zwraca bieżące zadanie sesji; `"list"` sprawdza dostawców.
</ParamField>
<ParamField path="model" type="string">
  Zastąpienie dostawcy/modelu (np. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Opcjonalny tekst utworu, gdy dostawca obsługuje jawne wejście tekstu utworu.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Żądanie wyniku wyłącznie instrumentalnego, gdy dostawca to obsługuje.
</ParamField>
<ParamField path="image" type="string">
  Ścieżka lub URL pojedynczego obrazu referencyjnego.
</ParamField>
<ParamField path="images" type="string[]">
  Wiele obrazów referencyjnych (do 10 u dostawców, którzy to obsługują).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki dotyczące długości.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Wskazówka formatu wyjściowego, gdy dostawca ją obsługuje.
</ParamField>
<ParamField path="filename" type="string">Wskazówka nazwy pliku wyjściowego.</ParamField>
<ParamField path="timeoutMs" type="number">Opcjonalny limit czasu żądania do dostawcy w milisekundach.</ParamField>

<Note>
Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje
twarde limity, takie jak liczba danych wejściowych, przed wysłaniem żądania.
Gdy dostawca obsługuje czas trwania, ale używa krótszej wartości maksymalnej
niż żądana, OpenClaw ogranicza ją do najbliższego obsługiwanego czasu trwania.
Naprawdę nieobsługiwane opcjonalne wskazówki są ignorowane z ostrzeżeniem, gdy
wybrany dostawca lub model nie może ich zastosować. Wyniki narzędzia raportują
zastosowane ustawienia; `details.normalization` przechwytuje każde mapowanie
od wartości żądanej do zastosowanej.
</Note>

## Zachowanie asynchroniczne

Generowanie muzyki oparte na sesji działa jako zadanie w tle:

- **Zadanie w tle:** `music_generate` tworzy zadanie w tle, natychmiast zwraca
  odpowiedź started/task, a gotowy utwór publikuje później w kolejnej wiadomości
  agenta.
- **Zapobieganie duplikatom:** gdy zadanie ma stan `queued` lub `running`,
  późniejsze wywołania `music_generate` w tej samej sesji zwracają stan zadania
  zamiast rozpoczynać kolejne generowanie. Użyj `action: "status"`, aby jawnie
  to sprawdzić.
- **Sprawdzanie stanu:** `openclaw tasks list` lub `openclaw tasks show <taskId>`
  pozwala sprawdzić stan oczekujący, uruchomiony i końcowy.
- **Wybudzenie po zakończeniu:** OpenClaw wstrzykuje wewnętrzne zdarzenie
  zakończenia z powrotem do tej samej sesji, aby model mógł sam napisać
  wiadomość dla użytkownika.
- **Wskazówka w prompcie:** późniejsze tury użytkownika/ręczne w tej samej sesji
  otrzymują małą wskazówkę w czasie działania, gdy zadanie muzyczne jest już w toku,
  dzięki czemu model nie wywołuje ślepo ponownie `music_generate`.
- **Tryb zapasowy bez sesji:** bezpośrednie/lokalne konteksty bez rzeczywistej
  sesji agenta działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

| Stan        | Znaczenie                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Zadanie utworzone, oczekuje na przyjęcie przez dostawcę.                                      |
| `running`   | Dostawca przetwarza żądanie (zwykle od 30 sekund do 3 minut w zależności od dostawcy i czasu trwania). |
| `succeeded` | Utwór gotowy; agent budzi się i publikuje go w rozmowie.                                      |
| `failed`    | Błąd dostawcy lub przekroczenie limitu czasu; agent budzi się z informacjami o błędzie.      |

Sprawdź stan z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Konfiguracja

### Wybór modelu

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Kolejność wyboru dostawcy

OpenClaw próbuje dostawców w tej kolejności:

1. Parametr `model` z wywołania narzędzia (jeśli agent go określi).
2. `musicGenerationModel.primary` z konfiguracji.
3. `musicGenerationModel.fallbacks` po kolei.
4. Automatyczne wykrywanie z użyciem wyłącznie domyślnych dostawców opartych na uwierzytelnianiu:
   - najpierw bieżący dostawca domyślny;
   - pozostałych zarejestrowanych dostawców generowania muzyki według kolejności identyfikatorów dostawców.

Jeśli dostawca zakończy się błędem, automatycznie próbowany jest następny kandydat. Jeśli wszystkie
zawiodą, błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, aby używać tylko
jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi o dostawcach

<AccordionGroup>
  <Accordion title="ComfyUI">
    Oparte na przepływie pracy i zależne od skonfigurowanego grafu oraz mapowania
    węzłów dla pól promptu/wyjścia. Dołączony Plugin `comfy` podłącza się do
    współdzielonego narzędzia `music_generate` przez rejestr dostawców
    generowania muzyki.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Używa generowania wsadowego Lyria 3. Obecny dołączony przepływ obsługuje
    prompt, opcjonalny tekst utworu oraz opcjonalne obrazy referencyjne.
  </Accordion>
  <Accordion title="MiniMax">
    Używa wsadowego punktu końcowego `music_generation`. Obsługuje prompt,
    opcjonalny tekst utworu, tryb instrumentalny, sterowanie czasem trwania i
    wyjście mp3 przez uwierzytelnianie kluczem API `minimax` albo OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Wybór właściwej ścieżki

- **Współdzielony dostawca oparty na zapleczu**, gdy chcesz mieć wybór modelu,
  przełączanie awaryjne między dostawcami i wbudowany asynchroniczny przepływ
  zadania/stanu.
- **Ścieżka Pluginu (ComfyUI)**, gdy potrzebujesz niestandardowego grafu
  przepływu pracy lub dostawcy, który nie jest częścią współdzielonej
  dołączonej funkcji generowania muzyki.

Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz
[ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonego
dostawcy, zacznij od [Google (Gemini)](/pl/providers/google) lub
[MiniMax](/pl/providers/minimax).

## Tryby funkcji dostawcy

Współdzielony kontrakt generowania muzyki obsługuje jawne deklaracje trybów:

- `generate` dla generowania wyłącznie na podstawie promptu.
- `edit`, gdy żądanie zawiera jeden lub więcej obrazów referencyjnych.

Nowe implementacje dostawców powinny preferować jawne bloki trybów:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Starsze pola płaskie, takie jak `maxInputImages`, `supportsLyrics` i
`supportsFormat`, **nie** wystarczają do ogłoszenia obsługi trybu edit. Dostawcy
powinni jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktowe
i współdzielone narzędzie `music_generate` mogły deterministycznie walidować
obsługę trybów.

## Testy live

Obsługa live typu opt-in dla współdzielonych dołączonych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repozytorium:

```bash
pnpm test:live:media music
```

Ten plik live ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`,
domyślnie preferuje klucze API live/env zamiast zapisanych profili uwierzytelniania
i uruchamia pokrycie zarówno `generate`, jak i zadeklarowanego `edit`, gdy dostawca
włącza tryb edit. Obecny zakres pokrycia:

- `google`: `generate` oraz `edit`
- `minimax`: tylko `generate`
- `comfy`: osobne pokrycie live dla Comfy, nie współdzielony zestaw dostawców

Obsługa live typu opt-in dla dołączonej ścieżki muzycznej ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje również przepływy pracy obrazów i wideo comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — śledzenie zadań dla odłączonych uruchomień `music_generate`
- [ComfyUI](/pl/providers/comfy)
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `musicGenerationModel`
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) — konfiguracja modeli i przełączanie awaryjne
- [Przegląd narzędzi](/pl/tools)
