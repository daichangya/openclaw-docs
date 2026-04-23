---
read_when:
    - Musisz sprawdzić surowe wyjście modelu pod kątem wycieku rozumowania
    - Chcesz uruchomić Gateway w trybie watch podczas iteracji
    - Potrzebujesz powtarzalnego przepływu debugowania
summary: 'Narzędzia debugowania: tryb watch, surowe strumienie modelu i śledzenie wycieku rozumowania'
title: Debugowanie
x-i18n:
    generated_at: "2026-04-23T10:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Debugowanie

Ta strona opisuje helpery debugowania dla wyjścia strumieniowego, zwłaszcza gdy
provider miesza rozumowanie ze zwykłym tekstem.

## Nadpisania debugowania w runtime

Użyj `/debug` na czacie, aby ustawić nadpisania konfiguracji **tylko w runtime** (w pamięci, nie na dysku).
`/debug` jest domyślnie wyłączone; włącz je przez `commands.debug: true`.
To przydaje się, gdy musisz przełączyć rzadko używane ustawienia bez edytowania `openclaw.json`.

Przykłady:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` czyści wszystkie nadpisania i przywraca konfigurację z dysku.

## Wyjście śledzenia sesji

Użyj `/trace`, gdy chcesz zobaczyć należące do Pluginu linie trace/debug w jednej sesji
bez włączania pełnego trybu verbose.

Przykłady:

```text
/trace
/trace on
/trace off
```

Używaj `/trace` do diagnostyki Pluginów, takiej jak podsumowania debugowe Active Memory.
Nadal używaj `/verbose` do zwykłego verbose outputu statusu/narzędzi i nadal używaj
`/debug` do nadpisań konfiguracji tylko w runtime.

## Tymczasowe czasy debugowania CLI

OpenClaw zachowuje `src/cli/debug-timing.ts` jako małego helpera do lokalnego
badania. Celowo nie jest on domyślnie podłączony do uruchamiania CLI, routingu poleceń
ani żadnego polecenia. Używaj go tylko podczas debugowania wolnego polecenia, a potem
usuń import i przedziały czasowe przed wdrożeniem zmiany zachowania.

Użyj tego, gdy polecenie jest wolne i potrzebujesz szybkiego rozbicia na fazy, zanim
zdecydujesz, czy użyć profilera CPU, czy naprawić konkretny subsystem.

### Dodawanie tymczasowych przedziałów czasowych

Dodaj helper blisko kodu, który analizujesz. Na przykład podczas debugowania
`openclaw models list` tymczasowa poprawka w
`src/commands/models/list.list-command.ts` może wyglądać tak:

```ts
// Tylko do tymczasowego debugowania. Usuń przed wdrożeniem.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Wytyczne:

- Poprzedzaj tymczasowe nazwy faz prefiksem `debug:`.
- Dodawaj tylko kilka przedziałów czasowych wokół podejrzanych wolnych sekcji.
- Preferuj szerokie fazy, takie jak `registry`, `auth_store` lub `rows`, zamiast
  nazw helperów.
- Używaj `time()` dla pracy synchronicznej i `timeAsync()` dla promise’ów.
- Utrzymuj stdout w czystości. Helper zapisuje do stderr, więc wyjście JSON polecenia pozostaje możliwe do sparsowania.
- Usuń tymczasowe importy i przedziały czasowe przed otwarciem końcowego PR z poprawką.
- Dołącz wynik pomiarów czasu lub krótkie podsumowanie do issue albo PR, który wyjaśnia optymalizację.

### Uruchamianie z czytelnym wyjściem

