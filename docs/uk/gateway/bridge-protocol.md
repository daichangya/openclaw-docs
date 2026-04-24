---
read_when:
    - Створення або налагодження клієнтів Node (режим Node на iOS/Android/macOS)
    - Дослідження збоїв сполучення або автентифікації bridge
    - Аудит поверхні Node, яку надає Gateway
summary: 'Історичний bridge protocol (застарілі Nodes): TCP JSONL, сполучення, RPC з областями видимості'
title: Bridge protocol
x-i18n:
    generated_at: "2026-04-24T04:13:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge protocol (застарілий транспорт Node)

<Warning>
TCP bridge було **видалено**. Поточні збірки OpenClaw не постачають listener bridge, а ключі конфігурації `bridge.*` більше не входять до схеми. Цю сторінку збережено лише для історичної довідки. Для всіх клієнтів node/operator використовуйте [Gateway Protocol](/uk/gateway/protocol).
</Warning>

## Навіщо він існував

- **Межа безпеки**: bridge надає невеликий allowlist замість
  повної поверхні API gateway.
- **Сполучення + ідентичність node**: допуск node контролюється gateway і прив’язаний
  до токена окремої node.
- **UX виявлення**: Nodes можуть знаходити gateways через Bonjour у LAN або
  підключатися безпосередньо через tailnet.
- **Loopback WS**: повна площина керування WS залишається локальною, якщо її не тунелювати через SSH.

## Транспорт

- TCP, по одному JSON-об’єкту на рядок (JSONL).
- Необов’язковий TLS (коли `bridge.tls.enabled` має значення true).
- Історичним типовим портом listener був `18790` (поточні збірки не запускають
  TCP bridge).

Коли TLS увімкнено, записи TXT для виявлення містять `bridgeTls=1` плюс
`bridgeTlsSha256` як неприховану підказку. Зверніть увагу, що записи TXT Bonjour/mDNS
не автентифіковані; клієнти не повинні вважати оголошений відбиток
авторитетною прив’язкою без явного наміру користувача або іншої позасмугової перевірки.

## Handshake + сполучення

1. Клієнт надсилає `hello` з метаданими node + токеном (якщо вже виконано сполучення).
2. Якщо сполучення не виконано, gateway відповідає `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Клієнт надсилає `pair-request`.
4. Gateway чекає на схвалення, потім надсилає `pair-ok` і `hello-ok`.

Історично `hello-ok` повертав `serverName` і міг включати
`canvasHostUrl`.

## Фрейми

Клієнт → Gateway:

- `req` / `res`: RPC gateway з областями видимості (chat, sessions, config, health, voicewake, skills.bins)
- `event`: сигнали node (транскрипт voice, запит agent, підписка chat, життєвий цикл exec)

Gateway → Клієнт:

- `invoke` / `invoke-res`: команди node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: оновлення chat для підписаних сесій
- `ping` / `pong`: keepalive

Історичне застосування allowlist містилося в `src/gateway/server-bridge.ts` (видалено).

## Події життєвого циклу Exec

Nodes можуть надсилати події `exec.finished` або `exec.denied`, щоб відображати активність system.run.
Вони зіставляються із системними подіями в gateway. (Застарілі Nodes усе ще можуть надсилати `exec.started`.)

Поля payload (усі необов’язкові, якщо не зазначено інше):

- `sessionKey` (обов’язково): сесія agent, яка має отримати системну подію.
- `runId`: унікальний id exec для групування.
- `command`: необроблений або відформатований рядок команди.
- `exitCode`, `timedOut`, `success`, `output`: деталі завершення (лише для finished).
- `reason`: причина відмови (лише для denied).

## Історичне використання tailnet

- Прив’язати bridge до IP tailnet: `bridge.bind: "tailnet"` у
  `~/.openclaw/openclaw.json` (лише історично; `bridge.*` більше не є валідним).
- Клієнти підключаються через ім’я MagicDNS або IP tailnet.
- Bonjour **не** працює між мережами; за потреби використовуйте ручний host/port або wide-area DNS‑SD.

## Версіонування

Bridge був **неявною v1** (без переговорів щодо min/max). Цей розділ наведено
лише як історичну довідку; поточні клієнти node/operator використовують WebSocket
[Gateway Protocol](/uk/gateway/protocol).

## Пов’язане

- [Gateway protocol](/uk/gateway/protocol)
- [Nodes](/uk/nodes)
