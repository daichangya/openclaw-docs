---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta przez lokalne API sterowania
    - Szukasz dokumentacji CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z użyciem migawek i odwołań
summary: API sterowania przeglądarką OpenClaw, dokumentacja CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-04-25T13:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Informacje o konfiguracji, ustawieniach i rozwiązywaniu problemów znajdziesz w [Browser](/pl/tools/browser).
Ta strona jest dokumentacją lokalnego kontrolnego API HTTP, CLI `openclaw browser`
oraz wzorców skryptowania (migawki, odwołania, oczekiwania, przepływy debugowania).

## API sterowania (opcjonalne)

Wyłącznie dla integracji lokalnych Gateway udostępnia niewielkie loopback API HTTP:

- Stan/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Migawka/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie endpointy akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia bezgłowego dla lokalnych zarządzanych profili bez zmiany trwałej
konfiguracji przeglądarki; profile typu attach-only, zdalne CDP i existing-session odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway współdzielonym sekretem, trasy HTTP przeglądarki także wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback API przeglądarki **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te loopback trasy przeglądarki
  nie dziedziczą tych trybów niosących tożsamość; pozostaw je dostępne tylko przez loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
niepowodzeń polityk:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` lub nie zostało rozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu lub wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili existing-session.

Inne błędy środowiska uruchomieniowego mogą nadal zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/AI snapshot/role snapshot, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Zrzuty ekranu strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP dla karty
- Zrzuty ekranu strony dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu `existing-session` oparte na odwołaniach (`--ref`) z danych wyjściowych migawek

Co nadal wymaga Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- zrzuty ekranu elementów z selektorem CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, napraw
dołączone zależności runtime Plugin przeglądarki, aby `playwright-core` było zainstalowane,
a następnie zrestartuj Gateway. W przypadku instalacji pakietowych uruchom `openclaw doctor --fix`.
W Dockerze zainstaluj również pliki binarne przeglądarki Chromium, jak pokazano poniżej.

#### Instalacja Docker Playwright

Jeśli Twój Gateway działa w Dockerze, unikaj `npx playwright` (konflikty npm override).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane pliki przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład,
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest zachowywane przez
`OPENCLAW_HOME_VOLUME` lub bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Niewielki loopback serwer sterowania akceptuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niewymagające Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą być swobodnie podmieniane pod spodem.

## Szybka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json` dla danych wyjściowych czytelnych dla maszyn.

<AccordionGroup>

<Accordion title="Podstawy: stan, karty, otwieranie/przełączanie/zamykanie">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # jednorazowe bezgłowe uruchomienie lokalnie zarządzane
openclaw browser stop            # czyści także emulację w profilach attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # skrót dla bieżącej karty
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspekcja: zrzut ekranu, migawka, konsola, błędy, żądania">

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
openclaw browser click 12 --double           # lub e12 dla odwołań roli
openclaw browser click-coords 120 340        # współrzędne obszaru widoku
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

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed click/press, które wywołuje wybór pliku/okno dialogowe.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numeryczne `12`, odwołanie roli `e12` lub wykonalne odwołanie ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy jedynym wiarygodnym celem jest widoczna pozycja w obszarze widoku.
- Ścieżki download, trace i upload są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (awaryjnie: `${os.tmpdir()}/openclaw/...`).
- `upload` może też bezpośrednio ustawiać file input przez `--input-ref` lub `--element`.

Skrót flag migawki:

- `--format ai` (domyślnie z Playwright): AI snapshot z numerycznymi odwołaniami (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże odwołania z backendowymi identyfikatorami DOM z aktywną stroną, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj dane wyjściowe wyłącznie jako inspekcję.
- `--efficient` (lub `--mode efficient`): kompaktowy preset role snapshot. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby był to tryb domyślny (zobacz [Konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają role snapshot z odwołaniami `ref=e12`. `--frame "<iframe>"` ogranicza role snapshot do iframe.
- `--labels` dodaje zrzut ekranu tylko obszaru widoku z nakładanymi etykietami odwołań (wypisuje `MEDIA:<path>`).
- `--urls` dołącza wykryte cele linków do AI snapshot.

## Migawki i odwołania

OpenClaw obsługuje dwa style „migawek”:

- **AI snapshot (numeryczne odwołania)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Dane wyjściowe: tekstowa migawka zawierająca numeryczne odwołania.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `aria-ref` Playwright.

- **Role snapshot (odwołania roli takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Dane wyjściowe: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu obszaru widoku z nakładanymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny i agent potrzebuje konkretnych
    celów nawigacji.

- **ARIA snapshot (odwołania ARIA takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Dane wyjściowe: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    odwołanie przez Playwright i backendowe identyfikatory DOM Chrome.
  - Jeśli Playwright nie jest dostępny, migawki ARIA nadal mogą być przydatne do
    inspekcji, ale odwołania mogą nie być wykonalne. Wykonaj nową migawkę z `--format ai`
    lub `--interactive`, gdy potrzebujesz wykonalnych odwołań.

Zachowanie odwołań:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, ponownie uruchom `snapshot` i użyj nowego odwołania.
- Jeśli role snapshot wykonano z `--frame`, odwołania roli są ograniczone do tego iframe do czasu następnej role snapshot.
- Nieznane lub nieaktualne odwołania `axN` kończą się natychmiastowym błędem zamiast przechodzić dalej do
  selektora `aria-ref` Playwright. Gdy tak się stanie, wykonaj nową migawkę na tej samej karcie.

## Rozszerzone możliwości wait

Możesz czekać na więcej niż tylko czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan załadowania:
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

Gdy akcja się nie powiedzie (np. „not visible”, „strict mode violation”, „covered”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (w trybie interaktywnym preferuj odwołania roli)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, na co wskazuje Playwright
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj trace:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Dane wyjściowe JSON

`--json` służy do skryptowania i ustrukturyzowanych narzędzi.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot w JSON zawierają `refs` oraz niewielki blok `stats` (lines/chars/refs/interactive), dzięki czemu narzędzia mogą analizować rozmiar i gęstość ładunku.

## Przełączniki stanu i środowiska

Są przydatne w przepływach typu „spraw, aby strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- HTTP Basic auth: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / ustawienia regionalne: `set timezone ...`, `set locale ...`
- Urządzenie / obszar widoku:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako dane wrażliwe.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- W kwestii logowania i uwag dotyczących anti-bot (X/Twitter itp.) zobacz [Browser login + publikowanie w X/Twitter](/pl/tools/browser-login).
- Utrzymuj host Gateway/node jako prywatny (tylko loopback lub tailnet).
- Zdalne endpointy CDP są potężne; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokuj prywatne/wewnętrzne miejsca docelowe):

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

- [Browser](/pl/tools/browser) — przegląd, konfiguracja, profile, bezpieczeństwo
- [Browser login](/pl/tools/browser-login) — logowanie do witryn
- [Rozwiązywanie problemów z Browser na Linuxie](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z Browser w WSL2 przy zdalnym CDP w Windows](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
