---
read_when:
    - Generowanie muzyki lub audio za pomocą agenta
    - Konfigurowanie dostawców i modeli generowania muzyki
    - Zrozumienie parametrów narzędzia music_generate
summary: Generowanie muzyki za pomocą współdzielonych dostawców, w tym Pluginów opartych na workflow
title: Generowanie muzyki
x-i18n:
    generated_at: "2026-04-25T14:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

Narzędzie `music_generate` pozwala agentowi tworzyć muzykę lub audio przez
współdzieloną możliwość generowania muzyki z użyciem skonfigurowanych dostawców, takich jak Google,
MiniMax i skonfigurowane przez workflow ComfyUI.

W sesjach agenta opartych na współdzielonych dostawcach OpenClaw uruchamia generowanie muzyki jako
zadanie w tle, śledzi je w rejestrze zadań, a następnie ponownie wybudza agenta, gdy
utwór jest gotowy, aby agent mógł opublikować gotowe audio z powrotem w
oryginalnym kanale.

<Note>
Wbudowane współdzielone narzędzie pojawia się tylko wtedy, gdy dostępny jest co najmniej jeden dostawca generowania muzyki. Jeśli nie widzisz `music_generate` w narzędziach swojego agenta, skonfiguruj `agents.defaults.musicGenerationModel` albo ustaw klucz API dostawcy.
</Note>

## Szybki start

### Generowanie oparte na współdzielonym dostawcy

1. Ustaw klucz API dla co najmniej jednego dostawcy, na przykład `GEMINI_API_KEY` lub
   `MINIMAX_API_KEY`.
2. Opcjonalnie ustaw preferowany model:

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

3. Poproś agenta: _„Wygeneruj pogodny synthpopowy utwór o nocnej przejażdżce
   przez neonowe miasto.”_

Agent wywoła `music_generate` automatycznie. Nie jest potrzebna allowlista narzędzi.

W bezpośrednich synchronicznych kontekstach bez uruchomienia agenta opartego na sesji wbudowane
narzędzie nadal przechodzi awaryjnie do generowania inline i zwraca końcową ścieżkę multimediów w
wyniku narzędzia.

Przykładowe prompty:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generowanie Comfy sterowane przez workflow

Wbudowany Plugin `comfy` podłącza się do współdzielonego narzędzia `music_generate` przez
rejestr dostawców generowania muzyki.

1. Skonfiguruj `plugins.entries.comfy.config.music` z JSON-em workflow i
   węzłami promptu/wyjścia.
2. Jeśli używasz Comfy Cloud, ustaw `COMFY_API_KEY` lub `COMFY_CLOUD_API_KEY`.
3. Poproś agenta o muzykę albo wywołaj narzędzie bezpośrednio.

Przykład:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Obsługa współdzielonych wbudowanych dostawców

