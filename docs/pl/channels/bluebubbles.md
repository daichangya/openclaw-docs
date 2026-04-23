---
read_when:
    - Konfigurowanie kanału BlueBubbles
    - Rozwiązywanie problemów z parowaniem Webhooka
    - Konfigurowanie iMessage na macOS
summary: iMessage przez serwer BlueBubbles na macOS (wysyłanie/odbieranie przez REST, wpisywanie, reakcje, parowanie, zaawansowane działania).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T09:55:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST na macOS)

Status: dołączony plugin, który komunikuje się z serwerem BlueBubbles na macOS przez HTTP. **Zalecany do integracji z iMessage** ze względu na bogatsze API i łatwiejszą konfigurację w porównaniu ze starszym kanałem imsg.

## Dołączony plugin

Bieżące wydania OpenClaw zawierają BlueBubbles, więc zwykłe spakowane buildy nie
wymagają osobnego kroku `openclaw plugins install`.

## Przegląd

- Działa na macOS przez aplikację pomocniczą BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Zalecane/przetestowane: macOS Sequoia (15). macOS Tahoe (26) działa; edycja jest obecnie uszkodzona na Tahoe, a aktualizacje ikon grup mogą zgłaszać powodzenie, ale nie synchronizować się.
- OpenClaw komunikuje się z nim przez jego REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Wiadomości przychodzące docierają przez Webhooki; odpowiedzi wychodzące, wskaźniki wpisywania, potwierdzenia odczytu i tapbacki są realizowane przez wywołania REST.
- Załączniki i naklejki są przetwarzane jako media przychodzące (i przekazywane agentowi, gdy to możliwe).
- Parowanie/lista dozwolonych działa tak samo jak w innych kanałach (`/channels/pairing` itp.) z użyciem `channels.bluebubbles.allowFrom` + kodów parowania.
- Reakcje są udostępniane jako zdarzenia systemowe, tak jak w Slack/Telegram, dzięki czemu agenci mogą „wspomnieć” o nich przed odpowiedzią.
- Funkcje zaawansowane: edycja, cofnięcie wysłania, odpowiedzi w wątkach, efekty wiadomości, zarządzanie grupami.

## Szybki start

