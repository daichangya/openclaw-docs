---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp przez Tailnet bez tuneli SSH
summary: Oparte na przeglądarce Control UI dla Gateway (czat, Node, konfiguracja)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI to mała aplikacja jednostronicowa **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (na przykład `/openclaw`)

Komunikuje się **bezpośrednio z WebSocket Gateway** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest dostarczane podczas handshaku WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty przeglądarki
i wybrany URL Gateway; hasła nie są utrwalane. Onboarding zwykle
generuje token Gateway dla uwierzytelniania wspólnym sekretem przy pierwszym połączeniu,
ale uwierzytelnianie hasłem również działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway
wymaga **jednorazowego zatwierdzenia parowania** — nawet jeśli jesteś w tym samym Tailnet
z `gateway.auth.allowTailscale: true`. Jest to środek bezpieczeństwa zapobiegający
nieautoryzowanemu dostępowi.

**Co zobaczysz:** "disconnected (1008): pairing required"

**Aby zatwierdzić urządzenie:**

```bash
# Wyświetl oczekujące żądania
openclaw devices list

# Zatwierdź według identyfikatora żądania
openclaw devices approve <requestId>
```

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz
publiczny), poprzednie oczekujące żądanie zostanie zastąpione i utworzony zostanie nowy `requestId`.
Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz ją z dostępu tylko do odczytu na
dostęp do zapisu/admina, jest to traktowane jako podniesienie zatwierdzenia, a nie ciche
ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie aktywne, blokuje szersze ponowne połączenie
i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagało ponownego zatwierdzenia, chyba że
cofniesz je przez `openclaw devices revoke --device <id> --role <role>`. Zobacz
[CLI urządzeń](/pl/cli/devices), aby poznać rotację tokenów i cofanie.

**Uwagi:**

- Bezpośrednie lokalne połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są
  zatwierdzane automatycznie.
- Połączenia przeglądarki przez Tailnet i LAN nadal wymagają jawnego zatwierdzenia, nawet gdy
  pochodzą z tej samej maszyny.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub
  wyczyszczenie danych przeglądarki będzie wymagać ponownego sparowania.

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwa wyświetlana i
awatar) dołączaną do wychodzących wiadomości na potrzeby atrybucji we współdzielonych sesjach. Jest
przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest
synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi
autorstwa w transkrypcie wiadomości, które faktycznie wyślesz. Wyczyszczenie danych witryny lub
zmiana przeglądarki resetuje ją do pustej wartości.

## Endpoint konfiguracji runtime

Control UI pobiera ustawienia runtime z
`/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym
uwierzytelnianiem Gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go
pobrać, a pomyślne pobranie wymaga już ważnego tokenu/hasła Gateway,
tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym wczytaniu na podstawie ustawień regionalnych przeglądarki.
Aby później to zmienić, otwórz **Overview -> Gateway Access -> Language**. Selektor
języka znajduje się na karcie Gateway Access, a nie w sekcji Appearance.

- Obsługiwane locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane locale jest zapisywane w pamięci przeglądarki i używane ponownie przy kolejnych wizytach.
- Brakujące klucze tłumaczeń przechodzą awaryjnie na angielski.

## Co potrafi dziś

- Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Rozmowa bezpośrednio z OpenAI Realtime z poziomu przeglądarki przez WebRTC. Gateway
  wystawia krótkotrwały sekret klienta Realtime przez `talk.realtime.session`; przeglądarka
  wysyła dźwięk z mikrofonu bezpośrednio do OpenAI i przekazuje wywołania narzędzia
  `openclaw_agent_consult` z powrotem przez `chat.send` do większego
  skonfigurowanego modelu OpenClaw.
- Strumieniowanie wywołań narzędzi + kart z danymi wyjściowymi narzędzi na żywo w Czat (zdarzenia agenta)
- Kanały: status wbudowanych oraz wbudowanych/zewnętrznych kanałów Pluginów, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`)
- Instancje: lista obecności + odświeżanie (`system-presence`)
- Sesje: lista + nadpisania modelu/myślenia/fast/verbose/trace/reasoning dla sesji (`sessions.list`, `sessions.patch`)
- Dreams: status Dreaming, przełącznik włącz/wyłącz i czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Zadania Cron: listowanie/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`)
- Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`)
- Node: lista + możliwości (`node.list`)
- Zatwierdzenia exec: edycja allowlist Gateway lub Node + polityka ask dla `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguracja: podgląd/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Konfiguracja: zastosowanie + restart z walidacją (`config.apply`) oraz wybudzenie ostatniej aktywnej sesji
- Zapisy konfiguracji zawierają ochronę base-hash, aby zapobiec nadpisaniu równoległych zmian
- Zapisy konfiguracji (`config.set`/`config.apply`/`config.patch`) wykonują też preflight aktywnego rozpoznawania SecretRef dla odwołań w przesłanym ładunku konfiguracji; nierozpoznane aktywne przesłane odwołania są odrzucane przed zapisem
- Schemat konfiguracji + renderowanie formularza (`config.schema` / `config.schema.lookup`,
  w tym pola `title` / `description`, dopasowane wskazówki interfejsu, podsumowania
  bezpośrednich elementów podrzędnych, metadane dokumentacji na zagnieżdżonych węzłach obiektu/wildcard/tablicy/kompozycji,
  a także schematy Pluginów + kanałów, gdy są dostępne); edytor Raw JSON jest
  dostępny tylko wtedy, gdy snapshot ma bezpieczny round-trip raw
- Jeśli snapshot nie może bezpiecznie wykonać round-trip surowego tekstu, Control UI wymusza tryb Form i wyłącza tryb Raw dla tego snapshotu
- Edytor Raw JSON z opcją „Reset to saved” zachowuje kształt utworzony w raw (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczony snapshot, dzięki czemu zewnętrzne edycje przetrwają reset, gdy snapshot może bezpiecznie wykonać round-trip
- Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu obiektu przez konwersję na string
- Debugowanie: snapshoty status/health/models + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`)
- Logi: live tail logów plikowych Gateway z filtrowaniem/eksportem (`logs.tail`)
- Aktualizacja: uruchomienie aktualizacji pakietu/git + restart (`update.run`) z raportem restartu

