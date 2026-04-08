---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu głębszej diagnozy
    - Potrzebujesz stabilnych sekcji poradnika opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy poradnik rozwiązywania problemów z gateway, kanałami, automatyzacją, węzłami i przeglądarką
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-08T02:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02c9537845248db0c9d315bf581338a93215fe6fe3688ed96c7105cbb19fe6ba
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z gateway

Ta strona to szczegółowy poradnik.
Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz skorzystać z szybkiego procesu diagnostycznego.

## Drabina poleceń

Uruchom te polecenia najpierw, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego działania:

- `openclaw gateway status` pokazuje `Runtime: running` i `RPC probe: ok`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją ani usługą.
- `openclaw channels status --probe` pokazuje bieżący stan transportu dla każdego konta oraz,
  tam gdzie jest to obsługiwane, wyniki sondy/audytu, takie jak `works` lub `audit ok`.

## Anthropic 429: wymagane dodatkowe użycie dla długiego kontekstu

Użyj tego, gdy logi/błędy zawierają:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Szukaj:

- Wybrany model Anthropic Opus/Sonnet ma `params.context1m: true`.
- Bieżące poświadczenie Anthropic nie kwalifikuje się do użycia długiego kontekstu.
- Żądania kończą się niepowodzeniem tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki 1M beta.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agenta kończą się niepowodzeniem

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw kończą się niepowodzeniem tylko podczas zwykłych tur agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- małe bezpośrednie wywołania kończą się powodzeniem, ale uruchomienia OpenClaw kończą się niepowodzeniem tylko przy większych promptach
- błędów backendu dotyczących tego, że `messages[].content` ma oczekiwać ciągu znaków
- awarii backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca strukturalne części treści Chat Completions. Poprawka: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania kończą się powodzeniem, ale uruchomienia agenta OpenClaw kończą się niepowodzeniem z awariami backendu/modelu
  (na przykład Gemma w niektórych kompilacjach `inferrs`) → transport OpenClaw
  jest prawdopodobnie już poprawny; to backend zawodzi przy większym kształcie promptu środowiska uruchomieniowego agenta.
- niepowodzenia zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi
  były częścią obciążenia, ale pozostały problem nadal dotyczy pojemności modelu/serwera po stronie upstream albo błędu backendu.

Opcje naprawy:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących wyłącznie ciągi znaków.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie są w stanie
   niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Ogranicz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap obszaru roboczego, krótsza
   historia sesji, lżejszy model lokalny lub backend z lepszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż ulegają awarii
   wewnątrz backendu, potraktuj to jako ograniczenie serwera/modelu po stronie upstream i zgłoś tam
   reprodukcję z zaakceptowanym kształtem ładunku.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration#models](/pl/gateway/configuration#models)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę, zanim cokolwiek ponownie połączysz.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekiwania na parowanie dla nadawców wiadomości prywatnych.
- Wymogu wspomnienia w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności z listą dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa została zignorowana do czasu wspomnienia.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie chce się połączyć, sprawdź adres URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego adresu URL sondy i adresu URL dashboardu.
- Niezgodności trybu/tokena uwierzytelniania między klientem a gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst lub brak uwierzytelnienia urządzenia.
- `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki innego niż loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał nieprawidłowy
  ładunek (albo użył nieaktualnego znacznika czasu) dla bieżącego uzgadniania.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z użyciem buforowanego tokena urządzenia.
- Ta ponowna próba z użyciem tokena z pamięci podręcznej wykorzystuje zestaw zakresów przechowywany z powiązanym
  tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego
  żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania połączenia jest następujące: jawny współdzielony
  token/hasło najpierw, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a następnie token bootstrap.
- Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim ogranicznik zarejestruje niepowodzenie. Dwie błędne
  równoczesne ponowne próby od tego samego klienta mogą więc skutkować `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` z klienta loopback o pochodzeniu przeglądarki
  → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa osobnego zasobnika.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokena/tokena urządzenia; odśwież konfigurację tokena i ponownie zatwierdź/obróć token urządzenia, jeśli to konieczne.
- `gateway connect failed:` → nieprawidłowy host/port/docelowy adres URL.

### Szybka mapa szczegółowych kodów uwierzytelniania

Użyj `error.details.code` z nieudanego połączenia `connect`, aby wybrać następne działanie:

| Detail code                  | Znaczenie                                                | Zalecane działanie                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokena.     | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboardu: `openclaw config get gateway.auth.token`, a następnie wklej go do ustawień Control UI.                                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie pasował do tokena auth gateway.  | Jeśli `canRetryWithDeviceToken=true`, zezwól na jedną zaufaną ponowną próbę. Ponowne próby z tokenem z pamięci podręcznej wykorzystują zapisane zatwierdzone zakresy; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie powiedzie, wykonaj [listę kontrolną odzyskiwania po rozjeździe tokena](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token dla urządzenia jest nieaktualny lub cofnięty. | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI urządzeń](/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia jest znana, ale niezatwierdzona dla tej roli. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`.                                                                                                                                                                               |

