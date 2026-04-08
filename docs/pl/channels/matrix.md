---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady ustawień
title: Matrix
x-i18n:
    generated_at: "2026-04-08T02:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec926df79a41fa296d63f0ec7219d0f32e075628d76df9ea490e93e4c5030f83
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix to dołączona wtyczka kanału Matrix dla OpenClaw.
Korzysta z oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączona wtyczka

Matrix jest dostarczany jako dołączona wtyczka w aktualnych wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Matrix, zainstaluj
go ręcznie:

Instalacja z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Wtyczki](/pl/tools/plugin), aby poznać zachowanie wtyczek i zasady instalacji.

## Konfiguracja

1. Upewnij się, że wtyczka Matrix jest dostępna.
   - Aktualne spakowane wydania OpenClaw już ją zawierają.
   - Starsze/niestandardowe instalacje mogą dodać ją ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, lub
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie gateway.
5. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy `channels.matrix.autoJoin` na to pozwala.

Ścieżki konfiguracji interaktywnej:

```bash
openclaw channels add
openclaw configure --section channels
```

O co dokładnie pyta kreator Matrix:

- URL homeservera
- metoda uwierzytelniania: token dostępu lub hasło
- identyfikator użytkownika tylko wtedy, gdy wybierzesz uwierzytelnianie hasłem
- opcjonalna nazwa urządzenia
- czy włączyć E2EE
- czy skonfigurować teraz dostęp do pokojów Matrix
- czy skonfigurować teraz automatyczne dołączanie do zaproszeń Matrix
- gdy automatyczne dołączanie do zaproszeń jest włączone, czy ma mieć wartość `allowlist`, `always` czy `off`

Istotne zachowanie kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją dla wybranego konta, a to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót do env, dzięki czemu konfiguracja może pozostawić uwierzytelnianie w zmiennych środowiskowych zamiast kopiować sekrety do konfiguracji.
- Gdy interaktywnie dodajesz kolejne konto Matrix, wprowadzona nazwa konta jest normalizowana do identyfikatora konta używanego w konfiguracji i zmiennych środowiskowych. Na przykład `Ops Bot` staje się `ops-bot`.
- Monity listy dozwolonych dla wiadomości prywatnych od razu akceptują pełne wartości `@user:server`. Nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie jedno dokładne dopasowanie; w przeciwnym razie kreator poprosi o ponowną próbę z pełnym identyfikatorem Matrix.
- Monity listy dozwolonych dla pokojów bezpośrednio akceptują identyfikatory pokojów i aliasy. Mogą też na żywo rozwiązywać nazwy dołączonych pokojów, ale nierozwiązane nazwy są podczas konfiguracji zachowywane tylko w postaci wpisanej i później są ignorowane przez runtime przy rozwiązywaniu listy dozwolonych. Preferuj `!room:server` lub `#alias:server`.
- Kreator wyświetla teraz jawne ostrzeżenie przed krokiem automatycznego dołączania do zaproszeń, ponieważ domyślna wartość `channels.matrix.autoJoin` to `off`; agenty nie dołączą do zaproszonych pokojów ani nowych zaproszeń w stylu wiadomości prywatnej, dopóki tego nie ustawisz.
- W trybie listy dozwolonych dla automatycznego dołączania do zaproszeń używaj wyłącznie stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokojów są odrzucane.
- Tożsamość pokoju/sesji w runtime używa stabilnego identyfikatora pokoju Matrix. Aliasy zadeklarowane przez pokój są używane tylko jako dane wejściowe do wyszukiwania, a nie jako długoterminowy klucz sesji lub stabilna tożsamość grupy.
- Aby rozwiązać nazwy pokojów przed ich zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
Domyślna wartość `channels.matrix.autoJoin` to `off`.

Jeśli pozostawisz tę opcję nieustawioną, bot nie będzie dołączał do zaproszonych pokojów ani nowych zaproszeń w stylu wiadomości prywatnej, więc nie pojawi się w nowych grupach ani zaproszonych wiadomościach prywatnych, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia są akceptowane, albo ustaw `autoJoin: "always"`, jeśli ma dołączać do każdego zaproszenia.

