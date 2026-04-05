---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленням безпеки
    - Вам потрібне ізольоване firewall-налаштування з доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, захищене встановлення OpenClaw з Ansible, Tailscale VPN та ізоляцією через firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-05T18:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Встановлення через Ansible

Розгорніть OpenClaw на production-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є джерелом істини для розгортання через Ansible. Ця сторінка — короткий огляд.
</Info>

## Передумови

| Вимога      | Докладніше                                                |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ або Ubuntu 20.04+                              |
| **Доступ**  | Привілеї root або sudo                                    |
| **Мережа**  | Підключення до інтернету для встановлення пакетів         |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримаєте

- **Безпека, орієнтована на firewall** — UFW + ізоляція Docker (публічно доступні лише SSH + Tailscale)
- **Tailscale VPN** — безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** — ізольовані sandbox-контейнери, прив’язки лише до localhost
- **Багаторівневий захист** — 4-рівнева архітектура безпеки
- **Інтеграція з systemd** — автозапуск під час завантаження з посиленням захисту
- **Налаштування однією командою** — повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що буде встановлено

Ansible playbook встановлює й налаштовує:

1. **Tailscale** — mesh VPN для безпечного віддаленого доступу
2. **UFW firewall** — лише порти SSH + Tailscale
3. **Docker CE + Compose V2** — для sandbox агентів
4. **Node.js 24 + pnpm** — залежності runtime (Node 22 LTS, наразі `22.14+`, і далі підтримується)
5. **OpenClaw** — на хості, не в контейнері
6. **Сервіс systemd** — автозапуск із посиленням безпеки

<Note>
Gateway запускається безпосередньо на хості (не в Docker), але sandbox агентів використовують Docker для ізоляції. Докладніше див. у [Sandboxing](/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перейдіть до користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер початкового налаштування">
    Скрипт після встановлення проведе вас через налаштування параметрів OpenClaw.
  </Step>
  <Step title="Підключіть провайдерів повідомлень">
    Увійдіть у WhatsApp, Telegram, Discord або Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Перевірте встановлення">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Підключіться до Tailscale">
    Приєднайтеся до своєї VPN mesh для безпечного віддаленого доступу.
  </Step>
</Steps>

### Швидкі команди

```bash
# Перевірити стан сервісу
sudo systemctl status openclaw

# Переглянути live-журнали
sudo journalctl -u openclaw -f

# Перезапустити gateway
sudo systemctl restart openclaw

# Вхід провайдера (запускати як користувач openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Архітектура безпеки

Розгортання використовує 4-рівневу модель захисту:

1. **Firewall (UFW)** — публічно відкриті лише SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — gateway доступний лише через VPN mesh
3. **Ізоляція Docker** — ланцюг iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Посилення systemd** — NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Має бути відкритий лише порт 22 (SSH). Усі інші сервіси (gateway, Docker) заблоковано.

Docker установлюється для sandbox агентів (ізольоване виконання інструментів), а не для запуску самого gateway. Див. [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) щодо конфігурації sandbox.

## Ручне встановлення

Якщо ви віддаєте перевагу ручному контролю замість автоматизації:

<Steps>
  <Step title="Установіть передумови">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Клонуйте репозиторій">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Установіть колекції Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Запустіть playbook">
    ```bash
    ./run-playbook.sh
    ```

    Або запустіть напряму, а потім вручну виконайте скрипт налаштування:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Потім виконайте: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Оновлення

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Стандартний сценарій оновлення див. в [Updating](/install/updating).

Щоб повторно запустити playbook Ansible (наприклад, для змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентно й безпечно для багаторазового запуску.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Firewall блокує моє підключення">
    - Спочатку переконайтеся, що ви можете підключитися через Tailscale VPN
    - Доступ через SSH (порт 22) завжди дозволений
    - Gateway за задумом доступний лише через Tailscale
  </Accordion>
  <Accordion title="Сервіс не запускається">
    ```bash
    # Перевірити журнали
    sudo journalctl -u openclaw -n 100

    # Перевірити права доступу
    sudo ls -la /opt/openclaw

    # Перевірити ручний запуск
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблеми з Docker sandbox">
    ```bash
    # Перевірити, чи працює Docker
    sudo systemctl status docker

    # Перевірити образ sandbox
    sudo docker images | grep openclaw-sandbox

    # Зібрати образ sandbox, якщо його немає
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Не вдається виконати вхід провайдера">
    Переконайтеся, що ви працюєте як користувач `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

Докладніше про архітектуру безпеки та усунення несправностей див. у репозиторії openclaw-ansible:

- [Архітектура безпеки](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Технічні деталі](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Посібник з усунення несправностей](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- повний посібник із розгортання
- [Docker](/install/docker) -- налаштування gateway у контейнері
- [Sandboxing](/gateway/sandboxing) -- конфігурація sandbox агентів
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- ізоляція для кожного агента окремо
