---
read_when:
    - Зміна автентифікації панелі керування або режимів відкриття доступу
summary: Доступ і auth до панелі Gateway (Control UI)
title: Панель керування
x-i18n:
    generated_at: "2026-04-23T23:09:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 644d79f91d8ca1fa4c29f22dc86fd8296efc5f47662144e904a7f2f56092a36e
    source_path: web/dashboard.md
    workflow: 15
---

Панель Gateway — це browser Control UI, який за замовчуванням віддається за адресою `/`
(можна перевизначити через `gateway.controlUi.basePath`).

Швидке відкриття (локальний Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))

Ключові посилання:

- [Control UI](/uk/web/control-ui) — щодо використання й можливостей UI.
- [Tailscale](/uk/gateway/tailscale) — щодо автоматизації Serve/Funnel.
- [Вебповерхні](/uk/web) — щодо режимів bind і приміток із безпеки.

Автентифікація примусово перевіряється під час WebSocket handshake через налаштований
шлях auth gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- Заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Див. `gateway.auth` у [Конфігурації Gateway](/uk/gateway/configuration).

Примітка з безпеки: Control UI — це **адміністративна поверхня** (чат, конфігурація, схвалення exec).
Не відкривайте її публічно. UI зберігає токени URL панелі керування в sessionStorage
для поточної сесії вкладки браузера й вибраного URL gateway та прибирає їх з URL після завантаження.
Віддавайте перевагу localhost, Tailscale Serve або SSH-тунелю.

## Швидкий шлях (рекомендовано)

- Після onboarding CLI автоматично відкриває панель керування й виводить чисте посилання (без токена).
- Повторне відкриття в будь-який час: `openclaw dashboard` (копіює посилання, відкриває браузер за можливості, показує підказку для SSH, якщо середовище безголове).
- Якщо UI запитує auth через спільний секрет, вставте налаштований token або
  password у параметри Control UI.

## Основи auth (локально vs віддалено)

- **Localhost**: відкрийте `http://127.0.0.1:18789/`.
- **Джерело токена спільного секрету**: `gateway.auth.token` (або
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` може передавати його через фрагмент URL
  для одноразового bootstrap, а Control UI зберігає його в sessionStorage для
  поточної сесії вкладки браузера й вибраного URL gateway замість localStorage.
- Якщо `gateway.auth.token` керується через SecretRef, `openclaw dashboard`
  навмисно виводить/копіює/відкриває URL без токена. Це дозволяє уникнути витоку
  зовнішньо керованих токенів у shell logs, історію буфера обміну або аргументи запуску браузера.
- Якщо `gateway.auth.token` налаштований як SecretRef і не визначений у вашій
  поточній оболонці, `openclaw dashboard` усе одно виводить URL без токена та
  практичні вказівки з налаштування auth.
- **Password спільного секрету**: використовуйте налаштований `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_PASSWORD`). Панель керування не зберігає паролі між
  перезавантаженнями.
- **Режими з передаванням ідентичності**: Tailscale Serve може задовольнити auth для Control UI/WebSocket
  через заголовки ідентичності, коли `gateway.auth.allowTailscale: true`, а
  reverse proxy з підтримкою ідентичності й не-loopback може задовольнити
  `gateway.auth.mode: "trusted-proxy"`. У цих режимах панель керування не
  потребує вставленого спільного секрету для WebSocket.
- **Не localhost**: використовуйте Tailscale Serve, bind не-loopback зі спільним секретом, reverse proxy з підтримкою ідентичності та не-loopback з
  `gateway.auth.mode: "trusted-proxy"` або SSH-тунель. HTTP API і далі використовують auth зі спільним секретом, якщо лише ви навмисно не запускаєте
  `gateway.auth.mode: "none"` для приватного ingress або auth trusted-proxy для HTTP. Див.
  [Вебповерхні](/uk/web).

<a id="if-you-see-unauthorized-1008"></a>

## Якщо ви бачите "unauthorized" / 1008

- Переконайтеся, що gateway доступний (локально: `openclaw status`; віддалено: SSH-тунель `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`).
- Для `AUTH_TOKEN_MISMATCH` клієнти можуть виконати одну довірену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору. Ця повторна спроба з кешованим токеном повторно використовує кешовані схвалені scope токена; виклики з явним `deviceToken` / явними `scopes` зберігають запитаний набір scope. Якщо auth усе ще не проходить після цієї повторної спроби, вручну усуньте розсинхронізацію токена.
- Поза цим шляхом повтору пріоритет auth під час підключення такий: спочатку явний спільний token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
- На асинхронному шляху Tailscale Serve для Control UI невдалі спроби для одного й того самого
  `{scope, ip}` серіалізуються до того, як лімітатор невдалих auth зафіксує їх, тож друга одночасна неправильна повторна спроба вже може показати `retry later`.
- Для кроків відновлення при розсинхронізації токенів дотримуйтеся [Контрольного списку відновлення розсинхронізації токенів](/uk/cli/devices#token-drift-recovery-checklist).
- Отримайте або задайте спільний секрет із хоста gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Password: визначте налаштований `gateway.auth.password` або
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token, керований SecretRef: визначте зовнішнього постачальника секретів або експортуйте
    `OPENCLAW_GATEWAY_TOKEN` у цій оболонці, а потім знову виконайте `openclaw dashboard`
  - Спільний секрет не налаштовано: `openclaw doctor --generate-gateway-token`
- У параметрах панелі керування вставте token або password у поле auth,
  а потім підключіться.
- Перемикач мови UI розміщений у **Overview -> Gateway Access -> Language**.
  Він є частиною картки доступу, а не розділу Appearance.
