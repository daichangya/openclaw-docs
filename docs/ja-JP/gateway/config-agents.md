---
read_when:
    - エージェントのデフォルトを調整する（models、thinking、workspace、Heartbeat、media、Skills）
    - マルチエージェントルーティングとバインディングを設定する
    - セッション、メッセージ配信、および talk モードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、および talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-04-25T13:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、および `talk.*` 配下のエージェントスコープ設定キーです。channels、tools、gateway runtime、その他の
トップレベルキーについては、[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw は workspace から上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、任意のデフォルト Skills 許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- defaults を継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットになります。defaults とはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap ファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistant の応答完了後）では workspace bootstrap の再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後のリトライでは、引き続きコンテキストを再構築します。
- `"never"`: 毎ターンの workspace bootstrap と context-file 注入を無効にします。これは、プロンプトライフサイクルを完全に自前で管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、または特殊な bootstrap 不要ワークフロー）でのみ使用してください。Heartbeat と Compaction 回復ターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の workspace bootstrap ファイルごとの最大文字数。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap ファイルにまたがって注入される最大総文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められたときの、エージェント可視の警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: 警告テキストをシステムプロンプトに注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めがあるたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には高ボリュームのプロンプト/コンテキスト予算が複数あり、
それらは 1 つの汎用ノブにまとめるのではなく、サブシステムごとに意図的に分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常の workspace bootstrap 注入。
- `agents.defaults.startupContext.*`:
  1 回限りの `/new` および `/reset` 起動プレリュード。最近の
  `memory/*.md` ファイルを含みます。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、ランタイム所有ブロックの注入。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

あるエージェントだけ別の予算が必要な場合にのみ、対応するエージェントごとの上書きを使ってください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` および `/reset` 実行時に注入される、最初のターンの起動プレリュードを制御します。

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

境界付きランタイムコンテキストサーフェスの共有 defaults です。

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

- `memoryGetMaxChars`: 切り詰め metadata と継続通知が追加される前の、`memory_get` 抜粋上限のデフォルト。
- `memoryGetDefaultLines`: `lines` が省略された場合の `memory_get` 行ウィンドウのデフォルト。
- `toolResultMaxChars`: 永続化された result とオーバーフロー回復に使用される、ライブ tool-result 上限。
- `postCompactionMaxChars`: Compaction 後の更新注入時に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェントごとの上書きです。省略されたフィールドは
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

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限です。  
これは必要に応じて `SKILL.md` ファイルを読み込む動作には影響しません。

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

Skills プロンプト予算に対するエージェントごとの上書きです。

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

provider 呼び出し前に transcript/tool の画像ブロックで許可される、画像の最長辺の最大ピクセルサイズです。
デフォルト: `1200`。

値を小さくすると、通常は vision-token 使用量と、スクリーンショットが多い実行でのリクエスト payload サイズが減ります。  
値を大きくすると、より多くの視覚的ディテールを保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。ホストタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式です。デフォルト: `auto`（OS 設定）。

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
      embeddedHarness: {
        runtime: "pi", // pi | auto | 登録済み harness id、例: codex
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式は primary モデルのみを設定します。
  - オブジェクト形式は primary に加えて、順序付きの failover モデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツール経路で、その vision-model 設定として使用されます。
  - 選択された/デフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有画像生成機能と、今後追加される画像生成系のツール/Plugin サーフェスで使用されます。
  - 典型的な値: ネイティブ Gemini 画像生成向けの `google/gemini-3.1-flash-image-preview`、fal 向けの `fal/fal-ai/flux/dev`、または OpenAI Images 向けの `openai/gpt-image-2`。
  - provider/model を直接選択する場合は、対応する provider auth も設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの画像生成 provider を provider-id 順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有音楽生成機能と内蔵の `music_generate` ツールで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの音楽生成 provider を provider-id 順で試します。
  - provider/model を直接選択する場合は、対応する provider auth/API key も設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有動画生成機能と内蔵の `video_generate` ツールで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの動画生成 provider を provider-id 順で試します。
  - provider/model を直接選択する場合は、対応する provider auth/API key も設定してください。
  - バンドル済みの Qwen 動画生成 provider は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、および provider レベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` ツールのモデルルーティングに使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: `pdf` ツールで、呼び出し時に `maxBytesMb` が渡されない場合のデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: API key アクセス用の `openai/gpt-5.4`、または Codex OAuth 用の `openai-codex/gpt-5.5`）。provider を省略すると、OpenClaw はまず alias を試し、次にその正確な model id に対する一意な configured-provider 一致を試し、それでもだめな場合にのみ configured default provider にフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。その provider が設定済みデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済み provider デフォルトを見せる代わりに、最初の configured provider/model にフォールバックします。
- `models`: `/model` 用の設定済みモデルカタログおよび許可リスト。各エントリには、`alias`（ショートカット）と `params`（provider 固有。たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`extra_body`/`extraBody`）を含められます。
  - 安全な編集: エントリ追加には `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - provider スコープの configure/onboarding フローは、選択した provider モデルをこの map にマージし、すでに設定されている無関係な provider は保持します。
  - 直接的な OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使い、しきい値を上書きするには `params.responsesCompactThreshold` を使います。[OpenAI server-side compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルト provider パラメータ。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）が `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、その後 `agents.list[].params`（一致する agent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエストボディにマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合は extra body が優先されます。ネイティブでない completions ルートでは、その後も OpenAI 専用の `store` は除去されます。
- `embeddedHarness`: デフォルトの低レベル埋め込みエージェントランタイムポリシー。runtime を省略すると OpenClaw Pi がデフォルトになります。内蔵 PI harness を強制するには `runtime: "pi"`、登録済み Plugin harness に対応モデルの実行を任せるには `runtime: "auto"`、`codex` のような登録済み harness id を指定するには `runtime: "codex"` を使います。自動 PI フォールバックを無効にするには `fallback: "none"` を設定します。`codex` のような明示的な Plugin runtime は、同じ上書きスコープで `fallback: "pi"` を設定しない限り、デフォルトで fail closed します。モデル ref は `provider/model` の正規形式を保ってください。Codex、Claude CLI、Gemini CLI、その他の実行バックエンドは、従来の runtime provider prefix ではなく runtime 設定を通じて選択してください。provider/model 選択との違いについては [Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。
- これらのフィールドを変更する設定ライター（たとえば `/models set`、`/models set-image`、フォールバック追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたいで並列実行できる最大エージェント実行数（各セッション内は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、どの低レベル executor が埋め込みエージェントターンを実行するかを制御します。  
ほとんどのデプロイでは、デフォルトの OpenClaw Pi ランタイムのままで問題ありません。  
バンドル済みの Codex app-server harness のように、信頼できる Plugin がネイティブ harness を提供する場合に使用します。考え方については
[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`、`"pi"`、または登録済み Plugin harness id。バンドル済み Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`runtime: "auto"` では、省略時の fallback は `"pi"` なので、古い設定はどの Plugin harness も実行を引き受けない場合に引き続き PI を使えます。`runtime: "codex"` のような明示的な Plugin runtime モードでは、省略時の fallback は `"none"` なので、harness が存在しない場合は黙って PI を使うのではなく失敗します。runtime 上書きはより広いスコープから fallback を継承しません。意図的にその互換フォールバックを使いたい場合は、明示的な runtime と一緒に `fallback: "pi"` を設定してください。選択された Plugin harness の失敗は常にそのまま表面化します。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きし、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` はそのプロセスの fallback を上書きします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"` と `embeddedHarness.runtime: "codex"` を設定します。可読性のために `embeddedHarness.fallback: "none"` を明示的に設定してもかまいません。これは明示的な Plugin runtime のデフォルトです。
- harness の選択は、最初の埋め込み実行後に session id ごとに固定されます。config/env の変更が反映されるのは、新しいセッションまたは reset 後のセッションであり、既存の transcript には反映されません。transcript 履歴はあるが固定情報が記録されていないレガシーセッションは、PI 固定として扱われます。`/status` は有効な runtime を報告します。たとえば `Runtime: OpenClaw Pi Default` や `Runtime: OpenAI Codex` です。
- これは埋め込み chat harness のみを制御します。media generation、vision、PDF、music、video、TTS は引き続きそれぞれの provider/model 設定を使用します。

**組み込み alias ショートハンド**（モデルが `agents.defaults.models` 内にある場合にのみ適用）:

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` または設定済み Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

設定済み alias は常にデフォルトより優先されます。

Z.AI の GLM-4.x モデルでは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking モードが有効になります。  
Z.AI モデルでは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` が有効になります。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。  
Anthropic Claude 4.6 モデルでは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking になります。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行（ツール呼び出しなし）向けの任意の CLI バックエンドです。API provider が失敗したときのバックアップとして有用です。

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
          // CLI がプロンプトファイルフラグを受け付ける場合は、代わりに systemPromptFileArg を使用します。
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
- `sessionArg` が設定されている場合、セッションをサポートします。
- `imageArg` がファイルパスを受け付ける場合、画像パススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）に設定します。エージェントごとの値が優先され、空文字または空白のみの値は無視されます。制御されたプロンプト実験に有用です。

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

モデルファミリーごとに適用される、provider 非依存のプロンプトオーバーレイです。GPT-5 ファミリーの model id は、provider をまたいで共有の動作契約を受け取ります。`personality` はフレンドリーな対話スタイル層のみを制御します。

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
- `"off"` はフレンドリー層のみを無効にします。タグ付けされた GPT-5 の動作契約自体は有効なままです。
- この共有設定が未設定の場合、レガシーな `plugins.entries.openai.config.personality` も引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効化
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true; false でシステムプロンプトから Heartbeat セクションを省略
        lightContext: false, // デフォルト: false; true で workspace bootstrap files から HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false; true で各 heartbeat を新規セッションで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
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

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key auth）または `1h`（OAuth auth）。無効にするには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、bootstrap context への `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告 payload を抑制します。
- `timeoutSeconds`: 中止される前に Heartbeat のエージェントターンに許可される最大秒数。未設定の場合は `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct-target 配信を許可します。`block` は direct-target 配信を抑止し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、Heartbeat 実行は軽量な bootstrap context を使用し、workspace bootstrap files から `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴を持たない新規セッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンへ削減します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントで `heartbeat` が定義されている場合、**そのエージェントだけ**が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行します。短い間隔にすると、より多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み compaction provider plugin の id（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のときに使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // compaction 専用の model override（任意）
        notifyUser: true, // compaction 開始時と完了時に短い通知を送る（デフォルト: false）
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
- `provider`: 登録済み compaction provider Plugin の id。設定されている場合、内蔵の LLM 要約の代わりに、その provider の `summarize()` が呼び出されます。失敗時は内蔵処理にフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 1 回の Compaction 操作に許可される最大秒数。超過すると OpenClaw が中止します。デフォルト: `900`。
- `keepRecentTokens`: 最新の transcript 末尾を verbatim で保持するための Pi cut-point 予算。手動 `/compact` は、これが明示設定されている場合はこれを尊重します。そうでない場合、手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約中に内蔵の opaque identifier 保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用される、任意のカスタム identifier-preservation テキスト。
- `qualityGuard`: safeguard 要約に対する、不正な出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定、または明示的にそのデフォルトペアに設定されている場合は、レガシーフォールバックとして古い `Every Session` / `Safety` 見出しも受け入れます。
- `model`: Compaction 要約専用の任意の `provider/model-id` 上書き。メインセッションは 1 つのモデルを維持しつつ、Compaction 要約は別モデルで実行したい場合に使用します。未設定の場合、Compaction はセッションの primary モデルを使用します。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時にユーザーへ短い通知を送ります（たとえば「Compacting context...」「Compaction complete」）。Compaction を無音に保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction の前に durable memories を保存するサイレントなエージェントターン。workspace が read-only の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM へ送信する前に、インメモリコンテキストから**古いツール結果**を剪定します。ディスク上のセッション履歴は**変更しません**。

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

- `mode: "cache-ttl"` で剪定パスを有効にします。
- `ttl` は、最後のキャッシュタッチ後に再度剪定を実行できる頻度を制御します。
- 剪定では、まず大きすぎるツール結果を soft-trim し、その後必要に応じて古いツール結果を hard-clear します。

**Soft-trim** は先頭と末尾を保持し、中央に `...` を挿入します。

**Hard-clear** は、ツール結果全体をプレースホルダーに置き換えます。

注意:

- 画像ブロックは trim/clear されません。
- 比率は文字数ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` 未満の assistant メッセージしか存在しない場合、剪定はスキップされます。

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

- Telegram 以外のチャネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
- チャネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800–2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

動作とチャンク詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### 入力中インジケーター

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

- デフォルト: direct chat/mention では `instant`、メンションされていない group chat では `message`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント向けの任意の sandboxing です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
          // SecretRef / インライン内容もサポート:
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

<Accordion title="サンドボックス詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移ります。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH target
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとの workspace に使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH の host-key ポリシーノブ

**SSH auth の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef ベースの `*Data` 値は、sandbox セッション開始前にアクティブな secrets runtime snapshot から解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、一度だけリモート workspace をシードする
- その後、リモート SSH workspace を正とする
- `exec`、file tools、および media path を SSH 経由でルーティングする
- リモート変更を自動的にホストへ同期しない
- sandbox browser container はサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとの sandbox workspace
- `ro`: `/workspace` に sandbox workspace、`/agent` に読み取り専用でマウントされた agent workspace
- `rw`: `/workspace` に読み書き可能でマウントされた agent workspace

**Scope:**

- `session`: セッションごとの container + workspace
- `agent`: エージェントごとに 1 つの container + workspace（デフォルト）
- `shared`: 共有 container と workspace（セッション間の分離なし）

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
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意の OpenShell policy id
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell モード:**

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期し戻す。ローカル workspace が正のまま
- `remote`: sandbox 作成時に一度だけリモートへシードし、その後はリモート workspace を正とする

`remote` モードでは、OpenClaw 外で行われたホストローカル編集は、シード後に自動で sandbox へ同期されません。  
トランスポートは OpenShell sandbox への SSH ですが、sandbox のライフサイクルと任意の mirror sync は Plugin が管理します。

**`setupCommand`** は container 作成後に 1 回実行されます（`sh -lc` 経由）。network egress、書き込み可能な root、root ユーザーが必要です。

**Container のデフォルトは `network: "none"`** です。エージェントに外向きアクセスが必要な場合は `"bridge"`（またはカスタム bridge network）に設定してください。  
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限り
デフォルトでブロックされます（緊急用）。

**受信添付ファイル** は、アクティブな workspace の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェントごとの bind はマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: container 内の Chromium + CDP。noVNC URL がシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。  
noVNC の observer アクセスはデフォルトで VNC auth を使用し、OpenClaw は共有 URL にパスワードを露出する代わりに、短命な token URL を発行します。

- `allowHostControl: false`（デフォルト）は、sandbox 化されたセッションがホストブラウザを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge network）です。グローバル bridge 接続が明示的に必要な場合にのみ `bridge` を設定してください。
- `cdpSourceRange` は、container エッジでの CDP ingress を CIDR 範囲に制限できます（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は、追加のホストディレクトリを sandbox browser container にのみマウントします。設定されている場合（`[]` を含む）、browser container では `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、container host 向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
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
    デフォルトで有効であり、WebGL/3D 利用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが extension に依存している場合は
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトの process limit を使うには `0` を設定してください。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox`。
  - これらのデフォルトは container image のベースラインです。container デフォルトを変更するには、
    カスタム entrypoint を持つカスタム browser image を使用してください。

</Accordion>

browser sandboxing と `sandbox.docker.binds` は Docker 専用です。

イメージをビルド:

```bash
scripts/sandbox-setup.sh           # メイン sandbox image
scripts/sandbox-browser-setup.sh   # 任意の browser image
```

### `agents.list`（エージェントごとの上書き）

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
        thinkingDefault: "high", // エージェントごとの thinking level override
        reasoningDefault: "on", // エージェントごとの reasoning visibility override
        fastModeDefault: false, // エージェントごとの fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキーごとに上書き
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換える
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

- `id`: 安定したエージェント id（必須）。
- `default`: 複数設定されている場合は最初のものが優先されます（警告ログあり）。1 つも設定されていない場合は、list の最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` はグローバル fallback を無効化）。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルト fallback を継承します。
- `params`: `agents.defaults.models` 内の選択されたモデルエントリにマージされる、エージェントごとの stream params。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有上書きに使用してください。
- `skills`: 任意のエージェントごとの Skills 許可リスト。省略時は、設定されていれば `agents.defaults.skills` を継承します。明示的な list は defaults をマージせず置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト thinking level（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとまたはセッションごとの上書きがない場合、このエージェントに対して `agents.defaults.thinkingDefault` を上書きします。選択された provider/model profile によって、有効な値は制御されます。Google Gemini では、`adaptive` は provider 管理の動的 thinking を維持します（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェントごとのデフォルト reasoning visibility（`on | off | stream`）。メッセージごとまたはセッションごとの reasoning 上書きがない場合に適用されます。
- `fastModeDefault`: 任意のエージェントごとの fast mode デフォルト（`true | false`）。メッセージごとまたはセッションごとの fast-mode 上書きがない場合に適用されます。
- `embeddedHarness`: 任意のエージェントごとの低レベル harness policy override。あるエージェントだけを Codex 専用にし、他のエージェントは `auto` モードでデフォルトの PI fallback を維持したい場合は `{ runtime: "codex" }` を使用します。
- `runtime`: 任意のエージェントごとの runtime descriptor。エージェントがデフォルトで ACP harness session を使用すべき場合は、`type: "acp"` と `runtime.acp` の defaults（`agent`、`backend`、`mode`、`cwd`）を使用します。
- `identity.avatar`: workspace 相対パス、`http(s)` URL、または `data:` URI。
- `identity` は defaults を導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用のエージェント id 許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。
- Sandbox 継承ガード: 要求元セッションが sandbox 化されている場合、`sessions_spawn` は sandbox なしで実行される target を拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的な profile 選択を強制。デフォルト: false）。

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

- `type`（任意）: 通常のルーティングは `route`（type がない場合も route）、永続 ACP conversation binding は `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意の account、省略 = デフォルト account）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各 tier 内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は正確な conversation identity（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding tier 順序は使用しません。

### エージェントごとのアクセスプロファイル

<Accordion title="フルアクセス（sandbox なし）">

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

<Accordion title="読み取り専用ツール + workspace">

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
    parentForkMaxTokens: 100000, // これを超えるトークン数の親スレッド fork をスキップ（0 で無効）
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
      idleHours: 24, // デフォルトの非アクティブ自動 unfocus 時間（時間単位、`0` で無効）
      maxAgeHours: 0, // デフォルトのハード最大経過時間（時間単位、`0` で無効）
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

- **`scope`**: group chat コンテキストに対する基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: 各送信者は、チャネルコンテキスト内で分離されたセッションを持ちます。
  - `global`: チャネルコンテキスト内のすべての参加者が 1 つのセッションを共有します（共有コンテキストが意図されている場合のみ使用）。
- **`dmScope`**: DM をどのようにグループ化するか。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 id ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（マルチユーザー inbox に推奨）。
  - `per-account-channel-peer`: account + channel + sender ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: チャネル横断のセッション共有のために、正規 id を provider prefix 付き peer にマップします。
- **`reset`**: 主要な reset ポリシー。`daily` はローカル時刻の `atHour` に reset し、`idle` は `idleMinutes` 後に reset します。両方が設定されている場合は、先に期限切れになる方が優先されます。
- **`resetByType`**: タイプごとの override（`direct`、`group`、`thread`）。レガシーな `dm` は `direct` の alias として受け付けます。
- **`parentForkMaxTokens`**: fork された thread session を作成するときに許可される、親 session の `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親 transcript 履歴を継承する代わりに、新しい thread session を開始します。
  - このガードを無効にして常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの direct-chat バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取り中に許可される、エージェント間の返信往復ターン数の最大値（整数、範囲: `0`–`5`）。`0` は ping-pong chaining を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシー alias `dm` を含む）、`keyPrefix`、または `rawKeyPrefix` で一致します。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたときにローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive の保持期間。デフォルトは `pruneAfter`。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意の sessions-directory ディスク予算。`warn` モードでは警告をログし、`enforce` モードでは最も古い artifact/session から削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: thread-bound session 機能のグローバル defaults。
  - `enabled`: マスター default switch（provider 側で override 可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: デフォルトの非アクティブ自動 unfocus 時間（時間単位、`0` で無効。provider 側で override 可能）
  - `maxAgeHours`: デフォルトのハード最大経過時間（時間単位、`0` で無効。provider 側で override 可能）

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
      debounceMs: 2000, // 0 で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/account ごとの override: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: account → channel → global。`""` は無効化してカスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 名            | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking level  | `high`、`low`、`off`        |
| `{identity.name}` | エージェントの identity 名 | （`"auto"` と同じ）     |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の alias です。

### Ack reaction

- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャネルごとの override: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identity fallback。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram では返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status reaction を有効にします。  
  Slack と Discord では、未設定の場合、ack reaction が有効なら status reaction も有効のままです。  
  Telegram では、ライフサイクル status reaction を有効にするには明示的に `true` に設定してください。

### Inbound debounce

同じ送信者からの急速なテキストのみのメッセージを、1 回のエージェントターンにまとめます。media/attachments は即座にフラッシュされます。制御コマンドは debouncing をバイパスします。

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は、自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API key は `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- バンドル済みの speech provider は Plugin 管理です。`plugins.allow` が設定されている場合、使用したい各 TTS provider Plugin を含めてください。たとえば Edge TTS には `microsoft` です。レガシーな `edge` provider id は `microsoft` の alias として受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS endpoint を上書きします。解決順序は config、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が非 OpenAI endpoint を指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、model/voice 検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android）の defaults。

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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` は、複数の Talk provider が設定されている場合、`talk.providers` 内のキーと一致している必要があります。
- レガシーなフラット Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` へのフォールバックは、Talk API key が設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでフレンドリーな名前を使えます。
- `providers.mlx.modelId` は、macOS のローカル MLX ヘルパーが使用する Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生は、存在する場合はバンドル済みの `openclaw-mlx-tts` ヘルパーを通じて、そうでなければ `PATH` 上の実行ファイルを通じて実行されます。`OPENCLAW_MLX_TTS_BIN` は、開発用にヘルパーパスを上書きします。
- `silenceTimeoutMs` は、Talk モードがユーザーの無音後に transcript を送信するまで待機する時間を制御します。未設定の場合はプラットフォームデフォルトの待機ウィンドウを維持します（macOS と Android では `700 ms`、iOS では `900 ms`）。

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [Configuration](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [Configuration examples](/ja-JP/gateway/configuration-examples)
