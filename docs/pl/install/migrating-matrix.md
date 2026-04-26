---
read_when:
    - Aktualizacja istniejącej instalacji Matrix
    - Migracja zaszyfrowanej historii Matrix i stanu urządzenia
summary: Jak OpenClaw aktualizuje poprzedni Plugin Matrix w miejscu, w tym limity odzyskiwania stanu szyfrowanego i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-04-26T11:34:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Ta strona opisuje aktualizacje z poprzedniego publicznego Pluginu `matrix` do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się w miejscu:

- Plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje pod `channels.matrix`
- zapisane poświadczenia pozostają w `~/.openclaw/credentials/matrix/`
- stan środowiska wykonawczego pozostaje w `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować Pluginu pod nową nazwą.

## Co migracja robi automatycznie

Gdy Gateway się uruchamia oraz gdy uruchamiasz [`openclaw doctor --fix`](/pl/gateway/doctor), OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek wykonalny krok migracji Matrix zmodyfikuje stan na dysku, OpenClaw tworzy lub ponownie wykorzystuje ukierunkowaną migawkę odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas procesu aktualizacji, a następnie domyślnie restartują gateway
- instalacje z menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywny przebieg doctor, a potem polegają na domyślnym restarcie gateway, aby uruchamianie mogło dokończyć migrację Matrix
- jeśli używasz `openclaw update --no-restart`, migracja Matrix zależna od uruchomienia jest odroczona do momentu późniejszego uruchomienia `openclaw doctor --fix` i restartu gateway

Automatyczna migracja obejmuje:

- tworzenie lub ponowne wykorzystanie migawki przed migracją w `~/Backups/openclaw-migrations/`
- ponowne wykorzystanie zapisanych poświadczeń Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji ograniczonej do konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji ograniczonej do konta, gdy konto docelowe można bezpiecznie rozwiązać
- wyodrębnienie wcześniej zapisanego klucza deszyfrowania kopii zapasowej kluczy pokoi Matrix ze starego magazynu rust crypto, jeśli taki klucz istnieje lokalnie
- ponowne wykorzystanie najbardziej kompletnego istniejącego katalogu magazynu z hashem tokenu dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu później się zmieni
- skanowanie sąsiednich katalogów magazynu z hashem tokenu w poszukiwaniu oczekujących metadanych przywracania stanu szyfrowanego, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywracanie kluczy pokoi z kopii zapasowej do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły migawki:

- OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json` po pomyślnym utworzeniu migawki, dzięki czemu późniejsze przebiegi uruchomienia i naprawy mogą ponownie wykorzystać to samo archiwum.
- Te automatyczne migawki migracji Matrix tworzą kopię zapasową tylko konfiguracji i stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji z ostrzeżeniami, na przykład dlatego, że nadal brakuje `userId` albo `accessToken`, OpenClaw jeszcze nie tworzy migawki, ponieważ żadna modyfikacja Matrix nie jest jeszcze wykonalna.
- Jeśli krok tworzenia migawki się nie powiedzie, OpenClaw pomija migrację Matrix dla tego uruchomienia zamiast modyfikować stan bez punktu odzyskiwania.

O aktualizacjach wielu kont:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu pojedynczego magazynu, więc OpenClaw może zmigrować go tylko do jednego rozwiązanego konta Matrix
- starsze magazyny Matrix już ograniczone do konta są wykrywane i przygotowywane per skonfigurowane konto Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokoi Matrix. Zachowywał lokalny stan kryptograficzny i wymagał weryfikacji urządzenia, ale nie gwarantował, że klucze pokoi były zapisane w kopii zapasowej na homeserverze.

Oznacza to, że niektóre zaszyfrowane instalacje można zmigrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- lokalnych kluczy pokoi, które nigdy nie zostały zapisane w kopii zapasowej
- stanu szyfrowanego, gdy docelowego konta Matrix nie można jeszcze rozwiązać, ponieważ `homeserver`, `userId` albo `accessToken` są nadal niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- instalacji z niestandardową ścieżką Pluginu przypiętych do ścieżki repozytorium zamiast do standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał zapisane klucze w kopii zapasowej, ale nie przechowywał lokalnie klucza deszyfrowania

