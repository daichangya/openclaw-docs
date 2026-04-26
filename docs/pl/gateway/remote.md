---
read_when:
    - Uruchamianie lub rozwiązywanie problemów ze zdalnymi konfiguracjami Gateway
summary: Zdalny dostęp z użyciem tuneli SSH (Gateway WS) i tailnetów
title: Zdalny dostęp
x-i18n:
    generated_at: "2026-04-26T11:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

To repo obsługuje „zdalnie przez SSH” przez utrzymywanie jednego Gateway (głównego) uruchomionego na dedykowanym hoście (desktop/serwer) i łączenie z nim klientów.

- Dla **operatorów (Ciebie / aplikacji macOS)**: tunelowanie SSH jest uniwersalnym fallbackiem.
- Dla **Node (iOS/Android i przyszłe urządzenia)**: połącz z **Gateway WebSocket** (LAN/tailnet lub tunel SSH, jeśli potrzebny).

## Główna idea

- Gateway WebSocket wiąże się z **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do zdalnego użycia przekazujesz ten port loopback przez SSH (albo używasz tailnet/VPN i tunelujesz mniej).

## Typowe konfiguracje VPN/tailnet (gdzie działa agent)

Myśl o **hoście Gateway** jako o miejscu, „gdzie działa agent”. To on posiada sesje, profile uwierzytelniania, kanały i stan.
Twój laptop/desktop (oraz Node) łączą się z tym hostem.

### 1) Zawsze aktywny Gateway w Twoim tailnet (VPS lub serwer domowy)

Uruchom Gateway na trwałym hoście i uzyskuj do niego dostęp przez **Tailscale** lub SSH.

- **Najlepsze UX:** pozostaw `gateway.bind: "loopback"` i używaj **Tailscale Serve** dla Control UI.
- **Fallback:** pozostaw loopback + tunel SSH z dowolnej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (prosta VM) lub [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

To rozwiązanie jest idealne, gdy Twój laptop często przechodzi w uśpienie, ale chcesz, aby agent był zawsze aktywny.

### 2) Domowy desktop uruchamia Gateway, laptop steruje zdalnie

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu **Remote over SSH** w aplikacji macOS (Settings → General → „OpenClaw runs”).
- Aplikacja otwiera i zarządza tunelem, dzięki czemu WebChat + health checks „po prostu działają”.

Runbook: [zdalny dostęp macOS](/pl/platforms/mac/remote).

### 3) Laptop uruchamia Gateway, zdalny dostęp z innych maszyn

Zachowaj lokalny Gateway, ale udostępnij go bezpiecznie:

- Tunel SSH do laptopa z innych maszyn, albo
- Tailscale Serve dla Control UI i pozostawienie Gateway tylko na loopback.

Przewodnik: [Tailscale](/pl/gateway/tailscale) i [Web overview](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa Gateway jest właścicielem stanu + kanałów. Node są urządzeniami peryferyjnymi.

Przykładowy przepływ (Telegram → Node):

- Wiadomość Telegram dociera do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie Node.
- Gateway wywołuje **Node** przez Gateway WebSocket (`node.*` RPC).
- Node zwraca wynik; Gateway odsyła odpowiedź do Telegram.

Uwagi:

- **Node nie uruchamiają usługi gateway.** Na host powinien działać tylko jeden gateway, chyba że celowo uruchamiasz izolowane profile (zobacz [Multiple gateways](/pl/gateway/multiple-gateways)).
- „Tryb node” aplikacji macOS to po prostu klient Node przez Gateway WebSocket.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Po uruchomieniu tunelu:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` także mogą kierować na przekazany URL przez `--url`, gdy to potrzebne.

Uwaga: zastąp `18789` swoim skonfigurowanym `gateway.port` (lub `--port`/`OPENCLAW_GATEWAY_PORT`).
Uwaga: gdy przekazujesz `--url`, CLI nie używa fallbacku do poświadczeń z konfiguracji ani środowiska.
Dołącz jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Zdalne ustawienia domyślne CLI

Możesz utrwalić zdalny cel, aby polecenia CLI używały go domyślnie:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Gdy gateway jest dostępny tylko przez loopback, pozostaw URL jako `ws://127.0.0.1:18789` i najpierw otwórz tunel SSH.
W transporcie tunelu SSH aplikacji macOS wykryte nazwy hostów gateway należą do
`gateway.remote.sshTarget`; `gateway.remote.url` pozostaje URL lokalnego tunelu.

## Priorytet poświadczeń

Rozwiązywanie poświadczeń Gateway odbywa się według jednego współdzielonego kontraktu w ścieżkach call/probe/status i monitorowaniu zatwierdzeń exec Discord. Host Node używa tego samego kontraktu bazowego z jednym wyjątkiem trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne poświadczenia (`--token`, `--password` lub narzędzie `gatewayToken`) zawsze wygrywają w ścieżkach call, które akceptują jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL w CLI (`--url`) nigdy nie używają niejawnych poświadczeń z config/env.
  - Nadpisania URL przez env (`OPENCLAW_GATEWAY_URL`) mogą używać tylko poświadczeń env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne ustawienia trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback zdalny ma zastosowanie tylko wtedy, gdy lokalne wejście tokenu auth nie jest ustawione)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback zdalny ma zastosowanie tylko wtedy, gdy lokalne wejście hasła auth nie jest ustawione)
