---
read_when:
    - Ви хочете, щоб Prometheus, Grafana, VictoriaMetrics або інший збирач збирав метрики Gateway OpenClaw
    - Вам потрібні назви метрик Prometheus і політика міток для панелей моніторингу або сповіщень
    - Ви хочете отримувати метрики без запуску збирача OpenTelemetry
summary: Експонуйте діагностику OpenClaw як текстові метрики Prometheus через плагін diagnostics-prometheus
title: метрики Prometheus
x-i18n:
    generated_at: "2026-04-26T09:19:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75ef930b0c38d056a462eef3f5c4effdd2515ccbff2b8d2b6235ce171eef8b54
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw може експонувати діагностичні метрики через вбудований
плагін `diagnostics-prometheus`. Він прослуховує довірену внутрішню діагностику та
віддає текстову кінцеву точку Prometheus за адресою:

```text
/api/diagnostics/prometheus
```

Маршрут використовує автентифікацію Gateway. Не експонуйте його як публічну
неавтентифіковану кінцеву точку `/metrics`.

## Швидкий старт

```json5
{
  plugins: {
    allow: ["diagnostics-prometheus"],
    entries: {
      "diagnostics-prometheus": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
  },
}
```

Ви також можете ввімкнути плагін з CLI:

```bash
openclaw plugins enable diagnostics-prometheus
```

Після цього налаштуйте збір із захищеного маршруту Gateway з тією самою автентифікацією Gateway,
яку ви використовуєте для API операторів.

## Експортовані метрики

| Метрика                                       | Тип       | Мітки                                                                                     |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | лічильник | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | гістограма | `channel`, `model`, `outcome`, `provider`, `trigger`                                     |
| `openclaw_model_call_total`                   | лічильник | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | гістограма | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                     |
| `openclaw_model_tokens_total`                 | лічильник | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | гістограма | `model`, `provider`, `token_type`                                                        |
| `openclaw_model_cost_usd_total`               | лічильник | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | лічильник | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | гістограма | `error_category`, `outcome`, `params_kind`, `tool`                                       |
| `openclaw_harness_run_total`                  | лічильник | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | гістограма | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | лічильник | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | гістограма | `channel`, `outcome`, `reason`                                                           |
| `openclaw_message_delivery_total`             | лічильник | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | гістограма | `channel`, `delivery_kind`, `error_category`, `outcome`                                  |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | гістограма | `lane`                                                                                   |
| `openclaw_session_state_total`                | лічильник | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | гістограма | none                                                                                     |
| `openclaw_memory_pressure_total`              | лічильник | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | лічильник | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | лічильник | none                                                                                      |

## Політика міток

Мітки Prometheus залишаються обмеженими та низькокардинальними. Експортер не віддає
сирі діагностичні ідентифікатори, такі як `runId`, `sessionKey`, `sessionId`, `callId`,
`toolCallId`, ID повідомлень, ID чатів або ID запитів провайдера.

Значення міток редагуються та мають відповідати політиці OpenClaw щодо символів
для низькокардинальних значень. Значення, які не проходять цю перевірку, замінюються
на `unknown`, `other` або `none` залежно від метрики.

Експортер обмежує кількість часових рядів, що утримуються в пам’яті. Якщо ліміт досягнуто,
нові ряди відкидаються, а `openclaw_prometheus_series_dropped_total` збільшується.

Для повних трасувань, журналів, експорту OTLP і семантичних атрибутів GenAI в OpenTelemetry
використовуйте [експорт OpenTelemetry](/uk/gateway/opentelemetry).
