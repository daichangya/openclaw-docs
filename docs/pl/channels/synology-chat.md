---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu Webhook Synology Chat
summary: Konfiguracja Webhook Synology Chat i OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T09:56:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: dołączony plugin kanału wiadomości bezpośrednich używający Webhook Synology Chat.
Plugin przyjmuje wiadomości przychodzące z wychodzących webhooków Synology Chat i wysyła odpowiedzi
przez przychodzący Webhook Synology Chat.

## Dołączony plugin

Synology Chat jest dostarczany jako dołączony plugin w obecnych wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Synology Chat,
zainstaluj go ręcznie:

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że plugin Synology Chat jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` wyświetla teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz przychodzący Webhook i skopiuj jego URL.
   - Utwórz wychodzący Webhook ze swoim tajnym tokenem.
3. Skieruj URL wychodzącego webhooka do Gateway OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Lub do własnego `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Z przewodnikiem: `openclaw onboard`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie Gateway i wyślij DM do bota Synology Chat.

Szczegóły uwierzytelniania webhooka:

- OpenClaw akceptuje token wychodzącego webhooka z `body.token`, następnie
  `?token=...`, a potem z nagłówków.
- Akceptowane formy nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny kończą się domyślną odmową.

Minimalna konfiguracja:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Zmienne środowiskowe

Dla konta domyślnego możesz użyć zmiennych środowiskowych:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (rozdzielane przecinkami)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Wartości konfiguracji zastępują zmienne środowiskowe.

`SYNOLOGY_CHAT_INCOMING_URL` nie może być ustawione z pliku workspace `.env`; zobacz [Pliki workspace `.env`](/pl/gateway/security).

## Polityka DM i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecione ustawienie domyślne.
- `allowedUserIds` przyjmuje listę (lub ciąg rozdzielany przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` dla zezwolenia wszystkim).
- `dmPolicy: "open"` zezwala na każdego nadawcę.
- `dmPolicy: "disabled"` blokuje wiadomości DM.
- Wiązanie odbiorcy odpowiedzi domyślnie pozostaje oparte na stabilnym numerycznym `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza wyszukiwanie po zmiennej nazwie użytkownika/pseudonimie na potrzeby dostarczania odpowiedzi.
- Zatwierdzanie parowania działa z:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Dostarczanie wychodzące

Używaj numerycznych identyfikatorów użytkowników Synology Chat jako celów.

Przykłady:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Wysyłanie mediów jest obsługiwane przez dostarczanie plików oparte na URL.
Wychodzące URL-e plików muszą używać `http` lub `https`, a prywatne lub w inny sposób zablokowane cele sieciowe są odrzucane, zanim OpenClaw przekaże URL do webhooka NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może nadpisywać token, przychodzący URL, ścieżkę webhooka, politykę DM i limity.
Sesje wiadomości bezpośrednich są izolowane dla każdego konta i użytkownika, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębny `webhookPath`. OpenClaw odrzuca teraz zduplikowane identyczne ścieżki
i odmawia uruchomienia nazwanych kont, które jedynie dziedziczą współdzieloną ścieżkę webhooka w konfiguracjach wielokontowych.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` dla tego konta lub w `channels.synology-chat`,
ale zduplikowane identyczne ścieżki nadal są odrzucane w trybie fail-closed. Preferuj jawne ścieżki dla każdego konta.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Uwagi dotyczące bezpieczeństwa

- Zachowaj `token` w tajemnicy i zmień go, jeśli wycieknie.
- Zachowaj `allowInsecureSsl: false`, chyba że jawnie ufasz lokalnemu certyfikatowi NAS z podpisem własnym.
- Przychodzące żądania webhooków są weryfikowane tokenem i ograniczane szybkościowo dla każdego nadawcy.
- Sprawdzanie nieprawidłowych tokenów używa porównywania sekretów w stałym czasie i domyślnie odmawia.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Nie włączaj `dangerouslyAllowNameMatching`, chyba że jawnie potrzebujesz starszego dostarczania odpowiedzi opartego na nazwach użytkowników.
- Nie włączaj `dangerouslyAllowInheritedWebhookPath`, chyba że jawnie akceptujesz ryzyko trasowania współdzielonej ścieżki w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w ładunku wychodzącego webhooka brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że Gateway/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret wychodzącego webhooka nie pasuje do `channels.synology-chat.token`
  - żądanie trafia do niewłaściwego konta/ścieżki webhooka
  - reverse proxy usunął nagłówek tokenu, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają też osobny limit szybkości wiadomości na użytkownika
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` jest włączone, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
