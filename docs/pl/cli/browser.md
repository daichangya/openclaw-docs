---
read_when:
    - Używasz `openclaw browser` i chcesz przykładów typowych zadań
    - Chcesz sterować przeglądarką uruchomioną na innej maszynie przez host Node
    - Chcesz połączyć się ze swoją lokalną, zalogowaną przeglądarką Chrome przez Chrome MCP
summary: Dokumentacja referencyjna CLI dla `openclaw browser` (cykl życia, profile, karty, akcje, stan i debugowanie)
title: Przeglądarka
x-i18n:
    generated_at: "2026-04-26T11:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i uruchamiaj akcje przeglądarki (cykl życia, profile, karty, snapshoty, zrzuty ekranu, nawigacja, wejście, emulacja stanu i debugowanie).

Powiązane:

- Narzędzie Browser + API: [Narzędzie Browser](/pl/tools/browser)

## Typowe flagi

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (domyślnie z konfiguracji).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--timeout <ms>`: limit czasu żądania (ms).
- `--expect-final`: czekaj na końcową odpowiedź Gateway.
- `--browser-profile <name>`: wybierz profil przeglądarki (domyślny z konfiguracji).
- `--json`: wynik czytelny maszynowo (tam, gdzie jest obsługiwany).

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenci mogą uruchomić ten sam test gotowości za pomocą `browser({ action: "doctor" })`.

## Szybkie rozwiązywanie problemów

Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem z gotowością CDP. Jeśli `start` i `tabs` działają, ale `open` lub `navigate` kończy się błędem, płaszczyzna sterowania przeglądarką jest sprawna, a problemem zwykle jest polityka SSRF dla nawigacji.

Minimalna sekwencja:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Szczegółowe wskazówki: [Rozwiązywanie problemów Browser](/pl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cykl życia

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Uwagi:

- `doctor --deep` dodaje test snapshotu na żywo. Jest przydatny, gdy podstawowa gotowość CDP jest zielona, ale chcesz potwierdzenia, że bieżącą kartę można inspekcjonować.
- Dla profili `attachOnly` i zdalnych CDP `openclaw browser stop` zamyka aktywną sesję sterowania i czyści tymczasowe nadpisania emulacji, nawet gdy OpenClaw sam nie uruchomił procesu przeglądarki.
- Dla lokalnych zarządzanych profili `openclaw browser stop` zatrzymuje uruchomiony proces przeglądarki.
- `openclaw browser start --headless` dotyczy tylko tego żądania uruchomienia i tylko wtedy, gdy OpenClaw uruchamia lokalnie zarządzaną przeglądarkę. Nie nadpisuje `browser.headless` ani konfiguracji profilu i nie robi nic dla już uruchomionej przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne zarządzane profile uruchamiają się automatycznie w trybie headless, chyba że `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` lub `browser.profiles.<name>.headless=false` jawnie wymusza widoczną przeglądarkę.

## Jeśli polecenie nie istnieje

Jeśli `openclaw browser` jest nierozpoznanym poleceniem, sprawdź `plugins.allow` w `~/.openclaw/openclaw.json`.

Gdy `plugins.allow` jest obecne, dołączony plugin browser musi być wymieniony jawnie:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` nie przywraca podpolecenia CLI, gdy allowlista pluginów wyklucza `browser`.

