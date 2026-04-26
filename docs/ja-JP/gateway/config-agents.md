---
read_when:
    - エージェントのデフォルト設定の調整（モデル、thinking、workspace、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、および talk モード動作の調整
summary: エージェントデフォルト、マルチエージェントルーティング、セッション、メッセージ、および talk の設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-04-26T11:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、および `talk.*` 配下のエージェントスコープ設定キーです。チャンネル、ツール、Gateway ランタイム、その他のトップレベルキーについては、[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system prompt の Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw はワークスペースから上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、任意のデフォルト Skill allowlist です。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットになります。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペース bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ワークスペース bootstrap ファイルを system prompt に注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）では、ワークスペース bootstrap の再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と compaction 後の再試行では、引き続きコンテキストが再構築されます。
- `"never"`: 毎ターンのワークスペース bootstrap とコンテキストファイル注入を無効化します。これは、プロンプトライフサイクルを完全に自前で管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、または特殊な bootstrap 不要ワークフロー）にのみ使用してください。Heartbeat と compaction リカバリーのターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、ワークスペース bootstrap ファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース bootstrap ファイルにまたがって注入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められたときの、エージェントに見える警告文を制御します。
デフォルト: `"once"`。

- `"off"`: system prompt に警告文を一切注入しません。
- `"once"`: 一意な切り詰めシグネチャごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めがあるたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には大容量のプロンプト/コンテキスト予算が複数あり、
それらは 1 つの汎用ノブにまとめるのではなく、サブシステムごとに意図的に
分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペース bootstrap 注入。
- `agents.defaults.startupContext.*`:
  最近の `memory/*.md` を含む、1 回限りの `/new` および `/reset` 起動プレリュード。
- `skills.limits.*`:
  system prompt に注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  制限付きランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

1 つのエージェントだけ異なる予算が必要な場合にのみ、対応するエージェント単位の上書きを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` および `/reset` 実行で注入される、最初のターンの起動プレリュードを制御します。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

制限付きランタイムコンテキスト画面向けの共有デフォルトです。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略されたときの、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー回復に使われる、ライブツール結果の上限。
- `postCompactionMaxChars`: compaction 後の再注入で使われる AGENTS.md 抜粋の上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェント単位の上書きです。省略されたフィールドは
`agents.defaults.contextLimits` を継承します。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

system prompt に注入されるコンパクトな Skills リストのグローバル上限です。
これは、必要時に `SKILL.md` ファイルを読む動作には影響しません。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算のエージェント単位上書きです。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

provider 呼び出し前の transcript/ツール画像ブロックにおける、画像の最長辺の最大ピクセルサイズです。
デフォルト: `1200`。

値を小さくすると通常、スクリーンショットが多い実行での vision token 使用量とリクエストペイロードサイズが減ります。
値を大きくすると、より多くの視覚的ディテールを保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt コンテキスト用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt の時刻形式です。デフォルト: `auto`（OS 設定）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // グローバルなデフォルト provider params
      agentRuntime: {
        id: "pi", // pi | auto | 登録済み harness id（例: codex）
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 文字列形式は primary model のみを設定します。
  - オブジェクト形式は primary に加えて順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `image` ツールパスで vision-model config として使用されます。
  - 選択された/デフォルトのモデルが画像入力を受け付けられない場合のフォールバック ルーティングにも使用されます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有の画像生成機能と、今後画像を生成するあらゆるツール/Plugin 画面で使用されます。
  - 一般的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透過背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - provider/model を直接選ぶ場合は、対応する provider 認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証済み provider のデフォルトを推測できます。まず現在のデフォルト provider を試し、その後登録済み画像生成 provider を provider-id 順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有の音楽生成機能と、組み込みの `music_generate` ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証済み provider のデフォルトを推測できます。まず現在のデフォルト provider を試し、その後登録済み音楽生成 provider を provider-id 順で試します。
  - provider/model を直接選ぶ場合は、対応する provider 認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有の動画生成機能と、組み込みの `video_generate` ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証済み provider のデフォルトを推測できます。まず現在のデフォルト provider を試し、その後登録済み動画生成 provider を provider-id 順で試します。
  - provider/model を直接選ぶ場合は、対応する provider 認証/API キーも設定してください。
  - バンドル済みの Qwen 動画生成 provider は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、および provider レベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `pdf` ツールでモデルルーティングに使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: `pdf` ツールで呼び出し時に `maxBytesMb` が渡されなかった場合の、デフォルトの PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮するデフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: API キーアクセス用の `openai/gpt-5.5`、または Codex OAuth 用の `openai-codex/gpt-5.5`）。provider を省略すると、OpenClaw はまずエイリアスを試し、次にその正確な model id に対する一意の設定済み provider 一致を試し、それでもなければ設定済みのデフォルト provider にフォールバックします（これは非推奨の互換動作なので、明示的な `provider/model` を推奨します）。その provider が設定済みデフォルトモデルを提供しなくなった場合、OpenClaw は古い削除済み provider デフォルトをそのまま使うのではなく、最初の設定済み provider/model にフォールバックします。
- `models`: 設定済みモデルカタログおよび `/model` 用の allowlist です。各エントリには `alias`（ショートカット）と `params`（provider 固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - 安全な編集: エントリ追加には `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存 allowlist エントリを削除する置換を拒否します。
  - provider スコープの configure/オンボーディングフローは、選択した provider モデルをこのマップにマージし、すでに設定されている無関係な provider は保持します。
  - OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使い、しきい値を上書きするには `params.responsesCompactThreshold` を使ってください。[OpenAI server-side compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルト provider パラメータです。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）が `agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、さらに `agents.list[].params`（一致する agent id）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエストボディにマージされる高度なパススルー JSON です。生成されたリクエストキーと衝突した場合は extra body が優先されます。ネイティブでない completions ルートでは、その後も OpenAI 専用の `store` は削除されます。
- `params.chat_template_kwargs`: vLLM/OpenAI 互換の chat-template 引数で、トップレベルの `api: "openai-completions"` リクエストボディにマージされます。thinking off の `vllm/nemotron-3-*` では、OpenClaw は自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` はこれらのデフォルトを上書きし、`extra_body.chat_template_kwargs` が最終的に最優先になります。
- `params.preserveThinking`: 保持された thinking 用の Z.AI 専用オプトインです。有効時かつ thinking がオンのとき、OpenClaw は `thinking.clear_thinking: false` を送り、以前の `reasoning_content` を再利用します。詳細は [Z.AI thinking and preserved thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `agentRuntime`: デフォルトの低レベルエージェントランタイムポリシーです。id を省略すると OpenClaw Pi がデフォルトになります。組み込み PI harness を強制するには `id: "pi"`、登録済み Plugin harness にサポートモデルを claim させるには `id: "auto"`、`id: "codex"` のような登録済み harness id、または `id: "claude-cli"` のようなサポート対象 CLI バックエンドエイリアスを使用します。自動 PI フォールバックを無効化するには `fallback: "none"` を設定します。`codex` のような明示的な Plugin ランタイムは、同じ上書きスコープで `fallback: "pi"` を設定しない限り、デフォルトで fail closed です。model ref は `provider/model` の正規形を維持し、Codex、Claude CLI、Gemini CLI、その他の実行バックエンドは、古い runtime provider プレフィックスではなく runtime config で選択してください。provider/model 選択との違いは [Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。
- これらのフィールドを変更する config writer（例: `/models set`、`/models set-image`、fallback の追加/削除コマンド）は、可能な限り既存の fallback リストを保持しつつ、正規のオブジェクト形式で保存します。
- `maxConcurrent`: セッションをまたいで並列実行できるエージェント実行の最大数です（各セッション自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.agentRuntime`

`agentRuntime` は、エージェントターンを実行する低レベルエグゼキューターを制御します。ほとんどの
デプロイではデフォルトの OpenClaw Pi ランタイムのままで問題ありません。バンドルされた Codex app-server harness のように、信頼できる
Plugin がネイティブ harness を提供する場合や、Claude CLI のようなサポート対象
CLI バックエンドを使いたい場合に使用してください。考え方については [Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`、`"pi"`、登録済み Plugin harness id、またはサポート対象 CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録し、バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `fallback`: `"pi"` または `"none"`。`id: "auto"` では、省略時の fallback は `"pi"` がデフォルトなので、古い config でも Plugin harness が実行を claim しない場合は PI を使い続けられます。`id: "codex"` のような明示的な Plugin ランタイムモードでは、省略時の fallback は `"none"` がデフォルトなので、harness がない場合に黙って PI を使うのではなく失敗します。ランタイム上書きは、より広いスコープの fallback を継承しません。意図的にその互換フォールバックが必要な場合は、明示的な runtime と一緒に `fallback: "pi"` を設定してください。選択された Plugin harness の失敗は常にそのまま表面化します。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `id` を上書きし、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` はそのプロセスの fallback を上書きします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"` と `agentRuntime.id: "codex"` を設定します。可読性のために `agentRuntime.fallback: "none"` を明示することもできますが、明示的な Plugin ランタイムではそれがデフォルトです。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-7"` と `agentRuntime.id: "claude-cli"` を推奨します。`claude-cli/claude-opus-4-7` のような古い model ref も互換性のため引き続き動作しますが、新しい config では provider/model 選択を正規のまま維持し、実行バックエンドは `agentRuntime.id` に置くべきです。
- 古い runtime-policy キーは `openclaw doctor --fix` によって `agentRuntime` に書き換えられます。
- harness の選択は、最初の組み込み実行後にセッション id ごとに固定されます。config/env の変更は新規またはリセットされたセッションにのみ影響し、既存 transcript には影響しません。transcript 履歴はあるが記録済み固定がない古いセッションは、PI 固定として扱われます。`/status` は有効な runtime を報告します。たとえば `Runtime: OpenClaw Pi Default` や `Runtime: OpenAI Codex` のようになります。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれの provider/model 設定を使用します。

**組み込みエイリアス短縮形**（モデルが `agents.defaults.models` にある場合のみ適用）:

| エイリアス            | モデル                                     |
| --------------------- | ------------------------------------------ |
| `opus`                | `anthropic/claude-opus-4-6`                |
| `sonnet`              | `anthropic/claude-sonnet-4-6`              |
| `gpt`                 | `openai/gpt-5.5` または `openai-codex/gpt-5.5` |
| `gpt-mini`            | `openai/gpt-5.4-mini`                      |
| `gpt-nano`            | `openai/gpt-5.4-nano`                      |
| `gemini`              | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`        | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite`   | `google/gemini-3.1-flash-lite-preview`     |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI の GLM-4.x モデルでは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking モードが有効になります。
Z.AI モデルでは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` が有効になります。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 モデルでは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking になります。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行用の任意の CLI バックエンド（ツール呼び出しなし）。API provider が失敗したときのバックアップとして有用です。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // または、CLI がプロンプトファイル用フラグを受け付ける場合は systemPromptFileArg を使用します。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI バックエンドはテキスト優先です。ツールは常に無効です。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像パススルーがサポートされます。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てた system prompt 全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェント単位（`agents.list[].systemPromptOverride`）で設定します。エージェント単位の値が優先され、空文字または空白のみの値は無視されます。制御されたプロンプト実験に便利です。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

モデルファミリーごとに適用される、provider 非依存のプロンプトオーバーレイです。GPT-5 ファミリーの model id には、provider をまたいで共有の動作契約が適用されます。`personality` は、フレンドリーな対話スタイル層のみを制御します。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（デフォルト）と `"on"` は、フレンドリーな対話スタイル層を有効にします。
- `"off"` はフレンドリー層のみを無効にします。タグ付けされた GPT-5 動作契約は引き続き有効です。
- この共有設定が未設定の場合、古い `plugins.entries.openai.config.personality` も引き続き参照されます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効化
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true; false の場合、system prompt から Heartbeat セクションを省略
        lightContext: false, // デフォルト: false; true の場合、ワークスペース bootstrap ファイルから HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false; true の場合、各 Heartbeat を新しいセッションで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト） | block
        target: "none", // デフォルト: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、system prompt から Heartbeat セクションを省略し、bootstrap コンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeat エージェントターンが中断されるまでに許可される最大秒数です。未設定の場合は `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct ターゲット配信を許可します。`block` は direct ターゲット配信を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行では軽量 bootstrap コンテキストを使用し、ワークスペース bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴を持たない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat あたりのトークンコストを約 100K から約 2-5K トークンに削減します。
- エージェント単位: `agents.list[].heartbeat` を設定します。いずれかのエージェントで `heartbeat` を定義すると、**そのエージェントだけ** が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行するため、間隔を短くするとより多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み Compaction provider Plugin の id（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のとき使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意の Compaction 専用モデル上書き
        notifyUser: true, // Compaction 開始時と完了時に短い通知を送信（デフォルト: false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction provider Plugin の id。設定されると、組み込みの LLM 要約ではなく provider の `summarize()` が呼ばれます。失敗時は組み込みにフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 単一の Compaction 操作に対して OpenClaw が中断するまでに許可する最大秒数です。デフォルト: `900`。
- `keepRecentTokens`: 直近の transcript 末尾をそのまま保持するための Pi カットポイント予算です。手動 `/compact` は、これが明示設定されている場合にそれを尊重し、それ以外では手動 Compaction はハードチェックポイントになります。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約時に組み込みの不透明 ID 保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用される、任意のカスタム ID 保持テキストです。
- `qualityGuard`: safeguard 要約に対する不正出力時の再試行チェックです。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名です。デフォルトは `["Session Startup", "Red Lines"]` で、無効化するには `[]` を設定します。未設定の場合、またはそのデフォルトのペアが明示設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け付けられます。
- `model`: Compaction 要約専用の任意の `provider/model-id` 上書きです。メインセッションは 1 つのモデルのままにしつつ、Compaction 要約は別モデルで実行したい場合に使います。未設定の場合、Compaction はセッションの primary model を使用します。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時にユーザーへ短い通知を送ります（例: 「Compacting context...」や「Compaction complete」）。Compaction を静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction 前に永続メモリを保存するためのサイレントなエージェントターンです。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**を削減します。ディスク上のセッション履歴は**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration（ms/s/m/h）、デフォルト単位: 分
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は削減パスを有効にします。
- `ttl` は、最後のキャッシュ更新後に再び削減を実行できる頻度を制御します。
- 削減ではまず大きすぎるツール結果を soft-trim し、それでも必要なら古いツール結果を hard-clear します。

**Soft-trim** は先頭 + 末尾を残し、中央に `...` を挿入します。

**Hard-clear** はツール結果全体をプレースホルダーに置き換えます。

注意:

- 画像ブロックは削減/消去されません。
- 比率は文字数ベース（近似）であり、正確なトークン数ではありません。
- `keepLastAssistants` より少ない assistant メッセージしか存在しない場合、削減はスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMs を使用）
    },
  },
}
```

- Telegram 以外のチャンネルでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャンネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウント単位の各種バリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800–2500ms。エージェント単位上書き: `agents.list[].humanDelay`。

動作とチャンク詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: direct チャット/メンションでは `instant`、メンションなしのグループチャットでは `message`。
- セッション単位上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / インライン内容もサポートされます:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用する絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー ポリシーノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef ベースの `*Data` 値は、サンドボックスセッション開始前にアクティブな secrets ランタイム スナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後にリモートワークスペースを 1 回初期投入します
- その後はリモート SSH ワークスペースを正規状態として維持します
- `exec`、ファイルツール、およびメディアパスを SSH 経由でルーティングします
- リモート変更は自動ではホストへ同期されません
- サンドボックス browser コンテナはサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウント
- `rw`: エージェント ワークスペースを `/workspace` に読み書きでマウント

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナとワークスペース（セッション間分離なし）

**OpenShell Plugin 設定:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell モード:**

- `mirror`: exec 前にローカルからリモートへ初期投入し、exec 後に同期を戻します。ローカルワークスペースが正規状態のままです
- `remote`: サンドボックス作成時に 1 回だけリモートへ初期投入し、その後はリモートワークスペースを正規状態として維持します

`remote` モードでは、初期投入後に OpenClaw 外で行われたホスト側ローカル編集は自動的にはサンドボックスへ同期されません。
転送は OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意の mirror 同期は Plugin が管理します。

**`setupCommand`** はコンテナ作成後に 1 回だけ実行されます（`sh -lc` 経由）。ネットワーク外向き通信、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントに外向きアクセスが必要な場合は `"bridge"`（またはカスタム bridge ネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限り（緊急用）
デフォルトでブロックされます。

**受信添付ファイル** は、アクティブワークスペース内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェント単位の binds はマージされます。

**サンドボックス browser**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL は system prompt に注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC のオブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL にパスワードを露出する代わりに短命トークン URL を出力します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホスト browser を対象にするのをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge ネットワーク）です。グローバル bridge 接続を明示的に望む場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、コンテナ境界での CDP ingress を CIDR 範囲（例: `172.21.0.1/32`）に制限する任意設定です。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックス browser コンテナのみにマウントします。設定された場合（`[]` を含む）、browser コンテナでは `docker.binds` を置き換えます。
- 起動時デフォルトは `scripts/sandbox-browser-entrypoint.sh` に定義されており、コンテナホスト向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から導出>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（デフォルトで有効）
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    デフォルトで有効で、WebGL/3D 利用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存している場合は
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトのプロセス上限を使うには `0` を設定してください。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、
    カスタム entrypoint を持つカスタム browser イメージを使用してください。

</Accordion>

browser サンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージのビルド:

```bash
scripts/sandbox-setup.sh           # メイン サンドボックスイメージ
scripts/sandbox-browser-setup.sh   # 任意の browser イメージ
```

### `agents.list`（エージェント単位の上書き）

`agents.list[].tts` を使うと、エージェントごとに独自の TTS provider、voice、model、
style、または自動 TTS モードを設定できます。エージェントブロックはグローバルな
`messages.tts` の上に deep-merge されるため、共有資格情報は 1 か所に置いたまま、
各エージェントでは必要な voice または provider フィールドだけを上書きできます。アクティブなエージェントの
上書きは、自動音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。provider の例と優先順位は
[Text-to-speech](/ja-JP/tools/tts#per-agent-voice-overrides) を参照してください。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        thinkingDefault: "high", // エージェント単位の thinking レベル上書き
        reasoningDefault: "on", // エージェント単位の reasoning 可視性上書き
        fastModeDefault: false, // エージェント単位の fast mode 上書き
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキー単位で上書き
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定されている場合は agents.defaults.skills を置き換え
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は最初のものが勝ちます（警告を記録）。何も設定されていない場合は、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバル fallback を無効化）。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルト fallback を継承します。
- `params`: `agents.defaults.models` 内の選択されたモデルエントリにマージされる、エージェント単位のストリーム params です。`cacheRetention`、`temperature`、`maxTokens` のようなエージェント固有の上書きに使えます。モデルカタログ全体を複製する必要はありません。
- `tts`: 任意のエージェント単位 text-to-speech 上書きです。このブロックは `messages.tts` の上に deep-merge されるため、共有 provider 資格情報と fallback ポリシーは `messages.tts` に置いたまま、ここでは provider、voice、model、style、自動モードのような persona 固有の値だけを設定してください。
- `skills`: 任意のエージェント単位 Skill allowlist です。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはマージではなくデフォルトを置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェント単位デフォルト thinking レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ単位またはセッション単位の上書きが設定されていない場合、このエージェントに対して `agents.defaults.thinkingDefault` を上書きします。どの値が有効かは、選択された provider/model プロファイルによって決まります。Google Gemini では、`adaptive` は provider 所有の動的 thinking を維持します（Gemini 3/3.1 では `thinkingLevel` を省略し、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェント単位デフォルト reasoning 可視性（`on | off | stream`）。メッセージ単位またはセッション単位の reasoning 上書きが設定されていない場合に適用されます。
- `fastModeDefault`: 任意のエージェント単位デフォルト fast mode（`true | false`）。メッセージ単位またはセッション単位の fast-mode 上書きが設定されていない場合に適用されます。
- `agentRuntime`: 任意のエージェント単位の低レベル runtime ポリシー上書きです。1 つのエージェントだけを Codex 専用にし、他のエージェントは `auto` モードのデフォルト PI fallback を維持したい場合は `{ id: "codex" }` を使用します。
- `runtime`: 任意のエージェント単位 runtime 記述子です。エージェントをデフォルトで ACP harness セッションにしたい場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `ackReaction` は `emoji` から、`mentionPatterns` は `name` / `emoji` から。
- `subagents.allowAgents`: `sessions_spawn` 用のエージェント ID allowlist（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制、デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### バインディング一致フィールド

- `type`（任意）: 通常のルーティングには `route`（type 省略時のデフォルトは route）、永続的な ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意; `*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意; `{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意; チャンネル固有）
- `acp`（任意; `type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（正確一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各層の中では、最初に一致した `bindings` エントリが勝ちます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route バインディング層順序は使用しません。

### エージェント単位アクセスプロファイル

<Accordion title="フルアクセス（サンドボックスなし）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムアクセスなし（メッセージングのみ）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細は [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // このトークン数を超える親スレッド fork をスキップ（0 で無効化）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration または false
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブ時 auto-unfocus（時間、`0` で無効）
      maxAgeHours: 0, // デフォルトのハード最大有効期間（時間、`0` で無効）
    },
    mainKey: "main", // レガシー（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールド詳細">

