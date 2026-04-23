---
read_when:
    - Реалізація панелі Canvas для macOS
    - Додавання елементів керування агента для візуального workspace
    - Налагодження завантажень Canvas у WKWebView
summary: Панель Canvas під керуванням агента, вбудована через WKWebView + custom URL scheme
title: Canvas
x-i18n:
    generated_at: "2026-04-23T23:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: aac3c051c7acd69939d5de34028eea6bbdf11ca13fd84c4b05cf053b8ba539b4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

Застосунок macOS вбудовує **панель Canvas** під керуванням агента за допомогою `WKWebView`. Це
легкий візуальний workspace для HTML/CSS/JS, A2UI та невеликих інтерактивних
UI-поверхонь.

## Де живе Canvas

Стан Canvas зберігається в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas обслуговує ці файли через **custom URL scheme**:

- `openclaw-canvas://<session>/<path>`

Приклади:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Якщо в корені немає `index.html`, застосунок показує **вбудовану scaffold-сторінку**.

## Поведінка панелі

- Панель без рамки, зі змінним розміром, закріплена біля рядка меню (або курсора миші).
- Запам’ятовує розмір/позицію для кожної сесії.
- Автоматично перезавантажується, коли змінюються локальні файли canvas.
- Одночасно видимою може бути лише одна панель Canvas (за потреби сесія перемикається).

Canvas можна вимкнути в Settings → **Allow Canvas**. Якщо Canvas вимкнено, команди
вузла canvas повертають `CANVAS_DISABLED`.

## Поверхня API агента

Canvas доступний через **Gateway WebSocket**, тому агент може:

- показувати/ховати панель
- переходити за шляхом або URL
- виконувати JavaScript
- захоплювати зображення snapshot

Приклади CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примітки:

- `canvas.navigate` приймає **локальні шляхи canvas**, URL `http(s)` і URL `file://`.
- Якщо передати `"/"`, Canvas покаже локальний scaffold або `index.html`.

## A2UI у Canvas

A2UI розміщується в canvas host Gateway і рендериться всередині панелі Canvas.
Коли Gateway оголошує Canvas host, застосунок macOS автоматично переходить на
сторінку хоста A2UI під час першого відкриття.

Типовий URL хоста A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Команди A2UI (v0.8)

Наразі Canvas приймає повідомлення сервер→клієнт **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) не підтримується.

Приклад CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Швидка перевірка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск агентських прогонів із Canvas

Canvas може запускати нові прогони агента через deep links:

- `openclaw://agent?...`

Приклад (у JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Застосунок запитує підтвердження, якщо не надано дійсний ключ.

## Примітки щодо безпеки

- Схема Canvas блокує обхід каталогів; файли мають розміщуватися в межах кореня сесії.
- Локальний вміст Canvas використовує custom scheme (сервер local loopback не потрібен).
- Зовнішні URL `http(s)` дозволені лише за умови явного переходу до них.
