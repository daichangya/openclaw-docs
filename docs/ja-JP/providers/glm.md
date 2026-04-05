---
read_when:
    - OpenClawでGLMモデルを使いたい場合
    - モデル命名規則とセットアップが必要な場合
summary: GLMモデルファミリーの概要とOpenClawでの使い方
title: GLM Models
x-i18n:
    generated_at: "2026-04-05T12:53:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# GLM Models

GLMは、Z.AIプラットフォームで利用できる**モデルファミリー**（企業名ではありません）です。OpenClawでは、GLM
モデルは `zai` providerと、`zai/glm-5` のようなmodel ID経由で利用します。

## CLIセットアップ

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## 設定スニペット

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` を使うと、OpenClawはキーから対応するZ.AI endpointを検出し、
正しいbase URLを自動適用します。特定のCoding Planまたはgeneral API surfaceを
強制したい場合は、明示的なリージョンchoiceを使ってください。

## 現在同梱されているGLMモデル

OpenClawは現在、bundled `zai` providerに次のGLM refsを初期投入しています:

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

## 注意

- GLMのversionと提供状況は変わることがあるため、最新情報はZ.AIのdocsを確認してください。
- デフォルトのbundled model refは `zai/glm-5` です。
- providerの詳細は [/providers/zai](/providers/zai) を参照してください。
