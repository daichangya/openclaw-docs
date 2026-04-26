---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Runbook dla usługi Gateway, cyklu życia i operacji
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Używaj tej strony do uruchomienia w day-1 i operacji w day-2 usługi Gateway.

<CardGroup cols={2}>
  <Card title="Zaawansowane rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka zaczynająca się od symptomów z dokładnymi drabinkami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Przewodnik konfiguracji zorientowany na zadania + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie snapshotów runtime oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły target/path dla `secrets apply` oraz zachowanie profili auth tylko z ref.
  </Card>
</CardGroup>

## 5-minutowy lokalny start

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Zweryfikuj stan usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Prawidłowa baza: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz potwierdzenia RPC w zakresie odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Zweryfikuj gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym Gateway uruchamia to aktywne testy kanałów per konto oraz opcjonalne audyty.
Jeśli Gateway jest nieosiągalny, CLI wraca do podsumowań kanałów opartych wyłącznie na konfiguracji
zamiast wyjścia z aktywnych testów.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje aktywną ścieżkę pliku konfiguracji (rozstrzyganą z domyślnych ustawień profilu/stanu lub z `OPENCLAW_CONFIG_PATH`, jeśli jest ustawione).
Tryb domyślny to `gateway.reload.mode="hybrid"`.
Po pierwszym pomyślnym wczytaniu działający proces udostępnia aktywny snapshot konfiguracji w pamięci; pomyślne przeładowanie atomowo podmienia ten snapshot.
</Note>

## Model runtime

- Jeden zawsze uruchomiony proces do routingu, control plane i połączeń kanałów.
- Jeden multipleksowany port dla:
  - control/RPC WebSocket
  - API HTTP, zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bind: `loopback`.
- Auth jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje
  reverse proxy poza loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Punkty końcowe zgodne z OpenAI

Powierzchnia zgodności OpenClaw o najwyższej dźwigni to teraz:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele pipeline’ów RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest agent-first: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje na skonfigurowanego domyślnego agenta.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać backend provider/model; w przeciwnym razie kontrolę zachowują zwykła konfiguracja modelu i embedów wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej granicy zaufanego auth operatora co reszta API HTTP Gateway.

### Pierwszeństwo portu i bind

| Ustawienie   | Kolejność rozstrzygania                                       |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bind    | CLI/override → `gateway.bind` → `loopback`                    |

Uruchamianie Gateway używa tego samego efektywnego portu i bind, gdy seeduje lokalne
origins Control UI dla bindów innych niż loopback. Na przykład `--bind lan --port 3000`
seeduje `http://localhost:3000` i `http://127.0.0.1:3000` przed uruchomieniem
walidacji runtime. Dodaj wszelkie origins zdalnych przeglądarek, takie jak adresy URL proxy HTTPS, do
`gateway.controlUi.allowedOrigins` jawnie.

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                 |
| --------------------- | ------------------------------------------ |
| `off`                 | Bez przeładowania konfiguracji             |
| `hot`                 | Zastosuj tylko zmiany bezpieczne dla hot   |
| `restart`             | Restart przy zmianach wymagających reload  |
| `hybrid` (domyślnie)  | Hot-apply, gdy bezpieczne, restart, gdy wymagany |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/systemd system
units/schtasks), a nie do głębszego testu zdrowia RPC.

## Wiele Gateway (ten sam host)

Większość instalacji powinna uruchamiać jeden Gateway na maszynę. Pojedynczy Gateway może hostować wielu
agentów i wiele kanałów.

Wiele Gateway potrzebujesz tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy nadal istnieją stare instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzegać o `multiple reachable gateways`, gdy odpowiada
  więcej niż jeden target.
- Jeśli to zamierzone, izoluj porty, konfigurację/stan i katalogi główne obszarów roboczych dla każdego Gateway.

Checklista per instancja:

