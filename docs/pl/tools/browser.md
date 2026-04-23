---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego OpenClaw ingeruje w Twoją własną przeglądarkę Chrome
    - Implementowanie ustawień przeglądarki + lifecycle w aplikacji macOS
summary: Zintegrowana usługa browser control + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-23T10:09:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Przeglądarka (zarządzana przez openclaw)

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, który kontroluje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę control wewnątrz Gateway (tylko local loopback).

Widok dla początkujących:

- Potraktuj to jak **osobną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i wpisywać** w bezpiecznym torze.
- Wbudowany profil `user` podpina się do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co dostajesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (list/open/focus/close).
- Akcje agenta (click/type/drag/select), snapshoty, zrzuty ekranu, PDF-y.
- Opcjonalna obsługa wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoim codziennym narzędziem. To bezpieczna, odizolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz ją w konfiguracji (zobacz niżej) i zrestartuj
Gateway.

Jeśli `openclaw browser` całkowicie zniknęło albo agent mówi, że narzędzie browser
jest niedostępne, przejdź do [Brak polecenia browser lub narzędzia](/pl/tools/browser#missing-browser-command-or-tool).

## Kontrola przez plugin

Domyślne narzędzie `browser` jest teraz bundlowanym pluginem, który jest domyślnie włączony.
Oznacza to, że możesz go wyłączyć lub zastąpić bez usuwania reszty systemu pluginów OpenClaw:

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

Wyłącz bundlowany plugin przed zainstalowaniem innego pluginu, który dostarcza
to samo nazwę narzędzia `browser`. Domyślne doświadczenie przeglądarki wymaga obu warunków:

- `plugins.entries.browser.enabled` nie jest wyłączone
- `browser.enabled=true`

Jeśli wyłączysz tylko plugin, bundlowane CLI przeglądarki (`openclaw browser`),
metoda Gateway (`browser.request`), narzędzie agenta i domyślna usługa browser control
znikną razem. Twoja konfiguracja `browser.*` pozostanie nienaruszona, aby mogła zostać użyta przez plugin zastępczy.

Bundlowany plugin browser posiada teraz także implementację runtime przeglądarki.
Core zachowuje tylko współdzielone helpery Plugin SDK oraz eksporty zgodności dla
starszych wewnętrznych ścieżek importu. W praktyce usunięcie lub zastąpienie pakietu pluginu browser
usuwa zestaw funkcji przeglądarki zamiast pozostawiać drugi runtime należący do core.

Zmiany konfiguracji przeglądarki nadal wymagają restartu Gateway, aby bundlowany plugin
mógł ponownie zarejestrować swoją usługę browser z nowymi ustawieniami.

## Brak polecenia browser lub narzędzia

Jeśli po aktualizacji `openclaw browser` nagle staje się nieznanym poleceniem albo
agent zgłasza brak narzędzia browser, najczęstszą przyczyną jest restrykcyjna
lista `plugins.allow`, która nie zawiera `browser`.

Przykład uszkodzonej konfiguracji:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Napraw to, dodając `browser` do allowlisty pluginów:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ważne uwagi:

- Samo `browser.enabled=true` nie wystarczy, gdy ustawiono `plugins.allow`.
- Samo `plugins.entries.browser.enabled=true` też nie wystarczy, gdy ustawiono `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **nie** ładuje bundlowanego pluginu browser. To tylko dostosowuje politykę narzędzi po załadowaniu pluginu.
- Jeśli nie potrzebujesz restrykcyjnej allowlisty pluginów, usunięcie `plugins.allow` także przywraca domyślne zachowanie bundlowanej przeglądarki.

Typowe objawy:

- `openclaw browser` jest nieznanym poleceniem.
- Brakuje `browser.request`.
- Agent zgłasza, że narzędzie browser jest niedostępne lub nie istnieje.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (bez wymaganego rozszerzenia).
- `user`: wbudowany profil podpinania Chrome MCP do Twojej **prawdziwej zalogowanej przeglądarki Chrome**.

Dla wywołań narzędzia browser przez agenta:

- Domyślnie: używana jest odizolowana przeglądarka `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje i użytkownik
  siedzi przy komputerze, by kliknąć/zatwierdzić ewentualny prompt podpięcia.
- `profile` jest jawnym nadpisaniem, gdy chcesz konkretny tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz domyślnie trybu zarządzanego.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // domyślnie: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // włącz tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // starsze nadpisanie pojedynczego profilu
    remoteCdpTimeoutMs: 1500, // timeout HTTP zdalnego CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket zdalnego CDP (ms)
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

- Usługa browser control wiąże się z local loopback na porcie wyliczanym z `gateway.port`
  (domyślnie: `18791`, czyli gateway + 2).
- Jeśli nadpiszesz port Gateway (`gateway.port` lub `OPENCLAW_GATEWAY_PORT`),
  wyliczone porty przeglądarki przesuną się, aby pozostać w tej samej „rodzinie”.
- `cdpUrl` domyślnie wskazuje na zarządzany lokalny port CDP, gdy nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy kontroli osiągalności zdalnego (nie-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` dotyczy kontroli osiągalności handshake WebSocket zdalnego CDP.
- Nawigacja/otwieranie kart w przeglądarce jest chronione przed SSRF przed nawigacją i w miarę możliwości ponownie sprawdzane na końcowym URL `http(s)` po nawigacji.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie/probe zdalnych endpointów CDP (`cdpUrl`, w tym lookupi `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone. Ustaw na `true` tylko wtedy, gdy celowo ufasz dostępowi przeglądarki do sieci prywatnej.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias dla zgodności.
- `attachOnly: true` oznacza „nigdy nie uruchamiaj lokalnej przeglądarki; podpinaj się tylko wtedy, gdy już działa.”
- `color` + per-profile `color` barwią UI przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (samodzielna przeglądarka zarządzana przez OpenClaw). Użyj `defaultProfile: "user"`, aby przełączyć się na zalogowaną przeglądarkę użytkownika.
- Kolejność auto-detekcji: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl` — ustawiaj je tylko dla zdalnego CDP.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie
  ustawiaj `cdpUrl` dla tego drivera.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session
  ma podpinać się do niestandardowego profilu użytkownika Chromium, takiego jak Brave lub Edge.

## Używanie Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną przeglądarką systemową** jest przeglądarka oparta na Chromium (Chrome/Brave/Edge/etc),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
auto-detekcję:

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

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę control na local loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom host Node na maszynie, która ma przeglądarkę; Gateway będzie proxy’ować do niego akcje browser.
- **Zdalny CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  podpiąć się do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.

Zachowanie zatrzymywania różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile attach-only i zdalne profile CDP: `openclaw browser stop` zamyka aktywną
  sesję control i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, locale, timezone, tryb offline i podobny stan), mimo że
  OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne URL-e CDP mogą zawierać auth:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- HTTP Basic auth (np. `https://user:pass@provider.example`)

OpenClaw zachowuje auth przy wywołaniach endpointów `/json/*` oraz przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast commitowania ich do plików konfiguracyjnych.

## Proxy przeglądarki Node (domyślnie zero-config)

Jeśli uruchamiasz **host Node** na maszynie, która ma przeglądarkę, OpenClaw może
automatycznie routować wywołania narzędzia browser do tego node bez dodatkowej konfiguracji browser.
To domyślna ścieżka dla zdalnych gatewayów.

Uwagi:

- Host Node wystawia swój lokalny serwer browser control przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` noda (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste dla starszego/dom yślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy create/delete profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: tylko profile z allowlisty mogą być targetowane, a trwałe trasy create/delete profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na nodzie: `nodeHost.browserProxy.enabled=false`
  - Na gatewayu: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która wystawia
URL-e połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszą opcją jest bezpośredni URL WebSocket
z dokumentacji połączenia Browserless.

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
- Wybierz endpoint regionu zgodny z Twoim kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje Ci bazowy URL HTTPS, możesz albo przekształcić go na
  `wss://` dla bezpośredniego połączenia CDP, albo zachować URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Bezpośredni providerzy WebSocket CDP

Niektóre hostowane usługi przeglądarek wystawiają **bezpośredni endpoint WebSocket**
zamiast standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debuggera WebSocket, a następnie
  się łączy. Bez fallbacku WebSocket.
- **Bezpośrednie endpointy WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i całkowicie pomija
  `/json/version`.
- **Gołe rooty WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie ono użyte, w przeciwnym razie OpenClaw
  przechodzi do bezpośredniego handshake WebSocket na gołym root. To obejmuje
  zarówno porty zdalnego debugowania w stylu Chrome, jak i providerów tylko WebSocket.

Zwykłe `ws://host:port` / `wss://host:port` bez ścieżki `/devtools/...`
wskazujące na lokalną instancję Chrome są obsługiwane przez fallback oparty najpierw na wykrywaniu —
Chrome akceptuje upgrade WebSocket tylko na konkretnej ścieżce per-browser
lub per-target zwróconej przez `/json/version`, więc sam handshake na gołym root
by się nie powiódł.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
proxy rezydencyjnymi.

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
  z [dashboardu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  nie jest potrzebny ręczny krok tworzenia sesji.
- Warstwa darmowa pozwala na jedną współbieżną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać limity planów płatnych.
- Pełną dokumentację referencyjną API,
  przewodniki SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Kluczowe założenia:

- Browser control jest dostępny tylko przez loopback; dostęp przechodzi przez auth Gateway lub parowanie node.
- Samodzielne loopback HTTP API przeglądarki używa **wyłącznie auth opartego na współdzielonym sekrecie**:
  bearer auth tokenem Gateway, `x-openclaw-password` albo HTTP Basic auth z
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego loopback API przeglądarki.
- Jeśli browser control jest włączony i nie skonfigurowano auth ze współdzielonym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy starcie i zapisuje go do konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` jest już ustawione na
  `password`, `none` albo `trusted-proxy`.
- Utrzymuj Gateway i wszelkie hosty node w sieci prywatnej (Tailscale); unikaj publicznej ekspozycji.
- Traktuj zdalne URL-e/tokenu CDP jak sekrety; preferuj zmienne środowiskowe lub menedżer sekretów.

Wskazówki dla zdalnego CDP:

- Gdy to możliwe, preferuj szyfrowane endpointy (HTTPS lub WSS) i tokeny krótkotrwałe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez OpenClaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem user data + portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez auto-connect Chrome DevTools MCP

Domyślne ustawienia:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany dla podpinania existing-session przez Chrome MCP.
- Profile existing-session poza `user` są typu opt-in; twórz je przez `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie endpointy control akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Existing-session przez Chrome DevTools MCP

OpenClaw może też podpiąć się do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie używać kart i stanu logowania
już otwartych w tym profilu przeglądarki.

Oficjalne materiały i dokumentacja konfiguracji:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz mieć
inną nazwę, kolor albo katalog danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa auto-connect Chrome MCP, który celuje w
  domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium albo niestandardowego profilu Chrome:

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
3. Pozostaw przeglądarkę uruchomioną i zatwierdź prompt połączenia, gdy OpenClaw będzie się podpinać.

Typowe strony inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke live attach:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Jak wygląda sukces:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla już otwarte karty przeglądarki
- `snapshot` zwraca refy z wybranej aktywnej karty

Co sprawdzić, jeśli attach nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspect tej przeglądarki
- przeglądarka wyświetliła prompt zgody na attach i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowane lokalnie dla domyślnych profili auto-connect, ale nie może
  włączyć zdalnego debugowania po stronie przeglądarki za Ciebie

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz zalogowanego stanu przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, przekaż jego jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik siedzi przy komputerze, aby zatwierdzić
  prompt attach.
- Gateway lub host node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż odizolowany profil `openclaw`, ponieważ może
  działać w Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego drivera; podpina się tylko do
  istniejącej sesji.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, OpenClaw przekazuje je dalej, aby celować w ten jawny
  katalog danych użytkownika Chromium.
- Zrzuty ekranu existing-session obsługują przechwytywanie stron i przechwytywanie elementów `--ref` ze snapshotów, ale nie selektory CSS `--element`.
- Zrzuty ekranu stron existing-session działają bez Playwright przez Chrome MCP.
  Zrzuty elementów oparte na ref (`--ref`) także działają, ale `--full-page`
  nie może być łączone z `--ref` ani `--element`.
- Akcje existing-session są nadal bardziej ograniczone niż ścieżka zarządzanej przeglądarki:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają
    refów snapshotów zamiast selektorów CSS
  - `click` obsługuje tylko lewy przycisk (bez nadpisywania przycisku ani modifierów)
  - `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`
  - `press` nie obsługuje `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie
    obsługują nadpisania timeoutu per-call
  - `select` obecnie obsługuje tylko pojedynczą wartość
- Existing-session `wait --url` obsługuje wzorce exact, substring i glob
  jak inne drivery przeglądarki. `wait --load networkidle` nie jest jeszcze obsługiwane.
- Hooki uploadu existing-session wymagają `ref` lub `inputRef`, obsługują jeden plik naraz i nie obsługują targetowania CSS `element`.
- Hooki dialogów existing-session nie obsługują nadpisania timeoutów.
- Niektóre funkcje nadal wymagają ścieżki zarządzanej przeglądarki, w tym batch
  actions, eksport PDF, przechwytywanie pobrań i `responsebody`.
- Existing-session może podpinać się na wybranym hoście albo przez podłączony
  browser node. Jeśli Chrome działa gdzie indziej i nie ma podłączonego browser node, użyj
  zdalnego CDP albo hosta node.

## Gwarancje izolacji

- **Dedykowany katalog user data**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z workflow developerskimi.
- **Deterministyczne sterowanie kartami**: targetuj karty po `targetId`, a nie „ostatnia karta”.

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

## Control API (opcjonalnie)

Dla integracji tylko lokalnych Gateway wystawia małe loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobrania: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie endpointy akceptują `?profile=<name>`.

Jeśli skonfigurowano Gateway auth ze współdzielonym sekretem, trasy HTTP browser także wymagają auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback API przeglądarki **nie** konsumuje nagłówków trusted-proxy ani
  nagłówków tożsamości Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` albo `trusted-proxy`, te loopback trasy browser
  nie dziedziczą tych trybów przenoszących tożsamość; utrzymuj je tylko na loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
awarii polityki:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Obecne wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo jest nierozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): payload akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym typem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone w konfiguracji.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo batchowe `targetId` jest sprzeczne z targetem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili existing-session.

Inne awarie runtime nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/AI snapshot/role snapshot, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- snapshoty ARIA
- zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest per-tab
  WebSocket CDP
- zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- zrzuty ekranu oparte na refach (`--ref`) dla `existing-session` z wyniku snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- AI snapshoty / role snapshoty
- zrzuty ekranu elementów z selektorami CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, napraw zależności runtime bundlowanego pluginu browser tak, aby `playwright-core` było zainstalowane,
a następnie zrestartuj gateway. Dla instalacji pakietowanych uruchom `openclaw doctor --fix`.
Dla Dockera doinstaluj też binarki przeglądarki Chromium, jak pokazano poniżej.

#### Instalacja Playwright w Dockerze

Jeśli Twój Gateway działa w Dockerze, unikaj `npx playwright` (konflikty override npm).
Zamiast tego użyj bundlowanego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest zachowywane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Przepływ wysokiego poziomu:

- Mały **serwer control** akceptuje żądania HTTP.
- Łączy się z przeglądarkami opartymi na Chromium (Chrome/Brave/Edge/Chromium) przez **CDP**.
- Do bardziej zaawansowanych akcji (click/type/snapshot/PDF) używa **Playwright** ponad
  CDP.
- Gdy Playwright nie jest dostępny, dostępne są tylko operacje niewymagające Playwright.

Ten projekt utrzymuje agenta na stabilnym, deterministycznym interfejsie, jednocześnie pozwalając
zamieniać lokalne/zdalne przeglądarki i profile.

## Krótka dokumentacja CLI

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

Uwaga dotycząca lifecycle:

- Dla profili attach-only i zdalnych profili CDP `openclaw browser stop` nadal jest
  właściwym poleceniem czyszczenia po testach. Zamyka aktywną sesję control i
  usuwa tymczasowe nadpisania emulacji zamiast zabijać bazową
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

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed click/press,
  które wywoła chooser/dialog.
- Ścieżki wyjściowe pobrań i trace są ograniczone do katalogów tymczasowych OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - pobrania: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Ścieżki uploadu są ograniczone do katalogu głównego tymczasowych uploadów OpenClaw:
  - uploady: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` może też ustawiać inputy plików bezpośrednio przez `--input-ref` lub `--element`.
- `snapshot`:
  - `--format ai` (domyślnie, gdy Playwright jest zainstalowany): zwraca AI snapshot z numerycznymi refami (`aria-ref="<n>"`).
  - `--format aria`: zwraca drzewo dostępności (bez refów; tylko do inspekcji).
  - `--efficient` (lub `--mode efficient`): kompaktowy preset role snapshot (interactive + compact + depth + niższe maxChars).
  - Domyślna konfiguracja (tylko tool/CLI): ustaw `browser.snapshotDefaults.mode: "efficient"`, aby używać wydajnych snapshotów, gdy wywołujący nie przekazuje trybu (zobacz [Konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
  - Opcje role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) wymuszają snapshot oparty na rolach z refami takimi jak `ref=e12`.
  - `--frame "<iframe selector>"` ogranicza role snapshoty do iframe (w parze z refami ról typu `e12`).
  - `--interactive` wypisuje płaską, łatwą do wyboru listę elementów interaktywnych (najlepsze do sterowania akcjami).
  - `--labels` dodaje zrzut ekranu tylko viewportu z nałożonymi etykietami refów (wypisuje `MEDIA:<path>`).
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (albo numerycznego `12`, albo refu roli `e12`).
  Selektory CSS celowo nie są obsługiwane dla akcji.

## Snapshoty i refy

OpenClaw obsługuje dwa style „snapshotów”:

- **AI snapshot (numeryczne refy)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wyjście: tekstowy snapshot zawierający numeryczne refy.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozwiązywany przez `aria-ref` Playwright.

- **Role snapshot (refy ról takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozwiązywany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z nałożonymi etykietami `e12`.

Zachowanie refów:

- Refy **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego refu.
- Jeśli role snapshot został wykonany z `--frame`, refy ról są ograniczone do tego iframe do następnego role snapshot.

## Ulepszenia wait

Możesz czekać na więcej niż tylko czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekanie, aż selector stanie się widoczny:
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
3. Jeśli nadal się nie udaje: `openclaw browser highlight <ref>`, aby zobaczyć, co targetuje Playwright
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj trace:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptowania i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshoty w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły analizować rozmiar i gęstość payloadu.

## Pokrętła stanu i środowiska

Są przydatne dla przepływów typu „spraw, by strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- HTTP basic auth: `set credentials user pass` (albo `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (albo `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może
  tym sterować. Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Dla logowań i uwag o anti-bot (X/Twitter itp.) zobacz [Logowanie przeglądarki + publikowanie w X/Twitter](/pl/tools/browser-login).
- Utrzymuj Gateway/host node jako prywatne (tylko loopback lub tailnet).
- Zdalne endpointy CDP są potężne; tuneluj je i zabezpieczaj.

Przykład trybu ścisłego (domyślnie blokuj prywatne/wewnętrzne destynacje):

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

Dla problemów specyficznych dla Linuksa (szczególnie snap Chromium) zobacz
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Dla konfiguracji z podzielonym hostem WSL2 Gateway + Windows Chrome zobacz
[WSL2 + Windows + zdalny Chrome CDP — rozwiązywanie problemów](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchomienia CDP vs blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchomienia lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że control plane przeglądarki jest zdrowy.
- **Blokada SSRF podczas nawigacji** oznacza, że control plane przeglądarki jest zdrowy, ale target nawigacji strony został odrzucony przez politykę.

Typowe przykłady:

- Błąd uruchomienia lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blokada SSRF podczas nawigacji:
  - przepływy `open`, `navigate`, snapshot lub otwierania kart kończą się błędem polityki browser/network, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozróżnić oba przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak czytać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw diagnozuj gotowość CDP.
- Jeśli `start` się powiedzie, ale `tabs` zawiedzie, control plane nadal jest niezdrowy. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` lub `navigate` zawiedzie, control plane przeglądarki działa, a błąd leży w polityce nawigacji lub stronie docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest zdrowa.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa fail-closed obiektu polityki SSRF, nawet jeśli nie skonfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu `openclaw` na local loopback kontrole zdrowia CDP celowo pomijają egzekwowanie osiągalności browser SSRF dla własnego lokalnego control plane OpenClaw.
- Ochrona nawigacji jest osobna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy target `open` lub `navigate` będzie dozwolony.

Wskazówki bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki browser SSRF.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, gdzie dostęp przeglądarki do sieci prywatnej jest wymagany i przejrzany.

Przykład: nawigacja zablokowana, control plane zdrowy

- `start` kończy się sukcesem
- `tabs` kończy się sukcesem
- `open http://internal.example` kończy się błędem

To zwykle oznacza, że uruchomienie przeglądarki jest poprawne, a target nawigacji wymaga przeglądu polityki.

Przykład: start zablokowany, zanim nawigacja ma znaczenie

- `start` kończy się błędem `not reachable after start`
- `tabs` także kończy się błędem albo nie może zostać uruchomione

To wskazuje na uruchamianie przeglądarki lub osiągalność CDP, a nie na problem allowlisty URL strony.

## Narzędzia agenta + jak działa control

Agent dostaje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to się mapuje:

- `browser snapshot` zwraca stabilne drzewo UI (AI albo ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do click/type/drag/select.
- `browser screenshot` przechwytuje piksele (cała strona albo element).
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome albo zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach sandboxed `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli pominięto `target`: sesje sandboxed domyślnie używają `sandbox`, sesje niesandboxed domyślnie używają `host`.
  - Jeśli podłączony jest node zdolny do obsługi przeglądarki, narzędzie może automatycznie routować do niego, chyba że przypniesz `target="host"` albo `target="node"`.

To utrzymuje deterministyczność agenta i pozwala unikać kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) — browser control w środowiskach sandboxed
- [Bezpieczeństwo](/pl/gateway/security) — ryzyka browser control i utwardzanie
