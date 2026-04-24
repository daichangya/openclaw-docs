---
read_when:
    - Оновлення наявної інсталяції Matrix
    - Міграція зашифрованої історії Matrix і стану пристрою
summary: Як OpenClaw оновлює попередній Plugin Matrix на місці, включно з обмеженнями відновлення зашифрованого стану та кроками ручного відновлення.
title: Міграція Matrix
x-i18n:
    generated_at: "2026-04-24T22:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Ця сторінка описує оновлення з попереднього публічного Plugin `matrix` до поточної реалізації.

Для більшості користувачів оновлення відбувається на місці:

- plugin залишається `@openclaw/matrix`
- канал залишається `matrix`
- ваша конфігурація залишається в `channels.matrix`
- кешовані облікові дані залишаються в `~/.openclaw/credentials/matrix/`
- стан середовища виконання залишається в `~/.openclaw/matrix/`

Вам не потрібно перейменовувати ключі конфігурації або перевстановлювати Plugin під новою назвою.

## Що міграція робить автоматично

Коли Gateway запускається, а також коли ви виконуєте [`openclaw doctor --fix`](/uk/gateway/doctor), OpenClaw намагається автоматично відновити старий стан Matrix.
Перш ніж будь-який застосовний крок міграції Matrix змінить стан на диску, OpenClaw створює або повторно використовує цільовий знімок відновлення.

Коли ви використовуєте `openclaw update`, точний тригер залежить від того, як установлено OpenClaw:

- інсталяції з джерельного коду запускають `openclaw doctor --fix` під час процесу оновлення, а потім за замовчуванням перезапускають Gateway
- інсталяції через менеджер пакетів оновлюють пакет, запускають неінтерактивний прохід doctor, а потім покладаються на стандартний перезапуск Gateway, щоб під час запуску завершити міграцію Matrix
- якщо ви використовуєте `openclaw update --no-restart`, міграцію Matrix, що виконується під час запуску, буде відкладено, доки ви пізніше не виконаєте `openclaw doctor --fix` і не перезапустите Gateway

Автоматична міграція охоплює:

- створення або повторне використання знімка перед міграцією в `~/Backups/openclaw-migrations/`
- повторне використання ваших кешованих облікових даних Matrix
- збереження того самого вибору облікового запису та конфігурації `channels.matrix`
- переміщення найстарішого плоского сховища синхронізації Matrix до поточного розташування з областю дії облікового запису
- переміщення найстарішого плоского криптографічного сховища Matrix до поточного розташування з областю дії облікового запису, якщо цільовий обліковий запис можна безпечно визначити
- витяг раніше збереженого ключа дешифрування резервної копії ключів кімнат Matrix зі старого rust crypto store, якщо цей ключ існує локально
- повторне використання найповнішого наявного кореня сховища з хешем токена для того самого облікового запису Matrix, homeserver і користувача, коли токен доступу пізніше змінюється
- сканування сусідніх коренів сховища з хешем токена на наявність метаданих відновлення зашифрованого стану в очікуванні, коли токен доступу Matrix змінився, але ідентичність облікового запису/пристрою залишилася тією самою
- відновлення резервних копій ключів кімнат до нового криптографічного сховища під час наступного запуску Matrix

Подробиці щодо знімків:

- Після успішного створення знімка OpenClaw записує файл-маркер у `~/.openclaw/matrix/migration-snapshot.json`, щоб наступні проходи запуску й відновлення могли повторно використовувати той самий архів.
- Ці автоматичні знімки міграції Matrix створюють резервну копію лише конфігурації та стану (`includeWorkspace: false`).
- Якщо для Matrix є лише стан міграції з попередженнями, наприклад через те, що `userId` або `accessToken` іще відсутні, OpenClaw поки не створює знімок, оскільки жодна зміна Matrix не є застосовною.
- Якщо крок створення знімка не вдається, OpenClaw пропускає міграцію Matrix у цьому запуску замість того, щоб змінювати стан без точки відновлення.

Про оновлення з кількома обліковими записами:

- найстаріше плоске сховище Matrix (`~/.openclaw/matrix/bot-storage.json` і `~/.openclaw/matrix/crypto/`) походить із макета з одним сховищем, тому OpenClaw може мігрувати його лише до однієї визначеної цілі облікового запису Matrix
- застарілі сховища Matrix, які вже мають область дії облікового запису, виявляються та готуються окремо для кожного налаштованого облікового запису Matrix

