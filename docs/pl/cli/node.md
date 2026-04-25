---
read_when:
    - Uruchamianie bezgłowego hosta Node
    - Parowanie węzła spoza macOS dla `system.run`
summary: Dokumentacja CLI dla `openclaw node` (bezgłowy host Node)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Uruchamia **bezgłowego hosta Node**, który łączy się z WebSocket Gateway i udostępnia
`system.run` / `system.which` na tej maszynie.

## Dlaczego używać hosta Node?

Użyj hosta Node, gdy chcesz, aby agenci **uruchamiali polecenia na innych maszynach** w Twojej
sieci bez instalowania tam pełnej aplikacji towarzyszącej dla macOS.

Typowe zastosowania:

- Uruchamianie poleceń na zdalnych maszynach Linux/Windows (serwery buildów, maszyny laboratoryjne, NAS).
- Zachowanie **sandboxingu** exec na Gateway, ale delegowanie zatwierdzonych uruchomień na inne hosty.
- Zapewnienie lekkiego, bezgłowego celu wykonania dla automatyzacji lub węzłów CI.

Wykonanie jest nadal chronione przez **zatwierdzenia exec** i allowlisty per agent na
hoście Node, dzięki czemu możesz utrzymać dostęp do poleceń w zakresie ograniczonym i jawnym.

## Proxy przeglądarki (zero-config)

Hosty Node automatycznie anonsują proxy przeglądarki, jeśli `browser.enabled` nie jest
wyłączone na węźle. Pozwala to agentowi korzystać z automatyzacji przeglądarki na tym węźle
bez dodatkowej konfiguracji.

Domyślnie proxy udostępnia zwykłą powierzchnię profili przeglądarki węzła. Jeśli
ustawisz `nodeHost.browserProxy.allowProfiles`, proxy staje się restrykcyjne:
kierowanie na profile spoza allowlisty jest odrzucane, a trasy tworzenia/usuwania
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

## Uruchamianie (na pierwszym planie)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisz identyfikator Node (czyści token parowania)
- `--display-name <name>`: nadpisz nazwę wyświetlaną węzła

## Uwierzytelnianie Gateway dla hosta Node

`openclaw node run` i `openclaw node install` rozwiązują uwierzytelnianie Gateway z config/env (polecenia node nie mają flag `--token`/`--password`):

- Najpierw sprawdzane są `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Następnie fallback do lokalnej konfiguracji: `gateway.auth.token` / `gateway.auth.password`.
- W trybie lokalnym host Node celowo nie dziedziczy `gateway.remote.token` / `gateway.remote.password`.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie uwierzytelniania Node kończy się bezpieczną odmową (bez maskującego fallbacku zdalnego).
- W `gateway.mode=remote` pola klienta zdalnego (`gateway.remote.token` / `gateway.remote.password`) również mogą być użyte zgodnie z zasadami pierwszeństwa dla trybu zdalnego.
- Rozwiązywanie uwierzytelniania hosta Node honoruje tylko zmienne środowiskowe `OPENCLAW_GATEWAY_*`.

Dla węzła łączącego się z Gateway `ws://` bez loopback na zaufanej prywatnej
sieci ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Bez tego uruchomienie węzła
kończy się bezpieczną odmową i prosi o użycie `wss://`, tunelu SSH lub Tailscale.
To opt-in w środowisku procesu, a nie klucz konfiguracji `openclaw.json`.
`openclaw node install` utrwala go w nadzorowanej usłudze Node, jeśli jest
obecny w środowisku polecenia instalacji.

## Usługa (w tle)

Zainstaluj bezgłowego hosta Node jako usługę użytkownika.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opcje:

- `--host <host>`: host WebSocket Gateway (domyślnie: `127.0.0.1`)
- `--port <port>`: port WebSocket Gateway (domyślnie: `18789`)
- `--tls`: użyj TLS dla połączenia z Gateway
- `--tls-fingerprint <sha256>`: oczekiwany fingerprint certyfikatu TLS (sha256)
- `--node-id <id>`: nadpisz identyfikator Node (czyści token parowania)
- `--display-name <name>`: nadpisz nazwę wyświetlaną węzła
- `--runtime <runtime>`: runtime usługi (`node` lub `bun`)
- `--force`: zainstaluj ponownie/nadpisz, jeśli już zainstalowano

Zarządzanie usługą:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Użyj `openclaw node run` dla hosta Node na pierwszym planie (bez usługi).

Polecenia usługi akceptują `--json` dla wyjścia czytelnego maszynowo.

## Parowanie

Pierwsze połączenie tworzy oczekującą prośbę o sparowanie urządzenia (`role: node`) na Gateway.
Zatwierdź ją przez:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

W ściśle kontrolowanych sieciach Node operator Gateway może jawnie włączyć
automatyczne zatwierdzanie pierwszego parowania Node z zaufanych CIDR:

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

Jest to domyślnie wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Klienci operatora/przeglądarki, Control UI, WebChat oraz zmiany roli,
zakresu, metadanych lub klucza publicznego nadal wymagają ręcznego zatwierdzenia.

Jeśli węzeł ponawia próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny),
poprzednia oczekująca prośba zostaje zastąpiona i tworzony jest nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Host Node przechowuje identyfikator Node, token, nazwę wyświetlaną i informacje o połączeniu z Gateway w
`~/.openclaw/node.json`.

## Zatwierdzenia exec

`system.run` jest kontrolowane przez lokalne zatwierdzenia exec:

- `~/.openclaw/exec-approvals.json`
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edycja z Gateway)

Dla zatwierdzonego asynchronicznego exec na Node OpenClaw przygotowuje kanoniczny `systemRunPlan`
przed wyświetleniem monitu. Późniejsze zatwierdzone przekazanie `system.run` ponownie używa tego zapisanego
planu, więc edycje pól command/cwd/session po utworzeniu prośby o zatwierdzenie są odrzucane zamiast zmieniać to, co wykonuje węzeł.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Nodes](/pl/nodes)
