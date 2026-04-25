---
read_when:
    - Uruchamianie lub rozwiązywanie problemów z konfiguracjami zdalnego Gateway.
summary: Zdalny dostęp przy użyciu tuneli SSH (Gateway WS) i tailnetów
title: Zdalny dostęp
x-i18n:
    generated_at: "2026-04-25T13:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

To repo obsługuje tryb „zdalnie przez SSH”, utrzymując jeden Gateway (główny) uruchomiony na dedykowanym hoście (desktop/serwer) i podłączając do niego klientów.

- Dla **operatorów (Ciebie / aplikacji macOS)**: tunelowanie SSH to uniwersalny fallback.
- Dla **Nodeów (iOS/Android i przyszłych urządzeń)**: łącz się z **WebSocketem** Gateway (`Gateway WebSocket`) (LAN/tailnet lub tunel SSH, zależnie od potrzeb).

## Główna idea

- Gateway WebSocket nasłuchuje na **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użycia zdalnego przekazujesz ten port loopback przez SSH (albo używasz tailnet/VPN i mniej tunelujesz).

## Typowe konfiguracje VPN/tailnet (gdzie działa agent)

Myśl o **hoście Gateway** jako o miejscu, „w którym działa agent”. To on przechowuje sesje, profile auth, kanały i stan.
Twój laptop/desktop (oraz Nodey) łączą się z tym hostem.

### 1) Zawsze włączony Gateway w Twoim tailnet (VPS lub serwer domowy)

Uruchom Gateway na trwałym hoście i uzyskuj do niego dostęp przez **Tailscale** lub SSH.

