---
read_when:
    - OpenClawでOpenAIモデルを使いたい場合
    - APIキーではなくCodex subscription認証を使いたい場合
summary: OpenClawでAPIキーまたはCodex subscription経由でOpenAIを使用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T12:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAIはGPTモデル向けの開発者APIを提供しています。Codexは、subscriptionアクセス用の**ChatGPTサインイン**または、従量課金アクセス用の**APIキー**サインインをサポートします。Codex cloudにはChatGPTサインインが必要です。
OpenAIは、OpenClawのような外部tool/ワークフローでのsubscription OAuth利用を明示的にサポートしています。

## デフォルトの対話スタイル

OpenClawは、`openai/*`と`openai-codex/*`の両方の実行に対して、デフォルトで小さなOpenAI固有のプロンプトオーバーレイを追加します。このオーバーレイは、ベースのOpenClaw system
promptを置き換えることなく、アシスタントを温かく、協調的で、簡潔かつ直接的に保ちます。

設定キー:

`plugins.entries.openai.config.personalityOverlay`

許可される値:

- `"friendly"`: デフォルト。OpenAI固有のオーバーレイを有効化します。
- `"off"`: オーバーレイを無効にし、ベースのOpenClaw promptのみを使用します。

適用範囲:

- `openai/*`モデルに適用されます。
- `openai-codex/*`モデルに適用されます。
- 他のプロバイダーには影響しません。

この動作はデフォルトで有効です:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### OpenAIプロンプトオーバーレイを無効にする

変更されていないベースのOpenClaw promptを使いたい場合は、オーバーレイをオフにします:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

設定CLIから直接設定することもできます:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## オプションA: OpenAI APIキー（OpenAI Platform）

**最適な用途:** 直接のAPIアクセスと従量課金。
APIキーはOpenAIダッシュボードから取得してください。

### CLIセットアップ

