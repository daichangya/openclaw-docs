---
read_when:
    - Chcesz zarządzać hookami agenta
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki workspace
summary: Dokumentacja CLI dla `openclaw hooks` (hooki agenta)
title: Hooki
x-i18n:
    generated_at: "2026-04-26T11:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Zarządzanie hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` i uruchamianie Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooks](/pl/automation/hooks)
- Hooki Plugin: [Plugin hooks](/pl/plugins/hooks)

## Wyświetlanie wszystkich hooków

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, managed, extra i bundled.
Uruchamianie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden hook wewnętrzny.

**Opcje:**

- `--eligible`: Pokaż tylko hooki kwalifikujące się (spełnione wymagania)
- `--json`: Wyjście jako JSON
- `-v, --verbose`: Pokaż szczegółowe informacje, w tym brakujące wymagania

**Przykładowe wyjście:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Przykład (verbose):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla hooków, które się nie kwalifikują.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca strukturalny JSON do użycia programistycznego.

## Pobieranie informacji o hooku

```bash
openclaw hooks info <name>
```

Pokazuje szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: nazwa hooka lub klucz hooka (na przykład `session-memory`)

**Opcje:**

- `--json`: Wyjście jako JSON

**Przykład:**

```bash
openclaw hooks info session-memory
```

**Wyjście:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Sprawdzanie kwalifikowalności hooków

```bash
openclaw hooks check
```

Pokazuje podsumowanie stanu kwalifikowalności hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: Wyjście jako JSON

**Przykładowe wyjście:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Włączanie hooka

```bash
openclaw hooks enable <name>
```

Włącza konkretny hook przez dodanie go do konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną tutaj włączone albo w konfiguracji. Hooki zarządzane przez Plugin pokazują `plugin:<id>` w `openclaw hooks list` i nie mogą być tutaj włączane/wyłączane. Zamiast tego włącz/wyłącz Plugin.

**Argumenty:**

- `<name>`: nazwa hooka (na przykład `session-memory`)

**Przykład:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:**

```
✓ Enabled hook: 💾 session-memory
```

**Co robi:**

- Sprawdza, czy hook istnieje i czy się kwalifikuje
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok opt-in jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie Gateway, aby przeładować hooki (restart aplikacji paska menu na macOS albo restart procesu gateway w środowisku deweloperskim).

## Wyłączanie hooka

```bash
openclaw hooks disable <name>
```

Wyłącza konkretny hook przez aktualizację konfiguracji.

**Argumenty:**

- `<name>`: nazwa hooka (na przykład `command-logger`)

**Przykład:**

```bash
openclaw hooks disable command-logger
```

**Wyjście:**

```
⏸ Disabled hook: 📝 command-logger
```

**Po wyłączeniu:**

- Uruchom ponownie Gateway, aby przeładować hooki

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują strukturalny JSON bezpośrednio na stdout.
- Hooki zarządzane przez Plugin nie mogą być tutaj włączane ani wyłączane; zamiast tego włącz lub wyłącz Plugin będący ich właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instaluje pakiety hooków przez ujednolicony instalator plugins.

`openclaw hooks install` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins install`.

Specyfikacje npm są **tylko dla rejestru** (nazwa pakietu + opcjonalnie **dokładna wersja** albo
**dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje
zależności są uruchamiane lokalnie dla projektu z `--ignore-scripts` dla bezpieczeństwa, nawet
jeśli Twoja powłoka ma globalne ustawienia instalacji npm.

Specyfikacje bez wersji i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże
którykolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody przez
tag prerelease, taki jak `@beta`/`@rc`, albo dokładną wersję prerelease.

**Co robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Podlinkuj lokalny katalog zamiast go kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Zapisuje instalacje npm jako dokładnie rozwiązane `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Lokalny katalog
openclaw plugins install ./my-hook-pack

# Lokalne archiwum
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

Aktualizuje śledzone pakiety hooków oparte na npm przez ujednolicony aktualizator plugins.

`openclaw hooks update` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins update`.

**Opcje:**

- `--all`: Aktualizuje wszystkie śledzone pakiety hooków
- `--dry-run`: Pokazuje, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmienia,
OpenClaw wypisuje ostrzeżenie i prosi o potwierdzenie przed kontynuacją. Użyj
globalnego `--yes`, aby pominąć pytania w uruchomieniach CI/nieinteraktywnych.

## Bundled Hooks

### session-memory

Zapisuje kontekst sesji do pamięci, gdy wydajesz `/new` lub `/reset`.

**Włącz:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Zobacz:** [dokumentacja session-memory](/pl/automation/hooks#session-memory)

### bootstrap-extra-files

Wstrzykuje dodatkowe pliki bootstrap (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

**Włącz:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zobacz:** [dokumentacja bootstrap-extra-files](/pl/automation/hooks#bootstrap-extra-files)

### command-logger

Rejestruje wszystkie zdarzenia poleceń w scentralizowanym pliku audytu.

**Włącz:**

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

# Filtrowanie według działania
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md` przy starcie Gateway (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włącz**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Hooki automatyzacji](/pl/automation/hooks)
