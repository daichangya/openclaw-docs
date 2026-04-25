---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania Zalo Personal lub przepływu wiadomości
summary: Obsługa osobistego konta Zalo przez natywne `zca-js` (logowanie QR), możliwości i konfiguracja
title: Zalo personalne
x-i18n:
    generated_at: "2026-04-25T13:42:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Status: eksperymentalny. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` wewnątrz OpenClaw.

> **Ostrzeżenie:** To nieoficjalna integracja i może skutkować zawieszeniem lub zbanowaniem konta. Używasz jej na własne ryzyko.

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego builda lub niestandardowej instalacji, która nie zawiera Zalo Personal, zainstaluj go ręcznie:

- Zainstaluj przez CLI: `openclaw plugins install @openclaw/zalouser`
- Albo z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

Nie jest wymagany żaden zewnętrzny binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zaloguj się (QR, na maszynie Gateway):
   - `openclaw channels login --channel zalouser`
   - Zeskanuj kod QR aplikacją mobilną Zalo.
3. Włącz kanał:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Uruchom ponownie Gateway (lub dokończ konfigurację).
5. Dostęp DM domyślnie używa pairingu; zatwierdź kod pairingu przy pierwszym kontakcie.

## Czym to jest

- Działa całkowicie in-process przez `zca-js`.
- Używa natywnych nasłuchiwaczy zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Zaprojektowane do przypadków użycia „osobistego konta”, gdy Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby znaleźć kontakty/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (ograniczenia klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` akceptuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane do identyfikatorów przy użyciu wbudowanego w Plugin wyszukiwania kontaktów.

Zatwierdzanie przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalny)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do allowlisty za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kluczami powinny być stabilne identyfikatory grup; nazwy są w miarę możliwości rozwiązywane do identyfikatorów przy starcie)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą wywoływać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może pytać o allowlisty grup.
- Przy starcie OpenClaw rozwiązuje nazwy grup/użytkowników w allowlistach do identyfikatorów i zapisuje mapowanie w logach.
- Dopasowanie allowlisty grup domyślnie działa tylko po identyfikatorach. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to tryb awaryjny typu break-glass, który ponownie włącza dopasowanie po zmiennych nazwach grup.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa `allowFrom` jako ustawienia awaryjnego przy sprawdzaniu nadawców grupowych.
- Sprawdzanie nadawców dotyczy zarówno zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Bramkowanie wzmianek grupowych

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi grupowe wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> wartość domyślna (`true`).
- Dotyczy to zarówno grup z allowlisty, jak i trybu grup otwartych.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka do aktywacji grupowej.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkowanie wzmianek.
- Gdy wiadomość grupowa jest pomijana, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza do następnej przetworzonej wiadomości grupowej.
- Limit historii grup domyślnie przyjmuje `messages.groupChat.historyLimit` (ustawienie awaryjne `50`). Możesz go nadpisać per konto przez `channels.zalouser.historyLimit`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Wiele kont

Konta mapują się na profile `zalouser` w stanie OpenClaw. Przykład:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reactions](/pl/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzeń OpenClaw wysyła potwierdzenia dostarczenia i odczytu (best-effort).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Zaloguj ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa z allowlisty/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Zaktualizowano ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni wewnątrz OpenClaw bez zewnętrznych binariów CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
