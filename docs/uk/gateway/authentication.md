---
read_when:
    - Налагодження auth моделі або завершення строку дії OAuth
    - Документування автентифікації або зберігання облікових даних
summary: 'Автентифікація моделей: OAuth, API ключі та застарілий setup-token Anthropic'
title: Автентифікація
x-i18n:
    generated_at: "2026-04-05T18:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f59ede3fcd7e692ad4132287782a850526acf35474b5bfcea29e0e23610636c2
    source_path: gateway/authentication.md
    workflow: 15
---

# Автентифікація (Провайдери моделей)

<Note>
Ця сторінка описує автентифікацію **провайдера моделей** (API ключі, OAuth і застарілий Anthropic setup-token). Для автентифікації **підключення gateway** (token, password, trusted-proxy) див. [Configuration](/gateway/configuration) і [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw підтримує OAuth і API ключі для провайдерів моделей. Для постійно
увімкнених хостів gateway API ключі зазвичай є найбільш передбачуваним варіантом. Потоки
передплати/OAuth також підтримуються, коли вони відповідають моделі облікового запису вашого провайдера.

Див. [/concepts/oauth](/concepts/oauth) для повного потоку OAuth і структури
зберігання.
Для auth на основі SecretRef (providers `env`/`file`/`exec`) див. [Secrets Management](/gateway/secrets).
Для правил допустимості облікових даних/кодів причин, які використовує `models status --probe`, див.
[Auth Credential Semantics](/auth-credential-semantics).

## Рекомендоване налаштування (API ключ, будь-який провайдер)

Якщо ви запускаєте довготривалий gateway, почніть з API ключа для обраного
провайдера.
Зокрема для Anthropic auth через API ключ є безпечним шляхом. Auth Anthropic у стилі
передплати всередині OpenClaw — це застарілий шлях setup-token, і його
слід розглядати як шлях **Extra Usage**, а не як шлях лімітів плану.

1. Створіть API ключ у консолі вашого провайдера.
2. Розмістіть його на **хості gateway** (машині, де виконується `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Якщо Gateway працює під systemd/launchd, краще додати ключ у
   `~/.openclaw/.env`, щоб демон міг його прочитати:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Потім перезапустіть демон (або перезапустіть процес Gateway) і повторно перевірте:

```bash
openclaw models status
openclaw doctor
```

Якщо ви не хочете самостійно керувати env vars, onboarding може зберігати
API ключі для використання демоном: `openclaw onboard`.

Див. [Help](/help) для подробиць про успадкування env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: сумісність із застарілим токеном

Auth через setup-token Anthropic все ще доступна в OpenClaw як
застарілий/ручний шлях. Публічна документація Anthropic для Claude Code все ще описує пряме використання
Claude Code у терміналі в межах планів Claude, але Anthropic окремо повідомив користувачам
OpenClaw, що шлях входу Claude в **OpenClaw** вважається використанням стороннього
harness і вимагає **Extra Usage**, що оплачується окремо від
передплати.

Для найзрозумілішого шляху налаштування використовуйте API ключ Anthropic. Якщо вам потрібно зберегти
шлях Anthropic у стилі передплати в OpenClaw, використовуйте застарілий шлях setup-token
з очікуванням, що Anthropic розглядатиме це як **Extra Usage**.

Ручне введення токена (будь-який провайдер; записує `auth-profiles.json` + оновлює config):

```bash
openclaw models auth paste-token --provider openrouter
```

Також підтримуються посилання на auth profile для статичних облікових даних:

- облікові дані `api_key` можуть використовувати `keyRef: { source, provider, id }`
- облікові дані `token` можуть використовувати `tokenRef: { source, provider, id }`
- Профілі в режимі OAuth не підтримують облікові дані SecretRef; якщо `auth.profiles.<id>.mode` встановлено в `"oauth"`, вхідні `keyRef`/`tokenRef` на основі SecretRef для цього профілю відхиляються.

Перевірка, зручна для автоматизації (код виходу `1`, якщо строк дії завершився/відсутній, `2`, якщо строк дії скоро завершиться):

```bash
openclaw models status --check
```

Live probes auth:

```bash
openclaw models status --probe
```

Примітки:

- Рядки probe можуть походити з auth profiles, облікових даних env або `models.json`.
- Якщо явний `auth.order.<provider>` пропускає збережений profile, probe повідомляє
  `excluded_by_auth_order` для цього profile замість спроби його використати.
- Якщо auth існує, але OpenClaw не може визначити кандидата моделі для probe для
  цього провайдера, probe повідомляє `status: no_model`.
- Cooldown через rate limit можуть бути прив’язані до моделі. Profile у cooldown для однієї
  моделі все ще може бути придатним для спорідненої моделі того самого провайдера.

Необов’язкові scripts для ops (systemd/Termux) описані тут:
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Примітка щодо Anthropic

Backend Anthropic `claude-cli` було видалено.

- Використовуйте API ключі Anthropic для трафіку Anthropic в OpenClaw.
- Setup-token Anthropic залишається застарілим/ручним шляхом і має використовуватися з
  очікуванням білінгу Extra Usage, про який Anthropic повідомив користувачам OpenClaw.
- `openclaw doctor` тепер виявляє застарілий видалений стан Anthropic Claude CLI. Якщо
  байти збережених облікових даних усе ще існують, doctor перетворює їх назад у
  профілі Anthropic token/OAuth. Якщо ні, doctor видаляє застарілу конфігурацію Claude CLI
  і вказує вам на відновлення через API ключ або setup-token.

## Перевірка стану auth моделі

```bash
openclaw models status
openclaw doctor
```

## Поведінка ротації API ключів (gateway)

Деякі провайдери підтримують повторну спробу запиту з альтернативними ключами, коли виклик API
натрапляє на rate limit провайдера.

- Порядок пріоритету:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (одне перевизначення)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Провайдери Google також включають `GOOGLE_API_KEY` як додатковий fallback.
- Той самий список ключів дедуплікується перед використанням.
- OpenClaw повторює спробу з наступним ключем лише для помилок rate limit (наприклад
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` або
  `workers_ai ... quota limit exceeded`).
- Помилки, не пов’язані з rate limit, не повторюються з альтернативними ключами.
- Якщо всі ключі не спрацювали, повертається фінальна помилка з останньої спроби.

## Керування тим, які облікові дані використовуються

### Для сесії (команда чату)

Використовуйте `/model <alias-or-id>@<profileId>`, щоб закріпити конкретні облікові дані провайдера для поточної сесії (приклади id профілів: `anthropic:default`, `anthropic:work`).

Використовуйте `/model` (або `/model list`) для компактного вибору; використовуйте `/model status` для повного перегляду (кандидати + наступний auth profile, а також подробиці endpoint провайдера, якщо налаштовано).

### Для агента (перевизначення CLI)

Установіть явне перевизначення порядку auth profile для агента (зберігається в `auth-profiles.json` цього агента):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Використовуйте `--agent <id>`, щоб націлитися на конкретного агента; не вказуйте його, щоб використати налаштованого агента за замовчуванням.
Коли ви налагоджуєте проблеми з порядком, `openclaw models status --probe` показує пропущені
збережені profiles як `excluded_by_auth_order` замість того, щоб мовчки їх пропускати.
Коли ви налагоджуєте проблеми з cooldown, пам’ятайте, що cooldown через rate limit можуть бути прив’язані
до одного id моделі, а не до всього profile провайдера.

## Усунення несправностей

### "No credentials found"

Якщо profile Anthropic відсутній, налаштуйте API ключ Anthropic на
**хості gateway** або налаштуйте застарілий шлях setup-token Anthropic, а потім повторно перевірте:

```bash
openclaw models status
```

### Термін дії токена спливає/сплив

Запустіть `openclaw models status`, щоб підтвердити, у якого profile спливає строк дії. Якщо застарілий
profile токена Anthropic відсутній або строк його дії завершився, оновіть це налаштування через
setup-token або перейдіть на API ключ Anthropic.

Якщо на машині все ще є застарілий видалений стан Anthropic Claude CLI зі старіших
збірок, запустіть:

```bash
openclaw doctor --yes
```

Doctor перетворює `anthropic:claude-cli` назад на Anthropic token/OAuth, якщо
збережені байти облікових даних усе ще існують. Інакше він видаляє застарілі
посилання на profile/config/model Claude CLI і залишає вказівки щодо наступних кроків.
