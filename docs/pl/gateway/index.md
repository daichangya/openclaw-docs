---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Instrukcja operacyjna dla usługi Gateway, jej cyklu życia i operacji
title: Instrukcja operacyjna Gateway
x-i18n:
    generated_at: "2026-04-20T09:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1004cdd43b1db6794f3ca83da38dbdb231a1976329d9d6d851e2b02405278d8
    source_path: gateway/index.md
    workflow: 15
---

# Instrukcja operacyjna Gateway

Użyj tej strony do uruchamiania usługi Gateway w pierwszym dniu oraz do operacji eksploatacyjnych w kolejnych dniach.

<CardGroup cols={2}>
  <Card title="Zaawansowane rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka oparta na objawach z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Przewodnik konfiguracji zorientowany na zadania + pełne odniesienie do konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie snapshotów w czasie działania oraz operacje migracji/przeładowania.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne reguły `secrets apply` dotyczące celu/ścieżki oraz zachowanie profilu uwierzytelniania tylko z referencjami.
  </Card>
</CardGroup>

## 5-minutowe lokalne uruchomienie

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace odzwierciedlane do stdio
openclaw gateway --port 18789 --verbose
# wymuś zakończenie nasłuchu na wybranym porcie, a następnie uruchom
openclaw gateway --force
```

  </Step>

  <Step title="Zweryfikuj stan usługi">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Prawidłowy stan bazowy: `Runtime: running`, `Connectivity probe: ok` oraz `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz potwierdzenia RPC w zakresie odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Sprawdź gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym Gateway uruchamia to aktywne sondy kanałów dla każdego konta oraz opcjonalne audyty.
Jeśli Gateway jest nieosiągalny, CLI przechodzi awaryjnie do podsumowań kanałów opartych wyłącznie na konfiguracji
zamiast wyjścia z aktywnej sondy.

  </Step>
</Steps>

<Note>
Przeładowanie konfiguracji Gateway obserwuje ścieżkę aktywnego pliku konfiguracji (ustaloną na podstawie domyślnych ustawień profilu/stanu albo `OPENCLAW_CONFIG_PATH`, jeśli jest ustawione).
Tryb domyślny to `gateway.reload.mode="hybrid"`.
Po pierwszym pomyślnym wczytaniu działający proces obsługuje aktywny snapshot konfiguracji w pamięci; pomyślne przeładowanie atomowo podmienia ten snapshot.
</Note>

## Model działania

- Jeden zawsze uruchomiony proces do routingu, płaszczyzny sterowania i połączeń kanałów.
- Jeden multipleksowany port dla:
  - sterowania/RPC przez WebSocket
  - interfejsów HTTP API zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje
  reverse proxy spoza loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

Najważniejsza warstwa zgodności OpenClaw to obecnie:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw jest istotny:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sonduje `/v1/models`.
- Wiele potoków RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest agent-first: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje na skonfigurowanego domyślnego agenta.
- Użyj `x-openclaw-model`, gdy chcesz wymusić nadpisanie dostawcy/modelu zaplecza; w przeciwnym razie kontrolę zachowują zwykłe ustawienia modelu i embeddingów wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej granicy uwierzytelniania zaufanego operatora co reszta HTTP API Gateway.

### Priorytet portu i trybu bindowania

| Ustawienie    | Kolejność rozstrzygania                                      |
| ------------- | ------------------------------------------------------------- |
| Port Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bindowania | CLI/override → `gateway.bind` → `loopback`                  |

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                 |
| --------------------- | ------------------------------------------ |
| `off`                 | Brak przeładowania konfiguracji            |
| `hot`                 | Zastosuj tylko zmiany bezpieczne dla hot reload |
| `restart`             | Restart przy zmianach wymagających restartu |
| `hybrid` (domyślny)   | Zastosuj na gorąco, gdy to bezpieczne, restartuj, gdy to wymagane |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # dodaje skan usługi na poziomie systemu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/systemowe
jednostki systemd/schtasks), a nie do głębszej sondy stanu RPC.