- Unikalny `gateway.port`
- Unikalne `OPENCLAW_CONFIG_PATH`
- Unikalne `OPENCLAW_STATE_DIR`
- Unikalne `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Punkt końcowy real-time brain VoiceClaw

OpenClaw udostępnia zgodny z VoiceClaw punkt końcowy WebSocket real-time pod adresem
`/voiceclaw/realtime`. Używaj go, gdy klient desktopowy VoiceClaw ma rozmawiać
bezpośrednio z real-time brain OpenClaw zamiast przechodzić przez osobny proces
relay.

Punkt końcowy używa Gemini Live do dźwięku w czasie rzeczywistym i wywołuje OpenClaw jako
brain, udostępniając narzędzia OpenClaw bezpośrednio Gemini Live. Wywołania narzędzi zwracają
natychmiastowy wynik `working`, aby utrzymać responsywność tury głosowej, po czym OpenClaw
wykonuje właściwe narzędzie asynchronicznie i wstrzykuje wynik z powrotem do
sesji na żywo. Ustaw `GEMINI_API_KEY` w środowisku procesu Gateway. Jeśli
auth Gateway jest włączone, klient desktopowy wysyła token lub hasło Gateway
w pierwszej wiadomości `session.config`.

Dostęp do real-time brain uruchamia polecenia agentów OpenClaw autoryzowane przez właściciela. Ogranicz
`gateway.auth.mode: "none"` do instancji testowych dostępnych tylko przez loopback. Połączenia
do real-time brain spoza lokalnego hosta wymagają auth Gateway.

Dla izolowanego testowego Gateway uruchom osobną instancję z własnym portem, konfiguracją
i stanem:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Następnie skonfiguruj VoiceClaw, aby używał:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Fallback: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie połącz klientów lokalnie z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają auth Gateway. W przypadku auth ze współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać tę ścieżkę auth.
</Warning>

Zobacz: [Zdalny Gateway](/pl/gateway/remote), [Authentication](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Używaj uruchomień nadzorowanych dla niezawodności zbliżonej do produkcyjnej.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Do restartów używaj `openclaw gateway restart`. Nie łącz `openclaw gateway stop` i `openclaw gateway start`; na macOS `gateway stop` celowo wyłącza LaunchAgent przed zatrzymaniem.

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślnie) lub `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia drift konfiguracji usługi.

  </Tab>

  <Tab title="Linux (systemd użytkownika)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aby zachować działanie po wylogowaniu, włącz lingering:

```bash
sudo loginctl enable-linger <user>
```

Przykładowa ręczna jednostka użytkownika, gdy potrzebujesz niestandardowej ścieżki instalacji:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (natywnie)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Zarządzane natywne uruchamianie w Windows używa zaplanowanego zadania o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie zaplanowanego zadania
zostanie odrzucone, OpenClaw wraca do launchera per użytkownik w folderze Startup,
który wskazuje na `gateway.cmd` wewnątrz katalogu stanu.

  </Tab>

  <Tab title="Linux (usługa systemowa)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli twój plik binarny `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Szybka ścieżka profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne ustawienia obejmują izolowany stan/konfigurację i bazowy port Gateway `19001`.

## Szybka dokumentacja protokołu (perspektywa operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` to konserwatywna lista odkrywania, a nie
  wygenerowany zrzut każdej wywoływalnej trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia to `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/akceptacji oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź ukończenia (`status:"ok"|"error"`), z pośrednimi strumieniowanymi zdarzeniami `agent`

Pełna dokumentacja protokołu: [Gateway Protocol](/pl/gateway/protocol).

## Kontrole operacyjne

### Żywotność

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` ze snapshotem.

### Gotowość

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie po lukach

Zdarzenia nie są odtwarzane. Przy lukach w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                     | Prawdopodobny problem                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind poza loopback bez prawidłowej ścieżki auth Gateway                          |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                   |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb zdalny albo brakuje stempla trybu lokalnego w uszkodzonej konfiguracji |
| `unauthorized` during connect                                 | Niedopasowanie auth między klientem a Gateway                                    |

Pełne drabinki diagnostyczne znajdziesz w [Rozwiązywanie problemów Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway kończą się natychmiast błędem, gdy Gateway jest niedostępny (bez niejawnego fallbacku do direct-channel).
- Nieprawidłowe/pierwsze ramki inne niż connect są odrzucane, a połączenie zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem socketu.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Health](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Authentication](/pl/gateway/authentication)

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów Gateway](/pl/gateway/troubleshooting)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
