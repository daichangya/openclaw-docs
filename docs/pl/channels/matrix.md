---
read_when:
    - Konfigurowanie Matrix w OpenClaw
    - Konfigurowanie E2EE i weryfikacji Matrix
summary: Stan obsługi Matrix, konfiguracja i przykłady konfiguracji
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix to dołączony plugin kanału dla OpenClaw.
Używa oficjalnego `matrix-js-sdk` i obsługuje DM, pokoje, wątki, multimedia, reakcje, ankiety, lokalizację oraz E2EE.

## Dołączony plugin

Matrix jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc standardowe
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

Zobacz [Pluginy](/pl/tools/plugin), aby poznać zachowanie pluginów i zasady instalacji.

## Konfiguracja

1. Upewnij się, że plugin Matrix jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto Matrix na swoim homeserverze.
3. Skonfiguruj `channels.matrix`, używając jednego z wariantów:
   - `homeserver` + `accessToken`, albo
   - `homeserver` + `userId` + `password`.
4. Uruchom ponownie gateway.
5. Rozpocznij DM z botem lub zaproś go do pokoju.
   - Nowe zaproszenia Matrix działają tylko wtedy, gdy zezwala na nie `channels.matrix.autoJoin`.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

Kreator Matrix pyta o:

- URL homeservera
- metodę uwierzytelniania: access token lub hasło
- identyfikator użytkownika (tylko uwierzytelnianie hasłem)
- opcjonalną nazwę urządzenia
- czy włączyć E2EE
- czy skonfigurować dostęp do pokoi i automatyczne dołączanie do zaproszeń

Najważniejsze zachowania kreatora:

- Jeśli zmienne środowiskowe uwierzytelniania Matrix już istnieją, a to konto nie ma jeszcze zapisanego uwierzytelniania w konfiguracji, kreator oferuje skrót env, aby zachować uwierzytelnianie w zmiennych środowiskowych.
- Nazwy kont są normalizowane do identyfikatora konta. Na przykład `Ops Bot` staje się `ops-bot`.
- Wpisy listy dozwolonych DM akceptują bezpośrednio `@user:server`; nazwy wyświetlane działają tylko wtedy, gdy wyszukiwanie w katalogu na żywo znajdzie dokładnie jedno dopasowanie.
- Wpisy listy dozwolonych pokoi akceptują bezpośrednio identyfikatory i aliasy pokoi. Preferuj `!room:server` lub `#alias:server`; nierozwiązane nazwy są ignorowane w czasie działania podczas rozwiązywania listy dozwolonych.
- W trybie listy dozwolonych dla automatycznego dołączania do zaproszeń używaj tylko stabilnych celów zaproszeń: `!roomId:server`, `#alias:server` lub `*`. Zwykłe nazwy pokoi są odrzucane.
- Aby rozwiązać nazwy pokoi przed zapisaniem, użyj `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` domyślnie ma wartość `off`.

Jeśli pozostawisz to ustawienie nieustawione, bot nie będzie dołączać do zaproszonych pokoi ani nowych zaproszeń typu DM, więc nie pojawi się w nowych grupach ani zaproszonych DM, chyba że najpierw dołączysz ręcznie.

Ustaw `autoJoin: "allowlist"` razem z `autoJoinAllowlist`, aby ograniczyć, które zaproszenia akceptuje, albo ustaw `autoJoin: "always"`, jeśli chcesz, aby dołączał do każdego zaproszenia.

W trybie `allowlist` `autoJoinAllowlist` akceptuje tylko `!roomId:server`, `#alias:server` lub `*`.
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

Matrix przechowuje buforowane poświadczenia w `~/.openclaw/credentials/matrix/`.
Konto domyślne używa `credentials.json`; nazwane konta używają `credentials-<account>.json`.
Gdy buforowane poświadczenia istnieją w tym miejscu, OpenClaw traktuje Matrix jako skonfigurowany na potrzeby setupu, doctor i wykrywania statusu kanału, nawet jeśli bieżące uwierzytelnianie nie jest ustawione bezpośrednio w konfiguracji.

Odpowiedniki zmiennych środowiskowych (używane, gdy klucz konfiguracji nie jest ustawiony):

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

Matrix maskuje znaki interpunkcyjne w identyfikatorach kont, aby zmienne środowiskowe z zakresem nie kolidowały ze sobą.
Na przykład `-` staje się `_X2D_`, więc `ops-prod` mapuje się na `MATRIX_OPS_X2D_PROD_*`.

Interaktywny kreator oferuje skrót zmiennych środowiskowych tylko wtedy, gdy te zmienne uwierzytelniania już istnieją, a wybrane konto nie ma jeszcze zapisanego uwierzytelniania Matrix w konfiguracji.

`MATRIX_HOMESERVER` nie może być ustawione z `.env` workspace; zobacz [Pliki `.env` workspace](/pl/gateway/security).

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

`autoJoin` dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń typu DM. OpenClaw nie może niezawodnie
sklasyfikować zaproszonego pokoju jako DM lub grupy w momencie zaproszenia, więc wszystkie zaproszenia najpierw przechodzą przez `autoJoin`.
`dm.policy` ma zastosowanie po dołączeniu bota i sklasyfikowaniu pokoju jako DM.

## Podglądy streamingu

Streaming odpowiedzi Matrix jest typu opt-in.

Ustaw `channels.matrix.streaming` na `"partial"`, jeśli chcesz, aby OpenClaw wysłał pojedynczą odpowiedź
podglądu na żywo, edytował ten podgląd w miejscu podczas generowania tekstu przez model, a następnie sfinalizował go po
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

