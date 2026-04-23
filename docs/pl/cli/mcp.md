---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami opartymi na OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie zapisanymi przez OpenClaw definicjami serwerów MCP
summary: Udostępnianie rozmów kanałowych OpenClaw przez MCP i zarządzanie zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-04-23T09:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` ma dwa zadania:

- uruchamianie OpenClaw jako serwera MCP za pomocą `openclaw mcp serve`
- zarządzanie należącymi do OpenClaw definicjami wychodzących serwerów MCP za pomocą `list`, `show`,
  `set` i `unset`

Innymi słowy:

- `serve` oznacza, że OpenClaw działa jako serwer MCP
- `list` / `show` / `set` / `unset` oznacza, że OpenClaw działa jako rejestr po stronie klienta MCP
  dla innych serwerów MCP, z których jego środowiska uruchomieniowe mogą skorzystać później

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować sesję
harnessu kodowania i kierować to środowisko uruchomieniowe przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

## Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma rozmawiać bezpośrednio z
  rozmowami kanałowymi opartymi na OpenClaw
- masz już lokalny lub zdalny Gateway OpenClaw z trasowanymi sesjami
- chcesz jednego serwera MCP, który działa w różnych backendach kanałów OpenClaw,
  zamiast uruchamiać osobne mosty dla każdego kanału

Zamiast tego użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma hostować samo
środowisko uruchomieniowe kodowania i utrzymywać sesję agenta wewnątrz OpenClaw.

## Jak to działa

`openclaw mcp serve` uruchamia serwer stdio MCP. Ten proces jest własnością
klienta MCP. Gdy klient utrzymuje otwartą sesję stdio, most łączy się z
lokalnym lub zdalnym Gateway OpenClaw przez WebSocket i udostępnia trasowane
rozmowy kanałowe przez MCP.

Cykl życia:

1. klient MCP uruchamia `openclaw mcp serve`
2. most łączy się z Gateway
3. trasowane sesje stają się rozmowami MCP oraz narzędziami transkryptu/historii
4. zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony
5. jeśli włączony jest tryb kanału Claude, ta sama sesja może także odbierać
   powiadomienia push specyficzne dla Claude

Ważne zachowania:

- stan kolejki na żywo zaczyna się, gdy most się połączy
- starsza historia transkryptu jest odczytywana przez `messages_read`
- powiadomienia push Claude istnieją tylko tak długo, jak żyje sesja MCP
- gdy klient się rozłączy, most kończy działanie, a kolejka na żywo znika
- serwery stdio MCP uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane
  jako drzewo procesów podczas zamykania, więc podprocesy potomne uruchomione przez
  serwer nie przetrwają po zakończeniu działania nadrzędnego klienta stdio
- usunięcie lub zresetowanie sesji zwalnia klientów MCP tej sesji przez
  współdzieloną ścieżkę czyszczenia środowiska uruchomieniowego, więc nie pozostają
  żadne aktywne połączenia stdio powiązane z usuniętą sesją

## Wybór trybu klienta

Użyj tego samego mostu na dwa różne sposoby:

- Ogólni klienci MCP: tylko standardowe narzędzia MCP. Używaj `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz
  narzędzi zatwierdzania.
- Claude Code: standardowe narzędzia MCP plus adapter kanału specyficzny dla Claude.
  Włącz `--claude-channel-mode on` lub pozostaw wartość domyślną `auto`.

Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania
możliwości klienta.

## Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway do udostępniania rozmów
opartych na kanałach. Rozmowa pojawia się, gdy OpenClaw ma już stan sesji
ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub celu
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania ostatnich trasowanych rozmów
- odczytu ostatniej historii transkryptu
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem przez tę samą trasę
- przeglądania żądań zatwierdzenia, które nadejdą, gdy most jest połączony

## Użycie

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## Narzędzia mostu

Obecnie most udostępnia następujące narzędzia MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Wyświetla ostatnie rozmowy oparte na sesjach, które mają już metadane tras
w stanie sesji Gateway.

Przydatne filtry:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Zwraca jedną rozmowę według `session_key`.

### `messages_read`

Odczytuje ostatnie wiadomości transkryptu dla jednej rozmowy opartej na sesji.

### `attachments_fetch`

Wyodrębnia nietekstowe bloki treści wiadomości z jednej wiadomości transkryptu. To
widok metadanych nad treścią transkryptu, a nie osobny trwały magazyn blobów załączników.

