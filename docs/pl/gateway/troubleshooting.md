---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj po dokładniejszą diagnozę
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy runbook rozwiązywania problemów dla gateway, kanałów, automatyzacji, węzłów i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-11T02:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z gateway

Ta strona to szczegółowy runbook.
Jeśli najpierw chcesz skorzystać z szybkiego przepływu triage, zacznij od [/help/troubleshooting](/pl/help/troubleshooting).

## Drabina poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego działania:

- `openclaw gateway status` pokazuje `Runtime: running` i `RPC probe: ok`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją ani usługami.
- `openclaw channels status --probe` pokazuje aktywny stan transportu dla każdego konta oraz, tam gdzie jest to obsługiwane, wyniki probe/audytu, takie jak `works` lub `audit ok`.

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
- Żądania kończą się błędem tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania Anthropic z długim kontekstem są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta kończą się błędem

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw kończą się błędem tylko podczas zwykłych tur agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- małe bezpośrednie wywołania kończą się sukcesem, ale uruchomienia OpenClaw kończą się błędem tylko przy większych promptach
- błędów backendu o `messages[].content`, które oczekuje ciągu znaków
- awarii backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska uruchomieniowego agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend odrzuca strukturalne części treści Chat Completions. Naprawa: ustaw `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania kończą się sukcesem, ale uruchomienia agenta OpenClaw kończą się błędami backendu/modelu (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw najprawdopodobniej jest już poprawny; backend nie radzi sobie z większym kształtem promptu środowiska uruchomieniowego agenta.
- błędy zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były częścią obciążenia, ale pozostały problem nadal leży po stronie upstream modelu/serwera albo jest błędem backendu.

Opcje naprawy:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących wyłącznie treść tekstową.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Tam, gdzie to możliwe, zmniejsz obciążenie promptu: mniejszy bootstrap workspace, krótsza historia sesji, lżejszy model lokalny albo backend z lepszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarie w backendzie, potraktuj to jako ograniczenie upstream serwera/modelu i zgłoś tam reprodukcję z zaakceptowanym kształtem payloadu.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration](/pl/gateway/configuration)
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

- Oczekującego parowania dla nadawców wiadomości prywatnych.
- Wymogu wzmianki w grupie (`requireMention`, `mentionPatterns`).
- Niezgodności listy dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa została zignorowana do momentu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie może się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego probe URL i dashboard URL.
- Niezgodności trybu/tokena uwierzytelniania między klientem a gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst lub brak uwierzytelniania urządzenia.
- `origin not allowed` → przeglądarkowe `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins` (albo łączysz się z pochodzenia przeglądarki innego niż loopback bez jawnej listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał nieprawidłowy payload (albo użył nieaktualnego znacznika czasu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z użyciem buforowanego tokena urządzenia.
- Ta ponowna próba z buforowanym tokenem używa ponownie zestawu zakresów przechowywanego wraz z tokenem sparowanego urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują swój żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby pierwszeństwo uwierzytelniania połączenia jest następujące: najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, ip}` są serializowane, zanim limiter zapisze niepowodzenie. Dwie błędne równoległe ponowne próby od tego samego klienta mogą więc spowodować `retry later` przy drugiej próbie zamiast dwóch zwykłych niezgodności.
- `too many failed authentication attempts (retry later)` z klienta loopback o pochodzeniu przeglądarkowym → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa osobnego kubełka.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokena/tokena urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
- `gateway connect failed:` → nieprawidłowy host/port/docelowy URL.

### Krótka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego wyniku `connect`, aby wybrać kolejne działanie:

