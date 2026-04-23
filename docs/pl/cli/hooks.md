---
read_when:
    - Chcesz zarządzać hookami agenta
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki obszaru roboczego
summary: Dokumentacja CLI dla `openclaw hooks` (hooki agenta)
title: hooki
x-i18n:
    generated_at: "2026-04-23T09:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Zarządzaj hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` i uruchamianie Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooki](/pl/automation/hooks)
- Hooki Pluginów: [Hooki Pluginów](/pl/plugins/architecture#provider-runtime-hooks)

## Wyświetlanie wszystkich hooków

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, managed, extra i bundled.
Uruchamianie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden hook wewnętrzny.

**Opcje:**

- `--eligible`: Pokaż tylko hooki kwalifikujące się (wymagania spełnione)
- `--json`: Zwróć jako JSON
- `-v, --verbose`: Pokaż szczegółowe informacje, w tym brakujące wymagania

**Przykładowy wynik:**

```
Hooki (4/4 gotowe)

Gotowe:
  🚀 boot-md ✓ - Uruchom BOOT.md przy starcie Gateway
  📎 bootstrap-extra-files ✓ - Wstrzyknij dodatkowe pliki bootstrapu workspace podczas bootstrapu agenta
  📝 command-logger ✓ - Rejestruj wszystkie zdarzenia poleceń w scentralizowanym pliku audytu
  💾 session-memory ✓ - Zapisz kontekst sesji do pamięci po wydaniu polecenia /new lub /reset
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

Zwraca uporządkowany JSON do użycia programistycznego.

## Pobieranie informacji o hooku

```bash
openclaw hooks info <name>
```

Pokazuje szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: Zwróć jako JSON

**Przykład:**

```bash
openclaw hooks info session-memory
```

**Wynik:**

```
💾 session-memory ✓ Gotowy

Zapisz kontekst sesji do pamięci po wydaniu polecenia /new lub /reset

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

Pokazuje podsumowanie statusu kwalifikowalności hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: Zwróć jako JSON

**Przykładowy wynik:**

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

Włącza konkretny hook przez dodanie go do konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną tutaj włączone albo skonfigurowane w konfiguracji. Hooki zarządzane przez Pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać/wyłączać. Zamiast tego włącz/wyłącz Plugin.

**Argumenty:**

- `<name>`: nazwa hooka (np. `session-memory`)

**Przykład:**

```bash
openclaw hooks enable session-memory
```

**Wynik:**

```
✓ Włączono hook: 💾 session-memory
```

**Co to robi:**

- Sprawdza, czy hook istnieje i czy się kwalifikuje
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok opt-in jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie gateway, aby hooki się przeładowały (restart aplikacji z paska menu na macOS albo restart procesu gateway w dev).

## Wyłączanie hooka

```bash
openclaw hooks disable <name>
```

Wyłącza konkretny hook przez aktualizację konfiguracji.

**Argumenty:**

- `<name>`: nazwa hooka (np. `command-logger`)

**Przykład:**

```bash
openclaw hooks disable command-logger
```

**Wynik:**

```
⏸ Wyłączono hook: 📝 command-logger
```

**Po wyłączeniu:**

- Uruchom ponownie gateway, aby hooki się przeładowały

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują uporządkowany JSON bezpośrednio do stdout.
- Hooków zarządzanych przez Pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz Plugin będący właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # najpierw ClawHub, potem npm
openclaw plugins install <package> --pin  # przypnij wersję
openclaw plugins install <path>           # ścieżka lokalna
```

Instaluj pakiety hooków przez zunifikowany instalator plugins.

`openclaw hooks install` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekierowuje do `openclaw plugins install`.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo
**dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje
zależności są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez wersji i `@latest` pozostają na ścieżce stabilnej. Jeśli npm rozwiąże
którekolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawny opt-in przez
tag prerelease taki jak `@beta`/`@rc` albo dokładną wersję prerelease.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Zapisuje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Podlinkuj lokalny katalog zamiast kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Zapisz instalacje npm jako dokładnie rozwiązane `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Katalog lokalny
openclaw plugins install ./my-hook-pack

# Archiwum lokalne
openclaw plugins install ./my-hook-pack.zip

# Pakiet NPM
openclaw plugins install @openclaw/my-hook-pack

# Podlinkuj lokalny katalog bez kopiowania
openclaw plugins install -l ./my-hook-pack
```

Podlinkowane pakiety hooków są traktowane jako hooki zarządzane z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizowanie pakietów hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez zunifikowany aktualizator plugins.

`openclaw hooks update` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekierowuje do `openclaw plugins update`.

**Opcje:**

- `--all`: Zaktualizuj wszystkie śledzone pakiety hooków
- `--dry-run`: Pokaż, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmieni,
OpenClaw wypisuje ostrzeżenie i prosi o potwierdzenie przed kontynuacją. Użyj
globalnego `--yes`, aby pominąć prompty w CI/uruchomieniach nieinteraktywnych.

## Dołączone hooki

### session-memory

Zapisuje kontekst sesji do pamięci po wydaniu `/new` lub `/reset`.

**Włącz:**

```bash
openclaw hooks enable session-memory
```

**Wynik:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Zobacz:** [dokumentacja session-memory](/pl/automation/hooks#session-memory)

### bootstrap-extra-files

Wstrzykuje dodatkowe pliki bootstrapu (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

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

**Wynik:** `~/.openclaw/logs/commands.log`

**Wyświetlanie logów:**

```bash
# Ostatnie polecenia
tail -n 20 ~/.openclaw/logs/commands.log

# Ładne formatowanie
cat ~/.openclaw/logs/commands.log | jq .

# Filtruj po akcji
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md`, gdy gateway się uruchamia (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włącz**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)
