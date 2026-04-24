---
read_when:
    - Зміна режимів автентифікації або доступності dashboard
summary: Доступ і автентифікація для dashboard Gateway (Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-24T04:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Dashboard Gateway — це браузерний Control UI, який типово віддається за адресою `/`
(можна перевизначити через `gateway.controlUi.basePath`).

Швидке відкриття (локальний Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))

Ключові посилання:

- [Control UI](/uk/web/control-ui) — використання та можливості UI.
- [Tailscale](/uk/gateway/tailscale) — автоматизація Serve/Funnel.
- [Веб-поверхні](/uk/web) — режими прив’язки та примітки щодо безпеки.

Автентифікація застосовується на етапі handshake WebSocket через налаштований шлях
автентифікації gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- Заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Див. `gateway.auth` у [Конфігурації Gateway](/uk/gateway/configuration).

Примітка щодо безпеки: Control UI — це **поверхня адміністратора** (чат, конфігурація, погодження exec).
Не відкривайте його публічно. UI зберігає токени URL dashboard у sessionStorage
для поточної сесії вкладки браузера та вибраного URL gateway і видаляє їх з URL після завантаження.
Надавайте перевагу localhost, Tailscale Serve або SSH-тунелю.

## Швидкий шлях (рекомендовано)

- Після онбордингу CLI автоматично відкриває dashboard і виводить чисте посилання (без токена).
- Відкрити знову будь-коли: `openclaw dashboard` (копіює посилання, відкриває браузер, якщо можливо, показує підказку SSH, якщо середовище без headless).
- Якщо UI просить автентифікацію спільним секретом, вставте налаштований токен або
  пароль у налаштуваннях Control UI.

## Основи автентифікації (локально чи віддалено)

- **Localhost**: відкрийте `http://127.0.0.1:18789/`.
- **Джерело токена зі спільним секретом**: `gateway.auth.token` (або
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` може передати його через фрагмент URL
  для одноразового bootstrap, а Control UI зберігає його в sessionStorage для
  поточної сесії вкладки браузера та вибраного URL gateway замість localStorage.
- Якщо `gateway.auth.token` керується через SecretRef, `openclaw dashboard`
  навмисно виводить/копіює/відкриває URL без токена. Це допомагає уникнути витоку
  токенів, керованих зовнішніми системами, у логах оболонки, історії буфера обміну або аргументах запуску браузера.
- Якщо `gateway.auth.token` налаштовано як SecretRef і він не визначається у вашій
  поточній оболонці, `openclaw dashboard` усе одно виводить URL без токена плюс
  дієві інструкції з налаштування автентифікації.
- **Пароль зі спільним секретом**: використовуйте налаштований `gateway.auth.password` (або
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard не зберігає паролі між перезавантаженнями.
- **Режими з передаванням ідентичності**: Tailscale Serve може задовольнити автентифікацію
  Control UI/WebSocket через заголовки ідентичності, коли `gateway.auth.allowTailscale: true`, а
  reverse proxy з awareness ідентичності не на loopback може задовольнити
  `gateway.auth.mode: "trusted-proxy"`. У цих режимах dashboard не
  потребує вставленого спільного секрету для WebSocket.
- **Не localhost**: використовуйте Tailscale Serve, прив’язку не на loopback зі спільним секретом,
  reverse proxy з awareness ідентичності не на loopback із
  `gateway.auth.mode: "trusted-proxy"` або SSH-тунель. HTTP API, як і раніше, використовують
  автентифікацію спільним секретом, якщо тільки ви навмисно не запускаєте приватний ingress з
  `gateway.auth.mode: "none"` або trusted-proxy HTTP auth. Див.
  [Веб-поверхні](/uk/web).

<a id="if-you-see-unauthorized-1008"></a>

## Якщо ви бачите "unauthorized" / 1008

- Переконайтеся, що gateway доступний (локально: `openclaw status`; віддалено: SSH-тунель `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`).
- Для `AUTH_TOKEN_MISMATCH` клієнти можуть виконати одну довірену повторну спробу з кешованим device token, коли gateway повертає підказки для повтору. Ця повторна спроба з кешованим токеном повторно використовує кешовані схвалені scopes цього токена; виклики з явним `deviceToken` / явними `scopes` зберігають свій запитаний набір scopes. Якщо після цього повтору автентифікація все ще не вдається, усуньте розбіжність токена вручну.
- Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений device token, потім bootstrap token.
- В асинхронному шляху Tailscale Serve Control UI невдалі спроби для тієї самої
  пари `{scope, ip}` серіалізуються до того, як лімітатор невдалої автентифікації зафіксує їх, тож друга одночасна невдала повторна спроба вже може показати `retry later`.
- Для кроків із виправлення розбіжності токена дотримуйтесь [контрольного списку відновлення після розбіжності токена](/uk/cli/devices#token-drift-recovery-checklist).
- Отримайте або надайте спільний секрет із хоста gateway:
  - Токен: `openclaw config get gateway.auth.token`
  - Пароль: визначте налаштований `gateway.auth.password` або
    `OPENCLAW_GATEWAY_PASSWORD`
  - Токен, керований через SecretRef: визначте зовнішнього провайдера секретів або експортуйте
    `OPENCLAW_GATEWAY_TOKEN` у цій оболонці, а потім повторно запустіть `openclaw dashboard`
  - Спільний секрет не налаштовано: `openclaw doctor --generate-gateway-token`
- У налаштуваннях dashboard вставте токен або пароль у поле автентифікації,
  а потім підключіться.
- Перемикач мови UI розташований у **Overview -> Gateway Access -> Language**.
  Він є частиною картки доступу, а не розділу Appearance.

## Пов’язане

- [Control UI](/uk/web/control-ui)
- [WebChat](/uk/web/webchat)