W trybie `allowlist` opcja `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
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

Matrix przechowuje zbuforowane poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Gdy znajdują się tam zbuforowane poświadczenia, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby konfiguracji, doctor i wykrywania stanu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki w zmiennych środowiskowych (używane, gdy klucz konfiguracyjny nie jest ustawiony):

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

Dla znormalizowanego identyfikatora konta `ops-bot` użyj:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix zamienia znaki interpunkcyjne w identyfikatorach kont, aby uniknąć kolizji w zmiennych środowiskowych przypisanych do kont.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją i wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

## Przykład konfiguracji

To praktyczna bazowa konfiguracja z parowaniem wiadomości prywatnych, listą dozwolonych pokojów i włączonym E2EE:

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

`autoJoin` dotyczy ogólnie zaproszeń Matrix, a nie tylko zaproszeń do pokojów/grup.
Obejmuje to także nowe zaproszenia w stylu wiadomości prywatnej. W momencie zaproszenia OpenClaw nie wie
wiarygodnie, czy zaproszony pokój zostanie ostatecznie potraktowany jako wiadomość prywatna czy grupa,
dlatego wszystkie zaproszenia najpierw przechodzą przez tę samą decyzję `autoJoin`. `dm.policy` nadal
ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako wiadomość prywatna, więc `autoJoin`
steruje zachowaniem dołączania, a `dm.policy` steruje zachowaniem odpowiedzi/dostępu.

## Podglądy streamingu

Streaming odpowiedzi Matrix jest opcjonalny.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą
odpowiedź z podglądem na żywo, edytował ten podgląd na miejscu podczas generowania tekstu przez model,
a następnie finalizował go po zakończeniu odpowiedzi:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` to ustawienie domyślne. OpenClaw czeka na końcową odpowiedź i wysyła ją jednorazowo.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku odpowiedzi asystenta, używając zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą powiadamiać na podstawie pierwszego przesłanego tekstu podglądu zamiast gotowego bloku.
- `streaming: "quiet"` tworzy jedno edytowalne ciche powiadomienie podglądu dla bieżącego bloku odpowiedzi asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz też reguły push odbiorcy dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Gdy streaming podglądu jest włączony, Matrix zachowuje wersję roboczą na żywo dla bieżącego bloku i zachowuje ukończone bloki jako oddzielne wiadomości.
- Gdy streaming podglądu jest włączony, a `blockStreaming` jest wyłączone, Matrix edytuje wersję roboczą na żywo na miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje streaming podglądu i wraca do normalnego końcowego dostarczenia.
- Odpowiedzi z multimediami nadal wysyłają załączniki normalnie. Jeśli starego podglądu nie da się już bezpiecznie ponownie użyć, OpenClaw usuwa go przed wysłaniem końcowej odpowiedzi z multimediami.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw streaming wyłączony, jeśli chcesz zachować najbardziej ostrożne zachowanie względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów wersji roboczych.
Użyj `streaming: "partial"` lub `streaming: "quiet"` do edycji podglądu; dopiero potem dodaj `blockStreaming: true`, jeśli chcesz także, by ukończone bloki asystenta pozostawały widoczne jako oddzielne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania „najpierw podgląd” albo pozostaw `streaming` wyłączone dla dostarczania tylko końcowej odpowiedzi. Gdy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą powiadamiającą wiadomość Matrix.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą powiadamiającą wiadomość Matrix.

### Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów

Jeśli utrzymujesz własną infrastrukturę Matrix i chcesz, aby ciche podglądy wysyłały powiadomienie dopiero po zakończeniu bloku lub
końcowej odpowiedzi, ustaw `streaming: "quiet"` i dodaj regułę push per użytkownik dla sfinalizowanych edycji podglądu.

Zwykle jest to konfiguracja po stronie użytkownika-odbiorcy, a nie globalna zmiana konfiguracji homeservera:

Szybka mapa przed rozpoczęciem:

- użytkownik odbiorca = osoba, która ma otrzymywać powiadomienie
- użytkownik bota = konto Matrix OpenClaw wysyłające odpowiedź
- do poniższych wywołań API użyj tokena dostępu użytkownika odbiorcy
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
   - Użyj tokena użytkownika odbierającego, a nie tokena bota.
   - Najłatwiej zwykle ponownie użyć tokena istniejącej sesji klienta.
   - Jeśli musisz wygenerować nowy token, możesz zalogować się przez standardowe API Matrix Client-Server:

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

Jeśli to zwraca brak aktywnych pusherów/urządzeń, najpierw napraw zwykłe powiadomienia Matrix, zanim dodasz
poniższą regułę OpenClaw.

OpenClaw oznacza sfinalizowane edycje podglądu tylko tekstowego znacznikiem:

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