```bash
openclaw onboard --auth-choice openai-api-key
# または非対話
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 設定スニペット

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAIの現在のAPIモデルドキュメントでは、直接
OpenAI API利用向けに`gpt-5.4`と`gpt-5.4-pro`が掲載されています。OpenClawは両方を`openai/*` Responsesパス経由で転送します。
OpenClawは、古い`openai/gpt-5.3-codex-spark`行を意図的に抑制しています。これは、直接のOpenAI API呼び出しでは本番トラフィックで拒否されるためです。

OpenClawは、直接OpenAI
APIパス上で`openai/gpt-5.3-codex-spark`を公開しません。`pi-ai`には依然としてこのモデルの組み込み行がありますが、現在の本番OpenAI API
リクエストでは拒否されます。SparkはOpenClawではCodex専用として扱われます。

## オプションB: OpenAI Code（Codex）subscription

**最適な用途:** APIキーの代わりにChatGPT/Codex subscriptionアクセスを使うこと。
Codex cloudにはChatGPTサインインが必要ですが、Codex CLIはChatGPTまたはAPIキーのサインインをサポートします。

### CLIセットアップ（Codex OAuth）

```bash
# ウィザードでCodex OAuthを実行
openclaw onboard --auth-choice openai-codex

# またはOAuthを直接実行
openclaw models auth login --provider openai-codex
```

### 設定スニペット（Codex subscription）

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAIの現在のCodexドキュメントでは、現在のCodexモデルとして`gpt-5.4`が掲載されています。OpenClaw
は、ChatGPT/Codex OAuth利用向けにこれを`openai-codex/gpt-5.4`へマッピングします。

オンボーディングで既存のCodex CLIログインが再利用された場合、それらの認証情報は
Codex CLIによって管理されたままです。有効期限切れ時には、OpenClawはまず外部Codexソースを再読み込みし、プロバイダーが更新可能な場合は、別のOpenClaw専用コピーで所有権を持つのではなく、更新済み認証情報をCodex storageへ書き戻します。

CodexアカウントにCodex Sparkの権利がある場合、OpenClawは次もサポートします:

- `openai-codex/gpt-5.3-codex-spark`

OpenClawはCodex SparkをCodex専用として扱います。直接の
`openai/gpt-5.3-codex-spark` APIキー経路は公開しません。

OpenClawはまた、`pi-ai`が
`openai-codex/gpt-5.3-codex-spark`を検出した場合、それを保持します。これは権利依存かつ実験的なものとして扱ってください。Codex Sparkは
GPT-5.4 `/fast`とは別であり、可用性はサインイン中のCodex /
ChatGPTアカウントに依存します。

### Codexコンテキストウィンドウ上限

OpenClawは、Codexモデルのメタデータとランタイムのコンテキスト上限を別の
値として扱います。

`openai-codex/gpt-5.4`について:

- ネイティブ`contextWindow`: `1050000`
- デフォルトのランタイム`contextTokens`上限: `272000`

これにより、モデルメタデータを正確に保ちながら、実際にはレイテンシと品質の特性がより良い、小さめのデフォルトランタイム
ウィンドウを維持できます。

有効な上限を変更したい場合は、`models.providers.<provider>.models[].contextTokens`を設定してください:

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

ネイティブモデルメタデータを宣言または上書きしたい場合にのみ`contextWindow`を使用してください。ランタイムのコンテキスト予算を制限したい場合は`contextTokens`を使用してください。

### 転送のデフォルト

OpenClawはモデルストリーミングに`pi-ai`を使用します。`openai/*`と
`openai-codex/*`の両方で、デフォルト転送は`"auto"`（WebSocket優先、その後SSE
フォールバック）です。

`"auto"`モードでは、OpenClawはSSEへフォールバックする前に、初期の再試行可能なWebSocket失敗を1回再試行します。強制的な`"websocket"`モードでは、フォールバックの背後に隠さず、転送エラーをそのまま表面化します。

`"auto"`モードで接続時またはターン初期のWebSocket失敗が発生した後、OpenClawは
そのセッションのWebSocketパスを約60秒間degradedとマークし、そのクールダウン中は転送間を行き来して不安定になる代わりに、その後のターンを
SSE経由で送信します。

ネイティブのOpenAI系エンドポイント（`openai/*`、`openai-codex/*`、およびAzure
OpenAI Responses）では、OpenClawはリクエストに安定したセッションおよびターンのidentity stateも付加するため、再試行、再接続、SSE
フォールバックが同じ会話identityに整合したまま維持されます。ネイティブOpenAI系ルートでは、これに安定した
session/turn request identityヘッダーと、それに一致する転送メタデータが含まれます。

OpenClawはまた、OpenAIの使用量カウンターを転送バリアント間で正規化してから、session/statusサーフェスへ渡します。ネイティブOpenAI/Codex Responsesトラフィックでは、使用量が`input_tokens` / `output_tokens`または
`prompt_tokens` / `completion_tokens`として報告される場合がありますが、OpenClawは
これらを`/status`、`/usage`、およびsessionログ向けの同じ入力/出力カウンターとして扱います。ネイティブ
WebSocketトラフィックで`total_tokens`が省略される（または`0`と報告される）場合、OpenClawは正規化された入力 + 出力の合計へフォールバックし、session/status表示が埋まった状態を維持します。

`agents.defaults.models.<provider/model>.params.transport`を設定できます:

- `"sse"`: SSEを強制
- `"websocket"`: WebSocketを強制
- `"auto"`: WebSocketを試し、その後SSEへフォールバック

`openai/*`（Responses API）では、OpenClawはWebSocket転送が使われるとき、
デフォルトでWebSocket warm-up（`openaiWsWarmup: true`）も有効にします。

関連するOpenAIドキュメント:

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

### OpenAI WebSocket warm-up

OpenAIドキュメントではwarm-upは任意とされています。OpenClawは、
WebSocket転送使用時の初回ターンのレイテンシを下げるため、`openai/*`ではデフォルトでこれを有効にします。

### warm-upを無効にする

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

### warm-upを明示的に有効にする

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

### OpenAIとCodexの優先処理

OpenAIのAPIは`service_tier=priority`による優先処理を公開しています。OpenClaw
では、ネイティブOpenAI/Codex Responsesエンドポイントへこのフィールドを渡すために、
`agents.defaults.models["<provider>/<model>"].params.serviceTier`を設定してください。

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

サポートされる値は`auto`、`default`、`flex`、`priority`です。

OpenClawは、モデルがネイティブOpenAI/Codexエンドポイントを指している場合、
`params.serviceTier`を直接の`openai/*` Responses
リクエストと`openai-codex/*` Codex Responsesリクエストの両方へ転送します。

重要な動作:

- 直接の`openai/*`は`api.openai.com`を対象にしている必要があります
- `openai-codex/*`は`chatgpt.com/backend-api`を対象にしている必要があります
- どちらのプロバイダーも別のbase URLまたはproxy経由にした場合、OpenClawは`service_tier`を変更せずそのままにします

### OpenAI fast mode

OpenClawは、`openai/*`と
`openai-codex/*`の両セッション向けに共有fast-modeトグルを公開しています:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

fast modeが有効な場合、OpenClawはそれをOpenAI優先処理へマッピングします:

- `api.openai.com`への直接`openai/*` Responses呼び出しは`service_tier = "priority"`を送信する
- `chatgpt.com/backend-api`への`openai-codex/*` Responses呼び出しも`service_tier = "priority"`を送信する
- 既存のペイロード`service_tier`値は保持される
- fast modeは`reasoning`や`text.verbosity`を書き換えない

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

session overrideは設定に優先します。Sessions UIでsession overrideをクリアすると、
そのsessionは設定済みデフォルトへ戻ります。

### ネイティブOpenAIとOpenAI互換ルートの違い

OpenClawは、直接のOpenAI、Codex、およびAzure OpenAIエンドポイントを、
汎用OpenAI互換`/v1` proxyとは異なる扱いにしています:

- ネイティブ`openai/*`、`openai-codex/*`、およびAzure OpenAIルートは、
  明示的にreasoningを無効化したとき、`reasoning: { effort: "none" }`をそのまま保持する
- ネイティブOpenAI系ルートでは、tool schemaはデフォルトでstrict modeになる
- 隠しOpenClaw attributionヘッダー（`originator`、`version`、および
  `User-Agent`）は、検証済みネイティブOpenAIホスト
  （`api.openai.com`）およびネイティブCodexホスト（`chatgpt.com/backend-api`）でのみ付与される
- ネイティブOpenAI/Codexルートでは、`service_tier`、Responsesの`store`、OpenAI reasoning互換ペイロード、および
  prompt-cacheヒントのようなOpenAI専用リクエスト整形が維持される
- proxyスタイルのOpenAI互換ルートでは、より緩い互換動作が維持され、
  strictなtool schema、ネイティブ専用リクエスト整形、隠し
  OpenAI/Codex attributionヘッダーは強制されない

Azure OpenAIは、転送および互換動作の点ではネイティブルーティングの範囲に残りますが、隠しOpenAI/Codex attributionヘッダーは受け取りません。

これにより、現在のネイティブOpenAI Responses動作を維持しつつ、
古いOpenAI互換shimをサードパーティの`/v1`バックエンドへ強制しないようにしています。

### OpenAI Responsesのサーバー側compaction

直接のOpenAI Responsesモデル（`api: "openai-responses"`を使用し、`baseUrl`が
`api.openai.com`上にある`openai/*`）では、OpenClawは現在、OpenAIサーバー側
compactionのペイロードヒントを自動有効化します:

- `store: true`を強制する（モデル互換で`supportsStore: false`が設定されている場合を除く）
- `context_management: [{ type: "compaction", compact_threshold: ... }]`を注入する

デフォルトでは、`compact_threshold`はモデル`contextWindow`の`70%`（不明な場合は`80000`）です。

### サーバー側compactionを明示的に有効にする

互換Responsesモデル（たとえばAzure OpenAI Responses）で
`context_management`注入を強制したい場合に使用します:

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

### サーバー側compactionを無効にする

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

`responsesServerCompaction`は`context_management`注入のみを制御します。
直接OpenAI Responsesモデルは、互換設定で
`supportsStore: false`が設定されていない限り、引き続き`store: true`を強制します。

## 注記

- モデル参照は常に`provider/model`を使用します（[/concepts/models](/concepts/models)を参照）。
- 認証詳細 + 再利用ルールは[/concepts/oauth](/concepts/oauth)にあります。
