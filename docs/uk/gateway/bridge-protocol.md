---
read_when:
    - Створення або налагодження клієнтів вузлів (режим вузла iOS/Android/macOS)
    - Дослідження збоїв парування або автентифікації bridge
    - Аудит поверхні вузла, яку відкриває gateway
summary: 'Історичний bridge protocol (legacy nodes): TCP JSONL, парування, scoped RPC'
title: Bridge Protocol
x-i18n:
    generated_at: "2026-04-05T18:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge protocol (legacy node transport)

<Warning>
TCP bridge було **видалено**. Поточні збірки OpenClaw не постачають listener bridge, а ключі конфігурації `bridge.*` більше не входять до схеми. Цю сторінку збережено лише для історичної довідки. Для всіх клієнтів вузлів/операторів використовуйте [Gateway Protocol](/gateway/protocol).
</Warning>

## Чому він існував

- **Межа безпеки**: bridge відкриває невеликий список дозволених можливостей замість
  повної поверхні API gateway.
- **Парування й ідентичність вузла**: допуск вузлів належить gateway і прив’язаний
  до токена для кожного вузла.
- **UX виявлення**: вузли можуть виявляти gateway через Bonjour у LAN або підключатися
  напряму через tailnet.
- **Loopback WS**: повна control plane WS залишається локальною, якщо її не тунелювати через SSH.

## Транспорт

- TCP, по одному JSON-об’єкту на рядок (JSONL).
- Необов’язковий TLS (коли `bridge.tls.enabled` має значення true).
- Історичним типовим портом listener був `18790` (поточні збірки не запускають
  TCP bridge).

Коли TLS увімкнено, записи discovery TXT включають `bridgeTls=1` і
`bridgeTlsSha256` як несекретну підказку. Зверніть увагу, що записи Bonjour/mDNS TXT неавтентифіковані; клієнти не повинні трактувати оголошений fingerprint як
авторитетний pin без явного наміру користувача або іншої позасмугової перевірки.

## Рукостискання й парування

1. Клієнт надсилає `hello` із метаданими вузла + токеном (якщо вже спарено).
2. Якщо не спарено, gateway відповідає `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Клієнт надсилає `pair-request`.
4. Gateway чекає на схвалення, потім надсилає `pair-ok` і `hello-ok`.

Історично `hello-ok` повертав `serverName` і міг також включати
`canvasHostUrl`.

## Кадри

Клієнт → Gateway:

- `req` / `res`: scoped RPC gateway (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: сигнали вузла (`voice transcript`, запит агента, підписка на чат, життєвий цикл exec)

Gateway → Клієнт:

- `invoke` / `invoke-res`: команди вузла (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: оновлення чату для підписаних сесій
- `ping` / `pong`: keepalive

Історично застосування списку дозволених можливостей містилося в `src/gateway/server-bridge.ts` (видалено).

## Події життєвого циклу Exec

Вузли можуть надсилати події `exec.finished` або `exec.denied`, щоб відображати активність system.run.
Вони зіставляються із системними подіями в gateway. (Legacy nodes все ще можуть надсилати `exec.started`.)

Поля payload (усі необов’язкові, якщо не зазначено інше):

- `sessionKey` (обов’язкове): сесія агента, яка має отримати системну подію.
- `runId`: унікальний id exec для групування.
- `command`: сирий або відформатований рядок команди.
- `exitCode`, `timedOut`, `success`, `output`: деталі завершення (лише для finished).
- `reason`: причина відмови (лише для denied).

## Історичне використання tailnet

- Прив’язати bridge до IP tailnet: `bridge.bind: "tailnet"` у
  `~/.openclaw/openclaw.json` (лише історично; `bridge.*` більше не є коректним).
- Клієнти підключаються через ім’я MagicDNS або IP tailnet.
- Bonjour **не** працює між мережами; за потреби використовуйте ручний host/port або wide-area DNS‑SD.

## Версіонування

Bridge був **неявною v1** (без узгодження min/max). Цей розділ є
лише історичною довідкою; поточні клієнти вузлів/операторів використовують WebSocket
[Gateway Protocol](/gateway/protocol).