## Wiele Gatewayów (ten sam host)

W większości instalacji należy uruchamiać jeden Gateway na maszynę. Jeden Gateway może obsługiwać wielu
agentów i wiele kanałów.

Wiele Gatewayów jest potrzebnych tylko wtedy, gdy celowo chcesz izolacji albo bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wyświetlić wskazówki czyszczenia, gdy nadal istnieją przestarzałe instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzegać o `multiple reachable gateways`, gdy odpowiada
  więcej niż jeden cel.
- Jeśli jest to zamierzone, odizoluj porty, konfigurację/stany i katalogi workspace dla każdego Gateway.

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Dostęp zdalny

Zalecane: Tailscale/VPN.
Awaryjnie: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie połącz klientów lokalnie z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania Gateway. W przypadku uwierzytelniania
współdzielonym sekretem klienci nadal
muszą wysyłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać wymagania tej ścieżki uwierzytelniania.
</Warning>

Zobacz: [Remote Gateway](/pl/gateway/remote), [Authentication](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

## Nadzór i cykl życia usługi

Dla niezawodności zbliżonej do produkcyjnej używaj uruchomień nadzorowanych.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślna) albo `ai.openclaw.<profile>` (profil nazwany). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aby zachować działanie po wylogowaniu, włącz lingering:

```bash
sudo loginctl enable-linger <user>
```

Przykład ręcznej jednostki użytkownika, gdy potrzebujesz niestandardowej ścieżki instalacji:

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

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Natywne zarządzane uruchamianie w Windows używa Zadania Harmonogramu o nazwie `OpenClaw Gateway`
(albo `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie Zadania Harmonogramu
zostanie odrzucone, OpenClaw przechodzi awaryjnie do programu uruchamiającego w folderze Startup dla użytkownika,
który wskazuje na `gateway.cmd` w katalogu stanu.

  </Tab>

  <Tab title="Linux (system service)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych lub zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki użytkownika, ale zainstaluj ją w
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli binarka `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Wiele Gatewayów na jednym hoście

W większości konfiguracji należy uruchamiać **jeden** Gateway.
Wielu używaj tylko dla ścisłej izolacji/nadmiarowości (na przykład profil ratunkowy).

Lista kontrolna dla każdej instancji:

- Unikalne `gateway.port`
- Unikalne `OPENCLAW_CONFIG_PATH`
- Unikalne `OPENCLAW_STATE_DIR`
- Unikalne `agents.defaults.workspace`

Przykład:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Zobacz: [Multiple gateways](/pl/gateway/multiple-gateways).

### Szybka ścieżka dla profilu deweloperskiego

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne ustawienia obejmują odizolowany stan/konfigurację oraz bazowy port Gateway `19001`.

## Szybkie odniesienie do protokołu (widok operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej ścieżki pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/akceptacji oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Ostateczna odpowiedź zakończenia (`status:"ok"|"error"`), ze strumieniowanymi zdarzeniami `agent` pomiędzy nimi.

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

### Odtwarzanie po lukach

Zdarzenia nie są odtwarzane. Przy lukach w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                     | Prawdopodobny problem                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bindowanie poza loopback bez prawidłowej ścieżki uwierzytelniania Gateway        |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portu                                                                   |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb zdalny albo brakuje stempla trybu lokalnego w uszkodzonej konfiguracji |
| `unauthorized` during connect                                 | Niezgodność uwierzytelniania między klientem a Gateway                           |

Pełne sekwencje diagnostyczne znajdziesz w [Gateway Troubleshooting](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway szybko kończą pracę, gdy Gateway jest niedostępny (bez domyślnego awaryjnego przejścia bezpośrednio do kanału).
- Nieprawidłowe pierwsze ramki inne niż `connect` są odrzucane, a połączenie zamykane.
- Przy łagodnym zamknięciu emitowane jest zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Troubleshooting](/pl/gateway/troubleshooting)
- [Background Process](/pl/gateway/background-process)
- [Configuration](/pl/gateway/configuration)
- [Health](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Authentication](/pl/gateway/authentication)
