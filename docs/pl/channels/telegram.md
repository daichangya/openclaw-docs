---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Stan obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-23T09:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowy do produkcji dla botów w DM + grupach przez grammY. Long polling jest trybem domyślnym; tryb webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla Telegram to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że identyfikator to dokładnie `@BotFather`).

    Uruchom `/newbot`, postępuj zgodnie z instrukcjami i zapisz token.

  </Step>

  <Step title="Skonfiguruj token i politykę DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Zmienna środowiskowa awaryjna: `TELEGRAM_BOT_TOKEN=...` (tylko konto domyślne).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w config/env, a następnie uruchom gateway.

  </Step>

  <Step title="Uruchom gateway i zatwierdź pierwszy DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` tak, aby odpowiadały Twojemu modelowi dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozstrzygania tokenu uwzględnia konto. W praktyce wartości z config mają pierwszeństwo przed awaryjną zmienną środowiskową, a `TELEGRAM_BOT_TOKEN` dotyczy tylko konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie używają **Trybu prywatności**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, wykonaj jedną z poniższych czynności:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń i ponownie dodaj bota w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty będące administratorami otrzymują wszystkie wiadomości grupowe, co jest przydatne dla zawsze aktywnego zachowania w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić/zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego identyfikatora nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne identyfikatory użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja wymaga wyłącznie numerycznych identyfikatorów użytkowników.
    Jeśli po aktualizacji Twoja konfiguracja zawiera wpisy allowlist typu `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegałeś na plikach allowlist z magazynu parowania, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych identyfikatorów).

    Dla botów jednego właściciela preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi identyfikatorami `allowFrom`, aby polityka dostępu była trwale zapisana w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp tylko do DM. Autoryzacja nadawcy w grupie nadal pochodzi z jawnych allowlist w konfiguracji.
    Jeśli chcesz, aby „jestem autoryzowany raz i działają zarówno DM, jak i polecenia grupowe”, umieść swój numeryczny identyfikator użytkownika Telegram w `channels.telegram.allowFrom`.

    ### Jak znaleźć swój identyfikator użytkownika Telegram

    Bezpieczniej (bez bota zewnętrznego):

    1. Wyślij DM do swojego bota.
    2. Uruchom `openclaw logs --follow`.
    3. Odczytaj `from.id`.

    Oficjalna metoda Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metoda zewnętrzna (mniej prywatna): `@userinfobot` lub `@getidsbot`.

  </Tab>

  <Tab title="Polityka grup i allowlisty">
    Obowiązują razem dwa mechanizmy kontroli:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - z `groupPolicy: "open"`: dowolna grupa może przejść kontrole identyfikatora grupy
         - z `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - skonfigurowane `groups`: działa jako allowlist (jawne identyfikatory lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` służy do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram wraca do `allowFrom`.
    Wpisy `groupAllowFrom` powinny być numerycznymi identyfikatorami użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj identyfikatorów czatów grup lub supergrup Telegram w `groupAllowFrom`. Ujemne identyfikatory czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawcy.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawców grupowych **nie** dziedziczy zatwierdzeń z magazynu parowania DM.
    Parowanie pozostaje tylko dla DM. Dla grup ustaw `groupAllowFrom` lub `allowFrom` dla grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram wraca do konfiguracji `allowFrom`, a nie do magazynu parowania.
    Praktyczny wzorzec dla botów jednego właściciela: ustaw swój identyfikator użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga środowiska uruchomieniowego: jeśli `channels.telegram` jest całkowicie nieobecne, domyślne zachowanie środowiska to fail-closed `groupPolicy="allowlist"`, chyba że jawnie ustawiono `channels.defaults.groupPolicy`.

    Przykład: zezwól dowolnemu członkowi w jednej konkretnej grupie:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Przykład: zezwól tylko określonym użytkownikom w jednej konkretnej grupie:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Częsty błąd: `groupAllowFrom` nie jest allowlistą grup Telegram.

      - Ujemne identyfikatory grup lub supergrup Telegram, takie jak `-1001234567890`, umieszczaj w `channels.telegram.groups`.
      - Identyfikatory użytkowników Telegram, takie jak `8734062810`, umieszczaj w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą wywoływać bota.
      - Używaj `groupAllowFrom: ["*"]` tylko wtedy, gdy chcesz, aby dowolny członek dozwolonej grupy mógł rozmawiać z botem.
    </Warning>

  </Tab>

  <Tab title="Zachowanie wzmianek">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wzmianka może pochodzić z:

    - natywnej wzmianki `@botusername`, lub
    - wzorców wzmianek w:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Przełączniki poleceń na poziomie sesji:

    - `/activation always`
    - `/activation mention`

    Aktualizują one tylko stan sesji. Dla trwałości użyj konfiguracji.

    Przykład trwałej konfiguracji:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Jak uzyskać identyfikator czatu grupowego:

    - prześlij wiadomość z grupy do `@userinfobot` / `@getidsbot`
    - lub odczytaj `chat.id` z `openclaw logs --follow`
    - lub sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie środowiska uruchomieniowego

- Telegram jest obsługiwany przez proces gateway.
- Routing jest deterministyczny: przychodzące wiadomości Telegram otrzymują odpowiedzi z powrotem w Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według identyfikatora grupy. Tematy forum dopinają `:topic:<threadId>`, aby utrzymać izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw trasuje je za pomocą kluczy sesji uwzględniających wątek i zachowuje identyfikator wątku dla odpowiedzi.
- Long polling używa grammY runner z sekwencjonowaniem per czat/per wątek. Ogólna współbieżność ujścia runnera używa `agents.defaults.maxConcurrent`.
- Restarty watchdoga long-polling są domyślnie wyzwalane po 120 sekundach bez zakończonego sygnału żywotności `getUpdates`. Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy Twoje wdrożenie nadal doświadcza fałszywych restartów z powodu zastoju polling podczas długotrwałej pracy. Wartość jest podawana w milisekundach i może wynosić od `30000` do `600000`; obsługiwane są nadpisania per konto.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Referencja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` ma wartość `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` mapuje się do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - `streaming.preview.toolProgress` kontroluje, czy aktualizacje narzędzi/postępu ponownie wykorzystują tę samą edytowaną wiadomość podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
    - starsze wartości boolean `channels.telegram.streamMode` i `streaming` są automatycznie mapowane

    Dla odpowiedzi tylko tekstowych:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla odpowiedzi złożonych (na przykład ładunków multimedialnych) OpenClaw wraca do zwykłego końcowego dostarczenia, a następnie usuwa wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielone od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport szkicu jest niedostępny/odrzucony, OpenClaw automatycznie wraca do `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i awaryjny powrót do HTML">
    Tekst wychodzący używa `parse_mode: "HTML"` Telegram.

    - Tekst w stylu Markdown jest renderowany do bezpiecznego dla Telegram HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania w Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw ponawia próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Polecenia natywne i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana podczas startu przez `setMyCommands`.

    Domyślne ustawienia poleceń natywnych:

    - `commands.native: "auto"` włącza polecenia natywne dla Telegram

    Dodawanie wpisów niestandardowych do menu poleceń:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Kopia zapasowa Git" },
        { command: "generate", description: "Utwórz obraz" },
      ],
    },
  },
}
```

    Zasady:

    - nazwy są normalizowane (usuwanie wiodącego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia plugin/Skills mogą nadal działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli polecenia natywne są wyłączone, wbudowane polecenia są usuwane. Polecenia niestandardowe/plugin nadal mogą się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal przekracza limit po przycięciu; ogranicz polecenia plugin/Skills/niestandardowe lub wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami sieci/pobierania zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (Plugin `device-pair`)

    Gdy Plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/scopes)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap utrzymuje podstawowy token Node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap mają prefiks roli, więc ta allowlista operatora spełnia tylko żądania operatora; role inne niż operator nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi szczegółami uwierzytelniania (na przykład role/scopes/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Przed zatwierdzeniem ponownie uruchom `/pair pending`.

    Więcej szczegółów: [Parowanie](/pl/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Przyciski inline">
    Skonfiguruj zakres klawiatury inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Nadpisanie per konto:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Zakresy:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (domyślnie)

    Starsze `capabilities: ["inlineButtons"]` mapuje się na `inlineButtons: "all"`.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Kliknięcia callback są przekazywane do agenta jako tekst:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Akcje wiadomości Telegram dla agentów i automatyzacji">
    Akcje narzędzi Telegram obejmują:

    - `sendMessage` (`to`, `content`, opcjonalnie `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcjonalnie `iconColor`, `iconCustomEmojiId`)

    Akcje wiadomości kanału udostępniają ergonomiczne aliasy (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrole bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysłania środowiska uruchomieniowego używają aktywnego migawkowego stanu config/sekretów (start/reload), więc ścieżki akcji nie wykonują doraźnego ponownego rozstrzygania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyniku:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` są nadal honorowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Forum supergrup:

    - klucze sesji tematów dopinają `:topic:<threadId>`
    - odpowiedzi i typing są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Szczególny przypadek tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje typing nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostały nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` dotyczy tylko tematu i nie jest dziedziczone z ustawień domyślnych grupy.

    **Trasowanie agenta per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Każdy temat ma wtedy własny klucz sesji: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Trwałe powiązanie tematu ACP**: Tematy forum mogą przypinać sesje harness ACP przez najwyższego poziomu typowane powiązania ACP (`bindings[]` z `type: "acp"` oraz `match.channel: "telegram"`, `peer.kind: "group"` i identyfikatorem z kwalifikacją tematu takim jak `-1001234567890:topic:42`). Obecnie ograniczone do tematów forum w grupach/supergrupach. Zobacz [Agenci ACP](/pl/tools/acp-agents).

    **Powiązane z wątkiem tworzenie ACP z czatu**: `/acp spawn <agent> --thread here|auto` wiąże bieżący temat z nową sesją ACP; dalsze wiadomości są kierowane tam bezpośrednio. OpenClaw przypina potwierdzenie utworzenia w temacie. Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu udostępnia `MessageThreadId` i `IsForum`. Czaty DM z `message_thread_id` zachowują routing DM, ale używają kluczy sesji uwzględniających wątek.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatka głosowa

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Wiadomości wideo

    Telegram rozróżnia pliki wideo i notatki wideo.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Notatki wideo nie obsługują podpisów; podany tekst wiadomości jest wysyłany osobno.

    ### Naklejki

    Obsługa przychodzących naklejek:

    - statyczne WEBP: pobierane i przetwarzane (placeholder `<media:sticker>`)
    - animowane TGS: pomijane
    - wideo WEBM: pomijane

    Pola kontekstu naklejek:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik cache naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane jednokrotnie (gdy to możliwe) i cache’owane, aby ograniczyć powtarzane wywołania wizji.

    Włącz akcje naklejek:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Akcja wysłania naklejki:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Wyszukiwanie naklejek w cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od ładunków wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują kontrole dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie dostarcza identyfikatorów wątków w aktualizacjach reakcji.
      - grupy nieforumowe są kierowane do sesji czatu grupowego
      - grupy forum są kierowane do sesji tematu ogólnego grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/webhook automatycznie zawiera `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje potwierdzające">
    `ackReaction` wysyła emoji potwierdzające, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozstrzygania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - awaryjny emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grup (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
    - `/config set` i `/config unset` (wymaga włączenia poleceń)

    Wyłącz:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    Domyślnie używany jest long polling. Dla trybu webhook ustaw `channels.telegram.webhookUrl` i `channels.telegram.webhookSecret`; opcjonalnie `webhookPath`, `webhookHost`, `webhookPort` (domyślnie `/telegram-webhook`, `127.0.0.1`, `8787`).

    Lokalny listener nasłuchuje na `127.0.0.1:8787`. Dla publicznego ingressu albo umieść reverse proxy przed lokalnym portem, albo jawnie ustaw `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Limity, ponowne próby i cele CLI">
    - Wartość domyślna `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar multimediów Telegram przychodzących i wychodzących.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta Telegram API (jeśli nie jest ustawione, obowiązuje wartość domyślna grammY).
    - `channels.telegram.pollingStallThresholdMs` domyślnie wynosi `120000`; dostrajaj w zakresie od `30000` do `600000` tylko dla fałszywie dodatnich restartów z powodu zastoju polling.
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza.
    - uzupełniający kontekst odpowiedzi/cytowania/przekazania jest obecnie przekazywany w otrzymanej postaci.
    - allowlisty Telegram przede wszystkim kontrolują, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji uzupełniającego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` dotyczy pomocników wysyłania Telegram (CLI/tools/actions) dla odzyskiwalnych wychodzących błędów API.

    Cel wysyłki CLI może być numerycznym identyfikatorem czatu lub nazwą użytkownika:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Ankiety Telegram używają `openclaw message poll` i obsługują tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi ankiet tylko dla Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje także:

    - `--presentation` z blokami `buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--pin` lub `--delivery '{"pin":true}'`, aby zażądać przypiętego dostarczenia, gdy bot może przypinać w tym czacie
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek animowanych multimediów

    Brakowanie akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłanie

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM zatwierdzających i może opcjonalnie publikować prompty w czacie lub temacie źródłowym. Zatwierdzający muszą być numerycznymi identyfikatorami użytkowników Telegram.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled` (włącza się automatycznie, gdy można rozstrzygnąć co najmniej jednego zatwierdzającego)
    - `channels.telegram.execApprovals.approvers` (wraca do numerycznych identyfikatorów właścicieli z `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (domyślnie) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Dostarczanie kanałowe pokazuje tekst polecenia w czacie; włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prompt trafi do tematu forum, OpenClaw zachowuje temat dla promptu zatwierdzenia i dalszej komunikacji. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzeń inline również wymagają, aby `channels.telegram.capabilities.inlineButtons` dopuszczało docelową powierzchnię (`dm`, `group` lub `all`). Identyfikatory zatwierdzeń z prefiksem `plugin:` są rozstrzygane przez zatwierdzenia plugin; pozostałe są najpierw rozstrzygane przez zatwierdzenia exec.

    Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrolki odpowiedzi na błędy

Gdy agent napotka błąd dostarczania lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go pominąć. To zachowanie kontrolują dwa klucze konfiguracji:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                           |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazny komunikat błędu do czatu. `silent` całkowicie pomija odpowiedzi z błędami. |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami z błędami do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi umożliwiać pełną widoczność.
      - BotFather: `/setprivacy` -> Disable
      - następnie usuń i ponownie dodaj bota do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzić jawne numeryczne identyfikatory grup; dla symbolu wieloznacznego `"*"` nie można sprawdzić członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - sprawdź logi: `openclaw logs --follow` pod kątem powodów pominięcia

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje nawet wtedy, gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia plugin/Skills/niestandardowe lub wyłącz menu natywne
    - `setMyCommands failed` z błędami sieci/pobierania zwykle wskazuje na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Niestabilność polling lub sieci">

    - Node 22+ + niestandardowy fetch/proxy może wywoływać natychmiastowe zachowanie abort, jeśli typy AbortSignal się nie zgadzają.
    - Niektóre hosty najpierw rozstrzygają `api.telegram.org` do IPv6; uszkodzone wychodzące IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` lub `Network request for 'getUpdates' failed!`, OpenClaw ponawia teraz takie przypadki jako odzyskiwalne błędy sieci.
    - Jeśli logi zawierają `Polling stall detected`, OpenClaw restartuje polling i odbudowuje transport Telegram po 120 sekundach bez zakończonego sygnału żywotności long-polling.
    - Zwiększaj `channels.telegram.pollingStallThresholdMs` tylko wtedy, gdy długotrwałe wywołania `getUpdates` są zdrowe, ale host nadal zgłasza fałszywe restarty z powodu zastoju polling. Uporczywe zastoje zwykle wskazują na problemy z proxy, DNS, IPv6 lub wychodzącym TLS między hostem a `api.telegram.org`.
    - Na hostach VPS z niestabilnym bezpośrednim wyjściem/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) i `dnsResultOrder=ipv4first`.
    - Jeśli host to WSL2 lub jawnie działa lepiej z zachowaniem tylko IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu testowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobrań multimediów Telegram. Jeśli zaufany fałszywy adres IP lub
      transparentne proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/specjalnego przeznaczenia adres podczas pobrań multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo włączenie jest dostępne per konto pod
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozstrzyga hosty multimediów Telegram na `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają zakres testowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochrony Telegram
      media SSRF. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak Clash, Mihomo lub routing fake-IP w Surge, gdy
      syntetyzują prywatne lub specjalnego przeznaczenia odpowiedzi poza zakresem
      testowym RFC 2544. Pozostaw wyłączone dla zwykłego publicznego dostępu Telegram przez internet.
    </Warning>

    - Nadpisania środowiskowe (tymczasowe):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Zweryfikuj odpowiedzi DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Więcej pomocy: [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting).

## Wskaźniki do referencji konfiguracji Telegram

Główna referencja:

- `channels.telegram.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczytaj token ze ścieżki zwykłego pliku. Symlinki są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: allowlista DM (numeryczne identyfikatory użytkowników Telegram). `allowlist` wymaga co najmniej jednego identyfikatora nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów i może odzyskać wpisy allowlist z plików magazynu parowania w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącz lub wyłącz tworzenie ankiet Telegram (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegram używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: allowlista nadawców grupowych (numeryczne identyfikatory użytkowników Telegram). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do identyfikatorów. Wpisy nienumeryczne są ignorowane podczas autoryzacji. Autoryzacja grupowa nie używa awaryjnego magazynu parowania DM (`2026.2.25+`).
- Priorytet wielu kont:
  - Gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (lub dodaj `channels.telegram.accounts.default`), aby jawnie określić routing domyślny.
  - Jeśli nie ustawiono żadnego z nich, OpenClaw wraca do pierwszego znormalizowanego identyfikatora konta, a `openclaw doctor` wyświetla ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` dotyczą tylko konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: domyślne ustawienia per grupa + allowlista (użyj `"*"` dla globalnych ustawień domyślnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie `groupPolicy` per grupa (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślna kontrola wymogu wzmianki.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięte = wszystkie Skills, puste = brak).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie allowlisty nadawców per grupa.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy prompt systemowy dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + właściwe tylko dla tematu `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruj ten temat do określonego agenta (nadpisuje routing na poziomie grupy i powiązań).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie `groupPolicy` per temat (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie kontroli wymogu wzmianki per temat.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania tematu ACP (zobacz [Agenci ACP](/pl/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruj tematy DM do określonego agenta (to samo zachowanie co w przypadku tematów forum).
- `channels.telegram.execApprovals.enabled`: włącz Telegram jako klient zatwierdzeń exec oparty na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: identyfikatory użytkowników Telegram, którzy mogą zatwierdzać lub odrzucać żądania exec. Opcjonalne, gdy `channels.telegram.allowFrom` lub bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegram, jeśli występuje.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr identyfikatora agenta dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (podciąg lub regex) dla przekazywanych promptów zatwierdzeń.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routingu zatwierdzeń exec Telegram i autoryzacji zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącz/wyłącz natywne polecenia Skills dla Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar fragmentu wychodzącego (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) lub `newline`, aby dzielić po pustych liniach (granicach akapitów) przed dzieleniem według długości.
- `channels.telegram.linkPreview`: przełącznik podglądów linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd strumienia na żywo; domyślnie: `partial`; `progress` mapuje się do `partial`; `block` to zgodność ze starszym trybem podglądu). Strumieniowanie podglądu Telegram używa jednej wiadomości podglądu, która jest edytowana w miejscu.
- `channels.telegram.streaming.preview.toolProgress`: ponownie użyj wiadomości podglądu na żywo dla aktualizacji narzędzi/postępu, gdy aktywne jest strumieniowanie podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
- `channels.telegram.mediaMaxMb`: limit multimediów Telegram przychodzących/wychodzących (MB, domyślnie: 100).
- `channels.telegram.retry`: polityka ponownych prób dla pomocników wysyłania Telegram (CLI/tools/actions) przy odzyskiwalnych wychodzących błędach API (liczba prób, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: nadpisanie Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, przy czym w WSL2 domyślnie wyłączone.
- `channels.telegram.network.dnsResultOrder`: nadpisanie kolejności wyników DNS (`ipv4first` lub `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne włączenie dla zaufanych środowisk fake-IP lub transparent proxy, w których pobrania multimediów Telegram rozstrzygają `api.telegram.org` do prywatnych/wewnętrznych/specjalnego przeznaczenia adresów poza domyślnie dozwolonym zakresem testowym RFC 2544.
- `channels.telegram.proxy`: URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącz tryb webhook (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret webhooka (wymagany, gdy ustawiono webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka webhooka (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokalny host powiązania webhooka (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port powiązania webhooka (domyślnie `8787`).
- `channels.telegram.actions.reactions`: kontrola reakcji narzędzi Telegram.
- `channels.telegram.actions.sendMessage`: kontrola wysyłania wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.deleteMessage`: kontrola usuwania wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.sticker`: kontrola akcji naklejek Telegram — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wywołują zdarzenia systemowe (domyślnie: `own`, jeśli nie ustawiono).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reakcji agenta (domyślnie: `minimal`, jeśli nie ustawiono).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami błędów do tego samego czatu (domyślnie: `60000`). Zapobiega spamowi błędami podczas awarii.

- [Referencja konfiguracji - Telegram](/pl/gateway/configuration-reference#telegram)

Pola Telegram o wysokim znaczeniu:

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; symlinki są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `streaming.preview.toolProgress`, `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- akcje/możliwości: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reakcje: `reactionNotifications`, `reactionLevel`
- błędy: `errorPolicy`, `errorCooldownMs`
- zapisy/historia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
