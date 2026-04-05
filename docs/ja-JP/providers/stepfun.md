---
read_when:
    - OpenClawでStepFun modelを使いたい
    - StepFunのセットアップ手順が必要
summary: OpenClawでStepFun modelを使う
title: StepFun
x-i18n:
    generated_at: "2026-04-05T12:54:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClawには、2つのprovider idを持つStepFun provider pluginがバンドルされています。

- 標準endpoint用の `stepfun`
- Step Plan endpoint用の `stepfun-plan`

現在、組み込みcatalogはsurfaceごとに異なります。

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Regionとendpointの概要

- 中国向けstandard endpoint: `https://api.stepfun.com/v1`
- グローバルstandard endpoint: `https://api.stepfun.ai/v1`
- 中国向けStep Plan endpoint: `https://api.stepfun.com/step_plan/v1`
- グローバルStep Plan endpoint: `https://api.stepfun.ai/step_plan/v1`
- Auth env var: `STEPFUN_API_KEY`

中国向けkeyは `.com`
endpointで、グローバルkeyは `.ai`
endpointで使ってください。

## CLIセットアップ

対話型セットアップ:

```bash
openclaw onboard
```

次のauth choiceのいずれかを選びます。

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

非対話の例:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Model ref

- Standardデフォルトmodel: `stepfun/step-3.5-flash`
- Step Planデフォルトmodel: `stepfun-plan/step-3.5-flash`
- Step Plan代替model: `stepfun-plan/step-3.5-flash-2603`

## 組み込みcatalog

Standard（`stepfun`）:

| Model ref                | Context | Max output | Notes                    |
| ------------------------ | ------- | ---------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | デフォルトstandard model |

Step Plan（`stepfun-plan`）:

| Model ref                          | Context | Max output | Notes                         |
| ---------------------------------- | ------- | ---------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | デフォルトStep Plan model     |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 追加のStep Plan model         |

## Configスニペット

Standard provider:

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

Step Plan provider:

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

## 注意

- providerはOpenClawにバンドルされているため、別途pluginをインストールする手順はありません。
- `step-3.5-flash-2603` は現在 `stepfun-plan` でのみ公開されています。
- 1つのauthフローで、`stepfun` と `stepfun-plan` の両方に対してregion一致のprofileが書き込まれるため、両方のsurfaceをまとめて検出できます。
- modelの確認や切り替えには `openclaw models list` と `openclaw models set <provider/model>` を使ってください。
- より広いprovider概要については [Model providers](/concepts/model-providers) を参照してください。
