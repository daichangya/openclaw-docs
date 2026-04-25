---
read_when:
    - Aktualizacja istniejącej instalacji Matrix.
    - Migracja zaszyfrowanej historii Matrix i stanu urządzenia.
summary: Jak OpenClaw aktualizuje wcześniejszy Plugin Matrix na miejscu, w tym ograniczenia odzyskiwania stanu szyfrowanego i ręczne kroki odzyskiwania.
title: Migracja Matrix
x-i18n:
    generated_at: "2026-04-25T13:50:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Ta strona opisuje aktualizacje z poprzedniego publicznego Plugin Matrix do bieżącej implementacji.

Dla większości użytkowników aktualizacja odbywa się na miejscu:

- Plugin pozostaje `@openclaw/matrix`
- kanał pozostaje `matrix`
- konfiguracja pozostaje w `channels.matrix`
- pamięć podręczna poświadczeń pozostaje w `~/.openclaw/credentials/matrix/`
- stan środowiska wykonawczego pozostaje w `~/.openclaw/matrix/`

Nie musisz zmieniać nazw kluczy konfiguracji ani ponownie instalować Plugin pod nową nazwą.

## Co migracja robi automatycznie

Przy uruchomieniu gateway oraz po uruchomieniu [`openclaw doctor --fix`](/pl/gateway/doctor) OpenClaw próbuje automatycznie naprawić stary stan Matrix.
Zanim jakikolwiek praktyczny krok migracji Matrix zmodyfikuje stan na dysku, OpenClaw tworzy lub ponownie wykorzystuje ukierunkowany snapshot odzyskiwania.

Gdy używasz `openclaw update`, dokładny wyzwalacz zależy od sposobu instalacji OpenClaw:

- instalacje ze źródeł uruchamiają `openclaw doctor --fix` podczas przepływu aktualizacji, a następnie domyślnie restartują gateway
- instalacje z menedżera pakietów aktualizują pakiet, uruchamiają nieinteraktywne przejście doctor, a następnie polegają na domyślnym restarcie gateway, aby uruchomienie mogło dokończyć migrację Matrix
- jeśli użyjesz `openclaw update --no-restart`, migracja Matrix oparta na starcie zostanie odłożona, dopóki później nie uruchomisz `openclaw doctor --fix` i nie zrestartujesz gateway

Migracja automatyczna obejmuje:

- tworzenie lub ponowne wykorzystanie snapshotu sprzed migracji w `~/Backups/openclaw-migrations/`
- ponowne wykorzystanie zapisanych w pamięci podręcznej poświadczeń Matrix
- zachowanie tego samego wyboru konta i konfiguracji `channels.matrix`
- przeniesienie najstarszego płaskiego magazynu synchronizacji Matrix do bieżącej lokalizacji o zakresie konta
- przeniesienie najstarszego płaskiego magazynu kryptograficznego Matrix do bieżącej lokalizacji o zakresie konta, gdy docelowe konto można bezpiecznie ustalić
- wyodrębnienie wcześniej zapisanego klucza odszyfrowywania kopii zapasowej kluczy pokojów Matrix ze starego magazynu rust crypto, jeśli ten klucz istnieje lokalnie
- ponowne wykorzystanie najbardziej kompletnego istniejącego katalogu głównego magazynu hashy tokenów dla tego samego konta Matrix, homeservera i użytkownika, gdy token dostępu zmieni się później
- skanowanie sąsiednich katalogów głównych magazynu hashy tokenów w poszukiwaniu oczekujących metadanych przywracania stanu szyfrowanego, gdy token dostępu Matrix się zmienił, ale tożsamość konta/urządzenia pozostała taka sama
- przywracanie zapisanych w kopii zapasowej kluczy pokojów do nowego magazynu kryptograficznego przy następnym uruchomieniu Matrix

Szczegóły snapshotu:

