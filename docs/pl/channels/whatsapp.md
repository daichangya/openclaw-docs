---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T09:56:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (kanał Web)

Status: gotowy do produkcji przez WhatsApp Web (Baileys). Gateway zarządza powiązaną sesją / powiązanymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wybraniu kanału proszą o instalację pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji,
  gdy plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pl/gateway/configuration">
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

  </Step>

  <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Zatwierdź pierwsze żądanie parowania (jeśli używasz trybu parowania)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Żądania parowania wygasają po 1 godzinie. Liczba oczekujących żądań jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca, aby w miarę możliwości uruchamiać WhatsApp na osobnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod ten wariant, ale konfiguracje z numerem osobistym też są obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Osobny numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze listy dozwolonych DM i granice routingu
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
    - `allowFrom` zawiera Twój osobisty numer
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu do samego siebie opierają się na powiązanym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej w obecnej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości WhatsApp przez Twilio.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Wysyłka wychodząca wymaga aktywnego listenera WhatsApp dla konta docelowego.
- Czaty statusowe i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślnie `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie wielokontowe: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły działania w czasie działania:

    - parowania są trwale zapisywane w magazynie dozwolonych elementów kanału i łączone ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano żadnej listy dozwolonych, powiązany własny numer jest domyślnie dozwolony
    - wychodzące DM `fromMe` nigdy nie są automatycznie parowane

  </Tab>

  <Tab title="Polityka grup + listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonego członkostwa grupowego** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` jest dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje cały przychodzący ruch grupowy

    Zachowanie awaryjne listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko działania używa awaryjnie `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją wzmianką/odpowiedzią

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, awaryjna polityka grup w czasie działania to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź tylko spełnia warunek bramkowania wzmianką; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (a nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu do samego siebie

Gdy powiązany własny numer jest także obecny w `allowFrom`, aktywowane są zabezpieczenia czatu do samego siebie w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu do samego siebie
- ignorowanie zachowania autoaktywacji mention-JID, które w przeciwnym razie powodowałoby ping do samego siebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi czatu do samego siebie domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również uzupełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, nadawca JID/E.164).

  </Accordion>

  <Accordion title="Symbole zastępcze mediów i wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko media są normalizowane z użyciem symboli zastępczych takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ładunki lokalizacji i kontaktów są normalizowane do kontekstu tekstowego przed routingiem.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    Dla grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu aktywowany.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - ustawienie awaryjne: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzykiwania:

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

    Nadpisanie na konto:

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

## Dostarczanie, dzielenie i media

<AccordionGroup>
  <Accordion title="Dzielenie tekstu">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste linie), a następnie awaryjnie przechodzi do bezpiecznego dzielenia według długości
  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) i dokumentów
    - `audio/ogg` jest przepisywane na `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma mediami
    - źródłem mediów może być HTTP(S), `file://` lub ścieżki lokalne
  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłki mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania na konto używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru / przeszukiwanie jakości), aby zmieścić się w limitach
    - przy błędzie wysyłki mediów awaryjne zachowanie dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, gdzie odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Kontroluj to za pomocą `channels.whatsapp.replyToMode`.

| Wartość  | Zachowanie                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| `"auto"` | Cytuje wiadomość przychodzącą, gdy provider to obsługuje; w przeciwnym razie pomija cytowanie |
| `"on"`   | Zawsze cytuje wiadomość przychodzącą; awaryjnie przechodzi do zwykłej wysyłki, jeśli cytowanie zostanie odrzucone |
| `"off"`  | Nigdy nie cytuje; wysyła jako zwykłą wiadomość                                    |

Domyślnie ustawione jest `"auto"`. Nadpisania na konto używają `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom       | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------ | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`      | Nie                    | Nie                             | Brak reakcji                                     |
| `"ack"`      | Tak                    | Nie                             | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`  | Tak                    | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"`| Tak                    | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zalecanymi wskazówkami |

Domyślnie: `"minimal"`.

