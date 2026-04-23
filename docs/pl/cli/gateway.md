---
read_when:
    - Uruchamianie Gateway z CLI (dewelopersko lub na serwerach)
    - Debugowanie uwierzytelniania Gateway, trybów bindowania i łączności
    - Wykrywanie Gatewayów przez Bonjour (lokalny i rozległy DNS-SD)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — uruchamianie, odpytywanie i wykrywanie Gatewayów
title: Gateway
x-i18n:
    generated_at: "2026-04-23T09:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Gateway to serwer WebSocket OpenClaw (kanały, Node, sesje, hooki).

Podpolecenia na tej stronie znajdują się pod `openclaw gateway …`.

Powiązana dokumentacja:

- [/gateway/bonjour](/pl/gateway/bonjour)
- [/gateway/discovery](/pl/gateway/discovery)
- [/gateway/configuration](/pl/gateway/configuration)

## Uruchamianie Gateway

Uruchom lokalny proces Gateway:

```bash
openclaw gateway
```

Alias dla trybu pierwszoplanowego:

```bash
openclaw gateway run
```

Uwagi:

- Domyślnie Gateway odmawia uruchomienia, jeśli w `~/.openclaw/openclaw.json` nie ustawiono `gateway.mode=local`. Użyj `--allow-unconfigured` dla uruchomień ad hoc / deweloperskich.
- Oczekuje się, że `openclaw onboard --mode local` i `openclaw setup` zapiszą `gateway.mode=local`. Jeśli plik istnieje, ale brakuje `gateway.mode`, traktuj to jako uszkodzoną lub nadpisaną konfigurację i napraw ją zamiast domyślnie zakładać tryb lokalny.
- Jeśli plik istnieje i brakuje `gateway.mode`, Gateway traktuje to jako podejrzane uszkodzenie konfiguracji i odmawia „zgadywania local” za Ciebie.
- Bindowanie poza local loopback bez uwierzytelniania jest blokowane (zabezpieczenie ochronne).
- `SIGUSR1` wywołuje restart w tym samym procesie, jeśli jest autoryzowany (`commands.restart` jest domyślnie włączone; ustaw `commands.restart: false`, aby blokować ręczny restart, przy zachowaniu dozwolonych narzędzi Gateway / stosowania konfiguracji / aktualizacji).
- Procedury obsługi `SIGINT`/`SIGTERM` zatrzymują proces Gateway, ale nie przywracają niestandardowego stanu terminala. Jeśli opakowujesz CLI przez TUI lub wejście raw-mode, przywróć terminal przed wyjściem.

### Opcje

