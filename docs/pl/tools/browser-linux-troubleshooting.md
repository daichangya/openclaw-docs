---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Napraw problemy z uruchamianiem CDP w Chrome/Brave/Edge/Chromium dla sterowania przeglądarką OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-04-25T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problem: „Nie udało się uruchomić Chrome CDP na porcie 18800”

Serwer sterowania przeglądarką OpenClaw nie uruchamia Chrome/Brave/Edge/Chromium z błędem:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Przyczyna główna

W Ubuntu (i wielu dystrybucjach Linux) domyślna instalacja Chromium jest **pakietem snap**. Ograniczenia AppArmor w snap kolidują ze sposobem, w jaki OpenClaw uruchamia i monitoruje proces przeglądarki.

Polecenie `apt install chromium` instaluje pakiet pośredni, który przekierowuje do snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

To NIE jest prawdziwa przeglądarka — to tylko wrapper.

Inne typowe błędy uruchamiania w Linux:

- `The profile appears to be in use by another Chromium process` oznacza, że Chrome
  znalazł stare pliki blokady `Singleton*` w katalogu zarządzanego profilu. OpenClaw
  usuwa te blokady i ponawia próbę raz, gdy blokada wskazuje na martwy proces lub proces z innego hosta.
- `Missing X server or $DISPLAY` oznacza, że jawnie zażądano widocznej przeglądarki
  na hoście bez sesji desktopowej. Domyślnie lokalne zarządzane profile
  wracają teraz do trybu headless w Linux, gdy zarówno `DISPLAY`, jak i
  `WAYLAND_DISPLAY` są nieustawione. Jeśli ustawisz `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` albo `browser.profiles.<name>.headless: false`,
  usuń to nadpisanie trybu z GUI, ustaw `OPENCLAW_BROWSER_HEADLESS=1`, uruchom `Xvfb`,
  uruchom `openclaw browser start --headless` dla jednorazowego zarządzanego uruchomienia albo uruchom
  OpenClaw w rzeczywistej sesji desktopowej.

### Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)

Zainstaluj oficjalny pakiet `.deb` Google Chrome, który nie jest sandboxowany przez snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jeśli wystąpią błędy zależności
```

Następnie zaktualizuj konfigurację OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Rozwiązanie 2: Użyj Snap Chromium w trybie tylko dołączania

Jeśli musisz używać snap Chromium, skonfiguruj OpenClaw tak, aby dołączał do ręcznie uruchomionej przeglądarki:

1. Zaktualizuj konfigurację:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Uruchom Chromium ręcznie:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Opcjonalnie utwórz usługę użytkownika systemd do automatycznego uruchamiania Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Włącz przez: `systemctl --user enable --now openclaw-browser.service`

### Weryfikacja działania przeglądarki

Sprawdź status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Przetestuj przeglądanie:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Dokumentacja konfiguracji

| Opcja                            | Opis                                                                 | Domyślnie                                                   |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Włącza sterowanie przeglądarką                                       | `true`                                                      |
| `browser.executablePath`         | Ścieżka do binarnego pliku przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywana automatycznie (preferuje domyślną przeglądarkę, jeśli jest oparta na Chromium) |
| `browser.headless`               | Uruchamianie bez GUI                                                 | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Nadpisanie per proces dla trybu headless lokalnej zarządzanej przeglądarki | nieustawione                                            |
| `browser.noSandbox`              | Dodaje flagę `--no-sandbox` (potrzebne w niektórych konfiguracjach Linux) | `false`                                               |
| `browser.attachOnly`             | Nie uruchamia przeglądarki, tylko dołącza do istniejącej             | `false`                                                     |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Timeout wykrywania lokalnego zarządzanego Chrome                     | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Timeout gotowości lokalnego zarządzanego CDP po uruchomieniu         | `8000`                                                      |

Na Raspberry Pi, starszych hostach VPS lub przy wolnym storage zwiększ
`browser.localLaunchTimeoutMs`, gdy Chrome potrzebuje więcej czasu na udostępnienie swojego endpointu
HTTP CDP. Zwiększ `browser.localCdpReadyTimeoutMs`, gdy uruchomienie się powiedzie, ale
`openclaw browser start` nadal zgłasza `not reachable after start`. Wartości są
ograniczone do 120000 ms.

### Problem: „Nie znaleziono kart Chrome dla profile="user"”

Używasz profilu `existing-session` / Chrome MCP. OpenClaw widzi lokalnego Chrome,
ale nie ma otwartych kart, do których można się dołączyć.

Możliwe rozwiązania:

1. **Użyj zarządzanej przeglądarki:** `openclaw browser start --browser-profile openclaw`
   (albo ustaw `browser.defaultProfile: "openclaw"`).
2. **Użyj Chrome MCP:** upewnij się, że lokalny Chrome działa i ma co najmniej jedną otwartą kartę, a następnie spróbuj ponownie z `--browser-profile user`.

Uwagi:

- `user` działa tylko na hoście. Dla serwerów Linux, kontenerów lub hostów zdalnych preferuj profile CDP.
- `user` / inne profile `existing-session` zachowują bieżące ograniczenia Chrome MCP:
  akcje oparte na ref, hooki przesyłania jednego pliku, brak nadpisań timeoutów dialogów, brak
  `wait --load networkidle`, brak `responsebody`, eksportu PDF, przechwytywania pobrań
  ani akcji wsadowych.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S) do wykrywania `/json/version`, albo WS(S), gdy Twoja usługa
  przeglądarki udostępnia bezpośredni URL gniazda DevTools.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie przeglądarki](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