## Що міграція не може зробити автоматично

Попередній публічний Plugin Matrix **не** створював автоматично резервні копії ключів кімнат Matrix. Він зберігав локальний криптографічний стан і запитував верифікацію пристрою, але не гарантував, що ваші ключі кімнат були збережені на homeserver.

Це означає, що деякі зашифровані інсталяції можна мігрувати лише частково.

OpenClaw не може автоматично відновити:

- локальні ключі кімнат, які ніколи не були збережені в резервній копії
- зашифрований стан, коли цільовий обліковий запис Matrix іще неможливо визначити, бо `homeserver`, `userId` або `accessToken` ще недоступні
- автоматичну міграцію одного спільного плоского сховища Matrix, коли налаштовано кілька облікових записів Matrix, але `channels.matrix.defaultAccount` не задано
- інсталяції з кастомним шляхом до Plugin, які прив’язані до шляху репозиторію замість стандартного пакета Matrix
- відсутній ключ відновлення, якщо старе сховище мало резервні копії ключів, але не зберігало ключ дешифрування локально

Поточна область попереджень:

- інсталяції Matrix plugin із кастомним шляхом відображаються як під час запуску Gateway, так і в `openclaw doctor`

Якщо у вашій старій інсталяції була локальна зашифрована історія, яка ніколи не зберігалася в резервній копії, деякі старіші зашифровані повідомлення можуть залишитися нечитабельними після оновлення.

## Рекомендований процес оновлення

1. Оновіть OpenClaw і Matrix plugin звичайним способом.
   Надавайте перевагу звичайному `openclaw update` без `--no-restart`, щоб запуск міг одразу завершити міграцію Matrix.
2. Виконайте:

   ```bash
   openclaw doctor --fix
   ```

   Якщо для Matrix є застосовна робота з міграції, doctor спочатку створить або повторно використає знімок перед міграцією та виведе шлях до архіву.

3. Запустіть або перезапустіть Gateway.
4. Перевірте поточний стан верифікації та резервного копіювання:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Якщо OpenClaw повідомляє, що потрібен ключ відновлення, виконайте:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Якщо цей пристрій іще не верифіковано, виконайте:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Якщо ключ відновлення прийнято і резервна копія придатна до використання, але `Cross-signing verified`
   усе ще має значення `no`, завершіть самоверифікацію з іншого клієнта Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Підтвердьте запит в іншому клієнті Matrix, порівняйте емодзі або десяткові числа
   і вводьте `yes` лише тоді, коли вони збігаються. Команда завершується успішно лише
   після того, як `Cross-signing verified` набуде значення `yes`.

7. Якщо ви свідомо відмовляєтеся від невідновлюваної старої історії та хочете отримати нову базову лінію резервного копіювання для майбутніх повідомлень, виконайте:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Якщо резервної копії ключів на боці сервера ще не існує, створіть її для майбутніх відновлень:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Як працює міграція зашифрованих даних

Міграція зашифрованих даних — це двоетапний процес:

1. Під час запуску або виконання `openclaw doctor --fix` створюється або повторно використовується знімок перед міграцією, якщо міграція зашифрованих даних є застосовною.
2. Під час запуску або виконання `openclaw doctor --fix` старе криптографічне сховище Matrix перевіряється через активну інсталяцію Matrix plugin.
3. Якщо знайдено ключ дешифрування резервної копії, OpenClaw записує його в новий процес ключа відновлення та позначає відновлення ключів кімнат як таке, що очікує виконання.
4. Під час наступного запуску Matrix OpenClaw автоматично відновлює резервні копії ключів кімнат до нового криптографічного сховища.

Якщо старе сховище повідомляє про ключі кімнат, які ніколи не були збережені в резервній копії, OpenClaw показує попередження замість того, щоб удавати, ніби відновлення виконано успішно.

## Поширені повідомлення та їх значення

### Повідомлення про оновлення та виявлення

`Matrix plugin upgraded in place.`

