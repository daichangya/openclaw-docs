---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Diagnozowanie, dlaczego openclaw zakłóca działanie Twojego Chrome
    - Implementowanie ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:42:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw może uruchomić **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odseparowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz Gateway (tylko loopback).

Widok dla początkujących:

- Pomyśl o tym jak o **oddzielnej przeglądarce tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, odczytywać strony, klikać i wpisywać tekst** w bezpiecznym torze.
- Wbudowany profil `user` dołącza do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwieranie/fokus/zamykanie).
- Akcje agenta (kliknięcie/pisanie/przeciąganie/zaznaczanie), snapshoty, zrzuty ekranu, pliki PDF.
- Dołączony Skill `browser-automation`, który uczy agentów pętli odzyskiwania snapshot,
  stable-tab, stale-ref i manual-blocker, gdy plugin przeglądarki jest włączony.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, odizolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz tę funkcję w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` w ogóle nie jest dostępne albo agent informuje, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia browser](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie pluginem

Domyślne narzędzie `browser` jest dołączonym pluginem. Wyłącz je, aby zastąpić je innym pluginem rejestrującym tę samą nazwę narzędzia `browser`:

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

Ustawienia domyślne wymagają zarówno `plugins.entries.browser.enabled`, jak i `browser.enabled=true`. Wyłączenie tylko pluginu usuwa jednocześnie CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterowania; konfiguracja `browser.*` pozostaje nienaruszona na potrzeby zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga o profilu narzędzi: `tools.profile: "coding"` zawiera `web_search` i
`web_fetch`, ale nie zawiera pełnego narzędzia `browser`. Jeśli agent lub
uruchomiony podagent ma używać automatyzacji przeglądarki, dodaj browser na etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dla pojedynczego agenta użyj `agents.list[].tools.alsoAllow: ["browser"]`.
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarczy, ponieważ polityka podagenta
jest stosowana po filtrowaniu profilu.

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, utrzymuj referencje w obrębie tej samej karty, używaj `tabId`/etykiet do kierowania na kartę
  i wczytuj Skill przeglądarki przy pracy wieloetapowej.
- Dołączony Skill `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, oznacz etykietami karty zadania, wykonaj snapshot przed działaniem,
  po zmianach interfejsu wykonaj snapshot ponownie, raz odzyskaj stale refs oraz
  zgłaszaj blokery typu login/2FA/captcha lub kamera/mikrofon jako działanie ręczne zamiast zgadywać.

Skills dołączone przez plugin są wymieniane w dostępnych Skills agenta, gdy
plugin jest włączony. Pełne instrukcje Skill są wczytywane na żądanie, więc zwykłe tury
nie ponoszą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia browser

