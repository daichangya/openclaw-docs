---
x-i18n:
    generated_at: "2026-04-05T12:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "OpenClawの同梱 `qwen` provider経由でQwen Cloudを使う"
read_when:

- OpenClawでQwenを使いたい場合
- 以前Qwen OAuthを使っていた場合
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuthは削除されました。**  
`portal.qwen.ai` エンドポイントを使っていた無料tierのOAuth統合
（`qwen-portal`）は、現在は利用できません。
背景については [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) を参照してください。

</Warning>

## 推奨: Qwen Cloud

OpenClawは現在、Qwenを正規id
`qwen` を持つ第一級の同梱providerとして扱います。この同梱providerはQwen Cloud / Alibaba DashScopeおよび
Coding Planのエンドポイントを対象にしており、legacyな `modelstudio` idsも
互換aliasとして引き続き動作します。

- Provider: `qwen`
- 推奨env var: `QWEN_API_KEY`
- 互換性のため引き続き受け付けるもの: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API形式: OpenAI互換

`qwen3.6-plus` を使いたい場合は、**Standard（従量課金）** エンドポイントを推奨します。
Coding Planのサポートは、公開catalogより遅れることがあります。

```bash
# Global Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key

# China Coding Plan endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key

# China Standard (pay-as-you-go) endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

legacyな `modelstudio-*` auth-choice idsおよび `modelstudio/...` model refsも
互換aliasとして引き続き動作しますが、新しいセットアップフローでは正規の
`qwen-*` auth-choice idsと `qwen/...` model refsを優先してください。

オンボーディング後、デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Capability plan

`qwen` extensionは、単なるcoding/text modelsではなく、
Qwen Cloud全体のベンダーホームとして位置付けられつつあります。

- Text/chat models: 現在同梱済み
- Tool calling、structured output、thinking: OpenAI互換transportから継承
- Image generation: provider-plugin layerで対応予定
- Image/video understanding: Standard endpointで現在同梱済み
- Speech/audio: provider-plugin layerで対応予定
- Memory embeddings/reranking: embedding adapter surface経由で対応予定
- Video generation: 共有video-generation capability経由で現在同梱済み

## マルチモーダル追加機能

`qwen` extensionは現在、次も公開しています:

- `qwen-vl-max-latest` によるvideo understanding
- Wan video generation:
  - `wan2.6-t2v`（デフォルト）
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

これらのマルチモーダル機能は、Coding Planエンドポイントではなく
**Standard** DashScopeエンドポイントを使用します。

- Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

video generationでは、OpenClawはジョブ送信前に、設定されたQwenリージョンを対応する
DashScope AIGC hostへマッピングします:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

これは、通常の `models.providers.qwen.baseUrl` が
Coding PlanまたはStandard Qwen hostのいずれを指していても、video generationが
正しいリージョンのDashScope video endpointを引き続き使用することを意味します。

video generationでは、デフォルトモデルを明示的に設定してください:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

現在同梱されているQwenのvideo-generation制限:

- リクエストごとに最大 **1** 本の出力動画
- 最大 **1** 枚の入力画像
- 最大 **4** 本の入力動画
- 最大 **10秒** の長さ
- `size`, `aspectRatio`, `resolution`, `audio`, `watermark` をサポート

エンドポイントレベルの詳細と互換性に関する注意は
[Qwen / Model Studio](/providers/qwen_modelstudio) を参照してください。