- `streaming: "off"` to ustawienie domyślne. OpenClaw czeka na końcową odpowiedź i wysyła ją jednokrotnie.
- `streaming: "partial"` tworzy jedną edytowalną wiadomość podglądu dla bieżącego bloku asystenta, używając zwykłych wiadomości tekstowych Matrix. Zachowuje to starsze zachowanie Matrix typu preview-first dla powiadomień, więc standardowi klienci mogą powiadamiać na podstawie pierwszego tekstu podglądu streamingu zamiast ukończonego bloku.
- `streaming: "quiet"` tworzy jedno edytowalne ciche powiadomienie podglądu dla bieżącego bloku asystenta. Używaj tego tylko wtedy, gdy skonfigurujesz także reguły push odbiorcy dla sfinalizowanych edycji podglądu.
- `blockStreaming: true` włącza osobne wiadomości postępu Matrix. Przy włączonym streamingu podglądu Matrix zachowuje szkic na żywo dla bieżącego bloku i pozostawia ukończone bloki jako oddzielne wiadomości.
- Gdy streaming podglądu jest włączony, a `blockStreaming` wyłączone, Matrix edytuje szkic na żywo w miejscu i finalizuje to samo zdarzenie po zakończeniu bloku lub tury.
- Jeśli podgląd przestaje mieścić się w jednym zdarzeniu Matrix, OpenClaw zatrzymuje streaming podglądu i wraca do zwykłego końcowego dostarczenia.
- Odpowiedzi multimedialne nadal wysyłają załączniki w zwykły sposób. Jeśli nie da się już bezpiecznie ponownie użyć nieaktualnego podglądu, OpenClaw redaguje go przed wysłaniem końcowej odpowiedzi multimedialnej.
- Edycje podglądu generują dodatkowe wywołania API Matrix. Pozostaw streaming wyłączony, jeśli chcesz najbardziej zachowawczego zachowania wobec limitów szybkości.

`blockStreaming` samo w sobie nie włącza podglądów szkiców.
Używaj `streaming: "partial"` lub `streaming: "quiet"` do edycji podglądu; następnie dodaj `blockStreaming: true` tylko wtedy, gdy chcesz również, aby ukończone bloki asystenta pozostały widoczne jako oddzielne wiadomości postępu.

Jeśli potrzebujesz standardowych powiadomień Matrix bez niestandardowych reguł push, użyj `streaming: "partial"` dla zachowania preview-first albo pozostaw `streaming` wyłączone dla dostarczania tylko końcowego. Przy `streaming: "off"`:

- `blockStreaming: true` wysyła każdy ukończony blok jako zwykłą wiadomość Matrix generującą powiadomienie.
- `blockStreaming: false` wysyła tylko końcową ukończoną odpowiedź jako zwykłą wiadomość Matrix generującą powiadomienie.

### Samohostowane reguły push dla cichych sfinalizowanych podglądów

Cichy streaming (`streaming: "quiet"`) powiadamia odbiorców dopiero po sfinalizowaniu bloku lub tury — reguła push per użytkownik musi dopasować znacznik sfinalizowanego podglądu. Pełną konfigurację (token odbiorcy, sprawdzenie pushera, instalacja reguły, uwagi dla poszczególnych homeserverów) znajdziesz w [Regułach push Matrix dla cichych podglądów](/pl/channels/matrix-push-rules).

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
- `allowBots: "mentions"` akceptuje te wiadomości tylko wtedy, gdy wyraźnie wspominają tego bota w pokojach. DM są nadal dozwolone.
- `groups.<room>.allowBots` nadpisuje ustawienie na poziomie konta dla jednego pokoju.
- OpenClaw nadal ignoruje wiadomości od tego samego identyfikatora użytkownika Matrix, aby uniknąć pętli odpowiedzi do samego siebie.
- Matrix nie udostępnia tutaj natywnej flagi bota; OpenClaw traktuje „wiadomość autorstwa bota” jako „wysłaną przez inne skonfigurowane konto Matrix na tym gateway OpenClaw”.

Przy włączaniu ruchu bot-do-bota we współdzielonych pokojach używaj ścisłych list dozwolonych pokoi i wymagań dotyczących wzmianek.

## Szyfrowanie i weryfikacja

W zaszyfrowanych pokojach (E2EE) wychodzące zdarzenia obrazów używają `thumbnail_file`, dzięki czemu podglądy obrazów są szyfrowane razem z pełnym załącznikiem. Pokoje nieszyfrowane nadal używają zwykłego `thumbnail_url`. Nie jest wymagana żadna konfiguracja — plugin automatycznie wykrywa stan E2EE.

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

Polecenia weryfikacji (wszystkie przyjmują `--verbose` dla diagnostyki i `--json` dla wyjścia czytelnego maszynowo):

```bash
openclaw matrix verify status
```

Szczegółowy status (pełna diagnostyka):

```bash
openclaw matrix verify status --verbose
```

Uwzględnienie zapisanego klucza odzyskiwania w wyjściu czytelnym maszynowo:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap stanu cross-signing i weryfikacji:

```bash
openclaw matrix verify bootstrap
```

Szczegółowa diagnostyka bootstrapu:

```bash
openclaw matrix verify bootstrap --verbose
```

Wymuszenie świeżego resetu tożsamości cross-signing przed bootstrapem:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Weryfikacja tego urządzenia za pomocą klucza odzyskiwania:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

To polecenie raportuje trzy oddzielne stany:

- `Recovery key accepted`: Matrix zaakceptował klucz odzyskiwania dla przechowywania sekretów lub zaufania urządzeniu.
- `Backup usable`: kopię zapasową kluczy pokoju można załadować przy użyciu zaufanego materiału odzyskiwania.
- `Device verified by owner`: bieżące urządzenie OpenClaw ma pełne zaufanie do tożsamości Matrix cross-signing.

