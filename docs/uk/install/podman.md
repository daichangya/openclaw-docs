---
read_when:
    - Ви хочете контейнеризований gateway з Podman замість Docker
summary: Запуск OpenClaw у rootless-контейнері Podman
title: Podman
x-i18n:
    generated_at: "2026-04-05T18:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Запускайте OpenClaw Gateway у rootless-контейнері Podman, яким керує ваш поточний користувач без прав root.

Очікувана модель така:

- Podman запускає контейнер gateway.
- Ваш хостовий CLI `openclaw` є площиною керування.
- Постійний стан типово зберігається на хості в `~/.openclaw`.
- Для щоденного керування використовується `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого користувача служби.

## Передумови

- **Podman** у rootless-режимі
- **OpenClaw CLI**, установлений на хості
- **Необов’язково:** `systemd --user`, якщо ви хочете автозапуск під керуванням Quadlet
- **Необов’язково:** `sudo`, лише якщо вам потрібно `loginctl enable-linger "$(whoami)"` для збереження між перезавантаженнями на headless-хості

## Швидкий старт

<Steps>
  <Step title="Одноразове налаштування">
    У корені репозиторію виконайте `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запуск контейнера Gateway">
    Запустіть контейнер командою `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запустіть onboarding усередині контейнера">
    Виконайте `./scripts/run-openclaw-podman.sh launch setup`, потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Керуйте запущеним контейнером із CLI хоста">
    Установіть `OPENCLAW_CONTAINER=openclaw`, а потім використовуйте звичайні команди `openclaw` з хоста.
  </Step>
</Steps>

Подробиці налаштування:

- `./scripts/podman/setup.sh` типово збирає `openclaw:local` у вашому rootless-сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви їх задали.
- Він створює `~/.openclaw/openclaw.json` з `gateway.mode: "local"`, якщо файл відсутній.
- Він створює `~/.openclaw/.env` з `OPENCLAW_GATEWAY_TOKEN`, якщо файл відсутній.
- Для ручних запусків helper читає лише невеликий allowlist ключів, пов’язаних із Podman, з `~/.openclaw/.env` і передає в контейнер явні runtime env vars; він не передає Podman увесь env-файл.

Налаштування під керуванням Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet — це варіант лише для Linux, оскільки він залежить від користувацьких служб systemd.

Ви також можете задати `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові env vars для збирання/налаштування:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використовувати наявний/завантажений образ замість збирання `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- установити додаткові apt-пакети під час збирання образу
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності розширень під час збирання

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер від імені вашого поточного uid/gid з `--userns=keep-id` і bind-mount вашого стану OpenClaw у контейнер.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен із `~/.openclaw/.env`.

Типове значення для CLI хоста:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Після цього такі команди автоматично виконуватимуться всередині контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

На macOS Podman machine може призвести до того, що browser виглядатиме для gateway як не локальний.
Якщо після запуску Control UI повідомляє про помилки device-auth, скористайтеся рекомендаціями Tailscale в
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Для HTTPS або віддаленого доступу з browser дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Залишайте host публікації Podman як `127.0.0.1`.
- Надавайте перевагу керованому хостом `tailscale serve` замість `openclaw gateway --tailscale serve`.
- На macOS, якщо локальний контекст device-auth у browser ненадійний, використовуйте доступ через Tailscale замість тимчасових локальних тунельних обхідних шляхів.

Див.:

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви запускали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet у:

```bash
~/.config/containers/systemd/openclaw.container
```

Корисні команди:

- **Запуск:** `systemctl --user start openclaw.service`
- **Зупинка:** `systemctl --user stop openclaw.service`
- **Стан:** `systemctl --user status openclaw.service`
- **Журнали:** `journalctl --user -u openclaw.service -f`

Після редагування файла Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для збереження між перезавантаженнями на SSH/headless-хостах увімкніть lingering для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, env і сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог workspace:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Helper запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску і Quadlet bind-mount стан хоста в контейнер:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Типово це каталоги на хості, а не анонімний стан контейнера, тому
`openclaw.json`, `auth-profiles.json` для кожного агента, стан каналу/провайдера,
сесії та workspace переживають заміну контейнера.
Налаштування Podman також ініціалізує `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту gateway, щоб локальна dashboard працювала з не-loopback bind контейнера.

Корисні env vars для ручного launcher-а:

- `OPENCLAW_PODMAN_CONTAINER` -- ім’я контейнера (типово `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- порт хоста, зіставлений з контейнерним `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- порт хоста, зіставлений з контейнерним `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- інтерфейс хоста для опублікованих портів; типово `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим bind для gateway всередині контейнера; типово `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (типово), `auto` або `host`

Ручний launcher читає `~/.openclaw/.env` перед остаточним визначенням типових значень контейнера/образу, тож ви можете зберегти їх там.

Якщо ви використовуєте нетиповий `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задайте ті самі змінні і для `./scripts/podman/setup.sh`, і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Launcher із локального репозиторію не зберігає перевизначення користувацьких шляхів між shell-сесіями.

Примітка щодо Quadlet:

- Згенерована служба Quadlet навмисно зберігає фіксовану, посилену типову форму: опубліковані порти `127.0.0.1`, `--bind lan` усередині контейнера і простір імен користувача `keep-id`.
- Вона фіксує `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Вона публікує і `127.0.0.1:18789:18789` (gateway), і `127.0.0.1:18790:18790` (bridge).
- Вона читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не використовує allowlist перевизначень, специфічних для Podman, із ручного launcher-а.
- Якщо вам потрібні власні порти публікації, host публікації або інші прапори запуску контейнера, використовуйте ручний launcher або редагуйте `~/.config/containers/systemd/openclaw.container` безпосередньо, а потім перезавантажте і перезапустіть службу.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL dashboard із CLI хоста:** `openclaw dashboard --no-open`
- **Health/status через CLI хоста:** `openclaw gateway status --deep` (RPC probe + додаткове
  сканування служб)

## Усунення проблем

- **Permission denied (EACCES) для конфігурації або workspace:** Контейнер типово запускається з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що шляхи конфігурації/workspace на хості належать вашому поточному користувачу.
- **Запуск gateway заблоковано (відсутній `gateway.mode=local`):** Переконайтеся, що існує `~/.openclaw/openclaw.json` і в ньому задано `gateway.mode="local"`. `scripts/podman/setup.sh` створює це, якщо файл відсутній.
- **Команди CLI у контейнері звертаються не туди:** Явно використовуйте `openclaw --container <name> ...` або експортуйте `OPENCLAW_CONTAINER=<name>` у своєму shell.
- **`openclaw update` завершується помилкою з `--container`:** Це очікувано. Перезберіть/перетягніть образ, потім перезапустіть контейнер або службу Quadlet.
- **Служба Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, потім `systemctl --user start openclaw.service`. На headless-системах вам також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind mounts:** Не змінюйте типову поведінку монтування; launcher автоматично додає `:Z` у Linux, коли SELinux перебуває в enforcing або permissive-режимі.

## Пов’язане

- [Docker](/install/docker)
- [Фоновий процес gateway](/gateway/background-process)
- [Усунення проблем gateway](/gateway/troubleshooting)