Powiązane: [Narzędzie Browser](/pl/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routingu przeglądarki. W praktyce:

- `openclaw`: uruchamia lub dołącza do dedykowanej instancji Chrome zarządzanej przez OpenClaw (izolowany katalog danych użytkownika).
- `user`: steruje istniejącą, zalogowaną sesją Chrome przez Chrome DevTools MCP.
- niestandardowe profile CDP: wskazują lokalny lub zdalny punkt końcowy CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Użycie konkretnego profilu:

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

`tabs` zwraca najpierw `suggestedTargetId`, następnie stabilne `tabId`, takie jak `t1`, opcjonalną etykietę i surowe `targetId`. Agenci powinni przekazywać `suggestedTargetId` z powrotem do `focus`, `close`, snapshotów i akcji. Możesz przypisać etykietę za pomocą `open --label`, `tab new --label` lub `tab label`; akceptowane są etykiety, identyfikatory kart, surowe identyfikatory celu i unikalne prefiksy identyfikatorów celu. Gdy Chromium zastępuje bazowy surowy cel podczas nawigacji lub wysyłania formularza, OpenClaw zachowuje stabilne `tabId`/etykietę przypięte do karty zastępczej, gdy może potwierdzić dopasowanie. Surowe identyfikatory celu pozostają niestabilne; preferuj `suggestedTargetId`.

## Snapshot / zrzut ekranu / akcje

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

- `--full-page` służy tylko do przechwytywania stron; nie można go łączyć z `--ref` ani `--element`.
- Profile `existing-session` / `user` obsługują zrzuty ekranu stron i zrzuty `--ref` z wyniku snapshotu, ale nie zrzuty CSS `--element`.
- `--labels` nakłada bieżące referencje snapshotu na zrzut ekranu.
- `snapshot --urls` dołącza wykryte adresy docelowe linków do snapshotów AI, aby agenci mogli wybierać bezpośrednie cele nawigacji zamiast zgadywać wyłącznie na podstawie tekstu linku.

Navigate/click/type (automatyzacja UI oparta na ref):

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

Odpowiedzi akcji zwracają bieżące surowe `targetId` po zastąpieniu strony wywołanym akcją, gdy OpenClaw może potwierdzić kartę zastępczą. Skrypty powinny nadal przechowywać i przekazywać `suggestedTargetId`/etykiety dla długotrwałych przepływów pracy.

Pomocniki plików i okien dialogowych:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Zarządzane profile Chrome zapisują zwykłe pobrania wywołane kliknięciem w katalogu pobrań OpenClaw (`/tmp/openclaw/downloads` domyślnie lub skonfigurowany katalog główny temp). Użyj `waitfordownload` lub `download`, gdy agent musi poczekać na określony plik i zwrócić jego ścieżkę; te jawne mechanizmy oczekiwania przejmują następne pobranie.

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

## Istniejący Chrome przez MCP

Użyj wbudowanego profilu `user` albo utwórz własny profil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ta ścieżka działa tylko na hoście. Dla Docker, serwerów headless, Browserless lub innych zdalnych konfiguracji użyj zamiast tego profilu CDP.

Bieżące ograniczenia existing-session:

- akcje sterowane snapshotem używają ref, a nie selektorów CSS
- `browser.actionTimeoutMs` ustawia domyślny limit 60000 ms dla obsługiwanych żądań `act`, gdy wywołujący pomijają `timeoutMs`; `timeoutMs` per wywołanie nadal ma pierwszeństwo
- `click` obsługuje tylko kliknięcie lewym przyciskiem
- `type` nie obsługuje `slowly=true`
- `press` nie obsługuje `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` i `evaluate` odrzucają nadpisania limitu czasu per wywołanie
- `select` obsługuje tylko jedną wartość
- `wait --load networkidle` nie jest obsługiwane
- przesyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje CSS `--element` i obecnie obsługuje tylko jeden plik naraz
- hooki okien dialogowych nie obsługują `--timeout`
- zrzuty ekranu obsługują przechwytywanie stron i `--ref`, ale nie CSS `--element`
- `responsebody`, przechwytywanie pobrań, eksport PDF i akcje wsadowe nadal wymagają zarządzanej przeglądarki lub surowego profilu CDP

## Zdalne sterowanie przeglądarką (proxy hosta node)

Jeśli Gateway działa na innej maszynie niż przeglądarka, uruchom **host node** na maszynie, która ma Chrome/Brave/Edge/Chromium. Gateway będzie proxyować akcje przeglądarki do tego node (bez potrzeby osobnego serwera sterowania przeglądarką).

Użyj `gateway.nodes.browser.mode`, aby sterować autoroutingiem, i `gateway.nodes.browser.node`, aby przypiąć konkretny node, jeśli podłączonych jest kilka.

Bezpieczeństwo + konfiguracja zdalna: [Narzędzie Browser](/pl/tools/browser), [Dostęp zdalny](/pl/gateway/remote), [Tailscale](/pl/gateway/tailscale), [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Browser](/pl/tools/browser)
