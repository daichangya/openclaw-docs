---
read_when:
    - Konfigurowanie integracji z IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gatewaya
summary: Uruchom most ACP dla integracji z IDE
title: acp
x-i18n:
    generated_at: "2026-04-23T09:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Uruchom most [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z Gatewayem OpenClaw.

Ta komenda obsługuje ACP przez stdio dla IDE i przekazuje prompty do Gatewaya
przez WebSocket. Utrzymuje sesje ACP odwzorowane na klucze sesji Gatewaya.

`openclaw acp` to oparty na Gatewayu most ACP, a nie pełne natywne dla ACP
środowisko uruchomieniowe edytora. Skupia się na routingu sesji, dostarczaniu
promptów i podstawowych aktualizacjach strumieniowych.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałów OpenClaw zamiast hostować sesję harness ACP, użyj zamiast
tego [`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami harness ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gatewaya

To różni się od [ACP Agents](/pl/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzny harness, taki jak Codex lub Claude Code, przez `acpx`.

Szybka zasada:

- edytor/klient chce mówić ACP z OpenClaw: użyj `openclaw acp`
- OpenClaw ma uruchomić Codex/Claude/Gemini jako harness ACP: użyj `/acp spawn` i [ACP Agents](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status      | Uwagi                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowane | Podstawowy przepływ mostu przez stdio do Gateway chat/send + abort.                                                                                                                                                                                 |
| `listSessions`, komendy slash                                         | Zaimplementowane | Lista sesji działa na stanie sesji Gatewaya; komendy są ogłaszane przez `available_commands_update`.                                                                                                                                                |
| `loadSession`                                                         | Częściowe   | Ponownie wiąże sesję ACP z kluczem sesji Gatewaya i odtwarza przechowywaną historię tekstową użytkownika/asystenta. Historia narzędzi/systemu nie jest jeszcze rekonstruowana.                                                                   |
| Treść promptu (`text`, osadzony `resource`, obrazy)                   | Częściowe   | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gatewaya.                                                                                                                                                              |
| Tryby sesji                                                           | Częściowe   | `session/set_mode` jest obsługiwane, a most udostępnia początkowe kontrolki sesji oparte na Gatewayu dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółowości użycia i działań uprzywilejowanych. Szersze natywne dla ACP powierzchnie trybu/konfiguracji nadal są poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe   | Most emituje powiadomienia `session_info_update` i best-effort `usage_update` z cache’owanych snapshotów sesji Gatewaya. Użycie jest przybliżone i wysyłane tylko wtedy, gdy sumy tokenów Gatewaya są oznaczone jako świeże.                    |
| Strumieniowanie narzędzi                                              | Częściowe   | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, treść tekstową i best-effort lokalizacje plików, gdy argumenty/wyniki narzędzi Gatewaya je ujawniają. Osadzone terminale i bogatsze natywne dla diff wyjście nadal nie są udostępniane. |
| MCP servers per session (`mcpServers`)                                | Nieobsługiwane | Tryb mostu odrzuca żądania MCP servers per session. Zamiast tego skonfiguruj MCP na gatewayu OpenClaw lub agencie.                                                                                                                                |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                                 |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane | Most nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                    |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane | Most obecnie emituje tekst wyjściowy i status narzędzi, a nie aktualizacje planu ACP lub myśli.                                                                                                                                                   |

## Znane ograniczenia

- `loadSession` odtwarza przechowywaną historię tekstową użytkownika i
  asystenta, ale nie rekonstruuje historycznych wywołań narzędzi, komunikatów
  systemowych ani bogatszych typów zdarzeń natywnych dla ACP.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gatewaya, routing
  zdarzeń i anulowania działa best-effort zamiast być ściśle izolowany per
  klient. Gdy potrzebujesz czystych lokalnych dla edytora tur, preferuj
  domyślne izolowane sesje `acp:<uuid>`.
- Stany zatrzymania Gatewaya są tłumaczone na powody zatrzymania ACP, ale to
  mapowanie jest mniej ekspresyjne niż w pełni natywne dla ACP środowisko
  uruchomieniowe.
- Początkowe kontrolki sesji udostępniają obecnie wybrany podzbiór ustawień
  Gatewaya: poziom myślenia, szczegółowość narzędzi, rozumowanie,
  szczegółowość użycia i działania uprzywilejowane. Wybór modelu i kontrolki
  hosta wykonawczego nie są jeszcze udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane ze snapshotów sesji
  Gatewaya, a nie z żywego, natywnego dla ACP rozliczania środowiska
  uruchomieniowego. Użycie jest przybliżone, nie zawiera danych o kosztach i
  jest emitowane tylko wtedy, gdy Gateway oznaczy łączne dane tokenów jako
  świeże.
- Dane obserwacji narzędzi są best-effort. Most może ujawniać ścieżki plików,
  które pojawiają się w znanych argumentach/wynikach narzędzi, ale nie emituje
  jeszcze terminali ACP ani ustrukturyzowanych diffów plików.

## Użycie

```bash
openclaw acp

# Zdalny Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Zdalny Gateway (token z pliku)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Podłączenie do istniejącego klucza sesji
openclaw acp --session agent:main:main

# Podłączenie według etykiety (musi już istnieć)
openclaw acp --session-label "support inbox"

# Reset klucza sesji przed pierwszym promptem
openclaw acp --session agent:main:main --reset-session
```

## Klient ACP (debugowanie)

Użyj wbudowanego klienta ACP, aby sprawdzić poprawność mostu bez IDE.
Uruchamia most ACP i pozwala interaktywnie wpisywać prompty.

```bash
openclaw acp client

# Skierowanie uruchomionego mostu do zdalnego Gatewaya
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Nadpisanie komendy serwera (domyślnie: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Automatyczne zatwierdzanie jest oparte na liście dozwolonych i dotyczy tylko zaufanych identyfikatorów podstawowych narzędzi.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, jeśli ustawiono).
- ACP automatycznie zatwierdza tylko wąskie klasy tylko do odczytu: ograniczone wywołania `read` pod aktywnym cwd oraz narzędzia wyszukiwania tylko do odczytu (`search`, `web_search`, `memory_search`). Nieznane/niepodstawowe narzędzia, odczyty poza zakresem, narzędzia zdolne do exec, narzędzia płaszczyzny sterowania, narzędzia mutujące i przepływy interaktywne zawsze wymagają jawnego zatwierdzenia w promptcie.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostu ACP jest oddzielna od uprawnień harness ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest przełącznikiem break-glass „yolo” dla tej sesji harness.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) obsługuje Agent Client Protocol i chcesz,
aby sterowało sesją Gatewaya OpenClaw.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gatewaya (konfiguracją lub flagami).
3. Skonfiguruj IDE tak, aby uruchamiało `openclaw acp` przez stdio.

