---
read_when:
    - Você quer modelos StepFun no OpenClaw
    - Você precisa de orientações de configuração do StepFun
summary: Use modelos StepFun com o OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T12:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

O OpenClaw inclui um plugin de provedor StepFun empacotado com dois ids de provedor:

- `stepfun` para o endpoint padrão
- `stepfun-plan` para o endpoint Step Plan

Os catálogos integrados atualmente diferem por superfície:

- Padrão: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Visão geral de região e endpoint

- Endpoint padrão da China: `https://api.stepfun.com/v1`
- Endpoint padrão global: `https://api.stepfun.ai/v1`
- Endpoint Step Plan da China: `https://api.stepfun.com/step_plan/v1`
- Endpoint Step Plan global: `https://api.stepfun.ai/step_plan/v1`
- Variável de ambiente de autenticação: `STEPFUN_API_KEY`

Use uma chave da China com os endpoints `.com` e uma chave global com os
endpoints `.ai`.

## Configuração da CLI

Configuração interativa:

```bash
openclaw onboard
```

Escolha uma destas opções de autenticação:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Exemplos não interativos:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Refs de modelo

- Modelo padrão Standard: `stepfun/step-3.5-flash`
- Modelo padrão Step Plan: `stepfun-plan/step-3.5-flash`
- Modelo alternativo Step Plan: `stepfun-plan/step-3.5-flash-2603`

## Catálogos integrados

Padrão (`stepfun`):

| Ref de modelo            | Contexto | Saída máxima | Observações              |
| ------------------------ | -------- | ------------ | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144  | 65,536       | Modelo padrão Standard   |

Step Plan (`stepfun-plan`):

| Ref de modelo                      | Contexto | Saída máxima | Observações                  |
| ---------------------------------- | -------- | ------------ | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536       | Modelo padrão Step Plan      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536       | Modelo adicional Step Plan   |

## Trechos de configuração

Provedor padrão:

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      stepfun: {
        baseUrl: "https://api.stepfun.ai/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Provedor Step Plan:

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      "stepfun-plan": {
        baseUrl: "https://api.stepfun.ai/step_plan/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
          {
            id: "step-3.5-flash-2603",
            name: "Step 3.5 Flash 2603",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Observações

- O provedor é empacotado com o OpenClaw, então não existe uma etapa separada de instalação de plugin.
- `step-3.5-flash-2603` atualmente é exposto apenas em `stepfun-plan`.
- Um único fluxo de autenticação grava perfis correspondentes à região para `stepfun` e `stepfun-plan`, para que ambas as superfícies possam ser descobertas juntas.
- Use `openclaw models list` e `openclaw models set <provider/model>` para inspecionar ou trocar modelos.
- Para a visão geral mais ampla de provedores, consulte [Provedores de modelo](/pt-BR/concepts/model-providers).