1. Zainstaluj serwer BlueBubbles na swoim Macu (postępuj zgodnie z instrukcjami na [bluebubbles.app/install](https://bluebubbles.app/install)).
2. W konfiguracji BlueBubbles włącz web API i ustaw hasło.
3. Uruchom `openclaw onboard` i wybierz BlueBubbles albo skonfiguruj ręcznie:

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

4. Skieruj Webhooki BlueBubbles do swojego Gatewaya (przykład: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Uruchom Gateway; zarejestruje obsługę Webhooka i rozpocznie parowanie.

Uwaga dotycząca bezpieczeństwa:

- Zawsze ustawiaj hasło Webhooka.
- Uwierzytelnianie Webhooka jest zawsze wymagane. OpenClaw odrzuca żądania Webhooka BlueBubbles, jeśli nie zawierają hasła/guid zgodnego z `channels.bluebubbles.password` (na przykład `?password=<password>` lub `x-password`), niezależnie od topologii loopback/proxy.
- Uwierzytelnianie hasłem jest sprawdzane przed odczytem/przetworzeniem pełnych treści Webhooka.

## Utrzymywanie aktywnej aplikacji Messages.app (konfiguracje VM / bezgłowe)

W niektórych konfiguracjach macOS VM / always-on Messages.app może przejść w stan „bezczynny” (zdarzenia przychodzące przestają docierać, dopóki aplikacja nie zostanie otwarta/przeniesiona na pierwszy plan). Prostym obejściem jest **szturchanie Messages co 5 minut** za pomocą AppleScript + LaunchAgent.

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

### 2) Zainstaluj LaunchAgenta

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

- To uruchamia się **co 300 sekund** i **przy logowaniu**.
- Pierwsze uruchomienie może wywołać monity macOS **Automation** (`osascript` → Messages). Zaakceptuj je w tej samej sesji użytkownika, w której działa LaunchAgent.

Załaduj:

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

- **Server URL** (wymagane): adres serwera BlueBubbles (np. `http://192.168.1.100:1234`)
- **Password** (wymagane): hasło API z ustawień BlueBubbles Server
- **Webhook path** (opcjonalne): domyślnie `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open lub disabled
- **Allow list**: numery telefonów, adresy e-mail lub cele czatu

Możesz też dodać BlueBubbles przez CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrola dostępu (DM-y + grupy)

DM-y:

- Domyślnie: `channels.bluebubbles.dmPolicy = "pairing"`.
- Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzenie przez:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Parowanie jest domyślnym mechanizmem wymiany tokena. Szczegóły: [Parowanie](/pl/channels/pairing)

Grupy:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` określa, kto może wywoływać w grupach, gdy ustawione jest `allowlist`.

### Wzbogacanie nazw kontaktów (macOS, opcjonalne)

Webhooki grup BlueBubbles często zawierają tylko surowe adresy uczestników. Jeśli chcesz, aby kontekst `GroupMembers` pokazywał zamiast tego lokalne nazwy kontaktów, możesz włączyć lokalne wzbogacanie z Contacts na macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` włącza wyszukiwanie. Domyślnie: `false`.
- Wyszukiwania są wykonywane dopiero po tym, jak dostęp do grupy, autoryzacja komendy i bramkowanie wzmianek przepuszczą wiadomość.
- Wzbogacani są tylko uczestnicy z numerami telefonów bez nazw.
- Surowe numery telefonów pozostają wartością zapasową, gdy nie zostanie znalezione lokalne dopasowanie.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bramka wzmianek (grupy)

BlueBubbles obsługuje bramkowanie wzmianek dla czatów grupowych, zgodnie z zachowaniem iMessage/WhatsApp:

- Używa `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`) do wykrywania wzmianek.
- Gdy dla grupy włączone jest `requireMention`, agent odpowiada tylko wtedy, gdy zostanie wspomniany.
- Komendy sterujące od autoryzowanych nadawców omijają bramkowanie wzmianek.

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

### Bramka komend

- Komendy sterujące (np. `/config`, `/model`) wymagają autoryzacji.
- Używa `allowFrom` i `groupAllowFrom` do określenia autoryzacji komend.
- Autoryzowani nadawcy mogą uruchamiać komendy sterujące nawet bez wspominania w grupach.

### Prompt systemowy dla każdej grupy

Każdy wpis w `channels.bluebubbles.groups.*` akceptuje opcjonalny ciąg `systemPrompt`. Wartość jest wstrzykiwana do promptu systemowego agenta przy każdej turze obsługującej wiadomość w tej grupie, dzięki czemu możesz ustawić personę lub reguły zachowania dla konkretnej grupy bez edytowania promptów agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Odpowiedzi utrzymuj poniżej 3 zdań. Dopasuj się do swobodnego tonu grupy.",
        },
      },
    },
  },
}
```

Klucz odpowiada temu, co BlueBubbles zgłasza jako `chatGuid` / `chatIdentifier` / numeryczne `chatId` dla grupy, a wpis z wildcardem `"*"` zapewnia wartość domyślną dla każdej grupy bez dokładnego dopasowania (ten sam wzorzec jest używany przez `requireMention` i zasady narzędzi dla każdej grupy). Dokładne dopasowania zawsze mają pierwszeństwo przed wildcardem. DM-y ignorują to pole; zamiast tego użyj dostosowania promptu na poziomie agenta lub konta.

#### Przykład praktyczny: odpowiedzi w wątkach i reakcje tapback (Private API)

Przy włączonym BlueBubbles Private API wiadomości przychodzące zawierają krótkie identyfikatory wiadomości (na przykład `[[reply_to:5]]`), a agent może wywołać `action=reply`, aby odpowiedzieć w konkretnym wątku, albo `action=react`, aby dodać tapback. `systemPrompt` dla każdej grupy jest niezawodnym sposobem na utrzymanie poprawnego wyboru narzędzia przez agenta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reakcje tapback i odpowiedzi w wątkach wymagają BlueBubbles Private API; mechanika działania jest opisana w [Zaawansowane działania](#advanced-actions) i [Identyfikatory wiadomości](#message-ids-short-vs-full).

## Powiązania konwersacji ACP

Czaty BlueBubbles można przekształcić w trwałe obszary robocze ACP bez zmiany warstwy transportowej.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM-a lub dozwolonego czatu grupowego.
- Kolejne wiadomości w tej samej konwersacji BlueBubbles będą kierowane do utworzonej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Obsługiwane są też skonfigurowane trwałe powiązania przez wpisy najwyższego poziomu `bindings[]` z `type: "acp"` i `match.channel: "bluebubbles"`.

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

Zobacz [ACP Agents](/pl/tools/acp-agents), aby poznać wspólne zachowanie powiązań ACP.

## Wpisywanie + potwierdzenia odczytu

- **Wskaźniki wpisywania**: wysyłane automatycznie przed i podczas generowania odpowiedzi.
- **Potwierdzenia odczytu**: kontrolowane przez `channels.bluebubbles.sendReadReceipts` (domyślnie: `true`).
- **Wskaźniki wpisywania**: OpenClaw wysyła zdarzenia rozpoczęcia wpisywania; BlueBubbles czyści stan wpisywania automatycznie po wysłaniu lub po przekroczeniu limitu czasu (ręczne zatrzymanie przez DELETE jest zawodne).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // wyłącza potwierdzenia odczytu
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
        edit: true, // edytowanie wysłanych wiadomości (macOS 13+, uszkodzone na macOS 26 Tahoe)
        unsend: true, // cofanie wysłanych wiadomości (macOS 13+)
        reply: true, // odpowiedzi w wątkach według GUID wiadomości
        sendWithEffect: true, // efekty wiadomości (slam, loud itp.)
        renameGroup: true, // zmiana nazwy czatów grupowych
        setGroupIcon: true, // ustawienie ikony/zdjęcia czatu grupowego (niestabilne na macOS 26 Tahoe)
        addParticipant: true, // dodawanie uczestników do grup
        removeParticipant: true, // usuwanie uczestników z grup
        leaveGroup: true, // opuszczanie czatów grupowych
        sendAttachment: true, // wysyłanie załączników/mediów
      },
    },
  },
}
```

Dostępne działania:

- **react**: dodawanie/usuwanie reakcji tapback (`messageId`, `emoji`, `remove`). Natywny zestaw tapbacków iMessage to `love`, `like`, `dislike`, `laugh`, `emphasize` i `question`. Gdy agent wybierze emoji spoza tego zestawu (na przykład `👀`), narzędzie reakcji przełącza się awaryjnie na `love`, aby tapback został wyrenderowany zamiast powodować błąd całego żądania. Skonfigurowane reakcje potwierdzające nadal są walidowane ściśle i zwracają błąd dla nieznanych wartości.
- **edit**: edytowanie wysłanej wiadomości (`messageId`, `text`)
- **unsend**: cofanie wysłanej wiadomości (`messageId`)
- **reply**: odpowiedź na konkretną wiadomość (`messageId`, `text`, `to`)
- **sendWithEffect**: wysłanie z efektem iMessage (`text`, `to`, `effectId`)
- **renameGroup**: zmiana nazwy czatu grupowego (`chatGuid`, `displayName`)
- **setGroupIcon**: ustawienie ikony/zdjęcia czatu grupowego (`chatGuid`, `media`) — niestabilne na macOS 26 Tahoe (API może zwrócić powodzenie, ale ikona się nie zsynchronizuje).
- **addParticipant**: dodanie osoby do grupy (`chatGuid`, `address`)
- **removeParticipant**: usunięcie osoby z grupy (`chatGuid`, `address`)
- **leaveGroup**: opuszczenie czatu grupowego (`chatGuid`)
- **upload-file**: wysyłanie mediów/plików (`to`, `buffer`, `filename`, `asVoice`)
  - Notatki głosowe: ustaw `asVoice: true` z dźwiękiem **MP3** lub **CAF**, aby wysłać jako wiadomość głosową iMessage. BlueBubbles konwertuje MP3 → CAF podczas wysyłania notatek głosowych.
- Starszy alias: `sendAttachment` nadal działa, ale `upload-file` to kanoniczna nazwa działania.

### Identyfikatory wiadomości (krótkie vs pełne)

OpenClaw może udostępniać _krótkie_ identyfikatory wiadomości (np. `1`, `2`), aby oszczędzać tokeny.

- `MessageSid` / `ReplyToId` mogą być krótkimi identyfikatorami.
- `MessageSidFull` / `ReplyToIdFull` zawierają pełne identyfikatory dostawcy.
- Krótkie identyfikatory są przechowywane w pamięci; mogą wygasnąć po restarcie lub usunięciu z cache.
- Działania akceptują krótki lub pełny `messageId`, ale krótkie identyfikatory zwrócą błąd, jeśli nie są już dostępne.

Używaj pełnych identyfikatorów do trwałych automatyzacji i przechowywania:

- Szablony: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Kontekst: `MessageSidFull` / `ReplyToIdFull` w ładunkach przychodzących

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać zmienne szablonów.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Scalanie rozdzielonych wysyłek DM (komenda + URL w jednej wiadomości)

Gdy użytkownik wpisze w iMessage jednocześnie komendę i URL — np. `Dump https://example.com/article` — Apple rozdziela wysyłkę na **dwa osobne dostarczenia Webhooka**:

