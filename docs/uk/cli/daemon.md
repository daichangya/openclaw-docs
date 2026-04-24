---
read_when:
    - Ви все ще використовуєте `openclaw daemon ...` у скриптах
    - Вам потрібні команди життєвого циклу служби (install/start/stop/restart/status)
summary: Довідник CLI для `openclaw daemon` (застарілий псевдонім для керування службою Gateway)
title: Демон
x-i18n:
    generated_at: "2026-04-24T04:12:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Застарілий псевдонім для команд керування службою Gateway.

`openclaw daemon ...` зіставляється з тією самою поверхнею керування службою, що й команди служби `openclaw gateway ...`.

## Використання

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Підкоманди

- `status`: показати стан встановлення служби й перевірити справність Gateway
- `install`: встановити службу (`launchd`/`systemd`/`schtasks`)
- `uninstall`: видалити службу
- `start`: запустити службу
- `stop`: зупинити службу
- `restart`: перезапустити службу

## Поширені параметри

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- життєвий цикл (`uninstall|start|stop|restart`): `--json`

Примітки:

- `status` за можливості визначає налаштовані auth SecretRef для автентифікації probe.
- Якщо обов’язковий auth SecretRef не визначається в цьому шляху команди, `daemon status --json` повідомляє `rpc.authWarning`, коли перевірка підключення/автентифікації probe завершується невдачею; явно передайте `--token`/`--password` або спочатку визначте джерело секрету.
- Якщо перевірка probe успішна, попередження про невизначені auth-ref приглушуються, щоб уникнути хибнопозитивних результатів.
- `status --deep` додає найкращу з можливих перевірку служб на системному рівні. Коли вона знаходить інші служби, схожі на gateway, у виводі для людини друкуються підказки щодо очищення й попередження про те, що одна gateway на машину все ще є нормальною рекомендацією.
- У встановленнях Linux systemd перевірки розбіжності токенів у `status` включають обидва джерела модуля: `Environment=` і `EnvironmentFile=`.
- Перевірки розбіжностей визначають SecretRef `gateway.auth.token` за допомогою об’єднаного середовища виконання (спочатку середовище команди служби, потім резервне середовище процесу).
- Якщо автентифікація токеном фактично не активна (явний `gateway.auth.mode` зі значенням `password`/`none`/`trusted-proxy`, або режим не заданий, коли може перемогти пароль і жоден кандидат токена не може мати пріоритет), перевірки розбіжностей токенів пропускають визначення токена з конфігурації.
- Коли автентифікація токеном вимагає токен і `gateway.auth.token` керується через SecretRef, `install` перевіряє, що SecretRef можна визначити, але не зберігає визначений токен у метаданих середовища служби.
- Якщо автентифікація токеном вимагає токен, а налаштований SecretRef токена не визначається, встановлення завершується з безпечним блокуванням.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення блокується, доки режим не буде явно встановлено.
- Якщо ви навмисно запускаєте кілька gateway на одному хості, ізолюйте порти, конфігурацію/стан і робочі простори; див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).

## Рекомендовано

Використовуйте [`openclaw gateway`](/uk/cli/gateway) для актуальної документації та прикладів.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Runbook Gateway](/uk/gateway)