- `https://matrix.example.org`: bazowy URL twojego homeservera
- `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbierającego
- `openclaw-finalized-preview-botname`: identyfikator reguły unikalny dla tego bota dla tego użytkownika odbierającego
- `@bot:example.org`: MXID twojego bota Matrix OpenClaw, a nie MXID użytkownika odbierającego

Ważne w konfiguracjach z wieloma botami:

- Reguły push są kluczowane przez `ruleId`. Ponowne uruchomienie `PUT` względem tego samego identyfikatora reguły aktualizuje tę jedną regułę.
- Jeśli jeden użytkownik odbierający ma otrzymywać powiadomienia od wielu kont botów Matrix OpenClaw, utwórz jedną regułę na bota z unikalnym identyfikatorem reguły dla każdego dopasowania nadawcy.
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

7. Przetestuj odpowiedź strumieniowaną. W trybie quiet pokój powinien pokazać cichy podgląd wersji roboczej, a końcowa
   edycja na miejscu powinna wysłać powiadomienie po zakończeniu bloku lub tury.

Jeśli później chcesz usunąć regułę, usuń ten sam identyfikator reguły tokenem użytkownika odbierającego:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Uwagi:

- Utwórz regułę z użyciem tokena dostępu użytkownika odbierającego, a nie bota.
- Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami wyciszającymi, więc nie jest potrzebny dodatkowy parametr kolejności.
- Dotyczy to tylko edycji podglądu tylko tekstowego, które OpenClaw może bezpiecznie sfinalizować na miejscu. Fallbacki dla multimediów i starych podglądów nadal używają normalnego dostarczania Matrix.
- Jeśli `GET /_matrix/client/v3/pushers` nie pokazuje żadnych pusherów, użytkownik nie ma jeszcze działającego dostarczania powiadomień push Matrix dla tego konta/urządzenia.

#### Synapse

W przypadku Synapse powyższa konfiguracja zwykle sama w sobie wystarcza:

- Żadna specjalna zmiana w `homeserver.yaml` nie jest wymagana dla sfinalizowanych powiadomień o podglądzie OpenClaw.
- Jeśli twoje wdrożenie Synapse już wysyła zwykłe powiadomienia push Matrix, token użytkownika + wywołanie `pushrules` powyżej to główny krok konfiguracji.
- Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` trafia poprawnie do Synapse.
- Jeśli używasz workerów Synapse, upewnij się, że pushery są sprawne. Dostarczanie push jest obsługiwane przez proces główny lub `synapse.app.pusher` / skonfigurowane workery pusherów.

#### Tuwunel

Dla Tuwunel użyj tego samego przepływu konfiguracji i wywołania API `pushrules`, które pokazano powyżej:

- Żadna konfiguracja specyficzna dla Tuwunel nie jest wymagana dla samego znacznika sfinalizowanego podglądu.
- Jeśli zwykłe powiadomienia Matrix już działają dla tego użytkownika, token użytkownika + wywołanie `pushrules` powyżej to główny krok konfiguracji.
- Jeśli wydaje się, że powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w Tuwunel 1.4.2 12 września 2025 r. i może ona celowo wyciszać powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Niezaszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — wtyczka automatycznie wykrywa stan E2EE.

### Pokoje bot-bot

Domyślnie wiadomości Matrix od innych skonfigurowanych kont Matrix OpenClaw są ignorowane.

Użyj `allowBots`, gdy celowo chcesz dopuścić ruch Matrix między agentami:

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

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i wiadomościach prywatnych.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach wyraźnie wspominają tego bota. Wiadomości prywatne są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tu natywnej flagi bota; OpenClaw traktuje „napisane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym gatewayu OpenClaw”.

Przy włączaniu ruchu bot-bot w pokojach współdzielonych używaj ścisłych list dozwolonych pokojów i wymagań wzmianki.

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

Sprawdź stan weryfikacji:

```bash
openclaw matrix verify status
```

