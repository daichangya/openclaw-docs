---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta przez lokalne API sterowania
    - Szukasz dokumentacji CLI `openclaw browser`
    - Dodawanie własnej automatyzacji przeglądarki z użyciem snapshotów i odwołań
summary: API sterowania przeglądarką OpenClaw, dokumentacja CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-04-26T11:42:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Aby uzyskać informacje o konfiguracji, ustawieniach i rozwiązywaniu problemów, zobacz [Przeglądarka](/pl/tools/browser).
Ta strona jest dokumentacją lokalnego control HTTP API, CLI `openclaw browser`
oraz wzorców skryptowych (snapshoty, odwołania, oczekiwania, przepływy debugowania).

## Control API (opcjonalne)

Tylko dla lokalnych integracji Gateway udostępnia niewielkie loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie punkty końcowe akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia bezgłowego dla lokalnie zarządzanych profili bez zmiany zapisanej
konfiguracji przeglądarki; profile attach-only, zdalne CDP i existing-session odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway za pomocą shared-secret, trasy HTTP przeglądarki również wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback browser API **nie** korzysta z trusted-proxy ani
  nagłówków tożsamości Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te loopback browser
  routes nie dziedziczą tych trybów niosących tożsamość; pozostaw je dostępne tylko przez loopback.

### Kontrakt błędu `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
niepowodzeń polityki:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` lub nie jest rozpoznawane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu lub zbatchowane `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili existing-session.

Inne błędy środowiska uruchomieniowego mogą nadal zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/AI snapshot/role snapshot, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Snapshoty ARIA
- Snapshoty dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP per karta. To
  rozwiązanie awaryjne do inspekcji i wykrywania odwołań; Playwright pozostaje głównym silnikiem akcji.
- Zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest WebSocket CDP per karta
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na odwołaniach `existing-session` (`--ref`) z wyjścia snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Snapshoty AI zależne od natywnego formatu snapshotów AI Playwright
- Zrzuty ekranu elementów według selektora CSS (`--element`)
- eksport pełnego PDF przeglądarki

Zrzuty ekranu elementów odrzucają również `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, napraw
zależności środowiska uruchomieniowego dołączonego Plugin przeglądarki, tak aby `playwright-core` był zainstalowany,
a następnie uruchom ponownie gateway. Dla instalacji pakietowych uruchom `openclaw doctor --fix`.
Dla Docker dodatkowo zainstaluj binaria przeglądarki Chromium, jak pokazano poniżej.

#### Instalacja Playwright w Docker

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład,
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest zachowane przez
`OPENCLAW_HOME_VOLUME` lub bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Niewielki loopback control server akceptuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (kliknięcie/pisanie/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą się pod spodem swobodnie zmieniać.

## Krótka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json` dla danych wyjściowych czytelnych maszynowo.

<AccordionGroup>

