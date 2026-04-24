---
read_when:
    - Оновлення UI налаштувань Skills у macOS
    - Зміна gating або поведінки встановлення Skills
summary: UI налаштувань Skills у macOS і статус із підтримкою Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T04:17:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

Застосунок macOS показує Skills OpenClaw через gateway; локально він Skills не розбирає.

## Джерело даних

- `skills.status` (gateway) повертає всі Skills разом із придатністю та відсутніми вимогами
  (включно з блокуваннями allowlist для вбудованих Skills).
- Вимоги виводяться з `metadata.openclaw.requires` у кожному `SKILL.md`.

## Дії встановлення

- `metadata.openclaw.install` визначає варіанти встановлення (brew/node/go/uv).
- Застосунок викликає `skills.install` для запуску інсталяторів на хості gateway.
- Вбудовані findings `critical` для dangerous-code типово блокують `skills.install`; findings рівня suspicious і далі лише попереджають. Небезпечне перевизначення існує в запиті gateway, але типовий потік застосунку залишається fail-closed.
- Якщо кожен варіант встановлення має значення `download`, gateway показує всі
  варіанти завантаження.
- Інакше gateway вибирає один пріоритетний інсталятор на основі поточних
  налаштувань встановлення та наявних двійкових файлів хоста: спочатку Homebrew, якщо
  увімкнено `skills.install.preferBrew` і існує `brew`, потім `uv`, потім
  налаштований менеджер node з `skills.install.nodeManager`, а далі резервні
  варіанти на кшталт `go` або `download`.
- Назви варіантів встановлення для Node відображають налаштований менеджер node, включно з `yarn`.

## Env/API-ключі

- Застосунок зберігає ключі в `~/.openclaw/openclaw.json` у `skills.entries.<skillKey>`.
- `skills.update` вносить зміни до `enabled`, `apiKey` і `env`.

## Віддалений режим

- Встановлення та оновлення конфігурації відбуваються на хості gateway (а не на локальному Mac).

## Пов’язане

- [Skills](/uk/tools/skills)
- [Застосунок для macOS](/uk/platforms/macos)