| Dostawca | Model domyślny        | Wejścia referencyjne | Obsługiwane kontrolki                                      | Klucz API                               |
| -------- | ---------------------- | -------------------- | ---------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`             | Do 1 obrazu          | Muzyka lub audio zdefiniowane przez workflow               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Do 10 obrazów        | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Brak                 | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Zadeklarowana macierz możliwości

To jawny kontrakt trybów używany przez `music_generate`, testy kontraktowe
i współdzielony zestaw live.

| Dostawca | `generate` | `edit` | Limit edycji | Współdzielone przebiegi live                                              |
| -------- | ---------- | ------ | ------------ | ------------------------------------------------------------------------- |
| ComfyUI  | Tak        | Tak    | 1 obraz      | Nie w zestawie współdzielonym; objęte przez `extensions/comfy/comfy.live.test.ts` |
| Google   | Tak        | Tak    | 10 obrazów   | `generate`, `edit`                                                        |
| MiniMax  | Tak        | Nie    | Brak         | `generate`                                                                |

Użyj `action: "list"`, aby sprawdzić dostępnych współdzielonych dostawców i modele w
runtime:

```text
/tool music_generate action=list
```

Użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji:

```text
/tool music_generate action=status
```

Przykład bezpośredniego generowania:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametry wbudowanego narzędzia

| Parametr         | Typ      | Opis                                                                                           |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `prompt`         | string   | Prompt generowania muzyki (wymagany dla `action: "generate"`)                                  |
| `action`         | string   | `"generate"` (domyślnie), `"status"` dla bieżącego zadania sesji albo `"list"` do sprawdzenia dostawców |
| `model`          | string   | Nadpisanie dostawcy/modelu, np. `google/lyria-3-pro-preview` lub `comfy/workflow`             |
| `lyrics`         | string   | Opcjonalny tekst utworu, gdy dostawca obsługuje jawne wejście tekstu piosenki                  |
| `instrumental`   | boolean  | Żądanie wyjścia instrumentalnego, gdy dostawca to obsługuje                                    |
| `image`          | string   | Ścieżka lub URL pojedynczego obrazu referencyjnego                                             |
| `images`         | string[] | Wiele obrazów referencyjnych (do 10)                                                           |
| `durationSeconds`| number   | Docelowy czas trwania w sekundach, gdy dostawca obsługuje wskazówki czasu trwania              |
| `timeoutMs`      | number   | Opcjonalny timeout żądania do dostawcy w milisekundach                                         |
| `format`         | string   | Wskazówka formatu wyjściowego (`mp3` lub `wav`), gdy dostawca to obsługuje                     |
| `filename`       | string   | Wskazówka nazwy pliku wyjściowego                                                              |

Nie wszyscy dostawcy obsługują wszystkie parametry. OpenClaw nadal waliduje twarde limity,
takie jak liczba wejść, przed wysłaniem. Gdy dostawca obsługuje czas trwania, ale
używa krótszego maksimum niż żądana wartość, OpenClaw automatycznie ogranicza go
do najbliższego obsługiwanego czasu trwania. Naprawdę nieobsługiwane opcjonalne wskazówki są ignorowane
z ostrzeżeniem, gdy wybrany dostawca lub model nie może ich zrealizować.

Wyniki narzędzia raportują zastosowane ustawienia. Gdy OpenClaw ogranicza czas trwania podczas fallbacku dostawcy, zwracane `durationSeconds` odzwierciedla wysłaną wartość, a `details.normalization.durationSeconds` pokazuje mapowanie wartości żądanej na zastosowaną.

## Zachowanie asynchroniczne dla ścieżki opartej na współdzielonym dostawcy

- Uruchomienia agenta oparte na sesji: `music_generate` tworzy zadanie w tle, natychmiast zwraca odpowiedź started/task i publikuje gotowy utwór później w kolejnej wiadomości agenta.
- Zapobieganie duplikatom: dopóki to zadanie w tle ma status `queued` lub `running`, późniejsze wywołania `music_generate` w tej samej sesji zwracają status zadania zamiast uruchamiać kolejne generowanie.
- Sprawdzanie statusu: użyj `action: "status"`, aby sprawdzić aktywne zadanie muzyczne oparte na sesji bez uruchamiania nowego.
- Śledzenie zadań: użyj `openclaw tasks list` albo `openclaw tasks show <taskId>`, aby sprawdzić status kolejkowany, uruchomiony i końcowy generowania.
- Wybudzenie po zakończeniu: OpenClaw wstrzykuje wewnętrzne zdarzenie zakończenia z powrotem do tej samej sesji, aby model mógł sam napisać wiadomość uzupełniającą dla użytkownika.
- Wskazówka do promptu: późniejsze tury użytkownika/ręczne w tej samej sesji dostają małą wskazówkę runtime, gdy zadanie muzyczne jest już w toku, aby model nie wywoływał w ciemno `music_generate` ponownie.
- Fallback bez sesji: bezpośrednie/lokalne konteksty bez prawdziwej sesji agenta nadal działają inline i zwracają końcowy wynik audio w tej samej turze.

### Cykl życia zadania

Każde żądanie `music_generate` przechodzi przez cztery stany:

1. **queued** -- zadanie utworzone, czeka na zaakceptowanie przez dostawcę.
2. **running** -- dostawca przetwarza (zwykle od 30 sekund do 3 minut w zależności od dostawcy i czasu trwania).
3. **succeeded** -- utwór gotowy; agent budzi się i publikuje go w rozmowie.
4. **failed** -- błąd dostawcy lub timeout; agent budzi się ze szczegółami błędu.

Sprawdź status z CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Zapobieganie duplikatom: jeśli zadanie muzyczne ma już status `queued` lub `running` dla bieżącej sesji, `music_generate` zwraca status istniejącego zadania zamiast uruchamiać nowe. Użyj `action: "status"`, aby sprawdzić to jawnie bez wyzwalania nowego generowania.

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

Podczas generowania muzyki OpenClaw próbuje dostawców w tej kolejności:

1. Parametr `model` z wywołania narzędzia, jeśli agent go poda
2. `musicGenerationModel.primary` z konfiguracji
3. `musicGenerationModel.fallbacks` po kolei
4. Automatyczne wykrywanie z użyciem tylko domyślnych dostawców opartych na auth:
   - najpierw bieżący dostawca domyślny
   - potem pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców

Jeśli dostawca zawiedzie, następny kandydat jest próbowany automatycznie. Jeśli zawiodą wszyscy,
błąd zawiera szczegóły każdej próby.

Ustaw `agents.defaults.mediaGenerationAutoProviderFallback: false`, jeśli chcesz,
aby generowanie muzyki używało tylko jawnych wpisów `model`, `primary` i `fallbacks`.

## Uwagi dotyczące dostawców

- Google używa wsadowego generowania Lyria 3. Bieżący wbudowany przepływ obsługuje
  prompt, opcjonalny tekst piosenki i opcjonalne obrazy referencyjne.
- MiniMax używa wsadowego endpointu `music_generation`. Bieżący wbudowany przepływ
  obsługuje prompt, opcjonalny tekst piosenki, tryb instrumentalny, sterowanie czasem trwania i
  wyjście mp3.
- Obsługa ComfyUI jest sterowana przez workflow i zależy od skonfigurowanego grafu oraz
  mapowania węzłów dla pól promptu/wyjścia.

## Tryby możliwości dostawcy

Współdzielony kontrakt generowania muzyki obsługuje teraz jawne deklaracje trybów:

- `generate` dla generowania tylko z promptu
- `edit`, gdy żądanie zawiera jeden lub więcej obrazów referencyjnych

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

Starsze płaskie pola, takie jak `maxInputImages`, `supportsLyrics` i
`supportsFormat`, nie wystarczają do ogłaszania obsługi edycji. Dostawcy powinni
jawnie deklarować `generate` i `edit`, aby testy live, testy kontraktowe oraz
współdzielone narzędzie `music_generate` mogły deterministycznie walidować obsługę trybów.

## Wybór właściwej ścieżki

- Używaj ścieżki opartej na współdzielonym dostawcy, gdy chcesz wybór modelu, failover dostawcy i wbudowany asynchroniczny przepływ zadań/statusu.
- Używaj ścieżki Pluginu, takiej jak ComfyUI, gdy potrzebujesz niestandardowego grafu workflow albo dostawcy, który nie jest częścią współdzielonej wbudowanej możliwości generowania muzyki.
- Jeśli debugujesz zachowanie specyficzne dla ComfyUI, zobacz [ComfyUI](/pl/providers/comfy). Jeśli debugujesz zachowanie współdzielonego dostawcy, zacznij od [Google (Gemini)](/pl/providers/google) albo [MiniMax](/pl/providers/minimax).

## Testy live

Pokrycie live opt-in dla współdzielonych wbudowanych dostawców:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Otoczka repo:

```bash
pnpm test:live:media music
```

Ten plik live ładuje brakujące zmienne env dostawców z `~/.profile`, domyślnie preferuje
klucze API live/env przed zapisanymi profilami auth i uruchamia zarówno
pokrycie `generate`, jak i zadeklarowane `edit`, gdy dostawca włącza tryb edycji.

Obecnie oznacza to:

- `google`: `generate` plus `edit`
- `minimax`: tylko `generate`
- `comfy`: osobne pokrycie live Comfy, nie współdzielony zestaw dostawców

Pokrycie live opt-in dla wbudowanej ścieżki muzyki ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Plik live Comfy obejmuje także workflow obrazów i wideo Comfy, gdy te
sekcje są skonfigurowane.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) - śledzenie zadań dla odłączonych uruchomień `music_generate`
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) - konfiguracja `musicGenerationModel`
- [ComfyUI](/pl/providers/comfy)
- [Google (Gemini)](/pl/providers/google)
- [MiniMax](/pl/providers/minimax)
- [Modele](/pl/concepts/models) - konfiguracja modeli i failover
- [Przegląd narzędzi](/pl/tools)
