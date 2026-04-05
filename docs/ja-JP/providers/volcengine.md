---
read_when:
    - OpenClawでVolcano EngineまたはDoubao modelを使いたい
    - Volcengine API keyのセットアップが必要
summary: Volcano Engineセットアップ（Doubao model、general + coding endpoint）
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T12:54:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine providerは、Doubao modelおよびVolcano Engine上でホストされるサードパーティmodelへのアクセスを提供し、general workloadとcoding
workloadで別々のendpointを持ちます。

- Provider: `volcengine`（general）+ `volcengine-plan`（coding）
- Auth: `VOLCANO_ENGINE_API_KEY`
- API: OpenAI互換

## クイックスタート

1. API keyを設定します:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. デフォルトmodelを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## 非対話の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providerとendpoint

| Provider          | Endpoint                                  | 用途               |
| ----------------- | ----------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | General model      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding model       |

両providerは1つのAPI keyから設定されます。セットアップでは両方が
自動的に登録されます。

## 利用可能なmodel

General provider（`volcengine`）:

| Model ref                                    | Name                            | Input       | Context |
| -------------------------------------------- | ------------------------------- | ----------- | ------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |

Coding provider（`volcengine-plan`）:

| Model ref                                         | Name                     | Input | Context |
| ------------------------------------------------- | ------------------------ | ----- | ------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |

`openclaw onboard --auth-choice volcengine-api-key` は現在、
`volcengine-plan/ark-code-latest` をデフォルトmodelとして設定しつつ、
generalな `volcengine` catalogも登録します。

onboarding/configureのmodel選択中、Volcengine auth choiceは
`volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのmodelがまだ読み込まれていない場合、OpenClawは空のproviderスコープpickerを表示する代わりに、フィルターなしcatalogへフォールバックします。

## 環境に関する注意

Gatewayをdaemon（launchd/systemd）として動かす場合、
`VOLCANO_ENGINE_API_KEY` がそのprocessから利用可能であることを確認してください（たとえば
`~/.openclaw/.env` または `env.shellEnv` 経由）。
