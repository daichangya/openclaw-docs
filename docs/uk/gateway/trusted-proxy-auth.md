---
read_when:
    - Запуск OpenClaw за проксі з урахуванням ідентичності
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Виправлення помилок WebSocket 1008 unauthorized у конфігураціях із reverse proxy
    - Визначення, де задавати HSTS та інші HTTP-заголовки посилення захисту
summary: Делегування автентифікації gateway довіреному reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація через довірений проксі
x-i18n:
    generated_at: "2026-04-05T18:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Автентифікація через довірений проксі

> ⚠️ **Функція, чутлива до безпеки.** У цьому режимі автентифікація повністю делегується вашому reverse proxy. Помилка в налаштуванні може відкрити ваш Gateway для неавторизованого доступу. Уважно прочитайте цю сторінку перед увімкненням.

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, коли:

- Ви запускаєте OpenClaw за **проксі з урахуванням ідентичності** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Ваш проксі обробляє всю автентифікацію й передає ідентичність користувача через заголовки
- Ви працюєте в середовищі Kubernetes або контейнерів, де проксі є єдиним шляхом до Gateway
- Ви отримуєте помилки WebSocket `1008 unauthorized`, тому що браузери не можуть передавати токени в payload WS

## Коли НЕ використовувати

- Якщо ваш проксі не автентифікує користувачів (а лише завершує TLS або працює як load balancer)
- Якщо існує будь-який шлях до Gateway в обхід проксі (дірки у firewall, доступ із внутрішньої мережі)
- Якщо ви не впевнені, що ваш проксі правильно прибирає/перезаписує forwarded-заголовки
- Якщо вам потрібен лише особистий доступ одного користувача (розгляньте Tailscale Serve + loopback для простішого налаштування)

## Як це працює

