---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj po głębszą diagnozę
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy runbook rozwiązywania problemów dla gateway, kanałów, automatyzacji, nodeów i Browser
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-25T13:49:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona to szczegółowy runbook.
Jeśli najpierw chcesz szybki przepływ triage, zacznij od [/help/troubleshooting](/pl/help/troubleshooting).

## Drabina poleceń

Uruchom najpierw te polecenia, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane zdrowe sygnały:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz linię `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów config/usługi.
- `openclaw channels status --probe` pokazuje aktywny stan transportu dla każdego konta oraz,
  tam gdzie jest to obsługiwane, wyniki probe/audytu, takie jak `works` albo `audit ok`.

## Anthropic 429: dodatkowe użycie wymagane dla długiego kontekstu

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
- Żądania zawodzą tylko w długich sesjach/uruchomieniach modelu, które potrzebują ścieżki beta 1M.

Możliwe rozwiązania:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do normalnego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań długiego kontekstu, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania długiego kontekstu Anthropic są odrzucane.

Powiązane:

- [Anthropic](/pl/providers/anthropic)
- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Dlaczego widzę HTTP 429 z Anthropic?](/pl/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie probe, ale uruchomienia agenta zawodzą

Użyj tego, gdy:

- `curl ... /v1/models` działa
- małe bezpośrednie wywołania `/v1/chat/completions` działają
- uruchomienia modeli OpenClaw zawodzą tylko przy zwykłych turach agenta

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Szukaj:

- bezpośrednie małe wywołania kończą się powodzeniem, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędy backendu o `messages[].content` oczekującym ciągu
- awarie backendu, które pojawiają się tylko przy większej liczbie tokenów promptu lub pełnych promptach runtime agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca ustrukturyzowane części treści Chat Completions. Rozwiązanie: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- bezpośrednie małe żądania działają, ale uruchomienia agentów OpenClaw zawodzą z awariami backendu/modelu
  (na przykład Gemma w niektórych buildach `inferrs`) → transport OpenClaw
  prawdopodobnie jest już poprawny; backend zawodzi na większym kształcie promptu runtime agenta.
- błędy zmniejszają się po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi
  były częścią obciążenia, ale pozostały problem nadal dotyczy pojemności modelu/serwera upstream albo błędu backendu.

Możliwe rozwiązania:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią
   niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Zmniejsz obciążenie promptu tam, gdzie to możliwe: mniejszy bootstrap przestrzeni roboczej, krótsza
   historia sesji, lżejszy model lokalny albo backend z mocniejszym wsparciem dla długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż powodują awarię
   wewnątrz backendu, potraktuj to jako ograniczenie serwera/modelu upstream i zgłoś tam reprodukcję z akceptowanym kształtem ładunku.

Powiązane:

- [Modele lokalne](/pl/gateway/local-models)
- [Configuration](/pl/gateway/configuration)
- [Endpointy zgodne z OpenAI](/pl/gateway/configuration-reference#openai-compatible-endpoints)

## Brak odpowiedzi

Jeśli kanały działają, ale nic nie odpowiada, sprawdź routing i zasady przed ponownym łączeniem czegokolwiek.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Szukaj:

- Oczekujące parowanie dla nadawców DM.
- Ograniczanie wiadomości grupowych przez wzmianki (`requireMention`, `mentionPatterns`).
- Niedopasowania list dozwolonych kanału/grupy.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa zignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)

## Łączność Dashboard / Control UI

Gdy dashboard/control UI nie może się połączyć, sprawdź URL, tryb uwierzytelniania i założenia bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego URL probe i URL dashboard.
- Niedopasowania trybu uwierzytelniania/tokena między klientem a gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → kontekst niezabezpieczony albo brak uwierzytelniania urządzenia.
- `origin not allowed` → przeglądarkowe `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki spoza loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał nieprawidłowy
  ładunek (albo przestarzały znacznik czasu) dla bieżącego handshaku.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną próbę ponowienia z tokenem urządzenia z pamięci podręcznej.