Tryb czytelny jest najlepszy do debugowania na żywo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Przykładowe wyjście z tymczasowego badania `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Wnioski z tego wyjścia:

| Faza                                     |       Czas | Co to oznacza                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Ładowanie magazynu profili auth jest największym kosztem i powinno być badane jako pierwsze.           |
| `debug:models:list:ensure_models_json`   |       5.0s | Synchronizacja `models.json` jest na tyle kosztowna, że warto sprawdzić cache lub warunki pomijania.   |
| `debug:models:list:load_model_registry`  |       5.9s | Konstruowanie rejestru i sprawdzanie dostępności providerów to również istotne koszty.                 |
| `debug:models:list:read_registry_models` |       2.4s | Odczyt wszystkich modeli z rejestru nie jest darmowy i może mieć znaczenie dla `--all`.                |
| fazy dołączania wierszy                  | 3.2s łącznie | Zbudowanie pięciu wyświetlanych wierszy nadal zajmuje kilka sekund, więc ścieżka filtrowania zasługuje na dokładniejsze sprawdzenie. |
| `debug:models:list:print_model_table`    |        0ms | Renderowanie nie jest wąskim gardłem.                                                                   |

Te wnioski wystarczą, by pokierować kolejną poprawką bez pozostawiania kodu pomiarowego
na ścieżkach produkcyjnych.

### Uruchamianie z wyjściem JSON

Użyj trybu JSON, gdy chcesz zapisać lub porównać dane pomiaru czasu:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Każda linia stderr to jeden obiekt JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Czyszczenie przed wdrożeniem

Przed otwarciem końcowego PR:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

To polecenie nie powinno zwracać żadnych tymczasowych miejsc wywołania instrumentacji, chyba że PR
jawnie dodaje stałą powierzchnię diagnostyczną. Dla zwykłych poprawek wydajności
zachowaj tylko zmianę zachowania, testy i krótką notatkę z dowodami pomiaru czasu.

W przypadku głębszych hotspotów CPU użyj profilowania Node (`--cpu-prof`) albo zewnętrznego
profilera zamiast dodawania kolejnych wrapperów pomiarowych.

## Tryb watch Gateway

Aby szybko iterować, uruchom gateway pod watcherem plików:

```bash
pnpm gateway:watch
```

Mapuje się to na:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher restartuje się przy zmianach plików istotnych dla builda w `src/`, plikach źródłowych extensions,
metadanych `package.json` i `openclaw.plugin.json` extensions, `tsconfig.json`,
`package.json` i `tsdown.config.ts`. Zmiany metadanych extension restartują
gateway bez wymuszania przebudowy `tsdown`; zmiany źródeł i konfiguracji nadal najpierw przebudowują `dist`.

Dodaj dowolne flagi Gateway CLI po `gateway:watch`, a będą przekazywane przy
każdym restarcie. Ponowne uruchomienie tego samego polecenia watch dla tego samego
repo/tego samego zestawu flag zastępuje teraz starszy watcher zamiast pozostawiać duplikaty procesów nadrzędnych.

## Profil dev + gateway dev (`--dev`)

Użyj profilu dev, aby odizolować stan i uruchomić bezpieczną, jednorazową konfigurację do
debugowania. Istnieją **dwie** flagi `--dev`:

- **Globalne `--dev` (profil):** izoluje stan w `~/.openclaw-dev` i
  domyślnie ustawia port gateway na `19001` (porty pochodne też się przesuwają).
- **`gateway --dev`:** mówi Gateway, aby automatycznie utworzył domyślną konfigurację +
  workspace, gdy ich brakuje (i pominął `BOOTSTRAP.md`).

Zalecany przepływ (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jeśli nie masz jeszcze instalacji globalnej, uruchamiaj CLI przez `pnpm openclaw ...`.

Co to robi:

1. **Izolacja profilu** (globalne `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (porty browser/canvas przesuwają się odpowiednio)

2. **Bootstrap dev** (`gateway --dev`)
   - Zapisuje minimalną konfigurację, jeśli jej brakuje (`gateway.mode=local`, bind do loopback).
   - Ustawia `agent.workspace` na workspace dev.
   - Ustawia `agent.skipBootstrap=true` (bez `BOOTSTRAP.md`).
   - Inicjalizuje pliki workspace, jeśli ich brakuje:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Domyślna tożsamość: **C3‑PO** (droid protokolarny).
   - Pomija providery kanałów w trybie dev (`OPENCLAW_SKIP_CHANNELS=1`).

Przepływ resetu (świeży start):

```bash
pnpm gateway:dev:reset
```

Uwaga: `--dev` to **globalna** flaga profilu i bywa przechwytywana przez niektóre runnery.
Jeśli musisz podać ją jawnie, użyj formy zmiennej środowiskowej:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` czyści konfigurację, poświadczenia, sesje i workspace dev (przy użyciu
`trash`, a nie `rm`), a następnie odtwarza domyślną konfigurację dev.

Wskazówka: jeśli działa już gateway poza trybem dev (launchd/systemd), najpierw go zatrzymaj:

```bash
openclaw gateway stop
```

## Logowanie surowego strumienia (OpenClaw)

OpenClaw może logować **surowy strumień asystenta** przed jakimkolwiek filtrowaniem/formatowaniem.
To najlepszy sposób, by sprawdzić, czy rozumowanie przychodzi jako zwykłe delty tekstowe
(lub jako osobne bloki myślenia).

Włącz przez CLI:

```bash
pnpm gateway:watch --raw-stream
```

Opcjonalne nadpisanie ścieżki:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Równoważne zmienne środowiskowe:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Plik domyślny:

`~/.openclaw/logs/raw-stream.jsonl`

## Logowanie surowych chunków (pi-mono)

Aby przechwycić **surowe chunki zgodne z OpenAI** zanim zostaną sparsowane do bloków,
pi-mono udostępnia osobny logger:

```bash
PI_RAW_STREAM=1
```

Opcjonalna ścieżka:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Plik domyślny:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Uwaga: jest to emitowane tylko przez procesy używające providera
> `openai-completions` z pi-mono.

## Uwagi dotyczące bezpieczeństwa

- Logi surowego strumienia mogą zawierać pełne prompty, wyjście narzędzi i dane użytkownika.
- Przechowuj logi lokalnie i usuwaj je po zakończeniu debugowania.
- Jeśli udostępniasz logi, najpierw usuń z nich sekrety i dane osobowe.