- Domyślne ustawienia trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek hosta Node w trybie lokalnym: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne kontrole tokenów probe/status są domyślnie rygorystyczne: używają tylko `gateway.remote.token` (bez fallbacku do tokenu lokalnego) przy kierowaniu na tryb zdalny.
- Nadpisania env Gateway używają tylko `OPENCLAW_GATEWAY_*`.

## Interfejs czatu przez SSH

WebChat nie używa już oddzielnego portu HTTP. Interfejs czatu SwiftUI łączy się bezpośrednio z Gateway WebSocket.

- Przekaż `18789` przez SSH (patrz wyżej), a następnie połącz klientów z `ws://127.0.0.1:18789`.
- Na macOS preferuj tryb „Remote over SSH” aplikacji, który automatycznie zarządza tunelem.

## Aplikacja macOS „Remote over SSH”

Aplikacja macOS w pasku menu może obsługiwać tę samą konfigurację end-to-end (zdalne sprawdzanie statusu, WebChat i przekazywanie Voice Wake).

Runbook: [zdalny dostęp macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (remote/VPN)

Krótko: **utrzymuj Gateway tylko na loopback**, chyba że masz pewność, że potrzebujesz bind.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsze ustawienie domyślne (bez publicznej ekspozycji).
- Jawny tekst `ws://` jest domyślnie dozwolony tylko dla loopback. W przypadku zaufanych sieci prywatnych ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako break-glass. Nie istnieje odpowiednik w `openclaw.json`; musi to być środowisko procesu klienta wykonującego połączenie WebSocket.
- **Bindy inne niż loopback** (`lan`/`tailnet`/`custom` albo `auto`, gdy loopback jest niedostępny) muszą używać uwierzytelniania gateway: token, hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` to źródła poświadczeń klienta. Same w sobie **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki call mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się w trybie fail-closed (bez maskującego fallbacku zdalnego).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`; endpointy HTTP API nie używają tego uwierzytelniania nagłówkami Tailscale i zamiast tego stosują zwykły tryb uwierzytelniania HTTP gateway. Ten przepływ bez tokenu zakłada, że host gateway jest zaufany. Ustaw `false`, jeśli chcesz uwierzytelniania współdzielonym sekretem wszędzie.
- Uwierzytelnianie **trusted-proxy** jest przeznaczone tylko dla konfiguracji nie-loopback z reverse proxy świadomym tożsamości. Reverse proxy loopback na tym samym hoście nie spełniają `gateway.auth.mode: "trusted-proxy"`.
- Traktuj kontrolę przeglądarki jak dostęp operatora: tylko tailnet + świadomy Pairing Node.

Szczegóły: [Security](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najłatwiejsza trwała konfiguracja używa wpisu `LocalForward` w konfiguracji SSH oraz LaunchAgent do utrzymywania tunelu przy życiu po restartach i awariach.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` swoimi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token gateway

Zapisz token w konfiguracji, aby przetrwał restarty:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Krok 4: utwórz LaunchAgent

Zapisz to jako `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Krok 5: załaduj LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunel uruchomi się automatycznie przy logowaniu, zrestartuje się po awarii i utrzyma przekazany port aktywny.

Uwaga: jeśli masz pozostały LaunchAgent `com.openclaw.ssh-tunnel` ze starszej konfiguracji, wyładuj go i usuń.

#### Rozwiązywanie problemów

Sprawdź, czy tunel działa:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Uruchom ponownie tunel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Zatrzymaj tunel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Wpis konfiguracji                      | Co robi                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Przekazuje lokalny port 18789 do zdalnego portu 18789        |
| `ssh -N`                               | SSH bez wykonywania zdalnych poleceń (tylko przekazywanie portów) |
| `KeepAlive`                            | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                            | Uruchamia tunel, gdy LaunchAgent ładuje się przy logowaniu   |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Authentication](/pl/gateway/authentication)
- [Remote gateway setup](/pl/gateway/remote-gateway-readme)
