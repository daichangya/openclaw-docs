---
read_when:
    - Używasz `openclaw browser` i chcesz przykładów typowych zadań
    - Chcesz sterować przeglądarką działającą na innym komputerze przez host Node
    - Chcesz połączyć się ze swoją lokalną, zalogowaną przeglądarką Chrome przez Chrome MCP
summary: Dokumentacja referencyjna CLI dla `openclaw browser` (cykl życia, profile, zakładki, działania, stan i debugowanie)
title: Przeglądarka
x-i18n:
    generated_at: "2026-04-25T13:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i uruchamiaj działania przeglądarki (cykl życia, profile, karty, snapshoty, zrzuty ekranu, nawigacja, wejście, emulacja stanu i debugowanie).

Powiązane:

- Narzędzie Browser + API: [Narzędzie Browser](/pl/tools/browser)

## Typowe flagi

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (domyślnie z config).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--timeout <ms>`: limit czasu żądania (ms).
- `--expect-final`: czekaj na końcową odpowiedź Gateway.
- `--browser-profile <name>`: wybierz profil przeglądarki (domyślny z config).
- `--json`: wyjście czytelne maszynowo (tam, gdzie obsługiwane).

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenci mogą uruchomić tę samą kontrolę gotowości za pomocą `browser({ action: "doctor" })`.

## Szybkie rozwiązywanie problemów

Jeśli `start` kończy się błędem `not reachable after start`, najpierw sprawdź gotowość CDP. Jeśli `start` i `tabs` działają, ale `open` lub `navigate` kończy się błędem, płaszczyzna sterowania przeglądarką działa prawidłowo, a problem zwykle dotyczy zasad SSRF nawigacji.

Minimalna sekwencja:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Szczegółowe wskazówki: [Rozwiązywanie problemów z Browser](/pl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cykl życia

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Uwagi:

- Dla profili `attachOnly` i zdalnych CDP `openclaw browser stop` zamyka
  aktywną sesję sterowania i czyści tymczasowe nadpisania emulacji nawet wtedy,
  gdy OpenClaw nie uruchomił sam procesu przeglądarki.
- Dla lokalnych zarządzanych profili `openclaw browser stop` zatrzymuje
  uruchomiony proces przeglądarki.
- `openclaw browser start --headless` dotyczy tylko tego żądania startu i
  tylko wtedy, gdy OpenClaw uruchamia lokalnie zarządzaną przeglądarkę. Nie
  nadpisuje `browser.headless` ani config przeglądarki i nic nie robi dla już
  uruchomionej przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne zarządzane profile
  działają automatycznie w trybie headless, chyba że `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` lub `browser.profiles.<name>.headless=false`
  jawnie żąda widocznej przeglądarki.

## Jeśli polecenia brakuje

Jeśli `openclaw browser` jest nierozpoznanym poleceniem, sprawdź `plugins.allow` w
`~/.openclaw/openclaw.json`.

Gdy `plugins.allow` jest obecne, dołączony Plugin browser musi być wymieniony
jawnie:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` nie przywraca podpolecenia CLI, gdy lista dozwolonych Plugin wyklucza `browser`.

Powiązane: [Narzędzie Browser](/pl/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routingu przeglądarki. W praktyce:

- `openclaw`: uruchamia lub dołącza do dedykowanej instancji Chrome zarządzanej przez OpenClaw (izolowany katalog danych użytkownika).
- `user`: steruje istniejącą zalogowaną sesją Chrome przez Chrome DevTools MCP.
- niestandardowe profile CDP: wskazują lokalny lub zdalny endpoint CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Użyj konkretnego profilu:

```bash
openclaw browser --browser-profile work tabs
```

## Karty

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` zwraca najpierw `suggestedTargetId`, potem stabilne `tabId`, takie jak `t1`,
opcjonalną etykietę oraz surowe `targetId`. Agenci powinni przekazywać
`suggestedTargetId` z powrotem do `focus`, `close`, snapshotów i działań. Możesz
przypisać etykietę za pomocą `open --label`, `tab new --label` lub `tab label`; etykiety,
ID kart, surowe ID targetu i unikalne prefiksy ID targetu są akceptowane.

## Snapshot / zrzut ekranu / działania

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Zrzut ekranu:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Uwagi:

- `--full-page` służy tylko do przechwytywania całej strony; nie można go łączyć z `--ref`
  ani `--element`.
- Profile `existing-session` / `user` obsługują zrzuty ekranu strony i zrzuty z `--ref`
  z wyjścia snapshotu, ale nie obsługują zrzutów CSS `--element`.
- `--labels` nakłada bieżące odwołania snapshotu na zrzut ekranu.
- `snapshot --urls` dołącza odkryte cele linków do snapshotów AI, aby
  agenci mogli wybierać bezpośrednie cele nawigacji zamiast zgadywać wyłącznie na podstawie tekstu linku.

Nawigacja/kliknięcie/pisanie (automatyzacja UI oparta na ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Pomocnicy plików i dialogów:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Zarządzane profile Chrome zapisują zwykłe pobrania wywołane kliknięciem do katalogu
pobrań OpenClaw (`/tmp/openclaw/downloads` domyślnie lub skonfigurowany katalog
tymczasowy). Użyj `waitfordownload` lub `download`, gdy agent musi poczekać na
konkretny plik i zwrócić jego ścieżkę; te jawne mechanizmy oczekiwania przejmują
własność nad następnym pobraniem.

## Stan i pamięć

Viewport + emulacja:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + pamięć:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugowanie

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Istniejąca przeglądarka Chrome przez MCP

Użyj wbudowanego profilu `user` albo utwórz własny profil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ta ścieżka działa tylko na hoście. Dla Docker, serwerów headless, Browserless lub innych zdalnych konfiguracji użyj zamiast tego profilu CDP.

Bieżące ograniczenia existing-session:

- działania oparte na snapshotach używają ref, nie selektorów CSS
- `browser.actionTimeoutMs` ustawia domyślny limit `act` na 60000 ms, gdy
  wywołujący pomijają `timeoutMs`; `timeoutMs` per wywołanie nadal ma pierwszeństwo.
- `click` obsługuje tylko kliknięcie lewym przyciskiem
- `type` nie obsługuje `slowly=true`
- `press` nie obsługuje `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` i `evaluate` odrzucają
  nadpisania limitu czasu per wywołanie
- `select` obsługuje tylko jedną wartość
- `wait --load networkidle` nie jest obsługiwane
- wysyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje CSS
  `--element` i obecnie obsługuje jeden plik naraz
- haki dialogów nie obsługują `--timeout`
- zrzuty ekranu obsługują przechwytywanie strony i `--ref`, ale nie CSS `--element`
- `responsebody`, przechwytywanie pobrań, eksport PDF i działania wsadowe nadal
  wymagają zarządzanej przeglądarki lub surowego profilu CDP

## Zdalne sterowanie przeglądarką (proxy hosta node)

Jeśli Gateway działa na innej maszynie niż przeglądarka, uruchom **host node** na maszynie z Chrome/Brave/Edge/Chromium. Gateway będzie przekazywać działania przeglądarki do tego node (nie jest wymagany oddzielny serwer sterowania przeglądarką).

Użyj `gateway.nodes.browser.mode`, aby sterować automatycznym routingiem, oraz `gateway.nodes.browser.node`, aby przypiąć konkretny node, jeśli podłączonych jest kilka.

Bezpieczeństwo + konfiguracja zdalna: [Narzędzie Browser](/pl/tools/browser), [Dostęp zdalny](/pl/gateway/remote), [Tailscale](/pl/gateway/tailscale), [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Browser](/pl/tools/browser)