1. Wiadomość tekstowa (`"Dump"`).
2. Dymek podglądu URL (`"https://..."`) z obrazami podglądu OG jako załącznikami.

Te dwa Webhooki docierają do OpenClaw w odstępie około 0,8-2,0 s w większości konfiguracji. Bez scalania agent otrzymuje samą komendę w turze 1, odpowiada (często „wyślij mi URL”), a URL widzi dopiero w turze 2 — kiedy kontekst komendy jest już utracony.

`channels.bluebubbles.coalesceSameSenderDms` pozwala włączyć dla DM-a łączenie kolejnych Webhooków od tego samego nadawcy w jedną turę agenta. Czaty grupowe nadal są kluczowane per wiadomość, aby zachować strukturę tur dla wielu użytkowników.

### Kiedy włączyć

Włącz, gdy:

- udostępniasz Skills, które oczekują `command + payload` w jednej wiadomości (dump, paste, save, queue itp.),
- użytkownicy wklejają URL-e, obrazy lub dłuższe treści razem z komendami,
- akceptujesz dodatkowe opóźnienie tury DM (patrz niżej).

Pozostaw wyłączone, gdy:

- potrzebujesz minimalnego opóźnienia komend dla jednowyrazowych wyzwalaczy DM,
- wszystkie Twoje przepływy to jednorazowe komendy bez dalszych payloadów.

