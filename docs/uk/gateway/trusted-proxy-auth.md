---
read_when:
    - Запуск OpenClaw за identity-aware проксі
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Усунення помилок WebSocket 1008 unauthorized у конфігураціях зі зворотним проксі
    - Визначення, де встановлювати HSTS та інші заголовки посилення захисту HTTP
summary: Делегуйте автентифікацію Gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація через довірений проксі
x-i18n:
    generated_at: "2026-04-23T07:12:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Автентифікація через довірений проксі

> ⚠️ **Функція, чутлива до безпеки.** У цьому режимі автентифікація повністю делегується вашому зворотному проксі. Неправильне налаштування може відкрити ваш Gateway для несанкціонованого доступу. Уважно прочитайте цю сторінку перед увімкненням.

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, коли:

- ви запускаєте OpenClaw за **identity-aware проксі** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- ваш проксі виконує всю автентифікацію і передає ідентичність користувача через заголовки
- ви працюєте в Kubernetes або контейнерному середовищі, де проксі є єдиним шляхом до Gateway
- ви стикаєтеся з помилками WebSocket `1008 unauthorized`, оскільки браузери не можуть передавати токени в payload WS

## Коли НЕ використовувати

- якщо ваш проксі не автентифікує користувачів (лише завершує TLS або є балансувальником навантаження)
- якщо існує будь-який шлях до Gateway в обхід проксі (дірки у фаєрволі, доступ із внутрішньої мережі)
- якщо ви не впевнені, що ваш проксі правильно видаляє/перезаписує forwarded-заголовки
- якщо вам потрібен лише персональний доступ для одного користувача (для простішого налаштування розгляньте Tailscale Serve + loopback)

## Як це працює

1. Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо)
2. Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`)
3. OpenClaw перевіряє, що запит надійшов від **IP-адреси довіреного проксі** (налаштовано в `gateway.trustedProxies`)
4. OpenClaw витягує ідентичність користувача з налаштованого заголовка
5. Якщо все збігається, запит авторизується

## Керування поведінкою pairing у Control UI

Коли активний `gateway.auth.mode = "trusted-proxy"` і запит проходить
перевірки trusted-proxy, сеанси WebSocket Control UI можуть підключатися без
ідентичності pairing пристрою.

Наслідки:

- Pairing більше не є основним бар’єром доступу для Control UI в цьому режимі.
- Політика автентифікації вашого зворотного проксі та `allowUsers` стають фактичним контролем доступу.
- Залишайте вхідний трафік gateway заблокованим лише для IP-адрес довіреного проксі (`gateway.trustedProxies` + фаєрвол).

## Конфігурація

```json5
{
  gateway: {
    // Автентифікація trusted-proxy очікує запити від довіреного джерела проксі не на loopback
    bind: "lan",

    // КРИТИЧНО: Додавайте сюди лише IP-адреси вашого проксі
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Заголовок, що містить ідентичність автентифікованого користувача (обов’язково)
        userHeader: "x-forwarded-user",

        // Необов’язково: заголовки, які ОБОВ’ЯЗКОВО мають бути присутні (перевірка проксі)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Необов’язково: обмеження конкретними користувачами (порожньо = дозволити всіх)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Важливе правило runtime:

- Автентифікація trusted-proxy відхиляє запити з джерел loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Зворотні проксі на loopback на тому ж хості **не** задовольняють вимоги автентифікації trusted-proxy.
- Для таких конфігурацій з loopback-проксі на тому ж хості використовуйте натомість автентифікацію за токеном/паролем або маршрутизуйте через довірену адресу проксі не на loopback, яку OpenClaw може перевірити.
- Для розгортань Control UI не на loopback усе ще потрібен явний `gateway.controlUi.allowedOrigins`.
- **Докази через forwarded-заголовки мають пріоритет над локальністю loopback.** Якщо запит надходить через loopback, але містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, що вказують на нелокальне джерело, ці докази скасовують твердження про локальність loopback. Такий запит розглядається як віддалений для pairing, автентифікації trusted-proxy та контролю ідентичності пристрою в Control UI. Це не дозволяє зворотному проксі на loopback на тому ж хості «відмивати» ідентичність з forwarded-заголовків у trusted-proxy auth.

### Довідник з конфігурації

| Поле                                        | Обов’язково | Опис                                                                        |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Так         | Масив IP-адрес проксі, яким довіряють. Запити з інших IP відхиляються.      |
| `gateway.auth.mode`                         | Так         | Має бути `"trusted-proxy"`                                                  |
| `gateway.auth.trustedProxy.userHeader`      | Так         | Назва заголовка, що містить ідентичність автентифікованого користувача      |
| `gateway.auth.trustedProxy.requiredHeaders` | Ні          | Додаткові заголовки, які мають бути присутні, щоб запит вважався довіреним  |
| `gateway.auth.trustedProxy.allowUsers`      | Ні          | Список дозволених ідентичностей користувачів. Порожній означає дозволити всіх автентифікованих користувачів. |

## Завершення TLS і HSTS

Використовуйте одну точку завершення TLS і застосовуйте HSTS саме там.

### Рекомендований шаблон: завершення TLS на проксі

Коли ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, установіть
`Strict-Transport-Security` на проксі для цього домену.

- Добре підходить для розгортань, доступних з інтернету.
- Дає змогу тримати сертифікати та політику посилення захисту HTTP в одному місці.
- OpenClaw може залишатися на loopback HTTP за проксі.

Приклад значення заголовка:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Завершення TLS на Gateway

Якщо сам OpenClaw напряму обслуговує HTTPS (без проксі, що завершує TLS), задайте:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` приймає рядкове значення заголовка або `false` для явного вимкнення.

### Рекомендації щодо поетапного ввімкнення

- Спочатку використовуйте короткий max age (наприклад, `max-age=300`) під час перевірки трафіку.
- Збільшуйте до довготривалих значень (наприклад, `max-age=31536000`) лише після появи високої впевненості.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви свідомо відповідаєте вимогам preload для всього набору ваших доменів.
- Локальна розробка лише на loopback не отримує користі від HSTS.

## Приклади налаштування проксі

### Pomerium

Pomerium передає ідентичність у `x-pomerium-claim-email` (або інші claim-заголовки) і JWT у `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Фрагмент конфігурації Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy з OAuth

Caddy з Plugin `caddy-security` може автентифікувати користувачів і передавати заголовки ідентичності.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Caddy/sidecar-проксі
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Фрагмент Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy автентифікує користувачів і передає ідентичність у `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Фрагмент конфігурації nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik з Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP контейнера Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Змішана конфігурація токенів

OpenClaw відхиляє неоднозначні конфігурації, де одночасно активні `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`) і режим `trusted-proxy`. Змішані конфігурації токенів можуть призвести до того, що запити через loopback тихо автентифікуватимуться неправильним шляхом автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- приберіть спільний токен, якщо використовуєте режим trusted-proxy, або
- перемкніть `gateway.auth.mode` на `"token"`, якщо ви маєте на увазі автентифікацію на основі токена.

Автентифікація trusted-proxy через loopback також безпечно блокується: виклики з того ж хоста мають передавати налаштовані заголовки ідентичності через довірений проксі, а не тихо автентифікуватися.

## Заголовок областей оператора

Автентифікація trusted-proxy — це HTTP-режим, **що несе ідентичність**, тому виклики
можуть необов’язково оголошувати області оператора через `x-openclaw-scopes`.

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw використовує оголошений набір областей.
- Коли заголовок присутній, але порожній, запит оголошує **жодної** області оператора.
- Коли заголовок відсутній, звичайні HTTP API, що несуть ідентичність, повертаються до стандартного типового набору областей оператора.
- **HTTP routes Plugin** з автентифікацією gateway за замовчуванням вужчі: коли `x-openclaw-scopes` відсутній, їхня область runtime повертається до `operator.write`.
- HTTP-запити з походження браузера все одно мають пройти `gateway.controlUi.allowedOrigins` (або навмисний fallback-режим заголовка Host) навіть після успішної автентифікації trusted-proxy.

Практичне правило:

- Надсилайте `x-openclaw-scopes` явно, коли хочете, щоб запит trusted-proxy
  був вужчим за типові значення, або коли маршруту plugin з автентифікацією gateway
  потрібне щось сильніше за область write.

## Контрольний список безпеки

Перш ніж увімкнути автентифікацію trusted-proxy, перевірте:

- [ ] **Проксі є єдиним шляхом**: Порт Gateway закрито фаєрволом від усього, крім вашого проксі
- [ ] **trustedProxies мінімальний**: Лише фактичні IP-адреси ваших проксі, а не цілі підмережі
- [ ] **Немає джерела проксі на loopback**: автентифікація trusted-proxy безпечно блокується для запитів із джерел loopback
- [ ] **Проксі видаляє заголовки**: Ваш проксі перезаписує (а не дописує) заголовки `x-forwarded-*` від клієнтів
- [ ] **Завершення TLS**: Ваш проксі обробляє TLS; користувачі підключаються через HTTPS
- [ ] **allowedOrigins задано явно**: Для Control UI не на loopback використовується явний `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers задано** (рекомендовано): Обмежте доступ відомими користувачами, а не дозволяйте будь-кому, хто пройшов автентифікацію
- [ ] **Немає змішаної конфігурації токенів**: Не задавайте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`

## Аудит безпеки

`openclaw security audit` позначить автентифікацію trusted-proxy як finding рівня **critical**. Це навмисно — нагадування про те, що ви делегуєте безпеку вашій конфігурації проксі.

Аудит перевіряє:

- базове попередження/нагадування `gateway.trusted_proxy_auth` рівня warning/critical
- відсутню конфігурацію `trustedProxies`
- відсутню конфігурацію `userHeader`
- порожній `allowUsers` (дозволяє будь-якого автентифікованого користувача)
- wildcard або відсутню політику походження браузера на відкритих поверхнях Control UI

## Усунення неполадок

### `trusted_proxy_untrusted_source`

Запит надійшов не з IP у `gateway.trustedProxies`. Перевірте:

- чи правильний IP проксі? (IP контейнерів Docker можуть змінюватися)
- чи є балансувальник навантаження перед вашим проксі?
- використайте `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP-адреси

### `trusted_proxy_loopback_source`

OpenClaw відхилив запит trusted-proxy із джерела loopback.

Перевірте:

- чи підключається проксі з `127.0.0.1` / `::1`?
- чи не намагаєтеся ви використовувати автентифікацію trusted-proxy зі зворотним проксі на loopback на тому ж хості?

Виправлення:

- Використовуйте автентифікацію за токеном/паролем для конфігурацій із проксі на loopback на тому ж хості, або
- Маршрутизуйте через довірену адресу проксі не на loopback і тримайте цю IP-адресу в `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Заголовок користувача був порожній або відсутній. Перевірте:

- чи налаштований ваш проксі на передавання заголовків ідентичності?
- чи правильна назва заголовка? (регістр не має значення, але написання має)
- чи користувач справді автентифікований на проксі?

### `trusted_proxy_missing_header_*`

Обов’язковий заголовок був відсутній. Перевірте:

- конфігурацію вашого проксі для цих конкретних заголовків
- чи не видаляються заголовки десь у ланцюжку

### `trusted_proxy_user_not_allowed`

Користувач автентифікований, але не входить до `allowUsers`. Або додайте його, або приберіть allowlist.

### `trusted_proxy_origin_not_allowed`

Автентифікація trusted-proxy пройшла успішно, але заголовок браузера `Origin` не пройшов перевірки походження Control UI.

Перевірте:

- `gateway.controlUi.allowedOrigins` містить точне походження браузера
- ви не покладаєтеся на wildcard-походження, якщо тільки свідомо не хочете поведінку «дозволити все»
- якщо ви навмисно використовуєте fallback-режим заголовка Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано свідомо

### WebSocket усе ще не працює

Переконайтеся, що ваш проксі:

- підтримує оновлення WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- передає заголовки ідентичності в запитах на оновлення WebSocket (а не лише для HTTP)
- не має окремого шляху автентифікації для з’єднань WebSocket

## Міграція з автентифікації за токеном

Якщо ви переходите з автентифікації за токеном на trusted-proxy:

1. Налаштуйте ваш проксі на автентифікацію користувачів і передавання заголовків
2. Окремо перевірте налаштування проксі (curl із заголовками)
3. Оновіть конфігурацію OpenClaw для автентифікації trusted-proxy
4. Перезапустіть Gateway
5. Перевірте з’єднання WebSocket із Control UI
6. Запустіть `openclaw security audit` і перегляньте findings

## Пов’язане

- [Безпека](/uk/gateway/security) — повний посібник із безпеки
- [Конфігурація](/uk/gateway/configuration) — довідник із конфігурації
- [Віддалений доступ](/uk/gateway/remote) — інші схеми віддаленого доступу
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише в tailnet
