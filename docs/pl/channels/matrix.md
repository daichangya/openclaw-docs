---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady ustawień
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix to dołączony Plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje wiadomości prywatne, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony Plugin

Matrix jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji bez Matrix, zainstaluj
go ręcznie:

Instalacja z npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Zobacz [Pluginy](/pl/tools/plugin), aby poznać zachowanie Pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że Plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix` za pomocą jednego z wariantów:
   - `homeserver` + `accessToken`, albo
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie gateway.
5. Rozpocznij wiadomość prywatną z botem albo zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy pozwala na to `channels.matrix.autoJoin`.

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

Najważniejsze zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją, a dla tego konta nie zapisano jeszcze uwierzytelniania w konfiguracji, kreator oferuje skrót do użycia zmiennych środowiskowych, aby zachować uwierzytelnianie w env vars.
- Nazwy kont są normalizowane do identyfikatora konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy allowlisty wiadomości prywatnych akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie dokładnie jedno dopasowanie.
- Wpisy allowlisty pokoi akceptują bezpośrednio identyfikatory pokoi i aliasy. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania allowlisty.
- W trybie allowlisty automatycznego dołączania do zaproszeń używaj wyłącznie stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ma domyślnie wartość `off`.

Jeśli pozostawisz ją nieustawioną, bot nie dołączy do zaproszonych pokoi ani nowych zaproszeń typu DM, więc nie pojawi się w nowych grupach ani zaproszonych DM, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia są akceptowane, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
</Warning>

Przykład allowlisty:

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

Konfiguracja oparta na haśle (token jest кешowany po zalogowaniu):

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

Matrix przechowuje zapisane w pamięci podręcznej poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Gdy zapisane poświadczenia istnieją w tej lokalizacji, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby setupu, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki w zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Dla kont innych niż domyślne używaj zmiennych środowiskowych z zakresem konta:

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

Matrix zamienia znaki interpunkcyjne w identyfikatorach kont, aby uniknąć kolizji zmiennych środowiskowych z zakresem.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót do użycia zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

`MATRIX_HOMESERVER` nie może być ustawiony z poziomu workspace `.env`; zobacz [Pliki `.env` workspace](/pl/gateway/security).

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

`autoJoin` dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń typu DM. OpenClaw nie może wiarygodnie
sklasyfikować zaproszonego pokoju jako DM lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` ma zastosowanie dopiero po dołączeniu bota i sklasyfikowaniu pokoju jako DM.

## Podglądy strumieniowania

Strumieniowanie odpowiedzi Matrix jest opcjonalne.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysyłał pojedynczą odpowiedź podglądu na żywo,
edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie finalizował go po
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

- `streaming: "off"` to wartość domyślna. OpenClaw czeka na końcową odpowiedź i wysyła ją jednokrotnie.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku asystenta przy użyciu zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix polegające na powiadamianiu najpierw o podglądzie, więc standardowe klienty mogą wysłać powiadomienie na podstawie pierwszego tekstu strumieniowanego podglądu zamiast gotowego bloku.
- `streaming: "quiet"` tworzy jeden edytowalny cichy podgląd typu notice dla bieżącego bloku asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz także reguły push odbiorców dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Gdy strumieniowanie podglądu jest włączone, Matrix zachowuje szkic na żywo dla bieżącego bloku i pozostawia ukończone bloki jako osobne wiadomości.
- Gdy strumieniowanie podglądu jest włączone, a `blockStreaming` jest wyłączone, Matrix edytuje szkic na żywo w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje strumieniowanie podglądu i wraca do zwykłego końcowego dostarczenia.
- Odpowiedzi z multimediami nadal wysyłają załączniki normalnie. Jeśli nieaktualny podgląd nie może już zostać bezpiecznie użyty ponownie, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi z multimediami.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw strumieniowanie wyłączone, jeśli chcesz najbardziej zachowawczego zachowania względem limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów szkicu.
Użyj `streaming: "partial"` lub `streaming: "quiet"` dla edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz również, aby ukończone bloki asystenta pozostawały widoczne jako osobne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania z podglądem najpierw albo pozostaw `streaming` wyłączone dla dostarczenia tylko wersji końcowej. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą wiadomość Matrix generującą powiadomienie.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą wiadomość Matrix generującą powiadomienie.

### Samohostowane reguły push dla cichych sfinalizowanych podglądów

Ciche strumieniowanie (`streaming: "quiet"`) powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła push per użytkownik musi dopasować znacznik sfinalizowanego podglądu. Zobacz [Reguły push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules), aby uzyskać pełną konfigurację (token odbiorcy, sprawdzenie pushera, instalację reguły, uwagi dla poszczególnych homeserverów).