Przykładowa konfiguracja (trwała):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Przykład bezpośredniego uruchomienia (bez zapisu konfiguracji):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferowane dla bezpieczeństwa procesów lokalnych
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Wybieranie agentów

ACP nie wybiera agentów bezpośrednio. Routing odbywa się według klucza sesji Gatewaya.

Użyj kluczy sesji przypisanych do agentów, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP odwzorowuje się na pojedynczy klucz sesji Gatewaya. Jeden agent
może mieć wiele sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`,
chyba że nadpiszesz klucz lub etykietę.

`mcpServers` per session nie są obsługiwane w trybie mostu. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, most zwróci czytelny błąd
zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia plugin OpenClaw lub
wybrane narzędzia wbudowane, takie jak `cron`, włącz mosty MCP ACPX po stronie
gatewaya zamiast próbować przekazywać `mcpServers` per session. Zobacz
[ACP Agents](/pl/tools/acp-agents#plugin-tools-mcp-bridge) i
[Most MCP narzędzi OpenClaw](/pl/tools/acp-agents#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent kodujący, taki jak Codex lub Claude Code, komunikował
się z Twoim botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym celem
`openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że most ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wskaż klucz sesji OpenClaw, którego agent kodujący ma używać.

Przykłady:

```bash
# Jednorazowe żądanie do domyślnej sesji ACP OpenClaw
acpx openclaw exec "Podsumuj stan aktywnej sesji ACP OpenClaw."

# Trwała nazwana sesja do kolejnych tur
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Zapytaj mojego agenta roboczego OpenClaw o ostatni kontekst związany z tym repozytorium."
```

Jeśli chcesz, aby `acpx openclaw` zawsze kierował do konkretnego Gatewaya i
klucza sesji, nadpisz komendę agenta `openclaw` w `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Dla lokalnego checkoutu repozytorium OpenClaw użyj bezpośredniego entrypointu
CLI zamiast uruchamiacza deweloperskiego, aby strumień ACP pozostał czysty. Na
przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, by Codex, Claude Code lub inny klient świadomy ACP mógł
pobierać informacje kontekstowe od agenta OpenClaw bez scrapowania terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w `~/.config/zed/settings.json` (lub użyj interfejsu Ustawień Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Aby kierować do konkretnego Gatewaya lub agenta:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

W Zed otwórz panel Agent i wybierz „OpenClaw ACP”, aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje ACP otrzymują izolowany klucz sesji Gatewaya z prefiksem `acp:`.
Aby użyć ponownie znanej sesji, przekaż klucz sesji lub etykietę:

- `--session <key>`: używa konkretnego klucza sesji Gatewaya.
- `--session-label <label>`: rozwiązuje istniejącą sesję według etykiety.
- `--reset-session`: tworzy nowy identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli Twój klient ACP obsługuje metadane, możesz nadpisywać ustawienia dla każdej sesji:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Więcej informacji o kluczach sesji znajdziesz pod adresem [/concepts/session](/pl/concepts/session).

## Opcje

- `--url <url>`: URL WebSocket Gatewaya (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token uwierzytelniający Gatewaya.
- `--token-file <path>`: odczytuje token uwierzytelniający Gatewaya z pliku.
- `--password <password>`: hasło uwierzytelniające Gatewaya.
- `--password-file <path>`: odczytuje hasło uwierzytelniające Gatewaya z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: kończy się błędem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: resetuje klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie poprzedza promptów katalogiem roboczym.
- `--provenance <off|meta|meta+receipt>`: dołącza metadane provenance ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów na niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gatewaya jest zgodne ze wspólnym kontraktem używanym przez innych klientów Gatewaya:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback do `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się bezpieczną odmową)
  - tryb zdalny: `gateway.remote.*` z fallbackiem env/config według reguł pierwszeństwa zdalnego
  - `--url` jest bezpieczne względem nadpisania i nie używa ponownie niejawnych danych uwierzytelniających z config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne backendu runtime ACP otrzymują `OPENCLAW_SHELL=acp`, co można wykorzystać do reguł shell/profile zależnych od kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchamianym procesie mostu.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy dla sesji ACP.
- `--server <command>`: komenda serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącza szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.