1. Ваш reverse proxy автентифікує користувачів (OAuth, OIDC, SAML тощо)
2. Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`)
3. OpenClaw перевіряє, що запит надійшов від **довіреної IP-адреси проксі** (налаштовується в `gateway.trustedProxies`)
4. OpenClaw витягує ідентичність користувача з налаштованого заголовка
5. Якщо все перевірено, запит авторизується

## Поведінка прив’язки для Control UI

Коли активний `gateway.auth.mode = "trusted-proxy"` і запит проходить перевірки
довіреного проксі, сеанси WebSocket Control UI можуть підключатися без
ідентичності прив’язки пристрою.

Наслідки:

- Прив’язка більше не є основним механізмом доступу до Control UI в цьому режимі.
- Ефективним механізмом керування доступом стають ваша політика автентифікації reverse proxy і `allowUsers`.
- Тримайте ingress gateway заблокованим лише до IP довіреного проксі (`gateway.trustedProxies` + firewall).

## Конфігурація

```json5
{
  gateway: {
    // Автентифікація trusted-proxy очікує запити з не-loopback джерела довіреного проксі
    bind: "lan",

    // КРИТИЧНО: додавайте сюди лише IP-адреси вашого проксі
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Заголовок, що містить ідентичність автентифікованого користувача (обов’язково)
        userHeader: "x-forwarded-user",

        // Необов’язково: заголовки, які ОБОВ’ЯЗКОВО мають бути присутні (перевірка проксі)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Необов’язково: обмежити конкретними користувачами (порожньо = дозволити всіх)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Важливе runtime-правило:

- Автентифікація trusted-proxy відхиляє запити з loopback-джерела (`127.0.0.1`, `::1`, loopback CIDR).
- Reverse proxy на тому самому хості через loopback **не** задовольняють вимоги trusted-proxy auth.
- Для reverse proxy на тому самому хості через loopback натомість використовуйте автентифікацію token/password або маршрутизуйте через не-loopback адресу довіреного проксі, яку OpenClaw може перевірити.
- Не-loopback розгортання Control UI і далі потребують явного `gateway.controlUi.allowedOrigins`.

### Довідник із конфігурації

| Поле                                        | Обов’язково | Опис                                                                        |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Так         | Масив IP-адрес проксі, яким можна довіряти. Запити з інших IP відхиляються. |
| `gateway.auth.mode`                         | Так         | Має бути `"trusted-proxy"`                                                  |
| `gateway.auth.trustedProxy.userHeader`      | Так         | Назва заголовка, що містить ідентичність автентифікованого користувача      |
| `gateway.auth.trustedProxy.requiredHeaders` | Ні          | Додаткові заголовки, які мають бути присутні, щоб запит вважався довіреним  |
| `gateway.auth.trustedProxy.allowUsers`      | Ні          | Allowlist ідентичностей користувачів. Порожньо означає всіх автентифікованих користувачів. |

## TLS termination і HSTS

Використовуйте одну точку TLS termination і задавайте HSTS саме там.

### Рекомендований шаблон: TLS termination на проксі

Коли ваш reverse proxy обробляє HTTPS для `https://control.example.com`, задавайте
`Strict-Transport-Security` на проксі для цього домену.

- Добре підходить для розгортань, відкритих в інтернет.
- Зберігає сертифікати й політику посилення HTTP в одному місці.
- OpenClaw може залишатися на loopback HTTP за проксі.

Приклад значення заголовка:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### TLS termination на Gateway

Якщо OpenClaw сам напряму обслуговує HTTPS (без проксі, що завершує TLS), задайте:

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

### Рекомендації щодо розгортання

- Спочатку використовуйте короткий max age (наприклад, `max-age=300`) під час перевірки трафіку.
- Переходьте до довготривалих значень (наприклад, `max-age=31536000`) лише після достатньої впевненості.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви свідомо відповідаєте вимогам preload для всього набору своїх доменів.
- Локальна розробка лише на loopback не отримує користі від HSTS.

## Приклади налаштування проксі

### Pomerium

Pomerium передає ідентичність у `x-pomerium-claim-email` (або інших заголовках claims) і JWT у `x-pomerium-jwt-assertion`.

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

Caddy з плагіном `caddy-security` може автентифікувати користувачів і передавати заголовки ідентичності.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP Caddy/sidecar проксі
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

OpenClaw відхиляє неоднозначні конфігурації, у яких одночасно активні і `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`), і режим `trusted-proxy`. Змішані конфігурації токенів можуть призвести до того, що loopback-запити тихо автентифікуватимуться через неправильний шлях автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- Приберіть спільний токен під час використання режиму trusted-proxy, або
- Змініть `gateway.auth.mode` на `"token"`, якщо ви справді хочете автентифікацію на основі токена.

Автентифікація trusted-proxy для loopback також блокується за принципом fail-closed: виклики з того самого хоста мають передавати налаштовані заголовки ідентичності через довірений проксі, а не проходити тиху автентифікацію.

## Заголовок областей оператора

Автентифікація trusted-proxy — це HTTP-режим **з передаванням ідентичності**, тому виклики
можуть за бажанням оголошувати області оператора через `x-openclaw-scopes`.

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw враховує оголошений набір областей.
- Коли заголовок присутній, але порожній, запит оголошує **жодної** операторської області.
- Коли заголовок відсутній, звичайні HTTP API з передаванням ідентичності повертаються до стандартного типового набору операторських областей.
- **Plugin HTTP routes** з автентифікацією gateway за замовчуванням вужчі: коли `x-openclaw-scopes` відсутній, їхня runtime-область повертається до `operator.write`.
- HTTP-запити з браузера все одно мають проходити `gateway.controlUi.allowedOrigins` (або навмисний fallback-режим через Host-header) навіть після успішної trusted-proxy auth.

Практичне правило:

- Явно надсилайте `x-openclaw-scopes`, коли хочете, щоб trusted-proxy-запит
  був вужчим за типові значення, або коли gateway-auth plugin route потребує
  чогось сильнішого за область write.

## Контрольний список безпеки

Перш ніж увімкнути trusted-proxy auth, перевірте:

- [ ] **Проксі — єдиний шлях**: порт Gateway закритий firewall для всіх, крім вашого проксі
- [ ] **trustedProxies мінімальний**: лише фактичні IP-адреси вашого проксі, а не цілі підмережі
- [ ] **Немає loopback-джерела проксі**: trusted-proxy auth блокується для запитів із loopback-джерела
- [ ] **Проксі прибирає заголовки**: ваш проксі перезаписує (а не додає) `x-forwarded-*` заголовки від клієнтів
- [ ] **TLS termination**: ваш проксі обробляє TLS; користувачі підключаються через HTTPS
- [ ] **allowedOrigins задано явно**: не-loopback Control UI використовує явний `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers задано** (рекомендовано): обмеження відомими користувачами замість дозволу будь-кому з автентифікацією
- [ ] **Немає змішаної конфігурації токенів**: не задавайте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`

## Аудит безпеки

`openclaw security audit` позначить trusted-proxy auth як знахідку рівня **critical**. Це навмисно — нагадування, що ви делегуєте безпеку вашій конфігурації проксі.

Аудит перевіряє:

- Базове попередження/нагадування `gateway.trusted_proxy_auth` рівня warning/critical
- Відсутню конфігурацію `trustedProxies`
- Відсутню конфігурацію `userHeader`
- Порожній `allowUsers` (дозволяє будь-якому автентифікованому користувачу)
- Wildcard або відсутню політику browser-origin на відкритих поверхнях Control UI

## Усунення несправностей

### `trusted_proxy_untrusted_source`

Запит надійшов не з IP у `gateway.trustedProxies`. Перевірте:

- Чи правильний IP проксі? (IP контейнерів Docker можуть змінюватися)
- Чи є перед проксі ще один load balancer?
- Використайте `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP

### `trusted_proxy_loopback_source`

OpenClaw відхилив trusted-proxy-запит із loopback-джерела.

Перевірте:

- Чи проксі підключається з `127.0.0.1` / `::1`?
- Чи намагаєтеся ви використовувати trusted-proxy auth із reverse proxy на тому самому хості через loopback?

Виправлення:

- Використовуйте автентифікацію token/password для reverse proxy на тому самому хості через loopback, або
- Маршрутизуйте через не-loopback адресу довіреного проксі й тримайте цю IP-адресу в `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Заголовок користувача був порожній або відсутній. Перевірте:

- Чи налаштований проксі на передавання заголовків ідентичності?
- Чи правильна назва заголовка? (без урахування регістру, але написання має значення)
- Чи користувач справді автентифікований на проксі?

### `trusted*proxy_missing_header*\*`

Один з обов’язкових заголовків був відсутній. Перевірте:

- Конфігурацію проксі для цих конкретних заголовків
- Чи не прибираються заголовки десь у ланцюжку

### `trusted_proxy_user_not_allowed`

Користувач автентифікований, але відсутній у `allowUsers`. Додайте його або приберіть allowlist.

### `trusted_proxy_origin_not_allowed`

Автентифікація trusted-proxy пройшла успішно, але заголовок браузера `Origin` не пройшов перевірки origin для Control UI.

Перевірте:

- `gateway.controlUi.allowedOrigins` містить точний browser origin
- Ви не покладаєтеся на wildcard origin, якщо тільки свідомо не хочете дозволити всіх
- Якщо ви свідомо використовуєте fallback-режим через Host-header, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано навмисно

### WebSocket усе ще не працює

Переконайтеся, що ваш проксі:

- Підтримує оновлення WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Передає заголовки ідентичності під час запитів на оновлення WebSocket (а не лише для HTTP)
- Не має окремого шляху автентифікації для WebSocket-з’єднань

## Міграція з автентифікації через токен

Якщо ви переходите з автентифікації через токен на trusted-proxy:

1. Налаштуйте проксі на автентифікацію користувачів і передавання заголовків
2. Окремо протестуйте налаштування проксі (curl із заголовками)
3. Оновіть конфігурацію OpenClaw для trusted-proxy auth
4. Перезапустіть Gateway
5. Перевірте WebSocket-з’єднання з Control UI
6. Запустіть `openclaw security audit` і перегляньте знахідки

## Пов’язане

- [Безпека](/gateway/security) — повний посібник із безпеки
- [Конфігурація](/gateway/configuration) — довідник із конфігурації
- [Віддалений доступ](/gateway/remote) — інші шаблони віддаленого доступу
- [Tailscale](/gateway/tailscale) — простіша альтернатива для доступу лише через tailnet