- `--port <port>`: port WebSocket (domyślny pochodzi z config/env; zwykle `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: tryb bindowania listenera.
- `--auth <token|password>`: nadpisanie trybu uwierzytelniania.
- `--token <token>`: nadpisanie tokenu (ustawia też `OPENCLAW_GATEWAY_TOKEN` dla procesu).
- `--password <password>`: nadpisanie hasła. Ostrzeżenie: hasła podane inline mogą być widoczne w lokalnych listach procesów.
- `--password-file <path>`: odczyt hasła Gateway z pliku.
- `--tailscale <off|serve|funnel>`: wystawienie Gateway przez Tailscale.
- `--tailscale-reset-on-exit`: resetowanie konfiguracji Tailscale serve/funnel przy zamknięciu.
- `--allow-unconfigured`: pozwala uruchomić Gateway bez `gateway.mode=local` w konfiguracji. Omija to zabezpieczenie startowe tylko dla bootstrapu ad hoc / deweloperskiego; nie zapisuje ani nie naprawia pliku konfiguracji.
- `--dev`: tworzy konfigurację deweloperską + workspace, jeśli ich brakuje (pomija `BOOTSTRAP.md`).
- `--reset`: resetuje konfigurację deweloperską + poświadczenia + sesje + workspace (wymaga `--dev`).
- `--force`: zabija istniejący listener na wybranym porcie przed uruchomieniem.
- `--verbose`: szczegółowe logi.
- `--cli-backend-logs`: pokazuje w konsoli tylko logi backendu CLI (i włącza stdout/stderr).
- `--ws-log <auto|full|compact>`: styl logów websocketów (domyślnie `auto`).
- `--compact`: alias dla `--ws-log compact`.
- `--raw-stream`: loguje surowe zdarzenia strumienia modelu do jsonl.
- `--raw-stream-path <path>`: ścieżka jsonl dla surowego strumienia.

Profilowanie startu:

- Ustaw `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, aby logować czasy faz podczas uruchamiania Gateway.
- Uruchom `pnpm test:startup:gateway -- --runs 5 --warmup 1`, aby wykonać benchmark startu Gateway. Benchmark zapisuje pierwsze wyjście procesu, `/healthz`, `/readyz` oraz czasy z trace uruchomienia.

## Odpytywanie działającego Gateway

Wszystkie polecenia odpytywania używają RPC przez WebSocket.

Tryby wyjścia:

- Domyślny: czytelny dla człowieka (kolorowy w TTY).
- `--json`: JSON czytelny maszynowo (bez stylizacji/spinnera).
- `--no-color` (lub `NO_COLOR=1`): wyłącza ANSI, zachowując układ czytelny dla człowieka.

Wspólne opcje (tam, gdzie obsługiwane):

- `--url <url>`: URL WebSocket Gateway.
- `--token <token>`: token Gateway.
- `--password <password>`: hasło Gateway.
- `--timeout <ms>`: timeout / budżet (zależy od polecenia).
- `--expect-final`: czeka na odpowiedź „final” (wywołania agenta).

Uwaga: gdy ustawisz `--url`, CLI nie przechodzi awaryjnie do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Punkt końcowy HTTP `/healthz` to sonda liveness: zwraca odpowiedź, gdy serwer potrafi odpowiadać przez HTTP. Punkt końcowy HTTP `/readyz` jest bardziej rygorystyczny i pozostaje czerwony, gdy sidecary startowe, kanały lub skonfigurowane hooki nadal się stabilizują.

### `gateway usage-cost`

Pobierz podsumowania usage-cost z logów sesji.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opcje:

- `--days <days>`: liczba dni do uwzględnienia (domyślnie `30`).

### `gateway stability`

Pobierz ostatni rejestr stabilności diagnostycznej z działającego Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opcje:

- `--limit <limit>`: maksymalna liczba ostatnich zdarzeń do uwzględnienia (domyślnie `25`, maks. `1000`).
- `--type <type>`: filtrowanie według typu zdarzenia diagnostycznego, takiego jak `payload.large` lub `diagnostic.memory.pressure`.
- `--since-seq <seq>`: uwzględnij tylko zdarzenia po numerze sekwencyjnym diagnostyki.
- `--bundle [path]`: odczytuje utrwalony pakiet stabilności zamiast wywoływać działający Gateway. Użyj `--bundle latest` (lub po prostu `--bundle`) dla najnowszego pakietu w katalogu stanu albo przekaż bezpośrednio ścieżkę do JSON pakietu.
- `--export`: zapisuje zip diagnostyki wsparcia do udostępnienia zamiast wypisywać szczegóły stabilności.
- `--output <path>`: ścieżka wyjściowa dla `--export`.

Uwagi:

- Rekordy przechowują metadane operacyjne: nazwy zdarzeń, liczniki, rozmiary bajtowe, odczyty pamięci, stan kolejki/sesji, nazwy kanałów/pluginów oraz zredagowane podsumowania sesji. Nie przechowują tekstu czatu, treści webhooków, wyników narzędzi, surowych treści żądań ani odpowiedzi, tokenów, cookies, wartości sekretów, nazw hostów ani surowych identyfikatorów sesji. Ustaw `diagnostics.enabled: false`, aby całkowicie wyłączyć rejestrator.
- Przy krytycznych wyjściach Gateway, timeoutach zamknięcia i błędach startu po restarcie OpenClaw zapisuje tę samą migawkę diagnostyczną do `~/.openclaw/logs/stability/openclaw-stability-*.json`, jeśli rejestrator ma zdarzenia. Sprawdź najnowszy pakiet przez `openclaw gateway stability --bundle latest`; `--limit`, `--type` i `--since-seq` działają też dla wyjścia pakietu.

### `gateway diagnostics export`

Zapisuje lokalny zip diagnostyczny zaprojektowany do dołączania do zgłoszeń błędów.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opcje:

- `--output <path>`: ścieżka wyjściowa zipa. Domyślnie eksport wsparcia w katalogu stanu.
- `--log-lines <count>`: maksymalna liczba oczyszczonych linii logów do uwzględnienia (domyślnie `5000`).
- `--log-bytes <bytes>`: maksymalna liczba bajtów logów do sprawdzenia (domyślnie `1000000`).
- `--url <url>`: URL WebSocket Gateway dla migawki health.
- `--token <token>`: token Gateway dla migawki health.
- `--password <password>`: hasło Gateway dla migawki health.
- `--timeout <ms>`: timeout migawki status/health (domyślnie `3000`).
- `--no-stability-bundle`: pomija wyszukiwanie utrwalonego pakietu stabilności.
- `--json`: wypisuje zapisaną ścieżkę, rozmiar i manifest jako JSON.

Eksport zawiera manifest, podsumowanie Markdown, kształt konfiguracji, oczyszczone szczegóły konfiguracji, oczyszczone podsumowania logów, oczyszczone migawki status/health Gateway oraz najnowszy pakiet stabilności, gdy istnieje.

Jest przeznaczony do udostępniania. Zachowuje szczegóły operacyjne pomagające w debugowaniu, takie jak bezpieczne pola logów OpenClaw, nazwy podsystemów, kody statusu, czasy trwania, skonfigurowane tryby, porty, identyfikatory pluginów, identyfikatory providerów, ustawienia funkcji niebędące sekretami oraz zredagowane komunikaty logów operacyjnych. Pomija lub redaguje tekst czatu, treści webhooków, wyniki narzędzi, poświadczenia, cookies, identyfikatory kont/wiadomości, tekst promptów/instrukcji, nazwy hostów i wartości sekretów. Gdy komunikat w stylu LogTape wygląda jak tekst ładunku użytkownika/czatu/narzędzia, eksport zachowuje tylko informację, że wiadomość została pominięta, wraz z liczbą jej bajtów.

### `gateway status`

`gateway status` pokazuje usługę Gateway (launchd/systemd/schtasks) wraz z opcjonalną sondą zdolności łączności/uwierzytelnienia.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opcje:

- `--url <url>`: dodaje jawny cel sondy. Skonfigurowany zdalny + localhost nadal są sondowane.
- `--token <token>`: uwierzytelnianie tokenem dla sondy.
- `--password <password>`: uwierzytelnianie hasłem dla sondy.
- `--timeout <ms>`: timeout sondy (domyślnie `10000`).
- `--no-probe`: pomija sondę łączności (widok tylko usługi).
- `--deep`: skanuje także usługi na poziomie systemu.
- `--require-rpc`: podnosi domyślną sondę łączności do sondy odczytu i kończy się kodem niezerowym, gdy ta sonda odczytu się nie powiedzie. Nie można łączyć z `--no-probe`.

Uwagi:

- `gateway status` pozostaje dostępne do diagnostyki nawet wtedy, gdy lokalna konfiguracja CLI jest nieobecna lub nieprawidłowa.
- Domyślne `gateway status` potwierdza stan usługi, połączenie WebSocket oraz zdolność uwierzytelniania widoczną podczas handshake. Nie potwierdza operacji read/write/admin.
- `gateway status` rozwiązuje skonfigurowane auth SecretRefs dla uwierzytelniania sondy, gdy to możliwe.
- Jeśli wymagany auth SecretRef nie zostanie rozwiązany na tej ścieżce polecenia, `gateway status --json` raportuje `rpc.authWarning`, gdy sonda łączności/uwierzytelnienia się nie powiedzie; przekaż jawnie `--token`/`--password` albo najpierw rozwiąż źródło sekretu.
- Jeśli sonda się powiedzie, ostrzeżenia o nierozwiązanych auth-ref są tłumione, aby uniknąć fałszywych alarmów.
- Używaj `--require-rpc` w skryptach i automatyzacji, gdy słuchająca usługa to za mało i potrzebujesz też zdrowych wywołań RPC o zakresie read.
- `--deep` dodaje skan typu best-effort dla dodatkowych instalacji launchd/systemd/schtasks. Gdy wykryto wiele usług podobnych do Gateway, wynik czytelny dla człowieka wypisuje wskazówki czyszczenia i ostrzega, że większość konfiguracji powinna uruchamiać jeden Gateway na maszynę.
- Wynik czytelny dla człowieka zawiera rozwiązaną ścieżkę logu pliku oraz migawkę ścieżek/poprawności konfiguracji CLI względem usługi, aby pomóc diagnozować dryf profilu lub katalogu stanu.
- W instalacjach Linux systemd sprawdzenia dryfu uwierzytelniania usługi odczytują wartości `Environment=` i `EnvironmentFile=` z unitu (w tym `%h`, ścieżki w cudzysłowie, wiele plików oraz opcjonalne pliki z `-`).
- Sprawdzenia dryfu rozwiązują `gateway.auth.token` SecretRefs z użyciem scalonego środowiska działania (najpierw środowisko polecenia usługi, potem awaryjnie środowisko procesu).
- Jeśli uwierzytelnianie tokenem nie jest efektywnie aktywne (jawne `gateway.auth.mode` równe `password`/`none`/`trusted-proxy`, albo brak ustawionego trybu, gdzie może wygrać hasło i żaden kandydat tokenu nie może wygrać), sprawdzenia dryfu tokenu pomijają rozwiązywanie tokenu konfiguracji.

### `gateway probe`

`gateway probe` to polecenie „debuguj wszystko”. Zawsze sonduje:

- skonfigurowany zdalny Gateway (jeśli ustawiony), oraz
- localhost (loopback) **nawet jeśli skonfigurowano zdalny**.

Jeśli przekażesz `--url`, ten jawny cel zostanie dodany przed oboma. Wynik czytelny dla człowieka oznacza
cele jako:

- `URL (explicit)`
- `Remote (configured)` lub `Remote (configured, inactive)`
- `Local loopback`

Jeśli osiągalnych jest wiele Gatewayów, wypisuje wszystkie. Wiele Gatewayów jest obsługiwanych, gdy używasz izolowanych profili/portów (np. rescue bot), ale większość instalacji nadal uruchamia pojedynczy Gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretacja:

- `Reachable: yes` oznacza, że co najmniej jeden cel zaakceptował połączenie WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` raportuje, co sonda potrafiła potwierdzić o uwierzytelnianiu. Jest to oddzielne od osiągalności.
- `Read probe: ok` oznacza, że powiodły się również szczegółowe wywołania RPC o zakresie read (`health`/`status`/`system-presence`/`config.get`).
- `Read probe: limited - missing scope: operator.read` oznacza, że połączenie się powiodło, ale RPC o zakresie read jest ograniczone. Jest to raportowane jako osiągalność **zdegradowana**, a nie pełna awaria.
- Kod wyjścia jest niezerowy tylko wtedy, gdy żaden sondowany cel nie jest osiągalny.

Uwagi dotyczące JSON (`--json`):

- Najwyższy poziom:
  - `ok`: co najmniej jeden cel jest osiągalny.
  - `degraded`: co najmniej jeden cel miał RPC szczegółów ograniczone zakresem.
  - `capability`: najlepsza zdolność wykryta wśród osiągalnych celów (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` lub `unknown`).
  - `primaryTargetId`: najlepszy cel do traktowania jako aktywny zwycięzca w tej kolejności: jawny URL, tunel SSH, skonfigurowany zdalny, a następnie local loopback.
  - `warnings[]`: rekordy ostrzeżeń typu best-effort z `code`, `message` i opcjonalnym `targetIds`.
  - `network`: wskazówki URL dla local loopback / tailnet wyprowadzone z bieżącej konfiguracji i sieci hosta.
  - `discovery.timeoutMs` i `discovery.count`: rzeczywisty budżet wykrywania / liczba wyników użyta dla tego przebiegu sondy.
