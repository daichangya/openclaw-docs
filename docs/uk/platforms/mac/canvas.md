---
read_when:
    - Реалізація панелі Canvas на macOS
    - Додавання елементів керування агента для візуального робочого простору
    - Налагодження завантаження canvas у WKWebView
summary: Панель Canvas під керуванням агента, вбудована через WKWebView і власну схему URL
title: Canvas
x-i18n:
    generated_at: "2026-04-24T04:16:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

Застосунок macOS вбудовує **панель Canvas** під керуванням агента за допомогою `WKWebView`. Це
легкий візуальний робочий простір для HTML/CSS/JS, A2UI та невеликих
інтерактивних UI-поверхонь.

## Де розміщується Canvas

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

- Панель без рамки зі змінним розміром, прив’язана біля рядка меню (або курсора миші).
- Запам’ятовує розмір/позицію для кожної сесії.
- Автоматично перезавантажується, коли змінюються локальні файли canvas.
- Одночасно видима лише одна панель Canvas (за потреби сесія перемикається).

Canvas можна вимкнути в Settings → **Allow Canvas**. Якщо Canvas вимкнено, команди
node для canvas повертають `CANVAS_DISABLED`.

## Поверхня API агента

Canvas доступний через **Gateway WebSocket**, тож агент може:

- показувати/приховувати панель
- переходити до шляху або URL
- виконувати JavaScript
- робити знімок зображення

Приклади CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Примітки:

- `canvas.navigate` приймає **локальні шляхи canvas**, URL `http(s)` і URL `file://`.
- Якщо передати `"/"`, Canvas покаже локальну scaffold-сторінку або `index.html`.

## A2UI у Canvas

A2UI розміщується хостом canvas Gateway і рендериться всередині панелі Canvas.
Коли Gateway оголошує хост Canvas, застосунок macOS автоматично переходить до
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

Швидка smoke-перевірка:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Запуск агентських виконань із Canvas

Canvas може запускати нові виконання агента через deep links:

- `openclaw://agent?...`

Приклад (у JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Застосунок запитує підтвердження, якщо не надано дійсний ключ.

## Примітки щодо безпеки

- Схема Canvas блокує directory traversal; файли мають розміщуватися в корені сесії.
- Локальний вміст Canvas використовує власну схему (сервер local loopback не потрібен).
- Зовнішні URL `http(s)` дозволені лише за явного переходу до них.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [WebChat](/uk/web/webchat)
