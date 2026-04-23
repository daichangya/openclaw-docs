---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu Socket/HTTP w Slack
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T09:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: gotowe do użycia w środowisku produkcyjnym dla wiadomości bezpośrednich i kanałów przez integracje aplikacji Slack. Trybem domyślnym jest Socket Mode; obsługiwane są także adresy URL żądań HTTP.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości bezpośrednie w Slack domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawcze.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wskaż obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) poniżej i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z zakresem `connections:write`
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Skonfiguruj OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Zmienna środowiskowa zapasowa (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Adresy URL żądań HTTP">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wskaż obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj adresy URL przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Skonfiguruj OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Używaj unikalnych ścieżek webhooków dla wielu kont HTTP

        Nadaj każdemu kontu odrębną wartość `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały ze sobą.
        </Note>

      </Step>

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista kontrolna manifestu i zakresów

<Tabs>
  <Tab title="Socket Mode (domyślnie)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="Adresy URL żądań HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Dodatkowe ustawienia manifestu

Udostępniaj różne funkcje rozszerzające powyższe ustawienia domyślne.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia slash">

    Wiele [natywnych poleceń slash](#commands-and-slash-behavior) może być używanych zamiast pojedynczego skonfigurowanego polecenia, z pewnymi niuansami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń slash.

    Zastąp istniejącą sekcję `features.slash_commands` wybranym podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (domyślnie)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="Adresy URL żądań HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Rozpocznij nową sesję",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Zresetuj bieżącą sesję",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Skondensuj kontekst sesji",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Zatrzymaj bieżące uruchomienie",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Zarządzaj wygaśnięciem powiązania z wątkiem",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Ustaw poziom myślenia",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Przełącz szczegółowe wyjście",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Pokaż lub ustaw tryb szybki",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Przełącz widoczność rozumowania",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Przełącz tryb podwyższony",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Pokaż lub ustaw domyślne wartości exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Pokaż lub ustaw model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Wyświetl dostawców lub modele dla dostawcy",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Pokaż krótkie podsumowanie pomocy",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Pokaż wygenerowany katalog poleceń",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Pokaż, czego bieżący agent może teraz używać",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Pokaż stan runtime, w tym użycie/limit dostawcy, jeśli jest dostępny",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Wyjaśnij, jak składany jest kontekst",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Pokaż tożsamość nadawcy",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Uruchom umiejętność po nazwie",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Zadaj pytanie poboczne bez zmiany kontekstu sesji",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Steruj stopką użycia lub pokaż podsumowanie kosztów",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Opcjonalne zakresy authoringu (operacje zapisu)">
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowa nazwa użytkownika i ikona) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne zakresy tokena użytkownika (operacje odczytu)">
    Jeśli konfigurujesz `channels.slack.userToken`, typowe zakresy odczytu to:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jeśli polegasz na odczytach z wyszukiwania Slack)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe ciągi znaków
  lub obiekty SecretRef.
- Tokeny w konfiguracji mają pierwszeństwo przed zapasowymi wartościami ze zmiennych środowiskowych.
- Zapasowe wartości środowiskowe `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` mają zastosowanie tylko do konta domyślnego.
- `userToken` (`xoxp-...`) jest tylko konfiguracyjny (bez zapasowej wartości ze środowiska) i domyślnie działa w trybie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki stanu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla każdego poświadczenia (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Stan ma wartość `available`, `configured_unavailable` lub `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne niejawne źródło sekretu, ale bieżąca ścieżka polecenia/runtime
  nie mogła rozpoznać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku działań/odczytów katalogu preferowany może być token użytkownika, jeśli jest skonfigurowany. Do zapisów nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Działania i bramki

Działania Slack są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy działań w bieżących narzędziach Slack:

| Group      | Domyślnie |
| ---------- | --------- |
| messages   | włączone  |
| reactions  | włączone  |
| pins       | włączone  |
| memberInfo | włączone  |
| emojiList  | włączone  |

Bieżące działania wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` oraz `emoji-list`.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasada DM">
    `channels.slack.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich (starsza nazwa: `channels.slack.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`; starsza nazwa: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom` (preferowane)
    - `dm.allowFrom` (starsza nazwa)
    - `dm.groupEnabled` (grupowe wiadomości bezpośrednie domyślnie false)
    - `dm.groupChannels` (opcjonalna allowlista MPIM)

    Pierwszeństwo dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` ma zastosowanie tylko do konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Parowanie w wiadomościach bezpośrednich używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasada kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlista kanałów znajduje się w `channels.slack.channels` i powinna używać stabilnych identyfikatorów kanałów.

    Uwaga runtime: jeśli `channels.slack` jest całkowicie nieobecne (konfiguracja tylko ze środowiska), runtime wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logach (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozpoznawanie nazw/ID:

    - wpisy allowlisty kanałów i allowlisty DM są rozpoznawane przy uruchomieniu, jeśli dostęp tokena na to pozwala
    - nierozpoznane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów są domyślnie oparte najpierw na ID; bezpośrednie dopasowanie nazwy użytkownika/slugu wymaga `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Wzmianki i użytkownicy kanałów">
    Wiadomości kanałowe są domyślnie kontrolowane przez wymóg wzmianki.

    Źródła wzmianki:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrolki dla kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozpoznanie przy uruchomieniu lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlista)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` lub symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko do `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- Wiadomości bezpośrednie są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main` wiadomości bezpośrednie Slack zwijają się do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości w wątku jest pobieranych przy uruchamianiu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy ma wartość `true`, wycisza niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczy bot, omijają kontrolę `requireMention`.

Kontrolki odpowiedzi w wątkach:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla `direct|group|channel`
- starsze ustawienie zapasowe dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Uwaga: `replyToMode="off"` wyłącza **całe** odpowiadanie w wątkach w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi są nadal honorowane w trybie `"off"`. Ta różnica odzwierciedla modele wątków platform: w Slack wątki ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi w Telegram pozostają widoczne w głównym przepływie czatu.

Skoncentrowane odpowiedzi w wątkach Slack są kierowane przez powiązaną sesję ACP, jeśli taka istnieje, zamiast przygotowywać odpowiedź względem domyślnej powłoki agenta. Dzięki temu powiązania `/focus` i `/acp spawn ... --bind here` pozostają nienaruszone dla kolejnych wiadomości w wątku.

## Reakcje potwierdzające

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozpoznawania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- zapasowo emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie `"👀"`)

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastąp tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst stanu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy aktywny jest podgląd wersji roboczej, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Aby pojawiło się natywne strumieniowanie tekstu i stan wątku asystenta Slack, musi być dostępny wątek odpowiedzi. Wybór wątku nadal podlega `replyToMode`.
- Główne wiadomości kanałów i czatów grupowych nadal mogą używać zwykłego podglądu wersji roboczej, gdy natywne strumieniowanie jest niedostępne.
- Wiadomości bezpośrednie Slack na najwyższym poziomie domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątku lub `typingReaction`, jeśli chcesz tam widocznego postępu.
- Multimedia i ładunki inne niż tekst wracają do zwykłego dostarczania.
- Końcowe wiadomości z multimediami/błędami anulują oczekujące edycje podglądu bez opróżniania tymczasowej wersji roboczej; kwalifikujące się końcowe wiadomości tekstowe/blokowe są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do zwykłego dostarczania pozostałych ładunków.
- Kanały Slack Connect, które odrzucają strumień, zanim SDK opróżni lokalny bufor, wracają do zwykłych odpowiedzi Slack, dzięki czemu krótkie odpowiedzi nie są po cichu gubione ani zgłaszane jako dostarczone, zanim Slack je potwierdzi.

Użyj podglądu wersji roboczej zamiast natywnego strumieniowania tekstu Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Starsze klucze:

- `channels.slack.streamMode` (`replace | status_final | append`) jest automatycznie migrowane do `channels.slack.streaming.mode`.
- wartość logiczna `channels.slack.streaming` jest automatycznie migrowana do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest automatycznie migrowane do `channels.slack.streaming.nativeTransport`.

## Zapasowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątku, które używają domyślnego wskaźnika stanu „pisze...”.

Kolejność rozpoznawania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest wykonywana w trybie best-effort, a próba oczyszczenia następuje automatycznie po zakończeniu odpowiedzi lub ścieżki błędu.

## Multimedia, porcjowanie i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie multimediów, gdy pobranie się powiedzie i pozwalają na to limity rozmiaru.

    Domyślny limit rozmiaru przychodzącego w runtime to `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst wychodzący i pliki">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - limit multimediów wychodzących podlega `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłanie przez kanał używa domyślnych wartości rodzaju MIME z potoku multimediów
  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości bezpośrednich
    - `channel:<id>` dla kanałów

    Wiadomości bezpośrednie Slack są otwierane przez API rozmów Slack podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako pojedyncze skonfigurowane polecenie albo wiele natywnych poleceń. Skonfiguruj `channels.slack.slashCommand`, aby zmienić ustawienia domyślne poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są włączane przez `channels.slack.commands.native: true` lub zamiast tego `commands.native: true` w konfiguracjach globalnych.

- Tryb automatyczny natywnych poleceń jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Natywne menu argumentów używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed wysłaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6–100 opcji: statyczne menu wyboru
- ponad 100 opcji: wybór zewnętrzny z asynchronicznym filtrowaniem opcji, gdy dostępne są procedury obsługi opcji interaktywności
- po przekroczeniu limitów Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje slash używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji rozmowy przy użyciu `CommandTargetSessionKey`.

## Odpowiedzi interaktywne

Slack może renderować interaktywne kontrolki odpowiedzi tworzone przez agenta, ale ta funkcja jest domyślnie wyłączona.

Włącz globalnie:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Albo włącz tylko dla jednego konta Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi tylko dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy są kompilowane do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To interfejs specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości zwrotne interakcji to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości tworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu WWW lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu wiadomości bezpośrednich/kanałów.
- Zatwierdzenia Plugin również mogą być rozwiązywane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafi do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego jest nadal egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzeń co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity o zatwierdzenie są renderowane jako przyciski Block Kit bezpośrednio w rozmowie.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzeń; OpenClaw
powinien uwzględniać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że
zatwierdzenia na czacie są niedostępne albo zatwierdzenie ręczne jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalnie; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i zostanie rozpoznany co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zostaną rozpoznani zatwierdzający.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec dla Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna natywna konfiguracja Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry lub
włączyć dostarczanie do czatu źródłowego:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzeń exec muszą być także
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` również jest
oddzielne; natywne przyciski Slack nadal mogą rozwiązywać zatwierdzenia plugin, gdy te żądania już trafią
do Slack.

Polecenie `/approve` w tym samym czacie działa także w kanałach i wiadomościach bezpośrednich Slack, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości oraz rozgłoszenia wątków są mapowane na zdarzenia systemowe.
- Zdarzenia dodawania/usuwania reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Rozpoczynający wątek i początkowe zasianie kontekstu historii wątku są filtrowane przez skonfigurowane allowlisty nadawców, gdy ma to zastosowanie.
- Działania bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - działania bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

## Wskaźniki do dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - Slack](/pl/gateway/configuration-reference#slack)

  Kluczowe pola Slack:
  - tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - dostęp do wiadomości bezpośrednich: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - przełącznik zgodności: `dangerouslyAllowNameMatching` (awaryjny; pozostaw wyłączony, chyba że jest potrzebny)
  - dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź po kolei:

    - `groupPolicy`
    - allowlistę kanałów (`channels.slack.channels`)
    - `requireMention`
    - allowlistę `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Wiadomości DM są ignorowane">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (lub starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy allowlisty

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb Socket się nie łączy">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżący runtime nie mógł rozpoznać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - signing secret
    - ścieżkę webhooka
    - adresy URL żądań Slack (Events + Interactivity + Slash Commands)
    - unikalne `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    kont, konto HTTP jest skonfigurowane, ale bieżący runtime nie mógł
    rozpoznać signing secret opartego na SecretRef.

    Zarejestrowane webhooki Request URL są wysyłane przez ten sam współdzielony rejestr procedur obsługi używany przez konfigurację monitora Slack, więc zdarzenia Slack w trybie HTTP nadal są kierowane przez zarejestrowaną ścieżkę zamiast zwracać 404 po pomyślnej rejestracji trasy.

  </Accordion>

  <Accordion title="Pobieranie plików z niestandardowymi tokenami bota">
    Pomocnik `downloadFile` rozpoznaje swój token bota z konfiguracji runtime, gdy wywołujący przekazuje `cfg` bez jawnego `token` ani wstępnie zbudowanego klienta, zachowując pobieranie plików tylko z `cfg` poza ścieżką runtime działań.
  </Accordion>

  <Accordion title="Natywne/polecenia slash nie działają">
    Zweryfikuj, czy zamierzono użyć:

    - trybu natywnych poleceń (`channels.slack.commands.native: true`) z odpowiadającymi poleceniami slash zarejestrowanymi w Slack
    - albo trybu pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz allowlisty kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Konfiguracja](/pl/gateway/configuration)
- [Polecenia slash](/pl/tools/slash-commands)