- Значення: старий стан Matrix на диску було виявлено та мігровано до поточного макета.
- Що робити: нічого, якщо в тому самому виводі немає попереджень.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Значення: OpenClaw створив архів відновлення перед зміною стану Matrix.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція пройшла успішно.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Значення: OpenClaw знайшов наявний файл-маркер знімка міграції Matrix і повторно використав цей архів замість створення дубльованої резервної копії.
- Що робити: збережіть виведений шлях до архіву, доки не підтвердите, що міграція пройшла успішно.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Значення: старий стан Matrix існує, але OpenClaw не може зіставити його з поточним обліковим записом Matrix, оскільки Matrix не налаштовано.
- Що робити: налаштуйте `channels.matrix`, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: OpenClaw знайшов старий стан, але все ще не може визначити точний поточний корінь облікового запису/пристрою.
- Що робити: один раз запустіть Gateway із робочим входом Matrix або повторно виконайте `openclaw doctor --fix`, коли кешовані облікові дані вже існуватимуть.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске сховище Matrix, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Значення: нове розташування з областю дії облікового запису вже містить сховище синхронізації або криптографічне сховище, тому OpenClaw не перезаписав його автоматично.
- Що робити: переконайтеся, що поточний обліковий запис правильний, перш ніж вручну видаляти або переміщувати конфліктну ціль.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Значення: OpenClaw спробував перемістити старий стан Matrix, але операція файлової системи не вдалася.
- Що робити: перевірте дозволи файлової системи та стан диска, потім знову виконайте `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Значення: OpenClaw знайшов старе зашифроване сховище Matrix, але немає поточної конфігурації Matrix, до якої його можна прив’язати.
- Що робити: налаштуйте `channels.matrix`, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Значення: зашифроване сховище існує, але OpenClaw не може безпечно визначити, якому поточному обліковому запису/пристрою воно належить.
- Що робити: один раз запустіть Gateway із робочим входом Matrix або повторно виконайте `openclaw doctor --fix`, коли кешовані облікові дані будуть доступні.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Значення: OpenClaw знайшов одне спільне плоске застаріле криптографічне сховище, але відмовляється вгадувати, якому іменованому обліковому запису Matrix його слід призначити.
- Що робити: установіть `channels.matrix.defaultAccount` на потрібний обліковий запис, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Значення: OpenClaw виявив старий стан Matrix, але міграція все ще заблокована через відсутні дані ідентичності або облікових даних.
- Що робити: завершіть вхід у Matrix або налаштування конфігурації, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Значення: OpenClaw знайшов старий зашифрований стан Matrix, але не зміг завантажити допоміжну точку входу з Matrix plugin, яка зазвичай перевіряє це сховище.
- Що робити: перевстановіть або відновіть Matrix plugin (`openclaw plugins install @openclaw/matrix` або `openclaw plugins install ./path/to/local/matrix-plugin` для checkout репозиторію), потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Значення: OpenClaw знайшов шлях до допоміжного файла, який виходить за межі кореня plugin або не проходить перевірки меж plugin, тому відмовився його імпортувати.
- Що робити: перевстановіть Matrix plugin із довіреного шляху, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Значення: OpenClaw відмовився змінювати стан Matrix, оскільки спочатку не зміг створити знімок відновлення.
- Що робити: усуньте помилку резервного копіювання, потім знову виконайте `openclaw doctor --fix` або перезапустіть Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Значення: клієнтський резервний механізм Matrix знайшов старе плоске сховище, але переміщення не вдалося. Тепер OpenClaw перериває цей резервний механізм замість того, щоб мовчки запускатися з новим сховищем.
- Що робити: перевірте дозволи файлової системи або конфлікти, збережіть старий стан без змін і повторіть спробу після усунення помилки.

`Matrix is installed from a custom path: ...`

- Значення: Matrix прив’язаний до інсталяції за шляхом, тому стандартні оновлення не замінюють його автоматично на стандартний пакет Matrix із репозиторію.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, коли захочете повернутися до стандартного Matrix plugin.

### Повідомлення про відновлення зашифрованого стану

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Значення: резервні копії ключів кімнат успішно відновлено в нове криптографічне сховище.
- Що робити: зазвичай нічого.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Значення: деякі старі ключі кімнат існували лише в старому локальному сховищі й ніколи не були завантажені до резервної копії Matrix.
- Що робити: очікуйте, що частина старої зашифрованої історії залишиться недоступною, якщо ви не зможете відновити ці ключі вручну з іншого верифікованого клієнта Matrix.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Значення: резервна копія існує, але OpenClaw не зміг автоматично відновити ключ відновлення.
- Що робити: виконайте `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Значення: OpenClaw знайшов старе зашифроване сховище, але не зміг перевірити його достатньо безпечно, щоб підготувати відновлення.
- Що робити: знову виконайте `openclaw doctor --fix`. Якщо це повторюється, збережіть старий каталог стану без змін і відновіть дані за допомогою іншого верифікованого клієнта Matrix плюс `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Значення: OpenClaw виявив конфлікт ключів резервної копії й відмовився автоматично перезаписувати поточний файл recovery-key.
- Що робити: перевірте, який ключ відновлення є правильним, перш ніж повторювати будь-яку команду відновлення.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Значення: це жорстке обмеження старого формату сховища.
- Що робити: ключі з резервної копії все ще можна відновити, але локальна зашифрована історія може залишитися недоступною.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Значення: новий plugin спробував виконати відновлення, але Matrix повернув помилку.
- Що робити: виконайте `openclaw matrix verify backup status`, а потім за потреби повторіть спробу через `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

