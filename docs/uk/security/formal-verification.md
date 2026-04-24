---
permalink: /security/formal-verification/
read_when:
    - Огляд гарантій або обмежень формальної моделі безпеки
    - Відтворення або оновлення перевірок моделі безпеки TLA+/TLC
summary: Моделі безпеки з машинною перевіркою для шляхів OpenClaw із найвищим ризиком.
title: Формальна верифікація (моделі безпеки)
x-i18n:
    generated_at: "2026-04-24T04:19:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Ця сторінка відстежує **формальні моделі безпеки** OpenClaw (сьогодні TLA+/TLC; за потреби — інші).

> Примітка: деякі старіші посилання можуть посилатися на попередню назву проєкту.

**Мета (орієнтир):** надати аргумент із машинною перевіркою, що OpenClaw забезпечує
задуману політику безпеки (авторизація, ізоляція сесій, gating інструментів і
безпека конфігурації при помилках налаштування) за явно визначених припущень.

**Що це таке (сьогодні):** виконуваний **набір регресійних тестів безпеки**, керований атакувальником:

- Для кожного твердження є виконувана перевірка моделі на скінченному просторі станів.
- Для багатьох тверджень є парна **негативна модель**, яка створює counterexample trace для реалістичного класу помилок.

**Чим це поки не є:** доведенням того, що «OpenClaw безпечний у всіх аспектах» або що повна реалізація TypeScript є коректною.

## Де містяться моделі

Моделі підтримуються в окремому репозиторії: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Важливі застереження

- Це **моделі**, а не повна реалізація TypeScript. Можливий дрейф між моделлю та кодом.
- Результати обмежені простором станів, який досліджує TLC; «зелений» статус не означає безпеку поза змодельованими припущеннями та межами.
- Деякі твердження спираються на явні припущення щодо середовища (наприклад, правильне розгортання, коректні вхідні дані конфігурації).

## Відтворення результатів

Сьогодні результати відтворюються через локальне клонування репозиторію моделей і запуск TLC (див. нижче). У майбутній ітерації можна запропонувати:

- моделі, запущені в CI, з публічними артефактами (counterexample traces, журнали запуску)
- розміщений workflow «запустити цю модель» для невеликих, обмежених перевірок

Початок роботи:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Потрібна Java 11+ (TLC працює на JVM).
# Репозиторій містить зафіксований `tla2tools.jar` (інструменти TLA+) і надає `bin/tlc` + Make targets.

make <target>
```

### Експозиція Gateway і помилкова конфігурація відкритого gateway

**Твердження:** прив’язка поза loopback без auth може уможливити віддалений компроміс / збільшує експозицію; token/password блокує неавторизованих атакувальників (відповідно до припущень моделі).

- Успішні запуски:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Невдалий запуск (очікувано):
  - `make gateway-exposure-v2-negative`

Див. також: `docs/gateway-exposure-matrix.md` у репозиторії моделей.

### Конвеєр exec для node (можливість із найвищим ризиком)

**Твердження:** `exec host=node` вимагає (a) allowlist команд node плюс оголошені команди і (b) live approval, коли це налаштовано; approvals токенізуються, щоб запобігти replay (у моделі).

- Успішні запуски:
  - `make nodes-pipeline`
  - `make approvals-token`
- Невдалі запуски (очікувано):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Сховище pairing (DM gating)

**Твердження:** запити pairing дотримуються TTL і обмежень на кількість pending requests.

- Успішні запуски:
  - `make pairing`
  - `make pairing-cap`
- Невдалі запуски (очікувано):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress gating (mentions + обхід control-command)

**Твердження:** у групових контекстах, де потрібна згадка, неавторизована `control command` не може обійти gating згадок.

- Успішний запуск:
  - `make ingress-gating`
- Невдалий запуск (очікувано):
  - `make ingress-gating-negative`

### Ізоляція routing/session-key

**Твердження:** DM від різних peer не зливаються в одну сесію, якщо це не пов’язано/налаштовано явно.

- Успішний запуск:
  - `make routing-isolation`
- Невдалий запуск (очікувано):
  - `make routing-isolation-negative`

## v1++: додаткові обмежені моделі (конкурентність, повторні спроби, коректність trace)

Це наступні моделі, які підвищують точність щодо реальних режимів відмови (неатомарні оновлення, повторні спроби та fan-out повідомлень).

### Конкурентність / ідемпотентність сховища pairing

**Твердження:** сховище pairing має забезпечувати `MaxPending` та ідемпотентність навіть за interleavings (тобто «check-then-write» має бути атомарним / заблокованим; refresh не повинен створювати дублікати).

Що це означає:

- За конкурентних запитів неможливо перевищити `MaxPending` для каналу.
- Повторні запити/refresh для того самого `(channel, sender)` не повинні створювати дубльовані активні pending rows.

- Успішні запуски:
  - `make pairing-race` (атомарна/заблокована перевірка ліміту)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Невдалі запуски (очікувано):
  - `make pairing-race-negative` (неатомарна гонка ліміту begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Кореляція / ідемпотентність trace для ingress

**Твердження:** ingest має зберігати кореляцію trace при fan-out і бути ідемпотентним за повторних спроб провайдера.

Що це означає:

- Коли одна зовнішня подія стає кількома внутрішніми повідомленнями, кожна частина зберігає ту саму ідентичність trace/event.
- Повторні спроби не призводять до подвійної обробки.
- Якщо provider event IDs відсутні, dedupe переходить на безпечний ключ (наприклад, trace ID), щоб не відкидати різні події.

- Успішні запуски:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Невдалі запуски (очікувано):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Пріоритет dmScope в routing + identityLinks

**Твердження:** routing має типово зберігати ізоляцію DM-сесій і зливати сесії лише за явного налаштування (пріоритет каналу + identity links).

Що це означає:

- Перевизначення dmScope, специфічні для каналу, мають переважати над глобальними значеннями типово.
- identityLinks мають зливати сесії лише в межах явно пов’язаних груп, а не між не пов’язаними peer.

- Успішні запуски:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Невдалі запуски (очікувано):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Пов’язане

- [Модель загроз](/uk/security/THREAT-MODEL-ATLAS)
- [Участь у розробці моделі загроз](/uk/security/CONTRIBUTING-THREAT-MODEL)