`Signed by owner` w szczegółowym wyjściu lub wyjściu JSON ma wyłącznie charakter diagnostyczny. OpenClaw nie
traktuje tego jako wystarczającego, chyba że `Cross-signing verified` ma również wartość `yes`.

Polecenie nadal kończy się kodem niezerowym, gdy pełne zaufanie do tożsamości Matrix jest niekompletne,
nawet jeśli klucz odzyskiwania może odblokować materiał kopii zapasowej. W takim przypadku dokończ
samoweryfikację z innego klienta Matrix:

```bash
openclaw matrix verify self
```

Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji SAS lub liczby dziesiętne
i wpisz `yes` tylko wtedy, gdy są zgodne. Polecenie czeka, aż Matrix zgłosi
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

Jeśli klucz kopii zapasowej nie jest już załadowany na dysku, podaj klucz odzyskiwania Matrix:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Interaktywny przebieg samoweryfikacji:

```bash
openclaw matrix verify self
```

W przypadku żądań niższego poziomu lub przychodzących żądań weryfikacji użyj:

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

Usuń bieżącą kopię zapasową z serwera i utwórz nową bazową kopię zapasową. Jeśli zapisany
klucz kopii zapasowej nie może zostać poprawnie załadowany, ten reset może także odtworzyć magazyn sekretów, aby
przyszłe zimne starty mogły załadować nowy klucz kopii zapasowej:

```bash
openclaw matrix verify backup reset --yes
```

Wszystkie polecenia `verify` są domyślnie zwięzłe (w tym ciche wewnętrzne logowanie SDK) i pokazują szczegółową diagnostykę tylko z `--verbose`.
W przypadku skryptów użyj `--json`, aby uzyskać pełne wyjście czytelne maszynowo.

W konfiguracjach z wieloma kontami polecenia CLI Matrix używają niejawnego domyślnego konta Matrix, chyba że przekażesz `--account <id>`.
Jeśli skonfigurujesz wiele nazwanych kont, najpierw ustaw `channels.matrix.defaultAccount`, w przeciwnym razie te niejawne operacje CLI zatrzymają się i poproszą o jawny wybór konta.
Używaj `--account`, gdy chcesz, aby operacje weryfikacji lub urządzeń były jawnie kierowane do nazwanego konta:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Gdy szyfrowanie jest wyłączone lub niedostępne dla nazwanego konta, ostrzeżenia Matrix i błędy weryfikacji wskazują klucz konfiguracji tego konta, na przykład `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Co oznacza verified">
    OpenClaw traktuje urządzenie jako zweryfikowane tylko wtedy, gdy podpisuje je Twoja własna tożsamość cross-signing. `verify status --verbose` pokazuje trzy sygnały zaufania:

    - `Locally trusted`: zaufane tylko przez tego klienta
    - `Cross-signing verified`: SDK zgłasza weryfikację przez cross-signing
    - `Signed by owner`: podpisane przez Twój własny klucz self-signing

    `Verified by owner` przyjmuje wartość `yes` tylko wtedy, gdy obecna jest weryfikacja cross-signing.
    Samo lokalne zaufanie lub sam podpis właściciela nie wystarczają, aby OpenClaw uznał
    urządzenie za w pełni zweryfikowane.

  </Accordion>

  <Accordion title="Co robi bootstrap">
    `verify bootstrap` to polecenie naprawcze i konfiguracyjne dla szyfrowanych kont. W kolejności wykonuje ono:

    - inicjalizuje magazyn sekretów, ponownie używając istniejącego klucza odzyskiwania, gdy to możliwe
    - inicjalizuje cross-signing i przesyła brakujące publiczne klucze cross-signing
    - oznacza i podpisuje bieżące urządzenie przez cross-signing
    - tworzy kopię zapasową kluczy pokoju po stronie serwera, jeśli jeszcze nie istnieje

    Jeśli homeserver wymaga UIA do przesłania kluczy cross-signing, OpenClaw najpierw próbuje bez uwierzytelniania, potem `m.login.dummy`, a następnie `m.login.password` (wymaga `channels.matrix.password`). Używaj `--force-reset-cross-signing` tylko wtedy, gdy celowo odrzucasz bieżącą tożsamość.

  </Accordion>

  <Accordion title="Świeża bazowa kopia zapasowa">
    Jeśli chcesz zachować działanie przyszłych zaszyfrowanych wiadomości i akceptujesz utratę nieodtwarzalnej starej historii:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Dodaj `--account <id>`, aby wskazać nazwane konto. To może także odtworzyć magazyn sekretów, jeśli bieżący sekret kopii zapasowej nie może zostać bezpiecznie załadowany.
    Dodaj `--rotate-recovery-key` tylko wtedy, gdy celowo chcesz, aby stary klucz odzyskiwania
    przestał odblokowywać świeżą bazową kopię zapasową.

  </Accordion>

  <Accordion title="Zachowanie przy starcie">
    Przy `encryption: true` `startupVerification` domyślnie ma wartość `"if-unverified"`. Przy starcie niezweryfikowane urządzenie żąda samoweryfikacji w innym kliencie Matrix, pomijając duplikaty i stosując cooldown. Dostosuj to przez `startupVerificationCooldownHours` lub wyłącz przez `startupVerification: "off"`.

    Start uruchamia też zachowawczy przebieg bootstrap kryptografii, który ponownie używa bieżącego magazynu sekretów i tożsamości cross-signing. Jeśli stan bootstrapu jest uszkodzony, OpenClaw próbuje ostrożnej naprawy nawet bez `channels.matrix.password`; jeśli homeserver wymaga UIA z hasłem, startup zapisuje ostrzeżenie w logu i pozostaje niefatalny. Urządzenia już podpisane przez właściciela są zachowywane.

    Zobacz [Migracja Matrix](/pl/install/migrating-matrix), aby poznać pełny przebieg aktualizacji.

  </Accordion>

  <Accordion title="Powiadomienia weryfikacyjne">
    Matrix publikuje powiadomienia o cyklu życia weryfikacji w ścisłym pokoju DM weryfikacji jako wiadomości `m.notice`: żądanie, gotowość (ze wskazówką „Weryfikuj przez emoji”), rozpoczęcie/zakończenie oraz szczegóły SAS (emoji/liczby dziesiętne), gdy są dostępne.

    Przychodzące żądania z innego klienta Matrix są śledzone i automatycznie akceptowane. W przypadku samoweryfikacji OpenClaw automatycznie rozpoczyna przebieg SAS i potwierdza swoją stronę, gdy weryfikacja emoji jest dostępna — nadal jednak musisz porównać i potwierdzić „They match” w swoim kliencie Matrix.

    Systemowe powiadomienia weryfikacyjne nie są przekazywane do potoku czatu agenta.

  </Accordion>

  <Accordion title="Usunięte lub nieprawidłowe urządzenie Matrix">
    Jeśli `verify status` mówi, że bieżące urządzenie nie jest już widoczne na
    homeserverze, utwórz nowe urządzenie Matrix OpenClaw. Dla logowania hasłem:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Dla uwierzytelniania tokenem utwórz świeży access token w swoim kliencie Matrix lub interfejsie administratora,
    a następnie zaktualizuj OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Zastąp `assistant` identyfikatorem konta z nieudanego polecenia albo pomiń
    `--account` dla konta domyślnego.

  </Accordion>

  <Accordion title="Higiena urządzeń">
    Stare urządzenia zarządzane przez OpenClaw mogą się gromadzić. Wyświetl je i usuń nieaktualne:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Magazyn kryptograficzny">
    Matrix E2EE używa oficjalnej ścieżki kryptograficznej Rust z `matrix-js-sdk` z `fake-indexeddb` jako shimu IndexedDB. Stan kryptograficzny jest utrwalany w `crypto-idb-snapshot.json` (restrykcyjne uprawnienia pliku).

    Zaszyfrowany stan czasu działania znajduje się w `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` i obejmuje magazyn synchronizacji, magazyn kryptograficzny, klucz odzyskiwania, snapshot IDB, powiązania wątków oraz stan weryfikacji przy starcie. Gdy token się zmienia, ale tożsamość konta pozostaje taka sama, OpenClaw ponownie używa najlepszego istniejącego katalogu głównego, aby wcześniejszy stan pozostał widoczny.

  </Accordion>
</AccordionGroup>

## Zarządzanie profilem

Zaktualizuj profil własny Matrix dla wybranego konta za pomocą:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Dodaj `--account <id>`, gdy chcesz jawnie wskazać nazwane konto Matrix.

Matrix akceptuje bezpośrednio URL-e awatarów `mxc://`. Gdy przekażesz URL awatara `http://` lub `https://`, OpenClaw najpierw prześle go do Matrix, a następnie zapisze rozwiązany URL `mxc://` z powrotem do `channels.matrix.avatarUrl` (lub nadpisania wybranego konta).

