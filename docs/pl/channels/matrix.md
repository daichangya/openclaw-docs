---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Status wsparcia Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-15T09:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 631f6fdcfebc23136c1a66b04851a25c047535d13cceba5650b8b421bc3afcf8
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączony Plugin kanałowy dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje DM-y, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony Plugin

Matrix jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
go ręcznie:

Zainstaluj z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Plugins](/pl/tools/plugin), aby poznać zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że Plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw zawierają go już domyślnie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie Gateway.
5. Rozpocznij DM z botem lub zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy zezwala na to `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator Matrix pyta o:

- URL homeservera
- metodę uwierzytelniania: token dostępu lub hasło
- ID użytkownika (tylko uwierzytelnianie hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokoi i automatyczne dołączanie do zaproszeń

Najważniejsze zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją, a dla tego konta nie zapisano jeszcze uwierzytelniania w konfiguracji, kreator oferuje skrót env, aby zachować dane uwierzytelniania w zmiennych środowiskowych.
- Nazwy kont są normalizowane do ID konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy listy dozwolonych DM akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie dokładnie jedno dopasowanie.
- Wpisy listy dozwolonych pokoi akceptują bezpośrednio ID pokoi i aliasy. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania listy dozwolonych.
- W trybie listy dozwolonych dla automatycznego dołączania do zaproszeń używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
Domyślna wartość `channels.matrix.autoJoin` to `off`.

Jeśli pozostawisz ją nieustawioną, bot nie będzie dołączał do zaproszonych pokoi ani nowych zaproszeń w stylu DM, więc nie pojawi się w nowych grupach ani zaproszonych DM-ach, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia akceptuje, albo ustaw `autoJoin: "always"`, jeśli ma dołączać do każdego zaproszenia.

W trybie `allowlist` pole `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
</Warning>

Przykład listy dozwolonych:

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

Dołączaj do każdego zaproszenia:

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

Matrix przechowuje buforowane poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Jeśli w tej lokalizacji istnieją buforowane poświadczenia, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby konfiguracji, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki w postaci zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne użyj zmiennych środowiskowych przypisanych do konta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Przykład dla konta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Dla znormalizowanego ID konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix ucieka znaki interpunkcyjne w ID kont, aby uniknąć kolizji przypisanych zmiennych środowiskowych.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem DM, listą dozwolonych pokoi i włączonym E2EE:

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
sklasyfikować zaproszonego pokoju jako DM lub grupy w momencie zaproszenia, więc wszystkie zaproszenia przechodzą najpierw przez `autoJoin`.
`dm.policy` ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako DM.

## Podglądy strumieniowe

Strumieniowanie odpowiedzi Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą odpowiedź
z podglądem na żywo, edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie finalizował go po
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

- `streaming: "off"` jest wartością domyślną. OpenClaw czeka na końcową odpowiedź i wysyła ją tylko raz.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku odpowiedzi asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać o pierwszym strumieniowanym tekście podglądu zamiast o ukończonym bloku.
- `streaming: "quiet"` tworzy jeden edytowalny cichy podgląd dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy jednocześnie skonfigurujesz reguły push odbiorcy dla finalizowanych edycji podglądu.
- `blockStreaming: true` włącza oddzielne komunikaty postępu Matrix. Gdy strumieniowanie podglądu jest włączone, Matrix zachowuje aktywny szkic dla bieżącego bloku i pozostawia ukończone bloki jako osobne wiadomości.
- Gdy podgląd strumieniowy jest włączony, a `blockStreaming` jest wyłączone, Matrix edytuje aktywny szkic w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub całej tury.
- Jeśli podgląd przestanie mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do zwykłego końcowego dostarczenia.
- Odpowiedzi multimedialne nadal wysyłają załączniki normalnie. Jeśli nieaktualny podgląd nie może już zostać bezpiecznie ponownie użyty, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz najbardziej zachowawczego zachowania względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów szkicu.
Użyj `streaming: "partial"` lub `streaming: "quiet"` dla edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz także, aby ukończone bloki odpowiedzi asystenta pozostały widoczne jako osobne komunikaty postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania „najpierw podgląd” lub pozostaw `streaming` wyłączone dla dostarczania tylko końcowej odpowiedzi. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą wiadomość Matrix generującą powiadomienie.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą wiadomość Matrix generującą powiadomienie.

### Samohostowane reguły push dla cichych finalizowanych podglądów

