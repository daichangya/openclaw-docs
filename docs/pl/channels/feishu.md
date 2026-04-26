---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Przegląd bota Feishu, funkcje i konfiguracja
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Luchwa

Feishu/Lark to kompleksowa platforma do współpracy, na której zespoły czatują, udostępniają dokumenty, zarządzają kalendarzami i wspólnie wykonują pracę.

**Status:** gotowe do użycia produkcyjnego dla DM-ów bota i czatów grupowych. Domyślnym trybem jest WebSocket; tryb webhook jest opcjonalny.

---

## Szybki start

> **Wymaga OpenClaw 2026.4.25 lub nowszego.** Uruchom `openclaw --version`, aby sprawdzić wersję. Zaktualizuj za pomocą `openclaw update`.

<Steps>
  <Step title="Uruchom kreator konfiguracji kanału">
  ```bash
  openclaw channels login --channel feishu
  ```
  Zeskanuj kod QR za pomocą aplikacji mobilnej Feishu/Lark, aby automatycznie utworzyć bota Feishu/Lark.
  </Step>
  
  <Step title="Po zakończeniu konfiguracji uruchom ponownie Gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrola dostępu

### Wiadomości bezpośrednie

Skonfiguruj `dmPolicy`, aby kontrolować, kto może wysyłać DM-y do bota:

- `"pairing"` — nieznani użytkownicy otrzymują kod parowania; zatwierdź przez CLI
- `"allowlist"` — tylko użytkownicy wymienieni w `allowFrom` mogą czatować (domyślnie: tylko właściciel bota)
- `"open"` — zezwól wszystkim użytkownikom
- `"disabled"` — wyłącz wszystkie DM-y

**Zatwierdź żądanie parowania:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Zasada grupy** (`channels.feishu.groupPolicy`):

| Value         | Zachowanie                                |
| ------------- | ----------------------------------------- |
| `"open"`      | Odpowiadaj na wszystkie wiadomości w grupach |
| `"allowlist"` | Odpowiadaj tylko grupom z `groupAllowFrom` |
| `"disabled"`  | Wyłącz wszystkie wiadomości grupowe       |

Domyślnie: `allowlist`

**Wymaganie wzmianki** (`channels.feishu.requireMention`):

- `true` — wymagaj @wzmianki (domyślnie)
- `false` — odpowiadaj bez @wzmianki
- Nadpisanie dla pojedynczej grupy: `channels.feishu.groups.<chat_id>.requireMention`

---

## Przykłady konfiguracji grup

### Zezwól na wszystkie grupy, bez wymaganego @wzmiankowania

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Zezwól na wszystkie grupy, ale nadal wymagaj @wzmianki

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Zezwól tylko na określone grupy

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Identyfikatory grup wyglądają tak: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Ogranicz nadawców w obrębie grupy

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id użytkowników wyglądają tak: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Pobierz identyfikatory grup/użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Settings**. Identyfikator grupy (`chat_id`) jest podany na stronie ustawień.

![Get Group ID](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom Gateway, wyślij DM do bota, a następnie sprawdź logi:

```bash
openclaw logs --follow
```

Wyszukaj `open_id` w danych wyjściowych logów. Możesz też sprawdzić oczekujące żądania parowania:

```bash
openclaw pairing list feishu
```

---

## Typowe polecenia

| Command   | Opis                          |
| --------- | ----------------------------- |
| `/status` | Pokaż status bota             |
| `/reset`  | Zresetuj bieżącą sesję        |
| `/model`  | Pokaż lub przełącz model AI   |

> Feishu/Lark nie obsługuje natywnych menu poleceń ukośnikowych, więc wysyłaj je jako zwykłe wiadomości tekstowe.

---

## Rozwiązywanie problemów

### Bot nie odpowiada na czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że oznaczasz bota przez @wzmiankę (domyślnie wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie odbiera wiadomości

1. Upewnij się, że bot jest opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **persistent connection** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że Gateway działa: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### App Secret wyciekł

1. Zresetuj App Secret w Feishu Open Platform / Lark Developer
2. Zaktualizuj wartość w swojej konfiguracji
3. Uruchom ponownie Gateway: `openclaw gateway restart`

---

## Konfiguracja zaawansowana

### Wiele kont

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Główny bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Zapasowy bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kontroluje, które konto jest używane, gdy wychodzące API nie określają `accountId`.
`accounts.<id>.tts` używa tego samego kształtu co `messages.tts` i wykonuje głębokie scalanie z
globalną konfiguracją TTS, dzięki czemu konfiguracje wielu botów Feishu mogą utrzymywać współdzielone dane uwierzytelniające dostawców globalnie, nadpisując dla każdego konta tylko głos, model, personę lub tryb automatyczny.

### Limity wiadomości

- `textChunkLimit` — rozmiar fragmentu tekstu wychodzącego (domyślnie: `2000` znaków)
- `mediaMaxMb` — limit przesyłania/pobierania multimediów (domyślnie: `30` MB)

### Streaming

Feishu/Lark obsługuje odpowiedzi strumieniowe za pomocą interaktywnych kart. Po włączeniu bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // włącz strumieniowe wyjście kart (domyślnie: true)
      blockStreaming: true, // włącz strumieniowanie na poziomie bloków (domyślnie: true)
    },
  },
}
```

Ustaw `streaming: false`, aby wysłać pełną odpowiedź w jednej wiadomości.

### Optymalizacja limitów

Zmniejsz liczbę wywołań API Feishu/Lark za pomocą dwóch opcjonalnych flag:

- `typingIndicator` (domyślnie `true`): ustaw `false`, aby pominąć wywołania reakcji pisania
- `resolveSenderNames` (domyślnie `true`): ustaw `false`, aby pominąć wyszukiwanie profili nadawców

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesje ACP

Feishu/Lark obsługuje ACP dla DM-ów i wiadomości wątków grupowych. ACP w Feishu/Lark działa przez polecenia tekstowe — nie ma natywnych menu poleceń ukośnikowych, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

#### Trwałe powiązanie ACP

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Uruchom ACP z czatu

W DM-ie lub wątku Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` działa dla DM-ów i wiadomości wątków Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do tej sesji ACP.