Sprawdzenie migracji uwierzytelniania urządzenia v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest nieoczekiwanie odrzucane:

- sesje tokena sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma również `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora, które
  sesja wywołującego już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby uwierzytelniania gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/cli/devices)

## Usługa gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się w działaniu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Szukaj:

- `Runtime: stopped` z podpowiedziami dotyczącymi zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → tryb lokalny gateway nie jest włączony albo plik konfiguracji został uszkodzony i utracił `gateway.mode`. Poprawka: ustaw `gateway.mode="local"` w konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania gateway (token/hasło albo trusted-proxy tam, gdzie jest skonfigurowane).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne lub równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden gateway na maszynę; jeśli faktycznie potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/obszar roboczy. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale mimo to wyświetla blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Czy ostrzeżenie dotyczy zapasowej ścieżki SSH, wielu gateway, brakujących zakresów, czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/docelowych loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to celową konfigurację wielu gateway albo nieaktualne/zduplikowane listenery.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający był niedostępny na tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

## Kanał jest połączony, ale wiadomości nie przepływają

Jeśli stan kanału to connected, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymogów wspomnienia.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość została zignorowana przez politykę wspomnień grupowych.
- `pairing` / ślady oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie cron i heartbeat

Jeśli cron lub heartbeat nie uruchomił się albo nie dostarczył wyniku, najpierw sprawdź stan harmonogramu, a następnie cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Czy cron jest włączony i czy ma zaplanowane następne wybudzenie.
- Statusu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → cron jest wyłączony.
- `cron: timer tick failed` → tyknięcie harmonogramu nie powiodło się; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadanie nie jest wymagalne przy tym tyknięciu.
- `heartbeat: unknown accountId` → nieprawidłowy identyfikator konta dla celu dostarczenia heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel heartbeat został rozpoznany jako miejsce docelowe w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla konkretnego agenta) ma ustawienie `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego węzła kończy się niepowodzeniem

Jeśli węzeł jest sparowany, ale narzędzia nie działają, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Czy węzeł jest online z oczekiwanymi możliwościami.
- Przyznanych uprawnień systemu operacyjnego do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń wykonania i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja węzła musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie wykonania.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zostało zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie przeglądarki kończy się niepowodzeniem

Użyj tego, gdy działania narzędzia przeglądarki kończą się niepowodzeniem, mimo że sam gateway działa prawidłowo.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłowej ścieżki do wykonywalnego pliku przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` lub `unknown command 'browser'` → dołączony plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak / niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany adres URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany adres URL CDP ma nieprawidłowy lub wykraczający poza zakres port.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko dołączania nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć gniazda WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie zawiera pełnego pakietu Playwright; migawki ARIA i podstawowe zrzuty ekranu strony nadal mogą działać, ale nawigacja, migawki AI, zrzuty elementów według selektora CSS i eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu łączyło `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` z migawki, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki przesyłania plików Chrome MCP wymagają odwołań do migawek, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → wysyłaj po jednym przesłaniu na wywołanie w profilach Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → haki okien dialogowych w profilach Chrome MCP nie obsługują nadpisywania limitu czasu.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewportu / trybu ciemnego / ustawień regionalnych / trybu offline w profilach tylko dołączania lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji to dryf konfiguracji albo egzekwowanie bardziej rygorystycznych ustawień domyślnych.

### 1) Zmieniło się zachowanie uwierzytelniania i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą trafiać do zdalnego celu, podczas gdy lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → nieprawidłowy docelowy URL.
- `unauthorized` → punkt końcowy jest osiągalny, ale uwierzytelnianie jest błędne.

### 2) Ograniczenia dotyczące powiązań i uwierzytelniania są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania gateway: współdzielonego tokena/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` bez loopback.
- Stare klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania gateway.
- `RPC probe: failed` przy działającym runtime → gateway działa, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboardu/węzłów.
- Oczekujące zatwierdzenia parowania DM po zmianach polityki lub tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnienie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli po sprawdzeniach konfiguracja usługi i runtime nadal się różnią, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
