---
read_when:
    - Ви хочете інтерактивно налаштувати облікові дані, пристрої або типові параметри агента
summary: Довідник CLI для `openclaw configure` (інтерактивні запити конфігурації)
title: Налаштування
x-i18n:
    generated_at: "2026-04-24T04:11:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Інтерактивний запит для налаштування облікових даних, пристроїв і типових параметрів агента.

Примітка: розділ **Model** тепер містить мультивибір для allowlist `agents.defaults.models` (що показується в `/model` і в засобі вибору моделі).
Варіанти налаштування в межах провайдера додають вибрані моделі до наявного
allowlist замість того, щоб замінювати не пов’язаних провайдерів, які вже є в конфігурації.

Коли configure запускається з вибору автентифікації провайдера, засоби вибору
моделі за замовчуванням і allowlist автоматично віддають перевагу цьому провайдеру. Для парних провайдерів, таких
як Volcengine/BytePlus, така сама перевага також поширюється на їхні варіанти
плану для кодування (`volcengine-plan/*`, `byteplus-plan/*`). Якщо фільтр
preferred-provider дасть порожній список, configure повертається до нефільтрованого
каталогу замість того, щоб показувати порожній засіб вибору.

Порада: `openclaw config` без підкоманди відкриває той самий майстер. Використовуйте
`openclaw config get|set|unset` для неінтерактивних змін.

Для вебпошуку `openclaw configure --section web` дає змогу вибрати провайдера
і налаштувати його облікові дані. Деякі провайдери також показують додаткові
запити, специфічні для провайдера:

- **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і
  дати змогу вибрати модель `x_search`.
- **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи
  `api.moonshot.cn`) і типову модель вебпошуку Kimi.

Пов’язане:

- Довідник із конфігурації Gateway: [Configuration](/uk/gateway/configuration)
- Config CLI: [Config](/uk/cli/config)

## Параметри

- `--section <section>`: повторюваний фільтр розділів

Доступні розділи:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Примітки:

- Вибір місця, де працює Gateway, завжди оновлює `gateway.mode`. Ви можете вибрати "Продовжити" без інших розділів, якщо вам потрібно лише це.
- Сервіси, орієнтовані на канали (Slack/Discord/Matrix/Microsoft Teams), під час налаштування запитують allowlist каналів/кімнат. Ви можете вводити назви або ID; майстер за можливості перетворює назви на ID.
- Якщо ви запускаєте крок встановлення daemon, автентифікація за токеном потребує токена, а `gateway.auth.token` керується через SecretRef, configure перевіряє SecretRef, але не зберігає розв’язані відкриті значення токена в метаданих середовища служби supervisor.
- Якщо автентифікація за токеном потребує токена, а налаштований SecretRef для токена не розв’язується, configure блокує встановлення daemon і надає практичні вказівки для виправлення.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, configure блокує встановлення daemon, доки режим не буде явно задано.

## Приклади

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Configuration](/uk/gateway/configuration)