Uwagi dotyczące panelu zadań Cron:

- Dla zadań izolowanych dostarczanie domyślnie ma formę ogłaszania podsumowania. Możesz przełączyć na none, jeśli chcesz tylko uruchomienia wewnętrzne.
- Pola kanału/celu pojawiają się po wybraniu announce.
- Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL Webhook HTTP(S).
- Dla zadań głównej sesji dostępne są tryby dostarczania webhook i none.
- Zaawansowane kontrolki edycji obejmują delete-after-run, clear agent override, opcje dokładnego/stagger Cron,
  nadpisania modelu/myślenia agenta oraz przełączniki best-effort delivery.
- Walidacja formularza jest wykonywana inline z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu, dopóki nie zostaną poprawione.
- Ustaw `cron.webhookToken`, aby wysyłać dedykowany bearer token; jeśli jest pominięty, Webhook jest wysyłany bez nagłówka auth.
- Przestarzały fallback: zapisane starsze zadania z `notify: true` mogą nadal używać `cron.webhook`, dopóki nie zostaną zmigrowane.

## Zachowanie czatu

- `chat.send` jest **nieblokujące**: natychmiast potwierdza `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
- Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania i `{ status: "ok" }` po zakończeniu.
- Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa interfejsu. Gdy wpisy transkryptu są zbyt duże, Gateway może przycinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
- Wygenerowane przez asystenta obrazy są utrwalane jako zarządzane odwołania do multimediów i zwracane przez uwierzytelnione URL-e mediów Gateway, więc ponowne wczytanie nie zależy od tego, czy surowe ładunki obrazów base64 pozostaną w odpowiedzi historii czatu.
- `chat.history` usuwa także z widocznego tekstu asystenta tagi dyrektyw tylko do wyświetlania (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelu ASCII/full-width, i pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym tokenem `NO_REPLY` / `no_reply`.
- Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje lokalne
  optymistyczne wiadomości użytkownika/asystenta widoczne, jeśli `chat.history` chwilowo zwraca
  starszy snapshot; kanoniczny transkrypt zastępuje te lokalne wiadomości, gdy
  historia Gateway nadrobi zaległość.
- `chat.inject` dopisuje notatkę asystenta do transkryptu sesji i rozsyła zdarzenie `chat` do aktualizacji tylko w UI (bez uruchamiania agenta, bez dostarczania do kanału).
- Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko dla jednej tury.
- Gdy świeże raporty użycia sesji Gateway pokazują wysokie ciśnienie kontekstu, obszar
  kompozytora czatu pokazuje powiadomienie o kontekście i przy zalecanych poziomach Compaction przycisk
  compact, który uruchamia normalną ścieżkę Compaction sesji. Nieaktualne
  snapshoty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.
- Tryb Talk używa zarejestrowanego dostawcy głosu realtime, który obsługuje sesje WebRTC w przeglądarce. Skonfiguruj OpenAI z `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, albo użyj ponownie konfiguracji dostawcy realtime Voice Call.
  Przeglądarka nigdy nie otrzymuje standardowego klucza OpenAI API; otrzymuje
  tylko efemeryczny sekret klienta Realtime. Głos realtime Google Live jest
  obsługiwany dla backendowego mostu Voice Call i Google Meet, ale jeszcze nie dla tej ścieżki
  WebRTC w przeglądarce. Prompt sesji Realtime jest składany przez Gateway;
  `talk.realtime.session` nie przyjmuje nadpisań instrukcji dostarczonych przez wywołującego.