Obecny zakres ostrzeżeń:

- instalacje Matrix z niestandardową ścieżką Pluginu są zgłaszane zarówno przy uruchamianiu gateway, jak i przez `openclaw doctor`

Jeśli stara instalacja miała lokalną zaszyfrowaną historię, która nigdy nie została zapisana w kopii zapasowej, część starszych zaszyfrowanych wiadomości może pozostać nieczytelna po aktualizacji.

## Zalecany przepływ aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchamianie mogło od razu dokończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma wykonalne zadania migracyjne, doctor najpierw utworzy lub ponownie wykorzysta migawkę przed migracją i wypisze ścieżkę archiwum.

3. Uruchom albo zrestartuj gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Umieść klucz odzyskiwania dla naprawianego konta Matrix w zmiennej środowiskowej specyficznej dla konta. Dla pojedynczego konta domyślnego wystarczy `MATRIX_RECOVERY_KEY`. Dla wielu kont użyj jednej zmiennej na konto, na przykład `MATRIX_RECOVERY_KEY_ASSISTANT`, i dodaj `--account assistant` do polecenia.

6. Jeśli OpenClaw informuje, że potrzebny jest klucz odzyskiwania, uruchom polecenie dla pasującego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom polecenie dla pasującego konta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Jeśli klucz odzyskiwania zostanie zaakceptowany i kopia zapasowa jest użyteczna, ale `Cross-signing verified`
   nadal ma wartość `no`, dokończ samoweryfikację z innego klienta Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji albo wartości dziesiętne
   i wpisz `yes` tylko wtedy, gdy się zgadzają. Polecenie kończy się powodzeniem dopiero
   wtedy, gdy `Cross-signing verified` przyjmie wartość `yes`.

8. Jeśli celowo porzucasz nieodzyskiwalną starą historię i chcesz świeżej bazy kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowana

Migracja szyfrowana to proces dwuetapowy:

1. Uruchomienie albo `openclaw doctor --fix` tworzy lub ponownie wykorzystuje migawkę przed migracją, jeśli szyfrowana migracja jest wykonalna.
2. Uruchomienie albo `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację Pluginu Matrix.
3. Jeśli znajdzie klucz deszyfrowania kopii zapasowej, OpenClaw zapisuje go do nowego przepływu klucza odzyskiwania i oznacza przywracanie kluczy pokoi jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zapisane w kopii zapasowej klucze pokoi do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokoi, które nigdy nie zostały zapisane w kopii zapasowej, OpenClaw ostrzega zamiast udawać, że odzyskiwanie zakończyło się powodzeniem.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: stary stan Matrix na dysku został wykryty i zmigrowany do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera również ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed modyfikacją stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik migawki migracji Matrix i ponownie użył tego archiwum zamiast tworzyć zduplikowaną kopię zapasową.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może przypisać go do bieżącego konta Matrix, ponieważ Matrix nie jest skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może ustalić dokładnego bieżącego katalogu konta/urządzenia.
- Co zrobić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia już istnieją.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja ograniczona do konta ma już magazyn synchronizacji albo kryptograficzny, więc OpenClaw nie nadpisał go automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz albo przeniesiesz konfliktujący cel.

`Failed migrating Matrix legacy sync store (...)` albo `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików się nie powiodła.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której można go podłączyć.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: zaszyfrowany magazyn istnieje, ale OpenClaw nie może bezpiecznie zdecydować, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom gateway raz z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia są dostępne.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja jest nadal zablokowana z powodu brakujących danych tożsamości albo poświadczeń.
- Co zrobić: dokończ logowanie Matrix albo konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł załadować punktu wejścia helpera z Pluginu Matrix, który zwykle sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie albo napraw Plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla repozytorium), a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku helpera, która wychodzi poza katalog główny Pluginu albo nie przechodzi kontroli granic Pluginu, więc odmówił jej zaimportowania.
- Co zrobić: zainstaluj ponownie Plugin Matrix z zaufanej ścieżki, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił modyfikacji stanu Matrix, ponieważ nie mógł najpierw utworzyć migawki odzyskiwania.
- Co zrobić: usuń błąd kopii zapasowej, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: mechanizm awaryjny po stronie klienta Matrix znalazł stary płaski magazyn, ale przeniesienie się nie powiodło. OpenClaw teraz przerywa ten fallback zamiast po cichu startować ze świeżym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików albo konflikty, zachowaj stary stan bez zmian i spróbuj ponownie po naprawie błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc aktualizacje z głównej gałęzi nie zastępują go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie przez `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego Pluginu Matrix.

### Komunikaty odzyskiwania stanu szyfrowanego

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zapisane w kopii zapasowej klucze pokoi zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: niektóre stare klucze pokoi istniały tylko w starym lokalnym magazynie i nigdy nie zostały przesłane do kopii zapasowej Matrix.
- Co zrobić: spodziewaj się, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że uda się ręcznie odzyskać te klucze z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł sprawdzić go na tyle bezpiecznie, by przygotować odzyskiwanie.
- Co zrobić: ponownie uruchom `openclaw doctor --fix`. Jeśli komunikat się powtarza, zachowaj katalog starego stanu bez zmian i odzyskaj dane przy użyciu innego zweryfikowanego klienta Matrix oraz `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt kluczy kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku recovery-key.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponowisz jakiekolwiek polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu magazynu.
- Co zrobić: klucze zapisane w kopii zapasowej nadal można przywrócić, ale lokalna zaszyfrowana historia może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy Plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby ponów przez `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Komunikaty ręcznego odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że powinieneś mieć klucz kopii zapasowej, ale nie jest on aktywny na tym urządzeniu.
- Co zrobić: uruchom `openclaw matrix verify backup restore` albo ustaw `MATRIX_RECOVERY_KEY` i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`, jeśli to potrzebne.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY`, uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, a następnie przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` na poprawny klucz i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę kopii zapasowej przez `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, taki reset może również odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł zostać poprawnie załadowany po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco silnie łańcuchowi cross-signing.
- Co zrobić: ustaw `MATRIX_RECOVERY_KEY` i uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Znaczenie: próbowałeś wykonać krok odzyskiwania bez podania klucza odzyskiwania, gdy był wymagany.
- Co zrobić: uruchom polecenie ponownie z `--recovery-key-stdin`, na przykład `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie udało się sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: spróbuj ponownie, używając dokładnego klucza odzyskiwania z klienta Matrix albo pliku recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: OpenClaw mógł zastosować klucz odzyskiwania, ale Matrix nadal nie
  ustanowił pełnego zaufania tożsamości cross-signing dla tego urządzenia. Sprawdź
  wynik polecenia pod kątem `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` oraz `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym
  kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy się zgadza. Polecenie
  czeka na pełne zaufanie tożsamości Matrix, zanim zgłosi powodzenie. Używaj
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a następnie ponownie sprawdź przez `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Znaczenie: to urządzenie nie może przywracać z magazynu sekretów, dopóki nie zostanie ukończona weryfikacja urządzenia.
- Co zrobić: najpierw uruchom `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Komunikaty niestandardowej instalacji Pluginu

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji Pluginu wskazuje lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie przez `openclaw plugins install @openclaw/matrix`, albo jeśli działasz z repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te sprawdzenia w tej kolejności:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Jeśli kopia zapasowa przywraca się pomyślnie, ale w niektórych starych pokojach nadal brakuje historii, prawdopodobnie brakujące klucze nigdy nie zostały zapisane w kopii zapasowej przez poprzedni Plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii i chcesz tylko czystej bazy kopii zapasowej na przyszłość, uruchom te polecenia w tej kolejności:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal nie jest zweryfikowane, dokończ weryfikację z klienta Matrix, porównując emoji SAS albo kody dziesiętne i potwierdzając, że się zgadzają.

## Powiązane strony

- [Matrix](/pl/channels/matrix)
- [Doctor](/pl/gateway/doctor)
- [Migracja](/pl/install/migrating)
- [Plugins](/pl/tools/plugin)
