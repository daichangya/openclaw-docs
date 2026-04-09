---
read_when:
    - OpenClawでQwenを使いたい場合
    - 以前Qwen OAuthを使っていた場合
summary: OpenClawにバンドルされたqwenプロバイダー経由でQwen Cloudを使う
title: Qwen
x-i18n:
    generated_at: "2026-04-09T01:31:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4786df2cb6ec1ab29d191d012c61dcb0e5468bf0f8561fbbb50eed741efad325
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuthは削除されました。** `portal.qwen.ai`エンドポイントを使用していた
無料枠のOAuth統合（`qwen-portal`）は、現在は利用できません。
背景については[Issue #49557](https://github.com/openclaw/openclaw/issues/49557)を参照してください。

</Warning>

## 推奨: Qwen Cloud

OpenClawは現在、Qwenを正規ID
`qwen`を持つ第一級のバンドル済みプロバイダーとして扱います。バンドル済みプロバイダーはQwen Cloud / Alibaba DashScopeおよび
Coding Planエンドポイントを対象とし、レガシーな`modelstudio` IDも
互換エイリアスとして引き続き利用できます。

- プロバイダー: `qwen`
- 推奨env var: `QWEN_API_KEY`
- 互換性のため引き続き受け付けられるもの: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- APIスタイル: OpenAI互換

`qwen3.6-plus`を使いたい場合は、**Standard（従量課金）**エンドポイントを優先してください。
Coding Planのサポートは公開カタログに遅れることがあります。

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

レガシーな`modelstudio-*` auth-choice IDと`modelstudio/...`モデル参照も
互換エイリアスとして引き続き動作しますが、新しいセットアップフローでは正規の
`qwen-*` auth-choice IDと`qwen/...`モデル参照を優先してください。

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

## プラン種別とエンドポイント

| プラン                     | リージョン | auth choice                | エンドポイント                                   |
| -------------------------- | ---------- | -------------------------- | ------------------------------------------------ |
| Standard（従量課金）       | China      | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（従量課金）       | Global     | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（サブスクリプション） | China      | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（サブスクリプション） | Global     | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

プロバイダーは、auth choiceに基づいて自動的にエンドポイントを選択します。正規の
choiceは`qwen-*`ファミリーを使用し、`modelstudio-*`は互換専用のままです。
設定内のカスタム`baseUrl`で上書きすることもできます。

ネイティブModel Studioエンドポイントは、共有の
`openai-completions` transport上でstreaming usage互換性を公開します。OpenClawは現在、
これをエンドポイント機能に基づいて判定するため、同じネイティブホストを対象とするDashScope互換のカスタムプロバイダーIDも、
組み込みの`qwen`プロバイダーIDを特別に要求することなく、
同じstreaming-usage挙動を継承します。

## APIキーの取得

- **キー管理**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **ドキュメント**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## 組み込みカタログ

OpenClawには現在、このバンドル済みQwenカタログが同梱されています。設定済みカタログは
エンドポイントを認識しており、Coding Plan設定ではStandardエンドポイントでのみ動作が確認されている
モデルは除外されます。

| モデル参照                  | 入力        | コンテキスト | 注記                                               |
| --------------------------- | ----------- | ------------ | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000    | デフォルトモデル                                   |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000    | このモデルが必要な場合はStandardエンドポイントを優先 |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144      | Qwen Max系                                         |
| `qwen/qwen3-coder-next`     | text        | 262,144      | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000    | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000    | Reasoning有効                                      |
| `qwen/glm-5`                | text        | 202,752      | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752      | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144      | Alibaba経由のMoonshot AI                           |

モデルがバンドル済みカタログに存在していても、エンドポイントや課金プランによって利用可否が変わる場合があります。

ネイティブstreaming使用量互換性は、Coding Planホストと
Standard DashScope互換ホストの両方に適用されます:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Qwen 3.6 Plusの利用可否

`qwen3.6-plus`は、Standard（従量課金）Model Studio
エンドポイントで利用できます:

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Coding Planエンドポイントが`qwen3.6-plus`に対して
「unsupported model」エラーを返す場合は、Coding Planの
エンドポイント/キー組ではなく、Standard（従量課金）へ切り替えてください。

## capability計画

`qwen`拡張は、単なるcoding/textモデルだけでなく、Qwen
Cloudサーフェス全体のベンダーホームとして位置付けられつつあります。

- テキスト/チャットモデル: 現在バンドル済み
- Tool calling、structured output、thinking: OpenAI互換transportから継承
- 画像生成: provider-pluginレイヤーで計画中
- 画像/動画理解: 現在Standardエンドポイントでバンドル済み
- 音声/オーディオ: provider-pluginレイヤーで計画中
- メモリembedding/reranking: embedding adapterサーフェス経由で計画中
- 動画生成: 共有の動画生成capability経由で現在バンドル済み

## マルチモーダル追加機能

`qwen`拡張は現在、以下も公開しています:

- `qwen-vl-max-latest`経由の動画理解
- 以下によるWan動画生成:
  - `wan2.6-t2v`（デフォルト）
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

これらのマルチモーダルサーフェスは、Coding Planエンドポイントではなく、
**Standard** DashScopeエンドポイントを使用します。

- Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

動画生成では、OpenClawはジョブ送信前に、設定されたQwenリージョンを対応する
DashScope AIGCホストへマッピングします:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

つまり、Coding PlanまたはStandard Qwenホストのどちらかを指す通常の
`models.providers.qwen.baseUrl`を使っていても、動画生成は引き続き正しい
リージョンのDashScope動画エンドポイントを使用します。

動画生成では、デフォルトモデルを明示的に設定してください:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

現在のバンドル済みQwen動画生成の制限:

- 1リクエストあたり最大**1**本の出力動画
- 最大**1**枚の入力画像
- 最大**4**本の入力動画
- 最大**10秒**のduration
- `size`, `aspectRatio`, `resolution`, `audio`, `watermark`をサポート
- 参照画像/動画モードでは、現在**リモートhttp(s) URL**が必須です。ローカル
  ファイルパスは、DashScope動画エンドポイントがそれらの参照に対して
  アップロードされたローカルバッファを受け付けないため、事前に拒否されます。

共有ツールの
パラメータ、プロバイダー選択、フェイルオーバー挙動については、[Video Generation](/ja-JP/tools/video-generation)を参照してください。

## 環境に関する注記

Gatewayがデーモン（launchd/systemd）として実行される場合は、`QWEN_API_KEY`が
そのプロセスから利用可能であることを確認してください（たとえば`~/.openclaw/.env`や
`env.shellEnv`経由）。
