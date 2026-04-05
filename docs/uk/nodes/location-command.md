---
read_when:
    - Додавання підтримки location для node або UI дозволів
    - Проєктування дозволів location або поведінки переднього плану на Android
summary: Команда location для nodes (`location.get`), режими дозволів і поведінка Android на передньому плані
title: Команда Location
x-i18n:
    generated_at: "2026-04-05T18:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Команда Location (nodes)

## TL;DR

- `location.get` — це команда node (через `node.invoke`).
- За замовчуванням вимкнена.
- У налаштуваннях застосунку Android використовується селектор: Off / While Using.
- Окремий перемикач: Precise Location.

## Чому селектор, а не просто перемикач

Дозволи ОС мають кілька рівнів. Ми можемо показати селектор у застосунку, але фактичний рівень дозволу все одно визначає ОС.

- iOS/macOS можуть показувати **While Using** або **Always** у системних prompt/Settings.
- Застосунок Android наразі підтримує лише location на передньому плані.
- Precise location — це окремий дозвіл (iOS 14+ “Precise”, Android “fine” проти “coarse”).

Селектор в UI визначає запитуваний нами режим; фактичний дозвіл живе в налаштуваннях ОС.

## Модель налаштувань

Для кожного пристрою node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Поведінка UI:

- Вибір `whileUsing` запитує дозвіл на використання на передньому плані.
- Якщо ОС відхиляє запитаний рівень, повернутися до найвищого наданого рівня й показати статус.

## Відображення дозволів (`node.permissions`)

Необов’язково. Node macOS повідомляє `location` через карту дозволів; iOS/Android можуть його пропускати.

## Команда: `location.get`

Викликається через `node.invoke`.

Параметри (рекомендовані):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload відповіді:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Помилки (стабільні коди):

- `LOCATION_DISABLED`: селектор вимкнено.
- `LOCATION_PERMISSION_REQUIRED`: відсутній дозвіл для запитаного режиму.
- `LOCATION_BACKGROUND_UNAVAILABLE`: застосунок у фоновому режимі, але дозволено лише While Using.
- `LOCATION_TIMEOUT`: не вдалося отримати фіксацію вчасно.
- `LOCATION_UNAVAILABLE`: збій системи / немає доступних providers.

## Поведінка у фоновому режимі

- Застосунок Android відхиляє `location.get`, коли перебуває у фоновому режимі.
- Тримайте OpenClaw відкритим, коли запитуєте location на Android.
- На інших платформах node поведінка може відрізнятися.

## Інтеграція з моделлю/інструментами

- Поверхня інструментів: інструмент `nodes` додає дію `location_get` (потрібен node).
- CLI: `openclaw nodes location get --node <id>`.
- Рекомендації для агента: викликайте лише тоді, коли користувач увімкнув location і розуміє межі доступу.

## Текст для UX (рекомендовано)

- Off: “Надання location вимкнено.”
- While Using: “Лише коли OpenClaw відкритий.”
- Precise: “Використовувати точну GPS location. Вимкніть, щоб ділитися приблизною location.”
