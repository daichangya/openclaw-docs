---
read_when:
    - Додавання або зміна захоплення з камери на вузлах iOS/Android або macOS
    - Розширення доступних агенту workflow тимчасових файлів MEDIA
summary: 'Захоплення з камери (вузли iOS/Android + застосунок macOS) для використання агентом: фото (jpg) і короткі відеокліпи (mp4)'
title: Захоплення з камери
x-i18n:
    generated_at: "2026-04-05T18:09:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Захоплення з камери (агент)

OpenClaw підтримує **захоплення з камери** для workflow агентів:

- **Вузол iOS** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Вузол Android** (спарений через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Застосунок macOS** (вузол через Gateway): захоплення **фото** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.

Увесь доступ до камери захищено **налаштуваннями, які контролює користувач**.

## Вузол iOS

### Користувацьке налаштування (типово увімкнено)

- Вкладка iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається увімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди (через Gateway `node.invoke`)

- `camera.list`
  - Пейлоад відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `maxWidth`: number (необов’язково; типово `1600` на вузлі iOS)
    - `quality`: `0..1` (необов’язково; типово `0.9`)
    - `format`: наразі `jpg`
    - `delayMs`: number (необов’язково; типово `0`)
    - `deviceId`: string (необов’язково; з `camera.list`)
  - Пейлоад відповіді:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Захист пейлоада: фото повторно стискаються, щоб утримати base64-пейлоад меншим за 5 МБ.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `durationMs`: number (типово `3000`, обмежується максимумом `60000`)
    - `includeAudio`: boolean (типово `true`)
    - `format`: наразі `mp4`
    - `deviceId`: string (необов’язково; з `camera.list`)
  - Пейлоад відповіді:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Вимога переднього плану

Як і `canvas.*`, вузол iOS дозволяє команди `camera.*` лише у **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Допоміжна функція CLI (тимчасові файли + MEDIA)

Найпростіший спосіб отримати вкладення — через допоміжну функцію CLI, яка записує декодовані медіа у тимчасовий файл і виводить `MEDIA:<path>`.

Приклади:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `nodes camera snap` типово використовує **обидва** напрямки камери, щоб агент отримав обидва ракурси.
- Вихідні файли є тимчасовими (у тимчасовому каталозі ОС), якщо ви не створите власну обгортку.

## Вузол Android

### Користувацьке налаштування Android (типово увімкнено)

- Аркуш Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається увімкненим).
  - Коли вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Дозволи

- Android вимагає runtime-дозволів:
  - `CAMERA` для `camera.snap` і `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, коли `includeAudio=true`.

Якщо дозволів бракує, застосунок за можливості покаже запит; якщо в дозволі відмовлено, запити `camera.*` завершуються помилкою
`*_PERMISSION_REQUIRED`.

### Вимога переднього плану Android

Як і `canvas.*`, вузол Android дозволяє команди `camera.*` лише у **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Пейлоад відповіді:
    - `devices`: масив `{ id, name, position, deviceType }`

### Захист пейлоада

Фото повторно стискаються, щоб утримати base64-пейлоад меншим за 5 МБ.

## Застосунок macOS

### Користувацьке налаштування (типово вимкнено)

Застосунок-компаньйон macOS надає прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Типово: **вимкнено**
  - Коли вимкнено: запити до камери повертають “Camera disabled by user”.

### Допоміжна функція CLI (node invoke)

Використовуйте основний CLI `openclaw`, щоб викликати команди камери на вузлі macOS.

Приклади:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `openclaw nodes camera snap` типово використовує `maxWidth=1600`, якщо не перевизначено.
- На macOS `camera.snap` чекає `delayMs` (типово 2000 мс) після прогрівання/стабілізації експозиції перед захопленням.
- Пейлоади фото повторно стискаються, щоб base64 залишався меншим за 5 МБ.

## Безпека та практичні обмеження

- Доступ до камери й мікрофона викликає звичайні системні запити на дозволи (і потребує рядків використання в Info.plist).
- Відеокліпи обмежені за тривалістю (зараз `<= 60s`), щоб уникнути надто великих пейлоадів вузла (накладні витрати base64 + обмеження повідомлень).

## Відео екрана на macOS (на рівні ОС)

Для _відео екрана_ (не камери) використовуйте застосунок-компаньйон macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Примітки:

- Потрібен дозвіл macOS **Screen Recording** (TCC).
