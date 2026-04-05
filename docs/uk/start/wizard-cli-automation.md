---
read_when:
    - Ви автоматизуєте онбординг у скриптах або CI
    - Вам потрібні неінтерактивні приклади для конкретних провайдерів
sidebarTitle: CLI automation
summary: Скриптовий онбординг і налаштування агента для CLI OpenClaw
title: Автоматизація CLI
x-i18n:
    generated_at: "2026-04-05T18:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 878ea3fa9f2a75cff9f1a803ccb8a52a1219102e2970883ad18e3aaec5967fd2
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# Автоматизація CLI

Використовуйте `--non-interactive` для автоматизації `openclaw onboard`.

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

## Базовий неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Додайте `--json` для машинозчитуваного підсумку.

Використовуйте `--secret-input-mode ref`, щоб зберігати посилання на змінні середовища в профілях автентифікації замість значень у відкритому вигляді.
Інтерактивний вибір між env-посиланнями та налаштованими посиланнями провайдера (`file` або `exec`) доступний у процесі онбордингу.

У неінтерактивному режимі `ref` змінні середовища провайдера мають бути встановлені в середовищі процесу.
Передавання вбудованих прапорців ключів без відповідної env-змінної тепер одразу завершується помилкою.

Приклад:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Приклади для окремих провайдерів

<AccordionGroup>
  <Accordion title="Приклад API-ключа Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Синтетичний приклад">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Замініть на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` для каталогу Go.
  </Accordion>
  <Accordion title="Приклад Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад користувацького провайдера">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` є необов’язковим. Якщо його пропущено, онбординг перевіряє `CUSTOM_API_KEY`.

    Варіант режиму ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    У цьому режимі онбординг зберігає `apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token знову доступний як застарілий/ручний шлях онбордингу.
Використовуйте його з розумінням того, що Anthropic повідомила користувачам OpenClaw, що
шлях входу Claude в OpenClaw потребує **Extra Usage**. Для виробничого використання віддавайте перевагу
API-ключу Anthropic.

## Додати ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власним робочим простором,
сесіями та профілями автентифікації. Запуск без `--workspace` відкриває майстер.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Що це налаштовує:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Типові робочі простори мають формат `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (майстер може це зробити).
- Неінтерактивні прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Пов’язані документи

- Центр онбордингу: [Онбординг (CLI)](/start/wizard)
- Повний довідник: [Довідник із налаштування CLI](/start/wizard-cli-reference)
- Довідник команд: [`openclaw onboard`](/cli/onboard)