### Włączanie

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // włączenie (domyślnie: false)
    },
  },
}
```

Przy włączonej fladze i bez jawnego `messages.inbound.byChannel.bluebubbles` okno debounce rozszerza się do **2500 ms** (domyślna wartość bez scalania to 500 ms). Szersze okno jest wymagane — rytm rozdzielonej wysyłki Apple 0,8-2,0 s nie mieści się w ciaśniejszym domyślnym ustawieniu.

Aby samodzielnie dostroić okno:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms działa w większości konfiguracji; zwiększ do 4000 ms, jeśli Twój Mac jest wolny
        // lub ma presję pamięci (obserwowana przerwa może wtedy przekroczyć 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Kompromisy

- **Dodatkowe opóźnienie dla komend sterujących w DM.** Przy włączonej fladze wiadomości z komendami sterującymi w DM (takie jak `Dump`, `Save` itp.) czekają teraz do końca okna debounce przed wysłaniem, na wypadek gdyby miał nadejść Webhook z payloadem. Komendy w czatach grupowych nadal są wysyłane natychmiast.
- **Scalony wynik jest ograniczony** — scalony tekst ma limit 4000 znaków z jawnym znacznikiem `…[truncated]`; załączniki mają limit 20; wpisy źródłowe mają limit 10 (po przekroczeniu zachowywany jest pierwszy i najnowszy). Każdy źródłowy `messageId` nadal trafia do deduplikacji przychodzącej, więc późniejsze odtworzenie dowolnego pojedynczego zdarzenia przez MessagePoller zostanie rozpoznane jako duplikat.
- **Włączenie opcjonalne, per kanał.** Inne kanały (Telegram, WhatsApp, Slack, …) pozostają bez zmian.

### Scenariusze i to, co widzi agent

| Użytkownik tworzy wiadomość                                         | Apple dostarcza          | Flaga wyłączona (domyślnie)             | Flaga włączona + okno 2500 ms                                           |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (jedna wysyłka)                          | 2 Webhooki ~1 s odstępu  | Dwie tury agenta: samo „Dump”, potem URL | Jedna tura: scalony tekst `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (załącznik + tekst)                 | 2 Webhooki               | Dwie tury                               | Jedna tura: tekst + obraz                                               |
| `/status` (samodzielna komenda)                                     | 1 Webhook                | Natychmiastowe wysłanie                 | **Czeka do końca okna, potem wysyła**                                   |
| Samodzielnie wklejony URL                                           | 1 Webhook                | Natychmiastowe wysłanie                 | Natychmiastowe wysłanie (tylko jeden wpis w koszyku)                    |
| Tekst + URL wysłane celowo jako dwie osobne wiadomości, minuty później | 2 Webhooki poza oknem | Dwie tury                               | Dwie tury (okno wygasa pomiędzy nimi)                                   |
| Szybki zalew (>10 małych DM-ów w oknie)                             | N Webhooków              | N tur                                   | Jedna tura, ograniczony wynik (pierwszy + najnowszy, limity tekstu/załączników) |