- To ponowienie z tokenem z pamięci podręcznej ponownie używa zapisanego zestawu zakresów przechowywanego wraz ze sparowanym
  tokenem urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes` zachowują zamiast tego
  swój żądany zestaw zakresów.
- Poza tą ścieżką ponowienia pierwszeństwo uwierzytelniania przy `connect` to najpierw jawny współdzielony
  token/hasło, potem jawny `deviceToken`, następnie zapisany token urządzenia,
  a na końcu token bootstrap.
- W asynchronicznej ścieżce Control UI Tailscale Serve nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje niepowodzenie. Dwie błędne
  współbieżne próby od tego samego klienta mogą więc skutkować komunikatem `retry later`
  przy drugiej próbie zamiast dwoma zwykłymi niedopasowaniami.
- `too many failed authentication attempts (retry later)` od klienta loopback pochodzącego z przeglądarki
  → powtórzone nieudane próby z tego samego znormalizowanego `Origin` są tymczasowo blokowane; inne pochodzenie localhost używa osobnego kubełka.
- powtarzające się `unauthorized` po tym ponowieniu → rozjazd współdzielonego tokena/tokena urządzenia; odśwież config tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
- `gateway connect failed:` → nieprawidłowy host/port/cel URL.

### Szybka mapa szczegółowych kodów uwierzytelniania

Użyj `error.details.code` z nieudanego `connect`, aby wybrać następne działanie:

| Kod szczegółów              | Znaczenie                                                                                                                                                                                | Zalecane działanie                                                                                                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Klient nie wysłał wymaganego współdzielonego tokena.                                                                                                                                     | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboard: `openclaw config get gateway.auth.token`, a następnie wklej go do ustawień Control UI.                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`       | Współdzielony token nie pasował do tokena uwierzytelniania gateway.                                                                                                                      | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedno zaufane ponowienie. Ponowienia z tokenem z pamięci podręcznej ponownie używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal zawodzi, uruchom [listę kontrolną odzyskiwania po rozjechaniu tokenów](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Buforowany token per urządzenie jest nieaktualny albo unieważniony.                                                                                                                      | Obróć/ponownie zatwierdź token urządzenia za pomocą [CLI Devices](/pl/cli/devices), a następnie połącz się ponownie.                                                                                                                                                                         |
| `PAIRING_REQUIRED`          | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` pod kątem `not-paired`, `scope-upgrade`, `role-upgrade` lub `metadata-upgrade`, i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Rozszerzenia zakresów/ról używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                     |

Kontrola migracji device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/signature, zaktualizuj łączącego się klienta i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek powiązany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` są nieoczekiwanie odrzucane:

- sesje tokena sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma także `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko takich zakresów operatora,
  które sesja wywołującego już posiada

Powiązane:

- [Control UI](/pl/web/control-ui)
- [Configuration](/pl/gateway/configuration) (tryby uwierzytelniania gateway)
- [Trusted proxy auth](/pl/gateway/trusted-proxy-auth)
- [Dostęp zdalny](/pl/gateway/remote)
- [Devices](/pl/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces nie utrzymuje się.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuj także usługi na poziomie systemu
```

Szukaj:

- `Runtime: stopped` z podpowiedziami dotyczącymi zakończenia.
- Niedopasowania config usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Wskazówek czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` albo `existing config is missing gateway.mode` → tryb lokalny gateway nie jest włączony albo plik config został uszkodzony i utracił `gateway.mode`. Rozwiązanie: ustaw `gateway.mode="local"` w config albo ponownie uruchom `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwany config trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka config to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania gateway (token/hasło albo trusted-proxy, jeśli skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne albo równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jeden gateway na maszynę; jeśli naprawdę potrzebujesz więcej niż jednego, odizoluj porty + config/state/przestrzeń roboczą. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [Background exec and process tool](/pl/gateway/background-process)
- [Configuration](/pl/gateway/configuration)
- [Doctor](/pl/gateway/doctor)

## Gateway przywrócił ostatni poprawny config

Użyj tego, gdy Gateway się uruchamia, ale logi mówią, że przywrócono `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Szukaj:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- pliku `openclaw.json.clobbered.*` ze znacznikiem czasu obok aktywnego config
- zdarzenia systemowego głównego agenta zaczynającego się od `Config recovery warning`

Co się stało:

- Odrzucony config nie przeszedł walidacji podczas uruchamiania albo hot reload.
- OpenClaw zachował odrzucony ładunek jako `.clobbered.*`.
- Aktywny config został przywrócony z ostatniej zwalidowanej kopii last-known-good.
- Następna tura głównego agenta dostaje ostrzeżenie, aby nie przepisywać bezrefleksyjnie odrzuconego config.
- Jeśli wszystkie problemy walidacji były pod `plugins.entries.<id>...`, OpenClaw
  nie przywróci całego pliku. Awarie lokalne Plugin pozostają głośne, podczas gdy niezwiązane
  ustawienia użytkownika pozostają w aktywnym config.

Sprawdzenie i naprawa:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Typowe sygnatury:

- istnieje `.clobbered.*` → zewnętrzna bezpośrednia edycja albo odczyt przy uruchamianiu został przywrócony.
- istnieje `.rejected.*` → zapis config należący do OpenClaw nie przeszedł sprawdzeń schematu albo clobber przed zatwierdzeniem.
- `Config write rejected:` → zapis próbował usunąć wymagany kształt, gwałtownie zmniejszyć plik albo utrwalić nieprawidłowy config.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` albo `size-drop-vs-last-good:*` → uruchamianie potraktowało bieżący plik jako clobbered, ponieważ utracił pola albo rozmiar względem kopii last-known-good.
- `Config last-known-good promotion skipped` → kandydat zawierał placeholdery zredagowanych sekretów, takie jak `***`.

Możliwe rozwiązania:

1. Zachowaj przywrócony aktywny config, jeśli jest poprawny.
2. Skopiuj tylko zamierzone klucze z `.clobbered.*` albo `.rejected.*`, a następnie zastosuj je przez `openclaw config set` albo `config.patch`.
3. Uruchom `openclaw config validate` przed restartem.
4. Jeśli edytujesz ręcznie, zachowaj pełny config JSON5, a nie tylko częściowy obiekt, który chciałeś zmienić.

Powiązane:

- [Configuration: strict validation](/pl/gateway/configuration#strict-validation)
- [Configuration: hot reload](/pl/gateway/configuration#config-hot-reload)
- [Config](/pl/cli/config)
- [Doctor](/pl/gateway/doctor)

## Ostrzeżenia probe Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wypisuje blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w danych wyjściowych JSON.
- Czy ostrzeżenie dotyczy zapasowego SSH, wielu gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH się nie powiodła, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację wielu gateway albo nieaktualne/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie zadziałało, ale szczegółowe RPC jest ograniczone przez zakres; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` albo `gateway closed (1008): pairing required` → gateway odpowiedział, ale ten klient nadal potrzebuje parowania/zatwierdzenia przed zwykłym dostępem operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał uwierzytelniania był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [Gateway](/pl/cli/gateway)
- [Wiele gateway na tym samym hoście](/pl/gateway#multiple-gateways-same-host)
- [Dostęp zdalny](/pl/gateway/remote)

## Kanał połączony, ale wiadomości nie płyną

Jeśli stan kanału to connected, ale przepływ wiadomości nie działa, skup się na zasadach, uprawnieniach i regułach dostarczania specyficznych dla kanału.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Szukaj:

- Zasad DM (`pairing`, `allowlist`, `open`, `disabled`).
- Listy dozwolonych grup i wymagań wzmianki.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianek grupowych.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
- [WhatsApp](/pl/channels/whatsapp)
- [Telegram](/pl/channels/telegram)
- [Discord](/pl/channels/discord)

## Dostarczanie Cron i Heartbeat

Jeśli Cron albo Heartbeat nie uruchomił się lub nie dostarczył wyniku, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Czy Cron jest włączony i ma następne wybudzenie.
- Stanu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pominięcia Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
- `cron: timer tick failed` → nieudane tyknięcie harmonogramu; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne przy tym tyknięciu.
- `heartbeat: unknown accountId` → nieprawidłowe ID konta dla celu dostarczania Heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do celu w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (albo nadpisanie per agent) ma wartość `block`.

Powiązane:

- [Zadania harmonogramowane: rozwiązywanie problemów](/pl/automation/cron-jobs#troubleshooting)
- [Zadania harmonogramowane](/pl/automation/cron-jobs)
- [Heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego node zawodzi

Jeśli node jest sparowany, ale narzędzia zawodzą, wyizoluj stan foreground, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Czy node jest online i ma oczekiwane możliwości.
- Nadanych przez system operacyjny uprawnień do kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i list dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemowego.
- `SYSTEM_RUN_DENIED: approval required` → oczekujące zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [Rozwiązywanie problemów z nodeami](/pl/nodes/troubleshooting)
- [Nodes](/pl/nodes/index)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Narzędzie Browser zawodzi

Użyj tego, gdy działania narzędzia Browser zawodzą, mimo że sam gateway jest zdrowy.

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

- `unknown command "browser"` albo `unknown command 'browser'` → dołączony Plugin browser jest wykluczony przez `plugins.allow`.
- brak / niedostępność narzędzia browser mimo `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` albo `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma błędny albo niedozwolony port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session nie mógł jeszcze dołączyć do wybranego katalogu danych przeglądarki. Otwórz stronę inspekcji przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy monit o dołączenie, a potem spróbuj ponownie. Jeśli zalogowany stan nie jest wymagany, preferuj zarządzany profil `openclaw`.
- `No Chrome tabs found for profile="user"` → profil dołączania Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny endpoint CDP nie jest osiągalny z hosta gateway.
- `Browser attachOnly is enabled ... not reachable` albo `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only nie ma osiągalnego celu albo endpoint HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocketu CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja gateway nie ma dołączonej zależności runtime `playwright-core` dla Plugin browser; uruchom `openclaw doctor --fix`, a potem zrestartuj gateway. Snapshoty ARIA i podstawowe zrzuty ekranu stron nadal mogą działać, ale nawigacja, snapshoty AI, zrzuty ekranu elementów po selektorach CSS oraz eksport PDF pozostają niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu łączyło `--full-page` z `--ref` albo `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` ze snapshotu, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → haki uploadu Chrome MCP wymagają ref ze snapshotu, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → na profilach Chrome MCP wysyłaj jeden upload na wywołanie.
- `existing-session dialog handling does not support timeoutMs.` → haki dialogów na profilach Chrome MCP nie obsługują nadpisania limitu czasu.
- `existing-session type does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:type` na profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest własny limit czasu.
- `existing-session evaluate does not support timeoutMs overrides.` → pomiń `timeoutMs` dla `act:evaluate` na profilach `profile="user"` / Chrome MCP existing-session albo użyj zarządzanego/CDP profilu przeglądarki, gdy wymagany jest własny limit czasu.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewportu / dark-mode / locale / offline na profilach attach-only albo zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego gateway.

Powiązane:

- [Rozwiązywanie problemów z Browser](/pl/tools/browser-linux-troubleshooting)
- [Browser (zarządzany przez OpenClaw)](/pl/tools/browser)

## Jeśli po aktualizacji coś nagle się zepsuło

Większość problemów po aktualizacji to rozjazd config albo egzekwowanie bardziej rygorystycznych wartości domyślnych.

### 1) Zmieniło się zachowanie uwierzytelniania i nadpisania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą kierować do zdalnego gateway, podczas gdy lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie używają zapasowo zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → nieprawidłowy docelowy URL.
- `unauthorized` → endpoint jest osiągalny, ale uwierzytelnianie jest nieprawidłowe.

### 2) Guardraile bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Bindowania poza loopback (`lan`, `tailnet`, `custom`) potrzebują prawidłowej ścieżki uwierzytelniania gateway: współdzielonego tokena/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` poza loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania gateway.
- `Connectivity probe: failed` przy działającym runtime → gateway żyje, ale jest niedostępny przy bieżącym auth/url.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/nodeów.
- Oczekujące zatwierdzenia parowania DM po zmianach zasad albo tożsamości.

Typowe sygnatury:

- `device identity required` → uwierzytelnianie urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzony.

Jeśli config usługi i runtime nadal się nie zgadzają po sprawdzeniach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [Parowanie zarządzane przez Gateway](/pl/gateway/pairing)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Background exec and process tool](/pl/gateway/background-process)

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Doctor](/pl/gateway/doctor)
- [FAQ](/pl/help/faq)
