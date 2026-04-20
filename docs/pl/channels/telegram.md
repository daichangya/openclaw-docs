---
read_when:
    - Praca nad funkcjami Telegram lub Webhookami
summary: Status obsługi bota Telegram, możliwości i konfiguracja
title: Telegram
x-i18n:
    generated_at: "2026-04-20T09:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9903fae98bca0c345aa86d5c29015539c375442524a34d26bd28181470b8477
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: gotowe do użycia w środowisku produkcyjnym dla DM botów + grup przez grammY. Domyślnym trybem jest long polling; tryb Webhook jest opcjonalny.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla Telegram to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Utwórz token bota w BotFather">
    Otwórz Telegram i rozpocznij czat z **@BotFather** (upewnij się, że nazwa użytkownika to dokładnie `@BotFather`).

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

    Zmienna env jako fallback: `TELEGRAM_BOT_TOKEN=...` (tylko dla konta domyślnego).
    Telegram **nie** używa `openclaw channels login telegram`; skonfiguruj token w config/env, a następnie uruchom Gateway.

  </Step>

  <Step title="Uruchom Gateway i zatwierdź pierwszy DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kody parowania wygasają po 1 godzinie.

  </Step>

  <Step title="Dodaj bota do grupy">
    Dodaj bota do swojej grupy, a następnie ustaw `channels.telegram.groups` i `groupPolicy` zgodnie ze swoim modelem dostępu.
  </Step>
</Steps>

<Note>
Kolejność rozwiązywania tokenu uwzględnia konto. W praktyce wartości z config mają pierwszeństwo przed fallbackiem env, a `TELEGRAM_BOT_TOKEN` ma zastosowanie tylko do konta domyślnego.
</Note>

## Ustawienia po stronie Telegram

<AccordionGroup>
  <Accordion title="Tryb prywatności i widoczność w grupach">
    Boty Telegram domyślnie działają w **Privacy Mode**, który ogranicza, jakie wiadomości grupowe otrzymują.

    Jeśli bot ma widzieć wszystkie wiadomości grupowe, zrób jedno z poniższych:

    - wyłącz tryb prywatności przez `/setprivacy`, lub
    - nadaj botowi uprawnienia administratora grupy.

    Po przełączeniu trybu prywatności usuń bota i dodaj go ponownie w każdej grupie, aby Telegram zastosował zmianę.

  </Accordion>

  <Accordion title="Uprawnienia grupy">
    Status administratora jest kontrolowany w ustawieniach grupy Telegram.

    Boty z uprawnieniami administratora otrzymują wszystkie wiadomości grupowe, co jest przydatne przy stale aktywnym zachowaniu w grupie.

  </Accordion>

  <Accordion title="Przydatne przełączniki BotFather">

    - `/setjoingroups`, aby zezwolić lub zabronić dodawania do grup
    - `/setprivacy` dla zachowania widoczności w grupach

  </Accordion>