### `events_poll`

Odczytuje zakolejkowane zdarzenia na żywo od numerycznego kursora.

### `events_wait`

Wykonuje long-polling, aż nadejdzie następne pasujące zakolejkowane zdarzenie
lub upłynie limit czasu.

Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania zbliżonego do czasu
rzeczywistego bez protokołu push specyficznego dla Claude.

### `messages_send`

Wysyła tekst z powrotem przez tę samą trasę już zapisaną w sesji.

Obecne zachowanie:

- wymaga istniejącej trasy rozmowy
- używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
- wysyła tylko tekst

### `permissions_list_open`

Wyświetla oczekujące żądania zatwierdzeń exec/plugin, które most zaobserwował od
momentu połączenia z Gateway.

### `permissions_respond`

Rozstrzyga jedno oczekujące żądanie zatwierdzenia exec/plugin za pomocą:

- `allow-once`
- `allow-always`
- `deny`

## Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci, gdy jest połączony.

Obecne typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Ważne ograniczenia:

- kolejka działa tylko na żywo; zaczyna się, gdy most MCP zostaje uruchomiony
- `events_poll` i `events_wait` same z siebie nie odtwarzają starszej historii Gateway
- trwały backlog należy odczytywać przez `messages_read`

## Powiadomienia kanału Claude

Most może także udostępniać powiadomienia kanału specyficzne dla Claude. To
odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP
pozostają dostępne, ale wiadomości przychodzące na żywo mogą też docierać jako
powiadomienia MCP specyficzne dla Claude.

Flagi:

- `--claude-channel-mode off`: tylko standardowe narzędzia MCP
- `--claude-channel-mode on`: włącz powiadomienia kanału Claude
- `--claude-channel-mode auto`: obecna wartość domyślna; to samo zachowanie mostu co `on`

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne
możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkryptu `user` są przekazywane jako
  `notifications/claude/channel`
- żądania uprawnień Claude odebrane przez MCP są śledzone w pamięci
- jeśli powiązana rozmowa później wyśle `yes abcde` lub `no abcde`, most
  przekształca to w `notifications/claude/channel/permission`
- te powiadomienia działają tylko dla aktywnej sesji; jeśli klient MCP się rozłączy,
  nie ma celu dla powiadomień push

To jest celowo specyficzne dla klienta. Ogólni klienci MCP powinni polegać na
standardowych narzędziach odpytywania.

## Konfiguracja klienta MCP

Przykładowa konfiguracja klienta stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Dla większości ogólnych klientów MCP zacznij od standardowej powierzchni
narzędzi i ignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, którzy
rzeczywiście rozumieją metody powiadomień specyficzne dla Claude.

## Opcje

`openclaw mcp serve` obsługuje:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: odczytaj token z pliku
- `--password <password>`: hasło Gateway
- `--password-file <path>`: odczytaj hasło z pliku
- `--claude-channel-mode <auto|on|off>`: tryb powiadomień Claude
- `-v`, `--verbose`: szczegółowe logi na stderr

Jeśli to możliwe, preferuj `--token-file` lub `--password-file` zamiast
sekretów podawanych bezpośrednio.

## Bezpieczeństwo i granica zaufania

Most nie wymyśla trasowania. Udostępnia tylko rozmowy, które Gateway już umie
trasować.

To oznacza, że:

- allowlisty nadawców, parowanie i zaufanie na poziomie kanału nadal należą do
  bazowej konfiguracji kanałów OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest tylko aktywny/w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych kontroli tokenu lub hasła Gateway,
  którym ufałbyś dla każdego innego zdalnego klienta Gateway

Jeśli rozmowy brakuje w `conversations_list`, zwykle przyczyną nie jest
konfiguracja MCP. Brakuje metadanych trasowania w bazowej sesji Gateway albo są niepełne.

## Testowanie

OpenClaw dostarcza deterministyczny smoke Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten smoke:

- uruchamia kontener Gateway z preseedowanymi danymi
- uruchamia drugi kontener, który startuje `openclaw mcp serve`
- weryfikuje wykrywanie rozmów, odczyt transkryptów, odczyt metadanych załączników,
  zachowanie kolejki zdarzeń na żywo i trasowanie wysyłki wychodzącej
- waliduje powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty
  most stdio MCP

