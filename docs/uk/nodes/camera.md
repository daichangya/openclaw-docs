---
read_when:
    - Додавання або зміна захоплення з камери на вузлах iOS/Android або в macOS
    - Розширення робочих процесів тимчасових файлів MEDIA, доступних агенту
summary: 'Захоплення з камери (вузли iOS/Android + застосунок macOS) для використання агентом: фотографії (jpg) і короткі відеокліпи (mp4)'
title: Захоплення з камери
x-i18n:
    generated_at: "2026-04-23T23:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw підтримує **захоплення з камери** для робочих процесів агента:

- **Вузол iOS** (сполучений через Gateway): захоплення **фотографії** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Вузол Android** (сполучений через Gateway): захоплення **фотографії** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.
- **Застосунок macOS** (вузол через Gateway): захоплення **фотографії** (`jpg`) або **короткого відеокліпу** (`mp4`, з необов’язковим аудіо) через `node.invoke`.

Увесь доступ до камери захищений **налаштуваннями під контролем користувача**.

## Вузол iOS

### Налаштування користувача (типово ввімкнено)

- Вкладка налаштувань iOS → **Камера** → **Дозволити камеру** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Якщо вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Команди (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив із `{ id, name, position, deviceType }`

- `camera.snap`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `maxWidth`: число (необов’язково; типово `1600` на вузлі iOS)
    - `quality`: `0..1` (необов’язково; типово `0.9`)
    - `format`: наразі `jpg`
    - `delayMs`: число (необов’язково; типово `0`)
    - `deviceId`: рядок (необов’язково; із `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Запобіжник корисного навантаження: фотографії повторно стискаються, щоб зберегти корисне навантаження base64 меншим за 5 MB.

- `camera.clip`
  - Параметри:
    - `facing`: `front|back` (типово: `front`)
    - `durationMs`: число (типово `3000`, обмежується максимумом `60000`)
    - `includeAudio`: boolean (типово `true`)
    - `format`: наразі `mp4`
    - `deviceId`: рядок (необов’язково; із `camera.list`)
  - Корисне навантаження відповіді:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Вимога переднього плану

Як і `canvas.*`, вузол iOS дозволяє команди `camera.*` лише у **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Допоміжний засіб CLI (тимчасові файли + MEDIA)

Найпростіший спосіб отримати вкладення — скористатися допоміжним засобом CLI, який записує декодовані медіадані до тимчасового файла та виводить `MEDIA:<path>`.

Приклади:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Примітки:

- `nodes camera snap` типово використовує **обидва** напрями, щоб надати агенту обидва ракурси.
- Вихідні файли є тимчасовими (у тимчасовому каталозі ОС), якщо ви не створите власну обгортку.

## Вузол Android

### Налаштування користувача Android (типово ввімкнено)

- Панель налаштувань Android → **Камера** → **Дозволити камеру** (`camera.enabled`)
  - Типово: **увімкнено** (відсутній ключ вважається ввімкненим).
  - Якщо вимкнено: команди `camera.*` повертають `CAMERA_DISABLED`.

### Дозволи

- Android вимагає дозволів під час виконання:
  - `CAMERA` для `camera.snap` і `camera.clip`.
  - `RECORD_AUDIO` для `camera.clip`, коли `includeAudio=true`.

Якщо дозволів бракує, застосунок покаже запит, коли це можливо; якщо відмовлено, запити `camera.*` завершаться помилкою
`*_PERMISSION_REQUIRED`.

### Вимога переднього плану Android

Як і `canvas.*`, вузол Android дозволяє команди `camera.*` лише у **передньому плані**. Виклики у фоновому режимі повертають `NODE_BACKGROUND_UNAVAILABLE`.

### Команди Android (через Gateway `node.invoke`)

- `camera.list`
  - Корисне навантаження відповіді:
    - `devices`: масив із `{ id, name, position, deviceType }`

### Запобіжник корисного навантаження

Фотографії повторно стискаються, щоб зберегти корисне навантаження base64 меншим за 5 MB.

## Застосунок macOS

### Налаштування користувача (типово вимкнено)

Супутній застосунок macOS має прапорець:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Типово: **вимкнено**
  - Якщо вимкнено: запити до камери повертають “Камеру вимкнено користувачем”.

### Допоміжний засіб CLI (node invoke)

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
- На macOS `camera.snap` очікує `delayMs` (типово 2000 мс) після прогріву/стабілізації експозиції перед захопленням.
- Корисні навантаження фотографій повторно стискаються, щоб зберегти base64 меншим за 5 MB.

## Безпека + практичні обмеження

- Доступ до камери та мікрофона викликає звичайні системні запити на дозволи (і вимагає рядків usage в Info.plist).
- Відеокліпи обмежені за тривалістю (наразі `<= 60s`), щоб уникнути завеликих корисних навантажень вузла (накладні витрати base64 + обмеження повідомлень).

## Відеозапис екрана macOS (на рівні ОС)

Для _відео екрана_ (не камери) використовуйте супутній застосунок macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Примітки:

- Потрібен дозвіл macOS **Screen Recording** (TCC).

## Пов’язане

- [Підтримка зображень і медіа](/uk/nodes/images)
- [Розуміння медіа](/uk/nodes/media-understanding)
- [Команда location](/uk/nodes/location-command)
