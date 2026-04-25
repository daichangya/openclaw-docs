---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhooka
    - Konfigurowanie iMessage w systemie macOS
summary: iMessage przez serwer BlueBubbles dla macOS (wysyłanie/odbieranie REST, pisanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: dołączony Plugin, który komunikuje się z serwerem BlueBubbles na macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

## Dołączony Plugin

Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane kompilacje nie
wymagają osobnego kroku `openclaw plugins install`.

## Przegląd

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/testowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona na Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale się nie synchronizować.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez Webhooki; odpowiedzi wychodzące, wskaźniki pisania, potwierdzenia odczytu i tapbacki są wywołaniami REST.
- Załączniki i naklejki są przyjmowane jako multimedia przychodzące (i przekazywane agentowi, gdy to możliwe).
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itd.) z `channels.bluebubbles.allowFrom` + kodami parowania.
- Reakcje są prezentowane jako zdarzenia systemowe, tak jak w Slack/Telegram, więc agenci mogą „wspomnieć” o nich przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofanie wysłania, odpowiedzi w wątkach, efekty wiadomości, zarządzanie grupami.

## Szybki start

1. Zainstaluj serwer BlueBubbles na swoim Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
2. W konfiguracji BlueBubbles włącz web API i ustaw hasło.
3. Uruchom `openclaw onboard` i wybierz BlueBubbles lub skonfiguruj ręcznie:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Skieruj Webhooki BlueBubbles do swojego Gateway (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Uruchom Gateway; zarejestruje obsługę Webhooka i rozpocznie parowanie.

Uwaga dotycząca bezpieczeństwa:

- Zawsze ustawiaj hasło Webhooka.
- Uwierzytelnianie Webhooka jest zawsze wymagane. OpenClaw odrzuca żądania Webhooka BlueBubbles, jeśli nie zawierają hasła/guid zgodnego z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytaniem/przetworzeniem pełnych treści Webhooka.

## Utrzymywanie aktywności aplikacji Messages.app (konfiguracje VM / bezgłowe)

Niektóre konfiguracje macOS VM / zawsze włączone mogą powodować, że Messages.app przechodzi w stan „bezczynności” (zdarzenia przychodzące zatrzymują się, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

### 1) Zapisz AppleScript

Zapisz to jako:

- `~/Scripts/poke-messages.scpt`

Przykładowy skrypt (nieinteraktywny; nie przejmuje fokusu):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Zainstaluj LaunchAgent

Zapisz to jako:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Uwagi:

- To uruchamia się **co 300 sekund** oraz **przy logowaniu**.
- Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zatwierdź je w tej samej sesji użytkownika, w której działa LaunchAgent.

Załaduj to:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles jest dostępne w interaktywnym onboardingu:

```
openclaw onboard
```

Kreator pyta o:

- **URL serwera** (wymagane): adres serwera BlueBubbles (np. `http://192.168.1.100:1234`)
- **Hasło** (wymagane): hasło API z ustawień serwera BlueBubbles
- **Ścieżka Webhooka** (opcjonalne): domyślnie `/bluebubbles-webhook`
- **Zasada DM**: pairing, allowlist, open lub disabled
- **Lista dozwolonych**: numery telefonów, adresy e-mail lub cele czatu

Możesz również dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM + grupy)

DM:

- Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do momentu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokenów. Szczegóły: [Parowanie](/pl/channels/pairing)

Grupy:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` określa, kto może wywoływać w grupach, gdy ustawione jest `allowlist`.

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grup BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Kontaktów na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są wykonywane tylko po tym, jak dostęp do grupy, autoryzacja poleceń i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko uczestnicy telefoniczni bez nazwy.
- Surowe numery telefonów pozostają fallbackiem, gdy nie zostanie znalezione lokalne dopasowanie.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bramkowanie wzmianek (grupy)

BlueBubbles obsługuje bramkowanie wzmianek dla czatów grupowych, zgodne z zachowaniem iMessage/WhatsApp:

- Używa `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy dla grupy włączone jest `requireMention`, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Polecenia sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

Konfiguracja dla każdej grupy:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // domyślnie dla wszystkich grup
        "iMessage;-;chat123": { requireMention: false }, // nadpisanie dla konkretnej grupy
      },
    },
  },
}
```

### Bramkowanie poleceń

- Polecenia sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Używa `allowFrom` i `groupAllowFrom` do określania autoryzacji poleceń.
- Autoryzowani nadawcy mogą uruchamiać polecenia sterujące nawet bez wzmianki w grupach.

### System prompt dla każdej grupy

Każdy wpis w `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do system prompta agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania dla każdej grupy bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Utrzymuj odpowiedzi poniżej 3 zdań. Odzwierciedlaj swobodny ton grupy.",
        },
      },
    },
  },
}
```

Klucz pasuje do tego, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis wieloznaczny `"*"` zapewnia wartość domyślną dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec jest używany przez `requireMention` i zasady narzędzi dla poszczególnych grup). Dokładne dopasowania zawsze mają pierwszeństwo przed symbolem wieloznacznym. DM ignorują to pole; zamiast tego użyj dostosowania prompta na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Przy włączonym BlueBubbles Private API wiadomości przychodzące docierają z krótkimi identyfikatorami wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w określonym wątku wiadomości, lub `action=react`, aby dodać tapback. `systemPrompt` dla każdej grupy to niezawodny sposób, aby agent wybierał właściwe narzędzie:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Gdy odpowiadasz w tej grupie, zawsze wywołuj action=reply z",
            "messageId [[reply_to:N]] z kontekstu, aby Twoja odpowiedź była wątkiem",
            "pod wiadomością wywołującą. Nigdy nie wysyłaj nowej niepowiązanej wiadomości.",
            "",
            "W przypadku krótkich potwierdzeń ('ok', 'mam', 'już się tym zajmuję') użyj",
            "action=react z odpowiednim emoji tapback (❤️, 👍, 😂, ‼️, ❓)",
            "zamiast wysyłać odpowiedź tekstową.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; informacje o mechanice bazowej znajdziesz w sekcjach [Zaawansowane działania](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full).

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ pracy operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM lub dozwolonego czatu grupowego.
- Kolejne wiadomości w tej samej konwersacji BlueBubbles będą kierowane do uruchomionej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Skonfigurowane trwałe powiązania są również obsługiwane przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

`match.peer.id` może używać dowolnej obsługiwanej formy celu BlueBubbles:

- znormalizowany uchwyt DM, taki jak `+15555550123` lub `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Dla stabilnych powiązań grupowych preferuj `chat_id:*` lub `chat_identifier:*`.

Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Zobacz [Agenci ACP](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Pisanie + potwierdzenia odczytu

- **Wskaźniki pisania**: wysyłane automatycznie przed generowaniem odpowiedzi i w jego trakcie.
- **Potwierdzenia odczytu**: kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki pisania**: OpenClaw wysyła zdarzenia rozpoczęcia pisania; BlueBubbles automatycznie czyści stan pisania po wysłaniu lub przekroczeniu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // wyłącz potwierdzenia odczytu
    },
  },
}
```

## Zaawansowane działania

BlueBubbles obsługuje zaawansowane działania na wiadomościach, gdy są włączone w konfiguracji:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacki (domyślnie: true)
        edit: true, // edycja wysłanych wiadomości (macOS 13+, uszkodzone na macOS 26 Tahoe)
        unsend: true, // cofanie wysłania wiadomości (macOS 13+)
        reply: true, // odpowiedzi w wątkach według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itp.)
        renameGroup: true, // zmiana nazwy czatów grupowych
        setGroupIcon: true, // ustawianie ikony/zdjęcia czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodawanie uczestników do grup
        removeParticipant: true, // usuwanie uczestników z grup
        leaveGroup: true, // opuszczanie czatów grupowych
        sendAttachment: true, // wysyłanie załączników/multimediów
      },
    },
  },
}
```

