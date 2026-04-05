---
read_when:
    - OpenClaw で Chutes を使いたい場合
    - OAuth または API キーのセットアップ手順が必要な場合
    - デフォルトモデル、エイリアス、または検出動作を知りたい場合
summary: Chutes のセットアップ（OAuth または API キー、モデル検出、エイリアス）
title: Chutes
x-i18n:
    generated_at: "2026-04-05T12:53:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) は、オープンソースのモデルカタログを
OpenAI 互換 API を通じて提供します。OpenClaw は、bundled の `chutes` provider に対して
ブラウザー OAuth と直接 API キー auth の両方をサポートしています。

- Provider: `chutes`
- API: OpenAI 互換
- Base URL: `https://llm.chutes.ai/v1`
- Auth:
  - OAuth: `openclaw onboard --auth-choice chutes`
  - API キー: `openclaw onboard --auth-choice chutes-api-key`
  - 実行時 env vars: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## クイックスタート

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw はローカルではブラウザーフローを起動し、リモート / ヘッドレスホストでは URL + リダイレクト貼り付け
フローを表示します。OAuth token は OpenClaw の auth profile を通じて自動更新されます。

任意の OAuth 上書き:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API キー

```bash
openclaw onboard --auth-choice chutes-api-key
```

キーは
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) で取得してください。

どちらの auth 経路でも、bundled の Chutes カタログが登録され、デフォルトモデルは
`chutes/zai-org/GLM-4.7-TEE` に設定されます。

## 検出動作

Chutes の auth が利用可能な場合、OpenClaw はその認証情報で Chutes カタログに問い合わせ、
検出されたモデルを使用します。検出に失敗した場合でも、オンボーディングと起動が引き続き動作するように、
OpenClaw は bundled の静的カタログにフォールバックします。

## デフォルトエイリアス

OpenClaw は、bundled の Chutes
カタログに対して次の 3 つの便利なエイリアスも登録します:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## 組み込みのスターターカタログ

bundled のフォールバックカタログには、現在の Chutes ref として次が含まれます:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## config の例

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## 注意

- OAuth ヘルプと redirect app 要件: [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)
- API キーと OAuth の検出は、どちらも同じ `chutes` provider id を使用します。
- Chutes モデルは `chutes/<model-id>` として登録されます。
