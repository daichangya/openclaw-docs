---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
summary: Konfiguracja bota Mattermost i konfiguracja OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T09:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: dołączony Plugin (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości DM.
Mattermost to platforma do komunikacji zespołowej, którą można hostować samodzielnie; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie
[mattermost.com](https://mattermost.com).

## Dołączony Plugin

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Mattermost,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Mattermost jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto bota Mattermost i skopiuj **token bota**.
3. Skopiuj **bazowy URL** Mattermost (na przykład `https://chat.example.com`).
4. Skonfiguruj OpenClaw i uruchom Gateway.

Minimalna konfiguracja:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Natywne polecenia slash

Natywne polecenia slash są opcjonalne. Gdy są włączone, OpenClaw rejestruje polecenia slash `oc_*` przez
API Mattermost i odbiera callbacki POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może połączyć się z Gateway bezpośrednio (reverse proxy/publiczny URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Uwagi:

- `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
- Jeśli pominięto `callbackUrl`, OpenClaw wyprowadza go z hosta/portu Gateway + `callbackPath`.
- W konfiguracjach wielokontowych `commands` można ustawić na poziomie głównym albo w
  `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola z poziomu głównego).
- Callbacki poleceń są walidowane za pomocą tokenów per polecenie zwracanych przez
  Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
- Callbacki slash domyślnie kończą się niepowodzeniem, jeśli rejestracja się nie powiodła, uruchomienie było częściowe lub
  token callbacku nie pasuje do jednego z zarejestrowanych poleceń.
- Wymaganie osiągalności: endpoint callbacku musi być osiągalny z serwera Mattermost.
  - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw.
  - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL przekierowuje reverse proxy `/api/channels/mattermost/command` do OpenClaw.
  - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.
- Wymaganie dotyczące listy dozwolonego ruchu wychodzącego Mattermost:
  - Jeśli callback wskazuje na prywatne/tailnet/wewnętrzne adresy, ustaw w Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, aby zawierało host/domenę callbacku.
  - Używaj wpisów hosta/domeny, a nie pełnych URL-i.
    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście Gateway, jeśli wolisz używać zmiennych środowiskowych:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Zmienne środowiskowe dotyczą tylko konta **domyślnego** (`default`). Pozostałe konta muszą używać wartości konfiguracyjnych.

Nie można ustawić `MATTERMOST_URL` z poziomu workspace `.env`; zobacz [pliki `.env` workspace](/pl/gateway/security).

## Tryby czatu

Mattermost automatycznie odpowiada na wiadomości DM. Zachowanie na kanałach jest kontrolowane przez `chatmode`:

- `oncall` (domyślnie): odpowiada tylko po wzmiance @ na kanałach.
- `onmessage`: odpowiada na każdą wiadomość na kanale.
- `onchar`: odpowiada, gdy wiadomość zaczyna się od prefiksu wyzwalacza.

Przykład konfiguracji:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Uwagi:

- `onchar` nadal odpowiada na jawne wzmianki @.
- `channels.mattermost.requireMention` jest honorowane w starszych konfiguracjach, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby określić, czy odpowiedzi na kanałach i w grupach mają pozostać w
głównym kanale, czy rozpoczynać wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiada w wątku tylko wtedy, gdy przychodzący post już się w nim znajduje.
- `first`: dla postów najwyższego poziomu na kanałach/w grupach rozpoczyna wątek pod tym postem i kieruje
  rozmowę do sesji w zakresie wątku.
- `all`: obecnie w Mattermost zachowuje się tak samo jak `first`.
- Wiadomości bezpośrednie ignorują to ustawienie i pozostają bez wątków.

Przykład konfiguracji:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Uwagi:

- Sesje w zakresie wątku używają identyfikatora postu wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma już korzeń wątku,
  kolejne fragmenty i multimedia pozostają w tym samym wątku.

## Kontrola dostępu (DM)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości DM: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (ograniczone wzmianką).
- Dodaj nadawców do listy dozwolonych przez `channels.mattermost.groupAllowFrom` (zalecane identyfikatory użytkowników).
- Nadpisania wzmianki per kanał znajdują się w `channels.mattermost.groups.<channelId>.requireMention`
  lub w `channels.mattermost.groups["*"].requireMention` jako ustawienie domyślne.
- Dopasowanie `@username` jest zmienne i włączane tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (ograniczone wzmianką).
- Uwaga środowiska wykonawczego: jeśli `channels.mattermost` całkowicie nie istnieje, środowisko wykonawcze wraca do `groupPolicy="allowlist"` dla sprawdzeń grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Przykład:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Cele dostarczania wychodzącego

Używaj tych formatów celu z `openclaw message send` albo z Cron/Webhooks:

- `channel:<id>` dla kanału
- `user:<id>` dla wiadomości DM
- `@username` dla wiadomości DM (rozwiązywane przez API Mattermost)

Surowe nieprzezroczyste identyfikatory (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (identyfikator użytkownika lub kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` powiedzie się), OpenClaw wysyła **DM**, rozwiązując kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **identyfikator kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).

## Ponawianie kanału DM

Gdy OpenClaw wysyła do celu DM Mattermost i musi najpierw rozwiązać kanał bezpośredni,
domyślnie ponawia przejściowe niepowodzenia tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby globalnie dostroić to zachowanie dla Plugin Mattermost,
albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Uwagi:

- Dotyczy to tylko tworzenia kanału DM (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub przekroczenia limitu czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Strumieniowanie podglądu

Mattermost strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego **posta podglądu wersji roboczej**, który jest finalizowany w tym samym miejscu, gdy końcowa odpowiedź może zostać bezpiecznie wysłana. Podgląd jest aktualizowany na tym samym identyfikatorze posta zamiast zaśmiecać kanał wiadomościami dla każdego fragmentu. Końcowe multimedia/błędy anulują oczekujące edycje podglądu i używają zwykłego dostarczenia zamiast opróżniania jednorazowego posta podglądu.

Włącz przez `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Uwagi:

- `partial` to zwykle najlepszy wybór: jeden post podglądu, który jest edytowany w miarę rozrastania się odpowiedzi, a następnie finalizowany pełną odpowiedzią.
- `block` używa fragmentów wersji roboczej dopisywanych wewnątrz posta podglądu.
- `progress` pokazuje podgląd stanu podczas generowania i publikuje końcową odpowiedź dopiero po zakończeniu.
- `off` wyłącza strumieniowanie podglądu.
- Jeśli strumienia nie da się sfinalizować w tym samym miejscu (na przykład post został usunięty w trakcie strumieniowania), OpenClaw przechodzi awaryjnie do wysłania nowego końcowego posta, więc odpowiedź nigdy nie zostanie utracona.
- Ładunki zawierające wyłącznie rozumowanie są pomijane w postach kanałowych, w tym tekst przychodzący jako cytat blokowy `> Reasoning:`. Ustaw `/reasoning on`, aby widzieć myślenie na innych powierzchniach; końcowy post Mattermost zawiera tylko odpowiedź.
- Zobacz [Streaming](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator posta Mattermost.
- `emoji` akceptuje nazwy takie jak `thumbsup` albo `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (boolean), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do skierowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącza/wyłącza akcje reakcji (domyślnie true).
- Nadpisanie per konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktywne przyciski (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzyma
wybór i będzie mógł odpowiedzieć.

Włącz przyciski, dodając `inlineButtons` do możliwości kanału:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Użyj `message action=send` z parametrem `buttons`. Przyciski to tablica 2D (wiersze przycisków):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Pola przycisku:

- `text` (wymagane): etykieta wyświetlana.
- `callback_data` (wymagane): wartość odsyłana po kliknięciu (używana jako identyfikator akcji).
- `style` (opcjonalne): `"default"`, `"primary"` lub `"danger"`.

Gdy użytkownik kliknie przycisk:

1. Wszystkie przyciski są zastępowane wierszem potwierdzenia (na przykład „✓ **Yes** selected by @user”).
2. Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.

Uwagi:

- Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez potrzeby konfiguracji).
- Mattermost usuwa dane callbacku ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc wszystkie przyciski
  są usuwane po kliknięciu — częściowe usunięcie nie jest możliwe.
- Identyfikatory akcji zawierające łączniki lub podkreślenia są automatycznie sanityzowane
  (ograniczenie routingu Mattermost).

Konfiguracja:

- `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby
  włączyć opis narzędzia przycisków w systemowym promptcie agenta.
- `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla
  callbacków przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może
  połączyć się z Gateway bezpośrednio pod jego hostem powiązania.
- W konfiguracjach wielokontowych możesz też ustawić to samo pole w
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jeśli pominięto `interactions.callbackBaseUrl`, OpenClaw wyprowadza URL callbacku z
  `gateway.customBindHost` + `gateway.port`, a następnie wraca do `http://localhost:<port>`.
- Zasada osiągalności: URL callbacku przycisku musi być osiągalny z serwera Mattermost.
  `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/w tej samej przestrzeni nazw sieci.
- Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Bezpośrednia integracja API (zewnętrzne skrypty)

Zewnętrzne skrypty i Webhooks mogą publikować przyciski bezpośrednio przez REST API Mattermost
zamiast przechodzić przez narzędzie `message` agenta. Jeśli to możliwe, użyj `buildButtonAttachments()` z
Pluginu; jeśli publikujesz surowy JSON, stosuj się do tych zasad:

**Struktura ładunku:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Krytyczne zasady:**

1. Załączniki trafiają do `props.attachments`, a nie do `attachments` na poziomie głównym (w przeciwnym razie są po cichu ignorowane).
2. Każda akcja wymaga `type: "button"` — bez tego kliknięcia są po cichu połykane.
3. Każda akcja wymaga pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia psują
   routing akcji po stronie serwera Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby komunikat potwierdzenia pokazywał
   nazwę przycisku (na przykład „Approve”), a nie surowy identyfikator.
6. `context.action_id` jest wymagane — bez niego handler interakcji zwraca 400.

**Generowanie tokena HMAC:**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny
zgodne z logiką weryfikacji Gateway:

1. Wyprowadź sekret z tokena bota:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Zbuduj obiekt context ze wszystkimi polami **z wyjątkiem** `_token`.
3. Serializuj z **posortowanymi kluczami** i **bez spacji** (Gateway używa `JSON.stringify`
   z posortowanymi kluczami, co daje zwarty wynik).
4. Podpisz: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Dodaj wynikowy skrót hex jako `_token` w context.

Przykład w Pythonie:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Typowe pułapki związane z HMAC:

- `json.dumps` w Pythonie domyślnie dodaje spacje (`{"key": "val"}`). Użyj
  `separators=(",", ":")`, aby dopasować się do zwartego wyniku JavaScript (`{"key":"val"}`).
- Zawsze podpisuj **wszystkie** pola context (bez `_token`). Gateway usuwa `_token`, a potem
  podpisuje wszystko, co pozostało. Podpisanie podzbioru powoduje ciche niepowodzenie weryfikacji.
- Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może
  zmieniać kolejność pól context podczas przechowywania ładunku.
- Wyprowadzaj sekret z tokena bota (deterministycznie), a nie z losowych bajtów. Sekret
  musi być taki sam w procesie, który tworzy przyciski, i w Gateway, który je weryfikuje.

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozwiązuje nazwy kanałów i użytkowników
przez API Mattermost. Umożliwia to używanie celów `#channel-name` i `@username` w
`openclaw message send` oraz w dostarczaniu przez Cron/Webhooks.

Nie jest potrzebna żadna konfiguracja — adapter używa tokena bota z konfiguracji konta.

## Wiele kont

Mattermost obsługuje wiele kont w `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Rozwiązywanie problemów

- Brak odpowiedzi na kanałach: upewnij się, że bot jest na kanale i wspomnij go (oncall), użyj prefiksu wyzwalacza (onchar) albo ustaw `chatmode: "onmessage"`.
- Błędy uwierzytelniania: sprawdź token bota, bazowy URL i to, czy konto jest włączone.
- Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
- Natywne polecenia slash zwracają `Unauthorized: invalid command token.`: OpenClaw
  nie zaakceptował tokena callbacku. Typowe przyczyny:
  - rejestracja poleceń slash nie powiodła się lub została tylko częściowo ukończona przy uruchamianiu
  - callback trafia do niewłaściwego Gateway/konta
  - Mattermost nadal ma stare polecenia wskazujące na poprzedni cel callbacku
  - Gateway uruchomił się ponownie bez ponownej aktywacji natywnych poleceń slash
- Jeśli natywne polecenia slash przestają działać, sprawdź logi pod kątem
  `mattermost: failed to register slash commands` lub
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jeśli pominięto `callbackUrl`, a logi ostrzegają, że callback został rozwiązany do
  `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy,
  gdy Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw. Zamiast tego ustaw
  jawny, zewnętrznie osiągalny `commands.callbackUrl`.
- Przyciski pojawiają się jako białe prostokąty: agent może wysyłać nieprawidłowe dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
- Przyciski są renderowane, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma w `ServiceSettings` wartość `true`.
- Kliknięcie przycisku zwraca 404: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost psuje się na identyfikatorach innych niż alfanumeryczne. Używaj tylko `[a-zA-Z0-9]`.
- Logi Gateway zawierają `invalid _token`: niedopasowanie HMAC. Sprawdź, czy podpisujesz wszystkie pola context (a nie ich podzbiór), używasz posortowanych kluczy i zwartego JSON-u (bez spacji). Zobacz sekcję HMAC powyżej.
- Logi Gateway zawierają `missing _token in context`: pole `_token` nie znajduje się w context przycisku. Upewnij się, że jest uwzględnione podczas budowania ładunku integracji.
- Potwierdzenie pokazuje surowy identyfikator zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą sanityzowaną wartość.
- Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