Nadpisania na konto używają `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp obsługuje natychmiastowe reakcje potwierdzające po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzające są bramkowane przez `reactionLevel` — są tłumione, gdy `reactionLevel` ma wartość `"off"`.

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

Uwagi dotyczące zachowania:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- błędy są logowane, ale nie blokują normalnego dostarczania odpowiedzi
- tryb grupowy `mentions` reaguje przy turach aktywowanych wzmianką; grupowa aktywacja `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i ustawienia domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są wewnętrznie normalizowane na potrzeby wyszukiwania
  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane / migrowane dla przepływów konta domyślnego
  </Accordion>

  <Accordion title="Zachowanie przy wylogowaniu">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelnienia WhatsApp dla tego konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, a pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, akcje i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje akcję reakcji WhatsApp (`react`).
- Bramy akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Niepołączone (wymagany QR)">
    Objaw: status kanału pokazuje brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączone, ale rozłączone / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    W razie potrzeby połącz ponownie przez `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego listenera przy wysyłaniu">
    Wysyłki wychodzące kończą się natychmiastowym niepowodzeniem, gdy nie istnieje aktywny listener Gateway dla konta docelowego.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są niespodziewanie ignorowane">
    Sprawdzaj w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianką (`requireMention` + wzorce wzmianki)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy zastępują wcześniejsze, więc zachowuj tylko jedno `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska wykonawczego Bun">
    Środowisko wykonawcze Gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## System prompts

WhatsApp obsługuje system prompts w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Najpierw określana jest efektywna mapa `groups`: jeśli konto definiuje własne `groups`, całkowicie zastępuje ono główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **System prompt specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, jeśli wpis dla konkretnej grupy definiuje `systemPrompt`.
2. **System prompt wieloznaczny dla grup** (`groups["*"].systemPrompt`): używany, gdy wpis dla konkretnej grupy nie istnieje lub nie definiuje `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Najpierw określana jest efektywna mapa `direct`: jeśli konto definiuje własne `direct`, całkowicie zastępuje ono główną mapę `direct` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **System prompt specyficzny dla wiadomości bezpośredniej** (`direct["<peerId>"].systemPrompt`): używany, jeśli wpis dla konkretnego rozmówcy definiuje `systemPrompt`.
2. **System prompt wieloznaczny dla wiadomości bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy wpis dla konkretnego rozmówcy nie istnieje lub nie definiuje `systemPrompt`.

Uwaga: `dms` pozostaje lekkim zasobnikiem nadpisania historii dla pojedynczych DM (`dms.<id>.historyLimit`); nadpisania promptów znajdują się w `direct`.

**Różnica względem zachowania Telegram w konfiguracji wielokontowej:** W Telegram główne `groups` jest celowo tłumione dla wszystkich kont w konfiguracji wielokontowej — nawet dla kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielokontowej WhatsApp, jeśli chcesz promptów grupowych lub bezpośrednich na konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na ustawieniach domyślnych na poziomie głównym.

Ważne zachowanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji dla grup i listą dozwolonych grup na poziomie czatu. Zarówno w zakresie głównym, jak i konta, `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wieloznaczny grupowy `systemPrompt` tylko wtedy, gdy i tak chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` dla domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie wpisanym na listę dozwolonych wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to oddzielne sprawdzenia. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje wszystkich nadawców w tych grupach. Dostęp nadawców jest nadal kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM zostanie już dopuszczony przez `dmPolicy` oraz reguły `allowFrom` lub magazynu parowań.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone w zakresie głównym.
        // Dotyczy wszystkich kont, które nie definiują własnej mapy groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Dotyczy wszystkich kont, które nie definiują własnej mapy direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // To konto definiuje własne groups, więc główne groups jest całkowicie
            // zastępowane. Aby zachować wildcard, zdefiniuj tutaj jawnie także "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // To konto definiuje własną mapę direct, więc główne wpisy direct są
            // całkowicie zastępowane. Aby zachować wildcard, zdefiniuj tutaj jawnie także "*".
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki do dokumentacji konfiguracji

Podstawowa dokumentacja:

- [Dokumentacja konfiguracji - WhatsApp](/pl/gateway/configuration-reference#whatsapp)

Pola WhatsApp o wysokim znaczeniu:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