- **Najlepszy UX:** pozostaw `gateway.bind: "loopback"` i użyj **Tailscale Serve** dla Control UI.
- **Fallback:** pozostaw loopback + tunel SSH z każdej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (łatwa VM) lub [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

To rozwiązanie jest idealne, gdy Twój laptop często usypia, ale chcesz, aby agent był zawsze aktywny.

### 2) Domowy desktop uruchamia Gateway, laptop służy jako zdalne sterowanie

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu **Remote over SSH** w aplikacji macOS (Ustawienia → Ogólne → „OpenClaw runs”).
- Aplikacja otwiera tunel i nim zarządza, więc WebChat + kontrole kondycji „po prostu działają”.

Runbook: [zdalny dostęp na macOS](/pl/platforms/mac/remote).

### 3) Laptop uruchamia Gateway, zdalny dostęp z innych maszyn

Pozostaw Gateway lokalnie, ale udostępnij go bezpiecznie:

- tunel SSH do laptopa z innych maszyn, albo
- udostępnij Control UI przez Tailscale Serve i pozostaw Gateway tylko na loopback.

Przewodnik: [Tailscale](/pl/gateway/tailscale) i [Przegląd web](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa Gateway zarządza stanem + kanałami. Nodey są urządzeniami peryferyjnymi.

Przykład przepływu (Telegram → Node):

- Wiadomość Telegram dociera do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie Nodea.
- Gateway wywołuje **Node** przez Gateway WebSocket (`node.*` RPC).
- Node zwraca wynik; Gateway odpowiada z powrotem do Telegram.

Uwagi:

- **Nodey nie uruchamiają usługi gateway.** Na hoście powinien działać tylko jeden gateway, chyba że celowo uruchamiasz odizolowane profile (zobacz [Wiele Gatewayów](/pl/gateway/multiple-gateways)).
- „Tryb Node” aplikacji macOS to po prostu klient Node przez Gateway WebSocket.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Po uruchomieniu tunelu:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` również mogą kierować żądania na przekazany URL przez `--url`, gdy jest to potrzebne.

Uwaga: zamień `18789` na skonfigurowane `gateway.port` (lub `--port`/`OPENCLAW_GATEWAY_PORT`).
Uwaga: gdy podajesz `--url`, CLI nie przechodzi fallbackiem do danych uwierzytelniających z konfiguracji ani środowiska.
Podaj jawnie `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem.

## Zdalne ustawienia domyślne CLI

Możesz zapisać zdalny cel, aby polecenia CLI domyślnie go używały:

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

Gdy gateway działa tylko na loopback, pozostaw URL jako `ws://127.0.0.1:18789` i najpierw otwórz tunel SSH.

## Priorytet danych uwierzytelniających

Rozpoznawanie danych uwierzytelniających Gateway opiera się na jednym wspólnym kontrakcie dla ścieżek call/probe/status oraz monitorowania zatwierdzania exec w Discord. Node-host używa tego samego podstawowego kontraktu z jednym wyjątkiem dla trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne dane uwierzytelniające (`--token`, `--password` albo narzędziowe `gatewayToken`) zawsze mają pierwszeństwo w ścieżkach call, które akceptują jawne auth.
- Bezpieczeństwo nadpisywania URL:
  - Nadpisania URL w CLI (`--url`) nigdy nie używają niejawnych danych uwierzytelniających z config/env.
  - Nadpisania URL przez env (`OPENCLAW_GATEWAY_URL`) mogą używać tylko danych uwierzytelniających z env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Ustawienia domyślne trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (zdalny fallback ma zastosowanie tylko wtedy, gdy wejście lokalnego tokena auth nie jest ustawione)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (zdalny fallback ma zastosowanie tylko wtedy, gdy wejście lokalnego hasła auth nie jest ustawione)
- Ustawienia domyślne trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek Node-host dla trybu lokalnego: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Kontrole tokena dla zdalnych probe/status są domyślnie ścisłe: używają tylko `gateway.remote.token` (bez fallbacku do lokalnego tokena) przy kierowaniu na tryb zdalny.
- Nadpisania env Gateway używają tylko `OPENCLAW_GATEWAY_*`.

## Chat UI przez SSH

WebChat nie używa już osobnego portu HTTP. Interfejs czatu SwiftUI łączy się bezpośrednio z Gateway WebSocket.

- Przekaż przez SSH port `18789` (zobacz wyżej), a następnie podłącz klientów do `ws://127.0.0.1:18789`.
- Na macOS preferuj tryb „Remote over SSH” aplikacji, który automatycznie zarządza tunelem.

## Aplikacja macOS „Remote over SSH”

Aplikacja menu bar dla macOS może obsłużyć tę samą konfigurację od początku do końca (zdalne kontrole statusu, WebChat i przekazywanie Voice Wake).

Runbook: [zdalny dostęp na macOS](/pl/platforms/mac/remote).

## Zasady bezpieczeństwa (zdalnie/VPN)

W skrócie: **utrzymuj Gateway tylko na loopback**, chyba że masz pewność, że potrzebujesz bind.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsze ustawienie domyślne (brak publicznej ekspozycji).
- Zwykły `ws://` jest domyślnie dozwolony tylko dla loopback. Dla zaufanych sieci prywatnych
  ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
  rozwiązanie awaryjne. Nie ma odpowiednika w `openclaw.json`; musi to być
  zmienna środowiskowa procesu klienta nawiązującego połączenie WebSocket.
- **Bindowanie poza loopback** (`lan`/`tailnet`/`custom` albo `auto`, gdy loopback jest niedostępny) musi używać auth gateway: tokena, hasła albo reverse proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` to źródła danych uwierzytelniających klienta. Same z siebie **nie** konfigurują auth po stronie serwera.
- Lokalne ścieżki call mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozpoznawanie kończy się zamkniętym błędem (brak maskującego fallbacku zdalnego).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości,
  gdy `gateway.auth.allowTailscale: true`; endpointy HTTP API nie używają tego
  auth nagłówków Tailscale i zamiast tego stosują zwykły tryb auth gateway dla HTTP.
  Ten przepływ bez tokena zakłada, że host gateway jest zaufany. Ustaw tę opcję na
  `false`, jeśli chcesz używać auth opartych na współdzielonym sekrecie wszędzie.
- Auth **trusted-proxy** jest przeznaczone wyłącznie do konfiguracji reverse proxy świadomych tożsamości poza loopback.
  Reverse proxy typu loopback na tym samym hoście nie spełniają warunków `gateway.auth.mode: "trusted-proxy"`.
- Traktuj sterowanie przeglądarką jak dostęp operatorski: tylko tailnet + celowe parowanie Nodeów.

Szczegółowe omówienie: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najprostszą trwałą konfiguracją jest wpis SSH `LocalForward` oraz LaunchAgent, który utrzymuje tunel przy życiu po restartach i awariach.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` własnymi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token gateway

Zapisz token w konfiguracji, aby był zachowywany po restartach:

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

Tunel będzie uruchamiany automatycznie przy logowaniu, restartowany po awarii i będzie utrzymywał przekazany port aktywny.

Uwaga: jeśli masz pozostały `com.openclaw.ssh-tunnel` LaunchAgent ze starszej konfiguracji, wyładuj go i usuń.

#### Rozwiązywanie problemów

Sprawdź, czy tunel działa:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Uruchom tunel ponownie:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Zatrzymaj tunel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Wpis konfiguracji                    | Co robi                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Przekazuje lokalny port 18789 na zdalny port 18789           |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekazywanie portów) |
| `KeepAlive`                          | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                          | Uruchamia tunel po załadowaniu LaunchAgent przy logowaniu    |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego gateway](/pl/gateway/remote-gateway-readme)
