---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami prywatnymi
    - Konfigurujesz listy dozwolonych IRC, zasady grupowe lub ograniczenia wzmianek
summary: Konfiguracja pluginu IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-04-23T09:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Używaj IRC, gdy chcesz korzystać z OpenClaw na klasycznych kanałach (`#room`) i w wiadomościach prywatnych.
IRC jest dostarczany jako bundlowany plugin, ale konfiguruje się go w głównej konfiguracji pod `channels.irc`.

## Szybki start

1. Włącz konfigurację IRC w `~/.openclaw/openclaw.json`.
2. Ustaw co najmniej:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Preferuj prywatny serwer IRC do koordynacji bota. Jeśli celowo używasz publicznej sieci IRC, popularne opcje to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych publicznych kanałów dla ruchu zaplecza bota lub swarm.

3. Uruchom lub zrestartuj Gateway:

```bash
openclaw gateway run
```

## Domyślne ustawienia bezpieczeństwa

- `channels.irc.dmPolicy` domyślnie ma wartość `"pairing"`.
- `channels.irc.groupPolicy` domyślnie ma wartość `"allowlist"`.
- Przy `groupPolicy="allowlist"` ustaw `channels.irc.groups`, aby zdefiniować dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że celowo akceptujesz transport jawnym tekstem.

## Kontrola dostępu

Dla kanałów IRC istnieją dwa osobne „filtry”:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): czy bot w ogóle akceptuje wiadomości z danego kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): kto może wyzwalać bota w tym kanale.

Klucze konfiguracji:

- Lista dozwolonych dla DM (dostęp nadawcy DM): `channels.irc.allowFrom`
- Lista dozwolonych nadawców grupowych (dostęp nadawcy kanału): `channels.irc.groupAllowFrom`
- Kontrolki per-channel (kanał + nadawca + reguły wzmianek): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` pozwala na nieskonfigurowane kanały (**nadal domyślnie obowiązuje ograniczenie wzmiankami**)

Wpisy listy dozwolonych powinny używać stabilnych tożsamości nadawcy (`nick!user@host`).
Dopasowanie po samym nicku jest mutowalne i jest włączone tylko wtedy, gdy `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsta pułapka: `allowFrom` dotyczy DM, nie kanałów

Jeśli widzisz logi takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Napraw to, ustawiając:

- `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów), albo
- listy dozwolonych nadawców per-channel: `channels.irc.groups["#channel"].allowFrom`

Przykład (pozwól każdemu w `#tuirc-dev` rozmawiać z botem):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Wyzwalanie odpowiedzi (wzmianki)

Nawet jeśli kanał jest dozwolony (przez `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie wymaga **wzmianek** w kontekstach grupowych.

Oznacza to, że możesz zobaczyć logi takie jak `drop channel … (missing-mention)`, jeśli wiadomość nie zawiera wzorca wzmianki pasującego do bota.

Aby bot odpowiadał na kanale IRC **bez potrzeby wzmianki**, wyłącz ograniczenie wzmiankami dla tego kanału:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Lub aby zezwolić na **wszystkie** kanały IRC (bez listy dozwolonych per-channel) i nadal odpowiadać bez wzmianek:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Uwaga dotycząca bezpieczeństwa (zalecane dla kanałów publicznych)

Jeśli ustawisz `allowFrom: ["*"]` na publicznym kanale, każdy może wysyłać prompty do bota.
Aby zmniejszyć ryzyko, ogranicz narzędzia dla tego kanału.

### Te same narzędzia dla wszystkich na kanale

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Różne narzędzia dla różnych nadawców (właściciel ma większe uprawnienia)

Użyj `toolsBySender`, aby zastosować bardziej restrykcyjną politykę do `"*"` i mniej restrykcyjną do swojego nicka:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Uwagi:

- Klucze `toolsBySender` powinny używać `id:` dla wartości tożsamości nadawcy IRC:
  `id:eigen` lub `id:eigen!~eigen@174.127.248.171` dla silniejszego dopasowania.
- Starsze klucze bez prefiksu są nadal akceptowane i dopasowywane tylko jako `id:`.
- Pierwsza pasująca polityka nadawcy wygrywa; `"*"` to zapasowy wildcard.

Więcej informacji o dostępie grupowym vs ograniczeniu wzmiankami (i o tym, jak te mechanizmy ze sobą współdziałają) znajdziesz tutaj: [/channels/groups](/pl/channels/groups).

## NickServ

Aby identyfikować się przez NickServ po połączeniu:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Opcjonalna jednorazowa rejestracja przy połączeniu:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Wyłącz `register` po zarejestrowaniu nicka, aby uniknąć ponawianych prób REGISTER.

## Zmienne środowiskowe

Domyślne konto obsługuje:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (rozdzielane przecinkami)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` nie może być ustawiony z pliku `.env` workspace; zobacz [Pliki `.env` workspace](/pl/gateway/security).

## Rozwiązywanie problemów

- Jeśli bot się łączy, ale nigdy nie odpowiada na kanałach, sprawdź `channels.irc.groups` **oraz** czy ograniczenie wzmiankami odrzuca wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez pingów, ustaw `requireMention:false` dla kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność nicka i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź host/port i konfigurację certyfikatu.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ Pairing
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i ograniczenie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
