---
read_when:
    - Ви хочете використовувати GitHub Copilot як провайдера моделей
    - Вам потрібен процес `openclaw models auth login-github-copilot`
summary: Увійдіть у GitHub Copilot з OpenClaw за допомогою device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T18:14:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Що таке GitHub Copilot?

GitHub Copilot — це AI-асистент для програмування від GitHub. Він надає доступ до
моделей Copilot для вашого облікового запису GitHub і тарифного плану. OpenClaw може використовувати Copilot як
провайдера моделей двома різними способами.

## Два способи використовувати Copilot в OpenClaw

### 1) Вбудований провайдер GitHub Copilot (`github-copilot`)

Використовуйте нативний процес входу через device flow, щоб отримати токен GitHub, а потім обмінювати його на
API-токени Copilot під час роботи OpenClaw. Це **типовий** і найпростіший шлях,
оскільки він не потребує VS Code.

### 2) Плагін Copilot Proxy (`copilot-proxy`)

Використовуйте розширення VS Code **Copilot Proxy** як локальний міст. OpenClaw взаємодіє з
кінцевою точкою проксі `/v1` і використовує список моделей, який ви там налаштуєте. Обирайте цей варіант,
якщо ви вже запускаєте Copilot Proxy у VS Code або вам потрібно маршрутизувати через нього.
Ви маєте ввімкнути плагін і тримати розширення VS Code запущеним.

Використовуйте GitHub Copilot як провайдера моделей (`github-copilot`). Команда входу запускає
GitHub device flow, зберігає профіль автентифікації та оновлює вашу конфігурацію для використання цього
профілю.

## Налаштування CLI

```bash
openclaw models auth login-github-copilot
```

Вам буде запропоновано відвідати URL-адресу й ввести одноразовий код. Не закривайте термінал,
доки процес не завершиться.

### Необов’язкові прапорці

```bash
openclaw models auth login-github-copilot --yes
```

Щоб також застосувати рекомендовану типову модель провайдера за один крок, використовуйте
натомість загальну команду автентифікації:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Установлення типової моделі

```bash
openclaw models set github-copilot/gpt-4o
```

### Фрагмент конфігурації

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Примітки

- Потрібен інтерактивний TTY; запускайте команду безпосередньо в терміналі.
- Доступність моделей Copilot залежить від вашого тарифного плану; якщо модель відхиляється, спробуйте
  інший ідентифікатор (наприклад, `github-copilot/gpt-4.1`).
- Ідентифікатори моделей Claude автоматично використовують транспорт Anthropic Messages; моделі GPT, o-series
  і Gemini зберігають транспорт OpenAI Responses.
- Вхід зберігає токен GitHub у сховищі профілів автентифікації та обмінює його на
  API-токен Copilot під час роботи OpenClaw.
