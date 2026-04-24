---
read_when:
    - Налагодження автентифікації моделі або завершення строку дії OAuth
    - Документування автентифікації або зберігання облікових даних
summary: 'Автентифікація моделей: OAuth, API-ключі, повторне використання Claude CLI та setup-token Anthropic'
title: Автентифікація
x-i18n:
    generated_at: "2026-04-24T03:16:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Автентифікація (провайдери моделей)

<Note>
Ця сторінка охоплює автентифікацію **провайдерів моделей** (API-ключі, OAuth, повторне використання Claude CLI та setup-token Anthropic). Для автентифікації **підключення до gateway** (токен, пароль, trusted-proxy) див. [Configuration](/uk/gateway/configuration) і [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth).
</Note>

OpenClaw підтримує OAuth і API-ключі для провайдерів моделей. Для gateway-хостів,
що працюють постійно, API-ключі зазвичай є найпередбачуванішим варіантом. Потоки
підписки/OAuth також підтримуються, коли вони відповідають моделі облікового запису вашого провайдера.

Див. [/concepts/oauth](/uk/concepts/oauth) для повного опису потоку OAuth і
схеми зберігання.
Для автентифікації на основі SecretRef (провайдери `env`/`file`/`exec`) див. [Secrets Management](/uk/gateway/secrets).
Для правил допустимості облікових даних/кодів причин, які використовує `models status --probe`, див.
[Auth Credential Semantics](/uk/auth-credential-semantics).

## Рекомендоване налаштування (API-ключ, будь-який провайдер)

Якщо ви запускаєте довготривалий gateway, почніть з API-ключа для вибраного
провайдера.
Для Anthropic зокрема автентифікація через API-ключ усе ще є найпередбачуванішим серверним
налаштуванням, але OpenClaw також підтримує повторне використання локального входу Claude CLI.