Jeśli po aktualizacji `openclaw browser` jest nieznane, brakuje `browser.request` albo agent zgłasza, że narzędzie przeglądarki jest niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`. Dodaj ją:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` oraz `tools.alsoAllow: ["browser"]` nie zastępują członkostwa na allowliście — allowlista kontroluje ładowanie pluginu, a polityka narzędzi jest uruchamiana dopiero po załadowaniu. Usunięcie `plugins.allow` całkowicie również przywraca ustawienie domyślne.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (bez wymaganego rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **prawdziwej zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje i użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny prompt dołączenia.
- `profile` jest jawnym nadpisaniem, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz, aby tryb zarządzany był domyślny.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // włączaj tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // starsze nadpisanie pojedynczego profilu
    remoteCdpTimeoutMs: 1500, // limit czasu zdalnego HTTP CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // limit czasu handshake WebSocket zdalnego CDP (ms)
    localLaunchTimeoutMs: 15000, // limit czasu wykrywania lokalnego zarządzanego Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // limit czasu gotowości lokalnego CDP po uruchomieniu (ms)
    actionTimeoutMs: 60000, // domyślny limit czasu działań przeglądarki (ms)
    tabCleanup: {
      enabled: true, // default: true
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

<Accordion title="Porty i osiągalność">

- Usługa sterowania wiąże się z loopback na porcie pochodnym od `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa porty pochodne w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje na zarządzany lokalny port CDP, jeśli nie jest ustawione.
- `remoteCdpTimeoutMs` dotyczy zdalnego oraz `attachOnly` sprawdzania osiągalności HTTP CDP
  i żądań HTTP otwierania kart; `remoteCdpHandshakeTimeoutMs` dotyczy
  ich handshake WebSocket CDP.
- `localLaunchTimeoutMs` to budżet czasu, w którym lokalnie uruchomiony zarządzany proces Chrome
  ma udostępnić swój punkt końcowy HTTP CDP. `localCdpReadyTimeoutMs` to
  kolejny budżet czasu na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, tanich VPS-ach lub starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- `actionTimeoutMs` to domyślny budżet czasu dla żądań `act` przeglądarki, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje niewielkie dodatkowe okno, aby długie oczekiwania mogły się zakończyć zamiast przekraczać limit czasu na granicy HTTP.
- `tabCleanup` to mechanizm best-effort czyszczenia kart otwieranych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia podagentów, Cron i ACP nadal zamyka swoje jawnie śledzone karty na końcu sesji; sesje główne zachowują aktywne karty do ponownego użycia, a następnie zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i open-tab są chronione przed SSRF przed nawigacją i ponownie sprawdzane metodą best-effort na końcowym URL `http(s)` po niej.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie zdalnego punktu końcowego CDP i zapytania `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/dostawcy `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie kierują automatycznie przez proxy przeglądarki zarządzanej przez OpenClaw. Zarządzany Chrome jest domyślnie uruchamiany bezpośrednio, więc ustawienia proxy dostawcy nie osłabiają kontroli SSRF przeglądarki.
- Aby skonfigurować proxy dla samej zarządzanej przeglądarki, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` lub `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne kierowanie przeglądarki przez proxy, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie jest uruchamiana; następuje tylko dołączenie, jeśli już działa.
- `headless` można ustawić globalnie lub dla każdego lokalnego zarządzanego profilu. Wartości per profil nadpisują `browser.headless`, więc jeden lokalnie uruchamiany profil może pozostać headless, podczas gdy inny pozostaje widoczny.
- `POST /start?headless=true` oraz `openclaw browser start --headless` żądają
  jednorazowego uruchomienia headless dla lokalnych zarządzanych profili bez przepisywania
  `browser.headless` ani konfiguracji profilu. Profile existing-session, attach-only i
  zdalne profile CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY`, lokalne zarządzane profile
  domyślnie automatycznie przechodzą w tryb headless, gdy ani środowisko, ani konfiguracja profilu/globalna
  nie wybierają jawnie trybu z interfejsem. `openclaw browser status --json`
  raportuje `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` lub `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchamianie lokalnych zarządzanych przeglądarek w trybie headless dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca praktyczny błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal ma pierwszeństwo dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie lub dla każdego lokalnego zarządzanego profilu. Wartości per profil nadpisują `browser.executablePath`, więc różne zarządzane profile mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` dla katalogu domowego systemu operacyjnego.
- `color` (na najwyższym poziomie i per profil) nadaje odcień interfejsowi przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielny). Użyj `defaultProfile: "user"`, aby włączyć zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session ma dołączać do niestandardowego profilu użytkownika Chromium (Brave, Edge itp.). Ta ścieżka także akceptuje `~` dla katalogu domowego systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Używanie Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną przeglądarką systemową** jest przeglądarka oparta na Chromium (Chrome/Brave/Edge itd.),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie. Wartości `executablePath` na najwyższym poziomie i per profil akceptują `~`
dla katalogu domowego systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Albo ustaw to w konfiguracji, zależnie od platformy:

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

`executablePath` ustawione per profil wpływa tylko na lokalne zarządzane profile, które OpenClaw
uruchamia. Profile `existing-session` zamiast tego dołączają do już działającej przeglądarki,
a zdalne profile CDP używają przeglądarki dostępnej za `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania na loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom host Node na maszynie, która ma przeglądarkę; Gateway przekazuje do niego akcje przeglądarki przez proxy.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Dockerze opublikowany na `127.0.0.1`) ustaw także `attachOnly: true`. CDP na loopback
  bez `attachOnly` jest traktowane jako lokalny profil przeglądarki zarządzanej przez OpenClaw.
- `headless` wpływa tylko na lokalne zarządzane profile, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek `existing-session` ani zdalnych CDP.
- `executablePath` podlega tej samej zasadzie lokalnego zarządzanego profilu. Zmiana tej wartości w
  działającym lokalnym zarządzanym profilu oznacza ten profil do restartu/uzgodnienia, aby
  kolejne uruchomienie użyło nowego pliku binarnego.

Zachowanie przy zatrzymywaniu różni się zależnie od trybu profilu:

- lokalne zarządzane profile: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile attach-only i zdalne profile CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan),
  mimo że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny w query stringu (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje dane uwierzytelniające przy wywoływaniu punktów końcowych `/json/*` oraz przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast zapisywać je w plikach konfiguracyjnych.

## Proxy przeglądarki Node (domyślnie zero-config)

Jeśli uruchamiasz **host Node** na maszynie, która ma Twoją przeglądarkę, OpenClaw może
automatycznie kierować wywołania narzędzia przeglądarki do tego węzła bez żadnej dodatkowej konfiguracji przeglądarki.
To domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw je puste, aby zachować starsze/dom yślne zachowanie: wszystkie skonfigurowane profile pozostają dostępne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: można kierować tylko do profili z allowlisty, a trasy tworzenia/usuwania trwałych profili są blokowane na powierzchni proxy.
- Wyłącz to, jeśli nie chcesz tej funkcji:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na gateway: `gateway.nodes.browser.mode="off"`

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

- Zastąp `<BROWSERLESS_API_KEY>` swoim prawdziwym tokenem Browserless.
- Wybierz regionalny punkt końcowy odpowiadający Twojemu kontu Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje bazowy URL HTTPS, możesz albo przekształcić go do
  `wss://` dla bezpośredniego połączenia CDP, albo pozostawić URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

### Browserless Docker na tym samym hoście

Gdy Browserless jest hostowany samodzielnie w Dockerze, a OpenClaw działa na hoście, traktuj
Browserless jako zewnętrznie zarządzaną usługę CDP:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Adres w `browser.profiles.browserless.cdpUrl` musi być osiągalny z procesu
OpenClaw. Browserless musi także reklamować zgodny osiągalny punkt końcowy;
ustaw zmienną Browserless `EXTERNAL` na tę samą bazę WebSocket dostępną publicznie dla OpenClaw, na przykład
`ws://127.0.0.1:3000`, `ws://browserless:3000` lub stabilny prywatny adres
sieci Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujący na
adres, do którego OpenClaw nie ma dostępu, CDP HTTP może wyglądać na zdrowe, podczas gdy
dołączenie WebSocket nadal będzie kończyć się niepowodzeniem.

Nie pozostawiaj `attachOnly` nieustawionego dla profilu Browserless na loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalny zarządzany profil przeglądarki
i może zgłaszać, że port jest używany, ale nie należy do OpenClaw.

## Dostawcy bezpośredniego WebSocket CDP

Niektóre hostowane usługi przeglądarki udostępniają **bezpośredni punkt końcowy WebSocket**
zamiast standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debugera WebSocket, a następnie
  się łączy. Bez fallbacku WebSocket.
- **Bezpośrednie punkty końcowe WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i całkowicie pomija
  `/json/version`.
- **Nagie korzenie WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie ono użyte, w przeciwnym razie OpenClaw
  przejdzie do bezpośredniego handshake WebSocket na nagim korzeniu. Jeśli reklamowany
  punkt końcowy WebSocket odrzuci handshake CDP, ale skonfigurowany nagi korzeń
  go zaakceptuje, OpenClaw także przejdzie do tego korzenia. Dzięki temu nagie `ws://`
  wskazujące na lokalny Chrome nadal może się połączyć, ponieważ Chrome akceptuje upgrade
  WebSocket tylko na konkretnej ścieżce per target z `/json/version`, podczas gdy hostowani
  dostawcy nadal mogą używać swojego głównego punktu końcowego WebSocket, gdy ich punkt końcowy
  wykrywania reklamuje krótkotrwały URL, który nie nadaje się do Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
proksami mieszkaniowymi.

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
- Zastąp `<BROWSERBASE_API_KEY>` swoim prawdziwym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  ręczny krok tworzenia sesji nie jest potrzebny.
- Darmowy plan pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Limity planów płatnych znajdziesz w [cenniku](https://www.browserbase.com/pricing).
- Pełne informacje o API
  referencyjnym, przewodniki SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Najważniejsze założenia:

- Sterowanie przeglądarką działa tylko przez loopback; dostęp przechodzi przez uwierzytelnianie Gateway lub parowanie węzłów.
- Samodzielne loopback API HTTP przeglądarki używa **wyłącznie uwierzytelniania shared-secret**:
  token bearer gateway, `x-openclaw-password` lub uwierzytelnianie HTTP Basic z
  skonfigurowanym hasłem gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"`
  **nie** uwierzytelniają tego samodzielnego loopback API przeglądarki.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania shared-secret, OpenClaw
  automatycznie generuje `gateway.auth.token` przy uruchomieniu i zapisuje je w konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` lub `trusted-proxy`.
- Utrzymuj Gateway i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj wystawiania publicznego.
- Traktuj zdalne adresy URL/tokeny CDP jak sekrety; preferuj zmienne środowiskowe lub menedżer sekretów.

Wskazówki dotyczące zdalnego CDP:

- Jeśli to możliwe, preferuj szyfrowane punkty końcowe (HTTPS lub WSS) i tokeny krótkotrwałe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez OpenClaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika i portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: Twój istniejący profil Chrome przez automatyczne łączenie Chrome DevTools MCP

Ustawienia domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania existing-session Chrome MCP.
- Profile existing-session poza `user` są typu opt-in; utwórz je z `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może także dołączyć do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie użyć kart i stanu logowania,
które są już otwarte w tym profilu przeglądarki.

Oficjalne materiały referencyjne i instrukcje konfiguracji:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz
inną nazwę, kolor lub katalog danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego łączenia Chrome MCP, które kieruje do
  domyślnego lokalnego profilu Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium lub niestandardowego profilu Chrome.
`~` rozwija się do katalogu domowego Twojego systemu operacyjnego:

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

1. Otwórz stronę inspekcji tej przeglądarki do zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź prompt połączenia, gdy OpenClaw będzie się dołączać.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test dymny dołączania na żywo:

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
- `tabs` wyświetla już otwarte karty Twojej przeglądarki
- `snapshot` zwraca refs z wybranej aktywnej karty

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka wyświetliła prompt zgody na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili auto-connect, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Używaj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, podaj tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić
  prompt dołączenia.
- Gateway lub host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka wiąże się z większym ryzykiem niż odizolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest ono przekazywane dalej, aby wskazać ten katalog danych użytkownika.
- Existing-session może dołączać na wybranym hoście lub przez podłączony
  węzeł przeglądarki. Jeśli Chrome działa gdzie indziej i nie ma podłączonego węzła przeglądarki, użyj
  zamiast tego zdalnego CDP lub hosta węzła.

### Niestandardowe uruchamianie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla każdego profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest tym, czego chcesz (hosty offline,
przypięte wersje, dołączone pliki binarne):

| Pole         | Co robi                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny uruchamiany zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.                  |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawione w profilu existing-session, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania DevTools HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktów końcowych i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji existing-session">

W porównaniu z zarządzanym profilem `openclaw`, sterowniki existing-session są bardziej ograniczone:

- **Zrzuty ekranu** — działają przechwytywanie strony i przechwytywanie elementów przez `--ref`; selektory CSS `--element` nie są obsługiwane. `--full-page` nie może być łączone z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na ref.
- **Akcje** — `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają refs ze snapshotu (bez selektorów CSS). `click-coords` klika w widoczne współrzędne viewportu i nie wymaga ref ze snapshotu. `click` obsługuje tylko lewy przycisk myszy. `type` nie obsługuje `slowly=true`; użyj `fill` lub `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczego wywołania. `select` przyjmuje pojedynczą wartość.
- **Oczekiwanie / przesyłanie / dialog** — `wait --url` obsługuje dokładne dopasowanie, podciągi i wzorce glob; `wait --load networkidle` nie jest obsługiwane. Hooki uploadu wymagają `ref` lub `inputRef`, po jednym pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisywania limitu czasu.
- **Funkcje tylko dla trybu zarządzanego** — akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiegać kolizjom z procesami deweloperskimi.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, potem
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zgodności.

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
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium w `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptów i debugowania Gateway udostępnia małe **API HTTP sterowania dostępne tylko przez loopback**
oraz odpowiadające mu CLI `openclaw browser` (snapshoty, refs, rozszerzenia wait,
wyjście JSON, przepływy debugowania). Pełny opis znajdziesz w
[API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

Informacje o problemach specyficznych dla Linuxa (szczególnie snap Chromium) znajdziesz w
[Rozwiązywaniu problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji z rozdzieleniem hostów WSL2 Gateway + Windows Chrome zobacz
[WSL2 + Windows + rozwiązywanie problemów ze zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchamiania CDP a blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchamiania lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką działa poprawnie.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką działa poprawnie, ale docelowy adres nawigacji strony jest odrzucany przez politykę.

Typowe przykłady:

- Błąd uruchamiania lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, gdy
    zewnętrzna usługa CDP na loopback jest skonfigurowana bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshot lub otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw diagnozuj gotowość CDP.
- Jeśli `start` się powiedzie, ale `tabs` zakończy się błędem, płaszczyzna sterowania nadal jest w złym stanie. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` lub `navigate` zakończy się błędem, płaszczyzna sterowania przeglądarką działa, a błąd dotyczy polityki nawigacji lub strony docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką działa poprawnie.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF typu fail-closed, nawet jeśli nie skonfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu loopback `openclaw` kontrole stanu CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` lub `navigate` jest dozwolony.

Wskazówki bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w świadomie zaufanych środowiskach, w których dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent dostaje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to działa:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do kliknięć/pisania/przeciągania/zaznaczania.
- `browser screenshot` przechwytuje piksele (cała strona, element lub oznaczone refs).
- `browser doctor` sprawdza Gateway, plugin, profil, przeglądarkę i gotowość kart.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalne CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach sandboxed `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli pominięto `target`: sesje sandboxed domyślnie używają `sandbox`, sesje bez sandbox domyślnie używają `host`.
  - Jeśli podłączony jest węzeł z obsługą przeglądarki, narzędzie może automatycznie kierować ruch do niego, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent działa deterministycznie i unika kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach sandboxed
- [Bezpieczeństwo](/pl/gateway/security) — ryzyka sterowania przeglądarką i utwardzanie
