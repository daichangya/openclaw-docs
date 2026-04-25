---
read_when:
    - Chcesz połączyć bota Feishu/Lark
    - Konfigurujesz kanał Feishu
summary: Przegląd bota Feishu, funkcje i konfiguracja
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark to kompleksowa platforma do współpracy, na której zespoły rozmawiają, udostępniają dokumenty, zarządzają kalendarzami i wspólnie wykonują pracę.

**Status:** gotowe do użycia produkcyjnego dla wiadomości prywatnych bota i czatów grupowych. WebSocket jest trybem domyślnym; tryb Webhook jest opcjonalny.

---

## Szybki start

> **Wymaga OpenClaw 2026.4.25 lub nowszego.** Aby sprawdzić wersję, uruchom `openclaw --version`. Zaktualizuj za pomocą `openclaw update`.

<Steps>
  <Step title="Uruchom kreator konfiguracji kanału">
  ```bash
  openclaw channels login --channel feishu
  ```
  Zeskanuj kod QR w aplikacji mobilnej Feishu/Lark, aby automatycznie utworzyć bota Feishu/Lark.
  </Step>
  
  <Step title="Po zakończeniu konfiguracji uruchom ponownie Gateway, aby zastosować zmiany">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrola dostępu

### Wiadomości prywatne

Skonfiguruj `dmPolicy`, aby kontrolować, kto może wysyłać botowi wiadomości prywatne:

- `"pairing"` — nieznani użytkownicy otrzymują kod parowania; zatwierdź przez CLI
- `"allowlist"` — tylko użytkownicy wymienieni w `allowFrom` mogą rozmawiać (domyślnie: tylko właściciel bota)
- `"open"` — zezwól wszystkim użytkownikom
- `"disabled"` — wyłącz wszystkie wiadomości prywatne

**Zatwierdzenie żądania parowania:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Czaty grupowe

**Polityka grup** (`channels.feishu.groupPolicy`):

| Value         | Zachowanie                               |
| ------------- | ---------------------------------------- |
| `"open"`      | Odpowiadaj na wszystkie wiadomości w grupach |
| `"allowlist"` | Odpowiadaj tylko w grupach z `groupAllowFrom` |
| `"disabled"`  | Wyłącz wszystkie wiadomości grupowe      |

Domyślnie: `allowlist`

**Wymaganie wzmianki** (`channels.feishu.requireMention`):

- `true` — wymagaj wzmianki @ (domyślnie)
- `false` — odpowiadaj bez wzmianki @
- Nadpisanie dla konkretnej grupy: `channels.feishu.groups.<chat_id>.requireMention`

---

## Przykłady konfiguracji grup

### Zezwól na wszystkie grupy, bez wymagania wzmianki @

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Zezwól na wszystkie grupy, ale nadal wymagaj wzmianki @

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
          // Identyfikatory open_id użytkowników wyglądają tak: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Pobieranie identyfikatorów grup/użytkowników

### Identyfikatory grup (`chat_id`, format: `oc_xxx`)

Otwórz grupę w Feishu/Lark, kliknij ikonę menu w prawym górnym rogu i przejdź do **Settings**. Identyfikator grupy (`chat_id`) znajduje się na stronie ustawień.

![Get Group ID](/images/feishu-get-group-id.png)

### Identyfikatory użytkowników (`open_id`, format: `ou_xxx`)

Uruchom Gateway, wyślij botowi wiadomość prywatną, a następnie sprawdź logi:

```bash
openclaw logs --follow
```

Poszukaj `open_id` w danych wyjściowych logów. Możesz także sprawdzić oczekujące żądania parowania:

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

> Feishu/Lark nie obsługuje natywnych menu poleceń slash, więc wysyłaj je jako zwykłe wiadomości tekstowe.

---

## Rozwiązywanie problemów

### Bot nie odpowiada na czatach grupowych

1. Upewnij się, że bot został dodany do grupy
2. Upewnij się, że oznaczasz bota wzmianką @ (domyślnie wymagane)
3. Sprawdź, czy `groupPolicy` nie ma wartości `"disabled"`
4. Sprawdź logi: `openclaw logs --follow`

### Bot nie otrzymuje wiadomości

1. Upewnij się, że bot został opublikowany i zatwierdzony w Feishu Open Platform / Lark Developer
2. Upewnij się, że subskrypcja zdarzeń obejmuje `im.message.receive_v1`
3. Upewnij się, że wybrano **persistent connection** (WebSocket)
4. Upewnij się, że przyznano wszystkie wymagane zakresy uprawnień
5. Upewnij się, że Gateway działa: `openclaw gateway status`
6. Sprawdź logi: `openclaw logs --follow`

### Wyciekł App Secret

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

`defaultAccount` określa, które konto jest używane, gdy wychodzące API nie określają `accountId`.

### Limity wiadomości

- `textChunkLimit` — rozmiar fragmentu tekstu wychodzącego (domyślnie: `2000` znaków)
- `mediaMaxMb` — limit przesyłania/pobierania multimediów (domyślnie: `30` MB)

### Streaming

Feishu/Lark obsługuje odpowiedzi strumieniowe za pomocą kart interaktywnych. Gdy ta funkcja jest włączona, bot aktualizuje kartę w czasie rzeczywistym podczas generowania tekstu.