Jeśli uruchamiasz własną infrastrukturę Matrix i chcesz, aby ciche podglądy wysyłały powiadomienie dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla finalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik odbiorca = osoba, która ma otrzymać powiadomienie
- użytkownik bota = konto Matrix OpenClaw, które wysyła odpowiedź
- do poniższych wywołań API użyj tokenu dostępu użytkownika odbiorcy
- dopasuj `sender` w regule push do pełnego MXID użytkownika bota

1. Skonfiguruj OpenClaw tak, aby używał cichych podglądów:

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

3. Pobierz token dostępu użytkownika odbiorcy.
   - Użyj tokenu użytkownika odbierającego, a nie tokenu bota.
   - Najłatwiej zwykle ponownie użyć tokenu istniejącej sesji klienta.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API Client-Server Matrix:

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

4. Zweryfikuj, że konto odbiorcy ma już pushery:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli to nie zwraca żadnych aktywnych pusherów/urządzeń, najpierw napraw zwykłe powiadomienia Matrix, zanim dodasz
poniższą regułę OpenClaw.

OpenClaw oznacza sfinalizowane edycje podglądu tylko tekstowego następująco:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Utwórz regułę push typu override dla każdego konta odbiorcy, które ma otrzymywać te powiadomienia:

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
- `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbierającego
- `openclaw-finalized-preview-botname`: ID reguły unikalne dla tego bota dla tego użytkownika odbierającego
- `@bot:example.org`: MXID Twojego bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne w konfiguracjach z wieloma botami:

- Reguły push są identyfikowane przez `ruleId`. Ponowne uruchomienie `PUT` dla tego samego ID reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia dla wielu kont botów Matrix OpenClaw, utwórz jedną regułę na bota z unikalnym ID reguły dla każdego dopasowania nadawcy.
- Prostym wzorcem jest `openclaw-finalized-preview-<botname>`, na przykład `openclaw-finalized-preview-ops` lub `openclaw-finalized-preview-support`.

Reguła jest oceniana względem nadawcy zdarzenia:

- uwierzytelnij się tokenem użytkownika odbierającego
- dopasuj `sender` do MXID bota OpenClaw

6. Zweryfikuj, że reguła istnieje:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Przetestuj odpowiedź strumieniowaną. W trybie cichym pokój powinien wyświetlić cichy szkic podglądu, a końcowa
   edycja w miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później będziesz musiał usunąć regułę, usuń to samo ID reguły tokenem użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę przy użyciu tokenu dostępu użytkownika odbierającego, a nie tokenu bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami tłumiącymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu wyłącznie tekstowego, które OpenClaw może bezpiecznie sfinalizować w miejscu. Awaryjne przełączenia dla multimediów i nieaktualnych podglądów nadal używają zwykłego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Nie jest wymagana żadna specjalna zmiana w `homeserver.yaml` dla powiadomień o sfinalizowanych podglądach OpenClaw.
- Jeśli wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` poprawnie trafia do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery działają prawidłowo. Dostarczanie powiadomień push jest obsługiwane przez proces główny lub `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

W przypadku Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano powyżej:

- Nie jest wymagana żadna konfiguracja specyficzna dla Tuwunel dla samego znacznika sfinalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, głównym krokiem konfiguracji jest token użytkownika + powyższe wywołanie `pushrules`.
- Jeśli wygląda na to, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 r. i może ona celowo tłumić powiadomienia push do innych urządzeń, gdy jedno urządzenie jest aktywne.

## Pokoje bot-do-bota

Domyślnie wiadomości Matrix z innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, jeśli celowo chcesz zezwolić na ruch Matrix między agentami:

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

- `allowBots: true` akceptuje wiadomości z innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i DM-ach.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach wyraźnie wspominają tego bota. DM-y są nadal dozwolone.
- `groups.<room>.allowBots` zastępuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości z tego samego ID użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tej bramie OpenClaw”.

Używaj ścisłych list dozwolonych pokoi i wymagań dotyczących wzmianek podczas włączania ruchu bot-do-bota we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — Plugin automatycznie wykrywa stan E2EE.

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

Uwzględnij zapisany klucz odzyskiwania w wyjściu czytelnym maszynowo:

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

Wymuś nowy reset tożsamości cross-signing przed bootstrapem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Zweryfikuj to urządzenie za pomocą klucza odzyskiwania:

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

Usuń bieżącą kopię zapasową serwera i utwórz nową bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie załadowany, ten reset może również odtworzyć sekretne przechowywanie, tak aby
przyszłe zimne uruchomienia mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (łącznie z cichym wewnętrznym logowaniem SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Użyj `--json`, aby uzyskać pełne wyjście czytelne maszynowo podczas skryptowania.

W konfiguracjach wielokontowych polecenia CLI Matrix używają niejawnego domyślnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń były jawnie kierowane do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują na klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy zostało zweryfikowane przez Twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` pokazuje trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza to urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane Twoim własnym kluczem self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje kolejno wszystkie poniższe działania:

- inicjalizuje sekretne przechowywanie, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje cross-signing i przesyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać bieżące urządzenie metodą cross-signing
- tworzy nową kopię zapasową kluczy pokojów po stronie serwera, jeśli taka jeszcze nie istnieje

Jeśli homeserver wymaga interaktywnego uwierzytelniania do przesłania kluczy cross-signing, OpenClaw najpierw próbuje przesłać je bez uwierzytelniania, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowano `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz odrzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz odrzucić bieżącą kopię zapasową kluczy pokojów i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że nieodzyskiwalna stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć sekretne przechowywanie, jeśli bieżący sekret
kopii zapasowej nie może zostać bezpiecznie załadowany.

### Nowa baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, gdy chcesz jawnie wskazać nazwane konto Matrix.

### Zachowanie przy uruchamianiu

Gdy `encryption: true`, Matrix domyślnie ustawia `startupVerification` na `"if-unverified"`.
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix zażąda samoweryfikacji w innym kliencie Matrix,
pominie duplikaty żądań, jeśli jedno już oczekuje, i zastosuje lokalny czas odczekania przed ponowną próbą po restartach.
Domyślnie próby żądań zakończone niepowodzeniem są ponawiane szybciej niż pomyślne utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, albo dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze lub dłuższe okno ponawiania.

Przy uruchamianiu automatycznie wykonywany jest także zachowawczy przebieg bootstrapu kryptograficznego.
Najpierw próbuje on ponownie użyć bieżącego sekretnego przechowywania i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawy bootstrapu.

Jeśli podczas uruchamiania zostanie wykryty uszkodzony stan bootstrapu i skonfigurowano `channels.matrix.password`, OpenClaw może spróbować bardziej rygorystycznej ścieżki naprawy.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowa tę tożsamość zamiast resetować ją automatycznie.

Zobacz [migrację Matrix](/pl/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracji.

### Powiadomienia o weryfikacji

Matrix publikuje powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniu weryfikacji
- powiadomienia o gotowości do weryfikacji (z jawną wskazówką „Zweryfikuj za pomocą emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przypadku przepływów samoweryfikacji OpenClaw automatycznie uruchamia też przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją własną stronę.
W przypadku żądań weryfikacji z innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS będzie przebiegał normalnie.
Nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i potwierdzić tam „Pasują”, aby zakończyć weryfikację.

OpenClaw nie akceptuje ślepo automatycznie duplikatów przepływów zainicjowanych samodzielnie. Przy uruchamianiu pomijane jest tworzenie nowego żądania, jeśli żądanie samoweryfikacji już oczekuje.

Powiadomienia protokołu/systemu weryfikacji nie są przekazywane do potoku czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Stare urządzenia Matrix zarządzane przez OpenClaw mogą gromadzić się na koncie i utrudniać ocenę zaufania w zaszyfrowanych pokojach.
Wyświetl je poleceniem:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw poleceniem:

```bash
openclaw matrix devices prune-stale
```

### Magazyn kryptograficzny

Matrix E2EE używa oficjalnej ścieżki Rust crypto z `matrix-js-sdk` w Node, z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w pliku migawki (`crypto-idb-snapshot.json`) i przywracany przy uruchamianiu. Plik migawki to wrażliwy stan środowiska uruchomieniowego przechowywany z restrykcyjnymi uprawnieniami do pliku.

Zaszyfrowany stan środowiska uruchomieniowego znajduje się w korzeniach per konto, per użytkownik, per hash tokenu w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera magazyn synchronizacji (`bot-storage.json`), magazyn kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), migawkę IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) oraz stan weryfikacji przy uruchamianiu (`startup-verification.json`).
Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
korzenia dla krotki konto/homeserver/użytkownik, dzięki czemu wcześniejszy stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchamianiu pozostają widoczne.

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio adresy URL awatarów `mxc://`. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw przesyła go do Matrix, a następnie zapisuje rozwiązany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub wybranego nadpisania konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek przez narzędzia wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie DM Matrix w zakresie nadawcy, więc wiele pokoi DM może współdzielić jedną sesję, jeśli rozwiązują się do tego samego partnera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając zwykłego uwierzytelniania DM i kontroli listy dozwolonych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i zachowuje przychodzące wiadomości we wątkach w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy przychodząca wiadomość już była w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokojach we wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę konwersację przez pasującą sesję o zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` zastępuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków pokojów, a DM-y pozostawić płaskie.
- Przychodzące wiadomości we wątkach zawierają główną wiadomość wątku jako dodatkowy kontekst agenta.
- Wysyłki przez narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam cel użytkownika DM, chyba że podano jawne `threadId`.
- Ponowne użycie celu użytkownika DM w tej samej sesji działa tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego partnera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do zwykłego routowania w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje w tym pokoju jednorazowe `m.notice` z furtką `/focus`, gdy powiązania wątków są włączone, oraz wskazówką `dm.sessionScope`.
- Powiązania wątków środowiska uruchomieniowego są obsługiwane w Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkami `/acp spawn` działają w pokojach i DM-ach Matrix.
- Polecenie `/focus` na najwyższym poziomie pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje, DM-y i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz dalej używać.
- W DM lub pokoju Matrix na najwyższym poziomie bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże bieżący wątek w miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję ACP i usuwa powiązanie.

