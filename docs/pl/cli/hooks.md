---
read_when:
    - Chcesz zarządzać hookami agenta.
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki obszaru roboczego.
summary: Dokumentacja CLI dla `openclaw hooks` (hooki agenta)
title: Hooki
x-i18n:
    generated_at: "2026-04-25T13:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Zarządzaj hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` i uruchamianie Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooki](/pl/automation/hooks)
- Hooki Pluginów: [Hooki Pluginów](/pl/plugins/hooks)

## Wyświetlanie wszystkich hooków

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, managed, extra i bundled.
Uruchamianie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden hook wewnętrzny.

**Opcje:**

- `--eligible`: pokazuje tylko kwalifikujące się hooki (spełnione wymagania)
- `--json`: wypisuje jako JSON
- `-v, --verbose`: pokazuje szczegółowe informacje, w tym brakujące wymagania

**Przykładowe wyjście:**

```
Hooki (4/4 gotowe)

Gotowe:
  🚀 boot-md ✓ - Uruchom BOOT.md przy starcie Gateway
  📎 bootstrap-extra-files ✓ - Wstrzyknij dodatkowe pliki bootstrap workspace podczas bootstrapu agenta
  📝 command-logger ✓ - Loguj wszystkie zdarzenia poleceń do scentralizowanego pliku audytu
  💾 session-memory ✓ - Zapisz kontekst sesji do pamięci, gdy wydane zostanie polecenie /new lub /reset
```

**Przykład (verbose):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla niekwalifikujących się hooków.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca uporządkowany JSON do użytku programistycznego.

## Pobieranie informacji o hooku

```bash
openclaw hooks info <name>
```

Pokazuje szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: wypisuje jako JSON

**Przykład:**

```bash
openclaw hooks info session-memory
```

**Wyjście:**

```
💾 session-memory ✓ Gotowy

Zapisz kontekst sesji do pamięci, gdy wydane zostanie polecenie /new lub /reset

Szczegóły:
  Źródło: openclaw-bundled
  Ścieżka: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Strona główna: https://docs.openclaw.ai/automation/hooks#session-memory
  Zdarzenia: command:new, command:reset

Wymagania:
  Konfiguracja: ✓ workspace.dir
```

## Sprawdzanie kwalifikowalności hooków

```bash
openclaw hooks check
```

Pokazuje podsumowanie stanu kwalifikowalności hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: wypisuje jako JSON

**Przykładowe wyjście:**

```
Status hooków

Łącznie hooków: 4
Gotowe: 4
Niegotowe: 0
```

## Włączanie hooka

```bash
openclaw hooks enable <name>
```

Włącza określony hook przez dodanie go do konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną tu włączone albo w konfiguracji. Hooki zarządzane przez Pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać/wyłączać. Zamiast tego włącz/wyłącz Plugin.

**Argumenty:**

- `<name>`: nazwa hooka (np. `session-memory`)

**Przykład:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:**

```
✓ Włączono hook: 💾 session-memory
```

**Co to robi:**

- Sprawdza, czy hook istnieje i czy się kwalifikuje
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w konfiguracji
- Zapisuje konfigurację na dysk

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok wyraźnego włączenia jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie Gateway, aby hooki zostały przeładowane (restart aplikacji menu bar na macOS albo restart procesu gateway w środowisku dev).

## Wyłączanie hooka

```bash
openclaw hooks disable <name>
```

Wyłącza określony hook przez aktualizację konfiguracji.

**Argumenty:**

- `<name>`: nazwa hooka (np. `command-logger`)

**Przykład:**

```bash
openclaw hooks disable command-logger
```

**Wyjście:**

```
⏸ Wyłączono hook: 📝 command-logger
```

**Po wyłączeniu:**

- Uruchom ponownie Gateway, aby hooki zostały przeładowane

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują uporządkowany JSON bezpośrednio na stdout.
- Hooki zarządzane przez Pluginy nie mogą być tutaj włączane ani wyłączane; zamiast tego włącz lub wyłącz Plugin będący właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # najpierw ClawHub, potem npm
openclaw plugins install <package> --pin  # przypnij wersję
openclaw plugins install <path>           # ścieżka lokalna
```

Instaluje pakiety hooków przez ujednolicony instalator Pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins install`.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje
zależności są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez wersji i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże
którekolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o wyraźne wyrażenie zgody
przez tag prerelease, taki jak `@beta`/`@rc`, albo dokładną wersję prerelease.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: podlinkowuje lokalny katalog zamiast kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: zapisuje instalacje npm jako dokładnie rozwiązane `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Katalog lokalny
openclaw plugins install ./my-hook-pack

# Archiwum lokalne
openclaw plugins install ./my-hook-pack.zip

# Pakiet NPM
openclaw plugins install @openclaw/my-hook-pack

# Podlinkowanie lokalnego katalogu bez kopiowania
openclaw plugins install -l ./my-hook-pack
```

Podlinkowane pakiety hooków są traktowane jako hooki managed z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizowanie pakietów hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuje śledzone pakiety hooków oparte na npm przez ujednolicony aktualizator Pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins update`.

**Opcje:**

- `--all`: aktualizuje wszystkie śledzone pakiety hooków
- `--dry-run`: pokazuje, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia,
OpenClaw wypisuje ostrzeżenie i prosi o potwierdzenie przed kontynuacją. Użyj
globalnego `--yes`, aby ominąć prompty w uruchomieniach CI/nieinteraktywnych.

## Dołączone hooki

### session-memory

Zapisuje kontekst sesji do pamięci po wydaniu `/new` lub `/reset`.

**Włączanie:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Zobacz:** [dokumentacja session-memory](/pl/automation/hooks#session-memory)

### bootstrap-extra-files

Wstrzykuje dodatkowe pliki bootstrap (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

**Włączanie:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zobacz:** [dokumentacja bootstrap-extra-files](/pl/automation/hooks#bootstrap-extra-files)

### command-logger

Loguje wszystkie zdarzenia poleceń do scentralizowanego pliku audytu.

**Włączanie:**

```bash
openclaw hooks enable command-logger
```

**Wyjście:** `~/.openclaw/logs/commands.log`

**Wyświetlanie logów:**

```bash
# Ostatnie polecenia
tail -n 20 ~/.openclaw/logs/commands.log

# Ładne formatowanie
cat ~/.openclaw/logs/commands.log | jq .

# Filtrowanie po akcji
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md`, gdy Gateway się uruchamia (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włączanie**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Hooki automatyzacji](/pl/automation/hooks)
