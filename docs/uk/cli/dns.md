---
read_when:
    - Ви хочете глобальне виявлення (DNS-SD) через Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Довідка CLI для `openclaw dns` (допоміжні засоби виявлення в глобальній мережі)
title: DNS
x-i18n:
    generated_at: "2026-04-24T04:12:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Допоміжні засоби DNS для глобального виявлення (Tailscale + CoreDNS). Наразі зосереджено на macOS + Homebrew CoreDNS.

Пов’язане:

- Виявлення Gateway: [Виявлення](/uk/gateway/discovery)
- Конфігурація глобального виявлення: [Конфігурація](/uk/gateway/configuration)

## Налаштування

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Планування або застосування налаштування CoreDNS для унікатного виявлення DNS-SD.

Параметри:

- `--domain <domain>`: домен глобального виявлення (наприклад, `openclaw.internal`)
- `--apply`: встановити або оновити конфігурацію CoreDNS і перезапустити сервіс (потрібен sudo; лише macOS)

Що показується:

- визначений домен виявлення
- шлях до файлу зони
- поточні IP tailnet
- рекомендована конфігурація виявлення `openclaw.json`
- значення сервера імен/домену Tailscale Split DNS, які слід встановити

Примітки:

- Без `--apply` команда є лише засобом планування й виводить рекомендоване налаштування.
- Якщо `--domain` не вказано, OpenClaw використовує `discovery.wideArea.domain` із конфігурації.
- `--apply` наразі підтримується лише на macOS і очікує Homebrew CoreDNS.
- `--apply` за потреби ініціалізує файл зони, гарантує наявність секції імпорту CoreDNS і перезапускає brew-сервіс `coredns`.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Виявлення](/uk/gateway/discovery)
