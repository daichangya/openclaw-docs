---
read_when:
    - OpenClaw で OpenAI モデルを使いたい場合
    - API キーではなく Codex サブスクリプション認証を使いたい場合
    - GPT-5 エージェントの実行動作をより厳格にする必要がある場合
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T00:18:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aa06fba9ac901e663685a6b26443a2f6aeb6ec3589d939522dc87cbb43497b4
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI は GPT モデル向けの開発者 API を提供しています。Codex は、サブスクリプションアクセス用の **ChatGPT サインイン** と、従量課金アクセス用の **API キー** サインインをサポートしています。Codex cloud では ChatGPT サインインが必要です。
OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

## デフォルトの対話スタイル

OpenClaw は、`openai/*` と
`openai-codex/*` の両方の実行に対して、小さな OpenAI 固有のプロンプトオーバーレイを追加できます。デフォルトでは、このオーバーレイにより、ベースとなる OpenClaw システムプロンプトを置き換えることなく、アシスタントを親しみやすく、
協調的で、簡潔かつ直接的、そして少しだけ感情表現豊かに保ちます。フレンドリーなオーバーレイでは、
全体の出力を簡潔に保ちながら、自然に合う場合に限って時折絵文字を使うことも許可されます。

設定キー:

`plugins.entries.openai.config.personality`

使用可能な値:

- `"friendly"`: デフォルト。OpenAI 固有のオーバーレイを有効にします。
- `"on"`: `"friendly"` のエイリアス。
- `"off"`: オーバーレイを無効にし、ベースの OpenClaw プロンプトのみを使用します。

適用範囲:

- `openai/*` モデルに適用されます。
- `openai-codex/*` モデルに適用されます。
- 他のプロバイダーには影響しません。

この動作はデフォルトで有効です。今後ローカル設定が変動しても `"friendly"` を維持したい場合は、
明示的に指定したままにしてください:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### OpenAI プロンプトオーバーレイを無効にする

変更されていないベースの OpenClaw プロンプトを使いたい場合は、オーバーレイを `"off"` に設定します:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

設定 CLI から直接指定することもできます:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw は実行時にこの設定を大文字小文字を区別せず正規化するため、
`"Off"` のような値でもフレンドリーなオーバーレイは無効になります。

## オプション A: OpenAI API キー (OpenAI Platform)

**最適な用途:** 直接 API アクセスと従量課金。
API キーは OpenAI ダッシュボードから取得してください。

ルート概要:

- `openai/gpt-5.4` = 直接 OpenAI Platform API ルート
- `OPENAI_API_KEY`（または同等の OpenAI プロバイダー設定）が必要
- OpenClaw では、ChatGPT/Codex サインインは `openai/*` ではなく `openai-codex/*` を通してルーティングされます

### CLI セットアップ

