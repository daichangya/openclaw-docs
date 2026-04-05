---
read_when:
    - Інтеграція mac app із життєвим циклом gateway
summary: Життєвий цикл Gateway на macOS (launchd)
title: Життєвий цикл Gateway
x-i18n:
    generated_at: "2026-04-05T18:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Життєвий цикл Gateway на macOS

Застосунок macOS **керує Gateway через launchd** за замовчуванням і не запускає
Gateway як дочірній процес. Спочатку він намагається під’єднатися до вже запущеного
Gateway на налаштованому порту; якщо жоден недоступний, він вмикає сервіс launchd
через зовнішній CLI `openclaw` (без вбудованого runtime). Це забезпечує
надійний автозапуск при вході в систему та перезапуск після збоїв.

Режим дочірнього процесу (коли Gateway запускається безпосередньо застосунком) **сьогодні не використовується**.
Якщо вам потрібні тісніший зв’язок з UI, запускайте Gateway вручну в терміналі.

## Поведінка за замовчуванням (launchd)

- Застосунок установлює LaunchAgent для кожного користувача з міткою `ai.openclaw.gateway`
  (або `ai.openclaw.<profile>` при використанні `--profile`/`OPENCLAW_PROFILE`; застарілий `com.openclaw.*` підтримується).
- Коли увімкнено Local mode, застосунок гарантує, що LaunchAgent завантажено, і
  запускає Gateway за потреби.
- Логи записуються в шлях до журналу launchd gateway (видимий у Debug Settings).

Поширені команди:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Замініть мітку на `ai.openclaw.<profile>`, якщо використовуєте іменований profile.

## Непідписані dev-збірки

`scripts/restart-mac.sh --no-sign` призначений для швидких локальних збірок, коли у вас немає
ключів підпису. Щоб launchd не вказував на непідписаний relay binary, він:

- Записує `~/.openclaw/disable-launchagent`.

Підписані запуски `scripts/restart-mac.sh` очищають це перевизначення, якщо marker
присутній. Для ручного скидання:

```bash
rm ~/.openclaw/disable-launchagent
```

## Режим лише під’єднання

Щоб змусити застосунок macOS **ніколи не встановлювати й не керувати launchd**, запускайте його з
`--attach-only` (або `--no-launchd`). Це встановлює `~/.openclaw/disable-launchagent`,
тому застосунок лише під’єднується до вже запущеного Gateway. Таку саму
поведінку можна перемикати в Debug Settings.

## Remote mode

Remote mode ніколи не запускає локальний Gateway. Застосунок використовує SSH tunnel до
віддаленого хоста й підключається через цей tunnel.

## Чому ми віддаємо перевагу launchd

- Автозапуск під час входу в систему.
- Вбудована семантика перезапуску/KeepAlive.
- Передбачувані логи й нагляд.

Якщо колись знову знадобиться справжній режим дочірнього процесу, його слід документувати як
окремий явний режим лише для dev.