1. Створіть API-ключ у консолі вашого провайдера.
2. Розмістіть його на **gateway-хості** (машині, на якій виконується `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Якщо Gateway працює під systemd/launchd, краще розмістити ключ у
   `~/.openclaw/.env`, щоб демон міг його прочитати:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Потім перезапустіть демон (або перезапустіть ваш процес Gateway) і перевірте знову:

```bash
openclaw models status
openclaw doctor
```

Якщо ви не хочете самостійно керувати env vars, онбординг може зберігати
API-ключі для використання демоном: `openclaw onboard`.

Деталі щодо успадкування env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) див. у [Help](/uk/help).

## Anthropic: Claude CLI і сумісність токенів

Автентифікація через setup-token Anthropic усе ще доступна в OpenClaw як підтримуваний
шлях токена. Відтоді співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене,
тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо на хості доступне
повторне використання Claude CLI, тепер це є пріоритетним шляхом.

Для довготривалих gateway-хостів API-ключ Anthropic усе ще залишається найпередбачуванішим
налаштуванням. Якщо ви хочете повторно використати наявний вхід Claude на цьому самому хості, використовуйте
шлях Anthropic Claude CLI в onboarding/configure.

Рекомендоване налаштування хоста для повторного використання Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Це двоетапне налаштування:

1. Увійдіть у Claude Code в Anthropic на gateway-хості.
2. Скажіть OpenClaw перемкнути вибір моделей Anthropic на локальний бекенд `claude-cli`
   і зберегти відповідний профіль автентифікації OpenClaw.

Якщо `claude` відсутній у `PATH`, або спочатку встановіть Claude Code, або задайте
`agents.defaults.cliBackends.claude-cli.command` на фактичний шлях до бінарника.

Ручне введення токена (будь-який провайдер; записує `auth-profiles.json` + оновлює config):

```bash
openclaw models auth paste-token --provider openrouter
```

Також підтримуються посилання на профілі автентифікації для статичних облікових даних:

- облікові дані `api_key` можуть використовувати `keyRef: { source, provider, id }`
- облікові дані `token` можуть використовувати `tokenRef: { source, provider, id }`
- Профілі в режимі OAuth не підтримують облікові дані SecretRef; якщо для `auth.profiles.<id>.mode` встановлено `"oauth"`, введення `keyRef`/`tokenRef` на основі SecretRef для цього профілю відхиляється.

Перевірка, зручна для автоматизації (вихід `1`, якщо строк дії минув/відсутній, `2`, якщо строк дії завершується):

```bash
openclaw models status --check
```

Живі перевірки автентифікації:

```bash
openclaw models status --probe
```

Примітки:

- Рядки probe можуть надходити з профілів автентифікації, env-облікових даних або `models.json`.
- Якщо явний `auth.order.<provider>` пропускає збережений профіль, probe повідомляє
  `excluded_by_auth_order` для цього профілю замість спроби його використати.
- Якщо автентифікація існує, але OpenClaw не може визначити придатного кандидата моделі для probe для
  цього провайдера, probe повідомляє `status: no_model`.
- Відкат після rate limit може бути прив’язаний до моделі. Профіль, що перебуває в cooldown для однієї
  моделі, усе ще може бути придатним для сусідньої моделі того самого провайдера.

Додаткові op-скрипти (systemd/Termux) задокументовано тут:
[Скрипти моніторингу автентифікації](/uk/help/scripts#auth-monitoring-scripts)

## Примітка щодо Anthropic

Бекенд Anthropic `claude-cli` знову підтримується.

- Співробітники Anthropic повідомили нам, що цей шлях інтеграції OpenClaw знову дозволений.
- Тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p`
  санкціонованими для запусків на базі Anthropic, якщо Anthropic не опублікує нову політику.
- API-ключі Anthropic залишаються найпередбачуванішим вибором для довготривалих gateway-
  хостів і явного керування білінгом на стороні сервера.

## Перевірка статусу автентифікації моделі

```bash
openclaw models status
openclaw doctor
```

## Поведінка ротації API-ключів (gateway)

Деякі провайдери підтримують повторну спробу запиту з альтернативними ключами, коли API-виклик
натрапляє на rate limit провайдера.

- Порядок пріоритету:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне перевизначення)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Провайдери Google також включають `GOOGLE_API_KEY` як додатковий fallback.
- Той самий список ключів дедуплікується перед використанням.
- OpenClaw виконує повторну спробу з наступним ключем лише для помилок rate limit (наприклад,
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` або
  `workers_ai ... quota limit exceeded`).
- Для помилок, не пов’язаних із rate limit, повторна спроба з альтернативними ключами не виконується.
- Якщо всі ключі завершуються помилкою, повертається фінальна помилка з останньої спроби.

## Керування тим, які облікові дані використовуються

### Для сесії (команда чату)

Використовуйте `/model <alias-or-id>@<profileId>`, щоб закріпити конкретні облікові дані провайдера для поточної сесії (приклади id профілів: `anthropic:default`, `anthropic:work`).

Використовуйте `/model` (або `/model list`) для компактного вибору; використовуйте `/model status` для повного подання (кандидати + наступний профіль автентифікації, а також деталі endpoint провайдера, якщо їх налаштовано).

### Для агента (перевизначення CLI)

Установіть явне перевизначення порядку профілів автентифікації для агента (зберігається в `auth-state.json` цього агента):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Використовуйте `--agent <id>`, щоб націлитися на конкретного агента; не вказуйте його, щоб використати налаштованого типового агента.
Під час налагодження проблем із порядком `openclaw models status --probe` показує пропущені
збережені профілі як `excluded_by_auth_order`, а не тихо їх ігнорує.
Під час налагодження проблем із cooldown пам’ятайте, що cooldown через rate limit може бути прив’язаний
до одного id моделі, а не до всього профілю провайдера.

## Усунення несправностей

### "No credentials found"

Якщо профіль Anthropic відсутній, налаштуйте API-ключ Anthropic на
**gateway-хості** або налаштуйте шлях setup-token Anthropic, а потім перевірте знову:

```bash
openclaw models status
```

### Строк дії токена завершується/минув

Запустіть `openclaw models status`, щоб підтвердити, у якого профілю завершується строк дії. Якщо
профіль токена Anthropic відсутній або строк його дії минув, оновіть це налаштування через
setup-token або перейдіть на API-ключ Anthropic.

## Пов’язане

- [Керування секретами](/uk/gateway/secrets)
- [Віддалений доступ](/uk/gateway/remote)
- [Зберігання автентифікації](/uk/concepts/oauth)
