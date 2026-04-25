---
read_when:
    - Implementowanie funkcji aplikacji macOS
    - Zmiana cyklu życia Gateway lub mostkowania Node na macOS
summary: Aplikacja towarzysząca OpenClaw dla macOS (pasek menu + broker Gateway)
title: Aplikacja macOS
x-i18n:
    generated_at: "2026-04-25T13:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

Aplikacja macOS to **towarzysz z paska menu** dla OpenClaw. Odpowiada za uprawnienia,
zarządza lub dołącza lokalnie do Gateway (launchd albo ręcznie) i udostępnia
agentowi capabilities macOS jako Node.

## Co robi

- Wyświetla natywne powiadomienia i status na pasku menu.
- Odpowiada za monity TCC (Powiadomienia, Dostępność, Nagrywanie ekranu, Mikrofon,
  Rozpoznawanie mowy, Automation/AppleScript).
- Uruchamia Gateway lub łączy się z nim (lokalnie albo zdalnie).
- Udostępnia narzędzia tylko dla macOS (Canvas, Camera, Screen Recording, `system.run`).
- Uruchamia lokalną usługę hosta Node w trybie **remote** (launchd) i zatrzymuje ją w trybie **local**.
- Opcjonalnie hostuje **PeekabooBridge** do automatyzacji UI.
- Na żądanie instaluje globalne CLI (`openclaw`) przez npm, pnpm albo bun (aplikacja preferuje npm, potem pnpm, potem bun; Node pozostaje zalecanym runtime Gateway).

## Tryb local vs remote

- **Local** (domyślnie): aplikacja dołącza do działającego lokalnego Gateway, jeśli jest dostępny;
  w przeciwnym razie włącza usługę launchd przez `openclaw gateway install`.
- **Remote**: aplikacja łączy się z Gateway przez SSH/Tailscale i nigdy nie uruchamia
  lokalnego procesu.
  Aplikacja uruchamia lokalną **usługę hosta Node**, aby zdalny Gateway mógł dotrzeć do tego Maca.
  Aplikacja nie uruchamia Gateway jako procesu podrzędnego.
  Odkrywanie Gateway preferuje teraz nazwy Tailscale MagicDNS zamiast surowych adresów tailnet IP,
  dzięki czemu aplikacja Mac odzyskuje połączenie bardziej niezawodnie, gdy adresy IP tailnet się zmieniają.

## Sterowanie Launchd

Aplikacja zarządza per-użytkownik LaunchAgent o etykiecie `ai.openclaw.gateway`
(lub `ai.openclaw.<profile>` przy użyciu `--profile`/`OPENCLAW_PROFILE`; starsze `com.openclaw.*` nadal się wyładowuje).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Zastąp etykietę przez `ai.openclaw.<profile>`, gdy używasz nazwanego profilu.

Jeśli LaunchAgent nie jest zainstalowany, włącz go z aplikacji albo uruchom
`openclaw gateway install`.

## Capabilities Node (mac)

Aplikacja macOS przedstawia się jako Node. Typowe polecenia:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node raportuje mapę `permissions`, dzięki czemu agenci mogą zdecydować, co jest dozwolone.

Usługa Node + IPC aplikacji:

- Gdy działa bezgłowa usługa hosta Node (tryb remote), łączy się z Gateway WS jako Node.
- `system.run` wykonuje się w aplikacji macOS (kontekst UI/TCC) przez lokalne gniazdo Unix; monity i wyjście pozostają w aplikacji.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Zatwierdzenia exec (`system.run`)

`system.run` jest kontrolowane przez **Exec approvals** w aplikacji macOS (Ustawienia → Exec approvals).
Ustawienia bezpieczeństwa + ask + allowlist są przechowywane lokalnie na Macu w:

```
~/.openclaw/exec-approvals.json
```

Przykład:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Uwagi:

- Wpisy `allowlist` to wzorce glob dla rozwiązanych ścieżek binarnych albo same nazwy poleceń dla poleceń wywoływanych przez PATH.
- Surowy tekst polecenia powłoki zawierający składnię sterowania lub rozwinięć powłoki (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) jest traktowany jako chybienie allowlisty i wymaga jawnego zatwierdzenia (albo dodania binarnego pliku powłoki do allowlisty).
- Wybranie „Always Allow” w monicie dodaje to polecenie do allowlisty.
- Nadpisania środowiska `system.run` są filtrowane (usuwa `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), a następnie scalane ze środowiskiem aplikacji.
- Dla opakowań powłoki (`bash|sh|zsh ... -c/-lc`) nadpisania środowiska w zakresie żądania są redukowane do małej jawnej allowlisty (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Dla decyzji allow-always w trybie allowlisty znane opakowania dyspozycyjne (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) utrwalają wewnętrzne ścieżki wykonywalne zamiast ścieżek opakowań. Jeśli rozpakowanie nie jest bezpieczne, wpis allowlisty nie jest utrwalany automatycznie.

## Deep linki

Aplikacja rejestruje schemat URL `openclaw://` dla działań lokalnych.

### `openclaw://agent`

Wyzwala żądanie `agent` Gateway.
__OC_I18N_900004__
Parametry zapytania:

- `message` (wymagane)
- `sessionKey` (opcjonalne)
- `thinking` (opcjonalne)
- `deliver` / `to` / `channel` (opcjonalne)
- `timeoutSeconds` (opcjonalne)
- `key` (opcjonalny klucz trybu bezobsługowego)

Bezpieczeństwo:

- Bez `key` aplikacja prosi o potwierdzenie.
- Bez `key` aplikacja wymusza krótki limit długości wiadomości dla monitu potwierdzenia i ignoruje `deliver` / `to` / `channel`.
- Z prawidłowym `key` uruchomienie jest bezobsługowe (przeznaczone dla osobistych automatyzacji).

## Przepływ onboardingu (typowy)

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Przejdź listę kontrolną uprawnień (monity TCC).
3. Upewnij się, że aktywny jest tryb **Local**, a Gateway działa.
4. Zainstaluj CLI, jeśli chcesz mieć dostęp z terminala.

## Umieszczenie katalogu stanu (macOS)

Unikaj umieszczania katalogu stanu OpenClaw w iCloud lub innych folderach synchronizowanych z chmurą.
Ścieżki oparte na synchronizacji mogą zwiększać opóźnienia i czasami powodować wyścigi blokad plików/synchronizacji dla
sesji i danych uwierzytelniających.

Preferuj lokalną niesynchronizowaną ścieżkę stanu, taką jak:
__OC_I18N_900005__
Jeśli `openclaw doctor` wykryje stan w:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wyświetli ostrzeżenie i zaleci przeniesienie z powrotem do lokalnej ścieżki.

## Workflow build & dev (natywny)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (lub Xcode)
- Pakowanie aplikacji: `scripts/package-mac-app.sh`

## Debugowanie łączności Gateway (macOS CLI)

Użyj debug CLI, aby ćwiczyć ten sam handshake WebSocket Gateway i logikę odkrywania,
której używa aplikacja macOS, bez uruchamiania aplikacji.
__OC_I18N_900006__
Opcje connect:

- `--url <ws://host:port>`: nadpisuje konfigurację
- `--mode <local|remote>`: rozwiązuje z konfiguracji (domyślnie: config albo local)
- `--probe`: wymusza świeżą sondę stanu
- `--timeout <ms>`: timeout żądania (domyślnie: `15000`)
- `--json`: uporządkowane wyjście do porównań

Opcje discover:

- `--include-local`: uwzględnia Gateway, które w przeciwnym razie zostałyby odfiltrowane jako „local”
- `--timeout <ms>`: łączne okno odkrywania (domyślnie: `2000`)
- `--json`: uporządkowane wyjście do porównań

Wskazówka: porównaj z `openclaw gateway discover --json`, aby sprawdzić, czy
potok odkrywania aplikacji macOS (`local.` plus skonfigurowana domena wide-area, z
fallbackami wide-area i Tailscale Serve) różni się od
odkrywania opartego na `dns-sd` w Node CLI.

## Mechanika połączenia zdalnego (tunele SSH)

Gdy aplikacja macOS działa w trybie **Remote**, otwiera tunel SSH, aby lokalne komponenty UI
mogły rozmawiać ze zdalnym Gateway tak, jakby znajdował się na localhost.

### Tunel sterowania (port WebSocket Gateway)

- **Cel:** kontrole stanu, status, Web Chat, konfiguracja i inne wywołania control-plane.
- **Port lokalny:** port Gateway (domyślnie `18789`), zawsze stabilny.
- **Port zdalny:** ten sam port Gateway na zdalnym hoście.
- **Zachowanie:** brak losowego portu lokalnego; aplikacja ponownie używa istniejącego zdrowego tunelu
  albo restartuje go w razie potrzeby.
- **Kształt SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` z opcjami BatchMode +
  ExitOnForwardFailure + keepalive.
- **Raportowanie IP:** tunel SSH używa loopback, więc gateway zobaczy adres IP node
  jako `127.0.0.1`. Użyj transportu **Direct (ws/wss)**, jeśli chcesz, aby pojawił się rzeczywisty
  adres IP klienta (zobacz [zdalny dostęp macOS](/pl/platforms/mac/remote)).

Kroki konfiguracji znajdziesz w [zdalny dostęp macOS](/pl/platforms/mac/remote). Szczegóły
protokołu znajdziesz w [Gateway protocol](/pl/gateway/protocol).

## Powiązana dokumentacja

- [Runbook Gateway](/pl/gateway)
- [Gateway (macOS)](/pl/platforms/mac/bundled-gateway)
- [Uprawnienia macOS](/pl/platforms/mac/permissions)
- [Canvas](/pl/platforms/mac/canvas)