- Dla każdego celu (`targets[].connect`):
  - `ok`: osiągalność po połączeniu + klasyfikacja zdegradowana.
  - `rpcOk`: pełny sukces RPC szczegółów.
  - `scopeLimited`: RPC szczegółów nie powiodło się z powodu braku zakresu operatora.
- Dla każdego celu (`targets[].auth`):
  - `role`: rola uwierzytelniania raportowana w `hello-ok`, gdy dostępna.
  - `scopes`: przyznane zakresy raportowane w `hello-ok`, gdy dostępne.
  - `capability`: ujawniona klasyfikacja zdolności uwierzytelniania dla tego celu.

Typowe kody ostrzeżeń:

- `ssh_tunnel_failed`: utworzenie tunelu SSH nie powiodło się; polecenie przeszło awaryjnie do bezpośrednich sond.
- `multiple_gateways`: osiągalny był więcej niż jeden cel; to nietypowe, chyba że celowo uruchamiasz izolowane profile, takie jak rescue bot.
- `auth_secretref_unresolved`: skonfigurowanego auth SecretRef nie udało się rozwiązać dla celu zakończonego niepowodzeniem.
- `probe_scope_limited`: połączenie WebSocket się powiodło, ale sonda odczytu została ograniczona z powodu braku `operator.read`.