- Po pomyślnym utworzeniu snapshotu OpenClaw zapisuje plik znacznika w `~/.openclaw/matrix/migration-snapshot.json`, aby późniejsze uruchomienia i przejścia naprawcze mogły ponownie użyć tego samego archiwum.
- Te automatyczne snapshoty migracji Matrix tworzą kopię zapasową tylko konfiguracji i stanu (`includeWorkspace: false`).
- Jeśli Matrix ma tylko stan migracji z ostrzeżeniami, na przykład dlatego, że `userId` lub `accessToken` nadal nie są ustawione, OpenClaw nie tworzy jeszcze snapshotu, ponieważ żadna modyfikacja Matrix nie jest jeszcze możliwa do wykonania.
- Jeśli krok tworzenia snapshotu się nie powiedzie, OpenClaw pomija migrację Matrix w tym uruchomieniu zamiast modyfikować stan bez punktu odzyskiwania.

Informacje o aktualizacjach wielu kont:

- najstarszy płaski magazyn Matrix (`~/.openclaw/matrix/bot-storage.json` i `~/.openclaw/matrix/crypto/`) pochodził z układu z pojedynczym magazynem, więc OpenClaw może zmigrować go tylko do jednego ustalonego celu konta Matrix
- starsze magazyny Matrix już ograniczone do kont są wykrywane i przygotowywane osobno dla każdego skonfigurowanego konta Matrix

## Czego migracja nie może zrobić automatycznie

Poprzedni publiczny Plugin Matrix **nie** tworzył automatycznie kopii zapasowych kluczy pokojów Matrix. Zapisywał lokalny stan kryptograficzny i żądał weryfikacji urządzenia, ale nie gwarantował, że klucze pokojów zostały zapisane w kopii zapasowej na homeserverze.

Oznacza to, że niektóre szyfrowane instalacje można zmigrować tylko częściowo.

OpenClaw nie może automatycznie odzyskać:

- lokalnych kluczy pokojów, które nigdy nie zostały zapisane w kopii zapasowej
- stanu szyfrowanego, gdy docelowego konta Matrix nie można jeszcze ustalić, ponieważ `homeserver`, `userId` lub `accessToken` są nadal niedostępne
- automatycznej migracji jednego współdzielonego płaskiego magazynu Matrix, gdy skonfigurowano wiele kont Matrix, ale `channels.matrix.defaultAccount` nie jest ustawione
- instalacji z niestandardowej ścieżki Plugin przypiętych do ścieżki repozytorium zamiast do standardowego pakietu Matrix
- brakującego klucza odzyskiwania, gdy stary magazyn miał zapisane w kopii zapasowej klucze, ale nie zachował lokalnie klucza odszyfrowywania

Bieżący zakres ostrzeżeń:

- instalacje Matrix z niestandardowej ścieżki Plugin są zgłaszane zarówno przy starcie gateway, jak i przez `openclaw doctor`

Jeśli Twoja stara instalacja miała lokalną szyfrowaną historię, która nigdy nie została zapisana w kopii zapasowej, część starszych zaszyfrowanych wiadomości może pozostać nieczytelna po aktualizacji.

## Zalecany przebieg aktualizacji

1. Zaktualizuj OpenClaw i Plugin Matrix w zwykły sposób.
   Preferuj zwykłe `openclaw update` bez `--no-restart`, aby uruchomienie mogło natychmiast dokończyć migrację Matrix.
2. Uruchom:

   ```bash
   openclaw doctor --fix
   ```

   Jeśli Matrix ma praktyczne zadania migracyjne, doctor najpierw utworzy lub ponownie wykorzysta snapshot sprzed migracji i wypisze ścieżkę do archiwum.

3. Uruchom lub zrestartuj gateway.
4. Sprawdź bieżący stan weryfikacji i kopii zapasowej:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Jeśli OpenClaw informuje, że potrzebny jest klucz odzyskiwania, uruchom:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Jeśli to urządzenie nadal nie jest zweryfikowane, uruchom:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Jeśli klucz odzyskiwania zostanie zaakceptowany, a kopia zapasowa jest użyteczna, ale `Cross-signing verified`
   nadal ma wartość `no`, dokończ samoweryfikację z innego klienta Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Zaakceptuj żądanie w innym kliencie Matrix, porównaj emoji albo liczby dziesiętne
   i wpisz `yes` tylko wtedy, gdy są zgodne. Polecenie kończy się powodzeniem dopiero
   wtedy, gdy `Cross-signing verified` zmieni się na `yes`.

