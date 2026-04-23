---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Status obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-23T09:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony kanał Plugin dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje DM, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony Plugin

Matrix jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego builda lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj go ręcznie:

Instalacja z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Plugins](/pl/tools/plugin), aby poznać zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że Plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix` przy użyciu jednej z opcji:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie Gateway.
5. Rozpocznij DM z botem albo zaproś go do pokoju.
   - Świeże zaproszenia Matrix działają tylko wtedy, gdy zezwala na to `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator Matrix pyta o:

- URL homeservera
- metodę uwierzytelniania: token dostępu albo hasło
- identyfikator użytkownika (tylko uwierzytelnianie hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokoi i automatyczne dołączanie do zaproszeń

Kluczowe zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją i to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót z użyciem env, aby zachować uwierzytelnianie w zmiennych środowiskowych.
- Nazwy kont są normalizowane do identyfikatora konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy allowlist dla DM akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w aktywnym katalogu znajdzie jedno dokładne dopasowanie.
- Wpisy allowlist dla pokoi akceptują bezpośrednio identyfikatory pokoi i aliasy. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania allowlist.
- W trybie allowlist dla automatycznego dołączania do zaproszeń używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` domyślnie ma wartość `off`.

Jeśli pozostawisz to pole nieustawione, bot nie będzie dołączał do zaproszonych pokoi ani nowych zaproszeń w stylu DM, więc nie pojawi się w nowych grupach ani zaproszonych DM, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia są akceptowane, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
</Warning>

Przykład allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Dołączanie do każdego zaproszenia:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Minimalna konfiguracja oparta na tokenie:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Konfiguracja oparta na haśle (token jest buforowany po zalogowaniu):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix przechowuje zbuforowane poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Gdy istnieją tam zbuforowane poświadczenia, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby setupu, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne użyj zmiennych środowiskowych z zakresem konta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Przykład dla konta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Dla znormalizowanego identyfikatora konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix maskuje znaki interpunkcyjne w identyfikatorach kont, aby zmienne środowiskowe z zakresem konta nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót ze zmiennymi środowiskowymi tylko wtedy, gdy te zmienne uwierzytelniania już istnieją i wybrane konto nie ma już zapisanego uwierzytelniania Matrix w konfiguracji.

`MATRIX_HOMESERVER` nie może być ustawione z `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem DM, allowlistą pokoi i włączonym E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu DM. OpenClaw nie może niezawodnie
sklasyfikować zaproszonego pokoju jako DM lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` ma zastosowanie po tym, jak bot już dołączy i pokój zostanie sklasyfikowany jako DM.

## Podglądy streamingu

Streaming odpowiedzi Matrix jest opt-in.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą podglądową
odpowiedź na żywo, edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie finalizował go po
zakończeniu odpowiedzi:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` to ustawienie domyślne. OpenClaw czeka na końcową odpowiedź i wysyła ją raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadomieniu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać o pierwszym streamowanym tekście podglądu zamiast o ukończonym bloku.
- `streaming: "quiet"` tworzy jedną edytowalną cichą notatkę podglądu dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy konfigurujesz też reguły push odbiorcy dla finalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Gdy streaming podglądu jest włączony, Matrix zachowuje aktywny szkic dla bieżącego bloku i zachowuje ukończone bloki jako osobne wiadomości.
- Gdy streaming podglądu jest włączony, a `blockStreaming` jest wyłączone, Matrix edytuje aktywny szkic w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje streaming podglądu i wraca do zwykłego końcowego dostarczenia.
- Odpowiedzi z multimediami nadal wysyłają załączniki normalnie. Jeśli nieaktualny podgląd nie może już zostać bezpiecznie ponownie użyty, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z multimediami.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw streaming wyłączony, jeśli chcesz najbardziej zachowawcze zachowanie względem limitów szybkości.

`blockStreaming` sam z siebie nie włącza podglądów szkicu.
Użyj `streaming: "partial"` lub `streaming: "quiet"` do edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz również, aby ukończone bloki asystenta pozostały widoczne jako osobne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania najpierw podglądu albo pozostaw `streaming` wyłączone dla dostarczania tylko końcowego. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą wiadomość Matrix wywołującą powiadomienie.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą wiadomość Matrix wywołującą powiadomienie.

### Samohostowane reguły push dla cichych finalizowanych podglądów

Jeśli utrzymujesz własną infrastrukturę Matrix i chcesz, aby ciche podglądy powiadamiały tylko po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla finalizowanych edycji podglądu.

Jest to zwykle konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik-odbiorca = osoba, która powinna otrzymywać powiadomienie
- użytkownik-bot = konto Matrix OpenClaw, które wysyła odpowiedź
- do poniższych wywołań API użyj tokena dostępu użytkownika-odbiorcy
- dopasuj `sender` w regule push do pełnego MXID użytkownika-bota

1. Skonfiguruj OpenClaw do używania cichych podglądów:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Upewnij się, że konto odbiorcy już otrzymuje zwykłe powiadomienia push Matrix. Reguły cichych podglądów
   działają tylko wtedy, gdy ten użytkownik ma już działające pushery/urządzenia.

3. Pobierz token dostępu użytkownika-odbiorcy.
   - Użyj tokena użytkownika otrzymującego wiadomości, a nie tokena bota.
   - Ponowne użycie tokena istniejącej sesji klienta jest zwykle najprostsze.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API klient-serwer Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Sprawdź, czy konto odbiorcy ma już pushery:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli to zwraca brak aktywnych pusherów/urządzeń, najpierw napraw zwykłe powiadomienia Matrix, zanim dodasz
poniższą regułę OpenClaw.

OpenClaw oznacza finalizowane edycje podglądu zawierające wyłącznie tekst następującym polem:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Utwórz regułę push typu override dla każdego konta odbiorcy, które powinno otrzymywać te powiadomienia:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Zastąp te wartości przed uruchomieniem polecenia:

- `https://matrix.example.org`: bazowy URL Twojego homeservera
- `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbierającego wiadomości
- `openclaw-finalized-preview-botname`: identyfikator reguły unikalny dla tego bota dla tego użytkownika odbierającego
- `@bot:example.org`: MXID bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne w konfiguracjach z wieloma botami:

- Reguły push są kluczowane przez `ruleId`. Ponowne uruchomienie `PUT` dla tego samego identyfikatora reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający powinien otrzymywać powiadomienia dla wielu kont botów Matrix OpenClaw, utwórz po jednej regule na bota z unikalnym identyfikatorem reguły dla każdego dopasowania nadawcy.
- Prosty wzorzec to `openclaw-finalized-preview-<botname>`, na przykład `openclaw-finalized-preview-ops` lub `openclaw-finalized-preview-support`.

Reguła jest oceniana względem nadawcy zdarzenia:

- uwierzytelnij się tokenem użytkownika odbierającego
- dopasuj `sender` do MXID bota OpenClaw

6. Sprawdź, czy reguła istnieje:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Przetestuj odpowiedź streamowaną. W trybie quiet pokój powinien pokazać cichy szkic podglądu, a końcowa
   edycja w miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później będziesz potrzebować usunąć regułę, usuń ten sam identyfikator reguły tokenem użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu tokena dostępu użytkownika odbierającego, a nie tokena bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami wyciszającymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu zawierających wyłącznie tekst, które OpenClaw może bezpiecznie finalizować w miejscu. Awaryjne ścieżki dla multimediów i awaryjne ścieżki dla nieaktualnego podglądu nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zazwyczaj sama w sobie wystarcza:

- Nie jest wymagana specjalna zmiana `homeserver.yaml` dla finalizowanych powiadomień podglądu OpenClaw.
- Jeśli Twoje wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, głównym krokiem konfiguracji jest token użytkownika + wywołanie `pushrules` opisane powyżej.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery działają poprawnie. Dostarczanie powiadomień push obsługuje proces główny albo `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

W przypadku Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano powyżej:

- Nie jest wymagana konfiguracja specyficzna dla Tuwunel dla samego znacznika finalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, głównym krokiem konfiguracji jest token użytkownika + wywołanie `pushrules` opisane powyżej.
- Jeśli wydaje się, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy `suppress_push_when_active` jest włączone. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 roku i może ona celowo wyciszać powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Pokoje bot-do-bota

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, gdy celowo chcesz zezwolić na ruch Matrix między agentami:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i DM.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach widocznie wspominają tego bota. DM są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym Gateway OpenClaw”.

Przy włączaniu ruchu bot-do-bota we współdzielonych pokojach używaj ścisłych allowlist pokoi i wymagań wzmianki.

## Szyfrowanie i weryfikacja

W szyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Pokoje nieszyfrowane nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — Plugin automatycznie wykrywa stan E2EE.

Włącz szyfrowanie:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Sprawdź status weryfikacji:

```bash
openclaw matrix verify status
```

Szczegółowy status (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Dołącz zapisany klucz odzyskiwania do wyniku czytelnego maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjalizuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Szczegółowa diagnostyka bootstrapu:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś świeży reset tożsamości cross-signing przed bootstrapem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Zweryfikuj to urządzenie przy użyciu klucza odzyskiwania:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Szczegółowe informacje o weryfikacji urządzenia:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Sprawdź stan kopii zapasowej kluczy pokojów:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka stanu kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokojów z kopii zapasowej serwera:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową serwera i utwórz świeżą bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie załadowany, ten reset może również odtworzyć secret storage, aby
przyszłe zimne starty mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym wyciszone wewnętrzne logowanie SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Przy skryptowaniu użyj `--json`, aby uzyskać pełny wynik czytelny maszynowo.

W konfiguracjach wielokontowych polecenia Matrix CLI używają domyślnego konta Matrix niejawnie, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń jawnie dotyczyły nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy jest zweryfikowane przez Twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` pokazuje trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane przez Twój własny klucz self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy istnieje weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla szyfrowanych kont Matrix.
Wykonuje ono po kolei wszystkie poniższe działania:

- inicjalizuje secret storage, w miarę możliwości ponownie używając istniejącego klucza odzyskiwania
- inicjalizuje cross-signing i wysyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać cross-signing bieżące urządzenie
- tworzy nową kopię zapasową kluczy pokojów po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga interaktywnego uwierzytelniania do wysłania kluczy cross-signing, OpenClaw próbuje najpierw wysłać je bez uwierzytelniania, następnie z `m.login.dummy`, a potem z `m.login.password`, gdy skonfigurowane jest `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy świadomie chcesz porzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli świadomie chcesz porzucić bieżącą kopię zapasową kluczy pokojów i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że niemożliwa do odzyskania stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć secret storage, jeśli bieżący sekret kopii zapasowej
nie może zostać bezpiecznie załadowany.

### Świeża baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę niemożliwej do odzyskania starej historii, uruchom po kolei te polecenia:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, gdy chcesz jawnie wskazać nazwane konto Matrix.

### Zachowanie przy uruchamianiu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o samoweryfikację w innym kliencie Matrix,
pominie duplikaty żądań, gdy jedno jest już oczekujące, i zastosuje lokalny cooldown przed ponowieniem próby po restartach.
Nieudane próby wysłania żądania są domyślnie ponawiane szybciej niż pomyślne utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze lub dłuższe okno ponawiania.

Uruchamianie wykonuje też automatycznie zachowawcze przejście bootstrapu kryptograficznego.
To przejście najpierw próbuje ponownie użyć bieżącego secret storage i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawczy bootstrapu.

Jeśli przy uruchamianiu nadal zostanie wykryty uszkodzony stan bootstrapu, OpenClaw może spróbować chronionej ścieżki naprawy nawet wtedy, gdy `channels.matrix.password` nie jest skonfigurowane.
Jeśli homeserver wymaga dla tej naprawy UIA opartego na haśle, OpenClaw zapisuje ostrzeżenie i zachowuje niefatalny charakter uruchamiania zamiast przerywać działanie bota.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Zobacz [Migracja Matrix](/pl/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracji.

### Powiadomienia weryfikacyjne

Matrix publikuje powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniu weryfikacji
- powiadomienia o gotowości do weryfikacji (z jawną wskazówką „Zweryfikuj za pomocą emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw również automatycznie rozpoczyna przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją stronę.
W przypadku żądań weryfikacji z innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS będzie przebiegał normalnie.
Nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i potwierdzić tam „Są zgodne”, aby ukończyć weryfikację.

OpenClaw nie akceptuje bezwarunkowo automatycznie samodzielnie zainicjowanych zduplikowanych przepływów. Przy uruchamianiu pomija utworzenie nowego żądania, gdy żądanie samoweryfikacji jest już oczekujące.

Powiadomienia protokołu/systemu weryfikacji nie są przekazywane do pipeline czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia analizę zaufania w szyfrowanych pokojach.
Wyświetl ich listę poleceniem:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw poleceniem:

```bash
openclaw matrix devices prune-stale
```

### Magazyn kryptograficzny

Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk` w Node, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w pliku snapshotu (`crypto-idb-snapshot.json`) i przywracany przy uruchamianiu. Plik snapshotu jest wrażliwym stanem runtime przechowywanym z restrykcyjnymi uprawnieniami do pliku.

Zaszyfrowany stan runtime znajduje się w katalogach głównych per konto i per użytkownik z hashem tokena w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera magazyn synchronizacji (`bot-storage.json`), magazyn kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchamianiu (`startup-verification.json`).
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla tej krotki konto/homeserver/użytkownik, dzięki czemu poprzedni stan synchronizacji, stan kryptograficzny, powiązania wątków
oraz stan weryfikacji przy uruchamianiu pozostają widoczne.

## Zarządzanie profilem

Zaktualizuj profil Matrix dla wybranego konta poleceniem:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio adresy URL awatarów `mxc://`. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw wyśle go do Matrix, a następnie zapisze rozwiązany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub do wybranego nadpisania konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routing DM Matrix w zakresie nadawcy, dzięki czemu wiele pokojów DM może współdzielić jedną sesję, gdy rozwiążą się do tego samego peera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając zwykłych kontroli uwierzytelniania DM i allowlist.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i pozostawia przychodzące wiadomości wątkowe w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada w wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokoju w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę konwersację przez pasującą sesję z zakresem wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków pokojów, zachowując płaskie DM.
- Przychodzące wiadomości wątkowe zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzie wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy cel to ten sam pokój albo ten sam cel użytkownika DM, chyba że podano jawne `threadId`.
- Ponowne użycie celu użytkownika DM w tej samej sesji uruchamia się tylko wtedy, gdy bieżące metadane sesji potwierdzają tego samego peera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego routingu z zakresem użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje jednorazowe `m.notice` w tym pokoju z mechanizmem awaryjnym `/focus`, gdy powiązania wątków są włączone oraz ze wskazówką `dm.sessionScope`.
- Obsługiwane są powiązania wątków runtime dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz powiązane z wątkiem `/acp spawn` działają w pokojach i DM Matrix.
- Główne `/focus` w pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można przekształcić w trwałe obszary robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` w DM Matrix, pokoju lub istniejącym wątku, którego chcesz nadal używać.
- W głównym DM lub pokoju Matrix bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnAcpSessions` jest wymagane tylko dla `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne ustawienia domyślne z `session.threadBindings`, a także obsługuje nadpisania per kanał:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flagi uruchamiania powiązane z wątkami Matrix są opt-in:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić, by główne `/focus` tworzyło i wiązało nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić, by `/acp spawn --thread auto|here` wiązało sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach oraz przychodzące reakcje potwierdzające.

- Obsługa narzędzi reakcji wychodzących jest kontrolowana przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do określonego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla określonego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota dla tego zdarzenia.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Zakres reakcji potwierdzających jest rozwiązywany według standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- awaryjne emoji tożsamości agenta

Zakres reakcji potwierdzających jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza zdarzenia systemowe reakcji.
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta. Wartość awaryjna to `messages.groupChat.historyLimit`; jeśli oba pola nie są ustawione, efektywną wartością domyślną jest `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają zwykłej historii sesji.
- Historia pokoju Matrix dotyczy tylko oczekujących wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje snapshot tego okna, gdy nadejdzie wzmianka lub inny trigger.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby dla tego samego zdarzenia Matrix używają ponownie oryginalnego snapshotu historii zamiast przesuwać się do nowszych wiadomości w pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne kontrole allowlist pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja triggera nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i polityki DM.

## Polityka DM i pokojów

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmianką i allowlist.

Przykład parowania dla DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła Ci wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może ponownie wysłać odpowiedź-przypomnienie po krótkim cooldownie zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Naprawa direct room

Jeśli stan wiadomości bezpośrednich rozjedzie się, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla peera poleceniem:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je poleceniem:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w drugiej kolejności wybiera dowolny aktualnie dołączony ścisły DM 1:1 z tym użytkownikiem
- tworzy nowy direct room i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Przepływ naprawy nie usuwa automatycznie starych pokojów. Wybiera tylko zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich ponownie trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
pokrętła routingu DM/kanału nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; wartość awaryjna to `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec najpierw używają `execApprovals.approvers` i mogą awaryjnie użyć `channels.matrix.dm.allowFrom`. Zatwierdzenia Plugin są autoryzowane przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia wracają do innych skonfigurowanych ścieżek zatwierdzeń albo do awaryjnej polityki zatwierdzeń.

Natywny routing Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb rozsyłania DM/kanału dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia Plugin używają allowlist DM Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zatwierdzeń exec, jak i zatwierdzeń Plugin.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do DM zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju lub DM Matrix
- `target: "both"` wysyła do DM zatwierdzających oraz do źródłowego pokoju lub DM Matrix

Prompty zatwierdzeń Matrix inicjują skróty reakcji w podstawowej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odrzuć
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą zareagować na tę wiadomość albo użyć awaryjnych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać. W przypadku zatwierdzeń exec dostarczanie kanałowe obejmuje tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Polecenia slash

Polecenia slash Matrix (na przykład `/new`, `/reset`, `/model`) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje również polecenia slash poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` uruchamia ścieżkę polecenia bez potrzeby stosowania niestandardowego regexu wzmianki. Dzięki temu bot pozostaje responsywny na wpisy w stylu pokojowym `@mention /command`, które Element i podobne klienty wysyłają, gdy użytkownik użyje uzupełniania tabulatorem na bocie przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać zasady allowlist/polityki właściciela dla DM lub pokoju tak samo jak w przypadku zwykłych wiadomości.

## Wiele kont

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczone wpisy pokojów do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone między wszystkimi kontami Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje najwyższego poziomu konto `default` tylko wtedy, gdy to konto domyślne ma świeże uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostawać wykrywalne z `homeserver` plus `userId`, gdy zbuforowane poświadczenia spełnią później wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawcza/konfiguracyjna z jednego konta do wielu kont zachowuje to konto zamiast tworzyć świeży wpis `accounts.default`. Tylko klucze Matrix auth/bootstrap są przenoszone do promowanego konta; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego routingu, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix, a jedno z identyfikatorów kont to `default`, OpenClaw używa tego konta niejawnie, nawet gdy `defaultAccount` nie jest ustawione.
Jeśli konfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekaż `--account <id>` dla poleceń CLI, które opierają się na niejawnym wyborze konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz zgodę per konto.

Jeśli Twój homeserver działa na localhost, adresie IP LAN/Tailscale lub wewnętrznej nazwie hosta, włącz
`network.dangerouslyAllowPrivateNetwork` dla tego konta Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Przykład konfiguracji przez CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ten mechanizm opt-in dopuszcza tylko zaufane prywatne/wewnętrzne cele. Publiczne nieszyfrowane homeservery, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. W miarę możliwości preferuj `https://`.

## Proxy dla ruchu Matrix

Jeśli Twoje wdrożenie Matrix wymaga jawnego wychodzącego proxy HTTP(S), ustaw `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w runtime i dla sond statusu kont.

## Rozwiązywanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie w aktywnym katalogu używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów akceptują bezpośrednio jawne identyfikatory pokojów i aliasy, a następnie awaryjnie przeszukują nazwy pokojów, do których konto dołączyło.
- Wyszukiwanie po nazwie pokoju pośród dołączonych pokojów działa best-effort. Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ona ignorowana podczas rozwiązywania allowlist w runtime.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale albo wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` i `channels.matrix.accounts.<id>.accessToken` obsługiwane są zwykłe wartości tekstowe i wartości SecretRef we wszystkich providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są zwykłe wartości tekstowe i wartości SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia dla logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi politykę pokoju `open` do `allowlist` i wymusza zmianę wszystkich aktywnych polityk DM oprócz `disabled` (w tym `pairing` i `open`) na `allowlist`. Nie wpływa na polityki `disabled`.
- `allowBots`: zezwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlista identyfikatorów użytkowników dla ruchu w pokojach. Pełne identyfikatory użytkowników Matrix są najbezpieczniejsze; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i po zmianie allowlist, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości z pokoju uwzględnianych jako kontekst historii grupy. Wartość awaryjna to `messages.groupChat.historyLimit`; jeśli oba pola nie są ustawione, efektywną wartością domyślną jest `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkicu w trybie najpierw podgląd przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa podglądowych notatek bez powiadomień dla samohostowanych konfiguracji z regułami push. `false` jest równoważne z `"off"`.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywny jest streaming szkicu podglądu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routingu i cyklu życia sesji powiązanych z wątkami.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowieniem automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar chunków wiadomości wychodzących w znakach (ma zastosowanie, gdy `chunkMode` ma wartość `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg znaków dodawany na początku wszystkich odpowiedzi wychodzących dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokojów podczas obsługi zaproszenia; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po tym, jak OpenClaw dołączył do pokoju i sklasyfikował go jako DM. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: allowlista identyfikatorów użytkowników dla ruchu DM. Pełne identyfikatory użytkowników Matrix są najbezpieczniejsze; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i po zmianie allowlist, gdy monitor działa. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, gdy chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet jeśli peer jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w DM.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec przez Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj identyfikatory pokojów lub aliasy; nierozwiązane nazwy pokojów są ignorowane w runtime. Tożsamość sesji/grupy używa stabilnego identyfikatora pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: allowlista nadawców per pokój.
- `groups.<room>.tools`: nadpisania zezwalania/zabraniania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmianką na poziomie pokoju. `true` wyłącza wymagania wzmianki dla tego pokoju; `false` wymusza ich ponowne włączenie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: bramkowanie narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