## Pokoje bot-do-bota

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

- `allowBots: true` akceptuje wiadomości od innych skonfigurowanych kont botów Matrix w dozwolonych pokojach i DM.
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy w pokojach jawnie wspominają tego bota. DM są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi własnych.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „wysłane przez bota” jako „wysłane przez inne skonfigurowane konto Matrix na tym gateway OpenClaw”.

Używaj ścisłych allowlist pokoi i wymagań dotyczących wzmianek podczas włączania ruchu bot-do-bota we współdzielonych pokojach.

## Szyfrowanie i weryfikacja

W szyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Nieszyfrowane pokoje nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — Plugin automatycznie wykrywa stan E2EE.

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

Polecenia weryfikacji (wszystkie przyjmują `--verbose` dla diagnostyki i `--json` dla danych wyjściowych do odczytu maszynowego):

```bash
openclaw matrix verify status
```

Pełny status (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Uwzględnij zapisany klucz odzyskiwania w danych wyjściowych do odczytu maszynowego:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Zainicjuj cross-signing i stan weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Szczegółowa diagnostyka bootstrap:

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

To polecenie raportuje trzy oddzielne stany:

- `Recovery key accepted`: Matrix zaakceptował klucz odzyskiwania dla bezpiecznego przechowywania sekretów lub zaufania urządzenia.
- `Backup usable`: kopia zapasowa kluczy pokoju może zostać załadowana przy użyciu zaufanego materiału odzyskiwania.
- `Device verified by owner`: bieżące urządzenie OpenClaw ma pełne zaufanie do tożsamości Matrix cross-signing.

`Signed by owner` w szczegółowych danych wyjściowych lub wyjściu JSON ma wyłącznie charakter diagnostyczny. OpenClaw nie
traktuje tego jako wystarczającego, chyba że `Cross-signing verified` ma również wartość `yes`.

Polecenie nadal kończy się kodem niezerowym, gdy pełne zaufanie do tożsamości Matrix jest niekompletne,
nawet jeśli klucz odzyskiwania może odblokować materiał kopii zapasowej. W takim przypadku dokończ
samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji SAS lub wartości dziesiętne
i wpisz `yes` tylko wtedy, gdy się zgadzają. Polecenie czeka, aż Matrix zgłosi
`Cross-signing verified: yes`, zanim zakończy się powodzeniem.

Używaj `verify bootstrap --force-reset-cross-signing` tylko wtedy, gdy celowo
chcesz zastąpić bieżącą tożsamość cross-signing.

Szczegółowe informacje o weryfikacji urządzenia:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Sprawdź stan kopii zapasowej kluczy pokoju:

```bash
openclaw matrix verify backup status
```

Szczegółowa diagnostyka stanu kopii zapasowej:

```bash
openclaw matrix verify backup status --verbose
```

Przywróć klucze pokoju z kopii zapasowej na serwerze:

```bash
openclaw matrix verify backup restore
```

Interaktywny przepływ samoweryfikacji:

```bash
openclaw matrix verify self
```

Do żądań niższego poziomu lub przychodzących żądań weryfikacji użyj:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Użyj `openclaw matrix verify cancel <id>`, aby anulować żądanie.

Szczegółowa diagnostyka przywracania:

```bash
openclaw matrix verify backup restore --verbose
```

Usuń bieżącą kopię zapasową na serwerze i utwórz nową bazę kopii zapasowej. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie załadowany, ten reset może również odtworzyć bezpieczne przechowywanie sekretów, aby
przyszłe zimne starty mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym ciche wewnętrzne logowanie SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
Użyj `--json`, aby uzyskać pełne dane wyjściowe do odczytu maszynowego podczas skryptowania.

W konfiguracjach wielokontowych polecenia CLI Matrix używają niejawnego domyślnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń jawnie dotyczyły nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Co oznacza verified">
    OpenClaw traktuje urządzenie jako zweryfikowane tylko wtedy, gdy podpisze je Twoja własna tożsamość cross-signing. `verify status --verbose` pokazuje trzy sygnały zaufania:

    - `Locally trusted`: zaufane tylko przez tego klienta
    - `Cross-signing verified`: SDK zgłasza weryfikację przez cross-signing
    - `Signed by owner`: podpisane przez Twój własny klucz self-signing

    `Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing.
    Lokalne zaufanie lub sam podpis właściciela nie wystarczają, aby OpenClaw traktował
    urządzenie jako w pełni zweryfikowane.

  </Accordion>

  <Accordion title="Co robi bootstrap">
    `verify bootstrap` to polecenie naprawy i konfiguracji dla szyfrowanych kont. Kolejno:

    - inicjalizuje bezpieczne przechowywanie sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
    - inicjalizuje cross-signing i przesyła brakujące publiczne klucze cross-signing
    - oznacza bieżące urządzenie i podpisuje je przez cross-signing
    - tworzy po stronie serwera kopię zapasową kluczy pokoju, jeśli jeszcze nie istnieje

    Jeśli homeserver wymaga UIA do przesłania kluczy cross-signing, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`). Używaj `--force-reset-cross-signing` tylko przy celowym odrzuceniu bieżącej tożsamości.

  </Accordion>

  <Accordion title="Nowa baza kopii zapasowej">
    Jeśli chcesz zachować działanie przyszłych szyfrowanych wiadomości i akceptujesz utratę nieodzyskiwalnej starej historii:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Dodaj `--account <id>`, aby wskazać nazwane konto. To może również odtworzyć bezpieczne przechowywanie sekretów, jeśli bieżącego sekretu kopii zapasowej nie da się bezpiecznie załadować.

  </Accordion>

  <Accordion title="Zachowanie przy uruchamianiu">
    Przy `encryption: true` wartość domyślna `startupVerification` to `"if-unverified"`. Przy uruchamianiu niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując czas odnowienia. Dostosuj to przez `startupVerificationCooldownHours` albo wyłącz przez `startupVerification: "off"`.

    Przy uruchamianiu wykonywany jest też zachowawczy przebieg bootstrap kryptografii, który ponownie wykorzystuje bieżące bezpieczne przechowywanie sekretów i tożsamość cross-signing. Jeśli stan bootstrap jest uszkodzony, OpenClaw próbuje ostrożnej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA hasłem, uruchamianie zapisuje ostrzeżenie w logach i pozostaje niefatalne. Urządzenia już podpisane przez właściciela są zachowywane.

    Pełny przepływ aktualizacji znajdziesz w [Migracja Matrix](/pl/install/migrating-matrix).

  </Accordion>

  <Accordion title="Powiadomienia o weryfikacji">
    Matrix publikuje powiadomienia o cyklu życia weryfikacji do ścisłego pokoju DM weryfikacji jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Weryfikuj przez emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/wartości dziesiętne), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. Przy samoweryfikacji OpenClaw automatycznie rozpoczyna przepływ SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna — nadal jednak musisz porównać i potwierdzić „They match” w swoim kliencie Matrix.

    Systemowe powiadomienia o weryfikacji nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetlanie i czyszczenie:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE używa oficjalnej ścieżki Rust crypto z `matrix-js-sdk` z `fake-indexeddb` jako shimem IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (ograniczające uprawnienia pliku).

    Zaszyfrowany stan środowiska uruchomieniowego znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje sync store, crypto store, klucz odzyskiwania, snapshot IDB, powiązania wątków oraz stan weryfikacji przy uruchamianiu. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby wcześniejszy stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj własny profil Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, jeśli chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio adresy URL avatara `mxc://`. Gdy przekażesz adres avatara `http://` lub `https://`, OpenClaw najpierw przesyła go do Matrix, a następnie zapisuje rozwiązany adres `mxc://` z powrotem w `channels.matrix.avatarUrl` (lub w wybranym nadpisaniu konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłek narzędzia wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routing DM Matrix w zakresie nadawcy, dzięki czemu wiele pokoi DM może współdzielić jedną sesję, gdy rozwiązują się do tego samego peera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając normalnego uwierzytelniania DM i sprawdzania allowlisty.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybraną sesję docelową.
- `threadReplies: "off"` utrzymuje odpowiedzi na najwyższym poziomie i utrzymuje przychodzące wiadomości w wątkach w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca już była w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi pokojowe w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę konwersację przez odpowiadającą sesję o zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków w pokojach, pozostawiając DM płaskie.
- Przychodzące wiadomości w wątkach zawierają wiadomość główną wątku jako dodatkowy kontekst agenta.
- Wysyłki narzędzia wiadomości automatycznie dziedziczą bieżący wątek Matrix, gdy celem jest ten sam pokój lub ten sam cel użytkownika DM, chyba że podano jawne `threadId`.
- Ponowne użycie celu użytkownika DM dla tej samej sesji uruchamia się tylko wtedy, gdy bieżące metadane sesji potwierdzają tego samego peera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routingu w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje w tym pokoju jednorazowe `m.notice` z mechanizmem ucieczki `/focus`, gdy włączone są powiązania wątków i wskazówka `dm.sessionScope`.
- Powiązania wątków w czasie działania są obsługiwane dla Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkiem `/acp spawn` działają w pokojach i DM Matrix.
- `/focus` na najwyższym poziomie pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z sesją docelową, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix wiąże zamiast tego bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można zamienić w trwałe workspace ACP bez zmiany powierzchni czatu.

Szybki przepływ dla operatora:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz nadal używać.
- W DM lub pokoju Matrix na najwyższym poziomie bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- Wewnątrz istniejącego wątku Matrix `--bind here` wiąże ten bieżący wątek na miejscu.
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

Flagi tworzenia powiązanego z wątkiem Matrix są opcjonalne:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić, by `/focus` na najwyższym poziomie tworzyło i wiązało nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić, by `/acp spawn --thread auto|here` wiązało sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach i przychodzące reakcje potwierdzenia.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota na tym zdarzeniu.
- `remove: true` usuwa tylko wskazaną reakcję emoji z konta bota.

Zakres reakcji potwierdzenia jest rozwiązywany w standardowej kolejności OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- zapasowe emoji tożsamości agenta

Zakres reakcji potwierdzenia jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy dotyczą wiadomości Matrix utworzonych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nie są syntetyzowane do zdarzeń systemowych, ponieważ Matrix udostępnia je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta. Wartość zapasowa to `messages.groupChat.historyLimit`; jeśli obie są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają normalnej historii sesji.
- Historia pokoju Matrix działa tylko dla oczekujących wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie wykonuje migawkę tego okna, gdy pojawi się wzmianka lub inny wyzwalacz.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby dla tego samego zdarzenia Matrix używają ponownie oryginalnej migawki historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrana treść odpowiedzi, korzenie wątków i oczekująca historia.

- `contextVisibility: "all"` to wartość domyślna. Dodatkowy kontekst jest zachowywany bez zmian.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne sprawdzenia allowlisty pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja wyzwalania nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` i zasad DM.

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

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i allowlisty.

Przykład parowania dla DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła Ci wiadomości przed zatwierdzeniem, OpenClaw używa ponownie tego samego oczekującego kodu parowania i może po krótkim czasie odnowienia ponownie wysłać odpowiedź przypominającą zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przepływ parowania DM i układ przechowywania.

## Naprawa direct room

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla peera za pomocą:

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
- tworzy nowy pokój direct i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Przepływ naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia weryfikacyjne i inne przepływy wiadomości bezpośrednich znów trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
pokrętła routingu DM/kanału nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalnie; wartość zapasowa to `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec najpierw używają `execApprovals.approvers` i mogą wrócić do `channels.matrix.dm.allowFrom`. Zatwierdzenia Pluginów autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia wracają do innych skonfigurowanych tras zatwierdzeń lub do zasad zapasowych zatwierdzania.

Natywny routing Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb rozsyłania DM/kanału dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zestawu zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia Pluginów używają allowlisty DM Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości dotyczą zarówno zatwierdzeń exec, jak i zatwierdzeń Pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do DM zatwierdzających
- `target: "channel"` wysyła prompt z powrotem do źródłowego pokoju Matrix lub DM
- `target: "both"` wysyła do DM zatwierdzających oraz do źródłowego pokoju Matrix lub DM

Prompty zatwierdzeń Matrix inicjują skróty reakcji w podstawowej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odrzuć
- `♾️` = zezwól zawsze, gdy ta decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą reagować na tę wiadomość albo użyć zapasowych poleceń slash: `/approve <id> allow-once`, `/approve <id> allow-always` lub `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zatwierdzać lub odrzucać. W przypadku zatwierdzeń exec dostarczanie kanałowe obejmuje tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Polecenia slash

Polecenia slash Matrix (na przykład `/new`, `/reset`, `/model`) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje także polecenia slash poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` wywołuje ścieżkę polecenia bez potrzeby niestandardowego wyrażenia regularnego wzmianki. Dzięki temu bot pozostaje responsywny na posty pokojowe typu `@mention /command`, które Element i podobne klienty wysyłają, gdy użytkownik uzupełnia nazwę bota klawiszem tab przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać zasady allowlisty lub ownera dla DM albo pokoi, tak samo jak w przypadku zwykłych wiadomości.

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
Możesz ograniczyć odziedziczone wpisy pokoi do jednego konta Matrix przez `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone między wszystkimi kontami Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio na najwyższym poziomie `channels.matrix.*`.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same w sobie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje najwyższego poziomu konto `default` tylko wtedy, gdy to konto domyślne ma aktualne uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta mogą nadal pozostawać wykrywalne na podstawie `homeserver` plus `userId`, gdy zapisane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z jednego konta do wielu kont zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrap Matrix; współdzielone klucze polityk dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, jeśli chcesz, aby OpenClaw preferował jedno nazwane konto Matrix dla niejawnego routingu, sondowania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix i jedno z identyfikatorów kont to `default`, OpenClaw używa tego konta niejawnie nawet wtedy, gdy `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` albo przekaż `--account <id>` dla poleceń CLI zależnych od niejawnego wyboru konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` oraz `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla pojedynczego polecenia.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie wyrazisz zgodę per konto.

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

Przykład konfiguracji w CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ta zgoda pozwala tylko na zaufane prywatne/wewnętrzne cele. Publiczne homeservery działające po jawnym HTTP, takie jak
`http://matrix.example.org:8008`, nadal pozostają zablokowane. Gdy to możliwe, preferuj `https://`.

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

Nazwane konta mogą nadpisać wartość domyślną najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy dla ruchu Matrix w czasie działania i dla sond statusu konta.

## Rozwiązywanie celów

Matrix akceptuje te formy celu wszędzie tam, gdzie OpenClaw prosi o pokój lub cel użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Wyszukiwanie katalogu na żywo używa zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwanie pokoi akceptuje bezpośrednio jawne identyfikatory pokoi i aliasy, a następnie wraca do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi działa według najlepszych starań. Jeśli nazwy pokoju nie da się rozwiązać do identyfikatora lub aliasu, jest ignorowana podczas rozwiązywania allowlisty w czasie działania.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale albo wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisać domyślną wartość najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: token dostępu do uwierzytelniania opartego na tokenie. Wartości jawnego tekstu i wartości SecretRef są obsługiwane dla `channels.matrix.accessToken` oraz `channels.matrix.accounts.<id>.accessToken` w providerach env/file/exec. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).
- `password`: hasło do logowania opartego na haśle. Obsługiwane są wartości jawnego tekstu i wartości SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia dla logowania hasłem.
- `avatarUrl`: zapisany URL własnego awatara do synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy uruchamianiu.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi zasadę pokoju `open` do `allowlist` i wymusza dla wszystkich aktywnych zasad DM poza `disabled` (w tym `pairing` i `open`) wartość `allowlist`. Nie wpływa na zasady `disabled`.
- `allowBots`: pozwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności dodatkowego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlista identyfikatorów użytkowników dla ruchu pokojowego. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i przy zmianie allowlisty podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Wartość zapasowa to `messages.groupChat.historyLimit`; jeśli obie są nieustawione, efektywna wartość domyślna to `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkicu z podglądem najpierw przy użyciu zwykłych wiadomości tekstowych Matrix. `"quiet"` używa powiadomień podglądu bez notyfikacji dla samohostowanych konfiguracji reguł push. `false` jest równoważne `"off"`.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywne jest strumieniowanie podglądu szkicu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routingu sesji powiązanych z wątkami i cyklu życia.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy uruchamianiu (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: czas odnowienia przed ponowną próbą automatycznych żądań weryfikacji przy uruchamianiu.
- `textChunkLimit`: rozmiar fragmentu wiadomości wychodzącej w znakach (ma zastosowanie, gdy `chunkMode` to `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg prefiksu dodawany do wszystkich odpowiedzi wychodzących dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji potwierdzenia dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji potwierdzenia (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru multimediów w MB dla wysyłek wychodzących i przetwarzania multimediów przychodzących.
- `autoJoin`: zasada automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń typu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokoi podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok zasad DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po tym, jak OpenClaw dołączy do pokoju i sklasyfikuje go jako DM. Nie zmienia tego, czy zaproszenie jest automatycznie przyjmowane.
- `dm.allowFrom`: allowlista identyfikatorów użytkowników dla ruchu DM. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy uruchamianiu i przy zmianie allowlisty podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, jeśli chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet jeśli peer jest ten sam.
- `dm.threadReplies`: nadpisanie zasad wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie najwyższego poziomu `threadReplies` zarówno dla umiejscowienia odpowiedzi, jak i izolacji sesji w DM.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec przez Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix uprawnionych do zatwierdzania żądań exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa zasad per pokój. Preferuj identyfikatory pokoi lub aliasy; nierozwiązane nazwy pokoi są ignorowane w czasie działania. Tożsamość sesji/grupy używa stabilnego identyfikatora pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden odziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: allowlista nadawców per pokój.
- `groups.<room>.tools`: nadpisania zezwalania/odmawiania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie na poziomie pokoju dla bramkowania wzmiankami. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: kontrola narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