7. Jeśli celowo porzucasz nieodzyskiwalną starą historię i chcesz utworzyć nową bazę kopii zapasowej dla przyszłych wiadomości, uruchom:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Jeśli kopia zapasowa kluczy po stronie serwera jeszcze nie istnieje, utwórz ją na potrzeby przyszłego odzyskiwania:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Jak działa migracja szyfrowana

Migracja szyfrowana to proces dwuetapowy:

1. Uruchomienie albo `openclaw doctor --fix` tworzy lub ponownie wykorzystuje snapshot sprzed migracji, jeśli szyfrowana migracja jest możliwa do wykonania.
2. Uruchomienie albo `openclaw doctor --fix` sprawdza stary magazyn kryptograficzny Matrix przez aktywną instalację Plugin Matrix.
3. Jeśli zostanie znaleziony klucz odszyfrowywania kopii zapasowej, OpenClaw zapisuje go do nowego przepływu klucza odzyskiwania i oznacza przywracanie kluczy pokojów jako oczekujące.
4. Przy następnym uruchomieniu Matrix OpenClaw automatycznie przywraca zapisane w kopii zapasowej klucze pokojów do nowego magazynu kryptograficznego.

Jeśli stary magazyn zgłasza klucze pokojów, które nigdy nie zostały zapisane w kopii zapasowej, OpenClaw ostrzega zamiast udawać, że odzyskiwanie się powiodło.

## Typowe komunikaty i ich znaczenie

### Komunikaty aktualizacji i wykrywania

`Matrix plugin upgraded in place.`

- Znaczenie: wykryto stary stan Matrix na dysku i zmigrowano go do bieżącego układu.
- Co zrobić: nic, chyba że ten sam wynik zawiera również ostrzeżenia.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Znaczenie: OpenClaw utworzył archiwum odzyskiwania przed modyfikacją stanu Matrix.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Znaczenie: OpenClaw znalazł istniejący znacznik snapshotu migracji Matrix i ponownie użył tego archiwum zamiast tworzyć zduplikowaną kopię zapasową.
- Co zrobić: zachowaj wypisaną ścieżkę archiwum, dopóki nie potwierdzisz powodzenia migracji.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: istnieje stary stan Matrix, ale OpenClaw nie może przypisać go do bieżącego konta Matrix, ponieważ Matrix nie jest jeszcze skonfigurowany.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: OpenClaw znalazł stary stan, ale nadal nie może ustalić dokładnego bieżącego katalogu głównego konta/urządzenia.
- Co zrobić: uruchom raz gateway z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia będą już dostępne.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski magazyn Matrix, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Znaczenie: nowa lokalizacja o zakresie konta ma już magazyn synchronizacji lub kryptograficzny, więc OpenClaw nie nadpisał go automatycznie.
- Co zrobić: sprawdź, czy bieżące konto jest właściwe, zanim ręcznie usuniesz lub przeniesiesz konfliktujący cel.

`Failed migrating Matrix legacy sync store (...)` albo `Failed migrating Matrix legacy crypto store (...)`