## Wątki

Matrix obsługuje natywne wątki Matrix zarówno dla automatycznych odpowiedzi, jak i wysyłania przez narzędzie wiadomości.

- `dm.sessionScope: "per-user"` (domyślnie) utrzymuje routowanie DM Matrix w zakresie nadawcy, więc wiele pokoi DM może współdzielić jedną sesję, jeśli rozwiążą się do tego samego peera.
- `dm.sessionScope: "per-room"` izoluje każdy pokój DM Matrix do własnego klucza sesji, nadal używając zwykłego uwierzytelniania DM i sprawdzania listy dozwolonych.
- Jawne powiązania konwersacji Matrix nadal mają pierwszeństwo przed `dm.sessionScope`, więc powiązane pokoje i wątki zachowują wybrany docelowy typ sesji.
- `threadReplies: "off"` utrzymuje odpowiedzi na najwyższym poziomie i zatrzymuje przychodzące wiadomości we wątku w sesji nadrzędnej.
- `threadReplies: "inbound"` odpowiada wewnątrz wątku tylko wtedy, gdy wiadomość przychodząca już znajdowała się w tym wątku.
- `threadReplies: "always"` utrzymuje odpowiedzi w pokoju w wątku zakorzenionym w wiadomości wyzwalającej i kieruje tę konwersację przez odpowiadającą sesję w zakresie wątku od pierwszej wiadomości wyzwalającej.
- `dm.threadReplies` nadpisuje ustawienie najwyższego poziomu tylko dla DM. Na przykład możesz utrzymać izolację wątków pokojów, pozostawiając DM płaskie.
- Przychodzące wiadomości we wątku zawierają główną wiadomość wątku jako dodatkowy kontekst dla agenta.
- Wysyłanie przez narzędzie wiadomości automatycznie dziedziczy bieżący wątek Matrix, gdy celem jest ten sam pokój albo ten sam docelowy użytkownik DM, chyba że podano jawny `threadId`.
- Ponowne użycie celu użytkownika DM w tej samej sesji uruchamia się tylko wtedy, gdy metadane bieżącej sesji potwierdzają tego samego peera DM na tym samym koncie Matrix; w przeciwnym razie OpenClaw wraca do normalnego routowania w zakresie użytkownika.
- Gdy OpenClaw wykryje, że pokój DM Matrix koliduje z innym pokojem DM w tej samej współdzielonej sesji DM Matrix, publikuje jednorazowe `m.notice` w tym pokoju z mechanizmem awaryjnym `/focus`, gdy włączone są powiązania wątków i podpowiedź `dm.sessionScope`.
- Powiązania wątków w czasie działania są obsługiwane w Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` oraz związane z wątkiem `/acp spawn` działają w pokojach i DM Matrix.
- `/focus` na najwyższym poziomie pokoju/DM Matrix tworzy nowy wątek Matrix i wiąże go z docelową sesją, gdy `threadBindings.spawnSubagentSessions=true`.
- Uruchomienie `/focus` lub `/acp spawn --thread here` wewnątrz istniejącego wątku Matrix zamiast tego wiąże bieżący wątek.

## Powiązania konwersacji ACP

Pokoje Matrix, DM i istniejące wątki Matrix można przekształcić w trwałe workspace ACP bez zmiany powierzchni czatu.

Szybki przebieg operatorski:

- Uruchom `/acp spawn codex --bind here` wewnątrz DM Matrix, pokoju lub istniejącego wątku, którego chcesz dalej używać.
- W DM Matrix lub pokoju Matrix na najwyższym poziomie bieżący DM/pokój pozostaje powierzchnią czatu, a przyszłe wiadomości są kierowane do utworzonej sesji ACP.
- W istniejącym wątku Matrix `--bind here` wiąże ten bieżący wątek w miejscu.
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

Flagi uruchamiania związane z wątkami Matrix są typu opt-in:

- Ustaw `threadBindings.spawnSubagentSessions: true`, aby pozwolić `/focus` na najwyższym poziomie tworzyć i wiązać nowe wątki Matrix.
- Ustaw `threadBindings.spawnAcpSessions: true`, aby pozwolić `/acp spawn --thread auto|here` wiązać sesje ACP z wątkami Matrix.

## Reakcje

Matrix obsługuje wychodzące akcje reakcji, przychodzące powiadomienia o reakcjach oraz przychodzące reakcje ack.

- Narzędzia wychodzących reakcji są kontrolowane przez `channels["matrix"].actions.reactions`.
- `react` dodaje reakcję do konkretnego zdarzenia Matrix.
- `reactions` wyświetla bieżące podsumowanie reakcji dla konkretnego zdarzenia Matrix.
- `emoji=""` usuwa własne reakcje konta bota dla tego zdarzenia.
- `remove: true` usuwa tylko określoną reakcję emoji z konta bota.

Reakcje ack używają standardowej kolejności rozwiązywania OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- emoji tożsamości agenta jako fallback

Zakres reakcji ack jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Tryb powiadomień o reakcjach jest rozwiązywany w tej kolejności:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- domyślnie: `own`

Zachowanie:

- `reactionNotifications: "own"` przekazuje dodane zdarzenia `m.reaction`, gdy są skierowane do wiadomości Matrix utworzonych przez bota.
- `reactionNotifications: "off"` wyłącza systemowe zdarzenia reakcji.
- Usunięcia reakcji nie są syntetyzowane do systemowych zdarzeń, ponieważ Matrix pokazuje je jako redakcje, a nie jako samodzielne usunięcia `m.reaction`.

## Kontekst historii

- `channels.matrix.historyLimit` kontroluje, ile ostatnich wiadomości z pokoju jest dołączanych jako `InboundHistory`, gdy wiadomość z pokoju Matrix wyzwala agenta. Używa fallback do `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywną wartością domyślną jest `0`. Ustaw `0`, aby wyłączyć.
- Historia pokoju Matrix dotyczy tylko pokoju. DM nadal używają zwykłej historii sesji.
- Historia pokoju Matrix jest tylko dla oczekujących wiadomości: OpenClaw buforuje wiadomości z pokoju, które jeszcze nie wywołały odpowiedzi, a następnie zapisuje snapshot tego okna, gdy pojawi się wzmianka lub inny trigger.
- Bieżąca wiadomość wyzwalająca nie jest uwzględniana w `InboundHistory`; pozostaje w głównej treści przychodzącej dla tej tury.
- Ponowne próby dla tego samego zdarzenia Matrix używają ponownie oryginalnego snapshotu historii zamiast przesuwać się do nowszych wiadomości z pokoju.

