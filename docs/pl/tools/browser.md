---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Diagnozowanie, dlaczego openclaw ingeruje w Twojego Chrome’a
    - Implementowanie ustawień i cyklu życia przeglądarki w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Browser (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-11T02:48:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6fed36a6f40a50e825f90e5616778954545bd7e52397f7e088b85251ee024f
    source_path: tools/browser.md
    workflow: 15
---

# Browser (zarządzana przez openclaw)

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz bramy (tylko loopback).

Widok dla początkujących:

- Traktuj to jak **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** ingeruje w Twój osobisty profil przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i wpisywać tekst** w bezpiecznym obszarze.
- Wbudowany profil `user` dołącza do Twojej rzeczywistej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwieranie/przełączanie/zamykanie).
- Działania agenta (kliknięcie/pisanie/przeciąganie/zaznaczanie), snapshoty, zrzuty ekranu, pliki PDF.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, izolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli zobaczysz „Browser disabled”, włącz tę funkcję w konfiguracji (patrz niżej) i uruchom ponownie
bramę.

Jeśli `openclaw browser` całkowicie zniknęło albo agent zgłasza, że narzędzie browser
jest niedostępne, przejdź do [Brak polecenia lub narzędzia browser](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie pluginem

Domyślne narzędzie `browser` jest teraz bundlowanym pluginem dostarczanym i włączonym
domyślnie. Oznacza to, że możesz je wyłączyć lub zastąpić bez usuwania reszty
systemu pluginów OpenClaw:

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

Wyłącz bundlowany plugin przed zainstalowaniem innego pluginu, który udostępnia tę
samą nazwę narzędzia `browser`. Domyślne środowisko browser wymaga obu warunków:

- `plugins.entries.browser.enabled` nie może być wyłączone
- `browser.enabled=true`

Jeśli wyłączysz tylko plugin, bundlowane CLI przeglądarki (`openclaw browser`),
metoda bramy (`browser.request`), narzędzie agenta oraz domyślna usługa sterowania przeglądarką
znikną razem. Twoja konfiguracja `browser.*` pozostanie nienaruszona, aby
zastępczy plugin mógł z niej skorzystać.

Bundlowany plugin browser odpowiada teraz także za implementację środowiska uruchomieniowego przeglądarki.
Rdzeń zachowuje tylko współdzielone helpery Plugin SDK oraz eksporty zgodności dla
starszych wewnętrznych ścieżek importu. W praktyce usunięcie lub zastąpienie pakietu pluginu browser
usuwa zestaw funkcji przeglądarki zamiast pozostawiać drugie środowisko uruchomieniowe należące do rdzenia.

Zmiany konfiguracji browser nadal wymagają restartu bramy, aby bundlowany plugin
mógł ponownie zarejestrować swoją usługę przeglądarki z nowymi ustawieniami.

## Brak polecenia lub narzędzia browser

Jeśli `openclaw browser` nagle stało się nieznanym poleceniem po aktualizacji albo
agent zgłasza brak narzędzia browser, najczęstszą przyczyną jest restrykcyjna
lista `plugins.allow`, która nie zawiera `browser`.

Przykład błędnej konfiguracji:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Napraw to, dodając `browser` do listy dozwolonych pluginów:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ważne uwagi:

- `browser.enabled=true` samo w sobie nie wystarcza, gdy ustawiono `plugins.allow`.
- `plugins.entries.browser.enabled=true` samo w sobie również nie wystarcza, gdy ustawiono `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **nie** ładuje bundlowanego pluginu browser. To ustawienie jedynie dostosowuje politykę narzędzi po załadowaniu pluginu.
- Jeśli nie potrzebujesz restrykcyjnej listy dozwolonych pluginów, usunięcie `plugins.allow` także przywraca domyślne zachowanie bundlowanej przeglądarki.

Typowe objawy:

- `openclaw browser` jest nieznanym poleceniem.
- Brakuje `browser.request`.
- Agent zgłasza, że narzędzie browser jest niedostępne lub brakuje go.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, izolowana przeglądarka (nie wymaga rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **rzeczywistej zalogowanej sesji Chrome**.

Dla wywołań narzędzia browser przez agenta:

- Domyślnie: używaj izolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje i użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o dołączenie.
- `profile` jest jawnym nadpisaniem, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz domyślnie używać trybu zarządzanego.

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

- Usługa sterowania przeglądarką nasłuchuje na loopback na porcie wyliczanym z `gateway.port`
  (domyślnie: `18791`, czyli brama + 2).
- Jeśli nadpiszesz port bramy (`gateway.port` lub `OPENCLAW_GATEWAY_PORT`),
  wyliczane porty przeglądarki przesuną się, aby pozostać w tej samej „rodzinie”.
- `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, jeśli nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy sprawdzania osiągalności zdalnego (nie-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` dotyczy sprawdzania osiągalności połączenia WebSocket zdalnego CDP.
- Nawigacja/otwieranie kart przeglądarki jest chronione przed SSRF przed rozpoczęciem nawigacji i ponownie sprawdzane w trybie best-effort po nawigacji dla końcowego adresu `http(s)`.
- W ścisłym trybie SSRF sprawdzane są również wykrywanie/sondy zdalnych punktów końcowych CDP (`cdpUrl`, w tym wyszukiwania `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone. Ustaw `true` tylko wtedy, gdy świadomie ufasz dostępowi przeglądarki do sieci prywatnej.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias dla zgodności.
- `attachOnly: true` oznacza „nigdy nie uruchamiaj lokalnej przeglądarki; dołączaj tylko wtedy, gdy już działa”.
- `color` + `color` dla poszczególnych profili zabarwiają interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (samodzielna przeglądarka zarządzana przez OpenClaw). Użyj `defaultProfile: "user"`, aby przełączyć domyślnie na zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl` — ustawiaj je tylko dla zdalnego CDP.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie
  ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session
  ma dołączać do niestandardowego profilu użytkownika Chromium, takiego jak Brave lub Edge.

## Użyj Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoja **domyślna przeglądarka systemowa** jest oparta na Chromium (Chrome/Brave/Edge itp.),
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

- **Sterowanie lokalne (domyślne):** brama uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host węzła):** uruchom host węzła na maszynie, na której jest przeglądarka; brama przekazuje do niego działania przeglądarki.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.

Zachowanie przy zatrzymywaniu różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile tylko-dołączania i zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan), nawet
  jeśli OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny w zapytaniu (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie przy wywoływaniu punktów końcowych `/json/*` oraz podczas łączenia
z WebSocketem CDP. Dla tokenów preferuj zmienne środowiskowe lub menedżery sekretów
zamiast zapisywania ich w plikach konfiguracji.

## Proxy browser węzła (domyślnie bez konfiguracji)

Jeśli uruchamiasz **host węzła** na maszynie, na której znajduje się Twoja przeglądarka, OpenClaw może
automatycznie kierować wywołania narzędzia browser do tego węzła bez dodatkowej konfiguracji browser.
To domyślna ścieżka dla zdalnych bram.

Uwagi:

- Host węzła udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw je puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, włącznie z trasami tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw potraktuje to jako granicę najmniejszych uprawnień: można kierować tylko do profili z listy dozwolonych, a trwałe trasy tworzenia/usuwania profili są blokowane na powierzchni proxy.
- Wyłącz tę funkcję, jeśli jej nie chcesz:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na bramie: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszą opcją jest bezpośredni adres WebSocket
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

- Zamień `<BROWSERLESS_API_KEY>` na swój rzeczywisty token Browserless.
- Wybierz punkt końcowy regionu zgodny z Twoim kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje bazowy adres URL HTTPS, możesz albo przekształcić go do
  `wss://` dla bezpośredniego połączenia CDP, albo zachować adres HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Bezpośredni dostawcy WebSocket CDP

Niektóre hostowane usługi przeglądarki udostępniają **bezpośredni punkt końcowy WebSocket**
zamiast standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw obsługuje oba:

- **Punkty końcowe HTTP(S)** — OpenClaw wywołuje `/json/version`, aby wykryć
  adres URL debuggera WebSocket, a następnie się łączy.
- **Punkty końcowe WebSocket** (`ws://` / `wss://`) — OpenClaw łączy się bezpośrednio,
  pomijając `/json/version`. Używaj tego dla usług takich jak
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) lub dowolnego dostawcy, który przekazuje
  adres URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) to chmurowa platforma do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
rezydencjalnymi serwerami proxy.

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
- Zamień `<BROWSERBASE_API_KEY>` na swój rzeczywisty klucz API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  ręczne tworzenie sesji nie jest potrzebne.
- Darmowy plan pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Limity płatnych planów znajdziesz w [cenniku](https://www.browserbase.com/pricing).
- Pełne informacje referencyjne o API, przewodniki SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Najważniejsze założenia:

- Sterowanie przeglądarką jest dostępne tylko przez loopback; dostęp przechodzi przez uwierzytelnianie bramy lub parowanie węzła.
- Samodzielne loopback API HTTP przeglądarki używa **wyłącznie uwierzytelniania wspólnym sekretem**:
  token bearer bramy, `x-openclaw-password` albo HTTP Basic auth z
  skonfigurowanym hasłem bramy.
- Nagłówki tożsamości Tailscale Serve oraz `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego loopback API przeglądarki.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania wspólnym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy starcie i zapisuje go w konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` lub `trusted-proxy`.
- Utrzymuj bramę i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj publicznej ekspozycji.
- Traktuj zdalne adresy URL/tokeny CDP jak sekrety; preferuj zmienne env lub menedżer sekretów.

Wskazówki dla zdalnego CDP:

- Jeśli to możliwe, preferuj szyfrowane punkty końcowe (HTTPS lub WSS) oraz tokeny krótkotrwałe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracji.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny adres URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne łączenie Chrome DevTools MCP

Ustawienia domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania existing-session przez Chrome MCP.
- Profile existing-session poza `user` są opcjonalne; twórz je za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Existing-session przez Chrome DevTools MCP

OpenClaw może także dołączyć do uruchomionego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie wykorzystać karty i stan logowania,
które są już otwarte w tym profilu przeglądarki.

Oficjalne materiały referencyjne i instrukcje konfiguracji:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz użyć
innej nazwy, koloru lub katalogu danych przeglądarki.

Zachowanie domyślne:

- Wbudowany profil `user` używa automatycznego łączenia Chrome MCP, które kieruje na
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

Następnie w odpowiadającej przeglądarce:

1. Otwórz stronę inspect tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit o połączenie, gdy OpenClaw będzie się dołączać.

Typowe strony inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke działania dołączenia na żywo:

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
- `tabs` wyświetla już otwarte karty przeglądarki
- `snapshot` zwraca refy z wybranej aktywnej karty

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- w stronie inspect tej przeglądarki włączono zdalne debugowanie
- przeglądarka wyświetliła monit o zgodę na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili auto-connect, ale nie może
  włączyć zdalnego debugowania po stronie przeglądarki za Ciebie

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz zalogowanego stanu przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, przekaż jawną nazwę tego profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  o dołączenie.
- brama lub host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż izolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; dołącza tylko do
  istniejącej sesji.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, OpenClaw przekazuje je dalej, aby kierować na jawny
  katalog danych użytkownika Chromium.
- Zrzuty ekranu existing-session obsługują przechwytywanie stron i przechwytywanie elementów `--ref`
  ze snapshotów, ale nie obsługują selektorów CSS `--element`.
- Zrzuty ekranu stron existing-session działają bez Playwright przez Chrome MCP.
  Zrzuty elementów oparte na refach (`--ref`) również działają, ale `--full-page`
  nie może być łączone z `--ref` ani `--element`.
- Działania existing-session są nadal bardziej ograniczone niż w ścieżce
  zarządzanej przeglądarki:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają
    refów snapshotu zamiast selektorów CSS
  - `click` obsługuje tylko lewy przycisk (bez nadpisywania przycisku ani modyfikatorów)
  - `type` nie obsługuje `slowly=true`; użyj `fill` lub `press`
  - `press` nie obsługuje `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie
    obsługują nadpisywania limitu czasu dla pojedynczego wywołania
  - `select` obecnie obsługuje tylko jedną wartość
- Existing-session `wait --url` obsługuje wzorce dokładne, częściowe i glob,
  tak jak inne sterowniki przeglądarki. `wait --load networkidle` nie jest jeszcze obsługiwane.
- Hooki uploadu existing-session wymagają `ref` lub `inputRef`, obsługują po jednym pliku
  naraz i nie obsługują kierowania przez CSS `element`.
- Hooki dialogów existing-session nie obsługują nadpisywania limitu czasu.
- Niektóre funkcje nadal wymagają ścieżki zarządzanej przeglądarki, w tym działania
  wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody`.
- Existing-session jest lokalne dla hosta. Jeśli Chrome znajduje się na innej maszynie lub
  w innej przestrzeni nazw sieci, użyj zdalnego CDP albo hosta węzła.

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie ingeruje w Twój osobisty profil przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami pracy deweloperskiej.
- **Deterministyczne sterowanie kartami**: kierowanie kart według `targetId`, a nie „ostatniej karty”.

## Wybór przeglądarki

Przy lokalnym uruchamianiu OpenClaw wybiera pierwszą dostępną:

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

Tylko dla integracji lokalnych brama udostępnia małe loopback API HTTP:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Działania: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobrania: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie punkty końcowe akceptują `?profile=<name>`.

Jeśli skonfigurowano uwierzytelnianie bramy wspólnym sekretem, trasy HTTP browser także wymagają uwierzytelniania:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback API browser **nie** korzysta z trusted-proxy ani
  nagłówków tożsamości Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te trasy loopback browser
  nie dziedziczą tych trybów opartych na tożsamości; utrzymuj je wyłącznie na loopback.

### Kontrakt błędów `/act`

`POST /act` używa strukturalnej odpowiedzi błędu dla walidacji na poziomie trasy i
błędów polityki:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo jest nierozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek działania nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem działania.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższopoziomowy lub wsadowy `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): działanie nie jest obsługiwane dla profili existing-session.

Inne błędy środowiska uruchomieniowego nadal mogą zwracać `{ "error": "<message>" }` bez
pola `code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/snapshot AI/snapshot roli, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Snapshoty ARIA
- Zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP dla karty
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu existing-session oparte na refach (`--ref`) z danych wyjściowych snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- snapshoty AI / snapshoty roli
- zrzuty ekranu elementów z selektorem CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, zainstaluj pełny
pakiet Playwright (nie `playwright-core`) i uruchom ponownie bramę albo zainstaluj
OpenClaw ponownie z obsługą browser.

#### Instalacja Playwright w Dockerze

Jeśli Twoja brama działa w Dockerze, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj bundlowanego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest trwałe przez
`OPENCLAW_HOME_VOLUME` lub bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Przepływ na wysokim poziomie:

- Mały **serwer sterowania** przyjmuje żądania HTTP.
- Łączy się z przeglądarkami opartymi na Chromium (Chrome/Brave/Edge/Chromium) przez **CDP**.
- Do zaawansowanych działań (kliknięcie/pisanie/snapshot/PDF) używa **Playwright** ponad
  CDP.
- Gdy brakuje Playwright, dostępne są tylko operacje niewymagające Playwright.

Ten projekt utrzymuje agenta na stabilnym, deterministycznym interfejsie, jednocześnie pozwalając
wymieniać lokalne/zdalne przeglądarki i profile.

## Krótkie omówienie CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby kierować na konkretny profil.
Wszystkie polecenia akceptują też `--json` dla danych wyjściowych czytelnych maszynowo (stabilne ładunki).

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

- Dla profili tylko-dołączania i zdalnego CDP `openclaw browser stop` nadal jest
  właściwym poleceniem czyszczenia po testach. Zamyka aktywną sesję sterowania i
  usuwa tymczasowe nadpisania emulacji zamiast zabijać bazową
  przeglądarkę.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Działania:

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
  które wywołuje selektor plików/okno dialogowe.
- Ścieżki wyjściowe pobrań i śladów są ograniczone do tymczasowych katalogów OpenClaw:
  - ślady: `/tmp/openclaw` (awaryjnie: `${os.tmpdir()}/openclaw`)
  - pobrania: `/tmp/openclaw/downloads` (awaryjnie: `${os.tmpdir()}/openclaw/downloads`)
- Ścieżki uploadu są ograniczone do tymczasowego katalogu uploadów OpenClaw:
  - uploady: `/tmp/openclaw/uploads` (awaryjnie: `${os.tmpdir()}/openclaw/uploads`)
- `upload` może też ustawiać inputy plików bezpośrednio przez `--input-ref` lub `--element`.
- `snapshot`:
  - `--format ai` (domyślnie, gdy zainstalowano Playwright): zwraca snapshot AI z liczbowymi refami (`aria-ref="<n>"`).
  - `--format aria`: zwraca drzewo dostępności (bez refów; tylko do inspekcji).
  - `--efficient` (lub `--mode efficient`): kompaktowy preset snapshotu roli (interactive + compact + depth + niższe maxChars).
  - Domyślna konfiguracja (tylko narzędzie/CLI): ustaw `browser.snapshotDefaults.mode: "efficient"`, aby używać wydajnych snapshotów, gdy wywołujący nie przekazuje trybu (zobacz [Konfiguracja bramy](/pl/gateway/configuration-reference#browser)).
  - Opcje snapshotu roli (`--interactive`, `--compact`, `--depth`, `--selector`) wymuszają snapshot oparty na rolach z refami typu `ref=e12`.
  - `--frame "<iframe selector>"` ogranicza snapshoty roli do iframe (w parze z refami roli takimi jak `e12`).
  - `--interactive` zwraca płaską, łatwą do wyboru listę elementów interaktywnych (najlepszą do sterowania działaniami).
  - `--labels` dodaje zrzut ekranu tylko viewportu z nakładanymi etykietami refów (wypisuje `MEDIA:<path>`).
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (albo liczbowego `12`, albo refu roli `e12`).
  Selektory CSS celowo nie są obsługiwane dla działań.

## Snapshoty i refy

OpenClaw obsługuje dwa style „snapshotów”:

- **Snapshot AI (liczbowe refy)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wynik: tekstowy snapshot zawierający liczbowe refy.
  - Działania: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozstrzygany przez `aria-ref` Playwright.

- **Snapshot roli (refy roli, np. `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wynik: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Działania: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozstrzygany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z nakładanymi etykietami `e12`.

Zachowanie refów:

- Refy **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom `snapshot` ponownie i użyj świeżego refu.
- Jeśli snapshot roli został wykonany z `--frame`, refy roli są ograniczone do tego iframe aż do następnego snapshotu roli.

## Rozszerzone możliwości wait

Możesz czekać nie tylko na czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan załadowania:
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

Gdy działanie się nie powiedzie (np. „not visible”, „strict mode violation”, „covered”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (preferuj refy roli w trybie interactive)
3. Jeśli nadal nie działa: `openclaw browser highlight <ref>`, aby zobaczyć, na co kieruje Playwright
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wynik JSON

`--json` służy do skryptów i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshoty roli w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), dzięki czemu narzędzia mogą analizować rozmiar i gęstość ładunku.

## Ustawienia stanu i środowiska

Są przydatne w przepływach typu „spraw, by witryna zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Nagłówki: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- Uwierzytelnianie HTTP Basic: `set credentials user pass` (lub `--clear`)
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
- Informacje o logowaniach i uwagach antybotowych (X/Twitter itp.) znajdziesz w [Logowanie browser + publikowanie na X/Twitter](/pl/tools/browser-login).
- Utrzymuj bramę/host węzła w sieci prywatnej (tylko loopback lub tailnet).
- Zdalne punkty końcowe CDP są bardzo uprzywilejowane; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokowanie prywatnych/wewnętrznych miejsc docelowych):

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

W przypadku problemów specyficznych dla Linuksa (szczególnie snap Chromium) zobacz
[Rozwiązywanie problemów z browser](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji z rozdzieleniem hostów WSL2 Gateway + Windows Chrome zobacz
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mapowanie działania:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do klikania/pisania/przeciągania/zaznaczania.
- `browser screenshot` przechwytuje piksele (cała strona lub element).
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalne CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach sandboxed `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli pominięto `target`: sesje sandboxed domyślnie używają `sandbox`, a sesje bez sandbox domyślnie `host`.
  - Jeśli podłączony jest węzeł z obsługą browser, narzędzie może automatycznie kierować do niego, chyba że przypniesz `target="host"` lub `target="node"`.

To utrzymuje działanie agenta jako deterministyczne i pozwala uniknąć kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) — sterowanie browser w środowiskach sandbox
- [Bezpieczeństwo](/pl/gateway/security) — ryzyka i utwardzanie sterowania browser
