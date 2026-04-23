---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu przez Tailnet bez tuneli SSH
summary: Przeglądarkowy interfejs Control UI dla Gateway (czat, Node, konfiguracja)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T10:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (przeglądarka)

Control UI to mała aplikacja jednostronicowa **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (albo [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Auth jest dostarczane podczas handshake WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty
przeglądarki i wybranego URL Gateway; hasła nie są utrwalane. Onboarding zwykle
generuje token Gateway dla auth współdzielonym sekretem przy pierwszym połączeniu, ale auth
hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki albo urządzenia, Gateway
wymaga **jednorazowego zatwierdzenia parowania** — nawet jeśli jesteś w tym samym Tailnet
z `gateway.auth.allowTailscale: true`. To środek bezpieczeństwa zapobiegający
nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

**Aby zatwierdzić urządzenie:**

```bash
# Pokaż oczekujące żądania
openclaw devices list

# Zatwierdź według ID żądania
openclaw devices approve <requestId>
```

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami auth (rola/zakresy/public
key), poprzednie oczekujące żądanie zostaje zastąpione i tworzone jest nowe `requestId`.
Uruchom ponownie `openclaw devices list` przed zatwierdzeniem.

Jeśli przeglądarka jest już sparowana i zmienisz ją z dostępu tylko do odczytu na
dostęp zapisu/admin, jest to traktowane jako rozszerzenie zatwierdzenia, a nie ciche
ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie aktywne, blokuje szersze ponowne połączenie
i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że
cofniesz je przez `openclaw devices revoke --device <id> --role <role>`. Zobacz
[Devices CLI](/pl/cli/devices), aby poznać rotację i cofanie tokenów.

**Uwagi:**

- Bezpośrednie lokalne połączenia przeglądarki przez loopback (`127.0.0.1` / `localhost`) są
  automatycznie zatwierdzane.
- Połączenia przez Tailnet i LAN nadal wymagają jawnego zatwierdzenia, nawet gdy
  pochodzą z tej samej maszyny.
- Każdy profil przeglądarki generuje unikalne ID urządzenia, więc zmiana przeglądarki albo
  wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje per-przeglądarkową tożsamość osobistą (nazwa wyświetlana i
awatar) dołączaną do wiadomości wychodzących na potrzeby atrybucji we współdzielonych sesjach. Jest
przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest
synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa w transkrypcie wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny albo
zmiana przeglądarki resetuje ją do pustej wartości.

## Endpoint konfiguracji runtime

Control UI pobiera ustawienia runtime z
`/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony przez to samo
auth Gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać,
a udane pobranie wymaga albo już prawidłowego tokena/hasła Gateway,
tożsamości Tailscale Serve, albo tożsamości trusted-proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym załadowaniu na podstawie ustawień regionalnych przeglądarki.
Aby później to nadpisać, otwórz **Overview -> Gateway Access -> Language**.
Selektor locale znajduje się na karcie Gateway Access, a nie w sekcji Appearance.

- Obsługiwane locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Tłumaczenia inne niż angielskie są lazy-loaded w przeglądarce.
- Wybrane locale jest zapisywane w pamięci przeglądarki i używane ponownie przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

## Co potrafi (obecnie)

- Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Strumieniowanie wywołań narzędzi + karty z wyjściem narzędzi na żywo w Chat (zdarzenia agenta)
- Kanały: wbudowane oraz bundlowane/zewnętrzne kanały Pluginów — status, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`)
- Instancje: lista obecności + odświeżanie (`system-presence`)
- Sesje: lista + nadpisania model/thinking/fast/verbose/trace/reasoning per sesja (`sessions.list`, `sessions.patch`)
- Dreams: status Dreaming, przełącznik włącz/wyłącz i czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`)
- Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`)
- Node: lista + możliwości (`node.list`)
- Exec approvals: edycja list dozwolonych Gateway albo Node + zapytanie o zasady dla `exec host=gateway/node` (`exec.approvals.*`)
- Config: podgląd/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: zastosowanie + restart z walidacją (`config.apply`) oraz wybudzenie ostatniej aktywnej sesji
- Zapisy konfiguracji zawierają ochronę base-hash, aby zapobiegać nadpisaniu równoległych edycji
- Zapisy konfiguracji (`config.set`/`config.apply`/`config.patch`) wykonują też preflight aktywnego rozwiązywania SecretRef dla odwołań w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane odwołania są odrzucane przed zapisem
- Schema konfiguracji + renderowanie formularzy (`config.schema` / `config.schema.lookup`,
  w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania
  bezpośrednich dzieci, metadane docs na zagnieżdżonych węzłach object/wildcard/array/composition,
  plus schematy Pluginów i kanałów, gdy są dostępne); edytor Raw JSON jest
  dostępny tylko wtedy, gdy migawka ma bezpieczny round-trip raw