## Widoczność kontekstu

Matrix obsługuje współdzieloną kontrolę `contextVisibility` dla dodatkowego kontekstu pokoju, takiego jak pobrany tekst odpowiedzi, główne wiadomości wątków i oczekująca historia.

- `contextVisibility: "all"` jest ustawieniem domyślnym. Dodatkowy kontekst jest zachowywany w otrzymanej postaci.
- `contextVisibility: "allowlist"` filtruje dodatkowy kontekst do nadawców dozwolonych przez aktywne sprawdzenia list dozwolonych pokoju/użytkownika.
- `contextVisibility: "allowlist_quote"` działa jak `allowlist`, ale nadal zachowuje jedną jawną cytowaną odpowiedź.

To ustawienie wpływa na widoczność dodatkowego kontekstu, a nie na to, czy sama wiadomość przychodząca może wywołać odpowiedź.
Autoryzacja triggera nadal pochodzi z ustawień `groupPolicy`, `groups`, `groupAllowFrom` oraz zasad DM.

## Polityka DM i pokoi

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

Zobacz [Grupy](/pl/channels/groups), aby poznać zachowanie bramkowania wzmiankami i list dozwolonych.

Przykład parowania dla DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jeśli niezatwierdzony użytkownik Matrix nadal wysyła Ci wiadomości przed zatwierdzeniem, OpenClaw ponownie używa tego samego oczekującego kodu parowania i może ponownie wysłać odpowiedź-przypomnienie po krótkim cooldownie zamiast generować nowy kod.

Zobacz [Parowanie](/pl/channels/pairing), aby poznać współdzielony przebieg parowania DM i układ przechowywania.

## Naprawa pokoju bezpośredniego

Jeśli stan wiadomości bezpośrednich się rozjedzie, OpenClaw może skończyć ze starymi mapowaniami `m.direct`, które wskazują stare pokoje solo zamiast aktywnego DM. Sprawdź bieżące mapowanie dla peera za pomocą:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Napraw je za pomocą:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Przebieg naprawy:

