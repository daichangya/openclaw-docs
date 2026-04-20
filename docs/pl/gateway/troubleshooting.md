---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj w celu przeprowadzenia głębszej diagnostyki.
    - Potrzebujesz stabilnych sekcji podręcznika opartych na objawach z dokładnymi poleceniami.
summary: Szczegółowy podręcznik rozwiązywania problemów dla Gateway, kanałów, automatyzacji, Node i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-20T09:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona jest szczegółowym podręcznikiem.
Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz skorzystać z szybkiego przepływu triage.

## Drabinka poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane sygnały zdrowego działania:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów z konfiguracją/usługą.
- `openclaw channels status --probe` pokazuje bieżący status transportu dla każdego konta oraz,
  tam gdzie jest to obsługiwane, wyniki probe/audit, takie jak `works` lub `audit ok`.

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
- Żądania kończą się niepowodzeniem tylko w długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań z długim kontekstem, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania Anthropic z długim kontekstem są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta kończą się niepowodzeniem

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
- błędów backendu mówiących, że `messages[].content` oczekuje ciągu znaków
- awarii backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach środowiska wykonawczego agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca strukturalne części zawartości Chat Completions. Naprawa: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania kończą się powodzeniem, ale uruchomienia agenta OpenClaw kończą się awariami backendu/modelu
  (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw
  prawdopodobnie jest już poprawny; to backend zawodzi na większym kształcie promptu
  środowiska wykonawczego agenta.
- awarie zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi
  były częścią obciążenia, ale pozostały problem nadal leży po stronie upstream:
  pojemności modelu/serwera albo błędu backendu.

Opcje naprawy:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących wyłącznie ciągi znaków.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią
   niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Zmniejsz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap workspace, krótsza
   historia sesji, lżejszy model lokalny albo backend z lepszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarie
   wewnątrz backendu, potraktuj to jako ograniczenie upstream serwera/modelu i zgłoś
   tam reprodukcję z zaakceptowanym kształtem ładunku.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i politykę, zanim ponownie połączysz cokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekiwania na parowanie dla nadawców wiadomości prywatnych.
- Wymuszania wzmianek w grupach (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa jest ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez politykę.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność dashboard/control UI

Gdy dashboard/control UI nie może się połączyć, sprawdź adres URL, tryb uwierzytelniania i założenia dotyczące bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego probe URL i dashboard URL.
- Niezgodności trybu uwierzytelniania/tokenu między klientem a Gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → kontekst nie jest bezpieczny albo brakuje uwierzytelnienia urządzenia.
- `origin not allowed` → `Origin` przeglądarki nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki innego niż loopback bez jawnej
  listy dozwolonych źródeł).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  opartego na wyzwaniu przepływu uwierzytelniania urządzenia (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył nieaktualnego znacznika czasu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z użyciem pamiętanego tokenu urządzenia.
- Ta ponowna próba z użyciem pamiętanego tokenu ponownie wykorzystuje przechowywany zestaw zakresów powiązany ze sparowanym
  tokenem urządzenia. Wywołania z jawnym `deviceToken` / jawnymi `scopes` zachowują
  natomiast żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby, pierwszeństwo uwierzytelniania przy łączeniu wygląda tak: jawny współdzielony
  token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a na końcu token bootstrap.
- Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje niepowodzenie. Dwie błędne
  równoległe ponowne próby od tego samego klienta mogą więc spowodować odpowiedź `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` z klienta loopback o pochodzeniu przeglądarki
  → powtarzające się niepowodzenia z tego samego znormalizowanego `Origin` powodują
  tymczasową blokadę; inne pochodzenie localhost używa osobnego bucketu.
- powtarzające się `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokenu/tokenu urządzenia; odśwież konfigurację tokenu i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
- `gateway connect failed:` → nieprawidłowy host/port/docelowy URL.

### Szybka mapa kodów szczegółów uwierzytelniania

Użyj `error.details.code` z nieudanego `connect`, aby wybrać następne działanie:

| Kod szczegółu               | Znaczenie                                                                                                                                                                                    | Zalecane działanie                                                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Klient nie wysłał wymaganego współdzielonego tokenu.                                                                                                                                         | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej go w ustawieniach Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`       | Współdzielony token nie pasował do tokenu uwierzytelniania Gateway.                                                                                                                         | Jeśli `canRetryWithDeviceToken=true`, dopuść jedną zaufaną ponowną próbę. Ponowne próby z pamiętanym tokenem używają zapisanych zatwierdzonych zakresów; wywołania z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal się nie uda, wykonaj [listę kontrolną odzyskiwania po rozjeździe tokenów](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Pamiętany token dla urządzenia jest nieaktualny albo cofnięty.                                                                                                                             | Obróć/ponownie zatwierdź token urządzenia przy użyciu [CLI urządzeń](/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                 |
| `PAIRING_REQUIRED`          | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason`, czy jest to `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade`, i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Podwyższenia zakresu/roli używają tego samego przepływu po przejrzeniu żądanego dostępu.                                                                                |

Kontrola migracji device auth v2:

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

- sesje tokenów sparowanych urządzeń mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko tych zakresów operatora,
  które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się w działaniu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuje też usługi na poziomie systemu
```

Szukaj:

- `Runtime: stopped` ze wskazówkami dotyczącymi zakończenia.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/nasłuchu.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` lub `existing config is missing gateway.mode` → tryb lokalny Gateway nie jest włączony albo plik konfiguracyjny został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w swojej konfiguracji albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie odcisnąć oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → dowiązanie do adresu innego niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo `trusted-proxy`, jeśli jest skonfigurowane).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją przestarzałe lub równoległe jednostki launchd/systemd/schtasks. W większości konfiguracji powinien działać jeden Gateway na maszynę; jeśli rzeczywiście potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/workspace. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia probe Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wyświetla blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyjściu JSON.
- Czy ostrzeżenie dotyczy fallback SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych auth ref.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację z wieloma Gateway albo przestarzałe/zduplikowane nasłuchujące procesy.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC są ograniczone zakresem; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` lub `gateway closed (1008): pairing required` → Gateway odpowiedział, ale ten klient nadal wymaga parowania/zatwierdzenia przed uzyskaniem zwykłego dostępu operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniający był niedostępny w tej ścieżce polecenia dla nieudanego celu.

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
- Listy dozwolonych grup i wymagań dotyczących wzmianek.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość została zignorowana przez politykę wymuszającą wzmianki w grupie.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie Cron i Heartbeat

Jeśli Cron lub Heartbeat nie uruchomił się albo nie dostarczył wyniku, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Czy Cron jest włączony i czy obecny jest następny czas wybudzenia.
- Statusu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → Cron jest wyłączony.
- `cron: timer tick failed` → niepowodzenie tyknięcia harmonogramu; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste wiersze / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne z zadań nie przypada na to tyknięcie.
- `heartbeat: unknown accountId` → nieprawidłowy account id dla celu dostarczenia Heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (lub nadpisanie per agent) ma wartość `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego Node kończy się niepowodzeniem

Jeśli Node jest sparowany, ale narzędzia kończą się niepowodzeniem, odizoluj stan pierwszego planu, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Czy Node jest online z oczekiwanymi możliwościami.
- Przyznania uprawnień systemu operacyjnego dla kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez allowlist.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie przeglądarki kończy się niepowodzeniem

Użyj tego, gdy działania narzędzia przeglądarki kończą się niepowodzeniem, mimo że sam Gateway działa prawidłowo.

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

- `unknown command "browser"` lub `unknown command 'browser'` → dołączony Plugin przeglądarki jest wykluczony przez `plugins.allow`.
- brak/niedostępność narzędzia przeglądarki przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → nie udało się uruchomić procesu przeglądarki.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` lub `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma nieprawidłowy port albo port spoza zakresu.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP nie jest osiągalny z hosta Gateway.
- `Browser attachOnly is enabled ... not reachable` lub `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil wyłącznie dołączany nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma pełnego pakietu Playwright; snapshoty ARIA i podstawowe zrzuty ekranu stron nadal mogą działać, ale nawigacja, snapshoty AI, zrzuty ekranu elementów według selektora CSS oraz eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu łączyło `--full-page` z `--ref` lub `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwytywania strony albo `--ref` ze snapshotu, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki przesyłania plików Chrome MCP wymagają referencji snapshotu, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → w profilach Chrome MCP wysyłaj jedno przesłanie na jedno wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → hooki okien dialogowych w profilach Chrome MCP nie obsługują nadpisania limitu czasu.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport/dark-mode/locale/offline w profilach wyłącznie dołączanych albo zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez ponownego uruchamiania całego Gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle przestało działać

Większość problemów po aktualizacji to rozjazd konfiguracji albo bardziej rygorystyczne domyślne ustawienia, które są teraz egzekwowane.

### 1) Zmieniło się zachowanie uwierzytelniania i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą kierować ruch do zdalnego celu, podczas gdy lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie przełączają się awaryjnie na zapisane poświadczenia.

Typowe sygnatury:

- `gateway connect failed:` → nieprawidłowy docelowy URL.
- `unauthorized` → endpoint jest osiągalny, ale uwierzytelnianie jest nieprawidłowe.

### 2) Ograniczenia bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Dowiązania inne niż loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki uwierzytelniania Gateway: współdzielonego tokenu/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → dowiązanie inne niż loopback bez prawidłowej ścieżki uwierzytelniania Gateway.
- `Connectivity probe: failed` przy działającym runtime → Gateway działa, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/nodes.
- Oczekujące zatwierdzenia parowania DM po zmianach polityki albo tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli po tych kontrolach konfiguracja usługi i runtime nadal się różnią, ponownie zainstaluj metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
