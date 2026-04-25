---
read_when:
    - Uruchamianie lub debugowanie procesu Gateway
summary: Runbook dla usługi Gateway, cyklu życia i operacji
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Używaj tej strony do uruchomienia w dniu 1 i operacji w dniu 2 dla usługi Gateway.

<CardGroup cols={2}>
  <Card title="Zaawansowane rozwiązywanie problemów" icon="siren" href="/pl/gateway/troubleshooting">
    Diagnostyka oparta na objawach z dokładnymi sekwencjami poleceń i sygnaturami logów.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Zadaniowy przewodnik konfiguracji + pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Zarządzanie sekretami" icon="key-round" href="/pl/gateway/secrets">
    Kontrakt SecretRef, zachowanie migawek runtime oraz operacje migrate/reload.
  </Card>
  <Card title="Kontrakt planu sekretów" icon="shield-check" href="/pl/gateway/secrets-plan-contract">
    Dokładne zasady celu/ścieżki `secrets apply` i zachowanie profilu uwierzytelniania tylko z refami.
  </Card>
</CardGroup>

## 5-minutowe lokalne uruchomienie

<Steps>
  <Step title="Uruchom Gateway">

```bash
openclaw gateway --port 18789
# debug/trace odbijane na stdio
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

Prawidłowa baza: `Runtime: running`, `Connectivity probe: ok` i `Capability: ...` zgodne z oczekiwaniami. Użyj `openclaw gateway status --require-rpc`, gdy potrzebujesz potwierdzenia RPC w zakresie odczytu, a nie tylko osiągalności.

  </Step>

  <Step title="Zweryfikuj gotowość kanałów">

```bash
openclaw channels status --probe
```

Przy osiągalnym Gateway uruchamia to sondy live kanałów per konto oraz opcjonalne audyty.
Jeśli Gateway jest nieosiągalny, CLI wraca do podsumowań kanałów opartych tylko na konfiguracji
zamiast wyjścia z sond live.

  </Step>
</Steps>

<Note>
Reload konfiguracji Gateway obserwuje aktywną ścieżkę pliku konfiguracji (rozwiązaną z domyślnych ustawień profilu/stanu lub z `OPENCLAW_CONFIG_PATH`, jeśli ustawiono).
Tryb domyślny to `gateway.reload.mode="hybrid"`.
Po pierwszym udanym załadowaniu działający proces udostępnia aktywną migawkę konfiguracji w pamięci; udany reload atomowo podmienia tę migawkę.
</Note>

## Model runtime

- Jeden stale działający proces do routingu, control plane i połączeń kanałów.
- Pojedynczy multipleksowany port dla:
  - WebSocket control/RPC
  - API HTTP, zgodnych z OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI i hooków
- Domyślny tryb bindowania: `loopback`.
- Uwierzytelnianie jest domyślnie wymagane. Konfiguracje ze współdzielonym sekretem używają
  `gateway.auth.token` / `gateway.auth.password` (lub
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), a konfiguracje reverse proxy
  bez loopback mogą używać `gateway.auth.mode: "trusted-proxy"`.

## Endpointy zgodne z OpenAI

Powierzchnia zgodności OpenClaw o najwyższej dźwigni to obecnie:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Dlaczego ten zestaw ma znaczenie:

- Większość integracji Open WebUI, LobeChat i LibreChat najpierw sprawdza `/v1/models`.
- Wiele potoków RAG i pamięci oczekuje `/v1/embeddings`.
- Klienci natywni dla agentów coraz częściej preferują `/v1/responses`.

Uwaga planistyczna:

- `/v1/models` jest agent-first: zwraca `openclaw`, `openclaw/default` i `openclaw/<agentId>`.
- `openclaw/default` to stabilny alias, który zawsze mapuje do skonfigurowanego domyślnego agenta.
- Użyj `x-openclaw-model`, gdy chcesz nadpisać backend provider/model; w przeciwnym razie kontrolę zachowuje normalna konfiguracja modelu i embeddingów wybranego agenta.

Wszystkie te endpointy działają na głównym porcie Gateway i używają tej samej granicy zaufanego uwierzytelniania operatora co reszta HTTP API Gateway.

### Priorytet portu i bindowania

| Ustawienie   | Kolejność rozwiązywania                                        |
| ------------ | -------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Tryb bind    | CLI/override → `gateway.bind` → `loopback`                     |

### Tryby hot reload

| `gateway.reload.mode` | Zachowanie                                  |
| --------------------- | ------------------------------------------- |
| `off`                 | Brak reload konfiguracji                    |
| `hot`                 | Stosuj tylko zmiany bezpieczne dla hot      |
| `restart`             | Restart przy zmianach wymagających reloadu  |
| `hybrid` (domyślnie)  | Hot-apply, gdy bezpieczne, restart, gdy wymagany |

## Zestaw poleceń operatora

```bash
openclaw gateway status
openclaw gateway status --deep   # dodaje skan usług na poziomie systemu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` służy do dodatkowego wykrywania usług (LaunchDaemons/systemd system
units/schtasks), a nie do głębszej sondy stanu RPC.

