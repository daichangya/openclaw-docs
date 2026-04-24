---
read_when:
    - Налагодження або налаштування доступу до WebChat
summary: Статичний хост Loopback WebChat і використання Gateway WS для UI чату
title: WebChat
x-i18n:
    generated_at: "2026-04-24T04:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Статус: SwiftUI UI чату для macOS/iOS напряму взаємодіє з Gateway WebSocket.

## Що це таке

- Нативний UI чату для gateway (без вбудованого браузера та без локального статичного сервера).
- Використовує ті самі сесії та правила маршрутизації, що й інші канали.
- Детермінована маршрутизація: відповіді завжди повертаються до WebChat.

## Швидкий старт

1. Запустіть gateway.
2. Відкрийте UI WebChat (застосунок macOS/iOS) або вкладку чату в Control UI.
3. Переконайтеся, що налаштовано коректний шлях автентифікації gateway (типово shared-secret,
   навіть на loopback).

## Як це працює (поведінка)

- UI підключається до Gateway WebSocket і використовує `chat.history`, `chat.send` та `chat.inject`.
- `chat.history` обмежується для стабільності: Gateway може обрізати довгі текстові поля, пропускати важкі метадані та замінювати надмірно великі записи на `[chat.history omitted: message too large]`.
- `chat.history` також нормалізується для відображення: вбудовані теги директив
  доставки, такі як `[[reply_to_*]]` і `[[audio_as_voice]]`, XML-пейлоади
  викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), а також
  модельні токени керування ASCII/full-width, що просочилися, прибираються з видимого тексту,
  а записи асистента, весь видимий текст яких складається лише з точного
  тихого токена `NO_REPLY` / `no_reply`, пропускаються.
- `chat.inject` безпосередньо додає примітку асистента до transcript і транслює її до UI (без запуску агента).
- Перервані запуски можуть залишати частковий вивід асистента видимим в UI.
- Gateway зберігає перерваний частковий текст асистента в історії transcript, коли існує буферизований вивід, і позначає ці записи метаданими переривання.
- Історія завжди отримується з gateway (без локального стеження за файлами).
- Якщо gateway недоступний, WebChat працює лише для читання.

## Панель інструментів агентів у Control UI

- Панель Tools у `/agents` Control UI має два окремі подання:
  - **Available Right Now** використовує `tools.effective(sessionKey=...)` і показує, чим поточна
    сесія реально може користуватися під час виконання, зокрема core, Plugin і channel-owned інструментами.
  - **Tool Configuration** використовує `tools.catalog` і залишається зосередженим на профілях, перевизначеннях і
    семантиці каталогу.
- Доступність під час виконання прив’язана до сесії. Перемикання сесій на тому самому агенті може змінити
  список **Available Right Now**.
- Редактор конфігурації не означає доступність під час виконання; фактичний доступ і далі підпорядковується
  пріоритету політик (`allow`/`deny`, перевизначенням для конкретного агента та провайдера/каналу).

## Віддалене використання

- Віддалений режим тунелює Gateway WebSocket через SSH/Tailscale.
- Вам не потрібно запускати окремий сервер WebChat.

## Довідник із конфігурації (WebChat)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри WebChat:

- `gateway.webchat.chatHistoryMaxChars`: максимальна кількість символів для текстових полів у відповідях `chat.history`. Коли запис transcript перевищує це обмеження, Gateway обрізає довгі текстові поля й може замінити надмірно великі повідомлення заповнювачем. Клієнт також може надіслати `maxChars` для окремого запиту, щоб перевизначити це типове значення для одного виклику `chat.history`.

Пов’язані глобальні параметри:

- `gateway.port`, `gateway.bind`: хост/порт WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  автентифікація WebSocket через shared-secret.
- `gateway.auth.allowTailscale`: вкладка чату браузерного Control UI може використовувати заголовки ідентичності Tailscale
  Serve, коли це ввімкнено.
- `gateway.auth.mode: "trusted-proxy"`: автентифікація reverse-proxy для браузерних клієнтів за identity-aware **non-loopback** джерелом proxy (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: ціль віддаленого gateway.
- `session.*`: сховище сесій і типові значення main key.

## Пов’язане

- [Control UI](/uk/web/control-ui)
- [Dashboard](/uk/web/dashboard)
