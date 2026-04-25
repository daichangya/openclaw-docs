---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, sposób dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: gotowe do użycia w środowisku produkcyjnym przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) oraz `openclaw channels add --channel whatsapp`
  przy pierwszym wyborze kanału proponują instalację Plugin WhatsApp.
- `openclaw channels login --channel whatsapp` również oferuje proces instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał dev + checkout git: domyślnie używa lokalnej ścieżki Plugin.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna nadal jest dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka wiadomości prywatnych dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Skonfiguruj politykę dostępu WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Połącz WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Dla konkretnego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby podłączyć istniejący/własny katalog uwierzytelniania WhatsApp Web przed logowaniem:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Zatwierdź pierwszą prośbę o parowanie (jeśli używasz trybu parowania)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Prośby o parowanie wygasają po 1 godzinie. Liczba oczekujących próśb jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca, aby w miarę możliwości uruchamiać WhatsApp na osobnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki model, ale konfiguracje z numerem osobistym są również obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - oddzielna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze allowlist wiadomości prywatnych i granice routingu
    - mniejsze ryzyko zamieszania z czatem do samego siebie

    Minimalny wzorzec polityki:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb awaryjny z numerem osobistym">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu do samego siebie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu do samego siebie opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko dla WhatsApp Web">
    Kanał platformy komunikacyjnej jest obecnie oparty na WhatsApp Web (`Baileys`) w architekturze kanałów OpenClaw.

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału komunikacyjnego Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownych połączeń.
- Wysyłanie wiadomości wychodzących wymaga aktywnego nasłuchu WhatsApp dla docelowego konta.
- Czaty statusowe i broadcastowe są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają zasad sesji wiadomości prywatnych (`session.dmScope`; domyślne `main` zwija wiadomości prywatne do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` oraz ich warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy specyficznych dla kanału WhatsApp.

## Hooki Plugin i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać prywatną treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozgłasza przychodzących ładunków hooka `message_received` do Pluginów,
chyba że jawnie to włączysz:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Możesz ograniczyć to włączenie do jednego konta:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Włączaj to tylko dla Pluginów, którym ufasz w zakresie odbierania przychodzącej treści wiadomości WhatsApp
i identyfikatorów.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka wiadomości prywatnych">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo nad domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły działania w runtime:

    - parowania są zapisywane w channel allow-store i łączone ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano żadnej allowlist, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy nie paruje automatycznie wychodzących wiadomości prywatnych `fromMe` (wiadomości, które wysyłasz do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Polityka grup + allowlisty">
    Dostęp do grup ma dwie warstwy:

    1. **Allowlista członkostwa w grupie** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy są kwalifikowane
       - jeśli `groups` jest obecne, działa jako allowlista grup (`"*"` jest dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlista nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj cały ruch przychodzący z grup

    Fallback allowlisty nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime używa jako fallback `allowFrom`, gdy jest dostępne
    - allowlisty nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, fallback polityki grupowej w runtime to `allowlist` (z ostrzeżeniem w logu), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex dla wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek bramki wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza allowlisty są nadal blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z allowlisty

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (a nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu do samego siebie

Gdy połączony własny numer jest obecny również w `allowFrom`, aktywują się zabezpieczenia czatu do samego siebie w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu do samego siebie
- ignorowanie zachowania automatycznego wyzwalania mention-JID, które w przeciwnym razie oznaczałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie do samego siebie domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Przychodząca koperta + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę wiadomości przychodzących.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dodawany w tej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów oraz wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające wyłącznie multimedia są normalizowane z użyciem symboli zastępczych, takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz szczegóły kontaktów/vCard są renderowane jako ograniczone blokami niezaufane metadane, a nie jako tekst promptu inline.

  </Accordion>

  <Accordion title="Wstrzykiwanie historii oczekujących wiadomości grupowych">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie ostatecznie wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzyknięcia:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Potwierdzenia odczytu">
    Potwierdzenia odczytu są domyślnie włączone dla zaakceptowanych przychodzących wiadomości WhatsApp.

    Wyłącz globalnie:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Nadpisanie dla konta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Tury czatu do samego siebie pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste linie), a następnie używa bezpiecznego długościowo dzielenia na fragmenty
  </Accordion>

  <Accordion title="Zachowanie multimediów wychodzących">
    - obsługuje ładunki image, video, audio (wiadomość głosowa PTT) i document
    - ładunki odpowiedzi zachowują `audioAsVoice`; WhatsApp wysyła multimedia audio jako wiadomości głosowe Baileys PTT
    - dźwięk inny niż Ogg, w tym wyjście Microsoft Edge TTS MP3/WebM, jest transkodowany do Ogg/Opus przed dostarczeniem jako PTT
    - natywny dźwięk Ogg/Opus jest wysyłany z `audio/ogg; codecs=opus` dla zgodności z wiadomościami głosowymi
    - odtwarzanie animowanych GIF jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma multimediami
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne
  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie awaryjne">
    - limit zapisu multimediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania multimediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieścić się w limitach
    - przy błędzie wysyłki multimediów fallback pierwszego elementu wysyła ostrzeżenie tekstowe zamiast cicho porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, gdzie odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruje tym `channels.whatsapp.replyToMode`.

| Value       | Zachowanie                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                                  |
| `"first"`   | Cytuj tylko pierwszy wychodzący fragment odpowiedzi                             |
| `"all"`     | Cytuj każdy wychodzący fragment odpowiedzi                                      |
| `"batched"` | Cytuj odpowiedzi kolejkowane wsadowo, pozostawiając odpowiedzi natychmiastowe bez cytowania |

Wartością domyślną jest `"off"`. Nadpisania per konto używają `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje ack | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ----------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie         | Nie                             | Brak reakcji                                     |
| `"ack"`       | Tak         | Nie                             | Tylko reakcje ack (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak         | Tak (zachowawczo)               | Ack + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak         | Tak (zalecane)                  | Ack + reakcje agenta z aktywnie zalecanymi wskazówkami |

Wartość domyślna: `"minimal"`.

Nadpisania per konto używają `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reakcje potwierdzające

WhatsApp obsługuje natychmiastowe reakcje ack po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje ack są kontrolowane przez `reactionLevel` — są wyciszane, gdy `reactionLevel` ma wartość `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Uwagi dotyczące działania:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- błędy są logowane, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupowy `mentions` reaguje przy turach wyzwolonych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tu używane)

## Wiele kont i dane uwierzytelniające

<AccordionGroup>
  <Accordion title="Wybór konta i ustawienia domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są normalizowane wewnętrznie na potrzeby wyszukiwania
  </Accordion>

  <Accordion title="Ścieżki danych uwierzytelniających i zgodność wsteczna">
    - aktualna ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów domyślnego konta
  </Accordion>

  <Accordion title="Zachowanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, a pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, akcje i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje akcję reakcji WhatsApp (`react`).
- Bramki akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Niepołączone (wymagany QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączone, ale rozłączone / pętla ponownych połączeń">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    W razie potrzeby połącz ponownie przez `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchu podczas wysyłania">
    Wiadomości wychodzące kończą się szybkim błędem, gdy nie istnieje aktywny nasłuch Gateway dla docelowego konta.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy allowlisty `groups`
    - bramkę wzmianek (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj tylko jedno `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska Bun">
    Runtime Gateway dla WhatsApp powinien używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway dla WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Najpierw ustalana jest efektywna mapa `groups`: jeśli konto definiuje własne `groups`, całkowicie zastępuje ona główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na tej wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy wpis dla konkretnej grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard zostaje wyciszony i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy wildcard dla grup** (`groups["*"].systemPrompt`): używany, gdy wpis dla konkretnej grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości prywatnych:

Najpierw ustalana jest efektywna mapa `direct`: jeśli konto definiuje własne `direct`, całkowicie zastępuje ona główną mapę `direct` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na tej wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy wpis dla konkretnego peera istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard zostaje wyciszony i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy wildcard dla wiadomości prywatnych** (`direct["*"].systemPrompt`): używany, gdy wpis dla konkretnego peera jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Uwaga: `dms` pozostaje lekkim zasobnikiem nadpisywania historii per DM (`dms.<id>.historyLimit`); nadpisania promptów znajdują się w `direct`.

**Różnica względem zachowania wielu kont w Telegram:** W Telegram główne `groups` jest celowo wyciszane dla wszystkich kont w konfiguracji wielu kont — nawet dla kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielu kont WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie per konto, jawnie zdefiniuj pełną mapę pod każdym kontem zamiast polegać na ustawieniach domyślnych na poziomie głównym.

Ważne zachowania:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji per grupa i allowlistą grup na poziomie czatu. Zarówno w zakresie głównym, jak i konta, `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard `systemPrompt` dla grup tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt w każdym jawnie dopuszczonym wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to odrębne kontrole. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawców jest nadal kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego efektu ubocznego dla wiadomości prywatnych. `direct["*"]` zapewnia jedynie domyślną konfigurację czatu bezpośredniego po tym, jak wiadomość prywatna została już dopuszczona przez `dmPolicy` oraz `allowFrom` lub reguły pairing-store.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone w zakresie głównym.
        // Dotyczy wszystkich kont, które nie definiują własnej mapy groups.
        "*": { systemPrompt: "Domyślny prompt dla wszystkich grup." },
      },
      direct: {
        // Dotyczy wszystkich kont, które nie definiują własnej mapy direct.
        "*": { systemPrompt: "Domyślny prompt dla wszystkich czatów bezpośrednich." },
      },
      accounts: {
        work: {
          groups: {
            // To konto definiuje własne groups, więc główne groups jest całkowicie
            // zastępowane. Aby zachować wildcard, zdefiniuj tu także "*" jawnie.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Skup się na zarządzaniu projektami.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Domyślny prompt dla grup roboczych." },
          },
          direct: {
            // To konto definiuje własne direct, więc główne wpisy direct są
            // całkowicie zastępowane. Aby zachować wildcard, zdefiniuj tu także "*" jawnie.
            "+15551234567": { systemPrompt: "Prompt dla konkretnego roboczego czatu bezpośredniego." },
            "*": { systemPrompt: "Domyślny prompt dla roboczych czatów bezpośrednich." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki do dokumentacji konfiguracji

Podstawowa dokumentacja:

- [Dokumentacja konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