#### Zdalnie przez SSH (parytet z aplikacją Mac)

Tryb „Remote over SSH” w aplikacji macOS używa lokalnego przekierowania portu, aby zdalny Gateway (który może być zbindowany tylko do loopback) stał się osiągalny pod `ws://127.0.0.1:<port>`.

Odpowiednik CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opcje:

- `--ssh <target>`: `user@host` lub `user@host:port` (port domyślnie `22`).
- `--ssh-identity <path>`: plik tożsamości.
- `--ssh-auto`: wybiera pierwszy wykryty host Gateway jako cel SSH z rozwiązanego
  punktu końcowego wykrywania (`local.` plus skonfigurowana domena rozległa, jeśli istnieje). Wskazówki tylko z TXT są ignorowane.

Konfiguracja (opcjonalna, używana jako domyślna):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Niskopoziomowy pomocnik RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opcje:

- `--params <json>`: ciąg obiektu JSON dla parametrów (domyślnie `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Uwagi:

- `--params` musi być prawidłowym JSON.
- `--expect-final` jest przeznaczone głównie dla RPC w stylu agenta, które strumieniują zdarzenia pośrednie przed końcowym ładunkiem.

## Zarządzanie usługą Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opcje poleceń:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Uwagi:

- `gateway install` obsługuje `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Gdy uwierzytelnianie tokenem wymaga tokenu, a `gateway.auth.token` jest zarządzane przez SecretRef, `gateway install` sprawdza, czy SecretRef da się rozwiązać, ale nie zapisuje rozwiązanego tokenu do metadanych środowiska usługi.
- Jeśli uwierzytelnianie tokenem wymaga tokenu, a skonfigurowany token SecretRef nie jest rozwiązany, instalacja kończy się domyślną odmową zamiast zapisywać awaryjny jawny tekst.
- Dla uwierzytelniania hasłem przy `gateway run` preferuj `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` lub `gateway.auth.password` oparte na SecretRef zamiast inline `--password`.
- W trybie uwierzytelniania wywnioskowanego samo powłokowe `OPENCLAW_GATEWAY_PASSWORD` nie łagodzi wymagań tokenu przy instalacji; przy instalacji zarządzanej usługi użyj trwałej konfiguracji (`gateway.auth.password` lub config `env`).
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, instalacja jest blokowana do czasu jawnego ustawienia trybu.
- Polecenia cyklu życia akceptują `--json` na potrzeby skryptów.

## Wykrywanie Gatewayów (Bonjour)

`gateway discover` skanuje w poszukiwaniu beaconów Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): wybierz domenę (przykład: `openclaw.internal.`) i skonfiguruj split DNS + serwer DNS; zobacz [/gateway/bonjour](/pl/gateway/bonjour)