Uwagi:

- `--bind here` nie tworzy podrzędnego wątku Matrix.
- `threadBindings.spawnAcpSessions` jest wymagane tylko dla `/acp spawn --thread auto|here`, gdy OpenClaw musi utworzyć lub powiązać podrzędny wątek Matrix.

### Konfiguracja powiązań wątków

Matrix dziedziczy globalne wartości domyślne z `session.threadBindings`, a także obsługuje nadpisania per kanał:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flagi uruchamiania związane z wątkami Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby zezwolić, by `/focus` na najwyższym poziomie tworzył i wiązał nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby zezwolić, by `/acp spawn --thread auto|here` wiązał sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach oraz przychodzące reakcje potwierdzenia.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do określonego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla określonego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota dla tego zdarzenia.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Zakres reakcji potwierdzenia jest rozwiązywany według standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- emoji tożsamości agenta jako wartość zapasowa

Zakres reakcji potwierdzenia jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza zdarzenia systemowe reakcji.
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix przedstawia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` określa, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość w pokoju Matrix wyzwala agenta. Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM-y nadal używają zwykłej historii sesji.
- Historia pokoju Matrix dotyczy tylko oczekujących wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści wejściowej tej tury.
- Ponowne próby tego samego zdarzenia Matrix ponownie używają oryginalnej migawki historii zamiast przesuwać się naprzód do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje wspólną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` jest wartością domyślną. Uzupełniający kontekst jest zachowywany bez zmian.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne kontrole listy dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność uzupełniającego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalacza nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i polityki DM.

## Zasady DM i pokoi

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

Zobacz [Groups](/pl/channels/groups), aby poznać działanie bramkowania wzmiankami i listy dozwolonych.

Przykład parowania dla DM-ów Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix będzie nadal wysyłać Ci wiadomości przed zatwierdzeniem, OpenClaw ponownie użyje tego samego oczekującego kodu parowania i może ponownie wysłać odpowiedź-przypomnienie po krótkim czasie odczekania zamiast generować nowy kod.