```bash
openclaw onboard --auth-choice openai-api-key
# または非対話モード
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 設定スニペット

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI の現在の API モデルドキュメントでは、直接の
OpenAI API 利用向けに `gpt-5.4` と `gpt-5.4-pro` が掲載されています。OpenClaw はその両方を `openai/*` Responses パス経由で転送します。
OpenClaw は、古い `openai/gpt-5.3-codex-spark` 行を意図的に表示しません。
これは、実際のトラフィックでは直接 OpenAI API 呼び出しで拒否されるためです。

OpenClaw は、直接 OpenAI
API パスでは `openai/gpt-5.3-codex-spark` を公開しません。`pi-ai` はこのモデルの組み込み行を引き続き同梱していますが、実際の OpenAI API
リクエストでは現在拒否されます。OpenClaw では Spark は Codex 専用として扱われます。

## 画像生成

同梱の `openai` プラグインは、共有の
`image_generate` ツールを通じて画像生成も登録します。

- デフォルト画像モデル: `openai/gpt-image-1`
- 生成: 1 リクエストあたり最大 4 枚の画像
- 編集モード: 有効、最大 5 枚の参照画像
- `size` をサポート
- 現在の OpenAI 固有の注意点: OpenClaw は現時点で `aspectRatio` または
  `resolution` の上書きを OpenAI Images API に転送しません

OpenAI をデフォルトの画像プロバイダーとして使うには:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

共有ツールの
パラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。

## 動画生成

同梱の `openai` プラグインは、共有の
`video_generate` ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `openai/sora-2`
- モード: テキストから動画、画像から動画、単一動画の参照/編集フロー
- 現在の制限: 画像または動画の参照入力は 1 件のみ
- 現在の OpenAI 固有の注意点: OpenClaw は現在、ネイティブ OpenAI 動画生成では `size`
  の上書きのみを転送します。`aspectRatio`、`resolution`、`audio`、`watermark` などの未対応のオプション上書きは無視され、
  ツール警告として報告されます。

OpenAI をデフォルトの動画プロバイダーとして使うには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

共有ツールの
パラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。

## オプション B: OpenAI Code (Codex) サブスクリプション

**最適な用途:** API キーの代わりに ChatGPT/Codex サブスクリプションアクセスを使うこと。
Codex cloud では ChatGPT サインインが必要で、一方 Codex CLI では ChatGPT または API キーのサインインをサポートしています。

ルート概要:

- `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth ルート
- 直接の OpenAI Platform API キーではなく、ChatGPT/Codex サインインを使用
- `openai-codex/*` のプロバイダー側の制限は、ChatGPT の Web/アプリ体験と異なる場合があります

### CLI セットアップ (Codex OAuth)

```bash
# ウィザードで Codex OAuth を実行
openclaw onboard --auth-choice openai-codex

# または OAuth を直接実行
openclaw models auth login --provider openai-codex
```

### 設定スニペット (Codex サブスクリプション)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI の現在の Codex ドキュメントでは、現在の Codex モデルとして `gpt-5.4` が掲載されています。OpenClaw
では、ChatGPT/Codex OAuth 利用向けにこれを `openai-codex/gpt-5.4` にマッピングしています。

このルートは `openai/gpt-5.4` とは意図的に分離されています。直接の
OpenAI Platform API パスを使いたい場合は、API キー付きの `openai/*` を使用してください。ChatGPT/Codex サインインを使いたい場合は、
`openai-codex/*` を使用してください。

オンボーディングで既存の Codex CLI ログインを再利用した場合、それらの認証情報は引き続き
Codex CLI によって管理されます。有効期限切れ時、OpenClaw はまず外部の Codex ソースを再読み込みし、プロバイダー側で更新可能な場合は、
OpenClaw 専用の別コピーを所有するのではなく、更新された認証情報を Codex ストレージへ書き戻します。

Codex アカウントに Codex Spark の利用権限がある場合、OpenClaw は以下もサポートします:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw は Codex Spark を Codex 専用として扱います。直接の
`openai/gpt-5.3-codex-spark` API キーパスは公開しません。

OpenClaw は、`pi-ai`
がそれを検出した場合に `openai-codex/gpt-5.3-codex-spark` も保持します。これは利用権限依存かつ実験的なものとして扱ってください。Codex Spark は
GPT-5.4 の `/fast` とは別物であり、利用可否はサインインしている Codex /
ChatGPT アカウントに依存します。

### Codex コンテキストウィンドウ上限

OpenClaw は、Codex モデルのメタデータと実行時コンテキスト上限を別の値として扱います。

`openai-codex/gpt-5.4` の場合:

- ネイティブ `contextWindow`: `1050000`
- デフォルトの実行時 `contextTokens` 上限: `272000`

これにより、実際にはレイテンシーと品質の特性がより良い、より小さなデフォルト実行時
ウィンドウを維持しつつ、モデルメタデータの正確性も保たれます。

有効な上限を別の値にしたい場合は、`models.providers.<provider>.models[].contextTokens` を設定してください:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

`contextWindow` は、ネイティブモデルの
メタデータを宣言または上書きするときにのみ使用してください。実行時コンテキスト予算を制限したい場合は `contextTokens` を使用してください。

### デフォルトのトランスポート

OpenClaw はモデルストリーミングに `pi-ai` を使用します。`openai/*` と
`openai-codex/*` の両方で、デフォルトのトランスポートは `"auto"`（まず WebSocket、次に SSE へフォールバック）です。

`"auto"` モードでは、OpenClaw は SSE にフォールバックする前に、初期の再試行可能な WebSocket 障害も
1 回再試行します。強制 `"websocket"` モードでは、フォールバックの背後に隠すことなくトランスポートエラーをそのまま表示します。

`"auto"` モードで接続または初期ターンの WebSocket 障害が発生した後、OpenClaw は
そのセッションの WebSocket パスを約 60 秒間劣化状態としてマークし、
トランスポート間を行き来し続けるのではなく、クールダウン中の後続ターンを SSE 経由で送信します。

ネイティブ OpenAI ファミリーのエンドポイント（`openai/*`、`openai-codex/*`、および Azure
OpenAI Responses）では、OpenClaw はリクエストに安定したセッション ID とターン ID の状態も付加するため、
再試行、再接続、SSE フォールバック時にも同じ会話 ID に整合します。ネイティブ OpenAI ファミリーのルートでは、これには安定した
セッション/ターンのリクエスト ID ヘッダーと、それに一致するトランスポートメタデータが含まれます。

OpenClaw は、セッション/ステータス画面に到達する前に、トランスポートの違いをまたいで OpenAI の使用量カウンターも正規化します。ネイティブ OpenAI/Codex Responses トラフィックでは、使用量が `input_tokens` / `output_tokens` または
`prompt_tokens` / `completion_tokens` として報告される場合がありますが、
OpenClaw は `/status`、`/usage`、およびセッションログ向けに、これらを同じ入力および出力カウンターとして扱います。ネイティブ
WebSocket トラフィックで `total_tokens` が省略される（または `0` が報告される）場合、
OpenClaw はセッション/ステータス表示が埋まったままになるよう、正規化された入力 + 出力の合計にフォールバックします。

`agents.defaults.models.<provider/model>.params.transport` を設定できます:

- `"sse"`: SSE を強制
- `"websocket"`: WebSocket を強制
- `"auto"`: WebSocket を試し、その後 SSE にフォールバック

`openai/*`（Responses API）では、WebSocket トランスポートが使われる場合、
OpenClaw はデフォルトで WebSocket ウォームアップも有効にします（`openaiWsWarmup: true`）。

関連する OpenAI ドキュメント:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket ウォームアップ

OpenAI のドキュメントでは、ウォームアップはオプションとして説明されています。OpenClaw は、
WebSocket トランスポート使用時の最初のターンのレイテンシーを減らすため、
`openai/*` ではデフォルトでこれを有効にします。

### ウォームアップを無効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### ウォームアップを明示的に有効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI と Codex の優先処理

OpenAI の API は `service_tier=priority` による優先処理を公開しています。OpenClaw
では、ネイティブ OpenAI/Codex Responses エンドポイントにそのフィールドを渡すため、
`agents.defaults.models["<provider>/<model>"].params.serviceTier` を設定します。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

サポートされる値は `auto`、`default`、`flex`、および `priority` です。

OpenClaw は、これらのモデルがネイティブ OpenAI/Codex エンドポイントを指している場合、
`params.serviceTier` を直接の `openai/*` Responses
リクエストと `openai-codex/*` Codex Responses リクエストの両方に転送します。

重要な動作:

- 直接の `openai/*` は `api.openai.com` を対象にしている必要があります
- `openai-codex/*` は `chatgpt.com/backend-api` を対象にしている必要があります
- どちらかのプロバイダーを別のベース URL やプロキシ経由でルーティングしている場合、OpenClaw は `service_tier` を変更しません

### OpenAI 高速モード

OpenClaw は、`openai/*` と
`openai-codex/*` の両方のセッション向けに共有の高速モード切り替えを公開しています:

- Chat/UI: `/fast status|on|off`
- 設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`

高速モードが有効な場合、OpenClaw はそれを OpenAI の優先処理にマッピングします:

- `api.openai.com` への直接の `openai/*` Responses 呼び出しは `service_tier = "priority"` を送信します
- `chatgpt.com/backend-api` への `openai-codex/*` Responses 呼び出しも `service_tier = "priority"` を送信します
- 既存のペイロード `service_tier` 値は保持されます
- 高速モードは `reasoning` や `text.verbosity` を書き換えません

GPT 5.4 について特に一般的な設定は次のとおりです:

- `openai/gpt-5.4` または `openai-codex/gpt-5.4` を使うセッションで `/fast on` を送信する
- または `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true` を設定する
- Codex OAuth も使う場合は、`agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` も設定する

例:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

セッションの上書き設定は config より優先されます。Sessions UI でセッション上書きをクリアすると、
そのセッションは設定済みのデフォルトに戻ります。

### ネイティブ OpenAI と OpenAI 互換ルートの違い

OpenClaw は、直接の OpenAI、Codex、および Azure OpenAI エンドポイントを、
汎用的な OpenAI 互換 `/v1` プロキシとは異なる方法で扱います:

- ネイティブ `openai/*`、`openai-codex/*`、および Azure OpenAI ルートでは、
  推論を明示的に無効にしたとき `reasoning: { effort: "none" }` をそのまま維持します
- ネイティブ OpenAI ファミリールートでは、ツールスキーマのデフォルトが strict mode になります
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、および
  `User-Agent`）は、検証済みのネイティブ OpenAI ホスト
  （`api.openai.com`）およびネイティブ Codex ホスト（`chatgpt.com/backend-api`）にのみ付与されます
- ネイティブ OpenAI/Codex ルートでは、`service_tier`、Responses の `store`、OpenAI の reasoning 互換ペイロード、および
  プロンプトキャッシュヒントのような OpenAI 専用のリクエスト整形を維持します
- プロキシ形式の OpenAI 互換ルートでは、より緩い互換動作を維持し、
  strict なツールスキーマ、ネイティブ専用のリクエスト整形、または非表示の
  OpenAI/Codex 帰属ヘッダーを強制しません

Azure OpenAI は、トランスポートと互換動作の点ではネイティブルーティングの区分に含まれますが、
非表示の OpenAI/Codex 帰属ヘッダーは受け取りません。

これにより、現在のネイティブ OpenAI Responses の動作を維持しつつ、
古い OpenAI 互換 shim をサードパーティの `/v1` バックエンドに強制しないようにしています。

### Strict-agentic GPT モード

`openai/*` および `openai-codex/*` の GPT-5 ファミリー実行では、OpenClaw は
より厳格な埋め込み Pi 実行コントラクトを使用できます:

```json5
{
  agents: {
    defaults: {
      embeddedPi: {
        executionContract: "strict-agentic",
      },
    },
  },
}
```

`strict-agentic` では、具体的なツールアクションが可能な場合、
OpenClaw は計画だけのアシスタントターンを成功した進捗として扱わなくなります。即時実行を促す steer を付けてそのターンを再試行し、
大きな作業には構造化された `update_plan` ツールを自動で有効にし、
モデルが行動せずに計画を続ける場合は明示的なブロック状態を表示します。

このモードは、OpenAI および OpenAI Codex の GPT-5 ファミリー実行に限定されます。他のプロバイダー
および古いモデルファミリーは、他の実行時設定に明示的に参加させない限り、
デフォルトの埋め込み Pi 動作のままです。

### OpenAI Responses のサーバー側 compaction

直接の OpenAI Responses モデル（`api: "openai-responses"` を使う `openai/*` で、
`baseUrl` が `api.openai.com` のもの）では、OpenClaw は OpenAI のサーバー側
compaction ペイロードヒントを自動で有効にします:

- `store: true` を強制します（モデル互換設定で `supportsStore: false` の場合を除く）
- `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します

デフォルトでは、`compact_threshold` はモデル `contextWindow` の `70%`（不明な場合は `80000`）です。

### サーバー側 compaction を明示的に有効にする

互換性のある Responses モデル（たとえば Azure OpenAI Responses）で
`context_management` 注入を強制したい場合に使います:

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### カスタムしきい値で有効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### サーバー側 compaction を無効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` は `context_management` 注入のみを制御します。
直接の OpenAI Responses モデルでは、互換設定で
`supportsStore: false` が指定されていない限り、引き続き `store: true` を強制します。

## 注意

- モデル参照は常に `provider/model` を使用します（[/concepts/models](/ja-JP/concepts/models) を参照）。
- 認証の詳細と再利用ルールは [/concepts/oauth](/ja-JP/concepts/oauth) にあります。
