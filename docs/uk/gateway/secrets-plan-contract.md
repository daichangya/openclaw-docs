---
read_when:
    - Генерування або перегляд планів `openclaw secrets apply`
    - Налагодження помилок `Invalid plan target path`
    - Розуміння поведінки валідації типів target і path
summary: 'Контракт для планів `secrets apply`: валідація target, зіставлення path і область дії target для `auth-profiles.json`'
title: Контракт плану Secrets Apply
x-i18n:
    generated_at: "2026-04-05T18:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Контракт плану secrets apply

Ця сторінка визначає строгий контракт, який забезпечується командою `openclaw secrets apply`.

Якщо target не відповідає цим правилам, apply завершується помилкою до внесення змін у конфігурацію.

## Структура файла плану

`openclaw secrets apply --from <plan.json>` очікує масив `targets` із target плану:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Підтримувана область дії target

Target плану приймаються для підтримуваних шляхів облікових даних у:

- [Поверхня облікових даних SecretRef](/reference/secretref-credential-surface)

## Поведінка типів target

Загальне правило:

- `target.type` має бути розпізнаним і має відповідати нормалізованій формі `target.path`.

Псевдоніми сумісності залишаються прийнятними для наявних планів:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Правила валідації path

Кожен target проходить валідацію за всіма такими правилами:

- `type` має бути розпізнаним типом target.
- `path` має бути непорожнім dot-path.
- `pathSegments` можна не вказувати. Якщо його задано, він має нормалізуватися точно до того самого path, що й `path`.
- Заборонені сегменти відхиляються: `__proto__`, `prototype`, `constructor`.
- Нормалізований path має відповідати зареєстрованій формі path для цього типу target.
- Якщо задано `providerId` або `accountId`, воно має відповідати ID, закодованому в path.
- Для target `auth-profiles.json` потрібен `agentId`.
- Під час створення нового зіставлення `auth-profiles.json` включайте `authProfileProvider`.

## Поведінка при помилці

Якщо target не проходить валідацію, apply завершується з помилкою на кшталт:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Для невалідного плану жодні записи не фіксуються.

## Поведінка погодження для exec provider

- `--dry-run` типово пропускає перевірки exec SecretRef.
- Плани, що містять exec SecretRef/provider, відхиляються в режимі запису, якщо не встановлено `--allow-exec`.
- Під час валідації/застосування планів, що містять exec, передавайте `--allow-exec` як у dry-run, так і в командах запису.

## Примітки щодо runtime та області аудиту

- Записи `auth-profiles.json` лише з ref (`keyRef`/`tokenRef`) включаються до runtime-резолюції та області покриття аудиту.
- `secrets apply` записує підтримувані target `openclaw.json`, підтримувані target `auth-profiles.json` і необов’язкові target очищення.

## Перевірки для операторів

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Якщо apply завершується помилкою з повідомленням про невалідний path target, згенеруйте план заново за допомогою `openclaw secrets configure` або виправте path target на одну з підтримуваних форм вище.

## Пов’язана документація

- [Керування секретами](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Поверхня облікових даних SecretRef](/reference/secretref-credential-surface)
- [Довідник із конфігурації](/gateway/configuration-reference)
