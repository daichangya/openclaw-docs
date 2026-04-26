---
read_when:
    - Potrzebujesz dokładnej semantyki pól konfiguracji lub wartości domyślnych
    - Weryfikujesz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja konfiguracji Gateway dla głównych kluczy OpenClaw, wartości domyślnych i odnośników do dedykowanych dokumentacji podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-04-26T11:29:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Główna dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Aby zobaczyć przegląd zorientowany na zadania, zobacz [Configuration](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację. Katalogi poleceń należące do kanałów i Plugin oraz szczegółowe opcje pamięci/QMD znajdują się na osobnych stronach, a nie tutaj.

Prawda kodu:

- `openclaw config schema` wypisuje aktywny JSON Schema używany do walidacji i Control UI, z dołączonymi metadanymi bundled/plugin/channel, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu o zakresie ścieżki dla narzędzi drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują hash bazowy dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj działania narzędzia `gateway` `config.schema.lookup`, aby uzyskać
dokładną dokumentację i ograniczenia na poziomie pól przed edycją. Użyj
[Configuration](/pl/gateway/configuration) dla wskazówek zorientowanych na zadania i tej strony
dla szerszej mapy pól, wartości domyślnych i odnośników do dokumentacji podsystemów.

Dedykowane szczegółowe dokumentacje:

- [Memory configuration reference](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` i konfiguracji dreaming w `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/pl/tools/slash-commands) dla bieżącego katalogu wbudowanych i bundled poleceń
- strony właścicieli kanałów/Plugin dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze + końcowe przecinki). Wszystkie pola są opcjonalne — OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji per kanał zostały przeniesione na dedykowaną stronę — zobacz
[Configuration — channels](/pl/gateway/config-channels) dla `channels.*`,
w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych
bundled kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, blokowanie przez wzmianki).

## Domyślne ustawienia agentów, multi-agent, sesje i wiadomości

