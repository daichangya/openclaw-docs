---
read_when:
    - Chcesz automatyzacji sterowanej zdarzeniami dla `/new`, `/reset`, `/stop` oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-04-25T13:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

Hooki to małe skrypty uruchamiane, gdy coś wydarzy się wewnątrz Gateway. Mogą być wykrywane z katalogów i sprawdzane za pomocą `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków lub skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera albo dodatkowego katalogu hooków.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy występują zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wywoływać działania w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą też być dołączane do Pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez Pluginy.

## Szybki start

```bash
# Wyświetl dostępne hooki
openclaw hooks list

# Włącz hook
openclaw hooks enable session-memory

# Sprawdź status hooka
openclaw hooks check

# Pobierz szczegółowe informacje
openclaw hooks info session-memory
```

## Typy zdarzeń

| Zdarzenie                | Kiedy jest wywoływane                          |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | Wydanie polecenia `/new`                       |
| `command:reset`          | Wydanie polecenia `/reset`                     |
| `command:stop`           | Wydanie polecenia `/stop`                      |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)  |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction  |
| `session:compact:after`  | Po zakończeniu Compaction                      |
| `session:patch`          | Gdy właściwości sesji są modyfikowane          |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrap workspace |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków   |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału      |
| `message:transcribed`    | Po zakończeniu transkrypcji audio              |
| `message:preprocessed`   | Po zakończeniu analizy wszystkich mediów i linków |
| `message:sent`           | Dostarczenie wiadomości wychodzącej            |

## Tworzenie hooków

### Struktura hooka

Każdy hook to katalog zawierający dwa pliki:

```
my-hook/
├── HOOK.md          # Metadane + dokumentacja
└── handler.ts       # Implementacja handlera
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Krótki opis działania tego hooka"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mój hook

Tutaj znajduje się szczegółowa dokumentacja.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                              |
| `events`   | Tablica zdarzeń do nasłuchiwania                     |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane `bins`, `anyBins`, `env` lub ścieżki `config` |
| `always`   | Pomija sprawdzanie kwalifikowalności (boolean)       |
| `install`  | Metody instalacji                                    |

### Implementacja handlera

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] Wywołano polecenie New`);
  // Twoja logika tutaj

  // Opcjonalnie wyślij wiadomość do użytkownika
  event.messages.push("Hook wykonany!");
};

export default handler;
```

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj do niej, aby wysłać wiadomość do użytkownika) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków Pluginów agenta i narzędzi mogą także zawierać `trace`, tylko do odczytu, zgodny z W3C diagnostyczny kontekst śledzenia, który Pluginy mogą przekazywać do ustrukturyzowanych logów w celu korelacji OTEL.

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia patch sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wywoływać zdarzenia patch.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodatkowo zawiera `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Hooki dołączone**: dostarczane z OpenClaw
2. **Hooki Pluginów**: hooki dołączone do zainstalowanych Pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (instalowane przez użytkownika, współdzielone między workspace'ami). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki workspace**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki workspace mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków dołączonych, zarządzanych ani dostarczanych przez Pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych przy uruchamianiu, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz dołączony lub zarządzany hook za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Gdy włączysz jeden nazwany hook, Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm eksportujące hooki przez `openclaw.hooks` w `package.json`. Instalacja:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są ograniczone wyłącznie do rejestru (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Dołączone hooki

| Hook                  | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap ze wzorców glob  |
| command-logger        | `command`                      | Loguje wszystkie polecenia do `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md` podczas startu gateway            |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnich 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku przez LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md`. Wymaga skonfigurowania `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Konfiguracja bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Ścieżki są rozwiązywane względem workspace. Ładowane są tylko rozpoznawane nazwy bazowe plików bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Loguje każde polecenie z ukośnikiem do `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace przy starcie gateway.

## Hooki Pluginów

Pluginy mogą rejestrować typowane hooki przez SDK Pluginów, aby uzyskać głębszą integrację:
przechwytywanie wywołań narzędzi, modyfikowanie promptów, kontrolowanie przepływu wiadomości i nie tylko.
Używaj hooków Pluginów, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` lub innych hooków cyklu życia w procesie.

Pełne informacje o hookach Pluginów znajdziesz w [Hooki Pluginów](/pl/plugins/hooks).

## Konfiguracja

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Zmienne środowiskowe dla poszczególnych hooków:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Dodatkowe katalogi hooków:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zachowania kompatybilności wstecznej, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
</Note>

## Dokumentacja CLI

```bash
# Wyświetl wszystkie hooki (dodaj --eligible, --verbose lub --json)
openclaw hooks list

# Pokaż szczegółowe informacje o hooku
openclaw hooks info <hook-name>

# Pokaż podsumowanie kwalifikowalności
openclaw hooks check

# Włącz/wyłącz
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Dobre praktyki

- **Utrzymuj handlery szybkie.** Hooki działają podczas przetwarzania poleceń. Ciężką pracę uruchamiaj asynchronicznie bez oczekiwania przez `void processInBackground(event)`.
- **Obsługuj błędy bezpiecznie.** Opakowuj ryzykowne operacje w try/catch; nie rzucaj wyjątków, aby inne handlery mogły działać.
- **Filtruj zdarzenia wcześnie.** Natychmiast zwracaj wynik, jeśli typ/akcja zdarzenia nie jest istotny.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został wykryty

```bash
# Zweryfikuj strukturę katalogu
ls -la ~/.openclaw/hooks/my-hook/
# Powinno pokazać: HOOK.md, handler.ts

# Wyświetl wszystkie wykryte hooki
openclaw hooks list
```

### Hook nie spełnia warunków

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące binaria (PATH), zmienne środowiskowe, wartości konfiguracyjne lub zgodność z systemem operacyjnym.

### Hook się nie wykonuje

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały przeładowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooks](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Pluginów](/pl/plugins/hooks) — hooki cyklu życia Pluginów działające w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
