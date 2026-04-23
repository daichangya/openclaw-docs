---
read_when:
    - Centrum rozwiązywania problemów skierowało Cię tutaj po głębszą diagnozę
    - Potrzebujesz stabilnych sekcji runbooka opartych na objawach z dokładnymi poleceniami
summary: Szczegółowy runbook rozwiązywania problemów dla Gateway, kanałów, automatyzacji, Node i przeglądarki
title: Rozwiązywanie problemów
x-i18n:
    generated_at: "2026-04-23T10:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z Gateway

Ta strona to szczegółowy runbook.
Zacznij od [/help/troubleshooting](/pl/help/troubleshooting), jeśli najpierw chcesz przejść szybki przepływ triage.

## Drabina poleceń

Uruchom je najpierw, w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Oczekiwane zdrowe sygnały:

- `openclaw gateway status` pokazuje `Runtime: running`, `Connectivity probe: ok` oraz wiersz `Capability: ...`.
- `openclaw doctor` nie zgłasza blokujących problemów konfiguracji/usługi.
- `openclaw channels status --probe` pokazuje żywy stan transportu per konto oraz,
  tam gdzie jest to obsługiwane, wyniki sondy/audytu takie jak `works` lub `audit ok`.

## Anthropic 429: extra usage required for long context

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
- Żądania zawodzą tylko przy długich sesjach/uruchomieniach modelu, które wymagają ścieżki beta 1M.

Opcje naprawy:

1. Wyłącz `context1m` dla tego modelu, aby wrócić do zwykłego okna kontekstu.
2. Użyj poświadczenia Anthropic, które kwalifikuje się do żądań z długim kontekstem, albo przełącz się na klucz API Anthropic.
3. Skonfiguruj modele zapasowe, aby uruchomienia były kontynuowane, gdy żądania Anthropic z długim kontekstem są odrzucane.

Powiązane:

- [/providers/anthropic](/pl/providers/anthropic)
- [/reference/token-use](/pl/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pl/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokalny backend zgodny z OpenAI przechodzi bezpośrednie sondy, ale uruchomienia agenta zawodzą

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

- małe bezpośrednie wywołania przechodzą, ale uruchomienia OpenClaw zawodzą tylko przy większych promptach
- błędów backendu o `messages[].content`, które oczekuje ciągu znaków
- awarii backendu, które pojawiają się tylko przy większej liczbie tokenów promptu albo pełnych
  promptach runtime agenta

Typowe sygnatury:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  odrzuca ustrukturyzowane części zawartości Chat Completions. Naprawa: ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- małe bezpośrednie żądania przechodzą, ale uruchomienia agenta OpenClaw zawodzą z awariami backendu/modelu
  (na przykład Gemma na niektórych buildach `inferrs`) → transport OpenClaw
  prawdopodobnie jest już poprawny; to backend zawodzi na większym kształcie promptu
  runtime agenta.
- błędy maleją po wyłączeniu narzędzi, ale nie znikają → schematy narzędzi były
  częścią presji, ale pozostały problem nadal leży upstream w pojemności modelu/serwera
  albo błędzie backendu.

Opcje naprawy:

1. Ustaw `compat.requiresStringContent: true` dla backendów Chat Completions obsługujących tylko ciągi.
2. Ustaw `compat.supportsTools: false` dla modeli/backendów, które nie potrafią
   niezawodnie obsłużyć powierzchni schematu narzędzi OpenClaw.
3. Ogranicz presję promptu tam, gdzie to możliwe: mniejszy bootstrap obszaru roboczego, krótsza historia
   sesji, lżejszy model lokalny albo backend z mocniejszą obsługą długiego kontekstu.
4. Jeśli małe bezpośrednie żądania nadal przechodzą, a tury agenta OpenClaw wciąż awariują
   w backendzie, traktuj to jako ograniczenie upstream serwera/modelu i złóż
   tam reprodukcję z zaakceptowanym kształtem ładunku.

Powiązane:

- [/gateway/local-models](/pl/gateway/local-models)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pl/gateway/configuration-reference#openai-compatible-endpoints)

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

- Oczekującego parowania dla nadawców DM.
- Ograniczania wiadomości grupowych do wzmianek (`requireMention`, `mentionPatterns`).
- Niezgodności list dozwolonych kanałów/grup.

Typowe sygnatury:

- `drop guild message (mention required` → wiadomość grupowa ignorowana do czasu wzmianki.
- `pairing request` → nadawca wymaga zatwierdzenia.
- `blocked` / `allowlist` → nadawca/kanał został odfiltrowany przez zasady.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/pairing](/pl/channels/pairing)
- [/channels/groups](/pl/channels/groups)