</AccordionGroup>

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.telegram.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist` (wymaga co najmniej jednego ID nadawcy w `allowFrom`)
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` akceptuje numeryczne ID użytkowników Telegram. Prefiksy `telegram:` / `tg:` są akceptowane i normalizowane.
    `dmPolicy: "allowlist"` z pustym `allowFrom` blokuje wszystkie DM i jest odrzucane przez walidację konfiguracji.
    Konfiguracja wymaga wyłącznie numerycznych ID użytkowników.
    Jeśli wykonano aktualizację i konfiguracja zawiera wpisy allowlist w postaci `@username`, uruchom `openclaw doctor --fix`, aby je rozwiązać (best-effort; wymaga tokenu bota Telegram).
    Jeśli wcześniej polegano na plikach allowlist w pairing-store, `openclaw doctor --fix` może odzyskać wpisy do `channels.telegram.allowFrom` w przepływach allowlist (na przykład gdy `dmPolicy: "allowlist"` nie ma jeszcze jawnych ID).

    Dla botów z jednym właścicielem preferuj `dmPolicy: "allowlist"` z jawnymi numerycznymi ID `allowFrom`, aby utrwalić politykę dostępu w konfiguracji (zamiast zależeć od wcześniejszych zatwierdzeń parowania).

    Częste nieporozumienie: zatwierdzenie parowania DM nie oznacza „ten nadawca jest autoryzowany wszędzie”.
    Parowanie przyznaje dostęp tylko do DM. Autoryzacja nadawców w grupach nadal pochodzi z jawnych allowlist w konfiguracji.
    Jeśli chcesz, aby „jestem autoryzowany raz i działają zarówno DM, jak i polecenia w grupie”, umieść swoje numeryczne ID użytkownika Telegram w `channels.telegram.allowFrom`.

    ### Jak znaleźć swoje ID użytkownika Telegram

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
    Stosowane są razem dwa mechanizmy:

    1. **Które grupy są dozwolone** (`channels.telegram.groups`)
       - brak konfiguracji `groups`:
         - przy `groupPolicy: "open"`: każda grupa może przejść kontrole ID grupy
         - przy `groupPolicy: "allowlist"` (domyślnie): grupy są blokowane, dopóki nie dodasz wpisów `groups` (lub `"*"`)
       - `groups` skonfigurowane: działa jako allowlist (jawne ID lub `"*"`)

    2. **Którzy nadawcy są dozwoleni w grupach** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (domyślnie)
       - `disabled`

    `groupAllowFrom` jest używane do filtrowania nadawców w grupach. Jeśli nie jest ustawione, Telegram używa `allowFrom` jako fallbacku.
    Wpisy `groupAllowFrom` powinny być numerycznymi ID użytkowników Telegram (`telegram:` / `tg:` są normalizowane).
    Nie umieszczaj ID czatów grupowych ani supergrup Telegram w `groupAllowFrom`. Ujemne ID czatów należą do `channels.telegram.groups`.
    Wpisy nienumeryczne są ignorowane przy autoryzacji nadawców.
    Granica bezpieczeństwa (`2026.2.25+`): autoryzacja nadawców grupowych **nie** dziedziczy zatwierdzeń z pairing-store dla DM.
    Parowanie pozostaje tylko dla DM. W przypadku grup ustaw `groupAllowFrom` albo `allowFrom` na poziomie grupy/tematu.
    Jeśli `groupAllowFrom` nie jest ustawione, Telegram używa fallbacku do `allowFrom` z konfiguracji, a nie do pairing store.
    Praktyczny wzorzec dla botów z jednym właścicielem: ustaw swoje ID użytkownika w `channels.telegram.allowFrom`, pozostaw `groupAllowFrom` nieustawione i zezwól na docelowe grupy w `channels.telegram.groups`.
    Uwaga środowiskowa: jeśli `channels.telegram` całkowicie nie istnieje, domyślne zachowanie środowiska to fail-closed `groupPolicy="allowlist"`, chyba że `channels.defaults.groupPolicy` jest ustawione jawnie.

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

    Przykład: zezwól tylko konkretnym użytkownikom w jednej konkretnej grupie:

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

      - Umieszczaj ujemne ID grup lub supergrup Telegram, takie jak `-1001234567890`, w `channels.telegram.groups`.
      - Umieszczaj ID użytkowników Telegram, takie jak `8734062810`, w `groupAllowFrom`, gdy chcesz ograniczyć, które osoby w dozwolonej grupie mogą uruchamiać bota.
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

    Aktualizują one tylko stan sesji. Użyj konfiguracji, jeśli chcesz trwałości.

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

    Jak uzyskać ID czatu grupowego:

    - prześlij wiadomość z grupy do `@userinfobot` / `@getidsbot`
    - albo odczytaj `chat.id` z `openclaw logs --follow`
    - albo sprawdź `getUpdates` w Bot API

  </Tab>
</Tabs>

## Zachowanie w środowisku uruchomieniowym

- Telegram jest obsługiwany przez proces Gateway.
- Routing jest deterministyczny: przychodzące odpowiedzi Telegram wracają do Telegram (model nie wybiera kanałów).
- Wiadomości przychodzące są normalizowane do współdzielonej obwiedni kanału z metadanymi odpowiedzi i placeholderami multimediów.
- Sesje grupowe są izolowane według ID grupy. Tematy forum dodają `:topic:<threadId>`, aby zachować izolację tematów.
- Wiadomości DM mogą zawierać `message_thread_id`; OpenClaw trasuje je przy użyciu kluczy sesji uwzględniających wątek i zachowuje ID wątku dla odpowiedzi.
- Long polling używa grammY runner z sekwencjonowaniem per chat/per thread. Ogólna współbieżność sink runnera używa `agents.defaults.maxConcurrent`.
- Telegram Bot API nie obsługuje potwierdzeń odczytu (`sendReadReceipts` nie ma zastosowania).

## Dokumentacja funkcji