Dostępne działania:

- **react**: dodawanie/usuwanie reakcji tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapbacków iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji wraca do `love`, aby tapback nadal się renderował zamiast powodować niepowodzenie całego żądania. Skonfigurowane reakcje potwierdzające nadal są walidowane ściśle i zwracają błąd przy nieznanych wartościach.
- **edit**: edycja wysłanej wiadomości (`messageId`, `text`)
- **unsend**: cofnięcie wysłania wiadomości (`messageId`)
- **reply**: odpowiedź na konkretną wiadomość (`messageId`, `text`, `to`)
- **sendWithEffect**: wysyłanie z efektem iMessage (`text`, `to`, `effectId`)
- **renameGroup**: zmiana nazwy czatu grupowego (`chatGuid`, `displayName`)
- **setGroupIcon**: ustawienie ikony/zdjęcia czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwrócić powodzenie, ale ikona się nie zsynchronizuje).
- **addParticipant**: dodanie osoby do grupy (`chatGuid`, `address`)
- **removeParticipant**: usunięcie osoby z grupy (`chatGuid`, `address`)
- **leaveGroup**: opuszczenie czatu grupowego (`chatGuid`)
- **upload-file**: wysyłanie multimediów/plików (`to`, `buffer`, `filename`, `asVoice`)
  - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