Przeniesione na dedykowaną stronę — zobacz
[Configuration — agents](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (workspace, model, myślenie, Heartbeat, pamięć, multimedia, Skills, sandbox)
- `multiAgent.*` (routing multi-agent i powiązania)
- `session.*` (cykl życia sesji, Compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie Markdown)
- `talk.*` (tryb Talk)
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkrypcji (`700 ms na macOS i Android, 900 ms na iOS`)

## Narzędzia i niestandardowi dostawcy

Polityka narzędzi, przełączniki eksperymentalne, konfiguracja narzędzi oparta na dostawcach i konfiguracja niestandardowych
dostawców / `baseUrl` zostały przeniesione na dedykowaną stronę — zobacz
[Configuration — tools and custom providers](/pl/gateway/config-tools).

## MCP

Definicje serwerów MCP zarządzane przez OpenClaw znajdują się w `mcp.servers` i są
używane przez osadzony Pi i inne adaptery środowiska uruchomieniowego. Polecenia `openclaw mcp list`,
`show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z
docelowym serwerem podczas edycji konfiguracji.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla środowisk uruchomieniowych, które
  udostępniają skonfigurowane narzędzia MCP.
- `mcp.sessionIdleTtlMs`: bezczynny TTL dla MCP środowisk uruchomieniowych bundled o zakresie sesji.
  Jednorazowe uruchomienia osadzone żądają czyszczenia na końcu uruchomienia; ten TTL jest zabezpieczeniem awaryjnym dla
  długotrwałych sesji i przyszłych wywołujących.
- Zmiany w `mcp.*` są stosowane na gorąco przez usuwanie z pamięci podręcznej środowisk uruchomieniowych MCP sesji.
  Następne wykrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte
  wpisy `mcp.servers` są sprzątane natychmiast zamiast czekać na bezczynny TTL.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) i
[CLI backends](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie środowiska uruchomieniowego.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna allowlista tylko dla bundled Skills (managed/workspace Skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne Skills (najniższy priorytet).
- `install.preferBrew`: gdy ma wartość true, preferuje instalatory Homebrew, gdy `brew` jest
  dostępne, przed przejściem do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` wyłącza Skill, nawet jeśli jest bundled/zainstalowany.
- `entries.<skillKey>.apiKey`: pole ułatwiające dla Skills deklarujących podstawową zmienną env (ciąg plaintext lub obiekt SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Ładowane z `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` oraz `plugins.load.paths`.
- Wykrywanie akceptuje natywne OpenClaw plugins oraz zgodne bundly Codex i Claude, w tym bundly Claude z domyślnym układem bez manifestu.
- **Zmiany konfiguracji wymagają restartu Gateway.**
- `allow`: opcjonalna allowlista (ładują się tylko wymienione plugins). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: pole ułatwiające klucz API na poziomie Plugin (gdy obsługiwane przez Plugin).
- `plugins.entries.<id>.env`: mapa zmiennych env o zakresie Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków Plugin i obsługiwanych katalogów hooków dostarczanych przez bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niebundled plugins mogą odczytywać surową treść rozmowy z typowanych hooków takich jak `llm_input`, `llm_output`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie ufa temu Plugin, że może żądać nadpisań `provider` i `model` per uruchomienie dla uruchomień subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna allowlista kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Użyj `"*"`, tylko gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez Plugin (walidowany przez schemat natywnego OpenClaw Plugin, gdy dostępny).
- Ustawienia kont/środowiska uruchomieniowego Plugin kanału znajdują się w `channels.<id>` i powinny być opisane przez metadane `channelConfigs` manifestu właścicielskiego Plugin, a nie przez centralny rejestr opcji OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania stron Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). Przechodzi do `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` lub zmiennej env `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`).
  - `onlyMainContent`: wyodrębnij tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie webowe Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok do użycia przy wyszukiwaniu (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik Dreaming (domyślnie `false`).
  - `frequency`: rytm Cron dla każdego pełnego przebiegu Dreaming (domyślnie `"0 3 * * *"`).
  - polityka faz i progi są szczegółami implementacyjnymi (nie są kluczami konfiguracji przeznaczonymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Memory configuration reference](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone Claude bundle plugins mogą również dostarczać osadzone domyślne ustawienia Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe łatki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybiera identyfikator aktywnego Plugin pamięci albo `"none"`, aby wyłączyć plugins pamięci.
- `plugins.slots.contextEngine`: wybiera identyfikator aktywnego Plugin silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Plugins](/pl/tools/plugin).

---

## Przeglądarka

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` wyłącza `act:evaluate` i `wait --fn`.
- `tabCleanup` odzyskuje śledzone karty głównego agenta po czasie bezczynności lub gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` lub `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki pozostaje domyślnie ścisła.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki po sieci prywatnej.
- W trybie ścisłym zdalne endpointy profilu CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie ścisłym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do podłączania (`start`/`stop`/`reset` są wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Używaj HTTP(S), gdy chcesz, aby OpenClaw wykrył `/json/version`; używaj WS(S),
  gdy dostawca daje bezpośredni URL WebSocket DevTools.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` mają zastosowanie do zdalnych i
  `attachOnly` kontroli osiągalności CDP oraz żądań otwierania kart. Zarządzane profile
  local loopback zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez local loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw potraktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać lokalne błędy własności portu.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą podłączać się na
  wybranym hoście lub przez podłączony Node przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` zachowują bieżące limity routingu Chrome MCP:
  działania oparte na snapshot/ref zamiast kierowania przez selektor CSS, hooki
  przesyłania jednego pliku, brak nadpisań limitów czasu okien dialogowych, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań ani działań wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a inny w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania Chrome CDP HTTP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do
  gotowości websocketu CDP po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się poprawnie, ale kontrole gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: przeglądarka domyślna, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Zarówno `browser.executablePath`, jak i `browser.profiles.<name>.executablePath`
  akceptują `~` i `~/...` dla katalogu domowego Twojego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` per profil w profilach `existing-session` również rozwija tyldę.
- Usługa sterowania: tylko loopback (port wyprowadzony z `gateway.port`, domyślnie `18791`).
- `extraArgs` dołącza dodatkowe flagi uruchamiania do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla chromu natywnego UI aplikacji (odcień dymku trybu Talk itp.).
- `assistant`: nadpisanie tożsamości Control UI. Przechodzi do aktywnej tożsamości agenta.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Szczegóły pól Gateway">

- `mode`: `local` (uruchamia Gateway) albo `remote` (łączy się ze zdalnym Gateway). Gateway odmawia uruchomienia, jeśli nie jest ustawione `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Priorytet: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko IP Tailscale) albo `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dla Docker**: domyślne wiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowej Docker (`-p 18789:18789`) ruch przychodzi przez `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: wymagane domyślnie. Wiązania inne niż loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRef), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Uruchamianie i przepływy instalacji/naprawy usługi kończą się błędem, gdy skonfigurowane są oba, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko dla zaufanych lokalnych konfiguracji loopback; celowo nie jest to oferowane w promptach onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie do reverse proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)). Ten tryb oczekuje źródła proxy **spoza loopback**; reverse proxy loopback na tym samym hoście nie spełniają wymagań trusted-proxy auth.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełniać wymagania uwierzytelniania Control UI/WebSocket (weryfikowane przez `tailscale whois`). Endpointy HTTP API **nie** używają tego uwierzytelniania nagłówkiem Tailscale; stosują zwykły tryb uwierzytelniania HTTP Gateway. Ten przepływ bez tokena zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych prób uwierzytelniania. Stosowany per IP klienta i per zakres uwierzytelniania (współdzielony sekret i token urządzenia są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Współbieżne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu zamiast tego, by oba przeszły równolegle jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, jeśli celowo chcesz objąć limitowaniem także ruch localhost (na potrzeby testów lub ścisłych wdrożeń proxy).
- Próby uwierzytelniania WS z origin przeglądarki są zawsze ograniczane z wyłączonym wyjątkiem loopback (defense-in-depth przeciw brutalnym atakom localhost z poziomu przeglądarki).
- W loopback te blokady pochodzące z origin przeglądarki są izolowane per znormalizowana
  wartość `Origin`, więc powtarzające się błędy z jednego origin localhost nie blokują automatycznie
  innego origin.
- `tailscale.mode`: `serve` (tylko tailnet, wiązanie loopback) albo `funnel` (publiczne, wymaga uwierzytelniania).
- `controlUi.allowedOrigins`: jawna allowlista origin przeglądarki dla połączeń Gateway WebSocket. Wymagana, gdy klienci przeglądarkowi mają łączyć się z originów innych niż loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb włączający fallback origin oparty na nagłówku Host dla wdrożeń, które celowo polegają na polityce origin z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) albo `direct` (ws/wss). Dla `direct` `remote.url` musi mieć postać `ws://` albo `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: nadpisanie awaryjne w
  zmiennych środowiskowych procesu po stronie klienta, które dopuszcza jawny tekst `ws://` do zaufanych prywatnych
  adresów IP; domyślnie jawny tekst pozostaje dozwolony tylko dla loopback. Nie ma odpowiednika w `openclaw.json`,
  a konfiguracja prywatnej sieci przeglądarki, taka jak
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów
  Gateway WebSocket.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same w sobie nie konfigurują uwierzytelniania Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS dla zewnętrznego przekaźnika APNs używanego przez oficjalne/TestFlight buildy iOS po opublikowaniu przez nie rejestracji opartych na relay do Gateway. Ten URL musi odpowiadać URL relay skompilowanemu w buildzie iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania Gateway→relay w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na relay są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, uwzględnia tę tożsamość w rejestracji relay i przekazuje Gateway uprawnienie wysyłania ograniczone do tej rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko do developmentu dla URL relay HTTP na loopback. Produkcyjne URL relay powinny pozostać przy HTTPS.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanałów w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg przestarzałego gniazda w minutach. Utrzymuj wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji per kanał/konto w przesuwającym się oknie godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora kondycji przy zachowaniu globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się w trybie fail-closed (bez maskującego fallbacku zdalnego).
- `trustedProxies`: adresy IP reverse proxy, które terminują TLS albo wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback są nadal prawidłowe dla konfiguracji proxy/lokalnego wykrywania na tym samym hoście (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna allowlista CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzeń Node bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie powoduje to automatycznego zatwierdzania parowania operator/browser/Control UI/WebChat ani automatycznego zatwierdzania rozszerzeń roli, zakresu, metadanych lub klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń Node po parowaniu i ocenie allowlisty.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy deny HTTP.

</Accordion>

### Endpointy zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Utwardzanie wejść URL dla Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste allowlisty są traktowane jak nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek utwardzający odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla kontrolowanych przez siebie originów HTTPS; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Wygodne flagi: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

Zobacz [Multiple Gateways](/pl/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: włącza terminację TLS na listenerze Gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną parę samopodpisanego certyfikatu/klucza, gdy nie skonfigurowano jawnych plików; tylko do użycia lokalnego/deweloperskiego.
- `certPath`: ścieżka systemu plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka systemu plików do pliku prywatnego klucza TLS; utrzymuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do pakietu CA dla weryfikacji klienta albo niestandardowych łańcuchów zaufania.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: kontroluje sposób stosowania edycji konfiguracji w czasie działania.
  - `"off"`: ignoruj edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuj proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw spróbuj hot reload; jeśli potrzeba, przejdź do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu. Pomiń albo ustaw `0`, aby czekać bez końca i okresowo zapisywać ostrzeżenia o nadal oczekujących operacjach.

---

## Hooki

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` albo `x-openclaw-token: <token>`.
Tokeny hooków w query string są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **inne** niż `gateway.auth.token`; ponowne użycie tokena Gateway jest odrzucane.
- `hooks.path` nie może być `/`; używaj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` oraz `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tego opt-in.

**Endpointy:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` renderowane z szablonu w mapowaniach są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Szczegóły mapowania">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający działanie hooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki absolutne i traversal są odrzucane).
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do domyślnego.
- `allowedAgentIds`: ogranicza jawne routowanie (`*` albo pominięte = zezwalaj na wszystkie, `[]` = odmawiaj wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień hooków agenta bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` i kluczom sesji mapowań sterowanych szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna allowlista prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy jakiekolwiek mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja z Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to routowanie per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowały do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast domyślnej wartości szablonowej.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway automatycznie uruchamia `gog gmail watch serve` przy starcie, gdy jest skonfigurowane. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby to wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` równolegle z Gateway.

---

## Host Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Udostępnia edytowalne przez agenta HTML/CSS/JS i A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Wiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/trusted-proxy), tak samo jak inne powierzchnie HTTP Gateway.
- Node WebView zwykle nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu Node Gateway ogłasza URL możliwości o zakresie Node dla dostępu do canvas/A2UI.
- URL możliwości są związane z aktywną sesją Node WS i szybko wygasają. Fallback oparty na IP nie jest używany.
- Wstrzykuje klienta live reload do udostępnianego HTML.
- Automatycznie tworzy początkowy `index.html`, gdy katalog jest pusty.
- Udostępnia również A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu Gateway.
- Wyłącz live reload dla dużych katalogów lub przy błędach `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (domyślnie): pomija `cliPath` + `sshPort` z rekordów TXT.
- `full`: zawiera `cliPath` + `sshPort`.
- Nazwa hosta domyślnie to `openclaw`. Nadpisz przez `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD w `~/.openclaw/dns/`. Aby wykrywanie działało między sieciami, połącz z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (wbudowane zmienne env)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Wbudowane zmienne env są stosowane tylko wtedy, gdy w env procesu brakuje danego klucza.
- Pliki `.env`: `.env` z CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu login shell.
- Pełny priorytet znajdziesz w [Environment](/pl/help/environment).

### Podstawianie zmiennych env

Odwołuj się do zmiennych env w dowolnym ciągu konfiguracji przez `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd podczas ładowania konfiguracji.
- Użyj `$${VAR}`, aby uzyskać dosłowne `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości plaintext nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- wzorzec `id` dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` dla `source: "file"`: absolutny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec `id` dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` dla `source: "exec"` nie mogą zawierać segmentów ścieżki `.` ani `..` rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Kanoniczna macierz: [SecretRef Credential Surface](/pl/reference/secretref-credential-surface)
- `secrets apply` celuje w obsługiwane ścieżki poświadczeń w `openclaw.json`.
- Odwołania w `auth-profiles.json` są uwzględniane w rozwiązywaniu środowiska uruchomieniowego i pokryciu audytu.

### Konfiguracja dostawców sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Uwagi:

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Ścieżki dostawców file i exec kończą się w trybie fail-closed, gdy weryfikacja ACL Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie da się zweryfikować.
- Dostawca `exec` wymaga absolutnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby dopuścić ścieżki dowiązań symbolicznych przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, kontrola zaufanych katalogów dotyczy rozwiązanej ścieżki docelowej.
- Środowisko podrzędne `exec` jest domyślnie minimalne; wymagane zmienne przekazuj jawnie przez `passEnv`.
- Odwołania do sekretów są rozwiązywane w momencie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko tę migawkę.
- Podczas aktywacji stosowane jest filtrowanie aktywnej powierzchni: nierozwiązane odwołania na włączonych powierzchniach powodują błąd uruchomienia/przeładowania, podczas gdy nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Magazyn uwierzytelniania

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile per agent są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia środowiska uruchomieniowego pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie środowiska uruchomieniowego sekretów oraz narzędzia `audit/configure/apply`: [Secrets Management](/pl/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bazowy backoff w godzinach, gdy profil zawiedzie z powodu rzeczywistych
  błędów rozliczeń/niewystarczających środków (domyślnie: `5`). Jawny tekst o rozliczeniach może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstowe
  specyficzne dla dostawcy pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter
  `Key limit exceeded`). Komunikaty `402` dotyczące okna użycia lub
  limitu wydatków organizacji/workspace, które można ponowić, pozostają zamiast tego na ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania backoffu rozliczeń per dostawca.
- `billingMaxHours`: limit wzrostu wykładniczego backoffu rozliczeń w godzinach (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy backoff w minutach dla wysokiej pewności błędów `auth_permanent` (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit wzrostu backoffu `auth_permanent` w minutach (domyślnie: `60`).
- `failureWindowHours`: przesuwające się okno w godzinach używane dla liczników backoffu (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profilu uwierzytelniania w obrębie tego samego dostawcy dla błędów przeciążenia przed przejściem do fallbacku modelu (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowną próbą rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profilu uwierzytelniania w obrębie tego samego dostawcy dla błędów limitu szybkości przed przejściem do fallbacku modelu (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje teksty specyficzne dla dostawcy, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

---

## Logowanie

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Domyślny plik logów: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Ustaw `logging.file`, aby użyć stałej ścieżki.
- `consoleLevel` wzrasta do `debug`, gdy ustawiono `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku logów w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku.

---

## Diagnostyka

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: główny przełącznik wyjścia instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających ukierunkowane wyjście logów (obsługuje wildcardy, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku w ms dla emitowania ostrzeżeń o zablokowanej sesji, gdy sesja pozostaje w stanie przetwarzania.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [OpenTelemetry export](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne endpointy OTLP specyficzne dla sygnału. Gdy są ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) albo `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącza eksport trace, metrics lub logów.
- `otel.sampleRate`: współczynnik próbkowania trace `0`–`1`.
- `otel.flushIntervalMs`: okresowy interwał flush telemetrii w ms.
- `otel.captureContent`: opt-in dla przechwytywania surowej treści w atrybutach span OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje treść wiadomości/narzędzi niebędącą systemową; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` i `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszych eksperymentalnych atrybutów dostawcy span GenAI. Domyślnie spany zachowują starszy atrybut `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do Plugin, zachowując aktywne listenery diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne env endpointów specyficznych dla sygnału używane, gdy odpowiadający klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: zapisuje migawki śledzenia cache dla uruchomień osadzonych (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla cache trace JSONL (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu cache trace (wszystkie domyślnie: `true`).

---

## Aktualizacja

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kanał wydań dla instalacji npm/git — `"stable"`, `"beta"` lub `"dev"`.
- `checkOnStart`: sprawdzaj aktualizacje npm przy starcie Gateway (domyślnie: `true`).
- `auto.enabled`: włącza aktualizacje w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem kanału stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozproszenia wdrażania kanału stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są sprawdzenia kanału beta, w godzinach (domyślnie: `1`; maks.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć możliwości dispatch i spawn ACP).
- `dispatch.enabled`: niezależna bramka dla dispatch tury sesji ACP (domyślnie: `true`). Ustaw `false`, aby pozostawić polecenia ACP dostępne przy jednoczesnym blokowaniu wykonania.
- `backend`: identyfikator domyślnego backendu środowiska uruchomieniowego ACP (musi pasować do zarejestrowanego Plugin środowiska uruchomieniowego ACP).
  Jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Plugin backendu (na przykład `acpx`), inaczej bundled domyślny Plugin się nie załaduje.
- `defaultAgent`: zapasowy identyfikator docelowego agenta ACP, gdy uruchomienia spawn nie określają jawnego celu.
- `allowedAgents`: allowlista identyfikatorów agentów dozwolonych dla sesji środowiska uruchomieniowego ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno flush bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podzieleniem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: pomija powtarzające się wiersze statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do końcowych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych wierszy statusu/aktualizacji ACP.
- `stream.tagVisibility`: zapis nazw tagów do logicznych nadpisań widoczności dla zdarzeń strumieniowanych.
- `runtime.ttlMinutes`: bezczynny TTL w minutach dla workerów sesji ACP przed kwalifikacją do czyszczenia.
- `runtime.installCommand`: opcjonalne polecenie instalacji do uruchomienia podczas bootstrapowania środowiska uruchomieniowego ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kontroluje styl sloganu banera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są pokazywane).
- Aby ukryć cały baner (nie tylko slogany), ustaw env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadane zapisywane przez przepływy konfiguracji prowadzonej CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Tożsamość

Zobacz pola tożsamości `agents.list` w [Agent defaults](/pl/gateway/config-agents#agent-defaults).

---

## Bridge (starsze, usunięte)

Bieżące buildy nie zawierają już mostu TCP. Node łączą się przez Gateway WebSocket. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się błędem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja bridge (odniesienie historyczne)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: jak długo przechowywać ukończone sesje izolowanych uruchomień Cron przed usunięciem z `sessions.json`. Steruje też czyszczeniem zarchiwizowanych usuniętych transkryptów Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar na plik logu uruchomienia (`cron/runs/<jobId>.jsonl`) przed przycięciem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: liczba najnowszych wierszy zachowywanych przy uruchomieniu przycinania logu uruchomienia. Domyślnie: `2000`.
- `webhookToken`: token bearer używany przy dostarczaniu POST do Webhook Cron (`delivery.mode = "webhook"`); jeśli pominięty, żaden nagłówek auth nie jest wysyłany.
- `webhook`: wycofany starszy zapasowy URL Webhook (http/https) używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maksymalna liczba ponowień dla zadań jednorazowych przy błędach przejściowych (domyślnie: `3`; zakres: `0`–`10`).
- `backoffMs`: tablica opóźnień backoff w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1–10 wpisów).
- `retryOn`: typy błędów wyzwalające ponowienia — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać dla wszystkich typów przejściowych.

Dotyczy tylko jednorazowych zadań Cron. Zadania cykliczne używają oddzielnej obsługi błędów.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: włącza alerty o błędach dla zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych błędów przed wywołaniem alertu (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtórzonymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `mode`: tryb dostarczania — `"announce"` wysyła przez wiadomość kanału; `"webhook"` wysyła POST do skonfigurowanego Webhook.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający dostarczanie alertu.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Domyślny cel powiadomień o błędach Cron dla wszystkich zadań.
- `mode`: `"announce"` albo `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająco dużo danych celu.
- `channel`: nadpisanie kanału dla dostarczania announce. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce albo URL Webhook. Wymagane dla trybu webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` per zadanie nadpisuje tę globalną wartość domyślną.
- Gdy nie jest ustawiony ani globalny, ani per zadanie cel błędu, zadania, które już dostarczają przez `announce`, przy błędzie wracają do tego głównego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że główne `delivery.mode` zadania ma wartość `"webhook"`.

Zobacz [Cron Jobs](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [background tasks](/pl/automation/tasks).

---

## Zmienne szablonów modeli multimedialnych

Symbole zastępcze szablonów rozwijane w `tools.media.models[].args`:

| Zmienna           | Opis                                               |
| ----------------- | -------------------------------------------------- |
| `{{Body}}`         | Pełna treść wiadomości przychodzącej               |
| `{{RawBody}}`      | Surowa treść (bez opakowania historią/nadawcą)     |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi            |
| `{{From}}`         | Identyfikator nadawcy                              |
| `{{To}}`           | Identyfikator miejsca docelowego                   |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                    |
| `{{SessionId}}`    | UUID bieżącej sesji                                |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                 |
| `{{MediaUrl}}`     | Pseudo-URL mediów przychodzących                   |
| `{{MediaPath}}`    | Lokalna ścieżka mediów                             |
| `{{MediaType}}`    | Typ mediów (obraz/audio/dokument/…)                |
| `{{Transcript}}`   | Transkrypcja audio                                 |
| `{{Prompt}}`       | Rozwiązany prompt multimedialny dla wpisów CLI     |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` albo `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (best effort)                          |
| `{{GroupMembers}}` | Podgląd członków grupy (best effort)               |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (best effort)            |
| `{{SenderE164}}`   | Numer telefonu nadawcy (best effort)               |
| `{{Provider}}`     | Wskazówka dostawcy (whatsapp, telegram, discord itd.) |

---

## Include konfiguracji (`$include`)

Podziel konfigurację na wiele plików:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Zachowanie scalania:**

- Pojedynczy plik: zastępuje obiekt zawierający.
- Tablica plików: głęboko scalana w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze równorzędne: scalane po include'ach (nadpisują dołączone wartości).
- Zagnieżdżone include'y: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` od `openclaw.json`). Formy absolutne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy.
- Zapisy zarządzane przez OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu wspieraną przez include pojedynczego pliku, zapisują bezpośrednio do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Include'y główne, tablice include'ów i include'y z nadpisaniami kluczy równorzędnych są tylko do odczytu dla zapisów zarządzanych przez OpenClaw; takie zapisy kończą się w trybie fail-closed zamiast spłaszczać konfigurację.
- Błędy: czytelne komunikaty dla brakujących plików, błędów parsowania i cyklicznych include'ów.

---

_Powiązane: [Configuration](/pl/gateway/configuration) · [Configuration Examples](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Configuration](/pl/gateway/configuration)
- [Configuration examples](/pl/gateway/configuration-examples)