- Jeśli migawki nie da się bezpiecznie odtworzyć w round-trip raw text, Control UI wymusza tryb Form i wyłącza tryb Raw dla tej migawki
- W edytorze Raw JSON opcja „Reset to saved” zachowuje kształt napisany w raw (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść round-trip
- Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiegać przypadkowemu uszkodzeniu typu object-to-string
- Debug: migawki status/health/models + log zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`)
- Logi: podgląd na żywo logów plikowych Gateway z filtrowaniem/eksportem (`logs.tail`)
- Update: uruchomienie aktualizacji pakietu/gita + restart (`update.run`) z raportem restartu

Uwagi do panelu zadań Cron:

- Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na none, jeśli chcesz uruchomień tylko wewnętrznych.
- Pola channel/target pojawiają się po wybraniu announce.
- Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL Webhook HTTP(S).
- Dla zadań głównej sesji dostępne są tryby dostarczania webhook i none.
- Zaawansowane kontrolki edycji obejmują delete-after-run, czyszczenie nadpisania agenta, opcje cron exact/stagger,
  nadpisania agent model/thinking oraz przełączniki best-effort dostarczania.
- Walidacja formularza działa inline z błędami per pole; nieprawidłowe wartości wyłączają przycisk zapisu, dopóki problem nie zostanie naprawiony.
- Ustaw `cron.webhookToken`, aby wysyłać dedykowany bearer token; jeśli pole jest pominięte, webhook jest wysyłany bez nagłówka auth.
- Przestarzała ścieżka zapasowa: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

## Zachowanie czatu

- `chat.send` jest **nieblokujące**: natychmiast zwraca ack z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
- Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
- Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkryptu są zbyt duże, Gateway może przycinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
- `chat.history` usuwa też z widocznego tekstu asystenta tagi dyrektyw tylko do wyświetlania (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłe tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), wyciekłe tokeny sterujące modelu ASCII/full-width i pomija wpisy asystenta, których cały widoczny tekst to dokładnie cichy token `NO_REPLY` / `no_reply`.
- `chat.inject` dopisuje notatkę asystenta do transkryptu sesji i rozsyła zdarzenie `chat` na potrzeby aktualizacji tylko w UI (bez uruchomienia agenta, bez dostarczania do kanału).
- Selektory modelu i thinking w nagłówku czatu natychmiast modyfikują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysłania tylko na jedną turę.
- Zatrzymanie:
  - kliknij **Stop** (wywołuje `chat.abort`)
  - wpisz `/stop` (albo samodzielne frazy przerywające, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem
  - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji
- Zachowanie częściowego wyniku po przerwaniu:
  - gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI
  - Gateway zapisuje częściowy tekst asystenta do historii transkryptu po przerwaniu, gdy istnieje zbuforowane wyjście
  - zapisane wpisy zawierają metadane przerwania, aby konsumenci transkryptu mogli odróżniać częściowe wyniki po przerwaniu od normalnie ukończonych wyników

## Osadzenia hostowane

Wiadomości asystenta mogą renderować hostowane treści webowe inline przez shortcode `[embed ...]`.
Zasady sandbox iframe są kontrolowane przez
`gateway.controlUi.embedSandbox`:

- `strict`: wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń
- `scripts`: pozwala na interaktywne osadzenia przy zachowaniu izolacji origin; to
  wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych
- `trusted`: dodaje `allow-same-origin` do `allow-scripts` dla dokumentów z tej samej witryny,
  które celowo potrzebują silniejszych uprawnień

Przykład:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Używaj `trusted` tylko wtedy, gdy osadzony dokument naprawdę potrzebuje zachowania
same-origin. Dla większości generowanych przez agenta gier i interaktywnych canvasów `scripts` to
bezpieczniejszy wybór.

Bezwzględne zewnętrzne URL-e osadzeń `http(s)` pozostają domyślnie zablokowane. Jeśli
celowo chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp przez Tailnet (zalecane)

### Zintegrowany Tailscale Serve (preferowane)

Pozostaw Gateway na loopback i pozwól, aby Tailscale Serve proxy'owało je przez HTTPS:

```bash
openclaw gateway --tailscale serve
```

Otwórz:

- `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

Domyślnie żądania Serve do Control UI/WebSocket mogą uwierzytelniać się przez nagłówki tożsamości Tailscale
(`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw
weryfikuje tożsamość przez rozwiązanie adresu `x-forwarded-for` poleceniem
`tailscale whois` i dopasowanie go do nagłówka, i akceptuje je tylko wtedy, gdy
żądanie trafia w loopback z nagłówkami `x-forwarded-*` Tailscale. Ustaw
`gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych współdzielonych sekretów
nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo
`"password"`.
Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby auth dla tego samego IP klienta
i zakresu auth są serializowane przed zapisami limitera. Równoległe błędne ponowne próby
z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu
zamiast dwóch zwykłych niedopasowań ścigających się równolegle.
Auth Serve bez tokena zakłada, że host Gateway jest zaufany. Jeśli na tym hoście
może działać niezaufany lokalny kod, wymagaj auth tokenem/hasłem.

### Powiązanie z tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Następnie otwórz:

- `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

Wklej pasujący współdzielony sekret do ustawień UI (wysyłany jako
`connect.params.auth.token` albo `connect.params.auth.password`).

## Niezabezpieczony HTTP

Jeśli otwierasz dashboard przez zwykłe HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`),
przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie
OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niezabezpieczonym HTTP tylko dla localhost przy `gateway.controlUi.allowInsecureAuth=true`
- udane auth operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana naprawa:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

**Zachowanie przełącznika insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` to tylko lokalny przełącznik zgodności:

- Pozwala sesjom localhost Control UI przechodzić bez tożsamości urządzenia w
  niezabezpieczonych kontekstach HTTP.
- Nie omija kontroli parowania.
- Nie rozluźnia wymagań tożsamości urządzenia dla połączeń zdalnych (nie-localhost).

**Tylko awaryjnie:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia dla Control UI i jest
poważnym obniżeniem bezpieczeństwa. Cofnij to ustawienie jak najszybciej po użyciu awaryjnym.

Uwaga dotycząca trusted-proxy:

- udane auth trusted-proxy może dopuścić sesje operatora Control UI **operator**
  bez tożsamości urządzenia
- to **nie** rozszerza się na sesje Control UI z rolą Node
- reverse proxy loopback na tym samym hoście nadal nie spełniają auth trusted-proxy; zobacz
  [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki konfiguracji HTTPS.

## Content Security Policy

Control UI jest dostarczane z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin** i URL-e `data:`. Zdalne URL-e `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie wykonują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują.
- Inline URL-e `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Zdalne URL-e awatarów emitowane przez metadane kanałów są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty albo złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie jest konfigurowalne.

## Auth trasy awatarów

Gdy skonfigurowane jest auth Gateway, endpoint awatarów Control UI wymaga tego samego tokena Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej zasady.
- Nieuwierzytelnione żądania do obu tras są odrzucane (zgodnie z pokrewną trasą assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatarów na hostach, które są w inny sposób chronione.
- Samo Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL-i blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz auth Gateway (co nie jest zalecane na współdzielonych hostach), trasa awatarów również stanie się nieuwierzytelniona, zgodnie z resztą Gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je przez:

```bash
pnpm ui:build
```

Opcjonalna ścieżka bazowa bezwzględna (gdy chcesz mieć stałe URL-e zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Dla lokalnego developmentu (oddzielny serwer developerski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WS Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer developerski + zdalne Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może
różnić się od origin HTTP. Jest to przydatne, gdy chcesz używać lokalnie serwera developerskiego Vite,
ale Gateway działa gdzie indziej.

1. Uruchom serwer developerski UI: `pnpm ui:dev`
2. Otwórz URL taki jak:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Opcjonalne jednorazowe auth (jeśli potrzebne):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Uwagi:

- `gatewayUrl` jest zapisywany do localStorage po załadowaniu i usuwany z URL.
- `token` powinien być przekazywany przez fragment URL (`#token=...`) zawsze, gdy to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekowi do logów żądań i Referer. Starsze parametry zapytania `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko jako ścieżka zapasowa, i są natychmiast usuwane po bootstrapie.
- `password` jest przechowywane tylko w pamięci.
- Gdy ustawiono `gatewayUrl`, UI nie wraca zapasowo do poświadczeń z konfiguracji ani środowiska.
  Podaj jawnie `token` (albo `password`). Brak jawnych poświadczeń jest błędem.
- Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
- `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie w osadzeniu), aby zapobiegać clickjackingowi.
- Wdrożenia Control UI spoza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins`
  (pełne origin). Dotyczy to także zdalnych konfiguracji developerskich.
- Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym
  testowaniem lokalnym. Oznacza to „pozwól dowolnemu origin przeglądarki”, a nie „dopasuj dowolny host, którego
  używam”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb zapasowego origin z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

Przykład:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Szczegóły konfiguracji dostępu zdalnego: [Remote access](/pl/gateway/remote).

## Powiązane

- [Dashboard](/pl/web/dashboard) — dashboard Gateway
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [Health Checks](/pl/gateway/health) — monitorowanie kondycji Gateway