- Starszy alias: `sendAttachment` nadal działa, ale `upload-file` to kanoniczna nazwa działania.

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może prezentować _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z cache.
- Działania akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie będą już dostępne.

Używaj pełnych identyfikatorów w trwałych automatyzacjach i do przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w przychodzących payloadach

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie DM-ów rozdzielonych przy wysyłaniu (polecenie + URL w jednej kompozycji)

Gdy użytkownik wpisuje w iMessage razem polecenie i URL — np. `Dump https://example.com/article` — Apple rozdziela wysyłkę na **dwa osobne dostarczenia Webhooka**:

1. Wiadomość tekstową (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Na większości konfiguracji oba Webhooki docierają do OpenClaw w odstępie około 0.8–2.0 s. Bez scalania agent otrzymuje samo polecenie w turze 1, odpowiada (często „wyślij mi URL”), a URL widzi dopiero w turze 2 — kiedy kontekst polecenia jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` pozwala w DM scalić kolejne Webhooki od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są przypisywane do poszczególnych wiadomości, aby zachować strukturę tur wielu użytkowników.

### Kiedy włączyć

Włącz, gdy:

- Udostępniasz Skills, które oczekują `polecenie + payload` w jednej wiadomości (dump, paste, save, queue itp.).
- Twoi użytkownicy wklejają URL-e, obrazy lub długie treści obok poleceń.
- Akceptujesz dodatkowe opóźnienie tury DM (zobacz niżej).

Pozostaw wyłączone, gdy:

- Potrzebujesz minimalnego opóźnienia poleceń dla jednokrotnych wyzwalaczy DM.
- Wszystkie Twoje przepływy to jednorazowe polecenia bez późniejszych payloadów.

### Włączanie

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // włącz opcjonalnie (domyślnie: false)
    },
  },
}
```

Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (domyślnie dla braku scalania jest to 500 ms). Szersze okno jest wymagane — rozdzielona wysyłka Apple w odstępie 0.8–2.0 s nie mieści się w ciaśniejszym domyślnym zakresie.

Aby samodzielnie dostroić okno:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms działa na większości konfiguracji; zwiększ do 4000 ms, jeśli Twój Mac jest wolny
        // lub pod presją pamięci (zaobserwowana przerwa może wtedy przekroczyć 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Kompromisy

- **Dodatkowe opóźnienie dla poleceń sterujących DM.** Przy włączonej fladze wiadomości poleceń sterujących DM (takie jak `Dump`, `Save` itp.) czekają teraz do końca okna debounce przed wysłaniem dalej, na wypadek nadejścia payloadu w Webhooku. Polecenia w czatach grupowych nadal są wysyłane natychmiast.
- **Scalone wyjście jest ograniczone** — scalony tekst ma limit 4000 znaków z jawnym markerem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (po przekroczeniu zachowywany jest pierwszy i najnowszy). Każdy źródłowy `messageId` nadal trafia do deduplikacji wejścia, więc późniejsze odtworzenie pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
- **Opcjonalne, dla kanału.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

### Scenariusze i to, co widzi agent

| Użytkownik tworzy                                                    | Apple dostarcza           | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                           |
| -------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (jedno wysłanie)                          | 2 Webhooki w odstępie ~1 s | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (załącznik + tekst)                  | 2 Webhooki                | Dwie tury                               | Jedna tura: tekst + obraz                                                |
| `/status` (samodzielne polecenie)                                    | 1 Webhook                 | Natychmiastowe wysłanie                 | **Oczekiwanie do końca okna, potem wysłanie**                            |
| Samodzielnie wklejony URL                                            | 1 Webhook                 | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w buforze)                     |
| Tekst + URL wysłane jako dwie celowo osobne wiadomości, minuty później | 2 Webhooki poza oknem     | Dwie tury                               | Dwie tury (okno wygasa pomiędzy nimi)                                    |
| Szybki zalew (>10 małych DM w obrębie okna)                          | N Webhooków               | N tur                                   | Jedna tura, ograniczone wyjście (pierwszy + najnowszy, limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem rozdzielonej wysyłki

Jeśli flaga jest włączona, a rozdzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

1. **Konfiguracja została rzeczywiście załadowana.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Następnie `openclaw gateway restart` — flaga jest odczytywana podczas tworzenia rejestru debouncerów.

2. **Okno debounce jest wystarczająco szerokie dla Twojej konfiguracji.** Sprawdź log serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Zmierz odstęp między wysyłką tekstu w stylu `"Dump"` a następującą po niej wysyłką `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby wygodnie objąć ten odstęp.

3. **Znaczniki czasu JSONL sesji ≠ nadejście Webhooka.** Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment przekazania wiadomości agentowi przez Gateway, **a nie** moment nadejścia Webhooka. Oznaczenie drugiej wiadomości w kolejce jako `[Queued messages while agent was busy]` oznacza, że pierwsza tura nadal trwała, gdy nadszedł drugi Webhook — bufor scalania został już opróżniony. Dostrajać okno należy względem logu serwera BB, a nie logu sesji.

4. **Presja pamięci spowalnia wysyłkę odpowiedzi.** Na mniejszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że bufor scalania opróżni się przed zakończeniem odpowiedzi, a URL trafi jako druga tura w kolejce. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza około 500 MB RSS i kompresor jest aktywny, zamknij inne ciężkie procesy albo przejdź na większy host.

5. **Wysyłki z cytowaną odpowiedzią działają inną ścieżką.** Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje znaczek „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhooku. Scalanie nie ma tu zastosowania — to kwestia Skill/prompta, a nie debouncera.

## Blokowe streamowanie

Kontroluje, czy odpowiedzi są wysyłane jako pojedyncza wiadomość czy streamowane w blokach:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącz blokowe streamowanie (domyślnie wyłączone)
    },
  },
}
```

## Multimedia + limity

- Załączniki przychodzące są pobierane i przechowywane w cache multimediów.
- Limit multimediów przez `channels.bluebubbles.mediaMaxMb` dla multimediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony na fragmenty według `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.bluebubbles.enabled`: włącza/wyłącza kanał.
- `channels.bluebubbles.serverUrl`: bazowy URL REST API BlueBubbles.
- `channels.bluebubbles.password`: hasło API.
- `channels.bluebubbles.webhookPath`: ścieżka endpointu Webhooka (domyślnie: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
- `channels.bluebubbles.allowFrom`: lista dozwolonych dla DM (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista dozwolonych nadawców grupowych.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: na macOS opcjonalnie wzbogaca nienazwanych uczestników grupy danymi z lokalnych Kontaktów po przejściu bramkowania. Domyślnie: `false`.
- `channels.bluebubbles.groups`: konfiguracja dla każdej grupy (`requireMention` itd.).
- `channels.bluebubbles.sendReadReceipts`: wysyłanie potwierdzeń odczytu (domyślnie: `true`).
- `channels.bluebubbles.blockStreaming`: włącza blokowe streamowanie (domyślnie: `false`; wymagane dla streamowanych odpowiedzi).
- `channels.bluebubbles.textChunkLimit`: rozmiar fragmentu wychodzącego w znakach (domyślnie: 4000).
- `channels.bluebubbles.sendTimeoutMs`: limit czasu pojedynczego żądania w ms dla wychodzących wysyłek tekstu przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ w konfiguracjach macOS 26, gdzie wysyłki iMessage przez Private API mogą zawieszać się na 60+ sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Testy, wyszukiwania czatów, reakcje, edycje i kontrole kondycji obecnie zachowują krótszy domyślny limit 10 s; rozszerzenie tego także na reakcje i edycje jest planowane jako kolejny krok. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości.
- `channels.bluebubbles.mediaMaxMb`: limit multimediów przychodzących/wychodzących w MB (domyślnie: 8).
- `channels.bluebubbles.mediaLocalRoots`: jawna lista dozwolonych bezwzględnych katalogów lokalnych, z których można wysyłać lokalne ścieżki multimediów. Wysyłanie lokalnych ścieżek jest domyślnie odrzucane, jeśli to nie jest skonfigurowane. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: scala kolejne Webhooki DM od tego samego nadawcy w jedną turę agenta, tak aby rozdzielona przez Apple wysyłka tekst+URL trafiała jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie DM-ów rozdzielonych przy wysyłaniu](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu bez jawnego `messages.inbound.byChannel.bluebubbles` rozszerza domyślne okno debounce dla wiadomości przychodzących z 500 ms do 2500 ms.
- `channels.bluebubbles.historyLimit`: maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
- `channels.bluebubbles.dmHistoryLimit`: limit historii DM.
- `channels.bluebubbles.actions`: włącza/wyłącza określone działania.
- `channels.bluebubbles.accounts`: konfiguracja wielu kont.

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczenia

Dla stabilnego routingu preferuj `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli bezpośredni uchwyt nie ma istniejącego czatu DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage vs SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymał też zapasowe wiadomości z zielonym dymkiem), OpenClaw preferuje czat iMessage i nigdy po cichu nie obniża do SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez dowolny czat zgłaszany przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i endpoint Webhooka w tajemnicy (traktuj je jak dane uwierzytelniające).
- Nie ma obejścia localhost dla uwierzytelniania Webhooka BlueBubbles. Jeśli przekazujesz ruch Webhooka przez proxy, zachowaj hasło BlueBubbles w żądaniu na całej drodze. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Bezpieczeństwo Gateway](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS + reguły firewalla na serwerze BlueBubbles, jeśli udostępniasz go poza swoją siecią LAN.

## Rozwiązywanie problemów

- Jeśli przestają działać zdarzenia pisania/odczytu, sprawdź logi Webhooka BlueBubbles i upewnij się, że ścieżka Gateway odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` oraz `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles Private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edit/unsend wymagają macOS 13+ i zgodnej wersji serwera BlueBubbles. Na macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w Private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić powodzenie, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone działania na podstawie wersji macOS serwera BlueBubbles. Jeśli edit nadal pojawia się na macOS 26 (Tahoe), wyłącz go ręcznie przez `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz listę kontrolną [rozwiązywania problemów ze scalaniem rozdzielonej wysyłki](#split-send-coalescing-troubleshooting) — częste przyczyny to zbyt wąskie okno debounce, błędne odczytanie znaczników czasu logu sesji jako momentu nadejścia Webhooka albo wysyłka z cytowaną odpowiedzią (która używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o statusie/kondycji: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w [Kanały](/pl/channels) i przewodniku [Pluginy](/pl/tools/plugin).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