### Повідомлення про ручне відновлення

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Значення: OpenClaw знає, що у вас має бути ключ резервної копії, але на цьому пристрої він не активний.
- Що робити: виконайте `openclaw matrix verify backup restore` або передайте `--recovery-key`, якщо потрібно.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Значення: на цьому пристрої наразі не збережено ключ відновлення.
- Що робити: спочатку верифікуйте пристрій своїм ключем відновлення, а потім відновіть резервну копію.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Значення: збережений ключ не відповідає активній резервній копії Matrix.
- Що робити: знову виконайте `openclaw matrix verify device "<your-recovery-key>"` з правильним ключем.

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію, натомість можете
скинути поточну базову лінію резервного копіювання за допомогою `openclaw matrix verify backup reset --yes`. Коли
збережений секрет резервного копіювання пошкоджено, це скидання також може перевідтворити сховище секретів, щоб
новий ключ резервної копії міг коректно завантажитися після перезапуску.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Значення: резервна копія існує, але цей пристрій ще недостатньо сильно довіряє ланцюгу cross-signing.
- Що робити: знову виконайте `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Значення: ви спробували виконати крок відновлення без вказаного ключа відновлення, хоча він був потрібен.
- Що робити: знову виконайте команду зі своїм ключем відновлення.

`Invalid Matrix recovery key: ...`

- Значення: наданий ключ не вдалося розібрати або він не відповідав очікуваному формату.
- Що робити: повторіть спробу з точним ключем відновлення з вашого клієнта Matrix або файла recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Значення: OpenClaw зміг застосувати ключ відновлення, але Matrix усе ще не
  встановив повну довіру до cross-signing identity для цього пристрою. Перевірте
  у виводі команди `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` і `Device verified by owner`.
- Що робити: виконайте `openclaw matrix verify self`, підтвердьте запит в іншому
  клієнті Matrix, порівняйте SAS і введіть `yes` лише тоді, коли він збігається. Команда
  очікує на повну довіру до Matrix identity, перш ніж повідомити про успіх. Використовуйте
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  лише тоді, коли ви свідомо хочете замінити поточну cross-signing identity.

`Matrix key backup is not active on this device after loading from secret storage.`

- Значення: secret storage не створило активну сесію резервного копіювання на цьому пристрої.
- Що робити: спочатку верифікуйте пристрій, а потім повторно перевірте стан через `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Значення: цей пристрій не може відновити дані з secret storage, доки не завершено верифікацію пристрою.
- Що робити: спочатку виконайте `openclaw matrix verify device "<your-recovery-key>"`.

### Повідомлення про інсталяцію кастомного plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Значення: запис про інсталяцію plugin вказує на локальний шлях, якого більше не існує.
- Що робити: перевстановіть за допомогою `openclaw plugins install @openclaw/matrix`, або, якщо ви працюєте з checkout репозиторію, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Якщо зашифрована історія все ще не повертається

Виконайте ці перевірки по порядку:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Якщо резервна копія відновлюється успішно, але в деяких старих кімнатах історія все ще відсутня, імовірно, ці відсутні ключі ніколи не були збережені в резервній копії попереднім plugin.

## Якщо ви хочете почати з чистого аркуша для майбутніх повідомлень

Якщо ви погоджуєтеся втратити невідновлювану стару зашифровану історію й хочете лише чисту базову лінію резервного копіювання надалі, виконайте ці команди по порядку:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Якщо після цього пристрій усе ще не верифіковано, завершіть верифікацію зі свого клієнта Matrix, порівнявши SAS emoji або десяткові коди та підтвердивши, що вони збігаються.

## Пов’язані сторінки

- [Matrix](/uk/channels/matrix)
- [Doctor](/uk/gateway/doctor)
- [Міграція](/uk/install/migrating)
- [Plugins](/uk/tools/plugin)