- **`scope`**: グループチャット コンテキスト用の基本セッショングルーピング戦略。
  - `per-sender`（デフォルト）: 各送信者はチャンネルコンテキスト内で分離されたセッションを持ちます。
  - `global`: チャンネルコンテキスト内のすべての参加者が 1 つのセッションを共有します（共有コンテキストを意図する場合にのみ使用してください）。
- **`dmScope`**: DM をどのようにグループ化するか。
  - `main`: すべての DM が main セッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネル + 送信者ごとに分離します（マルチユーザー受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャンネル + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: チャンネルをまたぐセッション共有のために、正規 ID を provider プレフィックス付き peer にマッピングします。
- **`reset`**: 主 reset ポリシー。`daily` はローカル時刻 `atHour` に reset し、`idle` は `idleMinutes` 後に reset します。両方設定されている場合は、先に期限切れになるほうが優先されます。日次 reset の新しさはセッション行の `sessionStartedAt` を使い、アイドル reset の新しさは `lastInteractionAt` を使います。Heartbeat、Cron 起動、exec 通知、Gateway 管理処理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新することがありますが、日次/アイドル セッションの新しさは維持しません。
- **`resetByType`**: タイプごとの上書き（`direct`、`group`、`thread`）。古い `dm` は `direct` のエイリアスとして受け付けられます。
- **`parentForkMaxTokens`**: fork されたスレッドセッションを作成するときに許可される親セッション `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親 transcript 履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効化して常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムは main の direct-chat バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取り中に許可される返信の往復ターン最大数（整数、範囲: `0`–`5`）。`0` は ping-pong 連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、古い `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` で一致します。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみ出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリに対する経過時間のしきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間。デフォルトは `pruneAfter`。無効化するには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリ ディスク予算。`warn` モードでは警告を出し、`enforce` モードでは古いアーティファクト/セッションから先に削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: スレッドにバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスター デフォルト スイッチ（provider は上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: デフォルトの非アクティブ時 auto-unfocus（時間、`0` で無効、provider は上書き可能）
  - `maxAgeHours`: デフォルトのハード最大有効期間（時間、`0` で無効、provider は上書き可能）

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 で無効化
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャンネル/アカウント単位の上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: account → channel → global。`""` は無効化してカスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking レベル | `high`, `low`, `off`        |
| `{identity.name}` | エージェント ID 名     | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### ack リアクション

- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャンネル単位の上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identity フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、BlueBubbles などリアクション対応チャンネルで、返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status リアクションを有効にします。
  Slack と Discord では、未設定の場合、ack リアクションが有効なら status リアクションも有効のままです。
  Telegram では、ライフサイクル status リアクションを有効にするには明示的に `true` を設定してください。

### 受信 debounce

同じ送信者からの急速なテキストのみのメッセージを、1 つのエージェントターンにまとめます。メディア/添付ファイルは即座に flush されます。制御コマンドは debounce をバイパスします。

### TTS（text-to-speech）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` でローカル設定を上書きでき、`/tts status` で有効状態を確認できます。
- `summaryModel` は、自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- バンドル済み音声 provider は Plugin 所有です。`plugins.allow` が設定されている場合は、使用したい各 TTS provider Plugin を含めてください。たとえば Edge TTS には `microsoft` です。古い `edge` provider id は `microsoft` のエイリアスとして受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は config、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、model/voice の検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android）のデフォルトです。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` は、複数の Talk provider が設定されている場合、`talk.providers` 内のキーと一致している必要があります。
- 古いフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` を使うと、Talk ディレクティブでフレンドリーな名前を使えます。
- `providers.mlx.modelId` は、macOS ローカル MLX helper が使用する Hugging Face repo を選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生は、存在する場合はバンドル済み `openclaw-mlx-tts` helper、または `PATH` 上の実行可能ファイルを通じて実行されます。開発用に helper パスを上書きするには `OPENCLAW_MLX_TTS_BIN` を使用します。
- `speechLocale` は、iOS/macOS Talk 音声認識で使用される BCP 47 locale id を設定します。未設定の場合はデバイスのデフォルトを使用します。
- `silenceTimeoutMs` は、Talk モードがユーザーの無音後に transcript を送信するまで待つ時間を制御します。未設定の場合はプラットフォームのデフォルト停止ウィンドウを維持します（macOS と Android では `700 ms`、iOS では `900 ms`）。

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他すべての config キー
- [Configuration](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [Configuration examples](/ja-JP/gateway/configuration-examples)
