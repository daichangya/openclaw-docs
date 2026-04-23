---
read_when:
    - Ви хочете маршрутизувати OpenClaw через proxy LiteLLM
    - Вам потрібні відстеження витрат, журналювання або маршрутизація моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для уніфікованого доступу до моделей і відстеження витрат
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T06:46:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) — це LLM gateway з відкритим кодом, який надає уніфікований API до 100+ провайдерів моделей. Маршрутизуйте OpenClaw через LiteLLM, щоб отримати централізоване відстеження витрат, журналювання та гнучкість перемикання backend без зміни конфігурації OpenClaw.

<Tip>
**Навіщо використовувати LiteLLM з OpenClaw?**

- **Відстеження витрат** — бачити точні витрати OpenClaw на всі моделі
- **Маршрутизація моделей** — перемикатися між Claude, GPT-4, Gemini, Bedrock без змін конфігурації
- **Віртуальні ключі** — створювати ключі з лімітами витрат для OpenClaw
- **Журналювання** — повні журнали запитів/відповідей для налагодження
- **Резервні перемикання** — автоматичний failover, якщо основний провайдер недоступний

</Tip>

## Швидкий старт

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Найкраще для:** найшвидшого шляху до робочого налаштування LiteLLM.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **Найкраще для:** повного контролю над встановленням і конфігурацією.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Ось і все. OpenClaw тепер маршрутизується через LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Конфігурація

### Змінні середовища

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Файл конфігурації

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Додаткові теми

<AccordionGroup>
  <Accordion title="Virtual keys">
    Створіть окремий ключ для OpenClaw з лімітами витрат:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Використовуйте згенерований ключ як `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM може маршрутизувати запити до моделей на різні backend. Налаштуйте це у своєму `config.yaml` LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw і далі запитуватиме `claude-opus-4-6` — маршрутизацію оброблятиме LiteLLM.

  </Accordion>

  <Accordion title="Viewing usage">
    Переглядайте dashboard або API LiteLLM:

    ```bash
    # Інформація про ключ
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Журнали витрат
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM типово працює на `http://localhost:4000`
    - OpenClaw підключається через сумісний з OpenAI endpoint `/v1` у proxy-стилі LiteLLM
    - Власне формування запитів лише для OpenAI не застосовується через LiteLLM:
      немає `service_tier`, немає `store` для Responses, немає підказок кешу prompt і немає
      формування payload для сумісності reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються для користувацьких base URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Загальну конфігурацію провайдерів і поведінку failover див. у [Model Providers](/uk/concepts/model-providers).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Офіційна документація LiteLLM і довідник API.
  </Card>
  <Card title="Model providers" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
  <Card title="Model selection" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
</CardGroup>
