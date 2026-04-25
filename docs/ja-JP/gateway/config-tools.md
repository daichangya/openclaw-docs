---
read_when:
    - '`tools.*` のポリシー、許可リスト、または実験的機能を設定する'
    - カスタム provider を登録する、または base URL を上書きする
    - OpenAI 互換のセルフホスト型エンドポイントをセットアップする
summary: ツール設定（ポリシー、実験的トグル、provider 提供ツール）とカスタム provider/base-URL のセットアップ
title: 設定 — ツールとカスタム provider
x-i18n:
    generated_at: "2026-04-25T13:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d63b080550a6c95d714d3bb42c2b079368040aa09378d88c2e498ccd5ec113c1
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` config キーとカスタム provider / base-URL のセットアップ。agent、
channel、その他のトップレベル config キーについては、
[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は `tools.allow`/`tools.deny` より前にベース許可リストを設定します。

ローカルのオンボーディングでは、未設定の場合、新しいローカル config のデフォルトは `tools.profile: "coding"` になります（既存の明示的なプロファイルは保持されます）。

| プロファイル | 含まれるもの                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`    | `session_status` のみ                                                                                                         |
| `coding`     | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging`  | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                     |
| `full`       | 制限なし（未設定と同じ）                                                                                                      |

### ツールグループ

| グループ           | ツール                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）                             |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                         |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                 |
| `group:ui`         | `browser`、`canvas`                                                                                                   |
| `group:automation` | `cron`、`gateway`                                                                                                     |
| `group:messaging`  | `message`                                                                                                             |
| `group:nodes`      | `nodes`                                                                                                               |
| `group:agents`     | `agents_list`                                                                                                         |
| `group:media`      | `image`、`image_generate`、`video_generate`、`tts`                                                                    |
| `group:openclaw`   | すべての組み込みツール（provider Plugin は除く）                                                                      |

### `tools.allow` / `tools.deny`

グローバルなツール許可/拒否ポリシーです（拒否が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandbox がオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定の provider または model に対して、さらにツールを制限します。順序は: ベースプロファイル → provider プロファイル → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

sandbox 外での elevated `exec` アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- agent ごとの上書き（`agents.list[].tools.elevated`）では、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッションごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- Elevated `exec` は sandboxing をバイパスし、設定された escape path（デフォルトは `gateway`、または exec ターゲットが `node` の場合は `node`）を使います。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全チェックは**デフォルトで無効**です。有効化するには `enabled: true` を設定してください。
設定はグローバルに `tools.loopDetection` で定義でき、agent ごとに `agents.list[].tools.loopDetection` で上書きできます。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ループ解析のために保持するツール呼び出し履歴の最大数。
- `warningThreshold`: 警告を出す、進捗のない繰り返しパターンのしきい値。
- `criticalThreshold`: 重大なループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進捗のない実行に対するハードストップしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しで警告。
- `detectors.knownPollNoProgress`: 既知のポーリングツール（`process.poll`、`command_status` など）での進捗なしを警告/ブロック。
- `detectors.pingPong`: 進捗のない交互ペアパターンを警告/ブロック。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、バリデーションは失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 任意。自動検出にするなら省略
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

受信メディア理解（画像/音声/動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // オプトイン: 完了した非同期 music/video を直接チャネルへ送信
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディア model エントリフィールド">

**provider エントリ**（`type: "provider"` または省略）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model id の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` の profile 選択

**CLI エントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗時は次のエントリにフォールバックします。

provider auth は標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  および `video_generate` タスクは、まず直接チャネル配信を試みます。デフォルト: `false`
  （旧来の requester-session wake/model-delivery 経路）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）が
どのセッションを対象にできるかを制御します。

デフォルト: `tree`（現在のセッション + そこから生成されたセッション。たとえば subagent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注意:

- `self`: 現在の session key のみ。
- `tree`: 現在のセッション + 現在のセッションから生成されたセッション（subagent）。
- `agent`: 現在の agent id に属する任意のセッション（同じ agent id の下で sender ごとのセッションを実行している場合、他ユーザーを含むことがあります）。
- `all`: 任意のセッション。agent 間ターゲティングには引き続き `tools.agentToAgent` が必要です。
- sandbox clamp: 現在のセッションが sandbox 化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン: インラインファイル添付を許可するには true を設定
        maxTotalBytes: 5242880, // 全ファイル合計で 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 ファイルあたり 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときに添付を保持
      },
    },
  },
}
```

注意:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP ランタイムでは拒否されます。
- ファイルは子ワークスペースの `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付内容は transcript 永続化から自動的に秘匿化されます。
- Base64 入力は厳格な文字種/パディング検査と、デコード前のサイズガードで検証されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付を削除し、`keep` は `retainOnSessionKeep: true` のときのみ保持します。

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みツールフラグです。strict-agentic GPT-5 の自動有効化ルールが適用されない限り、デフォルトではオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注意:

