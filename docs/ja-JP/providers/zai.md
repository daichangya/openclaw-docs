---
read_when:
    - OpenClawでZ.AI / GLM modelsを使いたいとき
    - シンプルな `ZAI_API_KEY` セットアップが必要なとき
summary: OpenClawでZ.AI（GLM models）を使う
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T12:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AIは **GLM** models向けのAPIプラットフォームです。GLM向けREST APIを提供し、認証にはAPI keysを使用します。Z.AI consoleでAPI keyを作成してください。OpenClawは `zai` providerをZ.AI API keyとともに使用します。

## CLIセットアップ

```bash
# endpoint自動検出付きの汎用API-keyセットアップ
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global。Coding Plan利用者向けの推奨
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN（中国リージョン）。Coding Plan利用者向けの推奨
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN（中国リージョン）
openclaw onboard --auth-choice zai-cn
```

## Config snippet

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` を使うと、OpenClawはkeyから一致するZ.AI endpointを検出し、
正しいbase URLを自動的に適用できます。特定のCoding Planまたはgeneral API surfaceを
強制したい場合は、明示的なリージョン選択を使ってください。

## Bundled GLM catalog

OpenClawは現在、bundledの `zai` providerを次で初期化します。

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## 注

- GLM modelsは `zai/<model>` として利用できます（例: `zai/glm-5`）。
- デフォルトのbundled model ref: `zai/glm-5`
- 未知の `glm-5*` idも、idが現在のGLM-5 family形状に一致する場合は
  `glm-4.7` templateからprovider所有metadataを合成することで、
  bundled provider path上でforward-resolveされます。
- Z.AIのtool-call streamingでは、`tool_stream` はデフォルトで有効です。無効にするには
  `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
- model familyの概要は [/providers/glm](/providers/glm) を参照してください。
- Z.AIは、API keyを使ったBearer authを使用します。