Beacon jest reklamowany tylko przez Gatewaye z włączonym wykrywaniem Bonjour (domyślnie).

Rekordy wykrywania Wide-Area zawierają (TXT):

- `role` (wskazówka roli Gateway)
- `transport` (wskazówka transportu, np. `gateway`)
- `gatewayPort` (port WebSocket, zwykle `18789`)
- `sshPort` (opcjonalny; klienci domyślnie używają `22` dla celów SSH, gdy go brakuje)
- `tailnetDns` (nazwa hosta MagicDNS, gdy dostępna)
- `gatewayTls` / `gatewayTlsSha256` (TLS włączone + odcisk certyfikatu)
- `cliPath` (wskazówka zdalnej instalacji zapisywana do strefy rozległej)

### `gateway discover`

```bash
openclaw gateway discover
```

Opcje:

- `--timeout <ms>`: timeout dla polecenia (browse/resolve); domyślnie `2000`.
- `--json`: wyjście czytelne maszynowo (wyłącza też stylizację/spinner).

Przykłady:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Uwagi:

- CLI skanuje `local.` oraz skonfigurowaną domenę rozległą, gdy jest włączona.
- `wsUrl` w wyjściu JSON jest wyprowadzany z rozwiązanego punktu końcowego usługi, a nie ze wskazówek tylko TXT, takich jak `lanHost` lub `tailnetDns`.
- W `local.` mDNS `sshPort` i `cliPath` są rozgłaszane tylko wtedy, gdy
  `discovery.mdns.mode` ma wartość `full`. Wide-Area DNS-SD nadal zapisuje `cliPath`; `sshPort`
  również tam pozostaje opcjonalny.