To najszybszy sposób, aby udowodnić, że most działa, bez podłączania do testu
prawdziwego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania znajdziesz w [Testowanie](/pl/help/testing).

## Rozwiązywanie problemów

### Nie zwracane są żadne rozmowy

Zwykle oznacza to, że sesja Gateway nie ma jeszcze możliwości trasowania. Potwierdź,
że bazowa sesja ma zapisane metadane trasy kanału/dostawcy, odbiorcy oraz opcjonalnie
konta/wątku.

### `events_poll` lub `events_wait` pomija starsze wiadomości

To oczekiwane. Kolejka na żywo zaczyna się, gdy most się połączy. Starszą historię
transkryptu odczytuj przez `messages_read`.

### Powiadomienia Claude się nie pojawiają

Sprawdź wszystko z poniższych:

- klient utrzymywał otwartą sesję stdio MCP
- `--claude-channel-mode` ma wartość `on` lub `auto`
- klient rzeczywiście rozumie metody powiadomień specyficzne dla Claude
- wiadomość przychodząca pojawiła się po połączeniu mostu

### Brakuje zatwierdzeń

`permissions_list_open` pokazuje tylko żądania zatwierdzeń zaobserwowane, gdy most
był połączony. To nie jest trwałe API historii zatwierdzeń.

## OpenClaw jako rejestr klienta MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają należącymi do OpenClaw
definicjami serwerów MCP w `mcp.servers` w konfiguracji OpenClaw.

Te zapisane definicje służą środowiskom uruchomieniowym, które OpenClaw uruchamia lub
konfiguruje później, takim jak osadzony Pi i inne adaptery runtime. OpenClaw przechowuje
definicje centralnie, aby te środowiska uruchomieniowe nie musiały utrzymywać
własnych zduplikowanych list serwerów MCP.

Ważne zachowania:

- te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
- nie łączą się z docelowym serwerem MCP
- nie sprawdzają, czy polecenie, URL lub transport zdalny jest obecnie osiągalny
- adaptery runtime decydują, które kształty transportu rzeczywiście obsługują w czasie wykonania
- osadzony Pi udostępnia skonfigurowane narzędzia MCP w zwykłych profilach narzędzi `coding` i `messaging`;
  `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` jawnie je wyłącza

## Zapisane definicje serwerów MCP

OpenClaw przechowuje też w konfiguracji lekki rejestr serwerów MCP dla powierzchni,
które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje pełny skonfigurowany obiekt serwera MCP.
- `set` oczekuje jednej wartości obiektu JSON w wierszu polecenia.
- `unset` kończy się błędem, jeśli nazwany serwer nie istnieje.

Przykłady:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Przykładowy kształt konfiguracji:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Uruchamia lokalny proces potomny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                                 |
| -------------------------- | ------------------------------------ |
| `command`                  | Plik wykonywalny do uruchomienia (wymagane) |
| `args`                     | Tablica argumentów wiersza polecenia |
| `env`                      | Dodatkowe zmienne środowiskowe       |
| `cwd` / `workingDirectory` | Katalog roboczy procesu              |

#### Filtr bezpieczeństwa env dla stdio

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmienić sposób startu serwera stdio MCP przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` i podobne zmienne sterujące środowiskiem uruchomieniowym. Uruchomienie odrzuca je z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera ani włączyć debuggera przeciwko procesowi stdio. Zwykłe poświadczenia, proxy i zmienne środowiskowe specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta gateway, a nie w `env` serwera stdio.

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                  | Opis                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagane)                   |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania) |
| `connectionTimeoutMs` | Limit czasu połączenia per serwer w ms (opcjonalne)              |

Przykład:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Wrażliwe wartości w `url` (userinfo) i `headers` są redagowane w logach i
wyjściu statusu.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                  | Opis                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagane)                                       |
| `transport`           | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy pominięte, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania)  |
| `connectionTimeoutMs` | Limit czasu połączenia per serwer w ms (opcjonalne)                                  |

Przykład:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Te polecenia zarządzają tylko zapisaną konfiguracją. Nie uruchamiają mostu
kanałowego, nie otwierają aktywnej sesji klienta MCP ani nie potwierdzają, że
docelowy serwer jest osiągalny.

## Obecne ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Obecne ograniczenia:

- wykrywanie rozmów zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- brak narzędzi do edycji wiadomości lub reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; brak jeszcze multipleksowanego upstream
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest
  połączony