| Kod szczegółu                | Znaczenie                                              | Zalecane działanie                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Klient nie wysłał wymaganego współdzielonego tokena.   | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Współdzielony token nie zgadzał się z tokenem gateway auth. | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedną zaufaną ponowną próbę. Ponowne próby z buforowanym tokenem używają zapisanych zatwierdzonych zakresów; wywołania z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie udaje, wykonaj [listę kontrolną odzyskiwania po rozjeździe tokena](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token dla urządzenia jest nieaktualny lub cofnięty. | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI devices](/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Tożsamość urządzenia jest znana, ale niezatwierdzona dla tej roli. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`.                                                                                                                                                                               |

Kontrola migracji do device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i zweryfikuj, że:

1. czeka na `connect.challenge`
2. podpisuje payload powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest niespodziewanie odrzucane:

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że wywołujący ma również `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko takich zakresów operatora, które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby gateway auth)
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
openclaw gateway status --deep   # skanuje też usługi na poziomie systemu
```

Szukaj:

- `Runtime: stopped` z podpowiedziami dotyczącymi zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Podpowiedzi czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → lokalny tryb gateway nie jest włączony albo plik konfiguracyjny został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślną ścieżką konfiguracji jest `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki gateway auth (token/hasło albo trusted-proxy, jeśli skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją przestarzałe lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji należy utrzymywać jeden gateway na maszynę; jeśli rzeczywiście potrzebujesz więcej niż jednego, odizoluj porty oraz config/state/workspace. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia probe gateway

Użyj tego, gdy `openclaw gateway probe` dociera do jakiegoś celu, ale nadal wyświetla blok ostrzeżeń.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy fallbacku SSH, wielu gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację wielogatewayową albo nieaktualne/zduplikowane listenery.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający nie był dostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

## Kanał połączony, ale wiadomości nie przepływają

Jeśli stan kanału jest połączony, ale przepływ wiadomości nie działa, skup się na polityce, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Polityki DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymagań wzmianki.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość została zignorowana przez politykę wzmianki w grupie.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie został zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie cron i heartbeat

Jeśli cron lub heartbeat nie uruchomiły się albo nic nie dostarczyły, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczania.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Włączonego cron i obecnego następnego wybudzenia.
- Stanu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → cron jest wyłączony.
- `cron: timer tick failed` → tick harmonogramu zakończył się błędem; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są zaplanowane na ten tick.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczania heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel heartbeat został rozwiązany jako miejsce docelowe w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie dla konkretnego agenta) ma wartość `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Sparowane narzędzie węzła kończy się błędem

Jeśli węzeł jest sparowany, ale narzędzia nie działają, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Węzła online z oczekiwanymi możliwościami.
- Przyznanych przez system operacyjny uprawnień do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja węzła musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brakuje uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie przeglądarki kończy się błędem

Użyj tego, gdy działania narzędzia przeglądarki kończą się błędem, mimo że sam gateway działa prawidłowo.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy `plugins.allow` jest ustawione i zawiera `browser`.
- Prawidłowej ścieżki do pliku wykonywalnego przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` lub `unknown command 'browser'` → wbudowany plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak / niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy port lub port spoza zakresu.
- `No Chrome tabs found for profile="user"` → profil podłączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP nie jest osiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko-dołączenia nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie zawiera pełnego pakietu Playwright; migawki ARIA i podstawowe zrzuty ekranu strony nadal mogą działać, ale nawigacja, migawki AI, zrzuty ekranu elementów według selektorów CSS i eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu łączy `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` z migawki, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają odwołań do migawki, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → dla profili Chrome MCP wysyłaj jeden upload na wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → hooki dialogów w profilach Chrome MCP nie obsługują nadpisania timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport / dark-mode / locale / offline w profilach tylko-dołączenia lub zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji wynika z rozjazdu konfiguracji albo z bardziej rygorystycznie egzekwowanych ustawień domyślnych.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą kierować ruch do zdalnego celu, mimo że lokalna usługa działa prawidłowo.
- Jawne wywołania `--url` nie wracają do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → nieprawidłowy docelowy URL.
- `unauthorized` → endpoint jest osiągalny, ale auth jest nieprawidłowe.

### 2) Reguły bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki gateway auth: współdzielonego uwierzytelniania tokenem/hasłem albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` innego niż loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie inne niż loopback bez prawidłowej ścieżki gateway auth.
- `RPC probe: failed` przy działającym runtime → gateway działa, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/nodes.
- Oczekujące zatwierdzenia parowania DM po zmianach polityki lub tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli konfiguracja usługi i runtime nadal się nie zgadzają po tych kontrolach, ponownie zainstaluj metadane usługi z tego samego katalogu profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
