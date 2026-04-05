---
read_when:
    - Реалізація панелі Canvas у macOS-застосунку
    - Додавання елементів керування агента для візуального робочого простору
    - Налагодження завантажень canvas у WKWebView
summary: Керована агентом панель Canvas, вбудована через WKWebView + власну схему URL
title: Canvas
x-i18n:
    generated_at: "2026-04-05T18:10:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (macOS-застосунок)

Застосунок macOS вбудовує керовану агентом **панель Canvas** через `WKWebView`. Це
легковаговий візуальний робочий простір для HTML/CSS/JS, A2UI та невеликих
інтерактивних UI-поверхонь.

## Де зберігається Canvas

Стан Canvas зберігається в Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Панель Canvas обслуговує ці файли через **власну схему URL**:

- `openclaw-canvas://<session>/<path>`

Приклади:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Якщо в корені немає `index.html`, застосунок показує **вбудовану scaffold-сторінку**.

## Поведінка панелі

- Панель без рамки зі змінюваним розміром, закріплена біля рядка меню (або курсора миші).
- Запам’ятовує розмір/позицію для кожної сесії.
- Автоматично перезавантажується, коли змінюються локальні файли canvas.
- Одночасно видно лише одну панель Canvas (за потреби перемикається сесія).

Canvas можна вимкнути в Settings → **Allow Canvas**. Якщо його вимкнено, canvas-команди
node повертають `CANVAS_DISABLED`.

## Поверхня API для агента

Canvas доступний через **Gateway WebSocket**, тож агент може:

- показувати/ховати панель
- переходити до шляху або URL
- виконувати JavaScript
- захоплювати знімок зображення

Приклади CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примітки:

- `canvas.navigate` приймає **локальні шляхи canvas**, URL `http(s)` і URL `file://`.
- Якщо ви передаєте `"/"`, Canvas показує локальний scaffold або `index.html`.

## A2UI у Canvas

A2UI хоститься через canvas host Gateway і рендериться всередині панелі Canvas.
Коли Gateway оголошує Canvas host, macOS-застосунок автоматично переходить до
сторінки хоста A2UI під час першого відкриття.

Типовий URL хоста A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Команди A2UI (v0.8)

Наразі Canvas приймає повідомлення server→client **A2UI v0.8**:

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

Швидкий smoke-тест:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск agent runs із Canvas

Canvas може запускати нові запуски агента через deep links:

- `openclaw://agent?...`

Приклад (у JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Застосунок запитує підтвердження, якщо не надано дійсний ключ.

## Примітки щодо безпеки

- Схема Canvas блокує directory traversal; файли мають знаходитися в корені сесії.
- Локальний вміст Canvas використовує власну схему (сервер loopback не потрібен).
- Зовнішні URL `http(s)` дозволені лише за явної навігації до них.