### Rozwiązywanie problemów ze scalaniem rozdzielonych wysyłek

Jeśli flaga jest włączona, a rozdzielone wysyłki nadal docierają jako dwie tury, sprawdź każdą warstwę:

1. **Konfiguracja jest rzeczywiście załadowana.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Następnie `openclaw gateway restart` — flaga jest odczytywana przy tworzeniu rejestru debouncerów.

2. **Okno debounce jest wystarczająco szerokie dla Twojej konfiguracji.** Sprawdź log serwera BlueBubbles w `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Zmierz odstęp między wysłaniem tekstu w stylu `"Dump"` a następującym po nim wysłaniem `"https://..."; Attachments:`. Zwiększ `messages.inbound.byChannel.bluebubbles`, aby z zapasem objąć ten odstęp.

3. **Znaczniki czasu JSONL sesji ≠ nadejście Webhooka.** Znaczniki czasu zdarzeń sesji (`~/.openclaw/agents/<id>/sessions/*.jsonl`) odzwierciedlają moment, w którym Gateway przekazuje wiadomość agentowi, **a nie** moment nadejścia Webhooka. Kolejkowana druga wiadomość oznaczona `[Queued messages while agent was busy]` oznacza, że pierwsza tura nadal trwała, gdy nadszedł drugi Webhook — koszyk scalania został już opróżniony. Dostrajaj okno na podstawie logu serwera BB, a nie logu sesji.

4. **Presja pamięci spowalnia wysyłanie odpowiedzi.** Na mniejszych maszynach (8 GB) tury agenta mogą trwać na tyle długo, że koszyk scalania opróżni się przed zakończeniem odpowiedzi, a URL trafi jako kolejkowana druga tura. Sprawdź `memory_pressure` i `ps -o rss -p $(pgrep openclaw-gateway)`; jeśli Gateway przekracza ~500 MB RSS i kompresor jest aktywny, zamknij inne ciężkie procesy lub przejdź na większy host.

5. **Wysyłki z cytowaną odpowiedzią mają inną ścieżkę.** Jeśli użytkownik stuknął `Dump` jako **odpowiedź** na istniejący dymek URL (iMessage pokazuje plakietkę „1 Reply” na dymku Dump), URL znajduje się w `replyToBody`, a nie w drugim Webhooku. Scalanie tu nie ma zastosowania — to kwestia Skills/promptu, a nie debouncera.

## Block streaming

Kontroluje, czy odpowiedzi są wysyłane jako pojedyncza wiadomość, czy strumieniowane blokami:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // włącza block streaming (domyślnie wyłączone)
    },
  },
}
```

## Media + limity

- Załączniki przychodzące są pobierane i przechowywane w cache mediów.
- Limit mediów przez `channels.bluebubbles.mediaMaxMb` dla mediów przychodzących i wychodzących (domyślnie: 8 MB).
- Tekst wychodzący jest dzielony według `channels.bluebubbles.textChunkLimit` (domyślnie: 4000 znaków).

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje dostawcy:

- `channels.bluebubbles.enabled`: włącza/wyłącza kanał.
- `channels.bluebubbles.serverUrl`: bazowy URL REST API BlueBubbles.
- `channels.bluebubbles.password`: hasło API.
- `channels.bluebubbles.webhookPath`: ścieżka endpointu Webhooka (domyślnie: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).
- `channels.bluebubbles.allowFrom`: lista dozwolonych dla DM-ów (uchwyty, e-maile, numery E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (domyślnie: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista dozwolonych nadawców grupowych.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: na macOS opcjonalnie wzbogaca nienazwanych uczestników grupy danymi z lokalnych Contacts po przejściu bramek. Domyślnie: `false`.
- `channels.bluebubbles.groups`: konfiguracja dla każdej grupy (`requireMention` itp.).
- `channels.bluebubbles.sendReadReceipts`: wysyła potwierdzenia odczytu (domyślnie: `true`).
- `channels.bluebubbles.blockStreaming`: włącza block streaming (domyślnie: `false`; wymagane dla odpowiedzi strumieniowanych).
- `channels.bluebubbles.textChunkLimit`: rozmiar chunku wychodzącego w znakach (domyślnie: 4000).
- `channels.bluebubbles.sendTimeoutMs`: limit czasu na żądanie w ms dla wychodzących wysyłek tekstu przez `/api/v1/message/text` (domyślnie: 30000). Zwiększ w konfiguracjach macOS 26, gdzie wysyłki iMessage przez Private API mogą zatrzymywać się na 60+ sekund wewnątrz frameworka iMessage; na przykład `45000` lub `60000`. Proby, wyszukiwania czatów, reakcje, edycje i kontrole kondycji nadal używają obecnie krótszego domyślnego limitu 10 s; rozszerzenie tego na reakcje i edycje jest planowane w kolejnym kroku. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (domyślnie) dzieli tylko po przekroczeniu `textChunkLimit`; `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.bluebubbles.mediaMaxMb`: limit mediów przychodzących/wychodzących w MB (domyślnie: 8).
- `channels.bluebubbles.mediaLocalRoots`: jawna lista dozwolonych bezwzględnych katalogów lokalnych, z których można wysyłać lokalne ścieżki mediów. Wysyłki z lokalnych ścieżek są domyślnie odrzucane, chyba że to ustawienie zostanie skonfigurowane. Nadpisanie dla konta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: scala kolejne webhooki DM od tego samego nadawcy w jedną turę agenta, aby rozdzielona przez Apple wysyłka tekst+URL docierała jako jedna wiadomość (domyślnie: `false`). Zobacz [Scalanie rozdzielonych wysyłek DM](#coalescing-split-send-dms-command--url-in-one-composition), aby poznać scenariusze, strojenie okna i kompromisy. Po włączeniu, bez jawnego `messages.inbound.byChannel.bluebubbles`, rozszerza domyślne okno debounce przychodzące z 500 ms do 2500 ms.
- `channels.bluebubbles.historyLimit`: maksymalna liczba wiadomości grupowych dla kontekstu (0 wyłącza).
- `channels.bluebubbles.dmHistoryLimit`: limit historii DM.
- `channels.bluebubbles.actions`: włącza/wyłącza konkretne działania.
- `channels.bluebubbles.accounts`: konfiguracja wielu kont.

Powiązane opcje globalne:

- `agents.list[].groupChat.mentionPatterns` (lub `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresowanie / cele dostarczania

Dla stabilnego routingu preferuj `chat_guid`:

- `chat_guid:iMessage;-;+15555550123` (preferowane dla grup)
- `chat_id:123`
- `chat_identifier:...`
- Bezpośrednie uchwyty: `+15555550123`, `user@example.com`
  - Jeśli dla bezpośredniego uchwytu nie istnieje czat DM, OpenClaw utworzy go przez `POST /api/v1/chat/new`. Wymaga to włączenia BlueBubbles Private API.

### Routing iMessage vs SMS

Gdy ten sam uchwyt ma na Macu zarówno czat iMessage, jak i SMS (na przykład numer telefonu zarejestrowany w iMessage, który otrzymał też fallbacki w zielonych dymkach), OpenClaw preferuje czat iMessage i nigdy po cichu nie przełącza się na SMS. Aby wymusić czat SMS, użyj jawnego prefiksu celu `sms:` (na przykład `sms:+15555550123`). Uchwyty bez pasującego czatu iMessage nadal wysyłają przez czat zgłoszony przez BlueBubbles.

## Bezpieczeństwo

- Żądania Webhooka są uwierzytelniane przez porównanie parametrów zapytania lub nagłówków `guid`/`password` z `channels.bluebubbles.password`.
- Zachowaj hasło API i endpoint Webhooka w tajemnicy (traktuj je jak dane uwierzytelniające).
- Dla uwierzytelniania Webhooka BlueBubbles nie ma obejścia localhost. Jeśli przekazujesz ruch Webhooka przez proxy, zachowaj hasło BlueBubbles w żądaniu od początku do końca. `gateway.trustedProxies` nie zastępuje tutaj `channels.bluebubbles.password`. Zobacz [Bezpieczeństwo Gatewaya](/pl/gateway/security#reverse-proxy-configuration).
- Włącz HTTPS + reguły firewalla na serwerze BlueBubbles, jeśli udostępniasz go poza swoją siecią LAN.

## Rozwiązywanie problemów

- Jeśli zdarzenia wpisywania/odczytu przestają działać, sprawdź logi Webhooka BlueBubbles i zweryfikuj, czy ścieżka Gatewaya odpowiada `channels.bluebubbles.webhookPath`.
- Kody parowania wygasają po godzinie; użyj `openclaw pairing list bluebubbles` i `openclaw pairing approve bluebubbles <code>`.
- Reakcje wymagają BlueBubbles Private API (`POST /api/v1/message/react`); upewnij się, że wersja serwera je udostępnia.
- Edycja/cofnięcie wysłania wymagają macOS 13+ oraz zgodnej wersji serwera BlueBubbles. Na macOS 26 (Tahoe) edycja jest obecnie uszkodzona z powodu zmian w Private API.
- Aktualizacje ikon grup mogą być niestabilne na macOS 26 (Tahoe): API może zwrócić powodzenie, ale nowa ikona się nie zsynchronizuje.
- OpenClaw automatycznie ukrywa znane uszkodzone działania na podstawie wersji macOS serwera BlueBubbles. Jeśli edycja nadal pojawia się na macOS 26 (Tahoe), wyłącz ją ręcznie przez `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` jest włączone, ale rozdzielone wysyłki (np. `Dump` + URL) nadal docierają jako dwie tury: zobacz checklistę [rozwiązywania problemów ze scalaniem rozdzielonych wysyłek](#split-send-coalescing-troubleshooting) — typowe przyczyny to zbyt ciasne okno debounce, błędne odczytanie znaczników czasu logu sesji jako nadejścia Webhooka albo wysyłka z cytowaną odpowiedzią (która używa `replyToBody`, a nie drugiego Webhooka).
- Informacje o statusie/stanie: `openclaw status --all` lub `openclaw status --deep`.

Ogólne informacje o przepływie pracy kanałów znajdziesz w [Kanały](/pl/channels) i przewodniku [Plugins](/pl/tools/plugin).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