- `planTool`: 重要な複数ステップ作業の追跡のために、構造化された `update_plan` ツールを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（または agent ごとの上書き）が OpenAI または OpenAI Codex の GPT-5 系実行で `"strict-agentic"` に設定されている場合を除き `false`。その範囲外でもツールを強制的にオンにするには `true` を、strict-agentic GPT-5 実行でもオフのままにするには `false` を設定してください。
- 有効時には、system prompt に使用ガイダンスも追加されるため、model はこれを実質的な作業にのみ使い、`in_progress` のステップを最大 1 つに保ちます。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 生成される sub-agent のデフォルト model。省略した場合、sub-agent は呼び出し元の model を継承します。
- `allowAgents`: リクエスト元 agent が自身の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` で使われるターゲット agent id のデフォルト許可リスト（`["*"]` = 任意。デフォルト: 同じ agent のみ）。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- sub-agent ごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタム provider と base URL

OpenClaw は組み込みの model catalog を使います。カスタム provider は config の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト） | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使ってください。
- agent config ルートは `OPENCLAW_AGENT_DIR`（または旧環境変数エイリアス `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致する provider ID のマージ優先順位:
  - 空でない agent `models.json` の `baseUrl` 値が優先されます。
  - 空でない agent `apiKey` 値は、その provider が現在の config/auth-profile コンテキストで SecretRef 管理されていない場合にのみ優先されます。
  - SecretRef 管理の provider `apiKey` 値は、解決済み secret を永続化する代わりに、ソースマーカー（env ref では `ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - SecretRef 管理の provider header 値は、ソースマーカー（env ref では `secretref-env:ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - 空または欠落した agent `apiKey`/`baseUrl` は、config の `models.providers` にフォールバックします。
  - 一致する model の `contextWindow`/`maxTokens` は、明示的 config 値と暗黙 catalog 値のうち高い方を使います。
  - 一致する model の `contextTokens` は、存在する場合は明示的なランタイム上限を保持します。ネイティブ model メタデータを変えずに有効コンテキストを制限したいときに使ってください。
  - config で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使ってください。
  - マーカーの永続化はソース正本方式です。マーカーは、解決済みランタイム secret 値ではなく、アクティブなソース config スナップショット（解決前）から書き込まれます。

### provider フィールド詳細

- `models.mode`: provider catalog の動作（`merge` または `replace`）。
- `models.providers`: provider id をキーにしたカスタム provider マップ。
  - 安全な編集: 追加更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使ってください。`config set` は `--replace` を渡さない限り破壊的な置換を拒否します。
- `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider 資格情報（SecretRef/env 置換の利用を推奨）。
- `models.providers.*.auth`: auth 戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に `Authorization` ヘッダーで資格情報を送るよう強制します。
- `models.providers.*.baseUrl`: 上流 API の base URL。
- `models.providers.*.headers`: proxy/tenant ルーティング用の追加の静的ヘッダー。
- `models.providers.*.request`: model-provider HTTP リクエストのトランスポート上書き。
  - `request.headers`: 追加ヘッダー（provider デフォルトとマージ）。値は SecretRef を受け付けます。
  - `request.auth`: auth 戦略上書き。モード: `"provider-default"`（provider 組み込み auth を使う）、`"authorization-bearer"`（`token` とともに使う）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使う）。
  - `request.proxy`: HTTP proxy 上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使う）、`"explicit-proxy"`（`url` とともに使う）。両モードとも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用の TLS 上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付ける）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNS がプライベート、CGNAT、または同様の範囲に解決される `baseUrl` への HTTPS を、provider HTTP fetch ガード経由で許可します（信頼されたセルフホスト型 OpenAI 互換エンドポイント向けの運用者オプトイン）。WebSocket は、ヘッダー/TLS には同じ `request` を使いますが、この fetch SSRF ゲートは使いません。デフォルトは `false`。
- `models.providers.*.models`: 明示的な provider model catalog エントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブ model のコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。model のネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使います。`openclaw models list` は両者が異なる場合に両方を表示します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で、空でない非ネイティブ `baseUrl`（ホストが `api.openai.com` ではない）の場合、OpenClaw は実行時にこれを `false` に強制します。空または省略した `baseUrl` では、デフォルトの OpenAI 動作が維持されます。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみを受け付ける OpenAI 互換 chat エンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に、純粋なテキストの `messages[].content` 配列をプレーン文字列へ平坦化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙の検出をオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出に使う AWS リージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出のための任意の provider-id フィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出された model 用のフォールバック context window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出された model 用のフォールバック最大出力トークン。

### provider の例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras には `cerebras/zai-glm-4.7` を使ってください。Z.AI 直結には `zai/glm-4.7` を使います。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalog には `opencode/...` 参照、Go catalog には `opencode-go/...` 参照を使います。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるエイリアスです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般エンドポイントを使う場合は、base URL 上書き付きのカスタム provider を定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

中国向けエンドポイントでは `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使ってください。

ネイティブ Moonshot エンドポイントは、共有の
`openai-completions` トランスポート上でストリーミング利用互換性を公開しており、OpenClaw は組み込み provider id 単独ではなく、そのエンドポイント機能に基づいてこれを判定します。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 互換の組み込み provider です。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic 互換）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL には `/v1` を含めないでください（Anthropic client が付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直結）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定してください。ショートカット:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
model catalog のデフォルトは M2.7 のみです。
Anthropic 互換のストリーミング経路では、`thinking` を自分で明示的に設定しない限り、
OpenClaw はデフォルトで MiniMax の thinking を無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカル model（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分な性能のハードウェア上で LM Studio Responses API を使って大規模なローカル model を実行し、フォールバック用にホスト型 model はマージしたまま維持してください。

</Accordion>

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [Configuration — agents](/ja-JP/gateway/config-agents)
- [Configuration — channels](/ja-JP/gateway/config-channels)
- [Tools and plugins](/ja-JP/tools)