Zobacz [Pairing](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ pamięci.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich ulegnie rozjechaniu, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują na stare pokoje solo zamiast na aktywny DM. Sprawdź bieżące mapowanie dla partnera za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przepływ naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- w przeciwnym razie wybiera dowolny aktualnie dołączony ścisły DM 1:1 z tym użytkownikiem
- tworzy nowy pokój bezpośredni i przepisuje `m.direct`, jeśli nie istnieje żaden zdrowy DM

Przepływ naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia o weryfikacji i inne przepływy wiadomości bezpośrednich znów trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
ustawienia routowania DM/kanału nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalnie; wartość zapasowa to `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec używają najpierw `execApprovals.approvers` i mogą wrócić do `channels.matrix.dm.allowFrom`. Zatwierdzenia Pluginów autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzeń wracają do innych skonfigurowanych ścieżek zatwierdzania lub zasad awaryjnych zatwierdzeń.

Natywne routowanie Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb rozsyłania DM/kanału dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia Pluginów używają listy dozwolonych DM Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zatwierdzeń exec, jak i Pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do DM-ów zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju lub DM Matrix
- `target: "both"` wysyła do DM-ów zatwierdzających oraz do źródłowego pokoju lub DM Matrix

Prompty zatwierdzeń Matrix inicjalizują skróty reakcji w głównej wiadomości zatwierdzenia:

- `✅` = zezwól jednorazowo
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą reagować na tę wiadomość lub używać zapasowych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` albo `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odmawiać. W przypadku zatwierdzeń exec dostarczanie kanałowe zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Exec approvals](/pl/tools/exec-approvals)

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
Możesz ograniczyć dziedziczone wpisy pokoi do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje konto najwyższego poziomu `default` tylko wtedy, gdy to konto domyślne ma aktualne uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta mogą nadal pozostać wykrywalne z `homeserver` plus `userId`, gdy buforowane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Tylko klucze uwierzytelniania/bootstrapu Matrix są przenoszone do promowanego konta; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix dla niejawnego routowania, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix i jedno ID konta to `default`, OpenClaw używa tego konta niejawnie, nawet jeśli `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekazuj `--account <id>` dla poleceń CLI, które opierają się na niejawnym wyborze konta.
Przekazuj `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla jednego polecenia.

Zobacz [Configuration reference](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix jako ochronę przed SSRF, chyba że
jawnie włączysz zgodę per konto.

Jeśli Twój homeserver działa na localhost, adresie IP LAN/Tailscale albo wewnętrznej nazwie hosta, włącz
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

Ta zgoda obejmuje tylko zaufane cele prywatne/wewnętrzne. Publiczne homeservery cleartext, takie jak
`http://matrix.example.org:8008`, pozostają zablokowane. Jeśli to możliwe, preferuj `https://`.

## Przekazywanie ruchu Matrix przez proxy

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

Nazwane konta mogą nadpisywać domyślną wartość najwyższego poziomu za pomocą `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w środowisku uruchomieniowym oraz dla sond statusu konta.

## Rozwiązywanie celów

Matrix akceptuje te formy celów wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie na żywo w katalogu używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytują katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokoi bezpośrednio akceptują jawne ID pokoi i aliasy, a następnie wracają do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi jest best-effort. Jeśli nazwy pokoju nie można rozwiązać do ID ani aliasu, jest ona ignorowana podczas rozwiązywania listy dozwolonych w środowisku uruchomieniowym.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowane ID konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale lub wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisywać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełne ID użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` obsługiwane są zwykłe wartości tekstowe i wartości SecretRef w providerach env/file/exec. Zobacz [Secrets Management](/pl/gateway/secrets).
- `password`: hasło dla logowania opartego na haśle. Obsługiwane są zwykłe wartości tekstowe i wartości SecretRef.
- `deviceId`: jawne ID urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia dla logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi politykę pokoi `open` do `allowlist` i wymusza dla wszystkich aktywnych polityk DM poza `disabled` (w tym `pairing` i `open`) wartość `allowlist`. Nie wpływa na polityki `disabled`.
- `allowBots`: zezwala na wiadomości z innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` albo `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych ID użytkowników dla ruchu w pokojach. Wpisy powinny być pełnymi ID użytkowników Matrix; nierozwiązane nazwy są ignorowane w czasie działania.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` albo `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` albo `false`. `"partial"` i `true` włączają aktualizacje szkicu „najpierw podgląd” przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa podglądów notice bez powiadomień dla samohostowanych konfiguracji reguł push. `false` jest równoważne z `"off"`.
- `blockStreaming`: `true` włącza oddzielne komunikaty postępu dla ukończonych bloków odpowiedzi asystenta, gdy aktywne jest strumieniowanie szkicu podglądu.
- `threadReplies`: `off`, `inbound` albo `always`.
- `threadBindings`: nadpisania per kanał dla routowania sesji związanych z wątkami i ich cyklu życia.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: czas odczekania przed ponowną próbą automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej w znakach (ma zastosowanie, gdy `chunkMode` to `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg poprzedzający wszystkie odpowiedzi wychodzące dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzenia (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb powiadomień o reakcjach przychodzących (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń w stylu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do ID pokoi podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po tym, jak OpenClaw dołączył do pokoju i sklasyfikował go jako DM. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: wpisy powinny być pełnymi ID użytkowników Matrix, chyba że zostały już rozwiązane przez wyszukiwanie katalogowe na żywo.
- `dm.sessionScope`: `per-user` (domyślnie) albo `per-room`. Użyj `per-room`, gdy chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet jeśli partner jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umiejscowienia odpowiedzi, jak i izolacji sesji w DM-ach.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj ID pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w czasie działania. Tożsamość sesji/grupy używa stabilnego ID pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` albo `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców per pokój.
- `groups.<room>.tools`: nadpisania zezwalania/zabraniania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie na poziomie pokoju dla bramkowania wzmiankami. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment systemPrompt na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: bramkowanie narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