- preferuje ścisły DM 1:1, który jest już zmapowany w `m.direct`
- używa fallback do dowolnego aktualnie dołączonego ścisłego DM 1:1 z tym użytkownikiem
- tworzy nowy pokój direct i przepisuje `m.direct`, jeśli nie istnieje zdrowy DM

Przebieg naprawy nie usuwa automatycznie starych pokoi. Wybiera tylko zdrowy DM i aktualizuje mapowanie, aby nowe wysyłki Matrix, powiadomienia weryfikacyjne i inne przebiegi wiadomości bezpośrednich znów trafiały do właściwego pokoju.

## Zatwierdzenia exec

Matrix może działać jako natywny klient zatwierdzeń dla konta Matrix. Natywne
pokrętła routingu DM/kanału nadal znajdują się w konfiguracji zatwierdzeń exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcjonalnie; fallback do `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Zatwierdzający muszą być identyfikatorami użytkowników Matrix, takimi jak `@owner:example.org`. Matrix automatycznie włącza natywne zatwierdzenia, gdy `enabled` jest nieustawione lub ma wartość `"auto"` i można rozwiązać co najmniej jednego zatwierdzającego. Zatwierdzenia exec używają najpierw `execApprovals.approvers` i mogą użyć fallback do `channels.matrix.dm.allowFrom`. Zatwierdzenia pluginów autoryzują przez `channels.matrix.dm.allowFrom`. Ustaw `enabled: false`, aby jawnie wyłączyć Matrix jako natywnego klienta zatwierdzeń. W przeciwnym razie żądania zatwierdzenia używają fallback do innych skonfigurowanych ścieżek zatwierdzania lub zasad fallback dla zatwierdzeń.

Natywny routing Matrix obsługuje oba rodzaje zatwierdzeń:

- `channels.matrix.execApprovals.*` kontroluje natywny tryb fanoutu DM/kanału dla promptów zatwierdzeń Matrix.
- Zatwierdzenia exec używają zbioru zatwierdzających exec z `execApprovals.approvers` lub `channels.matrix.dm.allowFrom`.
- Zatwierdzenia pluginów używają listy dozwolonych DM Matrix z `channels.matrix.dm.allowFrom`.
- Skróty reakcji Matrix i aktualizacje wiadomości mają zastosowanie zarówno do zatwierdzeń exec, jak i pluginów.

Zasady dostarczania:

- `target: "dm"` wysyła prompty zatwierdzeń do DM zatwierdzających
- `target: "channel"` odsyła prompt do źródłowego pokoju lub DM Matrix
- `target: "both"` wysyła do DM zatwierdzających oraz do źródłowego pokoju lub DM Matrix

Prompty zatwierdzeń Matrix inicjalizują skróty reakcji na głównej wiadomości zatwierdzenia:

- `✅` = zezwól raz
- `❌` = odmów
- `♾️` = zezwól zawsze, gdy taka decyzja jest dozwolona przez efektywną politykę exec

Zatwierdzający mogą zareagować na tę wiadomość lub użyć poleceń slash jako fallback: `/approve <id> allow-once`, `/approve <id> allow-always` albo `/approve <id> deny`.

Tylko rozwiązani zatwierdzający mogą zezwalać lub odmawiać. W przypadku zatwierdzeń exec dostarczanie do kanału zawiera tekst polecenia, więc włączaj `channel` lub `both` tylko w zaufanych pokojach.

Nadpisanie per konto:

- `channels.matrix.accounts.<account>.execApprovals`

Powiązana dokumentacja: [Zatwierdzenia exec](/pl/tools/exec-approvals)

## Polecenia slash

Polecenia slash Matrix (na przykład `/new`, `/reset`, `/model`) działają bezpośrednio w DM. W pokojach OpenClaw rozpoznaje również polecenia slash poprzedzone własną wzmianką Matrix bota, więc `@bot:server /new` uruchamia ścieżkę polecenia bez potrzeby niestandardowego regexu wzmianki. Dzięki temu bot pozostaje responsywny na posty pokojowe w stylu `@mention /command`, które Element i podobni klienci emitują, gdy użytkownik uzupełni nazwę bota tabulatorem przed wpisaniem polecenia.

Zasady autoryzacji nadal obowiązują: nadawcy poleceń muszą spełniać zasady DM lub pokoju dotyczące list dozwolonych/właściciela, tak samo jak w przypadku zwykłych wiadomości.

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

Wartości najwyższego poziomu `channels.matrix` działają jako ustawienia domyślne dla nazwanych kont, chyba że konto je nadpisze.
Możesz ograniczyć dziedziczone wpisy pokoi do jednego konta Matrix za pomocą `groups.<room>.account`.
Wpisy bez `account` pozostają współdzielone między wszystkimi kontami Matrix, a wpisy z `account: "default"` nadal działają, gdy konto domyślne jest skonfigurowane bezpośrednio w `channels.matrix.*` najwyższego poziomu.
Częściowe współdzielone domyślne ustawienia uwierzytelniania same z siebie nie tworzą osobnego niejawnego konta domyślnego. OpenClaw syntetyzuje konto `default` najwyższego poziomu tylko wtedy, gdy to konto domyślne ma świeże uwierzytelnianie (`homeserver` plus `accessToken` albo `homeserver` plus `userId` i `password`); nazwane konta nadal mogą pozostać wykrywalne z `homeserver` plus `userId`, gdy buforowane poświadczenia później spełnią wymagania uwierzytelniania.
Jeśli Matrix ma już dokładnie jedno nazwane konto albo `defaultAccount` wskazuje istniejący klucz nazwanego konta, promocja naprawy/konfiguracji z jednego konta do wielu zachowuje to konto zamiast tworzyć nowy wpis `accounts.default`. Do promowanego konta przenoszone są tylko klucze uwierzytelniania/bootstrap Matrix; współdzielone klucze polityki dostarczania pozostają na najwyższym poziomie.
Ustaw `defaultAccount`, gdy chcesz, aby OpenClaw preferował jedno nazwane konto Matrix dla niejawnego routingu, sprawdzania i operacji CLI.
Jeśli skonfigurowano wiele kont Matrix i jeden identyfikator konta ma wartość `default`, OpenClaw używa tego konta niejawnie, nawet gdy `defaultAccount` nie jest ustawione.
Jeśli skonfigurujesz wiele nazwanych kont, ustaw `defaultAccount` lub przekaż `--account <id>` dla poleceń CLI, które polegają na niejawnym wyborze konta.
Przekaż `--account <id>` do `openclaw matrix verify ...` i `openclaw matrix devices ...`, gdy chcesz nadpisać ten niejawny wybór dla pojedynczego polecenia.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/config-channels#multi-account-all-channels), aby poznać współdzielony wzorzec wielu kont.

## Prywatne/LAN homeservery

Domyślnie OpenClaw blokuje prywatne/wewnętrzne homeservery Matrix w celu ochrony przed SSRF, chyba że
jawnie włączysz tę możliwość per konto.

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

To ustawienie opt-in pozwala tylko na zaufane prywatne/wewnętrzne cele. Publiczne homeservery działające po czystym HTTP, takie jak
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

Nazwane konta mogą nadpisywać domyślne ustawienie najwyższego poziomu przez `channels.matrix.accounts.<id>.proxy`.
OpenClaw używa tego samego ustawienia proxy zarówno dla ruchu Matrix w czasie działania, jak i dla probe’ów statusu konta.

## Rozwiązywanie celów

Matrix akceptuje następujące formy celu wszędzie tam, gdzie OpenClaw prosi o cel pokoju lub użytkownika:

- Użytkownicy: `@user:server`, `user:@user:server` lub `matrix:user:@user:server`
- Pokoje: `!room:server`, `room:!room:server` lub `matrix:room:!room:server`
- Aliasy: `#alias:server`, `channel:#alias:server` lub `matrix:channel:#alias:server`