- Znaczenie: OpenClaw próbował przenieść stary stan Matrix, ale operacja systemu plików zakończyła się niepowodzeniem.
- Co zrobić: sprawdź uprawnienia systemu plików i stan dysku, a następnie ponownie uruchom `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn Matrix, ale nie ma bieżącej konfiguracji Matrix, do której mógłby go dołączyć.
- Co zrobić: skonfiguruj `channels.matrix`, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Znaczenie: magazyn szyfrowany istnieje, ale OpenClaw nie może bezpiecznie ustalić, do którego bieżącego konta/urządzenia należy.
- Co zrobić: uruchom raz gateway z działającym logowaniem Matrix albo ponownie uruchom `openclaw doctor --fix`, gdy zapisane poświadczenia będą już dostępne.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Znaczenie: OpenClaw znalazł jeden współdzielony płaski starszy magazyn kryptograficzny, ale odmawia zgadywania, które nazwane konto Matrix powinno go otrzymać.
- Co zrobić: ustaw `channels.matrix.defaultAccount` na zamierzone konto, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Znaczenie: OpenClaw wykrył stary stan Matrix, ale migracja jest nadal zablokowana przez brakujące dane tożsamości albo poświadczeń.
- Co zrobić: dokończ logowanie Matrix albo konfigurację, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany stan Matrix, ale nie mógł załadować pomocniczego punktu wejścia z Plugin Matrix, który normalnie sprawdza ten magazyn.
- Co zrobić: zainstaluj ponownie albo napraw Plugin Matrix (`openclaw plugins install @openclaw/matrix` albo `openclaw plugins install ./path/to/local/matrix-plugin` dla checkoutu repozytorium), a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Znaczenie: OpenClaw znalazł ścieżkę pliku pomocniczego, która wychodzi poza katalog główny Plugin albo nie przechodzi kontroli granic Plugin, więc odmówił jej importu.
- Co zrobić: zainstaluj ponownie Plugin Matrix z zaufanej ścieżki, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Znaczenie: OpenClaw odmówił modyfikacji stanu Matrix, ponieważ nie mógł najpierw utworzyć snapshotu odzyskiwania.
- Co zrobić: usuń błąd kopii zapasowej, a następnie ponownie uruchom `openclaw doctor --fix` albo zrestartuj gateway.

`Failed migrating legacy Matrix client storage: ...`

- Znaczenie: rezerwowy mechanizm po stronie klienta Matrix znalazł stary płaski magazyn, ale przeniesienie się nie powiodło. OpenClaw teraz przerywa to działanie rezerwowe zamiast po cichu uruchamiać się ze świeżym magazynem.
- Co zrobić: sprawdź uprawnienia systemu plików albo konflikty, zachowaj stary stan bez zmian i spróbuj ponownie po usunięciu błędu.

`Matrix is installed from a custom path: ...`

- Znaczenie: Matrix jest przypięty do instalacji ze ścieżki, więc aktualizacje głównej linii nie zastępują go automatycznie standardowym pakietem Matrix z repozytorium.
- Co zrobić: zainstaluj ponownie za pomocą `openclaw plugins install @openclaw/matrix`, gdy chcesz wrócić do domyślnego Plugin Matrix.

### Komunikaty odzyskiwania stanu szyfrowanego

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Znaczenie: zapisane w kopii zapasowej klucze pokojów zostały pomyślnie przywrócone do nowego magazynu kryptograficznego.
- Co zrobić: zwykle nic.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Znaczenie: część starych kluczy pokojów istniała tylko w starym magazynie lokalnym i nigdy nie została wysłana do kopii zapasowej Matrix.
- Co zrobić: spodziewaj się, że część starej zaszyfrowanej historii pozostanie niedostępna, chyba że uda Ci się odzyskać te klucze ręcznie z innego zweryfikowanego klienta.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Znaczenie: kopia zapasowa istnieje, ale OpenClaw nie mógł automatycznie odzyskać klucza odzyskiwania.
- Co zrobić: uruchom `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Znaczenie: OpenClaw znalazł stary zaszyfrowany magazyn, ale nie mógł sprawdzić go wystarczająco bezpiecznie, aby przygotować odzyskiwanie.
- Co zrobić: ponownie uruchom `openclaw doctor --fix`. Jeśli problem się powtórzy, zachowaj stary katalog stanu bez zmian i odzyskaj dane za pomocą innego zweryfikowanego klienta Matrix oraz `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Znaczenie: OpenClaw wykrył konflikt klucza kopii zapasowej i odmówił automatycznego nadpisania bieżącego pliku klucza odzyskiwania.
- Co zrobić: sprawdź, który klucz odzyskiwania jest poprawny, zanim ponowisz jakiekolwiek polecenie przywracania.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Znaczenie: to twarde ograniczenie starego formatu przechowywania.
- Co zrobić: klucze zapisane w kopii zapasowej nadal można przywrócić, ale lokalna zaszyfrowana historia może pozostać niedostępna.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Znaczenie: nowy Plugin próbował przywrócić dane, ale Matrix zwrócił błąd.
- Co zrobić: uruchom `openclaw matrix verify backup status`, a następnie w razie potrzeby ponów próbę za pomocą `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Komunikaty ręcznego odzyskiwania

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Znaczenie: OpenClaw wie, że powinieneś mieć klucz kopii zapasowej, ale nie jest on aktywny na tym urządzeniu.
- Co zrobić: uruchom `openclaw matrix verify backup restore` albo przekaż `--recovery-key`, jeśli to konieczne.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Znaczenie: to urządzenie nie ma obecnie zapisanego klucza odzyskiwania.
- Co zrobić: najpierw zweryfikuj urządzenie swoim kluczem odzyskiwania, a potem przywróć kopię zapasową.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Znaczenie: zapisany klucz nie pasuje do aktywnej kopii zapasowej Matrix.
- Co zrobić: ponownie uruchom `openclaw matrix verify device "<your-recovery-key>"` z poprawnym kluczem.

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii, możesz zamiast tego zresetować
bieżącą bazę kopii zapasowej za pomocą `openclaw matrix verify backup reset --yes`. Gdy
zapisany sekret kopii zapasowej jest uszkodzony, taki reset może również odtworzyć magazyn sekretów, aby
nowy klucz kopii zapasowej mógł poprawnie załadować się po restarcie.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Znaczenie: kopia zapasowa istnieje, ale to urządzenie nie ufa jeszcze wystarczająco silnie łańcuchowi cross-signing.
- Co zrobić: ponownie uruchom `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Znaczenie: próbowałeś wykonać krok odzyskiwania bez podania klucza odzyskiwania, gdy był wymagany.
- Co zrobić: ponownie uruchom polecenie ze swoim kluczem odzyskiwania.

`Invalid Matrix recovery key: ...`

- Znaczenie: podanego klucza nie udało się sparsować albo nie pasował do oczekiwanego formatu.
- Co zrobić: spróbuj ponownie z dokładnym kluczem odzyskiwania z klienta Matrix lub pliku klucza odzyskiwania.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Znaczenie: OpenClaw mógł zastosować klucz odzyskiwania, ale Matrix nadal nie
  ustanowił pełnego zaufania tożsamości cross-signing dla tego urządzenia. Sprawdź
  w wyjściu polecenia wartości `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` oraz `Device verified by owner`.
- Co zrobić: uruchom `openclaw matrix verify self`, zaakceptuj żądanie w innym
  kliencie Matrix, porównaj SAS i wpisz `yes` tylko wtedy, gdy się zgadza. Polecenie
  czeka na pełne zaufanie tożsamości Matrix, zanim zgłosi powodzenie. Używaj
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  tylko wtedy, gdy celowo chcesz zastąpić bieżącą tożsamość cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Znaczenie: magazyn sekretów nie utworzył aktywnej sesji kopii zapasowej na tym urządzeniu.
- Co zrobić: najpierw zweryfikuj urządzenie, a następnie ponownie sprawdź stan przez `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Znaczenie: to urządzenie nie może przywrócić danych z magazynu sekretów, dopóki nie zostanie zakończona weryfikacja urządzenia.
- Co zrobić: najpierw uruchom `openclaw matrix verify device "<your-recovery-key>"`.