## Łączność interfejsu dashboard/control ui

Gdy dashboard/control UI nie może się połączyć, zweryfikuj URL, tryb uwierzytelniania i założenia bezpiecznego kontekstu.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Szukaj:

- Poprawnego URL sondy i URL dashboardu.
- Niezgodności trybu uwierzytelniania/tokena między klientem a Gateway.
- Użycia HTTP tam, gdzie wymagana jest tożsamość urządzenia.

Typowe sygnatury:

- `device identity required` → niezabezpieczony kontekst albo brak uwierzytelniania urządzenia.
- `origin not allowed` → przeglądarkowe `Origin` nie znajduje się w `gateway.controlUi.allowedOrigins`
  (albo łączysz się z pochodzenia przeglądarki spoza loopback bez jawnej
  listy dozwolonych).
- `device nonce required` / `device nonce mismatch` → klient nie kończy
  przepływu uwierzytelniania urządzenia opartego na wyzwaniu (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → klient podpisał niewłaściwy
  ładunek (albo użył nieaktualnego timestampu) dla bieżącego handshake.
- `AUTH_TOKEN_MISMATCH` z `canRetryWithDeviceToken=true` → klient może wykonać jedną zaufaną ponowną próbę z zapisanym tokenem urządzenia.
- Ta ponowna próba z zapisanym tokenem używa ponownie zapisanego zestawu zakresów powiązanego
  z tokenem sparowanego urządzenia. Wywołujący z jawnym `deviceToken` / jawnymi `scopes`
  zachowują zamiast tego żądany zestaw zakresów.
- Poza tą ścieżką ponownej próby priorytet uwierzytelniania połączenia to najpierw jawny współdzielony
  token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia,
  a następnie token bootstrap.
- W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego
  `{scope, ip}` są serializowane, zanim limiter zarejestruje porażkę. Dwie błędne
  równoległe ponowne próby od tego samego klienta mogą więc zwrócić `retry later`
  przy drugiej próbie zamiast dwóch zwykłych niedopasowań.
- `too many failed authentication attempts (retry later)` od klienta loopback z pochodzeniem przeglądarki
  → powtarzane niepowodzenia z tego samego znormalizowanego `Origin` są tymczasowo blokowane;
  inne pochodzenie localhost używa osobnego koszyka.
- powtarzane `unauthorized` po tej ponownej próbie → rozjazd współdzielonego tokena/tokena urządzenia; odśwież konfigurację tokena i w razie potrzeby ponownie zatwierdź/obróć token urządzenia.
- `gateway connect failed:` → zły host/port/docelowy URL.

### Krótka mapa kodów szczegółów auth

Użyj `error.details.code` z nieudanego `connect`, aby wybrać następne działanie:

| Kod szczegółu               | Znaczenie                                                                                                                                                                                   | Zalecane działanie                                                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Klient nie wysłał wymaganego współdzielonego tokena.                                                                                                                                       | Wklej/ustaw token w kliencie i spróbuj ponownie. Dla ścieżek dashboardu: `openclaw config get gateway.auth.token`, a następnie wklej do ustawień Control UI.                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`       | Współdzielony token nie pasował do tokena auth Gateway.                                                                                                                                    | Jeśli `canRetryWithDeviceToken=true`, pozwól na jedną zaufaną ponowną próbę. Ponowne próby z zapisanym tokenem używają zapisanych zatwierdzonych zakresów; wywołujący z jawnym `deviceToken` / `scopes` zachowują żądane zakresy. Jeśli nadal nie działa, uruchom [token drift recovery checklist](/pl/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zapisany token per urządzenie jest nieaktualny albo cofnięty.                                                                                                                              | Obróć/ponownie zatwierdź token urządzenia przez [CLI devices](/pl/cli/devices), a następnie połącz ponownie.                                                                                                                                                                            |
| `PAIRING_REQUIRED`          | Tożsamość urządzenia wymaga zatwierdzenia. Sprawdź `error.details.reason` dla `not-paired`, `scope-upgrade`, `role-upgrade` albo `metadata-upgrade`, i użyj `requestId` / `remediationHint`, jeśli są obecne. | Zatwierdź oczekujące żądanie: `openclaw devices list`, a następnie `openclaw devices approve <requestId>`. Ulepszenia zakresów/ról używają tego samego przepływu po sprawdzeniu żądanego dostępu.                                                                                |

Kontrola migracji device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Jeśli logi pokazują błędy nonce/podpisu, zaktualizuj łączącego się klienta i sprawdź, czy:

1. czeka na `connect.challenge`
2. podpisuje ładunek związany z wyzwaniem
3. wysyła `connect.params.device.nonce` z tym samym nonce wyzwania

Jeśli `openclaw devices rotate` / `revoke` / `remove` jest nieoczekiwanie odrzucane:

- sesje tokena sparowanego urządzenia mogą zarządzać tylko **własnym** urządzeniem, chyba że
  wywołujący ma też `operator.admin`
- `openclaw devices rotate --scope ...` może żądać tylko zakresów operatora,
  które sesja wywołująca już posiada

Powiązane:

- [/web/control-ui](/pl/web/control-ui)
- [/gateway/configuration](/pl/gateway/configuration) (tryby uwierzytelniania Gateway)
- [/gateway/trusted-proxy-auth](/pl/gateway/trusted-proxy-auth)
- [/gateway/remote](/pl/gateway/remote)
- [/cli/devices](/pl/cli/devices)

## Usługa Gateway nie działa

Użyj tego, gdy usługa jest zainstalowana, ale proces się nie utrzymuje.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # skanuje też usługi na poziomie systemu
```

Szukaj:

- `Runtime: stopped` z podpowiedziami o wyjściu.
- Niezgodności konfiguracji usługi (`Config (cli)` vs `Config (service)`).
- Konfliktów portów/listenerów.
- Dodatkowych instalacji launchd/systemd/schtasks przy użyciu `--deep`.
- Podpowiedzi czyszczenia `Other gateway-like services detected (best effort)`.

Typowe sygnatury:

- `Gateway start blocked: set gateway.mode=local` albo `existing config is missing gateway.mode` → lokalny tryb Gateway nie jest włączony albo plik konfiguracji został nadpisany i utracił `gateway.mode`. Naprawa: ustaw `gateway.mode="local"` w konfiguracji albo uruchom ponownie `openclaw onboard --mode local` / `openclaw setup`, aby ponownie zapisać oczekiwaną konfigurację trybu lokalnego. Jeśli uruchamiasz OpenClaw przez Podman, domyślna ścieżka konfiguracji to `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki uwierzytelniania Gateway (token/hasło albo trusted-proxy tam, gdzie skonfigurowano).
- `another gateway instance is already listening` / `EADDRINUSE` → konflikt portu.
- `Other gateway-like services detected (best effort)` → istnieją nieaktualne albo równoległe jednostki launchd/systemd/schtasks. Większość konfiguracji powinna utrzymywać jedno Gateway na maszynę; jeśli naprawdę potrzebujesz więcej niż jednego, odizoluj porty + konfigurację/stan/obszar roboczy. Zobacz [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host).

Powiązane:

- [/gateway/background-process](/pl/gateway/background-process)
- [/gateway/configuration](/pl/gateway/configuration)
- [/gateway/doctor](/pl/gateway/doctor)

## Gateway przywróciło ostatnią poprawną konfigurację

Użyj tego, gdy Gateway uruchamia się, ale logi mówią, że przywrócono `openclaw.json`.

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
- pliku `openclaw.json.clobbered.*` ze znacznikiem czasu obok aktywnej konfiguracji
- zdarzenia systemowego głównego agenta zaczynającego się od `Config recovery warning`

Co się stało:

- Odrzucona konfiguracja nie przeszła walidacji podczas uruchamiania albo hot reload.
- OpenClaw zachowało odrzucony ładunek jako `.clobbered.*`.
- Aktywna konfiguracja została przywrócona z ostatniej zwalidowanej kopii last-known-good.
- Następna tura głównego agenta otrzymuje ostrzeżenie, aby nie przepisywać ślepo odrzuconej konfiguracji.

Sprawdzenie i naprawa:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Typowe sygnatury:

- istnieje `.clobbered.*` → zewnętrzna bezpośrednia edycja albo odczyt podczas uruchamiania został przywrócony.
- istnieje `.rejected.*` → zapis konfiguracji należący do OpenClaw nie przeszedł sprawdzeń schematu albo clobber przed zatwierdzeniem.
- `Config write rejected:` → zapis próbował usunąć wymagany kształt, mocno zmniejszyć plik albo zapisać nieprawidłową konfigurację.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` albo `size-drop-vs-last-good:*` → podczas uruchamiania bieżący plik został uznany za clobbered, bo utracił pola albo rozmiar względem kopii last-known-good.
- `Config last-known-good promotion skipped` → kandydat zawierał placeholdery zredagowanych sekretów, takie jak `***`.

Opcje naprawy:

1. Zachowaj przywróconą aktywną konfigurację, jeśli jest poprawna.
2. Skopiuj tylko zamierzone klucze z `.clobbered.*` albo `.rejected.*`, a następnie zastosuj je przez `openclaw config set` albo `config.patch`.
3. Uruchom `openclaw config validate` przed restartem.
4. Jeśli edytujesz ręcznie, zachowaj pełną konfigurację JSON5, a nie tylko częściowy obiekt, który chciałeś zmienić.

Powiązane:

- [/gateway/configuration#strict-validation](/pl/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/pl/gateway/configuration#config-hot-reload)
- [/cli/config](/pl/cli/config)
- [/gateway/doctor](/pl/gateway/doctor)

## Ostrzeżenia sondy Gateway

Użyj tego, gdy `openclaw gateway probe` dociera do celu, ale nadal wypisuje blok ostrzeżenia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Szukaj:

- `warnings[].code` i `primaryTargetId` w wyniku JSON.
- Czy ostrzeżenie dotyczy zapasowej ścieżki SSH, wielu Gateway, brakujących zakresów czy nierozwiązanych odwołań auth.

Typowe sygnatury:

- `SSH tunnel failed to start; falling back to direct probes.` → konfiguracja SSH nie powiodła się, ale polecenie nadal próbowało bezpośrednich skonfigurowanych/celów loopback.
- `multiple reachable gateways detected` → odpowiedział więcej niż jeden cel. Zwykle oznacza to zamierzoną konfigurację wielu Gateway albo nieaktualne/zduplikowane listenery.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → połączenie działa, ale szczegółowe RPC jest ograniczone przez zakresy; sparuj tożsamość urządzenia albo użyj poświadczeń z `operator.read`.
- `Capability: pairing-pending` albo `gateway closed (1008): pairing required` → Gateway odpowiedziało, ale ten klient nadal wymaga sparowania/zatwierdzenia przed zwykłym dostępem operatora.
- nierozwiązany tekst ostrzeżenia `gateway.auth.*` / `gateway.remote.*` SecretRef → materiał auth był niedostępny w tej ścieżce polecenia dla nieudanego celu.

Powiązane:

- [/cli/gateway](/pl/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pl/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pl/gateway/remote)

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
- Listy dozwolonych grup i wymagań wzmianek.
- Brakujących uprawnień/zakresów API kanału.

Typowe sygnatury:

- `mention required` → wiadomość zignorowana przez zasady wzmianki grupowej.
- ślady `pairing` / oczekującego zatwierdzenia → nadawca nie jest zatwierdzony.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problem z uwierzytelnianiem/uprawnieniami kanału.

Powiązane:

- [/channels/troubleshooting](/pl/channels/troubleshooting)
- [/channels/whatsapp](/pl/channels/whatsapp)
- [/channels/telegram](/pl/channels/telegram)
- [/channels/discord](/pl/channels/discord)

## Dostarczanie Cron i Heartbeat

Jeśli Cron albo Heartbeat się nie uruchomił albo nie dostarczył wyniku, najpierw zweryfikuj stan harmonogramu, a potem cel dostarczenia.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Szukaj:

- Włączonego Cron i obecnego następnego wybudzenia.
- Stanu historii uruchomień zadania (`ok`, `skipped`, `error`).
- Powodów pomijania Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Typowe sygnatury:

- `cron: scheduler disabled; jobs will not run automatically` → Cron wyłączony.
- `cron: timer tick failed` → tyknięcie harmonogramu nie powiodło się; sprawdź błędy plików/logów/runtime.
- `heartbeat skipped` z `reason=quiet-hours` → poza oknem aktywnych godzin.
- `heartbeat skipped` z `reason=empty-heartbeat-file` → `HEARTBEAT.md` istnieje, ale zawiera tylko puste linie / nagłówki markdown, więc OpenClaw pomija wywołanie modelu.
- `heartbeat skipped` z `reason=no-tasks-due` → `HEARTBEAT.md` zawiera blok `tasks:`, ale żadne zadania nie są należne przy tym tyknięciu.
- `heartbeat: unknown accountId` → nieprawidłowe account id dla celu dostarczenia Heartbeat.
- `heartbeat skipped` z `reason=dm-blocked` → cel Heartbeat został rozwiązany do miejsca docelowego w stylu DM, podczas gdy `agents.defaults.heartbeat.directPolicy` (albo nadpisanie per agent) ma wartość `block`.

Powiązane:

- [/automation/cron-jobs#troubleshooting](/pl/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pl/automation/cron-jobs)
- [/gateway/heartbeat](/pl/gateway/heartbeat)

## Narzędzie sparowanego Node zawodzi

Jeśli Node jest sparowany, ale narzędzia zawodzą, odizoluj stan foreground, uprawnień i zatwierdzeń.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Szukaj:

- Node online z oczekiwanymi możliwościami.
- Nadanych uprawnień systemu operacyjnego dla kamery/mikrofonu/lokalizacji/ekranu.
- Stanu zatwierdzeń exec i listy dozwolonych.

Typowe sygnatury:

- `NODE_BACKGROUND_UNAVAILABLE` → aplikacja Node musi być na pierwszym planie.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → brak wymaganego uprawnienia systemu operacyjnego.
- `SYSTEM_RUN_DENIED: approval required` → oczekuje zatwierdzenie exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → polecenie zablokowane przez listę dozwolonych.

Powiązane:

- [/nodes/troubleshooting](/pl/nodes/troubleshooting)
- [/nodes/index](/pl/nodes/index)
- [/tools/exec-approvals](/pl/tools/exec-approvals)

## Narzędzie browser zawodzi

Użyj tego, gdy działania narzędzia browser zawodzą, mimo że samo Gateway jest zdrowe.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Szukaj:

- Czy ustawiono `plugins.allow` i czy zawiera `browser`.
- Prawidłowej ścieżki do pliku wykonywalnego przeglądarki.
- Osiągalności profilu CDP.
- Dostępności lokalnego Chrome dla profili `existing-session` / `user`.

Typowe sygnatury:

- `unknown command "browser"` albo `unknown command 'browser'` → bundlowany Plugin browser jest wykluczony przez `plugins.allow`.
- brakujące / niedostępne narzędzie browser przy `browser.enabled=true` → `plugins.allow` wyklucza `browser`, więc Plugin nigdy się nie załadował.
- `Failed to start Chrome CDP on port` → proces przeglądarki nie uruchomił się.
- `browser.executablePath not found` → skonfigurowana ścieżka jest nieprawidłowa.
- `browser.cdpUrl must be http(s) or ws(s)` → skonfigurowany URL CDP używa nieobsługiwanego schematu, takiego jak `file:` albo `ftp:`.
- `browser.cdpUrl has invalid port` → skonfigurowany URL CDP ma błędny albo spoza zakresu port.
- `Could not find DevToolsActivePort for chrome` → istniejąca sesja Chrome MCP nie mogła jeszcze podłączyć się do wybranego katalogu danych przeglądarki. Otwórz stronę inspect przeglądarki, włącz zdalne debugowanie, pozostaw przeglądarkę otwartą, zatwierdź pierwszy prompt podłączenia, a następnie spróbuj ponownie. Jeśli zalogowany stan nie jest wymagany, preferuj zarządzany profil `openclaw`.
- `No Chrome tabs found for profile="user"` → profil podłączenia Chrome MCP nie ma otwartych lokalnych kart Chrome.
- `Remote CDP for profile "<name>" is not reachable` → skonfigurowany zdalny punkt końcowy CDP nie jest osiągalny z hosta Gateway.
- `Browser attachOnly is enabled ... not reachable` albo `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil tylko do podłączenia nie ma osiągalnego celu albo punkt końcowy HTTP odpowiedział, ale nadal nie udało się otworzyć WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bieżąca instalacja Gateway nie ma bundlowanej zależności runtime `playwright-core` Pluginu browser; uruchom `openclaw doctor --fix`, a następnie zrestartuj Gateway. Zrzuty ARIA i podstawowe zrzuty ekranu strony nadal mogą działać, ale nawigacja, zrzuty AI, zrzuty ekranu elementów według selektorów CSS oraz eksport PDF pozostaną niedostępne.
- `fullPage is not supported for element screenshots` → żądanie zrzutu ekranu połączyło `--full-page` z `--ref` albo `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → wywołania zrzutów ekranu Chrome MCP / `existing-session` muszą używać przechwycenia strony albo `--ref` ze snapshotu, a nie CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooki uploadu plików Chrome MCP potrzebują odwołań snapshotu, a nie selektorów CSS.
- `existing-session file uploads currently support one file at a time.` → wysyłaj jeden upload na wywołanie w profilach Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooki dialogów w profilach Chrome MCP nie obsługują nadpisywania limitu czasu.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nadal wymaga zarządzanej przeglądarki albo surowego profilu CDP.
- nieaktualne nadpisania viewport / dark-mode / locale / offline w profilach attach-only albo zdalnych CDP → uruchom `openclaw browser stop --browser-profile <name>`, aby zamknąć aktywną sesję sterowania i zwolnić stan emulacji Playwright/CDP bez restartowania całego Gateway.

Powiązane:

- [/tools/browser-linux-troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [/tools/browser](/pl/tools/browser)

## Jeśli zaktualizowałeś i coś nagle przestało działać

Większość problemów po aktualizacji to dryf konfiguracji albo egzekwowanie bardziej rygorystycznych ustawień domyślnych.

### 1) Zmieniło się zachowanie auth i nadpisywania URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Co sprawdzić:

- Jeśli `gateway.mode=remote`, wywołania CLI mogą celować zdalnie, mimo że lokalna usługa działa poprawnie.
- Jawne wywołania `--url` nie wracają zapasowo do zapisanych poświadczeń.

Typowe sygnatury:

- `gateway connect failed:` → zły docelowy URL.
- `unauthorized` → punkt końcowy jest osiągalny, ale auth jest błędne.

### 2) Guardraile bind i auth są bardziej rygorystyczne

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Co sprawdzić:

- Powiązania spoza loopback (`lan`, `tailnet`, `custom`) wymagają prawidłowej ścieżki auth Gateway: współdzielonego tokena/hasła albo poprawnie skonfigurowanego wdrożenia `trusted-proxy` spoza loopback.
- Starsze klucze, takie jak `gateway.token`, nie zastępują `gateway.auth.token`.

Typowe sygnatury:

- `refusing to bind gateway ... without auth` → powiązanie spoza loopback bez prawidłowej ścieżki auth Gateway.
- `Connectivity probe: failed` przy działającym runtime → Gateway żyje, ale jest niedostępne z bieżącym auth/URL.

### 3) Zmienił się stan parowania i tożsamości urządzenia

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Co sprawdzić:

- Oczekujące zatwierdzenia urządzeń dla dashboard/nodes.
- Oczekujące zatwierdzenia parowania DM po zmianach zasad albo tożsamości.

Typowe sygnatury:

- `device identity required` → auth urządzenia nie zostało spełnione.
- `pairing required` → nadawca/urządzenie musi zostać zatwierdzone.

Jeśli konfiguracja usługi i runtime nadal się różnią po kontrolach, zainstaluj ponownie metadane usługi z tego samego katalogu profilu/stanu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Powiązane:

- [/gateway/pairing](/pl/gateway/pairing)
- [/gateway/authentication](/pl/gateway/authentication)
- [/gateway/background-process](/pl/gateway/background-process)
