---
read_when:
    - Вам потрібен контейнеризований Gateway із Podman замість Docker
summary: Запуск OpenClaw у rootless-контейнері Podman
title: Podman
x-i18n:
    generated_at: "2026-04-23T06:45:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Запускайте Gateway OpenClaw у rootless-контейнері Podman, яким керує ваш поточний користувач без прав root.

Базова модель така:

- Podman запускає контейнер Gateway.
- Ваш хостовий CLI `openclaw` є площиною керування.
- Постійний стан за замовчуванням зберігається на хості в `~/.openclaw`.
- Для щоденного керування використовуйте `openclaw --container <name> ...` замість `sudo -u openclaw`, `podman exec` або окремого користувача сервісу.

## Передумови

- **Podman** у режимі rootless
- **CLI OpenClaw** встановлений на хості
- **Необов’язково:** `systemd --user`, якщо ви хочете автозапуск із керуванням через Quadlet
- **Необов’язково:** `sudo`, лише якщо ви хочете `loginctl enable-linger "$(whoami)"` для збереження після перезавантаження на headless-хості

## Швидкий старт

<Steps>
  <Step title="Одноразове налаштування">
    У корені репозиторію виконайте `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Запустіть контейнер Gateway">
    Запустіть контейнер командою `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Запустіть онбординг усередині контейнера">
    Виконайте `./scripts/run-openclaw-podman.sh launch setup`, а потім відкрийте `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Керуйте запущеним контейнером із хостового CLI">
    Задайте `OPENCLAW_CONTAINER=openclaw`, а потім використовуйте звичайні команди `openclaw` із хоста.
  </Step>
</Steps>

Подробиці налаштування:

- `./scripts/podman/setup.sh` за замовчуванням збирає `openclaw:local` у вашому rootless-сховищі Podman або використовує `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, якщо ви їх задали.
- Якщо `~/.openclaw/openclaw.json` відсутній, створюється файл із `gateway.mode: "local"`.
- Якщо `~/.openclaw/.env` відсутній, створюється файл із `OPENCLAW_GATEWAY_TOKEN`.
- Для ручного запуску допоміжний скрипт читає лише невеликий список дозволених ключів, пов’язаних із Podman, з `~/.openclaw/.env` і передає явні змінні середовища runtime до контейнера; він не передає до Podman увесь env-файл.

Налаштування з керуванням через Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet — це варіант лише для Linux, оскільки він залежить від користувацьких сервісів systemd.

Ви також можете задати `OPENCLAW_PODMAN_QUADLET=1`.

Необов’язкові змінні середовища для збірки/налаштування:

- `OPENCLAW_IMAGE` або `OPENCLAW_PODMAN_IMAGE` -- використати наявний/завантажений образ замість збірки `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- установити додаткові пакунки apt під час збірки образу
- `OPENCLAW_EXTENSIONS` -- попередньо встановити залежності plugin під час збірки

Запуск контейнера:

```bash
./scripts/run-openclaw-podman.sh launch
```

Скрипт запускає контейнер від ваших поточних uid/gid із `--userns=keep-id` і монтує стан OpenClaw із хоста в контейнер через bind-mount.

Онбординг:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Потім відкрийте `http://127.0.0.1:18789/` і використайте токен із `~/.openclaw/.env`.

Стандартне значення хостового CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Після цього такі команди автоматично виконуватимуться всередині цього контейнера:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

У macOS Podman machine може призводити до того, що браузер виглядає для gateway як нелокальний.
Якщо після запуску в Control UI з’являються помилки device-auth, скористайтеся вказівками Tailscale в
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Для HTTPS або віддаленого доступу з браузера дотримуйтеся основної документації Tailscale.

Примітка, специфічна для Podman:

- Залишайте publish host Podman на `127.0.0.1`.
- Віддавайте перевагу `tailscale serve`, яким керує хост, а не `openclaw gateway --tailscale serve`.
- У macOS, якщо локальний контекст device-auth у браузері працює ненадійно, використовуйте доступ через Tailscale замість ad hoc-обхідних рішень із локальними тунелями.

Див.:

- [Tailscale](/uk/gateway/tailscale)
- [Control UI](/uk/web/control-ui)

## Systemd (Quadlet, необов’язково)

Якщо ви запускали `./scripts/podman/setup.sh --quadlet`, налаштування встановлює файл Quadlet у:

```bash
~/.config/containers/systemd/openclaw.container
```

Корисні команди:

- **Запуск:** `systemctl --user start openclaw.service`
- **Зупинка:** `systemctl --user stop openclaw.service`
- **Статус:** `systemctl --user status openclaw.service`
- **Журнали:** `journalctl --user -u openclaw.service -f`

Після редагування файлу Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Для збереження після перезавантаження на SSH/headless-хостах увімкніть lingering для поточного користувача:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Конфігурація, env і сховище