### Komunikaty instalacji niestandardowego Plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Znaczenie: rekord instalacji Plugin wskazuje na lokalną ścieżkę, która już nie istnieje.
- Co zrobić: zainstaluj ponownie przez `openclaw plugins install @openclaw/matrix`, albo jeśli działasz z checkoutu repozytorium, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jeśli zaszyfrowana historia nadal nie wraca

Uruchom te kontrole po kolei:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Jeśli kopia zapasowa zostanie pomyślnie przywrócona, ale w niektórych starych pokojach nadal brakuje historii, te brakujące klucze prawdopodobnie nigdy nie zostały zapisane w kopii zapasowej przez poprzedni Plugin.

## Jeśli chcesz zacząć od nowa dla przyszłych wiadomości

Jeśli akceptujesz utratę nieodzyskiwalnej starej zaszyfrowanej historii i chcesz od teraz tylko czystej bazy kopii zapasowej, uruchom te polecenia po kolei:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jeśli po tym urządzenie nadal nie jest zweryfikowane, dokończ weryfikację z klienta Matrix, porównując emoji SAS albo kody dziesiętne i potwierdzając, że są zgodne.

## Powiązane strony

- [Matrix](/pl/channels/matrix)
- [Doctor](/pl/gateway/doctor)
- [Migrating](/pl/install/migrating)
- [Plugins](/pl/tools/plugin)
