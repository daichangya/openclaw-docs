---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego openclaw zakłóca działanie Twojej własnej przeglądarki Chrome
    - Implementacja ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-20T09:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Przeglądarka (zarządzana przez openclaw)

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, który agent kontroluje.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz Gateway (tylko loopback).

Perspektywa początkującego:

- Traktuj to jak **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** dotyka profilu Twojej osobistej przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i wpisywać tekst** w bezpiecznej ścieżce.
- Wbudowany profil `user` dołącza do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwieranie/fokus/zamykanie).
- Akcje agenta (kliknięcie/wpisywanie/przeciąganie/zaznaczanie), snapshoty, zrzuty ekranu, PDF-y.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, odizolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz ją w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli całkowicie brakuje `openclaw browser` albo agent mówi, że narzędzie browser
jest niedostępne, przejdź do [Brak polecenia lub narzędzia browser](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Plugin

Domyślne narzędzie `browser` jest teraz dołączonym Plugin, który jest domyślnie
włączony. Oznacza to, że możesz go wyłączyć lub zastąpić bez usuwania reszty
systemu Plugin OpenClaw:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Wyłącz dołączony Plugin przed instalacją innego Plugin, który udostępnia tę samą
nazwę narzędzia `browser`. Domyślne środowisko browser wymaga obu elementów:

- `plugins.entries.browser.enabled` nie może być wyłączone
- `browser.enabled=true`

Jeśli wyłączysz tylko Plugin, dołączone CLI browser (`openclaw browser`),
metoda Gateway (`browser.request`), narzędzie agenta i domyślna usługa sterowania browser
znikną razem. Twoja konfiguracja `browser.*` pozostanie nienaruszona, aby mogła zostać użyta
przez zastępczy Plugin.

Dołączony Plugin browser jest teraz także właścicielem implementacji runtime przeglądarki.
Rdzeń zachowuje jedynie współdzielone helpery Plugin SDK oraz re-exporty zgodności dla
starszych wewnętrznych ścieżek importu. W praktyce usunięcie lub zastąpienie pakietu Plugin browser
usuwa zestaw funkcji browser zamiast pozostawiać drugi runtime należący do rdzenia.

Zmiany konfiguracji browser nadal wymagają restartu Gateway, aby dołączony Plugin
mógł ponownie zarejestrować swoją usługę browser z nowymi ustawieniami.

## Brak polecenia lub narzędzia browser

Jeśli po aktualizacji `openclaw browser` nagle staje się nieznanym poleceniem albo
agent zgłasza, że brakuje narzędzia browser, najczęstszą przyczyną jest restrykcyjna lista
`plugins.allow`, która nie zawiera `browser`.

Przykład błędnej konfiguracji:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Napraw to, dodając `browser` do allowlisty Plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ważne uwagi:

- Samo `browser.enabled=true` nie wystarcza, gdy ustawione jest `plugins.allow`.
- Samo `plugins.entries.browser.enabled=true` także nie wystarcza, gdy ustawione jest `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **nie** ładuje dołączonego Plugin browser. Dostosowuje jedynie politykę narzędzi po tym, jak Plugin jest już załadowany.
- Jeśli nie potrzebujesz restrykcyjnej allowlisty Plugin, usunięcie `plugins.allow` także przywróci domyślne zachowanie dołączonej przeglądarki.

Typowe objawy:

- `openclaw browser` jest nieznanym poleceniem.
- Brakuje `browser.request`.
- Agent zgłasza narzędzie browser jako niedostępne lub brakujące.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (nie wymaga rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **prawdziwej zalogowanej przeglądarki Chrome**.

Dla wywołań narzędzia browser przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje i użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny prompt dołączenia.
- `profile` to jawne nadpisanie, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz, aby tryb zarządzany był domyślny.

## Konfiguracja

Ustawienia browser znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Uwagi:

- Usługa sterowania browser nasłuchuje na loopback na porcie wyliczanym z `gateway.port`
  (domyślnie: `18791`, czyli gateway + 2).
- Jeśli nadpiszesz port Gateway (`gateway.port` lub `OPENCLAW_GATEWAY_PORT`),
  wyliczone porty browser przesuną się, aby pozostać w tej samej „rodzinie”.
- `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, gdy nie jest ustawione.
- `remoteCdpTimeoutMs` dotyczy sprawdzania osiągalności zdalnego (nie-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` dotyczy sprawdzania osiągalności handshake WebSocket dla zdalnego CDP.
- Nawigacja browser/otwieranie karty jest chronione przed SSRF przed nawigacją i ponownie sprawdzane metodą best-effort dla końcowego URL `http(s)` po nawigacji.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie/proby zdalnych endpointów CDP (`cdpUrl`, w tym wyszukiwania `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone. Ustaw `true` tylko wtedy, gdy celowo ufasz dostępowi browser do sieci prywatnej.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias dla zgodności.
- `attachOnly: true` oznacza „nigdy nie uruchamiaj lokalnej przeglądarki; dołączaj tylko wtedy, gdy już działa”.
- `color` oraz `color` per profil barwią interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślnym profilem jest `openclaw` (samodzielna przeglądarka zarządzana przez OpenClaw). Użyj `defaultProfile: "user"`, aby przejść na zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl` — ustawiaj je tylko dla zdalnego CDP.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie
  ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session
  ma dołączać do niestandardowego profilu użytkownika Chromium, takiego jak Brave lub Edge.

## Używanie Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną przeglądarką systemową** jest przeglądarka oparta na Chromium (Chrome/Brave/Edge itd.),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie:

Przykład CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Sterowanie lokalne vs zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania na loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom hosta Node na maszynie, która ma przeglądarkę; Gateway będzie proxyfikować akcje browser do niego.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.

Zachowanie przy zatrzymaniu różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  został uruchomiony przez OpenClaw
- profile tylko-dołączane i profile zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan), mimo że
  żaden proces przeglądarki nie został uruchomiony przez OpenClaw

Zdalne URL-e CDP mogą zawierać uwierzytelnianie:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- HTTP Basic auth (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie przy wywoływaniu endpointów `/json/*` oraz przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast commitowania ich do plików konfiguracyjnych.

## Proxy browser Node (domyślnie zero konfiguracji)

Jeśli uruchamiasz **hosta Node** na maszynie, która ma Twoją przeglądarkę, OpenClaw może
automatycznie przekierowywać wywołania narzędzia browser do tego node bez dodatkowej konfiguracji browser.
To domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania browser przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` node (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste dla starszego/dom yślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: tylko profile z allowlisty mogą być celem, a trasy tworzenia/usuwania trwałych profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na node: `nodeHost.browserProxy.enabled=false`
  - Na gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowane zdalne CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
URL-e połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu browser najprostszą opcją jest bezpośredni URL WebSocket
z dokumentacji połączeń Browserless.

Przykład:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Uwagi:

- Zastąp `<BROWSERLESS_API_KEY>` swoim rzeczywistym tokenem Browserless.
- Wybierz endpoint regionu zgodny z Twoim kontem Browserless (szczegóły w ich dokumentacji).
- Jeśli Browserless podaje bazowy URL HTTPS, możesz albo przekonwertować go na
  `wss://` dla bezpośredniego połączenia CDP, albo zachować URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Bezpośredni dostawcy WebSocket CDP

Niektóre hostowane usługi przeglądarki udostępniają **bezpośredni endpoint WebSocket**
zamiast standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debuggera WebSocket, a następnie
  się łączy. Bez fallbacku WebSocket.
- **Bezpośrednie endpointy WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i pomija
  całkowicie `/json/version`.
- **Bazowe rooty WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie ono użyte, w przeciwnym razie OpenClaw
  przejdzie do bezpośredniego handshake WebSocket na bazowym root. Obejmuje to
  zarówno porty zdalnego debugowania w stylu Chrome, jak i dostawców tylko-WebSocket.

Zwykłe `ws://host:port` / `wss://host:port` bez ścieżki `/devtools/...`,
wskazujące na lokalną instancję Chrome, są obsługiwane przez fallback z wykrywaniem najpierw —
Chrome akceptuje upgrade WebSocket tylko na konkretnej ścieżce per-browser
lub per-target zwracanej przez `/json/version`, więc sam handshake na bazowym root
zakończyłby się niepowodzeniem.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
proxy rezydencjalnymi.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Uwagi:

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj swój **API Key**
  z [panelu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  nie jest potrzebny ręczny krok tworzenia sesji.
- Darmowy plan pozwala na jedną współbieżną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby sprawdzić limity płatnych planów.
- Pełne odniesienie do API, przewodniki SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Kluczowe założenia:

- Sterowanie przeglądarką działa tylko przez loopback; dostęp przechodzi przez auth Gateway lub parowanie node.
- Samodzielne loopbackowe HTTP API przeglądarki używa **wyłącznie auth ze współdzielonym sekretem**:
  bearer token Gateway, `x-openclaw-password` lub HTTP Basic auth z
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"`
  **nie** uwierzytelniają tego samodzielnego loopbackowego API przeglądarki.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano auth ze współdzielonym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy starcie i zapisuje go do konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` jest już ustawione na
  `password`, `none` lub `trusted-proxy`.
- Trzymaj Gateway i wszelkie hosty node w sieci prywatnej (Tailscale); unikaj publicznego wystawiania.
- Traktuj zdalne URL-e/tokeny CDP jak sekrety; preferuj zmienne env lub menedżer sekretów.

Wskazówki dotyczące zdalnego CDP:

- W miarę możliwości preferuj szyfrowane endpointy (HTTPS lub WSS) oraz tokeny krótkotrwałe.
- Unikaj osadzania długowiecznych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez auto-connect Chrome DevTools MCP

Ustawienia domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany dla dołączania existing-session Chrome MCP.
- Profile existing-session poza `user` są typu opt-in; twórz je za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie endpointy sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Existing-session przez Chrome DevTools MCP

OpenClaw może także dołączyć do uruchomionego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie wykorzystać karty i stan logowania
już otwarte w tym profilu przeglądarki.

Oficjalne materiały wprowadzające i konfiguracyjne:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz mieć
inną nazwę, kolor lub katalog danych przeglądarki.

Zachowanie domyślne:

- Wbudowany profil `user` używa auto-connect Chrome MCP, który celuje w
  domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium lub niestandardowego profilu Chrome:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Następnie w pasującej przeglądarce:

1. Otwórz stronę inspect tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zaakceptuj prompt połączenia, gdy OpenClaw będzie się dołączać.

Typowe strony inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke dołączania live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Jak wygląda powodzenie:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla listę już otwartych kart przeglądarki
- `snapshot` zwraca referencje z wybranej karty live

Co sprawdzić, jeśli dołączanie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspect tej przeglądarki
- przeglądarka wyświetliła prompt zgody na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniach i sprawdza, czy
  Chrome jest lokalnie zainstalowany dla domyślnych profili auto-connect, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Używaj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, podaj tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić prompt
  dołączenia.
- Gateway lub host node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż odizolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; dołącza jedynie do
  istniejącej sesji.
- OpenClaw używa tutaj oficjalnego przepływu `--autoConnect` Chrome DevTools MCP. Jeśli
  ustawiono `userDataDir`, OpenClaw przekazuje je dalej, aby celować w ten jawny
  katalog danych użytkownika Chromium.
- Zrzuty ekranu existing-session obsługują przechwytywanie stron i przechwytywanie elementów przez `--ref` ze snapshotów, ale nie selektory CSS `--element`.
- Zrzuty ekranu stron existing-session działają bez Playwright przez Chrome MCP.
  Zrzuty elementów oparte na referencjach (`--ref`) także tam działają, ale `--full-page`
  nie można łączyć z `--ref` ani `--element`.
- Akcje existing-session są nadal bardziej ograniczone niż ścieżka
  zarządzanej przeglądarki:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają
    referencji snapshotów zamiast selektorów CSS
  - `click` obsługuje tylko lewy przycisk (bez nadpisania przycisku ani modyfikatorów)
  - `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`
  - `press` nie obsługuje `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie
    obsługują nadpisania timeoutu per wywołanie
  - `select` obecnie obsługuje tylko jedną wartość
- Existing-session `wait --url` obsługuje wzorce exact, substring i glob
  tak jak inne sterowniki przeglądarki. `wait --load networkidle` nie jest jeszcze obsługiwane.
- Hooki uploadu existing-session wymagają `ref` lub `inputRef`, obsługują jeden plik
  naraz i nie obsługują targetowania CSS `element`.
- Hooki dialogów existing-session nie obsługują nadpisania timeoutu.
- Niektóre funkcje nadal wymagają ścieżki zarządzanej przeglądarki, w tym batch
  actions, eksport PDF, przechwytywanie pobrań i `responsebody`.
- Existing-session może dołączyć na wybranym hoście lub przez połączony
  browser node. Jeśli Chrome znajduje się gdzie indziej i nie jest połączony żaden browser node, użyj
  zdalnego CDP albo hosta node.

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka profilu Twojej osobistej przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiegać kolizjom z przepływami pracy deweloperskiej.
- **Deterministyczne sterowanie kartami**: targetuj karty przez `targetId`, a nie „ostatnią kartę”.

## Wybór przeglądarki

Przy uruchamianiu lokalnym OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz to nadpisać przez `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: szuka `google-chrome`, `brave`, `microsoft-edge`, `chromium` itd.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Tylko dla integracji lokalnych Gateway udostępnia małe loopbackowe HTTP API:

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

Wszystkie endpointy akceptują `?profile=<name>`.

Jeśli skonfigurowano auth Gateway ze współdzielonym sekretem, trasy HTTP przeglądarki także wymagają auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopbackowe API przeglądarki **nie** korzysta z trusted-proxy ani
  nagłówków tożsamości Tailscale Serve.
- Jeśli `gateway.auth.mode` to `none` lub `trusted-proxy`, te loopbackowe trasy browser
  nie dziedziczą tych trybów niosących tożsamość; utrzymuj je wyłącznie na loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
awarii polityki:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` lub jest nierozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): payload akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone w konfiguracji.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu lub batchowane `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili existing-session.

Inne awarie runtime nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (`navigate`/`act`/snapshot AI/role snapshot, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- snapshoty ARIA
- zrzuty ekranu strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest per-tab
  WebSocket CDP
- zrzuty ekranu strony dla profili `existing-session` / Chrome MCP
- zrzuty ekranu existing-session oparte na `--ref` z wyniku snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- snapshoty AI / role snapshoty
- zrzuty ekranu elementów przez selektor CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają także `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli zobaczysz `Playwright is not available in this gateway build`, zainstaluj pełny
pakiet Playwright (nie `playwright-core`) i uruchom ponownie gateway albo zainstaluj ponownie
OpenClaw z obsługą przeglądarki.

#### Instalacja Playwright w Dockerze

Jeśli Twój Gateway działa w Dockerze, unikaj `npx playwright` (konflikty override’ów npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest zachowywane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Przepływ na wysokim poziomie:

- Mały **serwer sterowania** akceptuje żądania HTTP.
- Łączy się z przeglądarkami opartymi na Chromium (Chrome/Brave/Edge/Chromium) przez **CDP**.
- W przypadku zaawansowanych akcji (kliknięcie/wpisywanie/snapshot/PDF) używa **Playwright** na warstwie
  CDP.
- Gdy Playwright nie jest dostępny, dostępne są tylko operacje niewymagające Playwright.

Ten projekt utrzymuje agenta na stabilnym, deterministycznym interfejsie, a jednocześnie pozwala
Ci zamieniać lokalne/zdalne przeglądarki i profile.

## Szybki przewodnik po CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil.
Wszystkie polecenia akceptują też `--json` dla wyjścia czytelnego maszynowo (stabilne payloady).

Podstawy:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspekcja:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Uwaga dotycząca cyklu życia:

- W przypadku profili tylko-dołączanych i zdalnego CDP `openclaw browser stop` nadal jest
  właściwym poleceniem czyszczenia po testach. Zamyka aktywną sesję sterowania i
  czyści tymczasowe nadpisania emulacji zamiast zabijać bazową
  przeglądarkę.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Akcje:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Stan:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Uwagi:

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem,
  które wyzwala chooser/dialog.
- Ścieżki wyjściowe pobrań i trace są ograniczone do korzeni temp OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - pobrania: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Ścieżki uploadu są ograniczone do korzenia tymczasowych uploadów OpenClaw:
  - uploady: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` może też ustawiać inputy plików bezpośrednio przez `--input-ref` lub `--element`.
- `snapshot`:
  - `--format ai` (domyślne, gdy Playwright jest zainstalowany): zwraca snapshot AI z numerycznymi refami (`aria-ref="<n>"`).
  - `--format aria`: zwraca drzewo dostępności (bez refów; tylko do inspekcji).
  - `--efficient` (lub `--mode efficient`): kompaktowy preset role snapshotu (interactive + compact + depth + niższe maxChars).
  - Domyślna konfiguracja (tylko tool/CLI): ustaw `browser.snapshotDefaults.mode: "efficient"`, aby używać efektywnych snapshotów, gdy wywołujący nie przekazuje trybu (zobacz [Konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
  - Opcje role snapshotu (`--interactive`, `--compact`, `--depth`, `--selector`) wymuszają snapshot oparty na rolach z refami takimi jak `ref=e12`.
  - `--frame "<iframe selector>"` ogranicza role snapshoty do iframe (łączy się z refami ról takimi jak `e12`).
  - `--interactive` wypisuje płaską, łatwą do wyboru listę interaktywnych elementów (najlepszą do sterowania akcjami).
  - `--labels` dodaje zrzut ekranu tylko viewportu z naniesionymi etykietami refów (drukuje `MEDIA:<path>`).
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (albo numerycznego `12`, albo refu roli `e12`).
  Selektory CSS celowo nie są obsługiwane dla akcji.

## Snapshoty i refy

OpenClaw obsługuje dwa style „snapshotów”:

- **Snapshot AI (numeryczne refy)**: `openclaw browser snapshot` (domyślne; `--format ai`)
  - Wyjście: tekstowy snapshot zawierający numeryczne refy.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozwiązywany przez `aria-ref` Playwright.

- **Role snapshot (refy ról takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozwiązywany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z naniesionymi etykietami `e12`.

Zachowanie refów:

- Refy **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego refu.
- Jeśli role snapshot został wykonany z `--frame`, refy ról są ograniczone do tego iframe aż do następnego role snapshotu.

## Rozszerzenia wait

Możesz czekać na coś więcej niż tylko czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekanie, aż selektor stanie się widoczny:
  - `openclaw browser wait "#main"`

Można to łączyć:

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
2. Użyj `click <ref>` / `type <ref>` (preferuj refy ról w trybie interactive)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, na co celuje Playwright
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj trace:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (drukuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptów i narzędzi ustrukturyzowanych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshoty w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły analizować rozmiar i gęstość payloadu.

## Pokrętła stanu i środowiska

Są przydatne w przepływach typu „spraw, by strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` pozostaje obsługiwane)
- HTTP Basic auth: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / ustawienia regionalne: `set timezone ...`, `set locale ...`
- Urządzenie / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może
  tym sterować. Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- W kwestii logowań i uwag dotyczących anti-botów (X/Twitter itd.) zobacz [Logowanie browser + publikowanie na X/Twitter](/pl/tools/browser-login).
- Trzymaj Gateway/host node jako prywatne (tylko loopback lub tailnet).
- Zdalne endpointy CDP są potężne; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokuje prywatne/wewnętrzne cele):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Rozwiązywanie problemów

W przypadku problemów specyficznych dla Linuxa (szczególnie snap Chromium) zobacz
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji z rozdzieleniem hostów WSL2 Gateway + Windows Chrome zobacz
[WSL2 + Windows + rozwiązywanie problemów ze zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Awaria startu CDP vs blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Awaria startu lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką działa poprawnie.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką działa poprawnie, ale cel nawigacji strony jest odrzucony przez politykę.

Typowe przykłady:

- Awaria startu lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshot albo otwierania kart kończą się błędem polityki browser/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw diagnozuj gotowość CDP.
- Jeśli `start` powiedzie się, ale `tabs` zakończy się błędem, płaszczyzna sterowania nadal nie jest zdrowa. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` albo `navigate` zakończy się błędem, płaszczyzna sterowania przeglądarką działa, a awaria dotyczy polityki nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką działa poprawnie.

Ważne szczegóły zachowania:

- Konfiguracja browser domyślnie używa obiektu polityki SSRF fail-closed, nawet gdy nie skonfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu loopback `openclaw` kontrole zdrowia CDP celowo pomijają wymuszanie osiągalności SSRF browser dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` albo `navigate` jest dozwolony.

Wskazówki bezpieczeństwa:

- Domyślnie **nie** rozluźniaj polityki SSRF browser.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w środowiskach, którym celowo ufasz, gdzie dostęp browser do sieci prywatnej jest wymagany i został sprawdzony.

Przykład: nawigacja zablokowana, płaszczyzna sterowania zdrowa

- `start` kończy się powodzeniem
- `tabs` kończy się powodzeniem
- `open http://internal.example` kończy się błędem

To zwykle oznacza, że uruchomienie browser jest poprawne, a cel nawigacji wymaga przeglądu polityki.

Przykład: start zablokowany, zanim nawigacja ma znaczenie

- `start` kończy się błędem `not reachable after start`
- `tabs` także kończy się błędem lub nie może zostać uruchomione

To wskazuje na uruchomienie browser albo osiągalność CDP, a nie na problem z allowlistą URL strony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mapowanie:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do klikania/wpisywania/przeciągania/zaznaczania.
- `browser screenshot` przechwytuje piksele (całą stronę lub element).
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalne CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach sandboxed `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` jest pominięte: sesje sandboxed domyślnie używają `sandbox`, a sesje niesandboxed domyślnie używają `host`.
  - Jeśli połączony jest node z obsługą browser, narzędzie może automatycznie kierować do niego, chyba że przypniesz `target="host"` albo `target="node"`.

To utrzymuje agenta jako deterministycznego i pozwala unikać kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach sandboxed
- [Security](/pl/gateway/security) — ryzyka sterowania przeglądarką i hardening