```json5
{
  channels: {
    feishu: {
      streaming: true, // włącz wyjście strumieniowe w kartach (domyślnie: true)
      blockStreaming: true, // włącz streaming na poziomie bloków (domyślnie: true)
    },
  },
}
```

Ustaw `streaming: false`, aby wysłać pełną odpowiedź w jednej wiadomości.

### Optymalizacja limitów quota

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

Feishu/Lark obsługuje ACP dla wiadomości prywatnych i wiadomości wątków grupowych. ACP w Feishu/Lark jest sterowane poleceniami tekstowymi — nie ma natywnych menu poleceń slash, więc używaj wiadomości `/acp ...` bezpośrednio w rozmowie.

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

#### Uruchamianie ACP z czatu

W wiadomości prywatnej lub wątku Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` działa w wiadomościach prywatnych i w wiadomościach wątków Feishu/Lark. Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do tej sesji ACP.

### Routing wielu agentów

Użyj `bindings`, aby kierować wiadomości prywatne lub grupy Feishu/Lark do różnych agentów.

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
- `match.peer.kind`: `"direct"` (wiadomość prywatna) lub `"group"` (czat grupowy)
- `match.peer.id`: Open ID użytkownika (`ou_xxx`) lub identyfikator grupy (`oc_xxx`)

Wskazówki dotyczące wyszukiwania znajdziesz w sekcji [Pobieranie identyfikatorów grup/użytkowników](#get-groupuser-ids).

---

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja Gateway](/pl/gateway/configuration)

| Setting                                           | Opis                                       | Default          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Włącz/wyłącz kanał                         | `true`           |
| `channels.feishu.domain`                          | Domena API (`feishu` lub `lark`)           | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport zdarzeń (`websocket` lub `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Konto domyślne dla routingu wychodzącego   | `default`        |
| `channels.feishu.verificationToken`               | Wymagane w trybie Webhook                  | —                |
| `channels.feishu.encryptKey`                      | Wymagane w trybie Webhook                  | —                |
| `channels.feishu.webhookPath`                     | Ścieżka trasy Webhook                      | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host powiązania Webhook                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port powiązania Webhook                    | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Nadpisanie domeny dla konta                | `feishu`         |
| `channels.feishu.dmPolicy`                        | Polityka wiadomości prywatnych             | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista dozwolonych wiadomości prywatnych (lista `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Polityka grup                              | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista dozwolonych grup                     | —                |
| `channels.feishu.requireMention`                  | Wymagaj wzmianki @ w grupach               | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Nadpisanie wzmianki @ dla grupy            | dziedziczone     |
| `channels.feishu.groups.<chat_id>.enabled`        | Włącz/wyłącz określoną grupę               | `true`           |
| `channels.feishu.textChunkLimit`                  | Rozmiar fragmentu wiadomości               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limit rozmiaru multimediów                 | `30`             |
| `channels.feishu.streaming`                       | Wyjście strumieniowe w kartach             | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming na poziomie bloków               | `true`           |
| `channels.feishu.typingIndicator`                 | Wysyłaj reakcje pisania                    | `true`           |
| `channels.feishu.resolveSenderNames`              | Rozpoznawaj wyświetlane nazwy nadawców     | `true`           |

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

### Wysyłanie

- ✅ Tekst
- ✅ Obrazy
- ✅ Pliki
- ✅ Audio
- ✅ Wideo/multimedia
- ✅ Karty interaktywne (w tym aktualizacje strumieniowe)
- ⚠️ Tekst sformatowany (formatowanie w stylu post; nie obsługuje pełnych możliwości edycji Feishu/Lark)

Natywne dymki audio Feishu/Lark używają typu wiadomości Feishu `audio` i wymagają
przesłania multimediów w formacie Ogg/Opus (`file_type: "opus"`). Istniejące multimedia `.opus` i `.ogg`
są wysyłane bezpośrednio jako natywne audio. MP3/WAV/M4A i inne prawdopodobne formaty audio
są transkodowane do 48 kHz Ogg/Opus za pomocą `ffmpeg` tylko wtedy, gdy odpowiedź wymaga dostarczenia
głosowego (`audioAsVoice` / narzędzie wiadomości `asVoice`, w tym odpowiedzi TTS
w formie notatek głosowych). Zwykłe załączniki MP3 pozostają zwykłymi plikami. Jeśli `ffmpeg` nie jest dostępny lub
konwersja się nie powiedzie, OpenClaw wraca do załącznika plikowego i zapisuje przyczynę w logach.

### Wątki i odpowiedzi

- ✅ Odpowiedzi inline
- ✅ Odpowiedzi w wątkach
- ✅ Odpowiedzi z multimediami pozostają świadome wątków podczas odpowiadania na wiadomość w wątku

Dla `groupSessionScope: "group_topic"` i `"group_topic_sender"` natywne
grupy tematów Feishu/Lark używają zdarzenia `thread_id` (`omt_*`) jako kanonicznego
klucza sesji tematu. Zwykłe odpowiedzi grupowe, które OpenClaw przekształca we wątki, nadal
używają identyfikatora wiadomości głównej odpowiedzi (`om_*`), dzięki czemu pierwsza tura i kolejne
pozostają w tej samej sesji.

---

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