### Routing wielu agentów

Użyj `bindings`, aby kierować DM-y lub grupy Feishu/Lark do różnych agentów.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Pola routingu:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) lub `"group"` (czat grupowy)
- `match.peer.id`: Open ID użytkownika (`ou_xxx`) lub identyfikator grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania znajdziesz w sekcji [Pobierz identyfikatory grup/użytkowników](#get-groupuser-ids).

---

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Setting                                           | Opis                                       | Domyślnie       |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Włącz/wyłącz kanał                         | `true`           |
| `channels.feishu.domain`                          | Domena API (`feishu` lub `lark`)           | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport zdarzeń (`websocket` lub `webhook`) | `websocket`   |
| `channels.feishu.defaultAccount`                  | Domyślne konto dla routingu wychodzącego   | `default`        |
| `channels.feishu.verificationToken`               | Wymagane dla trybu webhook                 | —                |
| `channels.feishu.encryptKey`                      | Wymagane dla trybu webhook                 | —                |
| `channels.feishu.webhookPath`                     | Ścieżka trasy webhooka                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host powiązania webhooka                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port powiązania webhooka                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Nadpisanie domeny dla konta                | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Nadpisanie TTS dla konta                   | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Zasada DM                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista dozwolonych dla DM (lista `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Zasada grup                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista dozwolonych grup                     | —                |
| `channels.feishu.requireMention`                  | Wymagaj @wzmianki w grupach                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Nadpisanie @wzmianki dla grupy             | dziedziczone     |
| `channels.feishu.groups.<chat_id>.enabled`        | Włącz/wyłącz określoną grupę               | `true`           |
| `channels.feishu.textChunkLimit`                  | Rozmiar fragmentu wiadomości               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit rozmiaru multimediów                 | `30`             |
| `channels.feishu.streaming`                       | Strumieniowe wyjście kart                  | `true`           |
| `channels.feishu.blockStreaming`                  | Strumieniowanie na poziomie bloków         | `true`           |
| `channels.feishu.typingIndicator`                 | Wysyłaj reakcje pisania                    | `true`           |
| `channels.feishu.resolveSenderNames`              | Rozpoznawaj nazwy wyświetlane nadawców     | `true`           |

---

## Obsługiwane typy wiadomości

### Odbieranie

- ✅ Tekst
- ✅ Tekst sformatowany (post)
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Naklejki

Przychodzące wiadomości audio Feishu/Lark są normalizowane jako placeholdery multimediów zamiast surowego JSON `file_key`. Gdy skonfigurowano `tools.media.audio`, OpenClaw pobiera zasób notatki głosowej i uruchamia współdzieloną transkrypcję audio przed turą agenta, dzięki czemu agent otrzymuje transkrypcję wypowiedzi. Jeśli Feishu bezpośrednio zawiera tekst transkrypcji w ładunku audio, ten tekst jest używany bez dodatkowego wywołania ASR. Bez dostawcy transkrypcji audio agent nadal otrzymuje placeholder `<media:audio>` wraz z zapisanym załącznikiem, a nie surowy ładunek zasobu Feishu.

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Interaktywne karty (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu postów; nie obsługuje pełnych możliwości tworzenia treści Feishu/Lark)

Natywne bąbelki audio Feishu/Lark używają typu wiadomości Feishu `audio` i wymagają przesyłania multimediów Ogg/Opus (`file_type: "opus"`). Istniejące multimedia `.opus` i `.ogg` są wysyłane bezpośrednio jako natywne audio. MP3/WAV/M4A i inne prawdopodobne formaty audio są transkodowane do 48 kHz Ogg/Opus za pomocą `ffmpeg` tylko wtedy, gdy odpowiedź żąda dostarczenia głosowego (`audioAsVoice` / narzędzie wiadomości `asVoice`, w tym odpowiedzi TTS w formie notatek głosowych). Zwykłe załączniki MP3 pozostają zwykłymi plikami. Jeśli brakuje `ffmpeg` lub konwersja się nie powiedzie, OpenClaw przełącza się na załącznik plikowy i zapisuje przyczynę w logach.

### Wątki i odpowiedzi

- ✅ Odpowiedzi inline
- ✅ Odpowiedzi w wątkach
- ✅ Odpowiedzi multimedialne zachowują świadomość wątku podczas odpowiadania na wiadomość w wątku

Dla `groupSessionScope: "group_topic"` i `"group_topic_sender"` natywne grupy tematów Feishu/Lark używają zdarzenia `thread_id` (`omt_*`) jako kanonicznego klucza sesji tematu. Zwykłe odpowiedzi grupowe, które OpenClaw zamienia na wątki, nadal używają identyfikatora wiadomości głównej odpowiedzi (`om_*`), aby pierwsza tura i kolejne tury pozostawały w tej samej sesji.

---

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
