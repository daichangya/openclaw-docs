---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego openclaw zakłóca działanie Twojego Chrome'a
    - Implementowanie ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw może uruchomić **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz Gateway (tylko local loopback).

Widok dla początkujących:

- Pomyśl o tym jak o **oddzielnej przeglądarce tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, odczytywać strony, klikać i pisać** w bezpiecznym torze.
- Wbudowany profil `user` dołącza do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczną kontrolę kart (lista/otwieranie/fokus/zamykanie).
- Działania agenta (kliknięcie/pisanie/przeciąganie/zaznaczanie), snapshoty, zrzuty ekranu, PDF-y.
- Dołączoną Skill `browser-automation`, która uczy agentów pętli odzyskiwania
  snapshot, stable-tab, stale-ref i manual-blocker, gdy plugin przeglądarki jest włączony.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, odizolowana powierzchnia dla
automatyzacji i weryfikacji wykonywanej przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz ją w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` całkowicie nie istnieje albo agent mówi, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia browser](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Plugin

Domyślne narzędzie `browser` jest dołączonym Plugin. Wyłącz je, aby zastąpić je innym pluginem, który rejestruje tę samą nazwę narzędzia `browser`:

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

Wartości domyślne wymagają zarówno `plugins.entries.browser.enabled`, jak i `browser.enabled=true`. Wyłączenie tylko pluginu usuwa jednocześnie CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterowania; konfiguracja `browser.*` pozostaje nienaruszona na potrzeby zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, trzymaj refy w tej samej karcie, używaj `tabId`/etykiet do wskazywania kart
  i wczytaj Skill przeglądarki przy pracy wieloetapowej.
- Dołączona Skill `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, oznacz karty zadania etykietami, wykonaj snapshot przed działaniem,
  wykonaj ponowny snapshot po zmianach interfejsu, odzyskaj nieaktualne refy raz,
  i zgłaszaj blokady logowania/2FA/captcha lub kamery/mikrofonu jako działanie ręczne zamiast zgadywać.

Skills dołączone do pluginu są widoczne na liście dostępnych Skills agenta, gdy
plugin jest włączony. Pełne instrukcje Skill są ładowane na żądanie, więc zwykłe
tury nie płacą pełnym kosztem tokenów.

## Brak polecenia lub narzędzia browser