- **Каталог конфігурації:** `~/.openclaw`
- **Каталог робочого простору:** `~/.openclaw/workspace`
- **Файл токена:** `~/.openclaw/.env`
- **Допоміжний скрипт запуску:** `./scripts/run-openclaw-podman.sh`

Скрипт запуску та Quadlet монтують стан хоста в контейнер через bind-mount:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

За замовчуванням це каталоги хоста, а не анонімний стан контейнера, тому
`openclaw.json`, `auth-profiles.json` для кожного агента, стан каналів/провайдерів,
сесії та робочий простір зберігаються після заміни контейнера.
Налаштування Podman також початково задає `gateway.controlUi.allowedOrigins` для `127.0.0.1` і `localhost` на опублікованому порту gateway, щоб локальна панель керування працювала з не-loopback-прив’язкою контейнера.

Корисні змінні середовища для ручного запуску:

- `OPENCLAW_PODMAN_CONTAINER` -- назва контейнера (за замовчуванням `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- образ для запуску
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- порт хоста, зіставлений із `18789` контейнера
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- порт хоста, зіставлений із `18790` контейнера
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- інтерфейс хоста для опублікованих портів; за замовчуванням `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- режим прив’язки gateway всередині контейнера; за замовчуванням `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (за замовчуванням), `auto` або `host`

Скрипт ручного запуску читає `~/.openclaw/.env` перед остаточним визначенням стандартних значень контейнера/образу, тому ви можете зберігати їх там.

Якщо ви використовуєте нестандартний `OPENCLAW_CONFIG_DIR` або `OPENCLAW_WORKSPACE_DIR`, задайте ті самі змінні як для `./scripts/podman/setup.sh`, так і для подальших команд `./scripts/run-openclaw-podman.sh launch`. Локальний скрипт запуску з репозиторію не зберігає перевизначення користувацьких шляхів між оболонками.

Примітка щодо Quadlet:

- Згенерований сервіс Quadlet навмисно зберігає фіксовану, посилену стандартну конфігурацію: опубліковані порти `127.0.0.1`, `--bind lan` усередині контейнера та простір імен користувача `keep-id`.
- Він фіксує `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` і `TimeoutStartSec=300`.
- Він публікує обидва порти: `127.0.0.1:18789:18789` (gateway) і `127.0.0.1:18790:18790` (bridge).
- Він читає `~/.openclaw/.env` як runtime `EnvironmentFile` для значень на кшталт `OPENCLAW_GATEWAY_TOKEN`, але не використовує список дозволених перевизначень Podman, специфічний для ручного запуску.
- Якщо вам потрібні користувацькі publish ports, publish host або інші прапорці запуску контейнера, використовуйте ручний запуск або безпосередньо редагуйте `~/.config/containers/systemd/openclaw.container`, а потім перезавантажте й перезапустіть сервіс.

## Корисні команди

- **Журнали контейнера:** `podman logs -f openclaw`
- **Зупинити контейнер:** `podman stop openclaw`
- **Видалити контейнер:** `podman rm -f openclaw`
- **Відкрити URL панелі керування з хостового CLI:** `openclaw dashboard --no-open`
- **Стан/справність через хостовий CLI:** `openclaw gateway status --deep` (RPC probe + додаткове
  сканування сервісів)

## Усунення проблем

- **Permission denied (EACCES) для конфігурації або робочого простору:** Контейнер за замовчуванням запускається з `--userns=keep-id` і `--user <your uid>:<your gid>`. Переконайтеся, що шляхи конфігурації/робочого простору на хості належать вашому поточному користувачу.
- **Запуск Gateway заблоковано (відсутній `gateway.mode=local`):** Переконайтеся, що `~/.openclaw/openclaw.json` існує і задає `gateway.mode="local"`. `scripts/podman/setup.sh` створює його, якщо файл відсутній.
- **Команди CLI контейнера звертаються не до тієї цілі:** Явно використовуйте `openclaw --container <name> ...` або експортуйте `OPENCLAW_CONTAINER=<name>` у своїй оболонці.
- **`openclaw update` завершується помилкою з `--container`:** Це очікувано. Перезберіть/завантажте образ, а потім перезапустіть контейнер або сервіс Quadlet.
- **Сервіс Quadlet не запускається:** Виконайте `systemctl --user daemon-reload`, потім `systemctl --user start openclaw.service`. На headless-системах також може знадобитися `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux блокує bind mounts:** Не змінюйте стандартну поведінку монтування; скрипт запуску автоматично додає `:Z` у Linux, коли SELinux працює в режимі enforcing або permissive.

## Пов’язане

- [Docker](/uk/install/docker)
- [Фоновий процес Gateway](/uk/gateway/background-process)
- [Усунення проблем Gateway](/uk/gateway/troubleshooting)
