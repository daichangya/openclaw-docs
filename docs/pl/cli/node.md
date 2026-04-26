---
read_when:
    - Uruchamianie bezgłowego hosta Node
    - Parowanie węzła innego niż macOS dla `system.run`
summary: Dokumentacja CLI dla `openclaw node` (bezgłowego hosta Node)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Uruchamia **bezgłowego hosta Node**, który łączy się z Gateway WebSocket i udostępnia
na tej maszynie `system.run` / `system.which`.

## Dlaczego warto używać hosta Node?

Użyj hosta Node, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach**
w Twojej sieci bez instalowania na nich pełnej aplikacji towarzyszącej dla macOS.

Typowe przypadki użycia:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwery buildów, maszyny laboratoryjne, NAS).
- Utrzymanie **sandboxingu** exec na Gateway, ale delegowanie zatwierdzonych uruchomień do innych hostów.
- Zapewnienie lekkiego, bezgłowego celu wykonawczego dla automatyzacji lub węzłów CI.

Wykonanie nadal jest chronione przez **zatwierdzenia exec** i listy dozwolonych per agent
na hoście Node, dzięki czemu możesz zachować zakres dostępu do poleceń jako ograniczony i jawny.

## Proxy przeglądarki (zero-config)

Hosty Node automatycznie anonsują proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Pozwala to agentowi używać automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia zwykłą powierzchnię profilu przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
adresowanie profili spoza listy dozwolonych jest odrzucane, a trasy tworzenia/usuwania
trwałych profili są blokowane przez proxy.

W razie potrzeby wyłącz je na węźle:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Uruchomienie (na pierwszym planie)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: używa TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisuje identyfikator Node (czyści token Pairing)
- `--display-name <name>`: nadpisuje wyświetlaną nazwę węzła

## Uwierzytelnianie Gateway dla hosta Node

`openclaw node run` i `openclaw node install` rozwiązują uwierzytelnianie Gateway z config/env (polecenia node nie mają flag `--token`/`--password`):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie fallback do lokalnej konfiguracji: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie uwierzytelniania Node kończy się w trybie fail-closed (bez maskującego fallbacku z trybu zdalnego).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) także kwalifikują się zgodnie z regułami priorytetu trybu zdalnego.
- Rozwiązywanie uwierzytelniania hosta Node honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

Dla węzła łączącego się z Gateway `ws://` innym niż local loopback w zaufanej sieci
prywatnej ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Bez tego uruchomienie węzła
kończy się w trybie fail-closed i prosi o użycie `wss://`, tunelu SSH lub Tailscale.
Jest to opt-in na poziomie środowiska procesu, a nie klucz konfiguracji `openclaw.json`.
`openclaw node install` utrwala tę wartość w nadzorowanej usłudze węzła, gdy jest ona
obecna w środowisku polecenia instalacji.

## Usługa (w tle)

Zainstaluj bezgłowego hosta Node jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host Gateway WebSocket (domyślnie: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (domyślnie: `18789`)
- `--tls`: używa TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisuje identyfikator Node (czyści token Pairing)
- `--display-name <name>`: nadpisuje wyświetlaną nazwę węzła
- `--runtime <runtime>`: runtime usługi (`node` lub `bun`)
- `--force`: reinstaluje/nadpisuje, jeśli już zainstalowane

Zarządzanie usługą:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta Node na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla danych wyjściowych czytelnych maszynowo.

Host Node ponawia restart Gateway i zamknięcia sieci w obrębie procesu. Jeśli
Gateway zgłosi terminalną pauzę uwierzytelniania tokenu/hasła/bootstrap, host Node
loguje szczegóły zamknięcia i kończy się niezerowym kodem, aby launchd/systemd mogły
uruchomić go ponownie ze świeżą konfiguracją i poświadczeniami. Pauzy wymagające Pairing
pozostają w przepływie na pierwszym planie, aby oczekujące żądanie mogło zostać zatwierdzone.

## Pairing

Pierwsze połączenie tworzy w Gateway oczekujące żądanie Pairing urządzenia (`role: node`).
Zatwierdź je przez:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

W ściśle kontrolowanych sieciach węzłów operator Gateway może jawnie włączyć
automatyczne zatwierdzanie pierwszego Pairing węzła z zaufanych zakresów CIDR:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

To ustawienie jest domyślnie wyłączone. Dotyczy tylko świeżego Pairing `role: node` bez
żądanych zakresów. Klienci operator/browser, Control UI, WebChat oraz aktualizacje roli,
zakresów, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponowi próbę Pairing ze zmienionymi szczegółami uwierzytelniania
(rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione,
a tworzony jest nowy `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Host Node przechowuje identyfikator Node, token, wyświetlaną nazwę i informacje o połączeniu z Gateway w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest chronione przez lokalne zatwierdzenia exec:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego exec na Node OpenClaw przygotowuje kanoniczny
`systemRunPlan` przed wyświetleniem promptu. Późniejsze zatwierdzone przekazanie
`system.run` ponownie używa tego zapisanego planu, więc edycje pól command/cwd/session
po utworzeniu żądania zatwierdzenia są odrzucane zamiast zmieniać to, co wykona węzeł.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Nodes](/pl/nodes)
