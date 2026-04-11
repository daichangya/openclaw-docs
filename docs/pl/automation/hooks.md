---
read_when:
    - Potrzebujesz automatyzacji opartej na zdarzeniach dla `/new`, `/reset`, `/stop` oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować haki
summary: 'Haki: automatyzacja oparta na zdarzeniach dla poleceń i zdarzeń cyklu życia'
title: Haki
x-i18n:
    generated_at: "2026-04-11T02:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14296398e4042d442ebdf071a07c6be99d4afda7cbf3c2b934e76dc5539742c7
    source_path: automation/hooks.md
    workflow: 15
---

# Haki

Haki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Są automatycznie wykrywane z katalogów i można je sprawdzać za pomocą `openclaw hooks`.

W OpenClaw są dwa rodzaje haków:

- **Haki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy wywoływane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wywoływać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Haki mogą być także dołączane w pluginach. `openclaw hooks list` pokazuje zarówno samodzielne haki, jak i haki zarządzane przez pluginy.

## Szybki start

```bash
# Wyświetl dostępne haki
openclaw hooks list

# Włącz hak
openclaw hooks enable session-memory

# Sprawdź status haka
openclaw hooks check

# Pobierz szczegółowe informacje
openclaw hooks info session-memory
```

## Typy zdarzeń

| Zdarzenie               | Kiedy jest wywoływane                          |
| ----------------------- | ---------------------------------------------- |
| `command:new`           | Wydano polecenie `/new`                        |
| `command:reset`         | Wydano polecenie `/reset`                      |
| `command:stop`          | Wydano polecenie `/stop`                       |
| `command`               | Dowolne zdarzenie polecenia (nasłuch ogólny)   |
| `session:compact:before` | Przed podsumowaniem historii przez kompaktację |
| `session:compact:after` | Po zakończeniu kompaktacji                     |
| `session:patch`         | Gdy właściwości sesji są modyfikowane          |
| `agent:bootstrap`       | Przed wstrzyknięciem plików bootstrap workspace |
| `gateway:startup`       | Po uruchomieniu kanałów i załadowaniu haków    |
| `message:received`      | Wiadomość przychodząca z dowolnego kanału      |
| `message:transcribed`   | Po zakończeniu transkrypcji audio              |
| `message:preprocessed`  | Po zakończeniu całego rozumienia mediów i linków |
| `message:sent`          | Dostarczono wiadomość wychodzącą               |

## Pisanie haków

### Struktura haka

Każdy hak to katalog zawierający dwa pliki:

```
my-hook/
├── HOOK.md          # Metadane + dokumentacja
└── handler.ts       # Implementacja handlera
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Krótki opis tego, co robi ten hak"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mój hak

Tutaj znajduje się szczegółowa dokumentacja.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                              |
| `events`   | Tablica zdarzeń do nasłuchiwania                     |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pomija sprawdzenia kwalifikowalności (boolean)       |
| `install`  | Metody instalacji                                    |

### Implementacja handlera

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj, aby wysłać do użytkownika), oraz `context` (dane specyficzne dla zdarzenia).

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla providera, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (końcowa wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia łatania sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wywoływać zdarzenia patch.

**Zdarzenia kompaktacji**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodatkowo zawiera `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Wykrywanie haków

Haki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisania:

1. **Haki wbudowane**: dostarczane z OpenClaw
2. **Haki pluginów**: haki dołączone do zainstalowanych pluginów
3. **Haki zarządzane**: `~/.openclaw/hooks/` (instalowane przez użytkownika, współdzielone między workspace'ami). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Haki workspace**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone do czasu ich jawnego włączenia)

Haki workspace mogą dodawać nowe nazwy haków, ale nie mogą nadpisywać haków wbudowanych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

### Pakiety haków

Pakiety haków to pakiety npm, które eksportują haki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm mogą pochodzić wyłącznie z rejestru (nazwa pakietu + opcjonalnie dokładna wersja lub dist-tag). Specyfikacje Git/URL/file i zakresy semver są odrzucane.

## Haki wbudowane

| Hak                   | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob   |
| command-logger        | `command`                      | Rejestruje wszystkie polecenia w `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md`, gdy startuje gateway             |

Włącz dowolny wbudowany hak:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku za pomocą LLM i zapisuje go do `<workspace>/memory/YYYY-MM-DD-slug.md`. Wymaga skonfigurowania `workspace.dir`.

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

Rejestruje każde polecenie ukośnikowe w `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace, gdy gateway startuje.

## Haki pluginów

Pluginy mogą rejestrować haki przez Plugin SDK w celu głębszej integracji: przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i nie tylko. Plugin SDK udostępnia 28 haków obejmujących rozwiązywanie modeli, cykl życia agenta, przepływ wiadomości, wykonywanie narzędzi, koordynację subagentów i cykl życia gateway.

Pełne odniesienie do haków pluginów, w tym `before_tool_call`, `before_agent_reply`, `before_install` i wszystkich pozostałych haków pluginów, znajdziesz w [Architektura pluginów](/pl/plugins/architecture#provider-runtime-hooks).

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

Zmienne środowiskowe dla poszczególnych haków:

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

Dodatkowe katalogi haków:

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany ze względu na zgodność wsteczną, ale nowe haki powinny korzystać z systemu opartego na wykrywaniu.
</Note>

## Dokumentacja CLI

```bash
# Wyświetl wszystkie haki (dodaj --eligible, --verbose lub --json)
openclaw hooks list

# Pokaż szczegółowe informacje o haku
openclaw hooks info <hook-name>

# Pokaż podsumowanie kwalifikowalności
openclaw hooks check

# Włącz/wyłącz
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Najlepsze praktyki

- **Handlery powinny być szybkie.** Haki działają podczas przetwarzania poleceń. Cięższe zadania uruchamiaj w trybie fire-and-forget za pomocą `void processInBackground(event)`.
- **Obsługuj błędy z rozwagą.** Opakuj ryzykowne operacje w try/catch; nie rzucaj wyjątków, aby inne handlery mogły działać dalej.
- **Filtruj zdarzenia wcześnie.** Natychmiast zwracaj, jeśli typ/akcja zdarzenia nie są istotne.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hak nie został wykryty

```bash
# Zweryfikuj strukturę katalogu
ls -la ~/.openclaw/hooks/my-hook/
# Powinno być widoczne: HOOK.md, handler.ts

# Wyświetl wszystkie wykryte haki
openclaw hooks list
```

### Hak nie jest kwalifikowalny

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące binaria (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hak się nie wykonuje

1. Sprawdź, czy hak jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby haki zostały przeładowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooks](/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Architektura pluginów](/pl/plugins/architecture#provider-runtime-hooks) — pełne odniesienie do haków pluginów
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
