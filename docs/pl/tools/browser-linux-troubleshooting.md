---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Napraw problemy z uruchamianiem CDP w Chrome/Brave/Edge/Chromium dla sterowania przeglądarką OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-04-26T11:41:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problem: „Nie udało się uruchomić Chrome CDP na porcie 18800”

Serwer sterowania przeglądarką OpenClaw nie może uruchomić Chrome/Brave/Edge/Chromium z błędem:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Główna przyczyna

W Ubuntu (i wielu dystrybucjach Linuxa) domyślna instalacja Chromium jest **pakietem snap**. Ograniczenia AppArmor w snapie zakłócają sposób, w jaki OpenClaw uruchamia i monitoruje proces przeglądarki.

Polecenie `apt install chromium` instaluje pakiet pośredni, który przekierowuje do snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

To NIE jest prawdziwa przeglądarka — to tylko wrapper.

Inne częste błędy uruchamiania w Linuxie:

- `The profile appears to be in use by another Chromium process` oznacza, że Chrome
  znalazł nieaktualne pliki blokady `Singleton*` w zarządzanym katalogu profilu. OpenClaw
  usuwa te blokady i ponawia próbę raz, gdy blokada wskazuje na martwy proces lub proces z innego hosta.
- `Missing X server or $DISPLAY` oznacza, że jawnie zażądano widocznej przeglądarki
  na hoście bez sesji pulpitu. Domyślnie lokalne zarządzane profile przechodzą teraz
  w tryb headless w Linuxie, gdy `DISPLAY` i `WAYLAND_DISPLAY` są jednocześnie nieustawione.
  Jeśli ustawisz `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` lub `browser.profiles.<name>.headless: false`,
  usuń to nadpisanie trybu z GUI, ustaw `OPENCLAW_BROWSER_HEADLESS=1`, uruchom `Xvfb`,
  użyj `openclaw browser start --headless` do jednorazowego zarządzanego uruchomienia albo uruchom
  OpenClaw w rzeczywistej sesji pulpitu.

### Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)

Zainstaluj oficjalny pakiet Google Chrome `.deb`, który nie jest sandboxowany przez snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
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

### Rozwiązanie 2: Użyj snap Chromium z trybem tylko do podłączania

Jeśli musisz używać snap Chromium, skonfiguruj OpenClaw tak, aby podłączał się do ręcznie uruchomionej przeglądarki:

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

3. Opcjonalnie utwórz usługę użytkownika systemd, aby automatycznie uruchamiać Chrome:

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

Włącz poleceniem: `systemctl --user enable --now openclaw-browser.service`

### Weryfikacja działania przeglądarki

Sprawdź stan:

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
| `browser.executablePath`         | Ścieżka do binarki przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywana automatycznie (preferuje domyślną przeglądarkę, jeśli jest oparta na Chromium) |
| `browser.headless`               | Uruchamianie bez GUI                                                 | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Nadpisanie dla procesu dla trybu headless lokalnej zarządzanej przeglądarki | nieustawione                                                |
| `browser.noSandbox`              | Dodaje flagę `--no-sandbox` (wymagana w niektórych konfiguracjach Linuxa) | `false`                                                     |
| `browser.attachOnly`             | Nie uruchamiaj przeglądarki, tylko podłączaj do istniejącej          | `false`                                                     |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Limit czasu wykrywania lokalnego zarządzanego Chrome                 | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Limit czasu gotowości CDP po uruchomieniu lokalnego zarządzanego Chrome | `8000`                                                   |

Na Raspberry Pi, starszych hostach VPS lub wolnych nośnikach zwiększ
`browser.localLaunchTimeoutMs`, gdy Chrome potrzebuje więcej czasu, aby udostępnić endpoint HTTP CDP.
Zwiększ `browser.localCdpReadyTimeoutMs`, gdy uruchomienie się powiedzie, ale
`openclaw browser start` nadal zgłasza `not reachable after start`. Wartości muszą
być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.

### Problem: „Nie znaleziono kart Chrome dla profile="user"”

Używasz profilu `existing-session` / Chrome MCP. OpenClaw widzi lokalny Chrome,
ale nie ma otwartych kart, do których można się podłączyć.

Opcje naprawy:

1. **Użyj zarządzanej przeglądarki:** `openclaw browser start --browser-profile openclaw`
   (lub ustaw `browser.defaultProfile: "openclaw"`).
2. **Użyj Chrome MCP:** upewnij się, że lokalny Chrome działa i ma co najmniej jedną otwartą kartę, a następnie ponów próbę z `--browser-profile user`.

Uwagi:

- `user` działa tylko na hoście. Dla serwerów Linux, kontenerów lub zdalnych hostów preferuj profile CDP.
- `user` / inne profile `existing-session` zachowują bieżące ograniczenia Chrome MCP:
  działania sterowane przez ref, hooki przesyłania jednego pliku, brak nadpisań limitu czasu okien dialogowych, brak
  `wait --load networkidle` oraz brak `responsebody`, eksportu PDF, przechwytywania pobierania i działań wsadowych.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S) do wykrywania `/json/version`, albo WS(S), gdy usługa przeglądarki
  udostępnia bezpośredni URL gniazda DevTools.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