- W kompozytorze czatu kontrolka Talk to przycisk fal obok
  przycisku dyktowania mikrofonem. Po uruchomieniu Talk wiersz statusu kompozytora pokazuje
  `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo
  `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje skonfigurowany
  większy model przez `chat.send`.
- Zatrzymywanie:
  - Kliknij **Stop** (wywołuje `chat.abort`)
  - Gdy uruchomienie jest aktywne, zwykłe wiadomości uzupełniające są kolejkowane. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć to uzupełnienie do trwającej tury.
  - Wpisz `/stop` (lub samodzielne frazy przerywania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać out-of-band
  - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`) do przerywania wszystkich aktywnych uruchomień dla tej sesji
- Zachowanie częściowego zachowania po przerwaniu:
  - Po przerwaniu uruchomienia częściowy tekst asystenta może nadal być pokazywany w UI
  - Gateway utrwala częściowy tekst asystenta po przerwaniu w historii transkryptu, gdy istnieje zbuforowane wyjście
  - Utrwalone wpisy zawierają metadane przerwania, dzięki czemu odbiorcy transkryptu mogą odróżnić częściowe wpisy po przerwaniu od normalnie zakończonego wyjścia

## Instalacja PWA i web push

Control UI jest dostarczane z `manifest.webmanifest` i service workerem, więc
nowoczesne przeglądarki mogą zainstalować je jako samodzielną PWA. Web Push pozwala
Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub
okno przeglądarki nie jest otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się dostępna. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone endpointy subskrypcji przeglądarek.                      |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy
chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub
testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresami do rejestrowania i
testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` wraz z `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła testowe powiadomienie do subskrypcji wywołującego.

Web Push jest niezależny od ścieżki przekaźnika iOS APNS
(zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać push oparty na relay)
oraz od istniejącej metody `push.test`, które są przeznaczone dla natywnego
parowania mobilnego.

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną treść internetową inline przez shortcode `[embed ...]`.
Polityka sandbox iframe jest kontrolowana przez
`gateway.controlUi.embedSandbox`:

- `strict`: wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń
- `scripts`: pozwala na interaktywne osadzenia przy zachowaniu izolacji origin; to
  ustawienie domyślne i zwykle wystarcza dla samowystarczalnych gier/widgetów przeglądarkowych
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

Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje
zachowania same-origin. Dla większości generowanych przez agenta gier i interaktywnych canvasów `scripts`
jest bezpieczniejszym wyborem.

Bezwzględne zewnętrzne URL-e osadzeń `http(s)` nadal są domyślnie blokowane. Jeśli
celowo chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp Tailnet (zalecane)

### Zintegrowany Tailscale Serve (preferowane)

Pozostaw Gateway na local loopback i pozwól, aby Tailscale Serve proxował go przez HTTPS:

```bash
openclaw gateway --tailscale serve
```

Otwórz:

- `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale
(`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw
weryfikuje tożsamość, rozpoznając adres `x-forwarded-for` przez
`tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy
żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. Ustaw
`gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń wspólnego sekretu
nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub
`"password"`.
Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelniania dla tego samego adresu IP klienta
i zakresu auth są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki
mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.
Uwierzytelnianie Serve bez tokenu zakłada, że host Gateway jest zaufany. Jeśli na tym hoście może działać niezaufany lokalny kod, wymagaj uwierzytelniania tokenem/hasłem.

### Powiązanie z tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Następnie otwórz:

- `http://<tailscale-ip>:18789/` (lub skonfigurowane `gateway.controlUi.basePath`)

Wklej pasujący wspólny sekret do ustawień interfejsu (wysyłany jako
`connect.params.auth.token` lub `connect.params.auth.password`).

## Niezabezpieczony HTTP

Jeśli otworzysz dashboard przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`),
przeglądarka działa w **niebezpiecznym kontekście** i blokuje WebCrypto. Domyślnie
OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niezabezpieczonym HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecane rozwiązanie:** użyj HTTPS (Tailscale Serve) albo otwórz interfejs lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

**Zachowanie przełącznika allowInsecureAuth:**

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

- Pozwala sesjom localhost Control UI działać bez tożsamości urządzenia w
  niebezpiecznych kontekstach HTTP.
- Nie omija kontroli parowania.
- Nie łagodzi wymagań tożsamości urządzenia dla połączeń zdalnych (nie-localhost).

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

`dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i jest
poważnym obniżeniem bezpieczeństwa. Po użyciu awaryjnym szybko przywróć poprzednie ustawienie.

Uwaga dotycząca zaufanego proxy:

- pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje operatora Control UI bez
  tożsamości urządzenia
- to **nie** dotyczy sesji Control UI z rolą node
- reverse proxy same-host loopback nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz
  [Uwierzytelnianie trusted proxy](/pl/gateway/trusted-proxy-auth)

Zobacz [Tailscale](/pl/gateway/tailscale), aby poznać wskazówki dotyczące konfiguracji HTTPS.

## Content Security Policy

Control UI jest dostarczane z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, URL-e `data:` oraz lokalnie generowane URL-e `blob:`. Zdalne URL-e obrazów `http(s)` i URL-e względne do protokołu są odrzucane przez przeglądarkę i nie powodują żadnych pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal są renderowane, w tym uwierzytelnione ścieżki awatarów, które interfejs pobiera i konwertuje na lokalne URL-e `blob:`.
- Inline URL-e `data:image/...` nadal są renderowane (przydatne dla ładunków w ramach protokołu).
- Lokalne URL-e `blob:` tworzone przez Control UI nadal są renderowane.
- Zdalne URL-e awatarów emitowane przez metadane kanałów są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/identyfikatorem, więc przejęty lub złośliwy kanał nie może wymusić arbitralnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie ścieżki awatara

Gdy skonfigurowane jest uwierzytelnianie Gateway, endpoint awatarów Control UI wymaga tego samego tokenu Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do obu ścieżek są odrzucane (zgodnie z siostrzaną ścieżką assistant-media). Zapobiega to ujawnianiu tożsamości agenta przez ścieżkę awatara na hostach, które są poza tym chronione.
- Samo Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL-i blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na hostach współdzielonych), ścieżka awatara także stanie się nieuwierzytelniona, zgodnie z resztą Gateway.

## Budowanie interfejsu

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałe URL-e zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj interfejs na adres Gateway WS (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może być
inny niż origin HTTP. Jest to przydatne, gdy chcesz mieć lokalnie serwer deweloperski Vite,
ale Gateway działa gdzie indziej.

1. Uruchom serwer deweloperski interfejsu: `pnpm ui:dev`
2. Otwórz URL taki jak:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Uwagi:

- `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z URL.
- `token` powinien być przekazywany przez fragment URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom do logów żądań i Referer. Starsze parametry zapytania `?token=` nadal są jednorazowo importowane dla zgodności, ale tylko jako fallback, i są natychmiast usuwane po bootstrapie.
- `password` jest przechowywane tylko w pamięci.
- Gdy `gatewayUrl` jest ustawione, interfejs nie przechodzi awaryjnie do poświadczeń z konfiguracji ani środowiska.
  Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
- Używaj `wss://`, gdy Gateway działa za TLS (Tailscale Serve, proxy HTTPS itd.).
- `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
- Wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins`
  (pełne originy). Dotyczy to także zdalnych konfiguracji deweloperskich.
- Nie używaj `gateway.controlUi.allowedOrigins: ["*"]`, chyba że do ściśle kontrolowanych
  testów lokalnych. Oznacza to pozwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host,
  którego używam”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallback origin oparty na nagłówku Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

Szczegóły konfiguracji zdalnego dostępu: [Dostęp zdalny](/pl/gateway/remote).

## Powiązane

- [Dashboard](/pl/web/dashboard) — dashboard gateway
- [WebChat](/pl/web/webchat) — oparty na przeglądarce interfejs czatu
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [Kontrole stanu](/pl/gateway/health) — monitorowanie stanu gateway
