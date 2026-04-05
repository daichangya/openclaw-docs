---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-05T18:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Міграція Matrix

Ця сторінка описує оновлення з попереднього публічного plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення виконується на місці:

- plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- runtime-стан залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати plugin під новою назвою.

## Що міграція робить автоматично

Коли gateway запускається, і коли ви виконуєте [`openclaw doctor --fix`](/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перш ніж будь-який дієвий крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий recovery snapshot.

Коли ви використовуєте `openclaw update`, точний тригер залежить від того, як установлено OpenClaw:

- інсталяції з вихідного коду запускають `openclaw doctor --fix` під час потоку оновлення, а потім за замовчуванням перезапускають gateway
- інсталяції через package manager оновлюють package, запускають неінтерактивний прохід doctor, а потім покладаються на типовий перезапуск gateway, щоб startup міг завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграція Matrix, яка залежить від startup, відкладається до того моменту, коли ви пізніше виконаєте `openclaw doctor --fix` і перезапустите gateway

Автоматична міграція охоплює:

- створення або повторне використання snapshot перед міграцією в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису та конфігурації `channels.matrix`
- переміщення найстарішого плоского sync store Matrix у поточне розташування з областю облікового запису
- переміщення найстарішого плоского crypto store Matrix у поточне розташування з областю облікового запису, коли цільовий обліковий запис можна безпечно визначити
- витягування раніше збереженого ключа дешифрування резервної копії ключів кімнат Matrix зі старого rust crypto store, якщо цей ключ локально існує
- повторне використання найповнішого наявного кореня сховища token-hash для того самого облікового запису Matrix, homeserver і користувача, коли access token пізніше змінюється
- сканування сусідніх коренів сховища token-hash на наявність metadata відкладеного відновлення зашифрованого стану, коли access token Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних ключів кімнат у новому crypto store під час наступного startup Matrix

Відомості про snapshot:

- OpenClaw записує marker file у `~/.openclaw/matrix/migration-snapshot.json` після успішного snapshot, щоб наступні проходи startup і repair могли повторно використовувати той самий archive.
- Ці автоматичні snapshot міграції Matrix створюють резервну копію лише config + state (`includeWorkspace: false`).
- Якщо Matrix має лише стан міграції на рівні попереджень, наприклад тому що `userId` або `accessToken` усе ще відсутні, OpenClaw поки не створює snapshot, бо жодна зміна Matrix ще не є дієвою.
- Якщо крок snapshot завершується помилкою, OpenClaw пропускає міграцію Matrix для цього запуску замість зміни стану без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить зі схеми з одним сховищем, тому OpenClaw може мігрувати його лише в одну визначену ціль Matrix account
- уже scoped старі сховища Matrix з областю облікового запису виявляються й готуються окремо для кожного налаштованого облікового запису Matrix

## Що міграція не може зробити автоматично

Попередній публічний plugin Matrix **не** створював автоматично резервні копії ключів кімнат Matrix. Він зберігав локальний crypto-стан і запитував верифікацію пристрою, але не гарантував, що ваші ключі кімнат були збережені в резервній копії на homeserver.

Це означає, що деякі зашифровані інсталяції можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- локальні ключі кімнат, які ніколи не були збережені в резервній копії
- зашифрований стан, коли цільовий обліковий запис Matrix ще не можна визначити, тому що `homeserver`, `userId` або `accessToken` усе ще недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, коли налаштовано кілька облікових записів Matrix, але `channels.matrix.defaultAccount` не задано
- інсталяції custom plugin path, зафіксовані на шляху репозиторію, а не на стандартному package Matrix
- відсутній recovery key, коли старе сховище містило резервні ключі, але не зберігало локально ключ дешифрування

Поточна область попереджень:

- інсталяції custom Matrix plugin path показуються як під час startup gateway, так і в `openclaw doctor`

Якщо у вашій старій інсталяції була локальна зашифрована історія, яка ніколи не зберігалася в резервній копії, деякі старі зашифровані повідомлення можуть залишитися непридатними для читання після оновлення.

## Рекомендований потік оновлення

1. Оновіть OpenClaw і plugin Matrix звичайним способом.
   Надавайте перевагу звичайному `openclaw update` без `--no-restart`, щоб startup міг одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо Matrix має дієву роботу з міграції, doctor спочатку створить або повторно використає snapshot перед міграцією та виведе шлях до archive.

3. Запустіть або перезапустіть gateway.
4. Перевірте поточний стан верифікації та резервної копії:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Якщо OpenClaw повідомляє, що потрібен recovery key, виконайте:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Якщо цей пристрій усе ще не верифікований, виконайте:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Якщо ви свідомо відмовляєтеся від невідновлюваної старої історії й хочете нову базову резервну копію для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Якщо серверна резервна копія ключів ще не існує, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція зашифрованого стану

Міграція зашифрованого стану — це двоетапний процес:

1. Startup або `openclaw doctor --fix` створює або повторно використовує snapshot перед міграцією, якщо міграція зашифрованого стану є дієвою.
2. Startup або `openclaw doctor --fix` перевіряє старий crypto store Matrix через активну інсталяцію plugin Matrix.
3. Якщо знайдено ключ дешифрування резервної копії, OpenClaw записує його в новий потік recovery key і позначає відновлення ключів кімнат як pending.
4. Під час наступного startup Matrix OpenClaw автоматично відновлює резервні ключі кімнат у новий crypto store.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw видає попередження замість того, щоб удавати, ніби відновлення пройшло успішно.

## Поширені повідомлення та що вони означають

### Повідомлення про оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску було виявлено й мігровано до поточної схеми.
- Що робити: нічого, якщо той самий вивід не містить також попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив recovery archive перед зміною стану Matrix.
- Що робити: збережіть виведений шлях до archive, доки не підтвердите, що міграція успішна.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний marker snapshot міграції Matrix і повторно використав цей archive замість створення дубльованої резервної копії.
- Що робити: збережіть виведений шлях до archive, доки не підтвердите, що міграція успішна.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним обліковим записом Matrix, бо Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але все ще не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть gateway з робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, який іменований обліковий запис Matrix має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` для потрібного облікового запису, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з областю облікового запису вже має sync або crypto store, тому OpenClaw не став автоматично його перезаписувати.
- Що робити: переконайтеся, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщувати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` або `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw спробував перемістити старий стан Matrix, але операція файлової системи завершилася помилкою.
- Що робити: перевірте дозволи файлової системи та стан диска, потім повторно виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно визначити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть gateway з робочим входом у Matrix або повторно виконайте `openclaw doctor --fix` після появи кешованих облікових даних.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске старе crypto store, але відмовляється вгадувати, який іменований обліковий запис Matrix має його отримати.
- Що робити: задайте `channels.matrix.defaultAccount` для потрібного облікового запису, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграцію все ще блокує відсутність даних ідентичності або облікових даних.
- Що робити: завершіть вхід у Matrix або налаштування конфігурації, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити helper entrypoint із plugin Matrix, який зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть plugin Matrix (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до helper file, який виходить за межі кореня plugin або не проходить перевірки меж plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть plugin Matrix із довіреного шляху, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, бо спочатку не зміг створити recovery snapshot.
- Що робити: усуньте помилку резервної копії, потім повторно виконайте `openclaw doctor --fix` або перезапустіть gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: fallback на стороні client Matrix знайшов старе плоске сховище, але переміщення завершилося помилкою. Тепер OpenClaw перериває цей fallback замість того, щоб мовчки запускатися з новим порожнім сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан недоторканим і повторіть спробу після виправлення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix зафіксовано на інсталяції з path, тому стандартні оновлення не замінюють його автоматично на стандартний package Matrix із репозиторію.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до plugin Matrix за замовчуванням.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: резервні ключі кімнат успішно відновлено в новий crypto store.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише в старому локальному сховищі та ніколи не були завантажені в резервну копію Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете відновити ці ключі вручну з іншого верифікованого client.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити recovery key.
- Що робити: виконайте `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг перевірити його достатньо безпечно, щоб підготувати відновлення.
- Що робити: повторно виконайте `openclaw doctor --fix`. Якщо це повторюється, залиште старий каталог стану недоторканим і відновіть через інший верифікований Matrix client плюс `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключів резервної копії й відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який recovery key є правильним, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: резервні ключі все ще можна відновити, але локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий plugin спробував відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, потім за потреби повторіть спробу з `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути ключ резервної копії, але він не активний на цьому пристрої.
- Що робити: виконайте `openclaw matrix verify backup restore` або передайте `--recovery-key`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої наразі не збережено recovery key.
- Що робити: спочатку верифікуйте пристрій за допомогою recovery key, потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Значення: збережений ключ не збігається з активною резервною копією Matrix.
- Що робити: повторно виконайте `openclaw matrix verify device "<your-recovery-key>"` із правильним ключем.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, натомість можете скинути
поточну базову резервну копію через `openclaw matrix verify backup reset --yes`. Коли
збережений секрет резервної копії пошкоджений, це скидання також може повторно створити secret storage, щоб
новий ключ резервної копії міг коректно завантажуватися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Значення: резервна копія існує, але цей пристрій ще недостатньо сильно не довіряє ланцюгу cross-signing.
- Що робити: повторно виконайте `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Значення: ви спробували крок відновлення, не надавши recovery key, коли він був потрібен.
- Що робити: повторно виконайте команду з recovery key.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідає очікуваному формату.
- Що робити: повторіть спробу з точним recovery key із вашого Matrix client або файла recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Значення: ключ було застосовано, але пристрій усе ще не зміг завершити верифікацію.
- Що робити: переконайтеся, що ви використали правильний ключ і що cross-signing доступний для облікового запису, потім повторіть спробу.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створило активну сесію резервної копії на цьому пристрої.
- Що робити: спочатку верифікуйте пристрій, потім повторно перевірте через `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Значення: цей пристрій не може відновитися із secret storage, доки не завершено верифікацію пристрою.
- Що робити: спочатку виконайте `openclaw matrix verify device "<your-recovery-key>"`.

### Повідомлення про інсталяцію custom plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: ваш запис інсталяції plugin вказує на локальний шлях, якого більше немає.
- Що робити: перевстановіть через `openclaw plugins install @openclaw/matrix`, або, якщо ви працюєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки по черзі:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Якщо резервна копія успішно відновлюється, але в деяких старих кімнатах історія все ще відсутня, ці відсутні ключі, імовірно, ніколи не були збережені в резервній копії попереднім plugin.

## Якщо ви хочете почати з чистого аркуша для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й надалі хочете лише чисту базову резервну копію, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не верифіковано, завершіть верифікацію у своєму Matrix client, порівнявши SAS emoji або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язані сторінки

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migrating](/install/migrating)
- [Plugins](/tools/plugin)