## Wiele Gateway (ten sam host)

W większości instalacji należy uruchamiać jeden Gateway na maszynę. Pojedynczy Gateway może hostować wiele
agentów i kanałów.

Wiele Gateway potrzebujesz tylko wtedy, gdy celowo chcesz izolacji lub bota ratunkowego.

Przydatne kontrole:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Czego się spodziewać:

- `gateway status --deep` może zgłosić `Other gateway-like services detected (best effort)`
  i wypisać wskazówki czyszczenia, gdy nadal istnieją stare instalacje launchd/systemd/schtasks.
- `gateway probe` może ostrzec o `multiple reachable gateways`, gdy odpowiada więcej niż jeden cel.
- Jeśli jest to zamierzone, izoluj porty, config/state i katalogi główne obszaru roboczego dla każdego Gateway.

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

Szczegółowa konfiguracja: [/gateway/multiple-gateways](/pl/gateway/multiple-gateways).

## Endpoint real-time brain VoiceClaw

OpenClaw udostępnia zgodny z VoiceClaw endpoint WebSocket real-time pod adresem
`/voiceclaw/realtime`. Używaj go, gdy klient desktopowy VoiceClaw ma rozmawiać
bezpośrednio z real-time brain OpenClaw zamiast przechodzić przez osobny proces
relay.

Endpoint używa Gemini Live do dźwięku w czasie rzeczywistym i wywołuje OpenClaw jako
brain, bezpośrednio udostępniając narzędzia OpenClaw do Gemini Live. Wywołania narzędzi zwracają
natychmiastowy wynik `working`, aby zachować responsywność tury głosowej, a następnie OpenClaw
wykonuje właściwe narzędzie asynchronicznie i wstrzykuje wynik z powrotem do
sesji live. Ustaw `GEMINI_API_KEY` w środowisku procesu Gateway. Jeśli
uwierzytelnianie Gateway jest włączone, klient desktopowy wysyła token lub hasło Gateway
w swojej pierwszej wiadomości `session.config`.

Dostęp do real-time brain uruchamia polecenia agenta OpenClaw autoryzowane przez właściciela. Ogranicz
`gateway.auth.mode: "none"` do testowych instancji tylko loopback. Nielokalne
połączenia z real-time brain wymagają uwierzytelniania Gateway.

Dla izolowanego testowego Gateway uruchom osobną instancję z własnym portem, config i
stanem:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Następnie skonfiguruj VoiceClaw do użycia:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Dostęp zdalny

Preferowane: Tailscale/VPN.
Fallback: tunel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Następnie łącz klientów lokalnie z `ws://127.0.0.1:18789`.

<Warning>
Tunele SSH nie omijają uwierzytelniania Gateway. W przypadku uwierzytelniania współdzielonym sekretem klienci nadal
muszą wysłać `token`/`password` nawet przez tunel. W trybach opartych na tożsamości
żądanie nadal musi spełniać tę ścieżkę uwierzytelniania.
</Warning>

Zobacz: [Remote Gateway](/pl/gateway/remote), [Authentication](/pl/gateway/authentication), [Tailscale](/pl/gateway/tailscale).

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