<AccordionGroup>
  <Accordion title="Podgląd strumienia na żywo (edycje wiadomości)">
    OpenClaw może strumieniować częściowe odpowiedzi w czasie rzeczywistym:

    - czaty bezpośrednie: wiadomość podglądu + `editMessageText`
    - grupy/tematy: wiadomość podglądu + `editMessageText`

    Wymaganie:

    - `channels.telegram.streaming` to `off | partial | block | progress` (domyślnie: `partial`)
    - `progress` mapuje się do `partial` w Telegram (zgodność z nazewnictwem międzykanałowym)
    - starsze wartości `channels.telegram.streamMode` oraz boolean `streaming` są automatycznie mapowane

    Dla odpowiedzi zawierających wyłącznie tekst:

    - DM: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)
    - grupa/temat: OpenClaw zachowuje tę samą wiadomość podglądu i wykonuje końcową edycję w miejscu (bez drugiej wiadomości)

    Dla złożonych odpowiedzi (na przykład payloadów multimedialnych) OpenClaw przechodzi do normalnego końcowego dostarczenia, a następnie czyści wiadomość podglądu.

    Strumieniowanie podglądu jest oddzielone od strumieniowania blokowego. Gdy strumieniowanie blokowe jest jawnie włączone dla Telegram, OpenClaw pomija strumień podglądu, aby uniknąć podwójnego strumieniowania.

    Jeśli natywny transport szkicu jest niedostępny lub odrzucony, OpenClaw automatycznie przechodzi do `sendMessage` + `editMessageText`.

    Strumień rozumowania tylko dla Telegram:

    - `/reasoning stream` wysyła rozumowanie do podglądu na żywo podczas generowania
    - końcowa odpowiedź jest wysyłana bez tekstu rozumowania

  </Accordion>

  <Accordion title="Formatowanie i fallback HTML">
    Tekst wychodzący używa Telegram `parse_mode: "HTML"`.

    - Tekst w stylu Markdown jest renderowany do bezpiecznego dla Telegram HTML.
    - Surowy HTML modelu jest escapowany, aby ograniczyć błędy parsowania Telegram.
    - Jeśli Telegram odrzuci sparsowany HTML, OpenClaw podejmie ponowną próbę jako zwykły tekst.

    Podglądy linków są domyślnie włączone i można je wyłączyć przez `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Natywne polecenia i polecenia niestandardowe">
    Rejestracja menu poleceń Telegram jest obsługiwana przy starcie za pomocą `setMyCommands`.

    Domyślne ustawienia natywnych poleceń:

    - `commands.native: "auto"` włącza natywne polecenia dla Telegram

    Dodawanie niestandardowych wpisów menu poleceń:

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

    - nazwy są normalizowane (usunięcie wiodącego `/`, małe litery)
    - prawidłowy wzorzec: `a-z`, `0-9`, `_`, długość `1..32`
    - polecenia niestandardowe nie mogą nadpisywać poleceń natywnych
    - konflikty/duplikaty są pomijane i logowane

    Uwagi:

    - polecenia niestandardowe są tylko wpisami menu; nie implementują automatycznie zachowania
    - polecenia plugin/Skills nadal mogą działać po wpisaniu, nawet jeśli nie są pokazane w menu Telegram

    Jeśli natywne polecenia są wyłączone, wbudowane są usuwane. Polecenia niestandardowe/plugin nadal mogą się rejestrować, jeśli są skonfigurowane.

    Typowe błędy konfiguracji:

    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że menu Telegram nadal się przepełnia po przycięciu; ogranicz polecenia plugin/Skills/niestandardowe albo wyłącz `channels.telegram.commands.native`.
    - `setMyCommands failed` z błędami sieci/fetch zwykle oznacza, że wychodzący DNS/HTTPS do `api.telegram.org` jest zablokowany.

    ### Polecenia parowania urządzeń (`device-pair` plugin)

    Gdy plugin `device-pair` jest zainstalowany:

    1. `/pair` generuje kod konfiguracji
    2. wklej kod w aplikacji iOS
    3. `/pair pending` wyświetla oczekujące żądania (w tym role/zakresy)
    4. zatwierdź żądanie:
       - `/pair approve <requestId>` dla jawnego zatwierdzenia
       - `/pair approve`, gdy istnieje tylko jedno oczekujące żądanie
       - `/pair approve latest` dla najnowszego

    Kod konfiguracji zawiera krótkotrwały token bootstrap. Wbudowane przekazanie bootstrap zachowuje podstawowy token Node przy `scopes: []`; każdy przekazany token operatora pozostaje ograniczony do `operator.approvals`, `operator.read`, `operator.talk.secrets` i `operator.write`. Kontrole zakresów bootstrap mają prefiksy ról, więc ta allowlista operatora spełnia tylko żądania operatora; role inne niż operator nadal wymagają zakresów pod własnym prefiksem roli.

    Jeśli urządzenie ponowi próbę ze zmienionymi danymi uwierzytelniania (na przykład rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione, a nowe żądanie użyje innego `requestId`. Ponownie uruchom `/pair pending` przed zatwierdzeniem.

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

    Starsze `capabilities: ["inlineButtons"]` mapuje się do `inlineButtons: "all"`.

    Przykład akcji wiadomości:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Wybierz opcję:",
  buttons: [
    [
      { text: "Tak", callback_data: "yes" },
      { text: "Nie", callback_data: "no" },
    ],
    [{ text: "Anuluj", callback_data: "cancel" }],
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

    Kontrolki bramkowania:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (domyślnie: wyłączone)

    Uwaga: `edit` i `topic-create` są obecnie domyślnie włączone i nie mają osobnych przełączników `channels.telegram.actions.*`.
    Wysyłki w środowisku uruchomieniowym używają aktywnego snapshotu config/sekretów (start/reload), więc ścieżki akcji nie wykonują doraźnego ponownego rozwiązywania SecretRef przy każdym wysłaniu.

    Semantyka usuwania reakcji: [/tools/reactions](/pl/tools/reactions)

  </Accordion>

  <Accordion title="Tagi wątkowania odpowiedzi">
    Telegram obsługuje jawne tagi wątkowania odpowiedzi w wygenerowanym wyjściu:

    - `[[reply_to_current]]` odpowiada na wiadomość wyzwalającą
    - `[[reply_to:<id>]]` odpowiada na konkretny identyfikator wiadomości Telegram

    `channels.telegram.replyToMode` kontroluje obsługę:

    - `off` (domyślnie)
    - `first`
    - `all`

    Uwaga: `off` wyłącza niejawne wątkowanie odpowiedzi. Jawne tagi `[[reply_to_*]]` nadal są respektowane.

  </Accordion>

  <Accordion title="Tematy forum i zachowanie wątków">
    Supergrupy z forum:

    - klucze sesji tematów dodają `:topic:<threadId>`
    - odpowiedzi i wskaźnik pisania są kierowane do wątku tematu
    - ścieżka konfiguracji tematu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Przypadek specjalny tematu ogólnego (`threadId=1`):

    - wysyłanie wiadomości pomija `message_thread_id` (Telegram odrzuca `sendMessage(...thread_id=1)`)
    - akcje pisania nadal zawierają `message_thread_id`

    Dziedziczenie tematów: wpisy tematów dziedziczą ustawienia grupy, chyba że zostaną nadpisane (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` jest właściwością tylko dla tematów i nie jest dziedziczone z domyślnych ustawień grupy.

    **Routing agentów per temat**: Każdy temat może kierować do innego agenta przez ustawienie `agentId` w konfiguracji tematu. Daje to każdemu tematowi własny izolowany obszar roboczy, pamięć i sesję. Przykład:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Temat ogólny → agent main
                "3": { agentId: "zu" },        // Temat dev → agent zu
                "5": { agentId: "coder" }      // Przegląd kodu → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Każdy temat ma wtedy własny klucz sesji: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Trwałe powiązanie ACP z tematem**: Tematy forum mogą przypinać sesje harness ACP przez typowane powiązania ACP najwyższego poziomu:

    - `bindings[]` z `type: "acp"` i `match.channel: "telegram"`

    Przykład:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Obecnie dotyczy to tematów forum w grupach i supergrupach.

    **Uruchamianie ACP powiązanego z wątkiem z czatu**:

    - `/acp spawn <agent> --thread here|auto` może powiązać bieżący temat Telegram z nową sesją ACP.
    - Kolejne wiadomości w temacie są kierowane bezpośrednio do powiązanej sesji ACP (bez wymaganego `/acp steer`).
    - OpenClaw przypina w temacie wiadomość potwierdzającą uruchomienie po udanym powiązaniu.
    - Wymaga `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Kontekst szablonu obejmuje:

    - `MessageThreadId`
    - `IsForum`

    Zachowanie wątków DM:

    - prywatne czaty z `message_thread_id` zachowują routing DM, ale używają kluczy sesji i celów odpowiedzi uwzględniających wątek.

  </Accordion>

  <Accordion title="Audio, wideo i naklejki">
    ### Wiadomości audio

    Telegram rozróżnia notatki głosowe i pliki audio.

    - domyślnie: zachowanie pliku audio
    - tag `[[audio_as_voice]]` w odpowiedzi agenta wymusza wysłanie jako notatki głosowej

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

    Pola kontekstu naklejki:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Plik cache naklejek:

    - `~/.openclaw/telegram/sticker-cache.json`

    Naklejki są opisywane tylko raz (gdy to możliwe) i cachowane, aby ograniczyć powtarzane wywołania vision.

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

    Akcja wysyłania naklejki:

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
  query: "machający kot",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Powiadomienia o reakcjach">
    Reakcje Telegram przychodzą jako aktualizacje `message_reaction` (oddzielnie od payloadów wiadomości).

    Gdy są włączone, OpenClaw umieszcza w kolejce zdarzenia systemowe, takie jak:

    - `Dodano reakcję Telegram: 👍 przez Alice (@alice) do wiadomości 42`

    Konfiguracja:

    - `channels.telegram.reactionNotifications`: `off | own | all` (domyślnie: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (domyślnie: `minimal`)

    Uwagi:

    - `own` oznacza tylko reakcje użytkowników na wiadomości wysłane przez bota (best-effort przez cache wysłanych wiadomości).
    - Zdarzenia reakcji nadal respektują mechanizmy kontroli dostępu Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); nieautoryzowani nadawcy są odrzucani.
    - Telegram nie udostępnia identyfikatorów wątków w aktualizacjach reakcji.
      - grupy bez forum są kierowane do sesji czatu grupowego
      - grupy z forum są kierowane do sesji ogólnego tematu grupy (`:topic:1`), a nie do dokładnego tematu źródłowego

    `allowed_updates` dla polling/Webhook automatycznie zawiera `message_reaction`.

  </Accordion>

  <Accordion title="Reakcje ack">
    `ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

    Kolejność rozwiązywania:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback do emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

    Uwagi:

    - Telegram oczekuje emoji Unicode (na przykład "👀").
    - Użyj `""`, aby wyłączyć reakcję dla kanału lub konta.

  </Accordion>

  <Accordion title="Zapisy konfiguracji z zdarzeń i poleceń Telegram">
    Zapisy konfiguracji kanału są domyślnie włączone (`configWrites !== false`).

    Zapisy wyzwalane przez Telegram obejmują:

    - zdarzenia migracji grupy (`migrate_to_chat_id`) do aktualizacji `channels.telegram.groups`
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

  <Accordion title="Long polling vs Webhook">
    Domyślnie: long polling.

    Tryb Webhook:

    - ustaw `channels.telegram.webhookUrl`
    - ustaw `channels.telegram.webhookSecret` (wymagane, gdy ustawiono adres URL Webhook)
    - opcjonalnie `channels.telegram.webhookPath` (domyślnie `/telegram-webhook`)
    - opcjonalnie `channels.telegram.webhookHost` (domyślnie `127.0.0.1`)
    - opcjonalnie `channels.telegram.webhookPort` (domyślnie `8787`)

    Domyślny lokalny listener dla trybu Webhook nasłuchuje na `127.0.0.1:8787`.

    Jeśli publiczny punkt końcowy jest inny, umieść przed nim reverse proxy i skieruj `webhookUrl` na publiczny adres URL.
    Ustaw `webhookHost` (na przykład `0.0.0.0`), gdy celowo potrzebujesz zewnętrznego ruchu przychodzącego.

  </Accordion>

  <Accordion title="Limity, ponawianie prób i cele CLI">
    - Domyślna wartość `channels.telegram.textChunkLimit` to 4000.
    - `channels.telegram.chunkMode="newline"` preferuje granice akapitów (puste linie) przed dzieleniem według długości.
    - `channels.telegram.mediaMaxMb` (domyślnie 100) ogranicza rozmiar przychodzących i wychodzących multimediów Telegram.
    - `channels.telegram.timeoutSeconds` nadpisuje limit czasu klienta Telegram API (jeśli nie jest ustawione, obowiązuje domyślna wartość grammY).
    - historia kontekstu grupy używa `channels.telegram.historyLimit` lub `messages.groupChat.historyLimit` (domyślnie 50); `0` wyłącza tę funkcję.
    - uzupełniający kontekst odpowiedzi/cytatu/przekazania jest obecnie przekazywany w otrzymanej postaci.
    - allowlisty Telegram przede wszystkim kontrolują, kto może wywołać agenta, a nie stanowią pełnej granicy redakcji uzupełniającego kontekstu.
    - kontrolki historii DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfiguracja `channels.telegram.retry` ma zastosowanie do helperów wysyłania Telegram (CLI/narzędzia/akcje) dla odzyskiwalnych błędów wychodzących API.

    Cel wysyłania CLI może być numerycznym ID czatu albo nazwą użytkownika:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Polling Telegram używa `openclaw message poll` i obsługuje tematy forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flagi poll tylko dla Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` dla tematów forum (lub użyj celu `:topic:`)

    Wysyłanie Telegram obsługuje także:

    - `--buttons` dla klawiatur inline, gdy pozwala na to `channels.telegram.capabilities.inlineButtons`
    - `--force-document`, aby wysyłać wychodzące obrazy i GIF-y jako dokumenty zamiast skompresowanych zdjęć lub przesyłek animowanych multimediów

    Bramy akcji:

    - `channels.telegram.actions.sendMessage=false` wyłącza wychodzące wiadomości Telegram, w tym ankiety
    - `channels.telegram.actions.poll=false` wyłącza tworzenie ankiet Telegram, pozostawiając włączone zwykłe wysyłanie

  </Accordion>

  <Accordion title="Zatwierdzenia exec w Telegram">
    Telegram obsługuje zatwierdzenia exec w DM osób zatwierdzających i może opcjonalnie publikować prompty zatwierdzenia w źródłowym czacie lub temacie.

    Ścieżka konfiguracji:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcjonalne; fallback do numerycznych ID właścicieli wywnioskowanych z `allowFrom` i bezpośredniego `defaultTo`, gdy to możliwe)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
    - `agentFilter`, `sessionFilter`

    Osoby zatwierdzające muszą mieć numeryczne ID użytkowników Telegram. Telegram automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i można rozwiązać co najmniej jedną osobę zatwierdzającą — albo z `execApprovals.approvers`, albo z konfiguracji numerycznego właściciela konta (`allowFrom` i `defaultTo` dla wiadomości bezpośrednich). Ustaw `enabled: false`, aby jawnie wyłączyć Telegram jako natywnego klienta zatwierdzania. W przeciwnym razie żądania zatwierdzenia przechodzą do innych skonfigurowanych ścieżek zatwierdzania albo do polityki fallback dla zatwierdzeń exec.

    Telegram renderuje także współdzielone przyciski zatwierdzania używane przez inne kanały czatu. Natywny adapter Telegram głównie dodaje routing DM dla osób zatwierdzających, fanout kanału/tematu oraz wskazówki pisania przed dostarczeniem.
    Gdy te przyciski są obecne, stanowią główny UX zatwierdzania; OpenClaw
    powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi,
    że zatwierdzenia w czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

    Zasady dostarczania:

    - `target: "dm"` wysyła prompty zatwierdzenia tylko do rozwiązanych DM osób zatwierdzających
    - `target: "channel"` wysyła prompt z powrotem do źródłowego czatu/tematu Telegram
    - `target: "both"` wysyła do DM osób zatwierdzających i do źródłowego czatu/tematu

    Tylko rozwiązane osoby zatwierdzające mogą zatwierdzać lub odrzucać. Osoby niezatwierdzające nie mogą używać `/approve` ani przycisków zatwierdzania Telegram.

    Zachowanie rozwiązywania zatwierdzeń:

    - ID z prefiksem `plugin:` są zawsze rozwiązywane przez zatwierdzenia plugin.
    - Inne ID najpierw próbują `exec.approval.resolve`.
    - Jeśli Telegram jest również autoryzowany do zatwierdzeń plugin, a Gateway zgłasza, że
      zatwierdzenie exec jest nieznane lub wygasłe, Telegram ponawia próbę raz przez
      `plugin.approval.resolve`.
    - Rzeczywiste odmowy/błędy zatwierdzeń exec nie przechodzą po cichu do rozwiązywania
      zatwierdzeń plugin.

    Dostarczanie do kanału pokazuje tekst polecenia na czacie, więc włączaj `channel` lub `both` tylko w zaufanych grupach/tematach. Gdy prompt trafia do tematu forum, OpenClaw zachowuje temat zarówno dla promptu zatwierdzenia, jak i dla dalszych działań po zatwierdzeniu. Zatwierdzenia exec domyślnie wygasają po 30 minutach.

    Przyciski zatwierdzania inline zależą także od tego, czy `channels.telegram.capabilities.inlineButtons` pozwala na docelową powierzchnię (`dm`, `group` lub `all`).

    Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrola odpowiedzi na błędy

Gdy agent napotka błąd dostarczenia lub dostawcy, Telegram może odpowiedzieć tekstem błędu albo go ukryć. Dwa klucze konfiguracji sterują tym zachowaniem:

| Klucz                               | Wartości          | Domyślnie | Opis                                                                                           |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | `reply` wysyła przyjazny komunikat o błędzie do czatu. `silent` całkowicie wycisza odpowiedzi z błędem. |
| `channels.telegram.errorCooldownMs` | liczba (ms)       | `60000`   | Minimalny czas między odpowiedziami z błędem do tego samego czatu. Zapobiega spamowi błędami podczas awarii. |

Obsługiwane są nadpisania per konto, per grupa i per temat (to samo dziedziczenie co dla innych kluczy konfiguracji Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // wycisz błędy w tej grupie
        },
      },
    },
  },
}
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości grupowe bez wzmianki">

    - Jeśli `requireMention=false`, tryb prywatności Telegram musi pozwalać na pełną widoczność.
      - BotFather: `/setprivacy` -> Wyłącz
      - następnie usuń bota i dodaj go ponownie do grupy
    - `openclaw channels status` ostrzega, gdy konfiguracja oczekuje wiadomości grupowych bez wzmianki.
    - `openclaw channels status --probe` może sprawdzać jawne numeryczne ID grup; symbol wieloznaczny `"*"` nie może być sprawdzany pod kątem członkostwa.
    - szybki test sesji: `/activation always`.

  </Accordion>

  <Accordion title="Bot w ogóle nie widzi wiadomości grupowych">

    - gdy istnieje `channels.telegram.groups`, grupa musi być wymieniona (lub musi zawierać `"*"`)
    - zweryfikuj członkostwo bota w grupie
    - sprawdź logi: `openclaw logs --follow` pod kątem przyczyn pomijania

  </Accordion>

  <Accordion title="Polecenia działają częściowo albo wcale">

    - autoryzuj tożsamość nadawcy (parowanie i/lub numeryczne `allowFrom`)
    - autoryzacja poleceń nadal obowiązuje, nawet gdy polityka grupy to `open`
    - `setMyCommands failed` z `BOT_COMMANDS_TOO_MUCH` oznacza, że natywne menu ma zbyt wiele wpisów; ogranicz polecenia plugin/Skills/niestandardowe albo wyłącz natywne menu
    - `setMyCommands failed` z błędami sieci/fetch zwykle wskazuje na problemy z osiągalnością DNS/HTTPS do `api.telegram.org`

  </Accordion>

  <Accordion title="Polling lub niestabilność sieci">

    - Node 22+ + niestandardowy fetch/proxy mogą wywoływać natychmiastowe przerwanie, jeśli typy AbortSignal nie są zgodne.
    - Niektóre hosty najpierw rozwiązują `api.telegram.org` do IPv6; uszkodzony wychodzący IPv6 może powodować sporadyczne błędy Telegram API.
    - Jeśli logi zawierają `TypeError: fetch failed` albo `Network request for 'getUpdates' failed!`, OpenClaw teraz ponawia je jako odzyskiwalne błędy sieciowe.
    - Na hostach VPS z niestabilnym bezpośrednim wyjściem/TLS kieruj wywołania Telegram API przez `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ domyślnie używa `autoSelectFamily=true` (z wyjątkiem WSL2) i `dnsResultOrder=ipv4first`.
    - Jeśli host to WSL2 albo jawnie działa lepiej tylko z IPv4, wymuś wybór rodziny:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Odpowiedzi z zakresu benchmarkowego RFC 2544 (`198.18.0.0/15`) są już domyślnie dozwolone
      dla pobrań multimediów Telegram. Jeśli zaufany fałszywy IP lub
      transparentne proxy przepisuje `api.telegram.org` na inny
      prywatny/wewnętrzny/adres specjalnego przeznaczenia podczas pobierania multimediów, możesz
      włączyć obejście tylko dla Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - To samo ustawienie opt-in jest dostępne per konto w
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jeśli proxy rozwiązuje hosty multimediów Telegram do `198.18.x.x`, najpierw pozostaw
      niebezpieczną flagę wyłączoną. Multimedia Telegram już domyślnie dopuszczają zakres benchmarkowy RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` osłabia ochronę Telegram
      przed SSRF w multimediach. Używaj tego tylko w zaufanych środowiskach proxy kontrolowanych przez operatora,
      takich jak fake-IP routing w Clash, Mihomo lub Surge, gdy syntetyzują one
      odpowiedzi prywatne lub specjalnego przeznaczenia poza zakresem benchmarkowym RFC 2544. Dla zwykłego publicznego dostępu do Telegram przez internet pozostaw tę opcję wyłączoną.
    </Warning>

    - Nadpisania przez zmienne środowiskowe (tymczasowe):
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

## Wskaźniki do dokumentacji referencyjnej konfiguracji Telegram

Główna dokumentacja referencyjna:

- `channels.telegram.enabled`: włącz/wyłącz uruchamianie kanału.
- `channels.telegram.botToken`: token bota (BotFather).
- `channels.telegram.tokenFile`: odczytaj token ze ścieżki do zwykłego pliku. Dowiązania symboliczne są odrzucane.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.telegram.allowFrom`: allowlista DM (numeryczne ID użytkowników Telegram). `allowlist` wymaga co najmniej jednego ID nadawcy. `open` wymaga `"*"`. `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do ID i może odzyskać wpisy allowlist z plików pairing-store w przepływach migracji allowlist.
- `channels.telegram.actions.poll`: włącz lub wyłącz tworzenie ankiet Telegram (domyślnie: włączone; nadal wymaga `sendMessage`).
- `channels.telegram.defaultTo`: domyślny cel Telegram używany przez CLI `--deliver`, gdy nie podano jawnego `--reply-to`.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist).
- `channels.telegram.groupAllowFrom`: allowlista nadawców grupowych (numeryczne ID użytkowników Telegram). `openclaw doctor --fix` może rozwiązać starsze wpisy `@username` do ID. Wpisy nienumeryczne są ignorowane podczas autoryzacji. Autoryzacja grupowa nie używa fallbacku pairing-store dla DM (`2026.2.25+`).
- Priorytet dla wielu kont:
  - Gdy skonfigurowano dwa lub więcej identyfikatorów kont, ustaw `channels.telegram.defaultAccount` (lub uwzględnij `channels.telegram.accounts.default`), aby jawnie określić domyślny routing.
  - Jeśli nie ustawiono żadnego z nich, OpenClaw używa fallbacku do pierwszego znormalizowanego ID konta, a `openclaw doctor` wyświetla ostrzeżenie.
  - `channels.telegram.accounts.default.allowFrom` i `channels.telegram.accounts.default.groupAllowFrom` mają zastosowanie tylko do konta `default`.
  - Nazwane konta dziedziczą `channels.telegram.allowFrom` i `channels.telegram.groupAllowFrom`, gdy wartości na poziomie konta nie są ustawione.
  - Nazwane konta nie dziedziczą `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: ustawienia domyślne per grupa + allowlista (użyj `"*"` dla globalnych ustawień domyślnych).
  - `channels.telegram.groups.<id>.groupPolicy`: nadpisanie per grupa dla groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: domyślna bramka wzmianki.
  - `channels.telegram.groups.<id>.skills`: filtr Skills (pominięte = wszystkie Skills, puste = brak).
  - `channels.telegram.groups.<id>.allowFrom`: nadpisanie allowlisty nadawców per grupa.
  - `channels.telegram.groups.<id>.systemPrompt`: dodatkowy system prompt dla grupy.
  - `channels.telegram.groups.<id>.enabled`: wyłącza grupę, gdy ma wartość `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: nadpisania per temat (pola grupy + właściwość tylko dla tematu `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: kieruje ten temat do konkretnego agenta (nadpisuje routing na poziomie grupy i bindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: nadpisanie per temat dla groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: nadpisanie bramki wzmianki per temat.
- najwyższego poziomu `bindings[]` z `type: "acp"` i kanonicznym identyfikatorem tematu `chatId:topic:topicId` w `match.peer.id`: pola trwałego powiązania ACP z tematem (zobacz [ACP Agents](/pl/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: kieruje tematy DM do konkretnego agenta (takie samo zachowanie jak dla tematów forum).
- `channels.telegram.execApprovals.enabled`: włącza Telegram jako klienta zatwierdzania exec opartego na czacie dla tego konta.
- `channels.telegram.execApprovals.approvers`: ID użytkowników Telegram, którzy mogą zatwierdzać lub odrzucać żądania exec. Opcjonalne, gdy `channels.telegram.allowFrom` lub bezpośrednie `channels.telegram.defaultTo` już identyfikuje właściciela.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (domyślnie: `dm`). `channel` i `both` zachowują źródłowy temat Telegram, jeśli występuje.
- `channels.telegram.execApprovals.agentFilter`: opcjonalny filtr ID agenta dla przekazywanych promptów zatwierdzania.
- `channels.telegram.execApprovals.sessionFilter`: opcjonalny filtr klucza sesji (podciąg lub regex) dla przekazywanych promptów zatwierdzania.
- `channels.telegram.accounts.<account>.execApprovals`: nadpisanie per konto dla routingu zatwierdzeń exec Telegram i autoryzacji osób zatwierdzających.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (domyślnie: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: nadpisanie per konto.
- `channels.telegram.commands.nativeSkills`: włącz/wyłącz natywne polecenia Skills w Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (domyślnie: `off`).
- `channels.telegram.textChunkLimit`: rozmiar wychodzących fragmentów (znaki).
- `channels.telegram.chunkMode`: `length` (domyślnie) albo `newline`, aby dzielić po pustych liniach (granice akapitów) przed dzieleniem według długości.
- `channels.telegram.linkPreview`: przełącznik podglądów linków dla wiadomości wychodzących (domyślnie: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (podgląd strumienia na żywo; domyślnie: `partial`; `progress` mapuje się do `partial`; `block` to zgodność ze starszym trybem podglądu). Strumieniowanie podglądu Telegram używa jednej wiadomości podglądu, która jest edytowana w miejscu.
- `channels.telegram.mediaMaxMb`: limit przychodzących/wychodzących multimediów Telegram (MB, domyślnie: 100).
- `channels.telegram.retry`: polityka ponawiania prób dla helperów wysyłania Telegram (CLI/narzędzia/akcje) przy odzyskiwalnych wychodzących błędach API (próby, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: nadpisuje Node autoSelectFamily (true=włącz, false=wyłącz). Domyślnie włączone w Node 22+, przy czym w WSL2 domyślnie wyłączone.
- `channels.telegram.network.dnsResultOrder`: nadpisuje kolejność wyników DNS (`ipv4first` lub `verbatim`). Domyślnie `ipv4first` w Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: niebezpieczne ustawienie opt-in dla zaufanych środowisk fake-IP lub transparent-proxy, w których pobrania multimediów Telegram rozwiązują `api.telegram.org` do adresów prywatnych/wewnętrznych/specjalnego przeznaczenia poza domyślnie dozwolonym zakresem benchmarkowym RFC 2544.
- `channels.telegram.proxy`: adres URL proxy dla wywołań Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: włącza tryb Webhook (wymaga `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: sekret Webhook (wymagany, gdy ustawiono webhookUrl).
- `channels.telegram.webhookPath`: lokalna ścieżka Webhook (domyślnie `/telegram-webhook`).
- `channels.telegram.webhookHost`: lokalny host bindowania Webhook (domyślnie `127.0.0.1`).
- `channels.telegram.webhookPort`: lokalny port bindowania Webhook (domyślnie `8787`).
- `channels.telegram.actions.reactions`: bramka reakcji narzędzi Telegram.
- `channels.telegram.actions.sendMessage`: bramka wysyłania wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.deleteMessage`: bramka usuwania wiadomości przez narzędzia Telegram.
- `channels.telegram.actions.sticker`: bramka akcji naklejek Telegram — wysyłanie i wyszukiwanie (domyślnie: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontroluje, które reakcje wyzwalają zdarzenia systemowe (domyślnie: `own`, gdy nie ustawiono).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontroluje możliwości reagowania agenta (domyślnie: `minimal`, gdy nie ustawiono).
- `channels.telegram.errorPolicy`: `reply | silent` — kontroluje zachowanie odpowiedzi na błędy (domyślnie: `reply`). Obsługiwane są nadpisania per konto/grupa/temat.
- `channels.telegram.errorCooldownMs`: minimalna liczba ms między odpowiedziami z błędem do tego samego czatu (domyślnie: `60000`). Zapobiega spamowi błędami podczas awarii.

- [Dokumentacja konfiguracji - Telegram](/pl/gateway/configuration-reference#telegram)

Pola Telegram o wysokim znaczeniu:

- uruchamianie/uwierzytelnianie: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` musi wskazywać zwykły plik; dowiązania symboliczne są odrzucane)
- kontrola dostępu: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, najwyższego poziomu `bindings[]` (`type: "acp"`)
- zatwierdzenia exec: `execApprovals`, `accounts.*.execApprovals`
- polecenia/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- wątki/odpowiedzi: `replyToMode`
- strumieniowanie: `streaming` (podgląd), `blockStreaming`
- formatowanie/dostarczanie: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/sieć: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
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
