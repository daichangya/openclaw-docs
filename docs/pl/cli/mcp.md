---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami obsługiwanymi przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie zapisanymi definicjami serwerów MCP w OpenClaw
summary: Udostępniaj rozmowy kanałów OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ma dwa zadania:

- uruchamiać OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządzać definicjami wychodzących serwerów MCP należącymi do OpenClaw za pomocą `list`, `show`,
  `set` i `unset`

Innymi słowy:

- `serve` oznacza, że OpenClaw działa jako serwer MCP
- `list` / `show` / `set` / `unset` oznacza, że OpenClaw działa jako rejestr po stronie klienta MCP
  dla innych serwerów MCP, z których jego środowiska wykonawcze mogą korzystać później

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw powinien sam hostować sesję
harness kodowania i kierować to środowisko wykonawcze przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

## Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP powinien rozmawiać bezpośrednio z
  rozmowami kanałów obsługiwanych przez OpenClaw
- masz już lokalny lub zdalny Gateway OpenClaw z kierowanymi sesjami
- chcesz jednego serwera MCP, który działa w różnych backendach kanałów OpenClaw, zamiast
  uruchamiać osobne mosty dla każdego kanału

Zamiast tego użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw powinien hostować środowisko wykonawcze
kodowania samodzielnie i utrzymywać sesję agenta wewnątrz OpenClaw.

## Jak to działa

`openclaw mcp serve` uruchamia serwer stdio MCP. Klient MCP jest właścicielem tego
procesu. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z
lokalnym lub zdalnym Gateway OpenClaw przez WebSocket i udostępnia kierowane rozmowy kanałowe przez MCP.

Cykl życia:

1. klient MCP uruchamia `openclaw mcp serve`
2. most łączy się z Gateway
3. kierowane sesje stają się rozmowami MCP oraz narzędziami do transkryptu/historii
4. zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony
5. jeśli tryb kanału Claude jest włączony, ta sama sesja może również odbierać
   powiadomienia push specyficzne dla Claude

Ważne zachowanie:

- stan kolejki na żywo zaczyna się, gdy most się połączy
- starsza historia transkryptu jest odczytywana przez `messages_read`
- powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
- gdy klient się rozłączy, most kończy działanie, a kolejka na żywo znika
- jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i
  `openclaw infer model run`, wycofują wszelkie dołączone środowiska wykonawcze MCP, które otwierają, gdy
  odpowiedź się zakończy, więc powtarzane uruchomienia skryptowe nie kumulują procesów podrzędnych stdio MCP
- serwery stdio MCP uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane
  jako drzewo procesów przy wyłączeniu, więc podprocesy podrzędne uruchomione przez
  serwer nie przetrwają po wyjściu nadrzędnego klienta stdio
- usunięcie lub zresetowanie sesji usuwa klientów MCP tej sesji przez
  współdzieloną ścieżkę czyszczenia środowiska wykonawczego, więc nie pozostają żadne wiszące połączenia stdio
  powiązane z usuniętą sesją

## Wybór trybu klienta

Użyj tego samego mostu na dwa różne sposoby:

- Ogólni klienci MCP: tylko standardowe narzędzia MCP. Użyj `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz
  narzędzi zatwierdzania.
- Claude Code: standardowe narzędzia MCP plus adapter kanału specyficzny dla Claude.
  Włącz `--claude-channel-mode on` lub pozostaw domyślne `auto`.

Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania możliwości klienta.

## Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway do udostępniania rozmów opartych na kanałach. Rozmowa pojawia się, gdy OpenClaw ma już stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub celu
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania listy ostatnich kierowanych rozmów
- odczytu ostatniej historii transkryptu
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem przez tę samą trasę
- oglądania próśb o zatwierdzenie, które pojawiają się, gdy most jest połączony

## Użycie

```bash
# Lokalny Gateway
openclaw mcp serve

# Zdalny Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Zdalny Gateway z uwierzytelnianiem hasłem
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Włącz szczegółowe logi mostu
openclaw mcp serve --verbose