<Accordion title="Podstawy: status, karty, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # jednorazowe lokalne zarządzane uruchomienie bezgłowe
openclaw browser stop            # czyści też emulację w attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # skrót do bieżącej karty
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspekcja: zrzut ekranu, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # lub --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Akcje: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # lub e12 dla odwołań ról
openclaw browser click-coords 120 340        # współrzędne viewportu
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Stan: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear aby usunąć
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Uwagi:

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem, które wywołuje wybór pliku/okno dialogowe.
- `click`/`type`/itp. wymagają `ref` ze `snapshot` (numeryczne `12`, odwołanie roli `e12` lub możliwe do wykonania odwołanie ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w viewport jest jedynym niezawodnym celem.
- Ścieżki download, trace i upload są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (awaryjnie: `${os.tmpdir()}/openclaw/...`).
- `upload` może też bezpośrednio ustawiać inputy plików przez `--input-ref` lub `--element`.

Stabilne identyfikatory kart i etykiety przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może potwierdzić kartę zastępczą, na przykład ten sam URL albo pojedyncza stara karta stająca się
pojedynczą nową kartą po wysłaniu formularza. Surowe identyfikatory celów są nadal zmienne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi snapshotu w skrócie:

- `--format ai` (domyślnie z Playwright): snapshot AI z odwołaniami numerycznymi (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy dostępny jest Playwright, OpenClaw wiąże odwołania z identyfikatorami DOM backendu do aktywnej strony, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj dane wyjściowe tylko jako materiał do inspekcji.
- `--efficient` (lub `--mode efficient`): kompaktowy preset snapshotu ról. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby było to ustawienie domyślne (zobacz [Konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają snapshot ról z odwołaniami `ref=e12`. `--frame "<iframe>"` ogranicza snapshoty ról do iframe.
- `--labels` dodaje zrzut ekranu tylko viewport z nałożonymi etykietami odwołań (wypisuje `MEDIA:<path>`).
- `--urls` dołącza wykryte cele linków do snapshotów AI.

## Snapshoty i odwołania

OpenClaw obsługuje dwa style „snapshotów”:

- **Snapshot AI (odwołania numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Dane wyjściowe: tekstowy snapshot zawierający odwołania numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `aria-ref` Playwright.

- **Snapshot ról (odwołania ról, takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Dane wyjściowe: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewport z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny i agent potrzebuje konkretnych
    celów nawigacji.

- **Snapshot ARIA (odwołania ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Dane wyjściowe: drzewo dostępności jako uporządkowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka snapshotu może powiązać
    odwołanie przez Playwright i identyfikatory DOM backendu Chrome.
- Jeśli Playwright jest niedostępny, snapshoty ARIA nadal mogą być przydatne do
  inspekcji, ale odwołania mogą nie nadawać się do wykonania. Wykonaj ponowny snapshot z `--format ai`
  lub `--interactive`, gdy potrzebujesz odwołań do akcji.
- Dowód Docker dla ścieżki awaryjnej raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról
  zawierają URL-e linków, klikalne elementy promowane kursorem i metadane iframe.

Zachowanie odwołań:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, ponownie uruchom `snapshot` i użyj nowego odwołania.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy potrafi potwierdzić kartę zastępczą. Dla kolejnych poleceń nadal używaj
  stabilnych identyfikatorów/etykiet kart.
- Jeśli snapshot ról został wykonany z `--frame`, odwołania ról są ograniczone do tego iframe aż do następnego snapshotu ról.
- Nieznane lub nieaktualne odwołania `axN` kończą się natychmiast błędem zamiast przechodzić dalej do
  selektora `aria-ref` Playwright. Gdy tak się stanie, wykonaj nowy snapshot na tej samej karcie.

## Rozszerzone możliwości oczekiwania

Możesz czekać na więcej niż tylko czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekanie, aż selektor stanie się widoczny:
  - `openclaw browser wait "#main"`

Można je łączyć:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Przepływy debugowania

Gdy akcja kończy się niepowodzeniem (np. „not visible”, „strict mode violation”, „covered”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (w trybie interaktywnym preferuj odwołania ról)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, co Playwright wskazuje jako cel
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj trace:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptowania i narzędzi uporządkowanych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshoty ról w JSON zawierają `refs` oraz niewielki blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły analizować rozmiar i gęstość ładunku.

## Ustawienia stanu i środowiska

Są przydatne w przepływach typu „spraw, aby strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- Uwierzytelnianie HTTP basic: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / ustawienia regionalne: `set timezone ...`, `set locale ...`
- Urządzenie / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Dla logowań i uwag dotyczących anti-bot (X/Twitter itp.) zobacz [Logowanie w przeglądarce + publikowanie w X/Twitter](/pl/tools/browser-login).
- Utrzymuj host Gateway/node jako prywatny (tylko loopback lub tylko tailnet).
- Zdalne punkty końcowe CDP mają szerokie uprawnienia; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokuje prywatne/wewnętrzne cele):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // opcjonalne dokładne zezwolenie
    },
  },
}
```

## Powiązane

- [Przeglądarka](/pl/tools/browser) — omówienie, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) — logowanie do stron
- [Rozwiązywanie problemów z przeglądarką w Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