Jeśli po aktualizacji `openclaw browser` jest nieznane, brakuje `browser.request` lub agent zgłasza, że narzędzie browser jest niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`. Dodaj ją:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` nie zastępują członkostwa na liście dozwolonych — allowlist steruje ładowaniem pluginu, a polityka narzędzi działa dopiero po załadowaniu. Usunięcie `plugins.allow` całkowicie również przywraca wartość domyślną.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (bez wymaganego rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **prawdziwej zalogowanej przeglądarki Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy istniejące zalogowane sesje mają znaczenie i użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit dołączenia.
- `profile` jest jawnym nadpisaniem, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz domyślnie używać trybu zarządzanego.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // domyślnie: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // włączaj tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // starsze nadpisanie pojedynczego profilu
    remoteCdpTimeoutMs: 1500, // limit czasu zdalnego HTTP CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // limit czasu uzgadniania WebSocket zdalnego CDP (ms)
    localLaunchTimeoutMs: 15000, // limit czasu wykrywania lokalnie zarządzanego Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // limit czasu gotowości lokalnego CDP po uruchomieniu (ms)
    actionTimeoutMs: 60000, // domyślny limit czasu działania przeglądarki (ms)
    tabCleanup: {
      enabled: true, // domyślnie: true
      idleMinutes: 120, // ustaw 0, aby wyłączyć czyszczenie bezczynności
      maxTabsPerSession: 8, // ustaw 0, aby wyłączyć limit na sesję
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

<AccordionGroup>

<Accordion title="Porty i dostępność">

- Usługa sterowania wiąże się z local loopback na porcie pochodnym od `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa porty pochodne w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, jeśli nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy kontroli dostępności HTTP zdalnego CDP (nie-loopback); `remoteCdpHandshakeTimeoutMs` dotyczy uzgadniania WebSocket zdalnego CDP.
- `localLaunchTimeoutMs` to budżet czasu, w którym lokalnie uruchomiony zarządzany proces Chrome
  ma udostępnić swój punkt końcowy HTTP CDP. `localCdpReadyTimeoutMs` to
  kolejny budżet czasu na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabszych VPS-ach lub starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości są ograniczone do 120000 ms.
- `actionTimeoutMs` to domyślny budżet czasu dla żądań `act` przeglądarki, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje małe okno zapasu, aby długie oczekiwanie mogło się zakończyć zamiast przekroczyć limit czasu na granicy HTTP.
- `tabCleanup` to czyszczenie best-effort dla kart otwieranych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia subagentów, Cron i ACP nadal zamyka jawnie śledzone karty na końcu sesji; sesje główne pozostawiają aktywne karty do ponownego użycia, a następnie zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i open-tab są chronione przed SSRF przed nawigacją i ponownie sprawdzane best-effort na końcowym adresie URL `http(s)` po nawigacji.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie zdalnych punktów końcowych CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/dostawcy `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie kierują automatycznie ruchu przeglądarki zarządzanej przez OpenClaw przez proxy. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy dostawcy nie osłabiały kontroli SSRF przeglądarki.
- Aby skierować samą zarządzaną przeglądarkę przez proxy, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` lub `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne trasowanie przeglądarki przez proxy, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie zostanie uruchomiona; nastąpi tylko dołączenie, jeśli jakaś już działa.
- `headless` można ustawić globalnie lub dla poszczególnych lokalnych zarządzanych profili. Wartości dla profilu mają pierwszeństwo przed `browser.headless`, więc jeden lokalnie uruchamiany profil może pozostać headless, podczas gdy inny pozostanie widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia headless dla lokalnych zarządzanych profili bez przepisywania
  `browser.headless` ani konfiguracji profilu. Profile existing-session, attach-only i
  zdalnego CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` ani `WAYLAND_DISPLAY` lokalne zarządzane profile
  domyślnie automatycznie przechodzą w tryb headless, gdy ani środowisko, ani konfiguracja
  profilu/globalna nie wybierają jawnie trybu z interfejsem. `openclaw browser status --json`
  raportuje `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` lub `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchamianie lokalnych zarządzanych instancji w trybie headless dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca praktyczny błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal ma pierwszeństwo dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie lub dla poszczególnych lokalnych zarządzanych profili. Wartości dla profilu mają pierwszeństwo przed `browser.executablePath`, więc różne zarządzane profile mogą uruchamiać różne przeglądarki oparte na Chromium.
- `color` (na poziomie głównym i dla profilu) barwi interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślnym profilem jest `openclaw` (zarządzany samodzielnie). Użyj `defaultProfile: "user"`, aby domyślnie przejść na zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session ma dołączać do niestandardowego profilu użytkownika Chromium (Brave, Edge itp.).

</Accordion>

</AccordionGroup>

## Użyj Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną przeglądarką systemową** jest przeglądarka oparta na Chromium (Chrome/Brave/Edge itp.),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie. `~` rozwija się do katalogu domowego systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Lub ustaw to w konfiguracji, dla każdej platformy:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` dla poszczególnych profili wpływa tylko na lokalne zarządzane profile, które OpenClaw
uruchamia. Profile `existing-session` zamiast tego dołączają do już działającej przeglądarki,
a zdalne profile CDP używają przeglądarki stojącej za `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślnie):** Gateway uruchamia usługę sterowania na local loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom hosta Node na maszynie z przeglądarką; Gateway będzie przekazywać do niego akcje przeglądarki.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- `headless` wpływa tylko na lokalne zarządzane profile, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek existing-session ani zdalnego CDP.
- `executablePath` podlega tej samej zasadzie lokalnych zarządzanych profili. Zmiana go dla
  działającego lokalnego zarządzanego profilu oznacza ten profil do restartu/uzgodnienia, aby
  następne uruchomienie użyło nowego pliku wykonywalnego.

Zachowanie przy zatrzymaniu różni się w zależności od trybu profilu:

- lokalne zarządzane profile: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  OpenClaw uruchomił
- profile attach-only i zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefę czasową, tryb offline i
  podobny stan), mimo że żaden proces przeglądarki nie został uruchomiony przez OpenClaw

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny w query (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie przy wywoływaniu punktów końcowych `/json/*` oraz przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast commitowania ich do plików konfiguracyjnych.

## Proxy przeglądarki Node (domyślnie bez konfiguracji)

Jeśli uruchamiasz **hosta Node** na maszynie z Twoją przeglądarką, OpenClaw może
automatycznie kierować wywołania narzędzia przeglądarki do tego Node bez żadnej dodatkowej konfiguracji przeglądarki.
To domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste, aby zachować starsze/domyslne zachowanie: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę minimalnych uprawnień: tylko profile z allowlist mogą być wskazywane, a trasy tworzenia/usuwania trwałych profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na Node: `nodeHost.browserProxy.enabled=false`
  - Na Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowane zdalne CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy URL połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszą opcją jest bezpośredni adres URL WebSocket
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
- Wybierz punkt końcowy regionu zgodny z Twoim kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje bazowy adres URL HTTPS, możesz albo przekształcić go do
  `wss://` dla bezpośredniego połączenia CDP, albo zachować adres HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Dostawcy bezpośredniego WebSocket CDP

Niektóre hostowane usługi przeglądarki udostępniają **bezpośredni punkt końcowy WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty adresów URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć adres URL debuggera WebSocket, a następnie
  się łączy. Bez fallbacku WebSocket.
- **Bezpośrednie punkty końcowe WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i pomija
  `/json/version` całkowicie.
- **Nagie korzenie WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie on użyty, w przeciwnym razie OpenClaw
  wraca do bezpośredniego handshake WebSocket na nagim korzeniu. Dzięki temu
  nagie `ws://` wskazujące na lokalne Chrome nadal może się połączyć, ponieważ Chrome
  akceptuje aktualizacje WebSocket tylko na konkretnej ścieżce per-target z
  `/json/version`.

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
  ręczny krok tworzenia sesji nie jest potrzebny.
- Darmowy plan pozwala na jedną współbieżną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [pricing](https://www.browserbase.com/pricing), aby poznać limity płatnych planów.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać pełne
  informacje referencyjne o API, przewodniki po SDK i przykłady integracji.

## Bezpieczeństwo

Kluczowe założenia:

- Sterowanie przeglądarką działa tylko przez loopback; dostęp przechodzi przez uwierzytelnianie Gateway lub parowanie Node.
- Samodzielne HTTP API przeglądarki na loopback używa **wyłącznie uwierzytelniania wspólnym sekretem**:
  bearer auth tokenem gateway, `x-openclaw-password` lub HTTP Basic auth z
  skonfigurowanym hasłem gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego API przeglądarki na loopback.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania wspólnym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy uruchomieniu i zapisuje go do konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` lub `trusted-proxy`.
- Utrzymuj Gateway i wszelkie hosty Node w sieci prywatnej (Tailscale); unikaj publicznej ekspozycji.
- Traktuj zdalne adresy URL/tokeny CDP jak sekrety; preferuj zmienne środowiskowe lub menedżer sekretów.

Wskazówki dotyczące zdalnego CDP:

- Preferuj szyfrowane punkty końcowe (HTTPS lub WSS) oraz krótkotrwałe tokeny, gdy to możliwe.
- Unikaj osadzania długowiecznych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez OpenClaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika i portem CDP
- **zdalne**: jawny adres URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez auto-connect Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany dla dołączania existing-session przez Chrome MCP.
- Profile existing-session poza `user` są opt-in; utwórz je przez `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Existing session przez Chrome DevTools MCP

OpenClaw może także dołączyć do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie użyć kart i stanu logowania,
które są już otwarte w tym profilu przeglądarki.

Oficjalne materiały i konfiguracja w tle:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz
inną nazwę, kolor lub katalog danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa auto-connect Chrome MCP, który kieruje do
  domyślnego lokalnego profilu Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium lub niedomyślnego profilu Chrome:

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

Następnie w odpowiedniej przeglądarce:

1. Otwórz stronę inspect tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit o połączenie, gdy OpenClaw dołączy.

Typowe strony inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke żywego dołączenia:

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

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspect tej przeglądarki
- przeglądarka wyświetliła monit o zgodę na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest lokalnie zainstalowane dla domyślnych profili auto-connect, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić
  monit o dołączenie.
- Gateway lub host Node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż odizolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; jedynie do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest ono przekazywane dalej, aby wskazać ten katalog danych użytkownika.
- Existing-session może dołączać na wybranym hoście lub przez podłączony
  browser Node. Jeśli Chrome działa gdzie indziej i nie ma podłączonego browser Node, użyj
  zdalnego CDP lub hosta Node.

### Niestandardowe uruchamianie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla konkretnego profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest tym, czego chcesz (hosty offline,
przypięte wersje, dostarczone binaria):

| Pole         | Działanie                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny do uruchomienia zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.             |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawione w profilu existing-session, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktów końcowych i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji existing-session">

W porównaniu z zarządzanym profilem `openclaw`, sterowniki existing-session są bardziej ograniczone:

- **Zrzuty ekranu** — działają przechwycenia strony i przechwycenia elementów `--ref`; selektory CSS `--element` nie działają. `--full-page` nie może być łączone z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na refach.
- **Działania** — `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają refów snapshotów (bez selektorów CSS). `click-coords` klika widoczne współrzędne viewport i nie wymaga refu snapshota. `click` obsługuje tylko lewy przycisk myszy. `type` nie obsługuje `slowly=true`; użyj `fill` lub `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczego wywołania. `select` akceptuje pojedynczą wartość.
- **Oczekiwanie / upload / dialog** — `wait --url` obsługuje wzorce dokładne, podciągi i glob; `wait --load networkidle` nie jest obsługiwane. Hooki uploadu wymagają `ref` lub `inputRef`, po jednym pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisywania limitu czasu.
- **Funkcje tylko dla trybu zarządzanego** — akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami deweloperskimi.
- **Deterministyczna kontrola kart**: `tabs` zwraca najpierw `suggestedTargetId`, a następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zgodności.

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
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium w `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptów i debugowania Gateway udostępnia małe **HTTP API sterowania tylko na loopback**
oraz pasujące CLI `openclaw browser` (snapshoty, refy, rozszerzenia wait,
wyjście JSON, przepływy debugowania). Zobacz
[Browser control API](/pl/tools/browser-control), aby uzyskać pełne informacje referencyjne.

## Rozwiązywanie problemów

W przypadku problemów specyficznych dla Linuxa (zwłaszcza snap Chromium) zobacz
[Browser troubleshooting](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji rozdzielonych WSL2 Gateway + Windows Chrome zobacz
[WSL2 + Windows + troubleshooting zdalnego Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchamiania CDP a blokada SSRF nawigacji

To są różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchamiania lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że warstwa sterowania przeglądarką jest zdrowa.
- **Blokada SSRF nawigacji** oznacza, że warstwa sterowania przeglądarką jest zdrowa, ale cel nawigacji strony został odrzucony przez politykę.

Typowe przykłady:

- Błąd uruchamiania lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshot lub otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozróżnić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw diagnozuj gotowość CDP.
- Jeśli `start` się powiedzie, ale `tabs` zawiedzie, warstwa sterowania nadal jest niezdrowa. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` lub `navigate` zawiedzie, warstwa sterowania przeglądarką działa, a problem leży w polityce nawigacji lub stronie docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest zdrowa.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF typu fail-closed nawet wtedy, gdy nie konfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu `openclaw` na loopback kontrole zdrowia CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej warstwy sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` lub `navigate` jest dozwolony.

Wskazówki dotyczące bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, gdzie dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to się mapuje:

- `browser snapshot` zwraca stabilne drzewo interfejsu (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshota do klikania/pisania/przeciągania/zaznaczania.
- `browser screenshot` przechwytuje piksele (cała strona, element lub oznaczone refy).
- `browser doctor` sprawdza gotowość Gateway, Plugin, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalne CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać miejsce działania przeglądarki.
  - W sesjach sandbox `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięte: sesje sandbox domyślnie używają `sandbox`, sesje bez sandbox domyślnie używają `host`.
  - Jeśli podłączony jest Node z obsługą przeglądarki, narzędzie może automatycznie kierować do niego wywołania, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent działa deterministycznie i unika kruchych selektorów.

## Powiązane

- [Tools Overview](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach sandbox
- [Security](/pl/gateway/security) — ryzyka sterowania przeglądarką i utwardzanie