Identyfikatory pokoi Matrix rozróżniają wielkość liter. Używaj dokładnej wielkości liter identyfikatora pokoju z Matrix
podczas konfigurowania jawnych celów dostarczania, zadań Cron, powiązań lub list dozwolonych.
OpenClaw zachowuje wewnętrzne klucze sesji w postaci kanonicznej na potrzeby przechowywania, więc te małoliterowe
klucze nie są wiarygodnym źródłem identyfikatorów dostarczania Matrix.

Wyszukiwanie na żywo w katalogu używa zalogowanego konta Matrix:

- Wyszukiwanie użytkowników odpytuje katalog użytkowników Matrix na tym homeserverze.
- Wyszukiwanie pokoi akceptuje bezpośrednio jawne identyfikatory i aliasy pokoi, a następnie używa fallback do przeszukiwania nazw dołączonych pokoi dla tego konta.
- Wyszukiwanie nazw dołączonych pokoi działa w trybie best-effort. Jeśli nazwa pokoju nie może zostać rozwiązana do identyfikatora lub aliasu, jest ignorowana podczas rozwiązywania listy dozwolonych w czasie działania.

## Dokumentacja konfiguracji

- `enabled`: włącza lub wyłącza kanał.
- `name`: opcjonalna etykieta konta.
- `defaultAccount`: preferowany identyfikator konta, gdy skonfigurowano wiele kont Matrix.
- `homeserver`: URL homeservera, na przykład `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: pozwala temu kontu Matrix łączyć się z prywatnymi/wewnętrznymi homeserverami. Włącz to, gdy homeserver rozwiązuje się do `localhost`, adresu IP LAN/Tailscale lub wewnętrznego hosta, takiego jak `matrix-synapse`.
- `proxy`: opcjonalny URL proxy HTTP(S) dla ruchu Matrix. Nazwane konta mogą nadpisywać domyślne ustawienie najwyższego poziomu własnym `proxy`.
- `userId`: pełny identyfikator użytkownika Matrix, na przykład `@bot:example.org`.
- `accessToken`: access token do uwierzytelniania opartego na tokenie. Dla `channels.matrix.accessToken` i `channels.matrix.accounts.<id>.accessToken` we wszystkich providerach env/file/exec obsługiwane są wartości plaintext oraz wartości SecretRef. Zobacz [Zarządzanie sekretami](/pl/gateway/secrets).
- `password`: hasło do logowania hasłem. Obsługiwane są wartości plaintext oraz wartości SecretRef.
- `deviceId`: jawny identyfikator urządzenia Matrix.
- `deviceName`: nazwa wyświetlana urządzenia przy logowaniu hasłem.
- `avatarUrl`: zapisany URL własnego awatara na potrzeby synchronizacji profilu i aktualizacji `profile set`.
- `initialSyncLimit`: maksymalna liczba zdarzeń pobieranych podczas synchronizacji przy starcie.
- `encryption`: włącza E2EE.
- `allowlistOnly`: gdy ma wartość `true`, podnosi politykę pokoju `open` do `allowlist` i wymusza dla wszystkich aktywnych polityk DM poza `disabled` (w tym `pairing` i `open`) wartość `allowlist`. Nie wpływa na polityki `disabled`.
- `allowBots`: zezwala na wiadomości od innych skonfigurowanych kont Matrix OpenClaw (`true` lub `"mentions"`).
- `groupPolicy`: `open`, `allowlist` lub `disabled`.
- `contextVisibility`: tryb widoczności dodatkowego kontekstu pokoju (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu w pokojach. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy starcie i gdy lista dozwolonych zmienia się podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `historyLimit`: maksymalna liczba wiadomości z pokoju do uwzględnienia jako kontekst historii grupy. Używa fallback do `messages.groupChat.historyLimit`; jeśli oba ustawienia są nieustawione, efektywną wartością domyślną jest `0`. Ustaw `0`, aby wyłączyć.
- `replyToMode`: `off`, `first`, `all` lub `batched`.
- `markdown`: opcjonalna konfiguracja renderowania Markdown dla wychodzącego tekstu Matrix.
- `streaming`: `off` (domyślnie), `"partial"`, `"quiet"`, `true` lub `false`. `"partial"` i `true` włączają aktualizacje szkicu w trybie preview-first z użyciem zwykłych wiadomości tekstowych Matrix. `"quiet"` używa niepowiadamiających powiadomień podglądu dla samohostowanych konfiguracji z regułami push. `false` jest równoważne `"off"`.
- `blockStreaming`: `true` włącza osobne wiadomości postępu dla ukończonych bloków asystenta, gdy aktywny jest streaming szkicu podglądu.
- `threadReplies`: `off`, `inbound` lub `always`.
- `threadBindings`: nadpisania per kanał dla routingu i cyklu życia sesji powiązanych z wątkiem.
- `startupVerification`: tryb automatycznego żądania samoweryfikacji przy starcie (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown przed ponowną próbą automatycznych żądań weryfikacji przy starcie.
- `textChunkLimit`: rozmiar chunku wiadomości wychodzącej w znakach (ma zastosowanie, gdy `chunkMode` ma wartość `length`).
- `chunkMode`: `length` dzieli wiadomości według liczby znaków; `newline` dzieli na granicach linii.
- `responsePrefix`: opcjonalny ciąg znaków dodawany na początku wszystkich odpowiedzi wychodzących dla tego kanału.
- `ackReaction`: opcjonalne nadpisanie reakcji ack dla tego kanału/konta.
- `ackReactionScope`: opcjonalne nadpisanie zakresu reakcji ack (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: tryb przychodzących powiadomień o reakcjach (`own`, `off`).
- `mediaMaxMb`: limit rozmiaru mediów w MB dla wysyłek wychodzących i przetwarzania mediów przychodzących.
- `autoJoin`: polityka automatycznego dołączania do zaproszeń (`always`, `allowlist`, `off`). Domyślnie: `off`. Dotyczy wszystkich zaproszeń Matrix, w tym zaproszeń typu DM.
- `autoJoinAllowlist`: pokoje/aliasy dozwolone, gdy `autoJoin` ma wartość `allowlist`. Wpisy aliasów są rozwiązywane do identyfikatorów pokoi podczas obsługi zaproszeń; OpenClaw nie ufa stanowi aliasu deklarowanemu przez zaproszony pokój.
- `dm`: blok polityki DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: kontroluje dostęp do DM po dołączeniu OpenClaw do pokoju i sklasyfikowaniu go jako DM. Nie zmienia tego, czy do zaproszenia następuje automatyczne dołączenie.
- `dm.allowFrom`: lista dozwolonych identyfikatorów użytkowników dla ruchu DM. Najbezpieczniejsze są pełne identyfikatory użytkowników Matrix; dokładne dopasowania katalogowe są rozwiązywane przy starcie i gdy lista dozwolonych zmienia się podczas działania monitora. Nierozwiązane nazwy są ignorowane.
- `dm.sessionScope`: `per-user` (domyślnie) lub `per-room`. Użyj `per-room`, gdy chcesz, aby każdy pokój DM Matrix zachowywał osobny kontekst, nawet jeśli peer jest ten sam.
- `dm.threadReplies`: nadpisanie polityki wątków tylko dla DM (`off`, `inbound`, `always`). Nadpisuje ustawienie `threadReplies` najwyższego poziomu zarówno dla umieszczania odpowiedzi, jak i izolacji sesji w DM.
- `execApprovals`: natywne dostarczanie zatwierdzeń exec przez Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: identyfikatory użytkowników Matrix, którym wolno zatwierdzać żądania exec. Opcjonalne, gdy `dm.allowFrom` już identyfikuje zatwierdzających.
- `execApprovals.target`: `dm | channel | both` (domyślnie: `dm`).
- `accounts`: nazwane nadpisania per konto. Wartości najwyższego poziomu `channels.matrix` działają jako wartości domyślne dla tych wpisów.
- `groups`: mapa polityk per pokój. Preferuj identyfikatory lub aliasy pokoi; nierozwiązane nazwy pokoi są ignorowane w czasie działania. Tożsamość sesji/grupy używa stabilnego identyfikatora pokoju po rozwiązaniu.
- `groups.<room>.account`: ogranicza jeden dziedziczony wpis pokoju do konkretnego konta Matrix w konfiguracjach wielokontowych.
- `groups.<room>.allowBots`: nadpisanie na poziomie pokoju dla nadawców będących skonfigurowanymi botami (`true` lub `"mentions"`).
- `groups.<room>.users`: lista dozwolonych nadawców per pokój.
- `groups.<room>.tools`: nadpisania dozwalania/odmawiania narzędzi per pokój.
- `groups.<room>.autoReply`: nadpisanie bramkowania wzmiankami na poziomie pokoju. `true` wyłącza wymagania dotyczące wzmianek dla tego pokoju; `false` wymusza ich ponowne włączenie.
- `groups.<room>.skills`: opcjonalny filtr Skills na poziomie pokoju.
- `groups.<room>.systemPrompt`: opcjonalny fragment system promptu na poziomie pokoju.
- `rooms`: starszy alias dla `groups`.
- `actions`: bramkowanie narzędzi per akcja (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przebieg parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmiankami
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
