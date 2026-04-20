---
read_when:
    - Вам потрібне автоматизоване розгортання сервера з посиленням безпеки
    - Вам потрібне налаштування з ізоляцією брандмауером і доступом через VPN
    - Ви розгортаєте на віддалених серверах Debian/Ubuntu
summary: Автоматизоване, захищене встановлення OpenClaw за допомогою Ansible, VPN Tailscale та ізоляції брандмауером
title: Ansible
x-i18n:
    generated_at: "2026-04-20T18:29:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Встановлення Ansible

Розгорніть OpenClaw на production-серверах за допомогою **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — автоматизованого інсталятора з архітектурою, орієнтованою на безпеку.

<Info>
Репозиторій [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) є основним джерелом правди для розгортання через Ansible. Ця сторінка — короткий огляд.
</Info>

## Передумови

| Вимога | Деталі |
| ----------- | --------------------------------------------------------- |
| **ОС**      | Debian 11+ або Ubuntu 20.04+                               |
| **Доступ**  | Права root або sudo                                   |
| **Мережа** | Підключення до інтернету для встановлення пакунків              |
| **Ansible** | 2.14+ (встановлюється автоматично скриптом швидкого старту) |

## Що ви отримаєте

- **Безпека, орієнтована насамперед на брандмауер** — UFW + ізоляція Docker (доступні лише SSH + Tailscale)
- **VPN Tailscale** — безпечний віддалений доступ без публічного відкриття сервісів
- **Docker** — ізольовані sandbox-контейнери, прив’язки лише до localhost
- **Багаторівневий захист** — 4-рівнева архітектура безпеки
- **Інтеграція з Systemd** — автоматичний запуск під час завантаження з посиленням безпеки
- **Налаштування однією командою** — повне розгортання за лічені хвилини

## Швидкий старт

Встановлення однією командою:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Що буде встановлено

Ansible playbook встановлює та налаштовує:

1. **Tailscale** — mesh VPN для безпечного віддаленого доступу
2. **Брандмауер UFW** — лише порти SSH + Tailscale
3. **Docker CE + Compose V2** — для стандартного sandbox-бекенда агента
4. **Node.js 24 + pnpm** — залежності середовища виконання (Node 22 LTS, наразі `22.14+`, залишається підтримуваним)
5. **OpenClaw** — на хості, не контейнеризований
6. **Сервіс Systemd** — автозапуск із посиленням безпеки

<Note>
Gateway працює безпосередньо на хості (не в Docker). Sandbox-ізоляція агента є
необов’язковою; цей playbook встановлює Docker, оскільки це стандартний sandbox-
бекенд. Докладніше та про інші бекенди див. у [Sandboxing](/uk/gateway/sandboxing).
</Note>

## Налаштування після встановлення

<Steps>
  <Step title="Перейдіть до користувача openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Запустіть майстер початкового налаштування">
    Післяінсталяційний скрипт допоможе вам налаштувати параметри OpenClaw.
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
    Приєднайтеся до вашої VPN mesh-мережі для безпечного віддаленого доступу.
  </Step>
</Steps>

### Швидкі команди

```bash
# Перевірити стан сервісу
sudo systemctl status openclaw

# Переглянути журнали в реальному часі
sudo journalctl -u openclaw -f

# Перезапустити gateway
sudo systemctl restart openclaw

# Вхід провайдера (запускати як користувач openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Архітектура безпеки

Розгортання використовує 4-рівневу модель захисту:

1. **Брандмауер (UFW)** — публічно відкриті лише SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** — Gateway доступний лише через VPN mesh
3. **Ізоляція Docker** — ланцюг iptables DOCKER-USER запобігає зовнішньому відкриттю портів
4. **Посилення Systemd** — NoNewPrivileges, PrivateTmp, непривілейований користувач

Щоб перевірити вашу зовнішню поверхню атаки:

```bash
nmap -p- YOUR_SERVER_IP
```

Має бути відкритий лише порт 22 (SSH). Усі інші сервіси (gateway, Docker) заблоковані.

Docker встановлюється для sandbox-середовищ агентів (ізольоване виконання інструментів), а не для запуску самого gateway. Див. [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) щодо налаштування sandbox.

## Ручне встановлення

Якщо ви надаєте перевагу ручному контролю над автоматизацією:

<Steps>
  <Step title="Встановіть передумови">
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
  <Step title="Встановіть колекції Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Запустіть playbook">
    ```bash
    ./run-playbook.sh
    ```

    Або запустіть безпосередньо, а потім вручну виконайте скрипт налаштування:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Потім виконайте: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Оновлення

Інсталятор Ansible налаштовує OpenClaw для ручних оновлень. Стандартний процес оновлення див. у [Updating](/uk/install/updating).

Щоб повторно запустити Ansible playbook (наприклад, для змін конфігурації):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Це ідемпотентно та безпечно для багаторазового запуску.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Брандмауер блокує моє з’єднання">
    - Спочатку переконайтеся, що ви маєте доступ через VPN Tailscale
    - Доступ SSH (порт 22) завжди дозволений
    - Gateway за задумом доступний лише через Tailscale
  </Accordion>
  <Accordion title="Сервіс не запускається">
    ```bash
    # Перевірити журнали
    sudo journalctl -u openclaw -n 100

    # Перевірити дозволи
    sudo ls -la /opt/openclaw

    # Перевірити ручний запуск
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Проблеми з sandbox Docker">
    ```bash
    # Переконатися, що Docker запущений
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

## Розширене налаштування

Детальну інформацію про архітектуру безпеки та усунення несправностей див. у репозиторії openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Пов’язане

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — повний посібник із розгортання
- [Docker](/uk/install/docker) — контейнеризоване налаштування gateway
- [Sandboxing](/uk/gateway/sandboxing) — налаштування sandbox агента
- [Multi-Agent Sandbox and Tools](/uk/tools/multi-agent-sandbox-tools) — ізоляція для кожного агента