Etykiety LaunchAgent to `ai.openclaw.gateway` (domyślnie) lub `ai.openclaw.<profile>` (nazwany profil). `openclaw doctor` audytuje i naprawia dryf konfiguracji usługi.

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

Natywne zarządzane uruchamianie w Windows używa zadania harmonogramu o nazwie `OpenClaw Gateway`
(lub `OpenClaw Gateway (<profile>)` dla nazwanych profili). Jeśli utworzenie zadania harmonogramu
zostanie odrzucone, OpenClaw wraca do uruchamiacza w folderze Startup per użytkownik, który wskazuje na `gateway.cmd` wewnątrz katalogu stanu.

  </Tab>

  <Tab title="Linux (system service)">

Użyj jednostki systemowej dla hostów wieloużytkownikowych/zawsze włączonych.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Użyj tej samej treści usługi co dla jednostki użytkownika, ale zainstaluj ją pod
`/etc/systemd/system/openclaw-gateway[-<profile>].service` i dostosuj
`ExecStart=`, jeśli Twój binarny `openclaw` znajduje się gdzie indziej.

  </Tab>
</Tabs>

## Szybka ścieżka profilu dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Domyślne ustawienia obejmują izolowany stan/config i bazowy port Gateway `19001`.

## Szybka dokumentacja protokołu (widok operatora)

- Pierwszą ramką klienta musi być `connect`.
- Gateway zwraca migawkę `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limity/polityka).
- `hello-ok.features.methods` / `events` to konserwatywna lista wykrywania, a nie
  wygenerowany zrzut każdej wywoływalnej trasy pomocniczej.
- Żądania: `req(method, params)` → `res(ok/payload|error)`.
- Typowe zdarzenia obejmują `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, zdarzenia cyklu życia parowania/zatwierdzania oraz `shutdown`.

Uruchomienia agentów są dwuetapowe:

1. Natychmiastowe potwierdzenie przyjęcia (`status:"accepted"`)
2. Końcowa odpowiedź o zakończeniu (`status:"ok"|"error"`), z pośrednimi streamowanymi zdarzeniami `agent`.

Pełna dokumentacja protokołu: [Gateway Protocol](/pl/gateway/protocol).

## Kontrole operacyjne

### Liveness

- Otwórz WS i wyślij `connect`.
- Oczekuj odpowiedzi `hello-ok` z migawką.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Odzyskiwanie luk

Zdarzenia nie są odtwarzane. Przy lukach w sekwencji odśwież stan (`health`, `system-presence`) przed kontynuacją.

## Typowe sygnatury awarii

| Sygnatura                                                     | Prawdopodobny problem                                                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bindowanie bez loopback bez prawidłowej ścieżki uwierzytelniania Gateway         |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflikt portów                                                                  |
| `Gateway start blocked: set gateway.mode=local`               | Konfiguracja ustawiona na tryb zdalny lub w uszkodzonej konfiguracji brakuje znacznika trybu lokalnego |
| `unauthorized` during connect                                 | Niedopasowanie uwierzytelniania między klientem a Gateway                        |

Pełne sekwencje diagnostyczne znajdziesz w [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting).

## Gwarancje bezpieczeństwa

- Klienci protokołu Gateway kończą działanie z błędem natychmiast, gdy Gateway jest niedostępny (bez niejawnego fallbacku do kanału bezpośredniego).
- Nieprawidłowe pierwsze ramki lub pierwsze ramki inne niż connect są odrzucane, a połączenie jest zamykane.
- Łagodne zamknięcie emituje zdarzenie `shutdown` przed zamknięciem gniazda.

---

Powiązane:

- [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- [Proces w tle](/pl/gateway/background-process)
- [Konfiguracja](/pl/gateway/configuration)
- [Stan](/pl/gateway/health)
- [Doctor](/pl/gateway/doctor)
- [Uwierzytelnianie](/pl/gateway/authentication)

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
- [Dostęp zdalny](/pl/gateway/remote)
- [Zarządzanie sekretami](/pl/gateway/secrets)