Szczegółowy stan (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Dołącz zapisany klucz odzyskiwania w wyniku czytelnym maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjalizuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Obsługa wielu kont: użyj `channels.matrix.accounts` z poświadczeniami per konto i opcjonalnym `name`. Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference#multi-account-all-channels), aby poznać wspólny wzorzec.

Szczegółowa diagnostyka bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuś reset tożsamości cross-signing przed bootstrapem:

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

Sprawdź kondycję kopii zapasowej kluczy pokojów:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka kondycji kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokojów z kopii zapasowej na serwerze:

```bash
openclaw matrix verify backup restore
```

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie wczytany, ten reset może także odtworzyć magazyn sekretów, aby
przyszłe zimne starty mogły wczytać nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (łącznie z cichym wewnętrznym logowaniem SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Przy skryptowaniu użyj `--json`, aby otrzymać pełny wynik czytelny maszynowo.

W konfiguracjach z wieloma kontami polecenia CLI Matrix używają domyślnego niejawnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzenia były jawnie kierowane do konkretnego nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują na klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

### Co oznacza „zweryfikowane”

OpenClaw traktuje to urządzenie Matrix jako zweryfikowane tylko wtedy, gdy zostało zweryfikowane przez twoją własną tożsamość cross-signing.
W praktyce `openclaw matrix verify status --verbose` ujawnia trzy sygnały zaufania:

- `Locally trusted`: to urządzenie jest zaufane tylko przez bieżącego klienta
- `Cross-signing verified`: SDK zgłasza urządzenie jako zweryfikowane przez cross-signing
- `Signed by owner`: urządzenie jest podpisane przez twój własny klucz self-signing

`Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing lub podpis właściciela.
Samo lokalne zaufanie nie wystarcza, aby OpenClaw traktował urządzenie jako w pełni zweryfikowane.

### Co robi bootstrap

`openclaw matrix verify bootstrap` to polecenie naprawy i konfiguracji dla zaszyfrowanych kont Matrix.
Wykonuje po kolei wszystkie poniższe działania:

- inicjalizuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
- inicjalizuje cross-signing i wysyła brakujące publiczne klucze cross-signing
- próbuje oznaczyć i podpisać bieżące urządzenie przez cross-signing
- tworzy nową kopię zapasową kluczy pokojów po stronie serwera, jeśli jeszcze nie istnieje

Jeśli homeserver wymaga uwierzytelniania interaktywnego do wysłania kluczy cross-signing, OpenClaw próbuje najpierw bez uwierzytelniania, potem z `m.login.dummy`, a następnie z `m.login.password`, gdy skonfigurowano `channels.matrix.password`.

Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo chcesz porzucić bieżącą tożsamość cross-signing i utworzyć nową.

Jeśli celowo chcesz porzucić bieżącą kopię zapasową kluczy pokojów i rozpocząć nową
bazę kopii zapasowej dla przyszłych wiadomości, użyj `openclaw matrix verify backup reset --yes`.
Rób to tylko wtedy, gdy akceptujesz, że niemożliwa do odzyskania stara zaszyfrowana historia pozostanie
niedostępna i że OpenClaw może odtworzyć magazyn sekretów, jeśli bieżącego sekretu kopii zapasowej nie da się bezpiecznie wczytać.

### Nowa baza kopii zapasowej

Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę niemożliwej do odzyskania starej historii, uruchom po kolei te polecenia:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Dodaj `--account <id>` do każdego polecenia, gdy chcesz jawnie wskazać nazwane konto Matrix.

### Zachowanie przy uruchamianiu

Gdy `encryption: true`, domyślna wartość `startupVerification` w Matrix to `"if-unverified"`.
Przy uruchamianiu, jeśli to urządzenie nadal nie jest zweryfikowane, Matrix poprosi o samoweryfikację w innym kliencie Matrix,
pominie duplikaty żądań, gdy jedno jest już w toku, i zastosuje lokalny okres karencji przed ponowieniem po restarcie.
Nieudane próby wysłania żądania są domyślnie ponawiane szybciej niż udane utworzenie żądania.
Ustaw `startupVerification: "off"`, aby wyłączyć automatyczne żądania przy uruchamianiu, lub dostosuj `startupVerificationCooldownHours`,
jeśli chcesz krótsze albo dłuższe okno ponawiania.

Uruchamianie wykonuje też automatycznie ostrożny przebieg bootstrapu kryptograficznego.
Ten przebieg najpierw próbuje ponownie użyć bieżącego magazynu sekretów i tożsamości cross-signing oraz unika resetowania cross-signing, chyba że uruchomisz jawny przepływ naprawczy bootstrapu.

Jeśli podczas uruchamiania zostanie wykryty uszkodzony stan bootstrapu i skonfigurowano `channels.matrix.password`, OpenClaw może spróbować bardziej restrykcyjnej ścieżki naprawczej.
Jeśli bieżące urządzenie jest już podpisane przez właściciela, OpenClaw zachowuje tę tożsamość zamiast resetować ją automatycznie.

Uaktualnianie z poprzedniej publicznej wtyczki Matrix:

- OpenClaw automatycznie ponownie używa tego samego konta Matrix, tokena dostępu i tożsamości urządzenia, gdy to możliwe.
- Zanim zostaną uruchomione jakiekolwiek istotne zmiany migracyjne Matrix, OpenClaw tworzy lub ponownie używa migawki odzyskiwania w `~/Backups/openclaw-migrations/`.
- Jeśli używasz wielu kont Matrix, ustaw `channels.matrix.defaultAccount` przed aktualizacją ze starego płaskiego układu store, aby OpenClaw wiedział, które konto ma otrzymać ten współdzielony stan legacy.
- Jeśli poprzednia wtyczka przechowywała lokalnie klucz deszyfrujący kopii zapasowej kluczy pokojów Matrix, uruchamianie lub `openclaw doctor --fix` automatycznie zaimportuje go do nowego przepływu klucza odzyskiwania.
- Jeśli token dostępu Matrix zmienił się po przygotowaniu migracji, uruchamianie teraz skanuje sąsiednie katalogi główne przechowywania według skrótu tokena w poszukiwaniu oczekującego stanu przywracania legacy, zanim zrezygnuje z automatycznego przywracania kopii zapasowej.
- Jeśli token dostępu Matrix zmieni się później dla tego samego konta, homeservera i użytkownika, OpenClaw woli teraz ponownie użyć najbardziej kompletnego istniejącego katalogu głównego według skrótu tokena zamiast rozpoczynać od pustego katalogu stanu Matrix.
- Przy następnym uruchomieniu gatewaya klucze pokojów z kopii zapasowej zostaną automatycznie przywrócone do nowego store kryptograficznego.
- Jeśli stara wtyczka miała lokalne klucze pokojów, których nigdy nie zarchiwizowano, OpenClaw wyświetli wyraźne ostrzeżenie. Tych kluczy nie można automatycznie wyeksportować z poprzedniego rust crypto store, więc część starej zaszyfrowanej historii może pozostać niedostępna, dopóki nie zostanie odzyskana ręcznie.
- Zobacz [Migracja Matrix](/pl/install/migrating-matrix), aby poznać pełny przepływ aktualizacji, ograniczenia, polecenia odzyskiwania i typowe komunikaty migracyjne.

Stan zaszyfrowanego runtime jest zorganizowany pod katalogami głównymi per konto, per użytkownik, według skrótu tokena w
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ten katalog zawiera store synchronizacji (`bot-storage.json`), store kryptograficzny (`crypto/`),
plik klucza odzyskiwania (`recovery-key.json`), migawkę IndexedDB (`crypto-idb-snapshot.json`),
powiązania wątków (`thread-bindings.json`) i stan weryfikacji przy uruchamianiu (`startup-verification.json`),
gdy te funkcje są używane.
Gdy token zmienia się, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego
katalogu głównego dla krotki konto/homeserver/użytkownik, aby poprzedni stan synchronizacji, stan kryptograficzny, powiązania wątków
i stan weryfikacji przy uruchamianiu pozostały widoczne.

### Model Node crypto store

Matrix E2EE w tej wtyczce używa oficjalnej ścieżki Rust crypto `matrix-js-sdk` w Node.
Ta ścieżka oczekuje trwałości opartej na IndexedDB, jeśli chcesz, aby stan kryptograficzny przetrwał restarty.

OpenClaw obecnie zapewnia to w Node przez:

- używanie `fake-indexeddb` jako shimu API IndexedDB oczekiwanego przez SDK
- przywracanie zawartości IndexedDB Rust crypto z `crypto-idb-snapshot.json` przed `initRustCrypto`
- utrwalanie zaktualizowanej zawartości IndexedDB z powrotem do `crypto-idb-snapshot.json` po inicjalizacji i podczas runtime
- serializowanie przywracania i utrwalania migawki względem `crypto-idb-snapshot.json` za pomocą doradczego blokowania pliku, aby utrwalanie runtime gatewaya i konserwacja CLI nie ścigały się o ten sam plik migawki

To warstwa zgodności/przechowywania, a nie niestandardowa implementacja kryptografii.
Plik migawki jest wrażliwym stanem runtime i jest przechowywany z restrykcyjnymi uprawnieniami do pliku.
W modelu bezpieczeństwa OpenClaw host gatewaya i lokalny katalog stanu OpenClaw już znajdują się wewnątrz granicy zaufanego operatora, więc jest to przede wszystkim kwestia operacyjnej trwałości, a nie osobna zdalna granica zaufania.

Planowane ulepszenie:

- dodać obsługę SecretRef dla trwałego materiału kluczy Matrix, aby klucze odzyskiwania i powiązane sekrety szyfrowania store mogły pochodzić od dostawców sekretów OpenClaw zamiast wyłącznie z plików lokalnych

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix bezpośrednio akceptuje adresy URL awatarów `mxc://`. Gdy przekażesz adres URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix i zapisze rozwiązany adres URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub nadpisania wybranego konta).

## Automatyczne powiadomienia o weryfikacji

Matrix publikuje teraz powiadomienia o cyklu życia weryfikacji bezpośrednio w ścisłym pokoju wiadomości prywatnych do weryfikacji jako wiadomości `m.notice`.
Obejmuje to:

- powiadomienia o żądaniu weryfikacji
- powiadomienia o gotowości do weryfikacji (z jawną wskazówką „Zweryfikuj przez emoji”)
- powiadomienia o rozpoczęciu i zakończeniu weryfikacji
- szczegóły SAS (emoji i liczby dziesiętne), gdy są dostępne

Przychodzące żądania weryfikacji z innego klienta Matrix są śledzone i automatycznie akceptowane przez OpenClaw.
W przepływach samoweryfikacji OpenClaw także automatycznie rozpoczyna przepływ SAS, gdy weryfikacja emoji staje się dostępna, i potwierdza swoją stronę.
W przypadku żądań weryfikacji od innego użytkownika/urządzenia Matrix OpenClaw automatycznie akceptuje żądanie, a następnie czeka, aż przepływ SAS przebiegnie normalnie.
Aby zakończyć weryfikację, nadal musisz porównać emoji lub dziesiętny SAS w swoim kliencie Matrix i potwierdzić tam „Pasują”.

OpenClaw nie akceptuje bezrefleksyjnie samodzielnie zainicjowanych zduplikowanych przepływów. Podczas uruchamiania pomija tworzenie nowego żądania, jeśli żądanie samoweryfikacji jest już oczekujące.

Powiadomienia protokołu/systemu weryfikacji nie są przekazywane do potoku czatu agenta, więc nie powodują `NO_REPLY`.

### Higiena urządzeń

Na koncie mogą gromadzić się stare urządzenia Matrix zarządzane przez OpenClaw, co utrudnia interpretację zaufania w zaszyfrowanych pokojach.
Wyświetl ich listę poleceniem:

```bash
openclaw matrix devices list
```

Usuń nieaktualne urządzenia Matrix zarządzane przez OpenClaw poleceniem:

```bash
openclaw matrix devices prune-stale
```

### Naprawa pokoju bezpośredniego

Jeśli stan wiadomości prywatnych się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują na dawne pokoje solo zamiast aktywnej wiadomości prywatnej. Sprawdź bieżące mapowanie dla partnera za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je poleceniem:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Naprawa zachowuje logikę specyficzną dla Matrix wewnątrz wtyczki:

- preferuje ścisłą wiadomość prywatną 1:1, która jest już zmapowana w `m.direct`
- w przeciwnym razie przechodzi do dowolnej aktualnie dołączonej ścisłej wiadomości prywatnej 1:1 z tym użytkownikiem
- jeśli nie istnieje zdrowa wiadomość prywatna, tworzy nowy pokój bezpośredni i przepisuje `m.direct`, aby wskazywało na niego

Przepływ naprawy nie usuwa automatycznie starych pokojów. Wybiera tylko zdrową wiadomość prywatną i aktualizuje mapowanie, tak aby nowe wysyłki Matrix, powiadomienia o weryfikacji i inne przepływy wiadomości bezpośrednich znów trafiały do właściwego pokoju.

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla odpowiedzi automatycznych, jak i wysyłek narzędzia wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie wiadomości prywatnych Matrix w zakresie nadawcy, dzięki czemu wiele pokojów wiadomości prywatnych może współdzielić jedną sesję, jeśli rozwiążą się do tego samego partnera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój wiadomości prywatnych Matrix we własnym kluczu sesji, nadal używając zwykłych kontroli uwierzytelniania i list dozwolonych dla wiadomości prywatnych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybrany docelowy identyfikator sesji.
- `threadReplies: "off"` utrzymuje odpowiedzi na poziomie głównym i zachowuje przychodzące wiadomości wątkowane na sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca była już w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi pokojów we wątku zakorzenionym w wiadomości wyzwalającej i prowadzi tę konwersację przez odpowiadającą jej sesję o zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla wiadomości prywatnych. Na przykład możesz izolować wątki w pokojach, a jednocześnie zachować płaskie wiadomości prywatne.
- Przychodzące wiadomości wątkowane zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędzia wiadomości teraz automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam użytkownik docelowy wiadomości prywatnej, chyba że jawnie podano `threadId`.
- Ponowne użycie celu użytkownika wiadomości prywatnej dla tej samej sesji działa tylko wtedy, gdy bieżące metadane sesji potwierdzają tego samego partnera wiadomości prywatnej na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routowania w zakresie użytkownika.
- Gdy OpenClaw zauważy, że pokój wiadomości prywatnych Matrix koliduje z innym pokojem wiadomości prywatnych w tej samej współdzielonej sesji Matrix DM, publikuje w tym pokoju jednorazowe `m.notice` z furtką awaryjną `/focus`, gdy powiązania wątków są włączone, oraz wskazówką `dm.sessionScope`.
- Powiązania wątków w runtime są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` i powiązane z wątkiem `/acp spawn` działają teraz w pokojach i wiadomościach prywatnych Matrix.
- Główne `/focus` w pokoju/wiadomości prywatnej Matrix tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, wiadomości prywatne i istniejące wątki Matrix można przekształcić w trwałe przestrzenie robocze ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz wiadomości prywatnej, pokoju lub istniejącego wątku Matrix, którego chcesz nadal używać.
- W głównej wiadomości prywatnej lub pokoju Matrix bieżąca wiadomość prywatna/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do uruchomionej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże ten bieżący wątek na miejscu.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
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

Flagi uruchamiania powiązanego z wątkiem Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić głównemu `/focus` tworzyć i wiązać nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić `/acp spawn --thread auto|here` wiązać sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące działania reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzające.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota na tym zdarzeniu.
- `remove: true` usuwa z konta bota tylko wskazaną reakcję emoji.

Zakres reakcji potwierdzających jest rozwiązywany w standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- zapasowe emoji tożsamości agenta

Zakres reakcji potwierdzających jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Bieżące zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix napisanych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nadal nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje liczbę ostatnich wiadomości z pokoju dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta.
- Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`. Jeśli obie wartości nie są ustawione, efektywna wartość domyślna to `0`, więc wiadomości z pokoju wymagające wzmianki nie są buforowane. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. Wiadomości prywatne nadal używają zwykłej historii sesji.
- Historia pokoju Matrix obejmuje tylko stan oczekujący: OpenClaw buforuje wiadomości z pokoju, które nie wywołały jeszcze odpowiedzi, a następnie robi migawkę tego okna, gdy nadejdzie wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest dołączana do `InboundHistory`; pozostaje w głównej treści przychodzącej tej tury.
- Ponowienia dla tego samego zdarzenia Matrix używają pierwotnej migawki historii zamiast przesuwać się do przodu do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje wspólną kontrolę `contextVisibility` dla uzupełniającego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` to ustawienie domyślne. Uzupełniający kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje uzupełniający kontekst do nadawców dozwolonych przez aktywne sprawdzanie list dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność kontekstu uzupełniającego, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwolenia nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i zasad wiadomości prywatnych.

## Przykład zasad wiadomości prywatnych i pokojów

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

Zobacz [Grupy](/pl/channels/groups), aby dowiedzieć się więcej o wymuszaniu wzmianki i zachowaniu listy dozwolonych.

Przykład parowania dla wiadomości prywatnych Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła wiadomości przed zatwierdzeniem, OpenClaw ponownie użyje tego samego oczekującego kodu parowania i może po krótkim czasie odnowienia ponownie wysłać przypomnienie zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać wspólny przepływ parowania wiadomości prywatnych i układ przechowywania.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
przełączniki routowania wiadomości prywatnych/kanałów nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalne; wartość zapasowa pochodzi z `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec najpierw używają `execApprovals.approvers` i mogą wracać do `channels.matrix.dm.allowFrom`. Zatwierdzenia wtyczek autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia wracają do innych skonfigurowanych tras zatwierdzeń lub do zapasowej polityki zatwierdzeń.

Natywne routowanie Matrix obsługuje teraz oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb fanoutu wiadomości prywatnych/kanałów dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zbioru zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia wtyczek używają listy dozwolonych wiadomości prywatnych Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości dotyczą zarówno zatwierdzeń exec, jak i zatwierdzeń wtyczek.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do wiadomości prywatnych zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju lub wiadomości prywatnej Matrix
- `target: "both"` wysyła do wiadomości prywatnych zatwierdzających oraz do źródłowego pokoju lub wiadomości prywatnej Matrix

Prompty zatwierdzeń Matrix inicjalizują skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` = zezwól jednorazowo
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą reagować na tę wiadomość albo użyć zapasowych poleceń ukośnikowych: `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać. Dla zatwierdzeń exec dostarczanie kanałowe zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Prompty zatwierdzeń Matrix ponownie używają wspólnego rdzeniowego planera zatwierdzeń. Natywna powierzchnia specyficzna dla Matrix obsługuje routowanie pokój/wiadomość prywatna, reakcje i zachowanie wysyłania/aktualizacji/usuwania wiadomości zarówno dla zatwierdzeń exec, jak i zatwierdzeń wtyczek.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Przykład wielu kont

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
Możesz ograniczyć odziedziczone wpisy pokojów do jednego konta Matrix za pomocą `groups.<room>.account` (lub starszego `rooms.<room>.account`).
Wpisy bez `account` pozostają współdzielone przez wszystkie konta Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone wartości domyślne uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje najwyższego poziomu konto `default` tylko wtedy, gdy to konto domyślne ma świeże uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta mogą nadal pozostawać wykrywalne na podstawie `homeserver` plus `userId`, gdy zbuforowane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z jednego konta do wielu zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do tego promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrap Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix do niejawnego routowania, sondowania i operacji CLI.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekazuj `--account <id>` dla poleceń CLI zależnych od niejawnego wyboru konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla pojedynczego polecenia.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix dla ochrony SSRF, chyba że
jawnie włączysz wyjątek per konto.

Jeśli twój homeserver działa na localhost, adresie LAN/Tailscale albo wewnętrznej nazwie hosta, włącz
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

Przykład konfiguracji w CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ten wyjątek pozwala tylko na zaufane cele prywatne/wewnętrzne. Publiczne homeservery bez TLS, takie jak
`http://matrix.example.org:8008`, nadal są blokowane. Gdy to możliwe, preferuj `https://`.

## Ruch Matrix przez proxy

Jeśli twoje wdrożenie Matrix wymaga jawnego wychodzącego proxy HTTP(S), ustaw `channels.matrix.proxy`:

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
OpenClaw używa tego samego ustawienia proxy zarówno dla ruchu runtime Matrix, jak i sond stanu konta.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwania użytkowników odpytyją katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwania pokojów bezpośrednio akceptują jawne identyfikatory pokojów i aliasy, a następnie wracają do przeszukiwania nazw pokojów dołączonych dla tego konta.
- Wyszukiwanie nazw dołączonych pokojów jest realizowane najlepiej jak się da. Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora ani aliasu, jest ignorowana przez runtime przy rozwiązywaniu listy dozwolonych.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz tę opcję, gdy homeserver rozwiązuje się do `localhost`, adresu LAN/Tailscale albo wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu dla uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` i `channels.matrix.accounts.<id>.accessToken` obsługiwane są zarówno wartości jawne, jak i SecretRef, w dostawcach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).
- `password`: hasło do logowania hasłem. Obsługiwane są zarówno wartości jawne, jak i SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: wyświetlana nazwa urządzenia przy logowaniu hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `set-profile`.
- `initialSyncLimit`: limit zdarzeń synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: wymusza zachowanie tylko według listy dozwolonych dla wiadomości prywatnych i pokojów.
- `allowBots`: pozwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` albo `disabled`.
- `contextVisibility`: tryb widoczności uzupełniającego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach.
- Wpisy `groupAllowFrom` powinny być pełnymi identyfikatorami użytkowników Matrix. Nierozwiązane nazwy są ignorowane w runtime.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do dołączenia jako kontekst historii grupy. Wartość zapasowa pochodzi z `messages.groupChat.historyLimit`; jeśli obie wartości nie są ustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` albo `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `partial`, `quiet`, `true` lub `false`. `partial` i `true` włączają aktualizacje wersji roboczej „najpierw podgląd” przy użyciu zwykłych wiadomości tekstowych Matrix. `quiet` używa niepowiadamiających powiadomień podglądu dla samodzielnie hostowanych konfiguracji z regułami push.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywny jest streaming wersji roboczej podglądu.
- `threadReplies`: `off`, `inbound` albo `always`.
- `threadBindings`: nadpisania per kanał dla routowania i cyklu życia sesji powiązanych z wątkami.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: czas karencji przed ponowieniem automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej.
- `chunkMode`: `length` lub `newline`.
- `responsePrefix`: opcjonalny prefiks wiadomości dla odpowiedzi wychodzących.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzającej dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzającej (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla obsługi multimediów Matrix. Dotyczy wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy ogólnie zaproszeń Matrix, w tym zaproszeń w stylu wiadomości prywatnej, a nie tylko zaproszeń do pokojów/grup. OpenClaw podejmuje tę decyzję w momencie zaproszenia, zanim może wiarygodnie sklasyfikować dołączony pokój jako wiadomość prywatną lub grupę.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokojów podczas obsługi zaproszenia; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki wiadomości prywatnych (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do wiadomości prywatnych po tym, jak OpenClaw dołączył do pokoju i sklasyfikował go jako wiadomość prywatną. Nie zmienia tego, czy do zaproszenia nastąpi automatyczne dołączenie.
- Wpisy `dm.allowFrom` powinny być pełnymi identyfikatorami użytkowników Matrix, chyba że zostały już rozwiązane przez wyszukiwanie katalogu na żywo.
- `dm.sessionScope`: `per-user` (domyślnie) albo `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój wiadomości prywatnych Matrix zachowywał osobny kontekst, nawet jeśli partner jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla wiadomości prywatnych (`off`, `inbound`, `always`). Nadpisuje najwyższego poziomu ustawienie `threadReplies` zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w wiadomościach prywatnych.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec przez Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa zasad per pokój. Preferuj identyfikatory pokojów lub aliasy; nierozwiązane nazwy pokojów są ignorowane w runtime. Tożsamość sesji/grupy po rozwiązaniu używa stabilnego identyfikatora pokoju, podczas gdy etykiety czytelne dla ludzi nadal pochodzą z nazw pokojów.
- `groups.<room>.account`: ogranicza jeden odziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach z wieloma kontami.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców dla pokoju.
- `groups.<room>.tools`: nadpisania dozwolenia/odmowy narzędzi dla pokoju.
- `groups.<room>.autoReply`: nadpisanie wymuszania wzmianki na poziomie pokoju. `true` wyłącza wymaganie wzmianki dla tego pokoju; `false` wymusza je ponownie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment promptu systemowego na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: kontrola narzędzi per działanie (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymuszanie wzmianki
- [Routowanie kanałów](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