# Wyłącz powiadomienia push specyficzne dla Claude
openclaw mcp serve --claude-channel-mode off
```

## Narzędzia mostu

Bieżący most udostępnia te narzędzia MCP:

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

Wyświetla ostatnie rozmowy oparte na sesjach, które mają już metadane tras w
stanie sesji Gateway.

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
widok metadanych nad treścią transkryptu, a nie samodzielny trwały magazyn blobów załączników.

### `events_poll`

Odczytuje zakolejkowane zdarzenia na żywo od kursora numerycznego.

### `events_wait`

Wykonuje długie odpytywanie, aż nadejdzie następne pasujące zakolejkowane zdarzenie albo upłynie limit czasu.

Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania niemal w czasie rzeczywistym bez
protokołu push specyficznego dla Claude.

### `messages_send`

Wysyła tekst z powrotem przez tę samą trasę, która została już zapisana w sesji.

Bieżące zachowanie:

- wymaga istniejącej trasy rozmowy
- używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
- wysyła tylko tekst

### `permissions_list_open`

Wyświetla oczekujące żądania zatwierdzeń exec/Plugin, które most zaobserwował od momentu
połączenia z Gateway.

### `permissions_respond`

Rozwiązuje jedno oczekujące żądanie zatwierdzenia exec/Plugin za pomocą:

- `allow-once`
- `allow-always`
- `deny`

## Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci, gdy jest połączony.

Bieżące typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Ważne ograniczenia:

- kolejka jest tylko na żywo; zaczyna się, gdy most MCP się uruchamia
- `events_poll` i `events_wait` nie odtwarzają same z siebie starszej historii Gateway
- trwały backlog należy odczytywać przez `messages_read`

## Powiadomienia kanału Claude

Most może również udostępniać powiadomienia kanału specyficzne dla Claude. To
odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają
dostępne, ale wiadomości przychodzące na żywo mogą również przychodzić jako powiadomienia MCP specyficzne dla Claude.

Flagi:

- `--claude-channel-mode off`: tylko standardowe narzędzia MCP
- `--claude-channel-mode on`: włącz powiadomienia kanału Claude
- `--claude-channel-mode auto`: obecne ustawienie domyślne; takie samo zachowanie mostu jak `on`

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne możliwości Claude
i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Bieżące zachowanie mostu:

- przychodzące wiadomości transkryptu `user` są przekazywane jako
  `notifications/claude/channel`
- żądania uprawnień Claude odebrane przez MCP są śledzone w pamięci
- jeśli powiązana rozmowa wyśle później `yes abcde` lub `no abcde`, most
  konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia działają tylko w ramach sesji na żywo; jeśli klient MCP się rozłączy,
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

W przypadku większości ogólnych klientów MCP zacznij od standardowej powierzchni narzędzi i ignoruj
tryb Claude. Włącz tryb Claude tylko dla klientów, którzy faktycznie rozumieją
metody powiadomień specyficzne dla Claude.

## Opcje

`openclaw mcp serve` obsługuje:

- `--url <url>`: adres URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: odczytaj token z pliku
- `--password <password>`: hasło Gateway
- `--password-file <path>`: odczytaj hasło z pliku
- `--claude-channel-mode <auto|on|off>`: tryb powiadomień Claude
- `-v`, `--verbose`: szczegółowe logi na stderr

Jeśli to możliwe, preferuj `--token-file` lub `--password-file` zamiast sekretów inline.

## Bezpieczeństwo i granica zaufania

Most nie wymyśla routingu. Udostępnia tylko rozmowy, które Gateway
już wie, jak kierować.

To oznacza, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do
  bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest tylko na żywo/w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych kontroli tokenu lub hasła Gateway, którym
  ufałbyś w przypadku każdego innego zdalnego klienta Gateway

Jeśli rozmowy brakuje w `conversations_list`, zwykle przyczyną nie jest konfiguracja
MCP. Brakuje metadanych trasy w bazowej sesji Gateway albo są one niekompletne.

## Testowanie

OpenClaw dostarcza deterministyczny smoke test Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten smoke test:

- uruchamia seeded kontener Gateway
- uruchamia drugi kontener, który uruchamia `openclaw mcp serve`
- weryfikuje wykrywanie rozmów, odczyty transkryptów, odczyty metadanych załączników,
  zachowanie kolejki zdarzeń na żywo i routing wysyłania wychodzącego
- waliduje powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty
  most stdio MCP

To najszybszy sposób, aby udowodnić, że most działa, bez podłączania do testu
prawdziwego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania znajdziesz w [Testing](/pl/help/testing).

## Rozwiązywanie problemów

### Nie zwrócono żadnych rozmów

Zwykle oznacza to, że sesja Gateway nie ma jeszcze możliwości routingu. Potwierdź, że
bazowa sesja ma zapisane metadane trasy kanału/provider, odbiorcy oraz opcjonalnie
konta/wątku.

### `events_poll` lub `events_wait` pomija starsze wiadomości

To oczekiwane. Kolejka na żywo zaczyna się, gdy most się połączy. Odczytuj starszą historię transkryptu przez `messages_read`.

### Powiadomienia Claude się nie pojawiają

Sprawdź wszystkie poniższe:

- klient utrzymywał otwartą sesję stdio MCP
- `--claude-channel-mode` ma wartość `on` lub `auto`
- klient faktycznie rozumie metody powiadomień specyficzne dla Claude
- wiadomość przychodząca pojawiła się po połączeniu mostu

### Brakuje zatwierdzeń

`permissions_list_open` pokazuje tylko żądania zatwierdzeń zaobserwowane, gdy most
był połączony. To nie jest trwałe API historii zatwierdzeń.

## OpenClaw jako rejestr klienta MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP należącymi do OpenClaw
w `mcp.servers` w konfiguracji OpenClaw.

Te zapisane definicje są przeznaczone dla środowisk wykonawczych, które OpenClaw uruchamia lub konfiguruje
później, takich jak osadzone Pi i inne adaptery wykonawcze. OpenClaw przechowuje
definicje centralnie, aby te środowiska wykonawcze nie musiały utrzymywać własnych zduplikowanych
list serwerów MCP.

Ważne zachowanie:

- te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
- nie łączą się z docelowym serwerem MCP
- nie walidują, czy polecenie, adres URL lub zdalny transport są
  aktualnie osiągalne
- adaptery wykonawcze decydują, jakie kształty transportu faktycznie obsługują w
  czasie wykonania
- osadzone Pi udostępnia skonfigurowane narzędzia MCP w zwykłych profilach narzędzi `coding` i `messaging`; profil
  `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie
- środowiska wykonawcze MCP dołączane w zakresie sesji są sprzątane po `mcp.sessionIdleTtlMs`
  milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć), a
  jednorazowe uruchomienia osadzone czyszczą je po zakończeniu działania

## Zapisane definicje serwerów MCP

OpenClaw przechowuje również lekki rejestr serwerów MCP w konfiguracji dla powierzchni,
które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje pełny skonfigurowany obiekt serwerów MCP.
- `set` oczekuje jednej wartości obiektu JSON w wierszu poleceń.
- `unset` kończy się błędem, jeśli serwer o podanej nazwie nie istnieje.

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

Uruchamia lokalny proces podrzędny i komunikuje się przez stdin/stdout.

| Field                      | Opis                                  |
| -------------------------- | ------------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagany) |
| `args`                     | Tablica argumentów wiersza poleceń    |
| `env`                      | Dodatkowe zmienne środowiskowe        |
| `cwd` / `workingDirectory` | Katalog roboczy dla procesu           |

#### Filtr bezpieczeństwa env dla stdio

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmieniać sposób uruchamiania serwera stdio MCP przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` i podobne zmienne sterujące środowiskiem wykonawczym. Uruchomienie odrzuca je z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego prelude, podmienić interpretera ani włączyć debugera dla procesu stdio. Zwykłe zmienne env poświadczeń, proxy i specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta Gateway, a nie w `env` serwera stdio.

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Field                 | Opis                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | Adres URL HTTP lub HTTPS zdalnego serwera (wymagany)             |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania) |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalny)             |

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
danych wyjściowych statusu.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Field                 | Opis                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | Adres URL HTTP lub HTTPS zdalnego serwera (wymagany)                                 |
| `transport`           | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy pominięte, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania)  |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalny)                                |

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

Te polecenia zarządzają tylko zapisaną konfiguracją. Nie uruchamiają mostu kanałów,
nie otwierają aktywnej sesji klienta MCP ani nie dowodzą, że docelowy serwer jest osiągalny.

## Bieżące ograniczenia

Ta strona dokumentuje most w obecnie dostarczanej postaci.

Bieżące ograniczenia:

- wykrywanie rozmów zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- brak jeszcze narzędzi do edycji wiadomości lub reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; brak jeszcze multipleksowanego upstream
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest
  połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugins](/pl/cli/plugins)
